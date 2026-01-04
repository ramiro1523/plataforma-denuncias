const fs = require('fs').promises;
const path = require('path');
const config = require('../config/environment');

class FileUpload {
  // Validar extensión de archivo
  static validateExtension(filename) {
    const ext = path.extname(filename).toLowerCase().substring(1);
    return config.uploads.allowedExtensions.includes(ext);
  }

  // Validar tamaño de archivo
  static validateSize(fileSize) {
    const maxSize = parseInt(config.uploads.maxSize) * 1024 * 1024;
    return fileSize <= maxSize;
  }

  // Generar nombre único para archivo
  static generateUniqueName(originalname) {
    const ext = path.extname(originalname).toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `denuncia_${timestamp}_${random}${ext}`;
  }

  // Guardar archivo
  static async saveFile(file, customName = null) {
    try {
      const uploadDir = config.uploads.path;
      
      // Crear directorio si no existe
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Generar nombre único
      const filename = customName || this.generateUniqueName(file.originalname);
      const filepath = path.join(uploadDir, filename);
      
      // Guardar archivo
      await fs.writeFile(filepath, file.buffer);
      
      // Retornar ruta relativa
      return `/uploads/${filename}`;
    } catch (error) {
      throw new Error(`Error guardando archivo: ${error.message}`);
    }
  }

  // Eliminar archivo
  static async deleteFile(filepath) {
    try {
      // Extraer nombre de archivo de la ruta
      const filename = path.basename(filepath);
      const fullPath = path.join(config.uploads.path, filename);
      
      // Verificar si el archivo existe
      await fs.access(fullPath);
      
      // Eliminar archivo
      await fs.unlink(fullPath);
      
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`Archivo no encontrado: ${filepath}`);
        return false;
      }
      throw new Error(`Error eliminando archivo: ${error.message}`);
    }
  }

  // Obtener información del archivo
  static async getFileInfo(filepath) {
    try {
      const filename = path.basename(filepath);
      const fullPath = path.join(config.uploads.path, filename);
      
      const stats = await fs.stat(fullPath);
      
      return {
        filename,
        path: fullPath,
        url: `/uploads/${filename}`,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension: path.extname(filename).toLowerCase().substring(1)
      };
    } catch (error) {
      throw new Error(`Error obteniendo información del archivo: ${error.message}`);
    }
  }

  // Listar archivos en directorio de uploads
  static async listFiles() {
    try {
      const uploadDir = config.uploads.path;
      
      // Crear directorio si no existe
      await fs.mkdir(uploadDir, { recursive: true });
      
      const files = await fs.readdir(uploadDir);
      
      const fileList = await Promise.all(
        files.map(async (filename) => {
          const filepath = path.join(uploadDir, filename);
          const stats = await fs.stat(filepath);
          
          return {
            filename,
            url: `/uploads/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime,
            extension: path.extname(filename).toLowerCase().substring(1)
          };
        })
      );
      
      return fileList;
    } catch (error) {
      throw new Error(`Error listando archivos: ${error.message}`);
    }
  }

  // Limpiar archivos antiguos (más de 30 días)
  static async cleanOldFiles(days = 30) {
    try {
      const uploadDir = config.uploads.path;
      const files = await fs.readdir(uploadDir);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      for (const filename of files) {
        const filepath = path.join(uploadDir, filename);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filepath);
          deletedCount++;
          console.log(`🗑️  Archivo eliminado: ${filename}`);
        }
      }
      
      console.log(`✅ Limpieza completada: ${deletedCount} archivos eliminados`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error limpiando archivos antiguos:', error.message);
      throw error;
    }
  }
}

module.exports = FileUpload;