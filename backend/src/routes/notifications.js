// routes/notificaciones.js
import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Registrar o actualizar token de dispositivo
router.post('/registrar-token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    const usuario_id = req.user.id;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token requerido' 
      });
    }
    
    // Obtener información del dispositivo
    const userAgent = req.headers['user-agent'] || '';
    const plataforma = detectarPlataforma(userAgent);
    const dispositivo_nombre = obtenerNombreDispositivo(userAgent);
    
    // Verificar si el token ya existe para este usuario
    const [existing] = await pool.query(
      'SELECT id FROM usuario_dispositivos WHERE usuario_id = ? AND fcm_token = ?',
      [usuario_id, token]
    );
    
    if (existing.length > 0) {
      // Actualizar último uso
      await pool.query(
        `UPDATE usuario_dispositivos 
         SET ultimo_uso = NOW(), user_agent = ?, activo = 1 
         WHERE id = ?`,
        [userAgent, existing[0].id]
      );
      
      console.log(`✅ Token actualizado para usuario ${usuario_id}`);
    } else {
      // Insertar nuevo dispositivo
      await pool.query(
        `INSERT INTO usuario_dispositivos 
         (usuario_id, fcm_token, dispositivo_nombre, plataforma, user_agent, ultimo_uso) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [usuario_id, token, dispositivo_nombre, plataforma, userAgent]
      );
      
      console.log(`✅ Nuevo token registrado para usuario ${usuario_id}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Token registrado correctamente' 
    });
    
  } catch (error) {
    console.error('❌ Error registrando token:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint para obtener dispositivos del usuario
router.get('/dispositivos', authMiddleware, async (req, res) => {
  try {
    const [dispositivos] = await pool.query(
      `SELECT id, fcm_token, dispositivo_nombre, plataforma, activo, ultimo_uso, created_at 
       FROM usuario_dispositivos 
       WHERE usuario_id = ? AND activo = 1
       ORDER BY ultimo_uso DESC`,
      [req.user.id]
    );
    
    res.json({ 
      success: true, 
      dispositivos 
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo dispositivos:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint para desactivar un dispositivo
router.delete('/dispositivos/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE usuario_dispositivos SET activo = 0 WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Dispositivo no encontrado' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Dispositivo desactivado' 
    });
    
  } catch (error) {
    console.error('❌ Error desactivando dispositivo:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint para enviar notificación a un usuario específico
router.post('/enviar/:usuarioId', authMiddleware, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { titulo, cuerpo, datos = {} } = req.body;
    
    // Validar datos requeridos
    if (!titulo || !cuerpo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Título y cuerpo son requeridos' 
      });
    }
    
    // Obtener todos los tokens activos del usuario
    const [tokens] = await pool.query(
      'SELECT fcm_token FROM usuario_dispositivos WHERE usuario_id = ? AND activo = 1',
      [usuarioId]
    );
    
    if (tokens.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no tiene dispositivos activos' 
      });
    }
    
    // Aquí iría la lógica para enviar via FCM
    // Por ahora solo simulamos el envío
    console.log('📨 Enviando notificación:', {
      usuarioId,
      titulo,
      cuerpo,
      tokens: tokens.map(t => t.fcm_token.substring(0, 20) + '...')
    });
    
    res.json({ 
      success: true, 
      message: 'Notificación enviada correctamente',
      dispositivos: tokens.length,
      tokens: tokens.map(t => t.fcm_token.substring(0, 20) + '...')
    });
    
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Función para detectar plataforma
function detectarPlataforma(userAgent) {
  if (!userAgent) return 'web';
  if (userAgent.includes('Android')) return 'android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'ios';
  return 'web';
}

// Función para obtener nombre del dispositivo
function obtenerNombreDispositivo(userAgent) {
  if (!userAgent) return 'Desconocido';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  
  return 'Dispositivo Web';
}


// routes/notificaciones.js - Agrega este endpoint especial para móvil

// Endpoint para móvil con más logs y manejo especial
router.post('/registrar-token-movil', async (req, res) => {
  console.log('📱 PETICIÓN MÓVIL RECIBIDA ==========');
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('IP:', req.ip);
  
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token requerido' 
      });
    }
    
    // Buscar usuario por algún método (quizás por token de auth)
    // Por ahora solo respondemos OK para prueba
    res.json({ 
      success: true, 
      message: 'Token recibido en móvil',
      token_recibido: token.substring(0, 20) + '...'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});


export default router;