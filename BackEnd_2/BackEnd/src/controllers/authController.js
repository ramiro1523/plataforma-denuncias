const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const config = require('../config/environment');

class AuthController {
  // ✅ Login/Registro con Google (OAuth ID Token)
static async google(req, res, next) {
  try {
    const { credential, requestedRole } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Falta credential de Google' });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ success: false, message: 'Falta GOOGLE_CLIENT_ID en el backend (.env)' });
    }

    const client = new OAuth2Client(googleClientId);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const nombre = payload?.name || payload?.given_name || 'Usuario Google';

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google no devolvió email' });
    }

    // ✅ Seguridad: autoridad solo si cumple regla (evita que cualquiera se haga autoridad)
    let rol = 'ciudadano';
    if (requestedRole === 'autoridad' && email.endsWith('@muni.com')) {
      rol = 'autoridad';
    }

    // Buscar/crear usuario
    let usuario = await Usuario.findByEmail(email);

    if (!usuario) {
      const randomPass = crypto.randomBytes(32).toString('hex');
      const hashed = await bcrypt.hash(randomPass, 10);

      const userId = await Usuario.create({ nombre, email, password: hashed, rol });
      usuario = await Usuario.findById(userId);
    }

    // JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.json({
      success: true,
      message: 'Login con Google exitoso',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          fecha_registro: usuario.fecha_registro
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
}
  // Registrar usuario
  static async register(req, res, next) {
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

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const usuarioId = await Usuario.create({
        nombre,
        email,
        password: hashedPassword,
        rol
      });

      // Generar token JWT
      const token = jwt.sign(
        { id: usuarioId, email, rol, nombre },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Obtener usuario creado
      const usuario = await Usuario.findById(usuarioId);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            fecha_registro: usuario.fecha_registro
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login de usuario
  static async login(req, res, next) {
    try {
      const { email, password, userType } = req.body;

      // Buscar usuario por email y rol
      const usuario = await Usuario.findByEmailAndRol(email, userType);
      
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, usuario.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          rol: usuario.rol, 
          nombre: usuario.nombre 
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            fecha_registro: usuario.fecha_registro
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil del usuario actual
  static async getProfile(req, res, next) {
    try {
      const usuario = await Usuario.findById(req.user.id);
      
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

  // Actualizar perfil
  static async updateProfile(req, res, next) {
    try {
      const { nombre } = req.body;
      
      const updated = await Usuario.update(req.user.id, { nombre });
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const usuario = await Usuario.findById(req.user.id);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Obtener usuario con contraseña
      const usuario = await Usuario.findByEmail(req.user.email);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const validPassword = await bcrypt.compare(currentPassword, usuario.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Actualizar contraseña
      const updated = await Usuario.update(req.user.id, { password: hashedPassword });
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar contraseña'
        });
      }

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;