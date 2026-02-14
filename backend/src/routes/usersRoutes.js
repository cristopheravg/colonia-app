import express from 'express'
import { pool } from '../config/database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'

const router = express.Router()

/**
 * GET /api/usuarios
 * Vecinos → todos los usuarios (solo admin puede ver todos)
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, apellidos, correo, telefono, numero_vecino, rol, activo, direccion
       FROM usuarios
       ORDER BY nombre ASC`
    );
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' })
  }
})

/**
 * GET /api/usuarios/:id
 * Obtener un usuario por ID
 */
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      `SELECT id, nombre, apellidos, correo, telefono, numero_vecino, rol, activo, direccion, qr
       FROM usuarios WHERE id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
    }

    res.json({ success: true, data: rows[0] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al obtener usuario' })
  }
})


/**
 * POST /api/usuarios
 * Crear usuario → Solo admin
 */

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nombre, apellidos, correo, telefono, numero_vecino, rol, activo, password, direccion } = req.body

    // Encriptar contraseña si se proporciona
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, apellidos, correo, telefono, numero_vecino, rol, activo, password, direccion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellidos, correo, telefono, numero_vecino, rol || 'vecino', activo ?? 1, hashedPassword, direccion || '']
    )

    res.status(201).json({
      success: true,
      message: 'Usuario creado',
      data: { id: result.insertId, nombre, apellidos, correo, telefono, numero_vecino, rol, activo, direccion }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al crear usuario' })
  }
})


/**
 * PUT /api/usuarios/:id
 * Actualizar usuario → Solo admin
 */
// Ejemplo: UPDATE de usuarios sin qr ni password

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, apellidos, correo, telefono, numero_vecino, rol, activo, password, direccion } = req.body

    // Solo encriptar password si viene con valor
    let hashedPassword = null
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Campos que siempre se actualizan
    const fields = ['nombre', 'apellidos', 'correo', 'telefono', 'numero_vecino', 'rol', 'activo', 'direccion']
    const values = [nombre, apellidos, correo, telefono, numero_vecino, rol, activo, direccion || '']

    // Agregar password si hay uno nuevo
    if (hashedPassword) {
      fields.push('password')
      values.push(hashedPassword)
    }

    // Agregamos el id al final para el WHERE
    values.push(id)

    const [result] = await pool.query(
      `UPDATE usuarios SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
      values
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
    }

    res.json({ success: true, message: 'Usuario actualizado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al actualizar usuario' })
  }
})



/**
 * DELETE /api/usuarios/:id
 * Eliminar usuario → Solo admin
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const [result] = await pool.query(
      `DELETE FROM usuarios WHERE id = ?`,
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
    }

    res.json({ success: true, message: 'Usuario eliminado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' })
  }
})

export default router
