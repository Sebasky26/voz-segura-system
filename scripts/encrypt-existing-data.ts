/**
 * Script para cifrar datos existentes en la base de datos
 * Ejecutar ANTES de aplicar la migración
 */

import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/lib/encryption.js';

const prisma = new PrismaClient();

async function encryptExistingData() {
  try {
    console.log('🔒 Iniciando cifrado de datos existentes...');

    // Obtener todos los usuarios con nombre/apellido/telefono
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
      },
    });

    console.log(`📊 Encontrados ${usuarios.length} usuarios para procesar`);

    let processed = 0;
    let errors = 0;

    for (const usuario of usuarios) {
      try {
        const updates: {
          nombre?: string | null;
          apellido?: string | null;
          telefono?: string | null;
        } = {};

        // Solo cifrar si el dato no está vacío y no parece estar ya cifrado
        if (usuario.nombre && !usuario.nombre.includes(':')) {
          updates.nombre = encrypt(usuario.nombre);
        }

        if (usuario.apellido && !usuario.apellido.includes(':')) {
          updates.apellido = encrypt(usuario.apellido);
        }

        if (usuario.telefono && !usuario.telefono.includes(':')) {
          updates.telefono = encrypt(usuario.telefono);
        }

        if (Object.keys(updates).length > 0) {
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: updates,
          });

          console.log(`✅ Usuario cifrado: ${usuario.email}`);
          processed++;
        } else {
          console.log(`⏭️  Usuario omitido (datos ya cifrados o vacíos): ${usuario.email}`);
        }
      } catch (error) {
        console.error(`❌ Error al cifrar usuario ${usuario.email}:`, error);
        errors++;
      }
    }

    console.log('\n📈 Resumen:');
    console.log(`   ✅ Procesados: ${processed}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📊 Total: ${usuarios.length}`);
    console.log('\n✨ Proceso completado');
  } catch (error) {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

encryptExistingData();
