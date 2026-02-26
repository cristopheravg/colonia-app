// routes/notificaciones.js
const express = require('express');
const router = express.Router();

// Middleware de autenticación (asumiendo que ya lo tienes)
const authMiddleware = (req, res, next) => {
  // Tu lógica de autenticación existente
  // Debe poner req.user = { id: userId }
  next();
};

// Registrar o actualizar token de dispositivo
router.post('/registrar-token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    const usuario_id = req.user.id;
    
    // Obtener información del dispositivo
    const userAgent = req.headers['user-agent'] || '';
    const plataforma = detectarPlataforma(userAgent);
    const dispositivo_nombre = obtenerNombreDispositivo(userAgent);
    
    // Verificar si el token ya existe para este usuario
    const [existing] = await db.query(
      'SELECT id FROM usuario_dispositivos WHERE usuario_id = ? AND fcm_token = ?',
      [usuario_id, token]
    );
    
    if (existing.length > 0) {
      // Actualizar último uso
      await db.query(
        `UPDATE usuario_dispositivos 
         SET ultimo_uso = NOW(), user_agent = ?, activo = 1 
         WHERE id = ?`,
        [userAgent, existing[0].id]
      );
    } else {
      // Insertar nuevo dispositivo
      await db.query(
        `INSERT INTO usuario_dispositivos 
         (usuario_id, fcm_token, dispositivo_nombre, plataforma, user_agent, ultimo_uso) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [usuario_id, token, dispositivo_nombre, plataforma, userAgent]
      );
    }
    
    // Opcional: Desactivar tokens viejos del mismo dispositivo?
    // await desactivarTokensAntiguos(usuario_id, plataforma);
    
    res.json({ 
      success: true, 
      message: 'Token registrado correctamente' 
    });
    
  } catch (error) {
    console.error('Error registrando token:', error);
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

// Endpoint para obtener dispositivos del usuario
router.get('/dispositivos', authMiddleware, async (req, res) => {
  try {
    const [dispositivos] = await db.query(
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
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para desactivar un dispositivo
router.delete('/dispositivos/:id', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'UPDATE usuario_dispositivos SET activo = 0 WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Dispositivo desactivado' 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar notificación a un usuario específico
router.post('/enviar/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { titulo, cuerpo, datos } = req.body;
    
    // Obtener todos los tokens activos del usuario
    const [tokens] = await db.query(
      'SELECT fcm_token FROM usuario_dispositivos WHERE usuario_id = ? AND activo = 1',
      [usuarioId]
    );
    
    if (tokens.length === 0) {
      return res.status(404).json({ error: 'Usuario no tiene dispositivos activos' });
    }
    
    // Aquí iría la lógica para enviar via FCM
    const resultados = await enviarNotificacionFCM(tokens.map(t => t.fcm_token), {
      title: titulo,
      body: cuerpo,
      data: datos
    });
    
    res.json({ 
      success: true, 
      enviados: resultados.successCount,
      fallidos: resultados.failureCount 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;