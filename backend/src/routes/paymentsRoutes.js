import express from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/balance', paymentController.getBalance);
router.get('/history', paymentController.getHistory);
router.get('/concepts', paymentController.getConcepts);
router.post('/', paymentController.createPayment);

export default router;
