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
 * Esquema de validación para crear mensaje
 */
const crearMensajeSchema = z.object({
  denunciaId: z.string().uuid(),
  mensaje: z.string().min(1, 'El mensaje no puede estar vacío'),
});

/**
 * GET /api/chat?denunciaId=xxx
 * Obtener mensajes de una denuncia
 * Solo el denunciante y el supervisor asignado pueden ver los mensajes
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

    const { searchParams } = new URL(request.url);
    const denunciaId = searchParams.get('denunciaId');

    if (!denunciaId) {
      return NextResponse.json(
        { success: false, message: 'denunciaId es requerido' },
        { status: 400 }
      );
    }

    // Buscar la denuncia
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
      select: {
        id: true,
        denuncianteId: true,
        supervisorId: true,
      },
    });

    if (!denuncia) {
      return NextResponse.json(
        { success: false, message: 'Denuncia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el denunciante o el supervisor asignado
    const esParticipante = 
      (user.rol === 'DENUNCIANTE' && denuncia.denuncianteId === user.userId) ||
      (user.rol === 'SUPERVISOR' && denuncia.supervisorId === user.userId);

    if (!esParticipante) {
      return NextResponse.json(
        { success: false, message: 'No tienes permiso para ver estos mensajes' },
        { status: 403 }
      );
    }

    // Obtener mensajes
    const mensajes = await prisma.mensajeChat.findMany({
      where: { denunciaId },
      select: {
        id: true,
        mensaje: true,
        esAnonimo: true,
        createdAt: true,
        usuario: {
          select: {
            id: true,
            rol: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Formatear respuesta ocultando identidades reales
    const mensajesAnonimos = mensajes.map(m => ({
      id: m.id,
      mensaje: m.mensaje,
      rol: m.usuario.rol, // Solo mostramos si es DENUNCIANTE o SUPERVISOR
      esPropio: m.usuario.id === user.userId,
      createdAt: m.createdAt,
    }));

    // Registrar auditoría
    await registrarLog({
      usuarioId: user.userId,
      accion: AccionAuditoria.VER_MENSAJES,
      tabla: 'MensajeChat',
      registroId: denunciaId,
      detalles: { denunciaId },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ 
      success: true, 
      mensajes: mensajesAnonimos 
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat
 * Enviar mensaje en una denuncia
 * Solo el denunciante y el supervisor asignado pueden enviar mensajes
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

    // Validar datos
    const body = await request.json();
    const validation = crearMensajeSchema.safeParse(body);

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

    const { denunciaId, mensaje } = validation.data;

    // Buscar la denuncia
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
      select: {
        id: true,
        denuncianteId: true,
        supervisorId: true,
      },
    });

    if (!denuncia) {
      return NextResponse.json(
        { success: false, message: 'Denuncia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el denunciante o el supervisor asignado
    const esParticipante = 
      (user.rol === 'DENUNCIANTE' && denuncia.denuncianteId === user.userId) ||
      (user.rol === 'SUPERVISOR' && denuncia.supervisorId === user.userId);

    if (!esParticipante) {
      return NextResponse.json(
        { success: false, message: 'No tienes permiso para enviar mensajes en esta denuncia' },
        { status: 403 }
      );
    }

    // Crear mensaje
    const nuevoMensaje = await prisma.mensajeChat.create({
      data: {
        denunciaId,
        usuarioId: user.userId,
        mensaje,
        esAnonimo: true,
      },
      select: {
        id: true,
        mensaje: true,
        esAnonimo: true,
        createdAt: true,
        usuario: {
          select: {
            id: true,
            rol: true,
          },
        },
      },
    });

    // Registrar auditoría
    await registrarLog({
      usuarioId: user.userId,
      accion: AccionAuditoria.ENVIAR_MENSAJE,
      tabla: 'MensajeChat',
      registroId: nuevoMensaje.id,
      detalles: { denunciaId },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Respuesta anónima
    return NextResponse.json({ 
      success: true, 
      mensaje: {
        id: nuevoMensaje.id,
        mensaje: nuevoMensaje.mensaje,
        rol: nuevoMensaje.usuario.rol,
        esPropio: true,
        createdAt: nuevoMensaje.createdAt,
      }
    });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

