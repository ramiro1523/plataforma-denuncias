const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { 
  validateRegister, 
  validateLogin, 
  handleValidationErrors 
} = require('../middlewares/validationMiddleware');
const { authRequired } = require('../middlewares/authMiddleware');

// Registro de usuario (público)
router.post('/register', 
  validateRegister, 
  handleValidationErrors, 
  AuthController.register
);

// Login de usuario (público)
router.post('/login', 
  validateLogin, 
  handleValidationErrors, 
  AuthController.login
);

// Perfil del usuario actual (protegido)
router.get('/profile', 
  authRequired, 
  AuthController.getProfile
);

// Actualizar perfil (protegido)
router.put('/profile', 
  authRequired, 
  AuthController.updateProfile
);

// Cambiar contraseña (protegido)
router.post('/change-password', 
  authRequired, 
  AuthController.changePassword
);

router.post('/google', AuthController.google);


module.exports = router;