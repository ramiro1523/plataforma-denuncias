const jwt = require('jsonwebtoken');
const config = require('../config/environment');

// Verificar token JWT
const authRequired = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
};

// Solo para autoridades
const autoridadRequired = (req, res, next) => {
  if (req.user.rol !== 'autoridad') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo para autoridades.'
    });
  }
  next();
};

// Solo para ciudadanos
const ciudadanoRequired = (req, res, next) => {
  if (req.user.rol !== 'ciudadano') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo para ciudadanos.'
    });
  }
  next();
};

// Verificar si es el mismo usuario o autoridad
const verifyOwnerOrAutoridad = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRol = req.user.rol;

  // Si es autoridad, puede acceder a todo
  if (userRol === 'autoridad') {
    return next();
  }

  // Si es ciudadano, solo puede acceder a sus propios recursos
  if (parseInt(id) !== parseInt(userId)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. No tienes permisos para este recurso.'
    });
  }

  next();
};

module.exports = {
  authRequired,
  autoridadRequired,
  ciudadanoRequired,
  verifyOwnerOrAutoridad
};