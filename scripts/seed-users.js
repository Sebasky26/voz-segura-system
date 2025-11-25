// Script para crear usuarios de prueba en el sistema
// Ejecutar con: node scripts/seed-users.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creando usuarios de prueba...');

  // Crear Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@vozsegura.com' },
    update: {},
    create: {
      email: 'admin@vozsegura.com',
      passwordHash: adminPassword,
      rol: 'ADMIN',
      nombre: 'Administrador',
      apellido: 'Sistema',
      estado: 'ACTIVO',
    },
  });
  console.log('[OK] Admin creado:', admin.email);

  // Crear Supervisor
  const supervisorPassword = await bcrypt.hash('supervisor123', 10);
  const supervisor = await prisma.usuario.upsert({
    where: { email: 'supervisor@vozsegura.com' },
    update: {},
    create: {
      email: 'supervisor@vozsegura.com',
      passwordHash: supervisorPassword,
      rol: 'SUPERVISOR',
      nombre: 'Juan',
      apellido: 'Supervisor',
      estado: 'ACTIVO',
    },
  });
  console.log('[OK] Supervisor creado:', supervisor.email);

  // Crear Denunciante
  const denunciantePassword = await bcrypt.hash('denunciante123', 10);
  const denunciante = await prisma.usuario.upsert({
    where: { email: 'denunciante@vozsegura.com' },
    update: {},
    create: {
      email: 'denunciante@vozsegura.com',
      passwordHash: denunciantePassword,
      rol: 'DENUNCIANTE',
      nombre: 'María',
      apellido: 'Denunciante',
      estado: 'ACTIVO',
    },
  });
  console.log('[OK] Denunciante creado:', denunciante.email);

  console.log('\nCredenciales de prueba:');
  console.log('========================================');
  console.log('Admin:');
  console.log('   Email: admin@vozsegura.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('Supervisor:');
  console.log('   Email: supervisor@vozsegura.com');
  console.log('   Password: supervisor123');
  console.log('');
  console.log('Denunciante:');
  console.log('   Email: denunciante@vozsegura.com');
  console.log('   Password: denunciante123');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('[ERROR]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
