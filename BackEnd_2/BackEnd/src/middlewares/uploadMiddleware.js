const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/environment');

// Crear directorio de uploads si no existe
const uploadDir = config.uploads.path;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Directorio de uploads creado: ${uploadDir}`);
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'denuncia-' + uniqueSuffix + ext);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedExtensions = config.uploads.allowedExtensions;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(', ')}`));
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Solo un archivo por denuncia
  }
});

// Middleware para manejar errores de multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Solo se permite un archivo por denuncia.'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadErrors
};