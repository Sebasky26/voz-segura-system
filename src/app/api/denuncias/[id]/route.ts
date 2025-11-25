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
  ubicacionGeneral: z.string().optional(), // Campo de ubicación general
  supervisorId: z.string().optional(),
  comentario: z.string().optional(), // Para historial
});

/**
 * GET /api/denuncias/[id]
 * Consultar denuncia por ID
 * Permisos:
 * - DENUNCIANTE: solo sus propias denuncias
 * - SUPERVISOR: solo denuncias asignadas (sin datos del denunciante)
 * - ADMIN: todas las denuncias (sin datos del denunciante)
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

    // Verificar permisos según rol
    if (user.rol === 'SUPERVISOR' && denuncia.supervisorId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'No tiene permisos para ver esta denuncia' },
        { status: 403 }
      );
    }

    if (user.rol === 'DENUNCIANTE' && denuncia.denuncianteId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'No tiene permisos para ver esta denuncia' },
        { status: 403 }
      );
    }

    // Registrar auditoría
    await registrarLog({
      usuarioId: user.userId,
      accion: AccionAuditoria.VER_DENUNCIA,
      tabla: 'Denuncia',
      registroId: denunciaId,
      detalles: { rol: user.rol },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // No exponer denuncianteId a supervisor ni admin
    const denunciaResponse = user.rol === 'DENUNCIANTE' 
      ? denuncia 
      : { ...denuncia, denuncianteId: undefined, denunciante: undefined };

    return NextResponse.json({
      success: true,
      data: denunciaResponse,
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
 * Permisos:
 * - DENUNCIANTE: puede actualizar sus propias denuncias (título, descripción, categoría, ubicación)
 * - SUPERVISOR: solo puede cambiar el estado de denuncias asignadas
 * - ADMIN: no puede modificar denuncias
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

    // Admin no puede modificar denuncias
    if (user.rol === 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Los administradores no pueden modificar denuncias' },
        { status: 403 }
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

    // Parsear datos
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

    const { estado, comentario, supervisorId, ...otrosDatos } = validation.data;

    // Verificar permisos según rol
    if (user.rol === 'SUPERVISOR') {
      // Supervisor solo puede cambiar estado de denuncias asignadas
      if (denunciaActual.supervisorId !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'No tiene permisos para modificar esta denuncia' },
          { status: 403 }
        );
      }

      // Supervisor solo puede cambiar estado
      if (Object.keys(otrosDatos).length > 0 || supervisorId) {
        return NextResponse.json(
          { success: false, message: 'Los supervisores solo pueden cambiar el estado' },
          { status: 403 }
        );
      }

      if (!estado) {
        return NextResponse.json(
          { success: false, message: 'Debe proporcionar un estado' },
          { status: 400 }
        );
      }

      // Cambiar estado y registrar en historial
      await prisma.denuncia.update({
        where: { id: denunciaId },
        data: { estado },
      });

      await registrarCambioEstado(
        user.userId,
        denunciaId,
        denunciaActual.estado,
        estado,
        comentario
      );

      return NextResponse.json({
        success: true,
        message: 'Estado actualizado exitosamente',
      });
    }

    // Denunciante puede actualizar sus propias denuncias
    if (user.rol === 'DENUNCIANTE') {
      if (denunciaActual.denuncianteId !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'Solo puedes modificar tus propias denuncias' },
          { status: 403 }
        );
      }

      // Denunciante no puede cambiar estado ni supervisor
      if (estado || supervisorId) {
        return NextResponse.json(
          { success: false, message: 'No tienes permisos para cambiar el estado o supervisor' },
          { status: 403 }
        );
      }

      // Actualizar denuncia
      const denunciaActualizada = await prisma.denuncia.update({
        where: { id: denunciaId },
        data: otrosDatos,
      });

      // Registrar modificación en auditoría
      await registrarLog({
        usuarioId: user.userId,
        accion: AccionAuditoria.MODIFICAR_DENUNCIA,
        tabla: 'Denuncia',
        registroId: denunciaId,
        recurso: `DENUNCIA:${denunciaId}`,
        detalles: { cambios: otrosDatos },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({
        success: true,
        message: 'Denuncia actualizada exitosamente',
        data: denunciaActualizada,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Operación no permitida' },
      { status: 403 }
    );
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
 * Solo el DENUNCIANTE puede eliminar sus propias denuncias
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

    // Solo el denunciante puede eliminar sus propias denuncias
    if (user.rol !== 'DENUNCIANTE' || denuncia.denuncianteId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'Solo puedes eliminar tus propias denuncias' },
        { status: 403 }
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
      tabla: 'Denuncia',
      registroId: denunciaId,
      recurso: `DENUNCIA:${denunciaId}`,
      detalles: { codigoAnonimo: denuncia.codigoAnonimo },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
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