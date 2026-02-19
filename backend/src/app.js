import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Importar rutas (tuyas)
import authRoutes from './routes/authRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import eventRoutes from './routes/eventsRoutes.js'; 
import newsRoutes from './routes/newsRoutes.js'; 
import otpRoutes from './routes/otpRoutes.js'
import userRoutes from './routes/usersRoutes.js';
import conceptsRoutes from './routes/conceptsRoutes.js'
import addPaymentsRoutes from './routes/addPaymentRoutes.js'
import scannerQRRoutes from './routes/scanQRRoutes.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const isDev = process.env.NODE_ENV === 'development';

// Middlewares básicos
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger (solo en desarrollo)
if (isDev) {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  });
});

// API Root
app.get('/', (req, res) => {
  res.json({
    message: 'API de Colonia App',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      users: '/api/usuarios',
      events: '/api/eventos',
      news: '/api/noticias',
      balance: '/api/balance',
      otp: '/api/otp',
      concepts: '/api/conceptos',
      payments: '/api/pagos',
      attendance: '/api/asistencias'
    },
    timestamp: new Date().toISOString()
  });
});

// Registrar rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/eventos', eventRoutes); 
app.use('/api/noticias', newsRoutes); 
app.use('/api/otp', otpRoutes);
app.use('/api/conceptos', conceptsRoutes);
app.use('/api/pagos', addPaymentsRoutes);
app.use('/api/asistencias', scannerQRRoutes);

// 404 para rutas API no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta API no encontrada: ${req.originalUrl}`
  });
});

// 404 general
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Middleware de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(isDev && { stack: err.stack, error: err })
  });
});

// Iniciar servidor
async function startServer() {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    app.listen(PORT, HOST, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Servidor corriendo:`);
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   Red:     http://${HOST}:${PORT}`);
      console.log(`   IP fija: http://54.227.139.118:${PORT}`);
      console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   DB:      ${process.env.DB_NAME} (conectada)`);
      console.log('='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();