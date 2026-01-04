require('dotenv').config();

module.exports = {
  // Servidor
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Base de datos
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  },
  
  // Uploads
  uploads: {
    maxSize: process.env.MAX_FILE_SIZE,
    path: process.env.UPLOAD_PATH,
    allowedExtensions: process.env.ALLOWED_EXTENSIONS.split(',')
  },
  
  // CORS
  cors: {
  origin: (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
},
  
  // App
  app: {
    name: process.env.APP_NAME,
    version: process.env.APP_VERSION
  }
};