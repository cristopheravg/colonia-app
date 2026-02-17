    import express from 'express';
    //import { getConnection } from '../config/database.js';
    //import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
    import { pool } from '../config/database.js';
    import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

    const router = express.Router();

    /**
     * GET /api/events
     * Vecinos → solo eventos activos
     */
    router.get('/', authMiddleware, async (req, res) => {
    try {
        //const connection = await getConnection();
        const [rows] = await pool.query(
        `SELECT id, nombre, descripcion, fecha_inicio, fecha_fin, lugar, max_asistentes
        FROM eventos
        WHERE activo = TRUE
        ORDER BY fecha_inicio DESC`
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener eventos' });
    }
    });

    /**
     * POST /api/events
     * Solo admin
     */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let { nombre, descripcion, fecha_inicio, fecha_fin, lugar, max_asistentes } = req.body;

    console.log('BODY RECIBIDO:', req.body);

    // 🔥 Limpiar datos vacíos
    fecha_fin = fecha_fin === '' ? null : fecha_fin;
    lugar = lugar === '' ? null : lugar;
    max_asistentes = max_asistentes || 0;

    // Validación básica
    if (!nombre || !fecha_inicio) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y fecha de inicio son obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO eventos 
      (nombre, descripcion, fecha_inicio, fecha_fin, lugar, max_asistentes)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion, fecha_inicio, fecha_fin, lugar, max_asistentes]
    );

    res.status(201).json({
      success: true,
      message: 'Evento creado',
      id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear evento' });
  }
});




    /**
     * PUT /api/eventos/:id
     * Solo admin
     */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre, descripcion, fecha_inicio, fecha_fin, lugar, max_asistentes } = req.body;

    // 🔥 Limpiar datos
    fecha_fin = fecha_fin === '' ? null : fecha_fin;
    lugar = lugar === '' ? null : lugar;
    max_asistentes = max_asistentes || 0;

    const [result] = await pool.query(
      `UPDATE eventos 
       SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, lugar = ?, max_asistentes = ?
       WHERE id = ?`,
      [nombre, descripcion, fecha_inicio, fecha_fin, lugar, max_asistentes, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    res.json({ success: true, message: 'Evento actualizado' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar evento' });
  }
});




    /**
     * DELETE /api/eventos/:id
     * Solo admin
     */
    router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params

        const [result] = await pool.query(
        `UPDATE eventos SET activo = FALSE WHERE id = ?`,
        [id]
        )

        if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Evento no encontrado' })
        }

        res.json({ success: true, message: 'Evento eliminado' })

    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Error al eliminar evento' })
    }
    })



    export default router;
