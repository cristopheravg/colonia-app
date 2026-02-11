import { pool } from '../config/database.js';

export const Payment = {
  // Obtener estado de cuenta de un usuario
  async getBalance(userId) {
    try {
      // Usar la vista que creamos en el script SQL
      const [rows] = await pool.execute(
        `SELECT * FROM vista_estado_cuenta WHERE usuario_id = ?`,
        [userId]
      );
      
      // Calcular totales
      const totalPagado = rows.reduce((sum, item) => sum + parseFloat(item.total_pagado || 0), 0);
      const totalPendiente = rows.reduce((sum, item) => sum + parseFloat(item.saldo_pendiente || 0), 0);
      const totalConceptos = rows.reduce((sum, item) => sum + parseFloat(item.total_concepto || 0), 0);
      
      return {
        detalle: rows,
        resumen: {
          totalPagado,
          totalPendiente,
          totalConceptos,
          conceptosActivos: rows.length
        }
      };
    } catch (error) {
      console.error('Error en getBalance:', error);
      throw error;
    }
  },

  // Obtener historial de pagos de un usuario
  async getHistory(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          p.id,
          p.monto,
          p.fecha_pago,
          p.parcialidad,
          p.estado,
          p.metodo_pago,
          p.referencia,
          cp.nombre as concepto,
          cp.tipo as tipo_concepto
        FROM pagos p
        JOIN conceptos_pago cp ON p.concepto_id = cp.id
        WHERE p.usuario_id = ?
        ORDER BY p.fecha_pago DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('Error en getHistory:', error);
      throw error;
    }
  },

  // Registrar un pago
  async create(paymentData) {
    try {
      const { usuario_id, concepto_id, monto, parcialidad = 1, metodo_pago = 'efectivo', referencia } = paymentData;
      
      const [result] = await pool.execute(
        `INSERT INTO pagos (usuario_id, concepto_id, monto, parcialidad, metodo_pago, referencia, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'pagado')`,
        [usuario_id, concepto_id, monto, parcialidad, metodo_pago, referencia]
      );
      
      return { id: result.insertId, ...paymentData, estado: 'pagado' };
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  },

  // Obtener conceptos de pago activos
  async getConcepts() {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM conceptos_pago WHERE activo = TRUE ORDER BY nombre`
      );
      return rows;
    } catch (error) {
      console.error('Error en getConcepts:', error);
      throw error;
    }
  }
};
