// Seed file for auth-service
// Creates initial users for testing

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@vozsegura.com' },
    update: {},
    create: {
      email: 'admin@vozsegura.com',
      passwordHash: adminPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: 'ADMIN',
      estado: 'ACTIVO',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create supervisor user
  const supervisorPassword = await bcrypt.hash('supervisor123', 10);
  const supervisor = await prisma.usuario.upsert({
    where: { email: 'supervisor@vozsegura.com' },
    update: {},
    create: {
      email: 'supervisor@vozsegura.com',
      passwordHash: supervisorPassword,
      nombre: 'Supervisor',
      apellido: 'Principal',
      rol: 'SUPERVISOR',
      estado: 'ACTIVO',
    },
  });
  console.log(`✅ Supervisor created: ${supervisor.email}`);

  // Create test user (denunciante)
  const userPassword = await bcrypt.hash('usuario123', 10);
  const user = await prisma.usuario.upsert({
    where: { email: 'usuario@vozsegura.com' },
    update: {},
    create: {
      email: 'usuario@vozsegura.com',
      passwordHash: userPassword,
      nombre: 'Usuario',
      apellido: 'Prueba',
      rol: 'DENUNCIANTE',
      estado: 'ACTIVO',
    },
  });
  console.log(`✅ User created: ${user.email}`);

  console.log('');
  console.log('📋 Test Credentials:');
  console.log('-------------------');
  console.log('Admin:      admin@vozsegura.com / admin123');
  console.log('Supervisor: supervisor@vozsegura.com / supervisor123');
  console.log('Usuario:    usuario@vozsegura.com / usuario123');
  console.log('');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
