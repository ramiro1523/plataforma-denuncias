const db = require('../config/database');

class Usuario {
  // Crear usuario
  static async create(usuarioData) {
    const { nombre, email, password, rol } = usuarioData;
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, password, rol]
    );
    return result.insertId;
  }

  // Buscar por email
  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  // Buscar por ID
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, nombre, email, rol, fecha_registro FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Buscar por email y rol
  static async findByEmailAndRol(email, rol) {
    const [rows] = await db.execute(
      'SELECT * FROM usuarios WHERE email = ? AND rol = ?',
      [email, rol]
    );
    return rows[0];
  }

  // Verificar si email existe
  static async emailExists(email) {
    const [rows] = await db.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );
    return rows.length > 0;
  }

  // Actualizar usuario
  static async update(id, usuarioData) {
    const fields = [];
    const values = [];
    
    Object.keys(usuarioData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(usuarioData[key]);
    });
    
    values.push(id);
    
    const [result] = await db.execute(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  // Eliminar usuario
  static async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Obtener todos los usuarios (solo admin)
  static async getAll() {
    const [rows] = await db.execute(
      'SELECT id, nombre, email, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC'
    );
    return rows;
  }

  // Obtener estadísticas de usuarios
  static async getStats() {
    const [rows] = await db.execute(`
      SELECT 
        COUNT(*) as total_usuarios,
        SUM(CASE WHEN rol = 'ciudadano' THEN 1 ELSE 0 END) as ciudadanos,
        SUM(CASE WHEN rol = 'autoridad' THEN 1 ELSE 0 END) as autoridades,
        DATE(fecha_registro) as fecha,
        COUNT(*) as registros_diarios
      FROM usuarios
      WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(fecha_registro)
      ORDER BY fecha
    `);
    return rows;
  }
}

module.exports = Usuario;