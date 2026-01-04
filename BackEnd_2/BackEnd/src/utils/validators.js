const validator = require("validator");

class Validators {
  // Validar email
  static isValidEmail(email) {
    if (email === undefined || email === null) return false;
    return validator.isEmail(String(email).trim());
  }

  // Validar contraseña
  static isValidPassword(password) {
    return typeof password === "string" && password.length >= 4;
  }

  // Validar nombre
  static isValidNombre(nombre) {
    return nombre && nombre.trim().length >= 3 && nombre.trim().length <= 100;
  }

  // Validar título de denuncia
  static isValidTitulo(titulo) {
    return titulo && titulo.trim().length >= 5 && titulo.trim().length <= 200;
  }

  // Validar descripción
  static isValidDescripcion(descripcion) {
    return descripcion && descripcion.trim().length >= 10;
  }

  // Validar categoría
  static isValidCategoria(categoria) {
    const categoriasValidas = ["bache", "alumbrado", "basura", "agua", "seguridad", "transporte", "otros"];
    return categoriasValidas.includes(categoria);
  }

  // ✅ Validar coordenadas (OPCIONALES)
  static isValidLatitud(latitud) {
    // opcional
    if (latitud === undefined || latitud === null || String(latitud).trim() === "") return true;
    return validator.isFloat(String(latitud), { min: -90, max: 90 });
  }

  static isValidLongitud(longitud) {
    // opcional
    if (longitud === undefined || longitud === null || String(longitud).trim() === "") return true;
    return validator.isFloat(String(longitud), { min: -180, max: 180 });
  }

  // Validar estado
  static isValidEstado(estado) {
    const estadosValidos = ["pendiente", "en_proceso", "resuelta"];
    return estadosValidos.includes(estado);
  }

  // Validar rol
  static isValidRol(rol) {
    const rolesValidos = ["ciudadano", "autoridad"];
    return rolesValidos.includes(rol);
  }

  // Sanitizar texto (remover XSS)
  static sanitizeText(text) {
    return validator.escape(validator.trim(String(text)));
  }

  // Validar ID numérico
  static isValidId(id) {
    return validator.isInt(String(id), { min: 1 });
  }

  // ✅ Dirección OBLIGATORIA
  static isValidDireccion(direccion) {
    if (direccion === undefined || direccion === null) return false;
    const d = String(direccion).trim();
    return d.length >= 4 && d.length <= 255;
  }

  // Validar comentario
  static isValidComentario(comentario) {
    return !comentario || String(comentario).trim().length <= 500;
  }

  // Validar teléfono (opcional)
  static isValidTelefono(telefono) {
    return !telefono || validator.isMobilePhone(String(telefono), "es-MX");
  }

  // Validar fecha
  static isValidDate(dateString) {
    return validator.isISO8601(String(dateString));
  }

  // Validar URL de imagen
  static isValidImageUrl(url) {
    if (!url) return true;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const u = String(url).toLowerCase();
    const ext = u.substring(u.lastIndexOf("."));
    return imageExtensions.includes(ext);
  }

  // Validar objeto completo de usuario
  static validateUsuario(usuario) {
    const errors = [];

    if (!this.isValidNombre(usuario.nombre)) errors.push("Nombre inválido (3-100 caracteres)");
    if (!this.isValidEmail(usuario.email)) errors.push("Email inválido");
    if (!this.isValidPassword(usuario.password)) errors.push("Contraseña inválida (mínimo 4 caracteres)");
    if (!this.isValidRol(usuario.rol)) errors.push("Rol inválido");

    return { isValid: errors.length === 0, errors };
  }

  // ✅ Validar objeto completo de denuncia (lat/lng opcionales)
  static validateDenuncia(denuncia) {
    const errors = [];

    if (!this.isValidTitulo(denuncia.titulo)) errors.push("Título inválido (5-200 caracteres)");
    if (!this.isValidDescripcion(denuncia.descripcion)) errors.push("Descripción inválida (mínimo 10 caracteres)");
    if (!this.isValidCategoria(denuncia.categoria)) errors.push("Categoría inválida");

    // ✅ Dirección requerida
    if (!this.isValidDireccion(denuncia.direccion)) errors.push("Dirección inválida (mínimo 4, máximo 255)");

    // ✅ Lat/Lng opcional PERO coherente: ambas o ninguna
    const latProvided = !(denuncia.latitud === undefined || denuncia.latitud === null || String(denuncia.latitud).trim() === "");
    const lngProvided = !(denuncia.longitud === undefined || denuncia.longitud === null || String(denuncia.longitud).trim() === "");

    if (latProvided !== lngProvided) {
      errors.push("Coordenadas incompletas: envía latitud y longitud juntas (o ninguna).");
    }

    // si vienen, validarlas
    if (!this.isValidLatitud(denuncia.latitud)) errors.push("Latitud inválida");
    if (!this.isValidLongitud(denuncia.longitud)) errors.push("Longitud inválida");

    if (denuncia.foto_url && !this.isValidImageUrl(denuncia.foto_url)) {
      errors.push("URL de imagen inválida");
    }

    return { isValid: errors.length === 0, errors };
  }

  // ✅ Normalizar datos (NO tocar password)
  static normalizeData(data) {
    const normalized = {};

    Object.keys(data).forEach((key) => {
      const v = data[key];

      // ⚠️ NO escapar password (rompe login)
      if (key === "password") {
        normalized[key] = typeof v === "string" ? v : v;
        return;
      }

      // email: solo trim
      if (key === "email") {
        normalized[key] = typeof v === "string" ? v.trim() : v;
        return;
      }

      // otros string: sanitize
      if (typeof v === "string") {
        normalized[key] = this.sanitizeText(v);
      } else {
        normalized[key] = v;
      }
    });

    return normalized;
  }
}

module.exports = Validators;
