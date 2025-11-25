// Archivo: src/app/api/reglas-supervisor/route.ts
// Descripción: API para gestionar reglas de asignación de supervisores
// Solo el ADMIN puede crear y modificar estas reglas

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { registrarLog, AccionAuditoria } from '@/lib/auditoria';

/**
 * Obtener usuario del token JWT
 */
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * Esquema de validación para crear regla
 */
const crearReglaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().optional(),
  categorias: z.array(z.enum([
    'ACOSO_LABORAL',
    'DISCRIMINACION',
    'FALTA_DE_PAGO',
    'ACOSO_SEXUAL',
    'VIOLACION_DERECHOS',
    'OTRO',
  ])).min(1, 'Debe seleccionar al menos una categoría'),
  prioridad: z.number().int().min(0).default(0),
  activa: z.boolean().default(true),
});

/**
 * GET /api/reglas-supervisor
 * Listar reglas de asignación de supervisores
 * Solo ADMIN puede ver las reglas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo ADMIN puede gestionar reglas
    if (user.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Solo los administradores pueden gestionar reglas de supervisores' },
        { status: 403 }
      );
    }

    // Obtener todas las reglas
    const reglas = await prisma.reglaSupervisor.findMany({
      orderBy: [
        { prioridad: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: reglas,
    });
  } catch (error) {
    console.error('Error al obtener reglas:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reglas-supervisor
 * Crear nueva regla de asignación de supervisor
 * Solo ADMIN puede crear reglas
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo ADMIN puede crear reglas
    if (user.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Solo los administradores pueden crear reglas de supervisores' },
        { status: 403 }
      );
    }

    // Validar datos
    const body = await request.json();
    const validation = crearReglaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos inválidos',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nombre, descripcion, categorias, prioridad, activa } = validation.data;

    // Crear regla
    const regla = await prisma.reglaSupervisor.create({
      data: {
        nombre,
        descripcion,
        categorias,
        prioridad,
        activa,
      },
    });

    // Registrar auditoría
    await registrarLog({
      usuarioId: user.userId,
      accion: AccionAuditoria.CREAR_REGLA_SUPERVISOR,
      tabla: 'ReglaSupervisor',
      registroId: regla.id,
      detalles: { nombre, categorias, prioridad },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Regla creada exitosamente',
      data: regla,
    });
  } catch (error) {
    console.error('Error al crear regla:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
