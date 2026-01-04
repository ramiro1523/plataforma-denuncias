#!/usr/bin/env node

// Script para crear usuario desde línea de comandos
const bcrypt = require('bcrypt');
const readline = require('readline');
const db = require('../src/config/database');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  'Nombre completo: ',
  'Email: ',
  'Contraseña: ',
  'Rol (ciudadano/autoridad): '
];

async function createUsuario() {
  console.log('👤 CREAR NUEVO USUARIO');
  console.log('='.repeat(40));
  
  const answers = [];
  
  for (let i = 0; i < questions.length; i++) {
    const answer = await new Promise(resolve => {
      rl.question(questions[i], resolve);
    });
    answers.push(answer);
  }
  
  const [nombre, email, password, rol] = answers;
  
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
  
  if (!['ciudadano', 'autoridad'].includes(rol.toLowerCase())) {
    console.error('❌ Rol debe ser "ciudadano" o "autoridad"');
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
    
    // Insertar usuario
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre.trim(), email.trim(), hashedPassword, rol.toLowerCase()]
    );
    
    console.log('='.repeat(40));
    console.log('✅ USUARIO CREADO EXITOSAMENTE');
    console.log('='.repeat(40));
    console.log(`ID: ${result.insertId}`);
    console.log(`Nombre: ${nombre}`);
    console.log(`Email: ${email}`);
    console.log(`Rol: ${rol}`);
    console.log(`Contraseña: ${password} (en texto plano, guárdala segura)`);
    console.log('='.repeat(40));
    console.log('🔗 Puedes iniciar sesión en la plataforma');
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Ejecutar script
if (require.main === module) {
  createUsuario();
}

module.exports = createUsuario;