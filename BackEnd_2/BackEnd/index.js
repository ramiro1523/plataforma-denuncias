// index.js - PUNTO DE ENTRADA ALTERNATIVO
const { app, server } = require('./server');

// Exportar para pruebas
module.exports = { app, server };

// Si se ejecuta directamente
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Puerto ${PORT} en uso. Intenta con otro puerto:`);
      console.error(`   npm start -- --port=${parseInt(PORT) + 1}`);
      process.exit(1);
    } else {
      console.error('❌ Error al iniciar servidor:', error.message);
      process.exit(1);
    }
  });
}