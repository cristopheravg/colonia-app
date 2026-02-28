import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';

// Rutas API
import authRoutes from './routes/authRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import eventRoutes from './routes/eventsRoutes.js'; 
import newsRoutes from './routes/newsRoutes.js'; 
import otpRoutes from './routes/otpRoutes.js';
import userRoutes from './routes/usersRoutes.js';
import conceptsRoutes from './routes/conceptsRoutes.js';
import addPaymentsRoutes from './routes/addPaymentRoutes.js';
import scannerQRRoutes from './routes/scanQRRoutes.js';
import notifications from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const isDev = process.env.NODE_ENV === 'development';

// =============================================
// PATHS para servir SPA
// =============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.join(__dirname, '../dist');

// =============================================
// FUNCION IP LOCAL
// =============================================
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}
const localIP = getLocalIP();

// =============================================
// CORS profesional
// =============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  `http://${localIP}:5173`,
  /^http:\/\/192\.168\.\d+\.\d+:5173$/,
  'https://54.227.139.118',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const allowed = allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin);
    if (allowed) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
  }
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// =============================================
// Middlewares
// =============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (isDev) {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
  });
}

// =============================================
// Health check
// =============================================
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), environment: process.env.NODE_ENV });
});

// =============================================
// Rutas API
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/eventos', eventRoutes);
app.use('/api/noticias', newsRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/conceptos', conceptsRoutes);
app.use('/api/pagos', addPaymentsRoutes);
app.use('/api/asistencias', scannerQRRoutes);
app.use('/api/notificaciones', notifications);

// 404 solo para API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API no encontrada: ${req.originalUrl}` });
});

// =============================================
// Servir SPA en producción
// =============================================
if (!isDev) {
  app.use(express.static(frontendDist));

  // Catch-all: cualquier ruta que no sea API → index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ success: false, message: 'API no encontrada' });
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// =============================================
// Middleware de errores
// =============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(isDev && { stack: err.stack })
  });
});

// =============================================
// Iniciar servidor
// =============================================
async function startServer() {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) throw new Error('No se pudo conectar a la base de datos');

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor iniciado en ${HOST}:${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV}`);
      console.log(`🗄️ DB: ${process.env.DB_NAME} (conectada)`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();