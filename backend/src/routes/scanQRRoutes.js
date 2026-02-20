import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Escanear QR y registrar asistencia
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { qr, evento_id } = req.body;

    if (!qr || !evento_id) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    // 🔥 DECODIFICAR BASE64
    let qrDecodificado;
    try {
      qrDecodificado = Buffer.from(qr, 'base64').toString('utf-8');
      console.log('🔍 QR original:', qr);
      console.log('🔍 QR decodificado:', qrDecodificado);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'QR inválido (error de codificación)'
      });
    }

    // Validar que el evento existe y está activo
    const [eventos] = await pool.query(
      `SELECT id, nombre, fecha_inicio, fecha_fin, activo 
       FROM eventos 
       WHERE id = ? AND activo = 1`,
      [evento_id]
    );

    if (eventos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no válido'
      });
    }

    const evento = eventos[0];
    
    // Validar que el evento esté dentro del rango permitido
    const ahora = new Date();
    const fechaInicioEvento = new Date(evento.fecha_inicio);
    
    let fechaFinEvento;
    if (evento.fecha_fin) {
      fechaFinEvento = new Date(evento.fecha_fin);
    } else {
      fechaFinEvento = new Date(fechaInicioEvento);
      fechaFinEvento.setHours(23, 59, 59, 999);
    }
    
    if (ahora > fechaFinEvento) {
      return res.status(400).json({
        success: false,
        message: `El evento ya ha finalizado`
      });
    }

    if (ahora < fechaInicioEvento) {
      return res.status(400).json({
        success: false,
        message: `El evento aún no ha comenzado`
      });
    }

    // Extraer usuario_id del QR DECODIFICADO
    const partes = qrDecodificado.split('-');
    if (partes.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Formato de QR inválido'
      });
    }

    const usuario_id = parseInt(partes[1]);
    if (isNaN(usuario_id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido en QR'
      });
    }

    // Validar usuario activo
    const [usuarios] = await pool.query(
      `SELECT id, nombre, apellidos, direccion, numero_vecino 
       FROM usuarios 
       WHERE id = ? AND activo = 1`,
      [usuario_id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no válido o inactivo'
      });
    }

    const usuario = usuarios[0];

    // 👇 CAMBIO AQUÍ: Usar rows en lugar de asistenciasExistentes
    const [rows] = await pool.query(
      `SELECT presente, fecha_asistencia 
       FROM asistencias 
       WHERE usuario_id = ? AND evento_id = ?`,
      [usuario_id, evento_id]
    );

    console.log('🔍 rows:', rows); // Para depurar

    let mensaje = '';
    let yaRegistrado = false;

    if (rows.length > 0) {
      if (rows[0].presente === 1) {
        mensaje = `⚠️ ${usuario.nombre} ya tiene registrada esta asistencia`;
        yaRegistrado = true;
      } else {
        mensaje = `✅ Asistencia actualizada para ${usuario.nombre}`;
      }
    } else {
      mensaje = `✅ Asistencia registrada: ${usuario.nombre}`;
    }

    // Solo insert/update si NO está ya registrado
    if (!yaRegistrado) {
      await pool.query(
        `INSERT INTO asistencias 
         (usuario_id, evento_id, presente, fecha_asistencia)
         VALUES (?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE
         presente = 1,
         fecha_asistencia = NOW()`,
        [usuario_id, evento_id]
      );
    }

    res.json({
      success: true,
      message: mensaje,
      usuario: usuario.nombre,
      evento: evento.nombre,
      yaRegistrado: yaRegistrado,
      qr_original: qr,
      qr_decodificado: qrDecodificado,
      fecha: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR ASISTENCIAS:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener asistencias de un evento
router.get('/evento/:eventoId', authMiddleware, async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [asistencias] = await pool.query(
      `SELECT a.*, u.nombre, u.apellidos, u.numero_vecino 
       FROM asistencias a
       JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.evento_id = ?
       ORDER BY a.fecha_asistencia DESC`,
      [eventoId]
    );

    res.json(asistencias);

  } catch (error) {
    console.error('ERROR OBTENER ASISTENCIAS:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verificar si un usuario ya tiene asistencia
router.get('/verificar/:usuarioId/:eventoId', authMiddleware, async (req, res) => {
  try {
    const { usuarioId, eventoId } = req.params;

    const [asistencias] = await pool.query(
      `SELECT presente, fecha_asistencia 
       FROM asistencias 
       WHERE usuario_id = ? AND evento_id = ?`,
      [usuarioId, eventoId]
    );

    res.json({
      registrada: asistencias.length > 0 && asistencias[0].presente === 1,
      asistencia: asistencias[0] || null
    });

  } catch (error) {
    console.error('ERROR VERIFICAR ASISTENCIA:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;