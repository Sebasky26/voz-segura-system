// Archivo: src/app/api/denuncias/route.ts
// Descripción: CRUD completo de denuncias
// Pantalla Principal: Operaciones CRUD
// Rúbrica: 15% - Pantalla principal con operaciones CRUD

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, generateCodigoAnonimo } from '@/lib/auth';
import {
  registrarCreacionDenuncia,
} from '@/lib/auditoria';

/**
 * Esquema de validación para crear denuncia
 * HU-01: Denuncia Anónima
 */
const crearDenunciaSchema = z.object({
  titulo: z.string().min(10, 'El título debe tener al menos 10 caracteres'),
  descripcion: z.string().min(50, 'La descripción debe tener al menos 50 caracteres'),
  categoria: z.enum([
    'ACOSO_LABORAL',
    'DISCRIMINACION',
    'FALTA_DE_PAGO',
    'ACOSO_SEXUAL',
    'VIOLACION_DERECHOS',
    'OTRO',
  ]),
  ubicacionGeneral: z.string().optional(),
});



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
 * GET /api/denuncias
 * Consultar (Read/Query/Search) denuncias
 * 
 * Query params:
 * - estado: Filtrar por estado
 * - categoria: Filtrar por categoría
 * - search: Búsqueda por título o código
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

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const categoria = searchParams.get('categoria');
    const search = searchParams.get('search');

    // Construir filtros
    const where: Record<string, unknown> = {};

    // HU-03: Supervisor solo ve casos asignados
    if (user.rol === 'SUPERVISOR') {
      where.supervisorId = user.userId;
    }

    // Si es denunciante, solo ve sus propias denuncias
    if (user.rol === 'DENUNCIANTE') {
      where.denuncianteId = user.userId;
    }

    // Filtros adicionales
    if (estado) {
      where.estado = estado;
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { codigoAnonimo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Consultar denuncias
    const denuncias = await prisma.denuncia.findMany({
      where,
      include: {
        supervisor: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        evidencias: {
          select: {
            id: true,
            nombreOriginal: true,
            tipo: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            evidencias: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // RF-02: Control de acceso - no exponer denuncianteId
    const denunciasSafe = denuncias.map((d: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(d).filter(([k]) => k !== 'denuncianteId'))
    );

    return NextResponse.json({
      success: true,
      data: denunciasSafe,
    });
  } catch (error) {
    console.error('Error al consultar denuncias:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/denuncias
 * Crear (Create) nueva denuncia
 * HU-01: Denuncia Anónima
 */
export async function POST(request: NextRequest) {
  try {
    // Para denuncias anónimas, el token es opcional
    const user = await getUserFromToken(request);

    // Parsear y validar datos
    const body = await request.json();
    const validation = crearDenunciaSchema.safeParse(body);

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

    const { titulo, descripcion, categoria, ubicacionGeneral } = validation.data;

    // RF-15 (FIA_SOS.2): Generar código anónimo único
    const codigoAnonimo = await generateCodigoAnonimo();

    // HU-01: Crear denuncia sin datos personales
    const denuncia = await prisma.denuncia.create({
      data: {
        codigoAnonimo,
        titulo,
        descripcion,
        categoria,
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        ubicacionGeneral,
        denuncianteId: user?.userId, // Opcional: si está autenticado
      },
      include: {
        supervisor: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    // RNF-S3: Registrar en auditoría
    await registrarCreacionDenuncia(user?.userId, denuncia.id, denuncia.codigoAnonimo);

    return NextResponse.json({
      success: true,
      message: 'Denuncia creada exitosamente',
      data: {
        ...denuncia,
        denuncianteId: undefined, // No exponer
      },
    });
  } catch (error) {
    console.error('Error al crear denuncia:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/denuncias/[id]
 * Se manejará en route.ts dentro de /api/denuncias/[id]/
 * Esta es solo la ruta base para GET y POST
 */