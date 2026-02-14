import express from 'express'
import { pool } from '../config/database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/admin/conceptos
 * Lista todos los conceptos
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre,
        descripcion,
        tipo,
        total,
        mensualidades,
        activo,
        fecha_limite,
        created_at
      FROM conceptos_pago
      ORDER BY created_at DESC
    `)

    res.json(rows)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener conceptos' })
  }
})


/**
 * POST /api/admin/conceptos
 * Crear concepto
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const { nombre, tipo, total, mensualidades } = req.body

    if (!nombre || !tipo || !total) {
      return res.status(400).json({ message: 'Datos incompletos' })
    }

    const mensualidadesFinal =
      tipo === 'unico' ? 1 : (mensualidades || 1)

    const [result] = await pool.query(`
      INSERT INTO conceptos_pago
      (nombre, tipo, total, mensualidades, activo)
      VALUES (?, ?, ?, ?, true)
    `, [nombre, tipo, total, mensualidadesFinal])

    res.status(201).json({
      message: 'Concepto creado',
      id: result.insertId
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al crear concepto' })
  }
})


/**
 * PUT /api/admin/conceptos/:id
 * Actualizar concepto
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const { id } = req.params
    const { nombre, tipo, total, mensualidades } = req.body

    const mensualidadesFinal =
      tipo === 'unico' ? 1 : (mensualidades || 1)

    const [result] = await pool.query(`
      UPDATE conceptos_pago
      SET nombre = ?, tipo = ?, total = ?, mensualidades = ?
      WHERE id = ?
    `, [nombre, tipo, total, mensualidadesFinal, id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Concepto no encontrado' })
    }

    res.json({ message: 'Concepto actualizado' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al actualizar concepto' })
  }
})


/**
 * PATCH /api/admin/conceptos/:id/estado
 * Activar / Desactivar concepto
 */
router.patch('/:id/estado', authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const { id } = req.params

    const [[concepto]] = await pool.query(`
      SELECT activo FROM conceptos_pago WHERE id = ?
    `, [id])

    if (!concepto) {
      return res.status(404).json({ message: 'Concepto no encontrado' })
    }

    const nuevoEstado = !concepto.activo

    await pool.query(`
      UPDATE conceptos_pago
      SET activo = ?
      WHERE id = ?
    `, [nuevoEstado, id])

    res.json({ message: 'Estado actualizado', activo: nuevoEstado })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al cambiar estado' })
  }
})

export default router
