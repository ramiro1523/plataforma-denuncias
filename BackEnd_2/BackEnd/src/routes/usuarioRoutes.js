const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const { 
  authRequired, 
  autoridadRequired 
} = require('../middlewares/authMiddleware');

// TODAS LAS RUTAS SON SOLO PARA AUTORIDADES

// Obtener todos los usuarios
router.get('/', 
  authRequired,
  autoridadRequired,
  UsuarioController.getAll
);

// Obtener usuario por ID
router.get('/:id', 
  authRequired,
  autoridadRequired,
  UsuarioController.getById
);

// Crear usuario
router.post('/', 
  authRequired,
  autoridadRequired,
  UsuarioController.create
);

// Actualizar usuario
router.put('/:id', 
  authRequired,
  autoridadRequired,
  UsuarioController.update
);

// Eliminar usuario
router.delete('/:id', 
  authRequired,
  autoridadRequired,
  UsuarioController.delete
);

// Estadísticas de usuarios
router.get('/estadisticas/usuarios', 
  authRequired,
  autoridadRequired,
  UsuarioController.getStats
);

module.exports = router;