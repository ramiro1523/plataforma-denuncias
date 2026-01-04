#!/usr/bin/env node

// Script para crear autoridad desde línea de comandos
const bcrypt = require('bcrypt');
const readline = require('readline');
const db = require('../src/config/database');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAutoridad() {
  console.log('👮 CREAR NUEVA AUTORIDAD');
  console.log('='.repeat(40));
  
  const nombre = await new Promise(resolve => {
    rl.question('Nombre completo de la autoridad: ', resolve);
  });
  
  const email = await new Promise(resolve => {
    rl.question('Email institucional: ', resolve);
  });
  
  const password = await new Promise(resolve => {
    rl.question('Contraseña (min 4 caracteres): ', resolve);
  });
  
  // Validaciones
  if (!nombre || nombre.trim().length < 3) {
    console.error('❌ Nombre debe tener al menos 3 caracteres');
    rl.close();
    return;
  }
  
  if (!email.includes('@')) {
    console.error('❌ Email inválido');
    rl.close();
    return;
  }
  
  if (password.length < 4) {
    console.error('❌ Contraseña debe tener al menos 4 caracteres');
    rl.close();
    return;
  }
  
  try {
    // Verificar si el email ya existe
    const [existing] = await db.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      console.error('❌ El email ya está registrado');
      rl.close();
      return;
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar autoridad
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, "autoridad")',
      [nombre.trim(), email.trim(), hashedPassword]
    );
    
    console.log('='.repeat(40));
    console.log('✅ AUTORIDAD CREADA EXITOSAMENTE');
    console.log('='.repeat(40));
    console.log(`ID: ${result.insertId}`);
    console.log(`Nombre: ${nombre}`);
    console.log(`Email: ${email}`);
    console.log(`Rol: autoridad`);
    console.log(`Permisos: Panel de control, estadísticas, cambiar estados`);
    console.log('='.repeat(40));
    console.log('🔗 Puede iniciar sesión en el panel de autoridades');
    
  } catch (error) {
    console.error('❌ Error creando autoridad:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Ejecutar script
if (require.main === module) {
  createAutoridad();
}

module.exports = createAutoridad;