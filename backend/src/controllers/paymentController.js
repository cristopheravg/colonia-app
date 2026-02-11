import { Payment } from '../models/Payment.js';

export const paymentController = {
  // Obtener estado de cuenta del usuario
  async getBalance(req, res) {
    try {
      const userId = req.user.id;
      
      const balance = await Payment.getBalance(userId);
      
      res.json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('Error obteniendo balance:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estado de cuenta'
      });
    }
  },

  // Obtener historial de pagos
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      
      const history = await Payment.getHistory(userId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo historial de pagos'
      });
    }
  },

  // Obtener conceptos de pago
  async getConcepts(req, res) {
    try {
      const concepts = await Payment.getConcepts();
      
      res.json({
        success: true,
        data: concepts
      });
    } catch (error) {
      console.error('Error obteniendo conceptos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo conceptos de pago'
      });
    }
  },

  // Registrar un pago
  async createPayment(req, res) {
    try {
      const userId = req.user.id;
      const { concepto_id, monto, parcialidad, metodo_pago, referencia } = req.body;
      
      // Validar datos
      if (!concepto_id || !monto) {
        return res.status(400).json({
          success: false,
          message: 'Concepto y monto son requeridos'
        });
      }
      
      const paymentData = {
        usuario_id: userId,
        concepto_id,
        monto: parseFloat(monto),
        parcialidad: parcialidad || 1,
        metodo_pago: metodo_pago || 'efectivo',
        referencia: referencia || null
      };
      
      const newPayment = await Payment.create(paymentData);
      
      res.status(201).json({
        success: true,
        message: 'Pago registrado exitosamente',
        data: newPayment
      });
    } catch (error) {
      console.error('Error registrando pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error registrando el pago'
      });
    }
  }
};
