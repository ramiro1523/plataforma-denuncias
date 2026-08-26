#!/usr/bin/env node

// ✅ 1) Cargar variables de entorno ANTES de importar cualquier módulo que use process.env
require('dotenv').config();

// ✅ 2) Recién después importar el seeder (porque este suele importar la conexión a MySQL)
const DatabaseSeeder = require('../src/utils/databaseSeeder');

async function initDatabase() {
  console.log('🔄 INICIALIZANDO BASE DE DATOS');
  console.log('='.repeat(50));

  try {
    const action = process.argv[2] || 'seed'; // seed, clean, reinit, tables

    switch (action) {
      case 'seed':
        console.log('📊 Insertando datos de prueba...');
        await DatabaseSeeder.seedData();
        break;

      case 'clean':
        console.log('🧹 Limpiando base de datos...');
        await DatabaseSeeder.cleanDatabase();
        break;

      case 'reinit':
        console.log('♻️  Reinicializando base de datos completa...');
        await DatabaseSeeder.reinitialize();
        break;

      case 'tables':
        console.log('📋 Creando tablas...');
        await DatabaseSeeder.createTables();
        break;

      default:
        console.log('❌ Acción no válida. Opciones: seed, clean, reinit, tables');
        console.log('   Uso: node scripts/initDatabase.js [acción]');
        process.exit(1);
    }

    console.log('='.repeat(50));
    console.log('✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
// hola 3prubea
