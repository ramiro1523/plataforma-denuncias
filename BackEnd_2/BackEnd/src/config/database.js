const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'danilonilo',
  database: process.env.DB_NAME || 'plataforma_denuncias',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test de conexión
connection.getConnection()
  .then(() => {
    console.log('✅ Conectado a MySQL - plataforma_denuncias');
  })
  .catch(err => {
    console.error('❌ Error de conexión a MySQL:', err.message);
    console.log('📋 Verifica:');
    console.log('1. MySQL está corriendo');
    console.log('2. La base de datos existe');
    console.log('3. Usuario/Contraseña correctos');
    process.exit(1);
  });

module.exports = connection;