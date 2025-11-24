// Archivo: prisma/seed.ts
// Descripción: Script para poblar la base de datos con datos iniciales

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional - comentar si no deseas)
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.auditoriaLog.deleteMany();
  await prisma.mensajeChat.deleteMany();
  await prisma.historialDenuncia.deleteMany();
  await prisma.evidencia.deleteMany();
  await prisma.denuncia.deleteMany();
  await prisma.usuario.deleteMany();

  // Hash de contraseña común para todos los usuarios de prueba
  const passwordHash = await bcrypt.hash('Password123!', 12);

  console.log('👤 Creando usuarios...');

  // 1. Usuario Admin
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@vozsegura.com',
      passwordHash,
      rol: 'ADMIN',
      nombre: 'Admin',
      apellido: 'Sistema',
      telefono: '0999999999',
      estado: 'ACTIVO',
    },
  });
  console.log('  ✓ Admin creado:', admin.email);

  // 2. Supervisores
  const supervisor1 = await prisma.usuario.create({
    data: {
      email: 'supervisor1@vozsegura.com',
      passwordHash,
      rol: 'SUPERVISOR',
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '0987654321',
      estado: 'ACTIVO',
    },
  });
  console.log('  ✓ Supervisor 1 creado:', supervisor1.email);

  const supervisor2 = await prisma.usuario.create({
    data: {
      email: 'supervisor2@vozsegura.com',
      passwordHash,
      rol: 'SUPERVISOR',
      nombre: 'María',
      apellido: 'González',
      telefono: '0987654322',
      estado: 'ACTIVO',
    },
  });
  console.log('  ✓ Supervisor 2 creado:', supervisor2.email);

  // 3. Denunciantes
  const denunciante1 = await prisma.usuario.create({
    data: {
      email: 'denunciante@test.com',
      passwordHash,
      rol: 'DENUNCIANTE',
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      telefono: '0987654323',
      estado: 'ACTIVO',
    },
  });
  console.log('  ✓ Denunciante creado:', denunciante1.email);

  console.log('📋 Creando denuncias de prueba...');

  // Denuncia 1 - Pendiente
  const denuncia1 = await prisma.denuncia.create({
    data: {
      codigoAnonimo: 'DEN-2024-0001',
      titulo: 'Acoso laboral en departamento de ventas',
      descripcion: 'Se ha observado comportamiento inapropiado y acoso constante por parte del jefe de departamento hacia varios empleados. El ambiente de trabajo se ha vuelto hostil y varios compañeros han expresado su malestar.',
      categoria: 'ACOSO_LABORAL',
      estado: 'PENDIENTE',
      prioridad: 'ALTA',
      denuncianteId: denunciante1.id,
      ubicacionGeneral: 'Quito, Pichincha',
    },
  });
  console.log('  ✓ Denuncia 1 creada:', denuncia1.codigoAnonimo);

  // Denuncia 2 - En revisión (asignada a supervisor)
  const denuncia2 = await prisma.denuncia.create({
    data: {
      codigoAnonimo: 'DEN-2024-0002',
      titulo: 'Discriminación por género en proceso de promoción',
      descripcion: 'Se ha identificado un patrón sistemático de discriminación hacia mujeres en los procesos de promoción interna. A pesar de tener las mismas o mejores calificaciones, las candidatas femeninas son consistentemente pasadas por alto.',
      categoria: 'DISCRIMINACION',
      estado: 'EN_REVISION',
      prioridad: 'MEDIA',
      denuncianteId: denunciante1.id,
      supervisorId: supervisor1.id,
      ubicacionGeneral: 'Guayaquil, Guayas',
    },
  });
  console.log('  ✓ Denuncia 2 creada:', denuncia2.codigoAnonimo);

  // Denuncia 3 - Aprobada
  const denuncia3 = await prisma.denuncia.create({
    data: {
      codigoAnonimo: 'DEN-2024-0003',
      titulo: 'Falta de pago de horas extras',
      descripcion: 'La empresa no está compensando las horas extras trabajadas según lo establecido en el código de trabajo. Los empleados están siendo obligados a trabajar tiempo adicional sin la remuneración correspondiente.',
      categoria: 'FALTA_DE_PAGO',
      estado: 'APROBADA',
      prioridad: 'URGENTE',
      denuncianteId: denunciante1.id,
      supervisorId: supervisor2.id,
      ubicacionGeneral: 'Cuenca, Azuay',
    },
  });
  console.log('  ✓ Denuncia 3 creada:', denuncia3.codigoAnonimo);

  console.log('💬 Creando mensajes de chat de prueba...');

  // Mensajes de chat
  await prisma.mensajeChat.createMany({
    data: [
      {
        usuarioId: admin.id,
        mensaje: 'Bienvenidos al sistema de denuncias Voz Segura',
        sala: 'general',
        tipo: 'SISTEMA',
      },
      {
        usuarioId: supervisor1.id,
        mensaje: 'Hola, estoy revisando las denuncias pendientes',
        sala: 'general',
        tipo: 'TEXTO',
      },
      {
        usuarioId: denunciante1.id,
        mensaje: '¿Cuánto tiempo toma el proceso de revisión?',
        sala: 'general',
        tipo: 'TEXTO',
      },
    ],
  });
  console.log('  ✓ Mensajes de chat creados');

  console.log('📊 Creando historial de denuncias...');

  // Historial de cambio de estado
  await prisma.historialDenuncia.create({
    data: {
      denunciaId: denuncia2.id,
      estadoAnterior: 'PENDIENTE',
      estadoNuevo: 'EN_REVISION',
      comentario: 'Caso asignado para revisión inicial',
      realizadoPor: supervisor1.id,
    },
  });

  await prisma.historialDenuncia.create({
    data: {
      denunciaId: denuncia3.id,
      estadoAnterior: 'PENDIENTE',
      estadoNuevo: 'EN_REVISION',
      comentario: 'Caso asignado para análisis',
      realizadoPor: supervisor2.id,
    },
  });

  await prisma.historialDenuncia.create({
    data: {
      denunciaId: denuncia3.id,
      estadoAnterior: 'EN_REVISION',
      estadoNuevo: 'APROBADA',
      comentario: 'Denuncia verificada y aprobada para derivación',
      realizadoPor: supervisor2.id,
    },
  });

  console.log('  ✓ Historial creado');

  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('📝 Usuarios creados:');
  console.log('   Admin:        admin@vozsegura.com');
  console.log('   Supervisor 1: supervisor1@vozsegura.com');
  console.log('   Supervisor 2: supervisor2@vozsegura.com');
  console.log('   Denunciante:  denunciante@test.com');
  console.log('\n🔑 Contraseña para todos: Password123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
