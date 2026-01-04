const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./authRoutes');
const denunciaRoutes = require('./denunciaRoutes');
const estadisticaRoutes = require('./estadisticaRoutes');
const usuarioRoutes = require('./usuarioRoutes');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API de Plataforma de Denuncias Ciudadanas',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      denuncias: '/api/denuncias',
      estadisticas: '/api/estadisticas',
      usuarios: '/api/usuarios'
    }
  });
});

// Ruta de salud
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Montar rutas
router.use('/auth', authRoutes);
router.use('/denuncias', denunciaRoutes);
router.use('/estadisticas', estadisticaRoutes);
router.use('/usuarios', usuarioRoutes);

module.exports = router;