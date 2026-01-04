const Usuario = require('../models/Usuario');

class UsuarioController {
  // Obtener todos los usuarios (solo admin/autoridad)
  static async getAll(req, res, next) {
    try {
      const usuarios = await Usuario.getAll();
      
      res.json({
        success: true,
        count: usuarios.length,
        data: usuarios
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuario por ID
  static async getById(req, res, next) {
    try {
      const usuario = await Usuario.findById(req.params.id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear usuario (admin/autoridad)
  static async create(req, res, next) {
    try {
      const { nombre, email, password, rol } = req.body;
      
      // Verificar si el email ya existe
      const emailExists = await Usuario.emailExists(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      const usuarioId = await Usuario.create({
        nombre,
        email,
        password,
        rol
      });

      const usuario = await Usuario.findById(usuarioId);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar usuario
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // No permitir cambiar email
      if (updateData.email) {
        delete updateData.email;
      }

      const updated = await Usuario.update(id, updateData);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const usuario = await Usuario.findById(id);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar usuario
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      // No permitir eliminarse a sí mismo
      if (parseInt(id) === parseInt(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
      }

      const deleted = await Usuario.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas de usuarios
  static async getStats(req, res, next) {
    try {
      const stats = await Usuario.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UsuarioController;