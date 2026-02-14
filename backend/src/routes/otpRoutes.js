// src/routes/otp.js
import express from 'express'
import { pool } from '../config/database.js'

const router = express.Router()

// Generar OTP
router.post('/generar', async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'Falta userId' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString() // 6 dígitos
    const expiresAt = new Date(Date.now() + 60 * 1000) // 60 segundos de validez

    // Upsert: insertar o actualizar si ya existe
    await pool.query(
      `INSERT INTO otps (userId, otp, expiresAt)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), expiresAt = VALUES(expiresAt)`,
      [userId, otp, expiresAt]
    )

    res.json({ otp, expiresAt })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error generando OTP' })
  }
})

// Validar OTP
router.post('/validar', async (req, res) => {
  try {
    const { userId, otp } = req.body
    if (!userId || !otp) return res.status(400).json({ error: 'Faltan parámetros' })

    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE userId = ? AND otp = ?',
      [userId, otp]
    )

    if (rows.length === 0) return res.status(400).json({ valid: false, message: 'OTP incorrecto' })

    const otpData = rows[0]
    const now = new Date()
    if (now > otpData.expiresAt) {
      return res.status(400).json({ valid: false, message: 'OTP expirado' })
    }

    res.json({ valid: true, message: 'OTP válido' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error validando OTP' })
  }
})

export default router
