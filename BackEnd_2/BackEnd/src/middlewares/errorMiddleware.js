// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

// Middleware para manejo de errores generales
const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware para errores de sintaxis JSON
const jsonErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la solicitud'
    });
  }
  next();
};

module.exports = {
  notFound,
  errorHandler,
  jsonErrorHandler
};