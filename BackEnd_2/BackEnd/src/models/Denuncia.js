// src/models/Denuncia.js
const db = require('../config/database');

class Denuncia {
  // Helpers
  static toNullIfEmpty(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
  }

  static toDecimalOrNull(value) {
    const v = Denuncia.toNullIfEmpty(value);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null; // si viene raro, lo dejamos NULL
  }

  // Crear denuncia (lat/long opcionales)
  static async create(denunciaData) {
    const {
      usuario_id,
      titulo,
      descripcion,
      categoria,
      latitud,
      longitud,
      direccion,
      foto_url
    } = denunciaData;

    const lat = Denuncia.toDecimalOrNull(latitud);
    const lng = Denuncia.toDecimalOrNull(longitud);

    const dir = Denuncia.toNullIfEmpty(direccion); // si quieres obligatoria, valídalo en middleware
    const foto = Denuncia.toNullIfEmpty(foto_url);

    const [result] = await db.execute(
      `INSERT INTO denuncias
       (usuario_id, titulo, descripcion, categoria, latitud, longitud, direccion, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, titulo, descripcion, categoria, lat, lng, dir, foto]
    );

    return result.insertId;
  }

  // Obtener todas las denuncias
  static async getAll() {
    const [rows] = await db.execute(`
      SELECT
        d.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.rol as usuario_rol
      FROM denuncias d
      JOIN usuarios u ON d.usuario_id = u.id
      ORDER BY d.fecha_creacion DESC
    `);
    return rows;
  }

  // Obtener denuncia por ID
  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT
        d.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.rol as usuario_rol
      FROM denuncias d
      JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.id = ?
    `, [id]);
    return rows[0];
  }

  // Obtener denuncias por usuario
  static async findByUsuario(usuario_id) {
    const [rows] = await db.execute(`
      SELECT
        d.*,
        u.nombre as usuario_nombre
      FROM denuncias d
      JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.usuario_id = ?
      ORDER BY d.fecha_creacion DESC
    `, [usuario_id]);
    return rows;
  }

  // Actualizar estado de denuncia
  static async updateEstado(id, estado) {
    const [result] = await db.execute(
      'UPDATE denuncias SET estado = ? WHERE id = ?',
      [estado, id]
    );
    return result.affectedRows > 0;
  }

  // Obtener denuncias por estado
  static async findByEstado(estado) {
    const [rows] = await db.execute(`
      SELECT
        d.*,
        u.nombre as usuario_nombre
      FROM denuncias d
      JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.estado = ?
      ORDER BY d.fecha_creacion DESC
    `, [estado]);
    return rows;
  }

  // Obtener denuncias por categoría
  static async findByCategoria(categoria) {
    const [rows] = await db.execute(`
      SELECT
        d.*,
        u.nombre as usuario_nombre
      FROM denuncias d
      JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.categoria = ?
      ORDER BY d.fecha_creacion DESC
    `, [categoria]);
    return rows;
  }

  // Buscar denuncias (búsqueda)
  static async search(query) {
    const q = `%${query}%`;
    const [rows] = await db.execute(`
      SELECT
        d.*,
        u.nombre as usuario_nombre
      FROM denuncias d
      JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.titulo LIKE ? OR d.descripcion LIKE ? OR COALESCE(d.direccion,'') LIKE ?
      ORDER BY d.fecha_creacion DESC
    `, [q, q, q]);
    return rows;
  }

  // Obtener estadísticas
  static async getStats() {
    const [rows] = await db.execute(`
      SELECT
        COUNT(*) as total_denuncias,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
        SUM(CASE WHEN estado = 'resuelta' THEN 1 ELSE 0 END) as resueltas,
        categoria,
        COUNT(*) as por_categoria,
        DATE(fecha_creacion) as fecha,
        COUNT(*) as denuncias_diarias,
        estado
      FROM denuncias
      GROUP BY categoria, DATE(fecha_creacion), estado
      ORDER BY fecha DESC
    `);
    return rows;
  }

  // Obtener denuncias recientes
  static async getRecent(limit = 10) {
    const [rows] = await db.execute(`
      SELECT
        d.*,
        u.nombre as usuario_nombre
      FROM denuncias d
      JOIN usuarios u ON d.usuario_id = u.id
      ORDER BY d.fecha_creacion DESC
      LIMIT ?
    `, [Number(limit)]);
    return rows;
  }

  // Eliminar denuncia
  static async delete(id, usuario_id) {
    const [result] = await db.execute(
      'DELETE FROM denuncias WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Denuncia;
