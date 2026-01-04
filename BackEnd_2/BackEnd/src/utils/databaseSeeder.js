const bcrypt = require('bcrypt');
const db = require('../config/database');

class DatabaseSeeder {
  // Crear tablas si no existen
  static async createTables() {
    try {
      console.log('🔄 Creando tablas...');

      // Tabla de usuarios
      await db.execute(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nombre VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          rol ENUM('ciudadano', 'autoridad') DEFAULT 'ciudadano',
          fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_rol (rol)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // ✅ Tabla de denuncias (lat/long opcionales, dirección obligatoria)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS denuncias (
          id INT PRIMARY KEY AUTO_INCREMENT,
          usuario_id INT NOT NULL,
          titulo VARCHAR(200) NOT NULL,
          descripcion TEXT NOT NULL,
          categoria ENUM('bache', 'alumbrado', 'basura', 'agua', 'seguridad', 'transporte', 'otros') NOT NULL,

          -- ✅ ahora opcionales
          latitud DECIMAL(10, 8) NULL DEFAULT NULL,
          longitud DECIMAL(11, 8) NULL DEFAULT NULL,

          -- ✅ ahora obligatoria
          direccion VARCHAR(255) NOT NULL,

          foto_url TEXT NULL,
          estado ENUM('pendiente', 'en_proceso', 'resuelta') DEFAULT 'pendiente',
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          INDEX idx_usuario_id (usuario_id),
          INDEX idx_categoria (categoria),
          INDEX idx_estado (estado),
          INDEX idx_fecha_creacion (fecha_creacion),

          -- ✅ si quieres indexar coords, usa index normal (NO SPATIAL)
          INDEX idx_lat_lng (latitud, longitud),

          CONSTRAINT fk_denuncias_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Tabla de seguimiento
      await db.execute(`
        CREATE TABLE IF NOT EXISTS seguimiento_denuncias (
          id INT PRIMARY KEY AUTO_INCREMENT,
          denuncia_id INT NOT NULL,
          autoridad_id INT NULL,
          comentario TEXT,
          estado_anterior VARCHAR(50),
          estado_nuevo VARCHAR(50),
          fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          INDEX idx_denuncia_id (denuncia_id),
          INDEX idx_autoridad_id (autoridad_id),
          INDEX idx_fecha_cambio (fecha_cambio),

          CONSTRAINT fk_seguimiento_denuncia
            FOREIGN KEY (denuncia_id) REFERENCES denuncias(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,

          CONSTRAINT fk_seguimiento_autoridad
            FOREIGN KEY (autoridad_id) REFERENCES usuarios(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log('✅ Tablas creadas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error creando tablas:', error.message);
      throw error;
    }
  }

  // Insertar datos de prueba
  static async seedData() {
    try {
      console.log('🔄 Insertando datos de prueba...');

      const hashedPassword = await bcrypt.hash('1234', 10);

      await db.execute(`
        INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES
        ('Ana Ciudadana', 'ana@demo.com', ?, 'ciudadano'),
        ('Luis Autoridad', 'luis@muni.com', ?, 'autoridad'),
        ('Carlos Pérez', 'carlos@test.com', ?, 'ciudadano'),
        ('María Gómez', 'maria@test.com', ?, 'ciudadano'),
        ('Pedro Rodríguez', 'pedro@muni.com', ?, 'autoridad')
      `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

      const [usuarios] = await db.execute('SELECT id, email FROM usuarios');
      const anaId = usuarios.find(u => u.email === 'ana@demo.com').id;
      const luisId = usuarios.find(u => u.email === 'luis@muni.com').id;
      const carlosId = usuarios.find(u => u.email === 'carlos@test.com').id;

      // ✅ ahora puedes meter algunos con NULL coords si quieres
      await db.execute(`
        INSERT IGNORE INTO denuncias
        (usuario_id, titulo, descripcion, categoria, latitud, longitud, direccion, estado) VALUES
        (?, 'Bache peligroso en avenida principal', 'Bache grande que representa peligro para vehículos', 'bache', 19.432608, -99.133209, 'Av. Principal #123', 'pendiente'),
        (?, 'Falta de alumbrado público en parque', 'Poste de luz dañado desde hace 2 semanas', 'alumbrado', NULL, NULL, 'Parque Central', 'en_proceso'),
        (?, 'Acumulación de basura en esquina', 'Basura acumulada por más de una semana', 'basura', NULL, NULL, 'Esquina Calle 5 y Av. 10', 'resuelta'),
        (?, 'Fuga de agua en tubería', 'Fuga constante de agua potable', 'agua', 19.434000, -99.135000, 'Calle Juárez #45', 'pendiente')
      `, [anaId, anaId, carlosId, anaId]);

      const [denuncias] = await db.execute('SELECT id FROM denuncias ORDER BY id');

      if (denuncias.length >= 2) {
        await db.execute(`
          INSERT IGNORE INTO seguimiento_denuncias
          (denuncia_id, autoridad_id, comentario, estado_anterior, estado_nuevo) VALUES
          (?, ?, 'Denuncia recibida y en proceso de revisión', 'pendiente', 'en_proceso'),
          (?, ?, 'Problema resuelto satisfactoriamente', 'en_proceso', 'resuelta')
        `, [denuncias[0].id, luisId, denuncias[1].id, luisId]);
      }

      console.log('✅ Datos de prueba insertados exitosamente');
      console.log('📋 Login demo: ana@demo.com / 1234 (ciudadano)');
      console.log('📋 Login demo: luis@muni.com / 1234 (autoridad)');
      return true;
    } catch (error) {
      console.error('❌ Error insertando datos de prueba:', error.message);
      throw error;
    }
  }

  static async cleanDatabase() {
    try {
      console.log('🔄 Limpiando base de datos...');
      await db.execute('SET FOREIGN_KEY_CHECKS = 0');
      await db.execute('DROP TABLE IF EXISTS seguimiento_denuncias');
      await db.execute('DROP TABLE IF EXISTS denuncias');
      await db.execute('DROP TABLE IF EXISTS usuarios');
      await db.execute('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Base de datos limpiada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error limpiando base de datos:', error.message);
      throw error;
    }
  }

  static async reinitialize() {
    try {
      await this.cleanDatabase();
      await this.createTables();
      await this.seedData();
      console.log('✅ Base de datos reinicializada completamente');
      return true;
    } catch (error) {
      console.error('❌ Error reinicializando base de datos:', error.message);
      throw error;
    }
  }
}

module.exports = DatabaseSeeder;
