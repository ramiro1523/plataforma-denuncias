const Denuncia = require('../models/Denuncia');
const Seguimiento = require('../models/Seguimiento');
const path = require('path');
const config = require('../config/environment');

class DenunciaController {
  // Crear denuncia
  static async create(req, res, next) {
    try {
      let { titulo, descripcion, categoria, latitud, longitud, direccion } = req.body;
      const usuario_id = req.user.id;
      latitud = (latitud === "" || latitud === undefined) ? null : Number(latitud);
      longitud = (longitud === "" || longitud === undefined) ? null : Number(longitud);
      
      if (Number.isNaN(latitud)) latitud = null;
      if (Number.isNaN(longitud)) longitud = null;
      let foto_url = null;
      if (req.file) foto_url = `/uploads/${req.file.filename}`;

          // Crear denuncia
      const denunciaId = await Denuncia.create({
        usuario_id,
        titulo,
        descripcion,
        categoria,
        latitud,
        longitud,
        direccion,
        foto_url
      });

      // Obtener denuncia creada
      const denuncia = await Denuncia.findById(denunciaId);

      res.status(201).json({
        success: true,
        message: 'Denuncia creada exitosamente',
        data: denuncia
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todas las denuncias
  static async getAll(req, res, next) {
    try {
      const denuncias = await Denuncia.getAll();
      
      res.json({
        success: true,
        count: denuncias.length,
        data: denuncias
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener denuncia por ID
  static async getById(req, res, next) {
    try {
      const denuncia = await Denuncia.findById(req.params.id);
      
      if (!denuncia) {
        return res.status(404).json({
          success: false,
          message: 'Denuncia no encontrada'
        });
      }

      // Obtener seguimiento
      const seguimiento = await Seguimiento.findByDenuncia(req.params.id);

      res.json({
        success: true,
        data: {
          ...denuncia,
          seguimiento
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener mis denuncias (usuario actual)
  static async getMisDenuncias(req, res, next) {
    try {
      const denuncias = await Denuncia.findByUsuario(req.user.id);
      
      res.json({
        success: true,
        count: denuncias.length,
        data: denuncias
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar estado de denuncia (solo autoridades)
  static async updateEstado(req, res, next) {
    try {
      const { estado, comentario } = req.body;
      const { id } = req.params;
      const autoridad_id = req.user.id;

      // Obtener denuncia actual
      const denuncia = await Denuncia.findById(id);
      
      if (!denuncia) {
        return res.status(404).json({
          success: false,
          message: 'Denuncia no encontrada'
        });
      }

      // Actualizar estado
      const updated = await Denuncia.updateEstado(id, estado);
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar estado'
        });
      }

      // Registrar en seguimiento
      await Seguimiento.create({
        denuncia_id: id,
        autoridad_id,
        comentario: comentario || '',
        estado_anterior: denuncia.estado,
        estado_nuevo: estado
      });

      // Obtener denuncia actualizada
      const denunciaActualizada = await Denuncia.findById(id);

      res.json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: denunciaActualizada
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener denuncias por categoría
  static async getByCategoria(req, res, next) {
    try {
      const { categoria } = req.params;
      const denuncias = await Denuncia.findByCategoria(categoria);
      
      res.json({
        success: true,
        count: denuncias.length,
        data: denuncias
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener denuncias por estado
  static async getByEstado(req, res, next) {
    try {
      const { estado } = req.params;
      const denuncias = await Denuncia.findByEstado(estado);
      
      res.json({
        success: true,
        count: denuncias.length,
        data: denuncias
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar denuncias
  static async search(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda debe tener al menos 3 caracteres'
        });
      }

      const denuncias = await Denuncia.search(q.trim());
      
      res.json({
        success: true,
        count: denuncias.length,
        data: denuncias
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar denuncia (solo ciudadano dueño)
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      const deleted = await Denuncia.delete(id, usuario_id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Denuncia no encontrada o no tienes permisos para eliminarla'
        });
      }

      res.json({
        success: true,
        message: 'Denuncia eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener seguimiento de denuncia
  static async getSeguimiento(req, res, next) {
    try {
      const seguimiento = await Seguimiento.findByDenuncia(req.params.id);
      
      res.json({
        success: true,
        count: seguimiento.length,
        data: seguimiento
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DenunciaController;