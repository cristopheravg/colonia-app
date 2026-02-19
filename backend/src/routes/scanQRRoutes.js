import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { qr, evento_id } = req.body;

    if (!qr || !evento_id) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    // 🔥 EXTRAER usuario_id
    const partes = qr.split('-');

    if (partes.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'QR inválido'
      });
    }

    const usuario_id = parseInt(partes[1]);

    // 🔥 VALIDAR usuario activo
    const [usuarios] = await pool.query(
      `SELECT id, nombre 
       FROM usuarios 
       WHERE id = ? AND activo = 1`,
      [usuario_id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no válido'
      });
    }

    const usuario = usuarios[0];

    // 🔥 INSERT asistencia
    await pool.query(
      `INSERT INTO asistencias 
       (usuario_id, evento_id, presente, fecha_asistencia)
       VALUES (?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE
       presente = 1,
       fecha_asistencia = NOW()`,
      [usuario_id, evento_id]
    );

    res.json({
      success: true,
      message: `Asistencia registrada: ${usuario.nombre}`
    });

  } catch (error) {
    console.error('ERROR ASISTENCIAS:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno'
    });
  }
});

export default router;
  