import express from 'express'
import { pool } from '../config/database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/noticias
 * Vecinos → todas las noticias ordenadas por fecha desc
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, contenido, destacada, fecha_publicacion
       FROM noticias
       ORDER BY fecha_publicacion DESC`
    )

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al obtener noticias' })
  }
})

/**
 * POST /api/noticias
 * Solo admin
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { titulo, contenido, destacada } = req.body

    const [result] = await pool.query(
      `INSERT INTO noticias (titulo, contenido, destacada, usuario_id)
       VALUES (?, ?, ?, ?)`,
      [titulo, contenido, destacada || false, req.user.id]
    )

    res.status(201).json({
      success: true,
      message: 'Noticia creada',
      id: result.insertId
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al crear noticia' })
  }
})

/**
 * PUT /api/noticias/:id
 * Solo admin
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, contenido, destacada } = req.body

    const [result] = await pool.query(
      `UPDATE noticias 
       SET titulo = ?, contenido = ?, destacada = ?
       WHERE id = ?`,
      [titulo, contenido, destacada, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Noticia no encontrada' })
    }

    res.json({ success: true, message: 'Noticia actualizada' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al actualizar noticia' })
  }
})

/**
 * DELETE /api/noticias/:id
 * Solo admin
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const [result] = await pool.query(
      `DELETE FROM noticias WHERE id = ?`,
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Noticia no encontrada' })
    }

    res.json({ success: true, message: 'Noticia eliminada' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al eliminar noticia' })
  }
})

export default router
