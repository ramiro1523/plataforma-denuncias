const express = require('express');
const router = express.Router();
const EstadisticaController = require('../controllers/estadisticaController');
const { 
  authRequired, 
  autoridadRequired 
} = require('../middlewares/authMiddleware');

// TODAS LAS RUTAS SON SOLO PARA AUTORIDADES

// Estadísticas generales
router.get('/general', 
  authRequired,
  autoridadRequired,
  EstadisticaController.getGeneral
);

// Estadísticas por período
router.get('/periodo/:periodo', 
  authRequired,
  autoridadRequired,
  EstadisticaController.getByPeriodo
);

// Ranking de autoridades
router.get('/ranking-autoridades', 
  authRequired,
  autoridadRequired,
  EstadisticaController.getRankingAutoridades
);

// Mapa de calor de denuncias
router.get('/mapa-calor', 
  authRequired,
  autoridadRequired,
  EstadisticaController.getMapaCalor
);

module.exports = router;