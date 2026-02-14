import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import eventRoutes from './routes/eventsRoutes.js'; 
import newsRoutes from './routes/newsRoutes.js'; 
import otpRoutes from './routes/otpRoutes.js'
import userRoutes from './routes/usersRoutes.js';
import conceptsRoutes from './routes/conceptsRoutes.js'



// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';  // Escuchar en todas las interfaces

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API de Colonia App',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/eventos', eventRoutes); 
app.use('/api/noticias', newsRoutes); 
app.use('/', otpRoutes)
app.use('/api/conceptos', conceptsRoutes)




// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('No se pudo conectar a la base de datos. Saliendo...');
      process.exit(1);
    }
    
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
      console.log(`🌐 Accesible en: http://54.227.139.118:${PORT}`);
      console.log(`📡 Entorno: ${process.env.NODE_ENV}`);
      console.log(`📊 Base de datos: ${process.env.DB_NAME} (conectada)`);
    });
    
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
