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
        ON c.id = p.concepto_id AND p.usuario_id = ?
      WHERE c.activo = TRUE
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `, [usuarioId])

    const pagosConParcialidades = await Promise.all(conceptos.map(async (c) => {
      const [parcialidades] = await pool.query(`
        SELECT id, parcialidad AS numero, monto, estado, metodo_pago, referencia, fecha_pago
        FROM pagos
        WHERE usuario_id = ? AND concepto_id = ?
        ORDER BY parcialidad ASC
      `, [usuarioId, c.id])

      return {
        ...c,
        parcialidades
      }
    }))

    res.json(pagosConParcialidades)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener pagos' })
  }
})

/**
 * POST /api/admin/pagos/registrar
 * Registrar un pago (total o parcialidad)
 */
router.post('/registrar', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { usuario_id, concepto_id, monto, metodo_pago, referencia } = req.body
    if (!usuario_id || !concepto_id || !monto) {
      return res.status(400).json({ message: 'Datos incompletos' })
    }

    const [[concepto]] = await pool.query(`
      SELECT tipo, total, mensualidades
      FROM conceptos_pago
      WHERE id = ?
    `, [concepto_id])

    if (!concepto) return res.status(404).json({ message: 'Concepto no encontrado' })

    const [[ultimoPago]] = await pool.query(`
      SELECT MAX(parcialidad) AS ultima
      FROM pagos
      WHERE usuario_id = ? AND concepto_id = ?
    `, [usuario_id, concepto_id])

    let siguienteParcialidad = 1
    if (concepto.tipo === 'parcial' && ultimoPago?.ultima) {
      siguienteParcialidad = ultimoPago.ultima + 1
    }

    let estado = 'pagado'
    if (concepto.tipo === 'parcial' && siguienteParcialidad < concepto.mensualidades) {
      estado = 'pendiente'
    }

    const [result] = await pool.query(`
      INSERT INTO pagos 
      (usuario_id, concepto_id, monto, parcialidad, estado, metodo_pago, referencia)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [usuario_id, concepto_id, monto, siguienteParcialidad, estado, metodo_pago || 'efectivo', referencia || null])

    res.status(201).json({
      message: 'Pago registrado',
      id: result.insertId,
      parcialidad: siguienteParcialidad,
      estado
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al registrar pago' })
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

    const [result] = await pool.query(`
      UPDATE pagos
      SET monto = ?, metodo_pago = ?, referencia = ?
      WHERE id = ?
    `, [monto, metodo_pago, referencia, id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' })
    }

    res.json({ message: 'Pago actualizado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al actualizar pago' })
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
