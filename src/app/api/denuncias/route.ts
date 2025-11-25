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
  registrarLog,
  AccionAuditoria,
  asignarSupervisorAutomatico,
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
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']),
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
 * Permisos:
 * - DENUNCIANTE: solo sus propias denuncias
 * - SUPERVISOR: solo denuncias asignadas, sin ver datos del denunciante
 * - ADMIN: todas las denuncias, sin ver datos del denunciante
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

    // Construir filtros según rol
    const where: Record<string, unknown> = {};

    // Supervisor solo ve casos asignados
    if (user.rol === 'SUPERVISOR') {
      where.supervisorId = user.userId;
    }

    // Denunciante solo ve sus propias denuncias
    if (user.rol === 'DENUNCIANTE') {
      where.denuncianteId = user.userId;
    }

    // Admin ve todas pero sin datos personales

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

    // Seleccionar campos según rol
    const select: Record<string, unknown> = {
      id: true,
      codigoAnonimo: true,
      titulo: true,
      descripcion: true,
      categoria: true,
      estado: true,
      prioridad: true,
      ubicacionGeneral: true,
      derivadaA: true,
      fechaDerivacion: true,
      createdAt: true,
      updatedAt: true,
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
    };

    // Solo el denunciante puede ver sus propios datos
    if (user.rol === 'DENUNCIANTE') {
      select.denuncianteId = true;
      select.denunciante = {
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
        },
      };
    }

    // Consultar denuncias
    const denuncias = await prisma.denuncia.findMany({
      where,
      select,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Registrar auditoría
    await registrarLog({
      usuarioId: user.userId,
      accion: AccionAuditoria.LISTAR_DENUNCIAS,
      tabla: 'Denuncia',
      detalles: { 
        rol: user.rol,
        filtros: { estado, categoria, search }
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: denuncias,
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
 * Solo el DENUNCIANTE puede crear denuncias
 * HU-01: Denuncia Anónima
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromToken(request);
    
    // Solo denunciantes pueden crear denuncias
    if (user && user.rol !== 'DENUNCIANTE') {
      return NextResponse.json(
        { success: false, message: 'Solo los denunciantes pueden crear denuncias' },
        { status: 403 }
      );
    }

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

    const { titulo, descripcion, categoria, prioridad, ubicacionGeneral } = validation.data;

    // Generar código anónimo único
    const codigoAnonimo = await generateCodigoAnonimo();

    // Asignar supervisor automáticamente según reglas
    const supervisorId = await asignarSupervisorAutomatico(categoria);

    // Crear denuncia
    const denuncia = await prisma.denuncia.create({
      data: {
        codigoAnonimo,
        titulo,
        descripcion,
        categoria,
        estado: 'PENDIENTE',
        prioridad,
        ubicacionGeneral,
        denuncianteId: user?.userId,
        supervisorId,
      },
      select: {
        id: true,
        codigoAnonimo: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        estado: true,
        prioridad: true,
        ubicacionGeneral: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Registrar en auditoría
    await registrarCreacionDenuncia(user?.userId, denuncia.id, denuncia.codigoAnonimo);

    return NextResponse.json({
      success: true,
      message: 'Denuncia creada exitosamente',
      data: denuncia,
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