const db = require('../config/database');

class Seguimiento {
  // Crear registro de seguimiento
  static async create(seguimientoData) {
    const { denuncia_id, autoridad_id, comentario, estado_anterior, estado_nuevo } = seguimientoData;
    
    const [result] = await db.execute(
      `INSERT INTO seguimiento_denuncias 
       (denuncia_id, autoridad_id, comentario, estado_anterior, estado_nuevo) 
       VALUES (?, ?, ?, ?, ?)`,
      [denuncia_id, autoridad_id, comentario, estado_anterior, estado_nuevo]
    );
    
    return result.insertId;
  }

  // Obtener seguimiento de una denuncia
  static async findByDenuncia(denuncia_id) {
    const [rows] = await db.execute(`
      SELECT 
        s.*, 
        u.nombre as autoridad_nombre,
        u.rol as autoridad_rol
      FROM seguimiento_denuncias s
      LEFT JOIN usuarios u ON s.autoridad_id = u.id
      WHERE s.denuncia_id = ?
      ORDER BY s.fecha_cambio DESC
    `, [denuncia_id]);
    return rows;
  }

  // Obtener historial completo
  static async getHistorial() {
    const [rows] = await db.execute(`
      SELECT 
        s.*,
        d.titulo as denuncia_titulo,
        u_a.nombre as autoridad_nombre,
        u_c.nombre as ciudadano_nombre
      FROM seguimiento_denuncias s
      JOIN denuncias d ON s.denuncia_id = d.id
      LEFT JOIN usuarios u_a ON s.autoridad_id = u_a.id
      JOIN usuarios u_c ON d.usuario_id = u_c.id
      ORDER BY s.fecha_cambio DESC
      LIMIT 100
    `);
    return rows;
  }

  // Obtener estadísticas de seguimiento
  static async getStats() {
    const [rows] = await db.execute(`
      SELECT 
        DATE(fecha_cambio) as fecha,
        COUNT(*) as cambios,
        estado_nuevo,
        autoridad_id,
        u.nombre as autoridad_nombre
      FROM seguimiento_denuncias s
      LEFT JOIN usuarios u ON s.autoridad_id = u.id
      WHERE fecha_cambio >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(fecha_cambio), estado_nuevo, autoridad_id
      ORDER BY fecha DESC
    `);
    return rows;
  }
}

module.exports = Seguimiento;