import express from 'express'
import { pool } from '../config/database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET /api/admin/usuarios
router.get('/usuarios', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, apellidos
      FROM usuarios
      ORDER BY nombre ASC
    `)
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener usuarios' })
  }
})

/**
 * GET /api/admin/pagos/usuario/:usuarioId
 * Listar todos los pagos de un usuario con parcialidades
 */
router.get('/usuario/:usuarioId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { usuarioId } = req.params

    // 🔹 Validar que sea número
    const usuarioIdNum = Number(usuarioId)
    if (isNaN(usuarioIdNum) || usuarioIdNum <= 0) {
      return res.status(400).json({ message: 'ID de usuario inválido' })
    }

    // 🔹 Validar que usuario exista
    const [[usuario]] = await pool.query(
      `SELECT id FROM usuarios WHERE id = ?`,
      [usuarioIdNum]
    )

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    /**
     * 🔥 IMPORTANTE:
     * Solo sumar pagos en estado "pagado"
     * para que coincida con la vista_estado_cuenta
     */
    const [conceptos] = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        c.tipo,
        c.total,
        c.mensualidades,
        c.fecha_limite,
        IFNULL(SUM(p.monto),0) AS pagado,
        c.total - IFNULL(SUM(p.monto),0) AS pendiente
      FROM conceptos_pago c
      LEFT JOIN pagos p
        ON c.id = p.concepto_id
        AND p.usuario_id = ?
        AND p.estado = 'pagado'
      WHERE c.activo = TRUE
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `, [usuarioIdNum])

    /**
     * 🔹 Obtener parcialidades de cada concepto
     */
    const pagosConParcialidades = await Promise.all(
      conceptos.map(async (c) => {
        const [parcialidades] = await pool.query(`
          SELECT 
            id,
            parcialidad AS numero,
            monto,
            estado,
            metodo_pago,
            referencia,
            fecha_pago
          FROM pagos
          WHERE usuario_id = ?
            AND concepto_id = ?
            AND estado <> 'cancelado'
          ORDER BY parcialidad ASC
        `, [usuarioIdNum, c.id])

        return {
          ...c,
          parcialidades
        }
      })
    )

    res.json(pagosConParcialidades)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener pagos', error: error.message })
  }
})


/**
 * POST /api/admin/pagos/registrar
 * Registrar un pago (total o parcialidad)
 */
