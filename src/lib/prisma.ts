// Archivo: src/lib/prisma.ts
// Descripción: Cliente singleton de Prisma para Next.js
// Evita múltiples instancias del cliente en desarrollo

import { PrismaClient } from '@prisma/client';

/**
 * Extensión global de TypeScript para almacenar el cliente
 */
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Cliente de Prisma con configuración optimizada
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

/**
 * En desarrollo, guardamos la instancia en global para evitar
 * múltiples conexiones durante hot-reload
 */
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;