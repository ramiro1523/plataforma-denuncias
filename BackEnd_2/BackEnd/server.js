// server.js - SERVIDOR PRINCIPAL (CORREGIDO)
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
require('dotenv').config();

// Importar configuración
const config = require('./src/config/environment');
const routes = require('./src/routes');
const {
  notFound,
  errorHandler,
  jsonErrorHandler
} = require('./src/middlewares/errorMiddleware');

// ✅ Importar pool de MySQL
const pool = require('./src/db');

// Crear aplicación Express
const app = express();

// =========================
// ✅ CORS (DEBE IR ARRIBA, ANTES DE RUTAS)
// Permite localhost con cualquier puerto en desarrollo
// =========================
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Por si tu config.cors.origin viene como string o array
const configOrigins = (() => {
  const o = config?.cors?.origin;
  if (!o) return [];
  return Array.isArray(o) ? o : [o];
})().map(s => String(s).trim()).filter(Boolean);

const allowedOrigins = new Set([...envOrigins, ...configOrigins]);

const corsOptions = {
  origin: (origin, cb) => {
    // Postman/curl no envían Origin
    if (!origin) return cb(null, true);

    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);

    // ✅ en dev permitir cualquier localhost:xxxx
    if (config.nodeEnv !== 'production' && isLocalhost) {
      return cb(null, true);
    }

    // permitir los orígenes declarados en .env
    if (allowedOrigins.has(origin)) {
      return cb(null, true);
    }

    return cb(new Error(`CORS bloqueado para: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ Preflight SIEMPRE antes de rutas

// =========================
// Middlewares básicos
// =========================
app.use(jsonErrorHandler);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging en desarrollo
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// =========================
// Servir archivos estáticos
// =========================
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg') || filepath.endsWith('.png')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// ✅ Ruta para listar archivos de uploads
app.get(['/uploads', '/uploads/'], (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const files = fs.readdirSync(uploadDir);

    res.json({
      ok: true,
      message: files.length
        ? 'Archivos disponibles en uploads'
        : 'La carpeta uploads está vacía. Sube un archivo a /uploads/<archivo>.',
      files,
      example: files.length ? `/uploads/${files[0]}` : '/uploads/tu_archivo.jpg'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: `Bienvenido a ${config.app.name} API v${config.app.version}`,
    documentation: {
      baseUrl: `${req.protocol}://${req.get('host')}`,
      endpoints: {
        auth: '/api/auth',
        denuncias: '/api/denuncias',
        estadisticas: '/api/estadisticas',
        usuarios: '/api/usuarios',
        health: '/api/health',
        test: '/api/test',
        testDb: '/api/test-db'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ✅ Test de conexión a MySQL
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM denuncias');
    res.json({ ok: true, totalDenuncias: rows[0].total });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// =========================
// API Routes
// =========================
app.use('/api', routes);

// Middlewares de error
app.use(notFound);
app.use(errorHandler);

// =========================
// Iniciar servidor
// =========================
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor ${config.app.name} v${config.app.version}`);
  console.log(`📡 Modo: ${config.nodeEnv.toUpperCase()}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${config.db.database}@${config.db.host}`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads/`);
  console.log(`⏰ Iniciado: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
});

// =========================
// Manejo de errores globales
// =========================
process.on('unhandledRejection', (err) => {
  console.error('🔥 Error no manejado:', err.message);
  console.error(err.stack);

  server.close(() => {
    console.log('🛑 Servidor cerrado debido a error no manejado');
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 Excepción no capturada:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Señales
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT (Ctrl+C)');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = { app, server };