router.post('/registrar', authMiddleware, adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection()

  try {
    const { usuario_id, concepto_id, monto, metodo_pago, referencia } = req.body

    // 1️⃣ Validar datos
    if (!usuario_id || !concepto_id || monto === undefined || monto === null) {
      return res.status(400).json({ message: 'Datos incompletos' })
    }

    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a cero' })
    }

    // 2️⃣ Método de pago
    const metodosPermitidos = ['efectivo', 'transferencia', 'tarjeta']
    const metodo = metodo_pago ? metodo_pago.toLowerCase() : 'efectivo'
    if (!metodosPermitidos.includes(metodo)) {
      return res.status(400).json({ message: `Método inválido` })
    }

    await conn.beginTransaction()

    // 3️⃣ Usuario
    const [[usuario]] = await conn.query(
      `SELECT id FROM usuarios WHERE id = ? FOR UPDATE`,
      [usuario_id]
    )
    if (!usuario) {
      await conn.rollback()
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // 4️⃣ Concepto
    const [[concepto]] = await conn.query(
      `SELECT tipo, total, mensualidades FROM conceptos_pago WHERE id = ? FOR UPDATE`,
      [concepto_id]
    )
    if (!concepto) {
      await conn.rollback()
      return res.status(404).json({ message: 'Concepto no encontrado' })
    }

    // 5️⃣ Total pagado
    const [[totalPagado]] = await conn.query(
      `SELECT IFNULL(SUM(monto),0) AS pagado 
       FROM pagos 
       WHERE usuario_id = ? AND concepto_id = ? FOR UPDATE`,
      [usuario_id, concepto_id]
    )

    const restante = concepto.total - totalPagado.pagado
    if (restante <= 0) {
      await conn.rollback()
      return res.status(400).json({ message: 'El concepto ya está pagado' })
    }

    // 🔥 VALIDACIONES SEGÚN TIPO
    if (concepto.tipo === 'unico') {
      if (montoNum !== restante) {
        await conn.rollback()
        return res.status(400).json({
          message: `Pago único: debe ingresar exactamente ${restante}`
        })
      }
    }

    if (concepto.tipo === 'parcial') {
      // Conteo real de pagos
      const [[conteo]] = await conn.query(
        `SELECT COUNT(*) AS total 
         FROM pagos 
         WHERE usuario_id = ? AND concepto_id = ? FOR UPDATE`,
        [usuario_id, concepto_id]
      )

      const pagosRealizados = conteo.total
      const faltan = concepto.mensualidades - pagosRealizados

      if (faltan <= 0) {
        await conn.rollback()
        return res.status(400).json({
          message: 'Todas las mensualidades ya fueron registradas'
        })
      }

      // Última mensualidad exacta
      if (faltan === 1 && montoNum !== restante) {
        await conn.rollback()
        return res.status(400).json({
          message: `Última mensualidad: debe pagar exactamente ${restante}`
        })
      }

      if (faltan > 1 && montoNum > restante) {
        await conn.rollback()
        return res.status(400).json({
          message: `Monto excede el restante (${restante})`
        })
      }
    }

    // 6️⃣ Calcular parcialidad segura
    let parcialidad = 1

    if (concepto.tipo === 'parcial') {
      const [[conteo]] = await conn.query(
        `SELECT COUNT(*) AS total 
         FROM pagos 
         WHERE usuario_id = ? AND concepto_id = ? FOR UPDATE`,
        [usuario_id, concepto_id]
      )

      parcialidad = conteo.total + 1
    }

    // 7️⃣ Estado correcto
    let estado = 'pagado'
    const restanteDespues = restante - montoNum
    //if (restanteDespues > 0) estado = 'pendiente'

    // 8️⃣ Insertar pago
    const [result] = await conn.query(`
      INSERT INTO pagos
      (usuario_id, concepto_id, monto, parcialidad, estado, metodo_pago, referencia)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      usuario_id,
      concepto_id,
      montoNum,
      parcialidad,
      estado,
      metodo,
      referencia || null
    ])

    await conn.commit()

    res.status(201).json({
      message: 'Pago registrado',
      id: result.insertId,
      parcialidad,
      estado,
      restante: restanteDespues
    })

  } catch (error) {
    await conn.rollback()
    console.error(error)
    res.status(500).json({ message: 'Error al registrar pago', error: error.message })
  } finally {
    conn.release()
  }
})





/**
 * PUT /api/admin/pagos/:id
 * Actualizar un pago (monto, método o referencia)
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { monto, metodo_pago, referencia } = req.body

    // Validar monto si se envía
    let montoNum
    if (monto !== undefined && monto !== null) {
      montoNum = parseFloat(monto)
      if (isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ message: 'El monto debe ser un número mayor a cero' })
      }
    }

    // 🔹 Validar método de pago si se envía
    if (metodo_pago) {
      const metodosPermitidos = ['efectivo', 'transferencia', 'tarjeta']
      const metodo = metodo_pago.toLowerCase()
      if (!metodosPermitidos.includes(metodo)) {
        return res.status(400).json({ message: `Método de pago inválido. Debe ser: ${metodosPermitidos.join(', ')}` })
      }
    }

    // Verificar que el pago exista
    const [[pago]] = await pool.query(`
      SELECT usuario_id, concepto_id
      FROM pagos
      WHERE id = ?
    `, [id])
    if (!pago) {
      return res.status(404).json({ message: 'Pago no encontrado' })
    }

    // Validar monto restante si se actualiza el monto
    if (montoNum !== undefined) {
      const [[totalPagado]] = await pool.query(`
        SELECT IFNULL(SUM(monto),0) AS pagado
        FROM pagos
        WHERE usuario_id = ? AND concepto_id = ? AND id <> ?
      `, [pago.usuario_id, pago.concepto_id, id])

      const [[concepto]] = await pool.query(`
        SELECT total FROM conceptos_pago WHERE id = ?
      `, [pago.concepto_id])

      const restante = concepto.total - totalPagado.pagado
      if (montoNum > restante) {
        return res.status(400).json({
          message: `El monto excede el restante disponible (${restante})`
        })
      }
    }

    // Actualizar pago
    const [result] = await pool.query(`
      UPDATE pagos
      SET monto = ?, metodo_pago = ?, referencia = ?
      WHERE id = ?
    `, [montoNum, metodo_pago, referencia, id])

    res.json({ message: 'Pago actualizado' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al actualizar pago', error: error.message })
  }
})

/**
 * PATCH /api/admin/pagos/:id/estado
 * Cambiar estado de un pago (pendiente, pagado, cancelado)
 */
router.patch('/:id/estado', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    if (!['pendiente','pagado','cancelado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' })
    }

    const [result] = await pool.query(`
      UPDATE pagos SET estado = ? WHERE id = ?
    `, [estado, id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' })
    }

    res.json({ message: 'Estado actualizado', estado })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al actualizar estado' })
  }
})

/**
 * DELETE /api/admin/pagos/:id
 * Eliminar un pago
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.query(`DELETE FROM pagos WHERE id = ?`, [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' })
    }

    res.json({ message: 'Pago eliminado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al eliminar pago' })
  }
})

export default router
