import express from 'express';
import { balanceController } from '../controllers/balanceController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', balanceController.getBalance);
router.get('/historial', balanceController.getHistory);
router.get('/conceptos', balanceController.getConcepts);
//router.post('/', paymentController.createPayment);

export default router;
