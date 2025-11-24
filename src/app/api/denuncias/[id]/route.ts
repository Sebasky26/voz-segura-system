// Archivo: src/app/api/denuncias/[id]/route.ts
// Descripción: Operaciones sobre una denuncia específica
// Actualizar (Update) y Borrar (Delete)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { registrarCambioEstado, registrarLog, AccionAuditoria } from '@/lib/auditoria';

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
 * Esquema para actualizar denuncia
 */
const actualizarSchema = z.object({
  titulo: z.string().min(10).optional(),
  descripcion: z.string().min(50).optional(),
  categoria: z
    .enum([
      'ACOSO_LABORAL',
      'DISCRIMINACION',
      'FALTA_DE_PAGO',
      'ACOSO_SEXUAL',
      'VIOLACION_DERECHOS',
      'OTRO',
    ])
    .optional(),
  estado: z
    .enum(['PENDIENTE', 'EN_REVISION', 'APROBADA', 'DERIVADA', 'CERRADA', 'RECHAZADA'])
    .optional(),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  supervisorId: z.string().optional(),
  comentario: z.string().optional(), // Para historial
});

/**
 * GET /api/denuncias/[id]
 * Consultar denuncia por ID
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Verificar autenticación
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const denunciaId = params.id;

    // Buscar denuncia
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
      include: {
        supervisor: {
          select: {
            id: true,
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
            tamano: true,
            createdAt: true,
          },
        },
        historial: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            estadoAnterior: true,
            estadoNuevo: true,
            comentario: true,
            realizadoPor: true,
            createdAt: true,
          },
        },
      },
    });

    if (!denuncia) {
      return NextResponse.json(
        { success: false, message: 'Denuncia no encontrada' },
        { status: 404 }
      );
    }

    // HU-03: Verificar permisos (supervisor solo ve asignadas)
    if (user.rol === 'SUPERVISOR' && denuncia.supervisorId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'No tiene permisos para ver esta denuncia' },
        { status: 403 }
      );
    }

    // Denunciante solo ve sus propias denuncias
    if (user.rol === 'DENUNCIANTE' && denuncia.denuncianteId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'No tiene permisos para ver esta denuncia' },
        { status: 403 }
      );
    }

    // RF-02: No exponer denuncianteId
    return NextResponse.json({
      success: true,
      data: {
        ...denuncia,
        denuncianteId: undefined,
      },
    });
  } catch (error) {
    console.error('Error al consultar denuncia:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/denuncias/[id]
 * Actualizar (Update) denuncia
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Verificar autenticación
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const denunciaId = params.id;

    // Buscar denuncia actual
    const denunciaActual = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
    });

    if (!denunciaActual) {
      return NextResponse.json(
        { success: false, message: 'Denuncia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.rol === 'SUPERVISOR' && denunciaActual.supervisorId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'No tiene permisos para modificar esta denuncia' },
        { status: 403 }
      );
    }

    if (user.rol === 'DENUNCIANTE') {
      return NextResponse.json(
        { success: false, message: 'Los denunciantes no pueden modificar denuncias' },
        { status: 403 }
      );
    }

    // Parsear y validar datos
    const body = await request.json();
    const validation = actualizarSchema.safeParse(body);

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

    const { estado, comentario, ...otrosDatos } = validation.data;

    // Actualizar denuncia
    const denunciaActualizada = await prisma.denuncia.update({
      where: { id: denunciaId },
      data: otrosDatos,
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

    // Si se cambió el estado, registrar en historial
    if (estado && estado !== denunciaActual.estado) {
      await registrarCambioEstado(
        user.userId,
        denunciaId,
        denunciaActual.estado,
        estado,
        comentario
      );

      // Actualizar estado
      await prisma.denuncia.update({
        where: { id: denunciaId },
        data: { estado },
      });
    }

    // Registrar modificación en auditoría
    await registrarLog({
      usuarioId: user.userId,
      accion: AccionAuditoria.MODIFICAR_DENUNCIA,
      recurso: `DENUNCIA:${denunciaId}`,
      detalles: {
        cambios: validation.data,
        timestamp: new Date().toISOString(),
      },
      exitoso: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Denuncia actualizada exitosamente',
      data: {
        ...denunciaActualizada,
        denuncianteId: undefined,
      },
    });
  } catch (error) {
    console.error('Error al actualizar denuncia:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/denuncias/[id]
 * Borrar (Delete) denuncia
 * NOTA: Solo administradores pueden eliminar
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Verificar autenticación
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo administradores pueden eliminar
    if (user.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Solo administradores pueden eliminar denuncias' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const denunciaId = params.id;

    // Verificar que existe
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
    });

    if (!denuncia) {
      return NextResponse.json(
        { success: false, message: 'Denuncia no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar (cascade eliminará evidencias e historial)
    await prisma.denuncia.delete({
      where: { id: denunciaId },
    });

    // Registrar eliminación
    await registrarLog({
      usuarioId: user.userId,
      accion: AccionAuditoria.ELIMINAR_DENUNCIA,
      recurso: `DENUNCIA:${denunciaId}`,
      detalles: {
        codigoAnonimo: denuncia.codigoAnonimo,
        timestamp: new Date().toISOString(),
      },
      exitoso: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Denuncia eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar denuncia:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}