// Archivo: src/app/api/auditoria/route.ts
// Descripción: API para que el ADMIN consulte logs de auditoría
// Solo el rol ADMIN puede acceder a estos endpoints

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { consultarLogs, registrarLog, AccionAuditoria } from '@/lib/auditoria';

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
 * GET /api/auditoria
 * Consultar logs de auditoría del sistema
 * Solo accesible para ADMIN
 * 
 * Query params:
 * - usuarioId: filtrar por usuario
 * - accion: filtrar por tipo de acción
 * - tabla: filtrar por tabla afectada
 * - fechaDesde: fecha desde (ISO)
 * - fechaHasta: fecha hasta (ISO)
 * - limit: cantidad de resultados (default: 100)
 * - offset: paginación
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

    // Solo ADMIN puede ver logs de auditoría
    if (user.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Solo los administradores pueden consultar logs de auditoría' },
        { status: 403 }
      );
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId') || undefined;
    const accion = searchParams.get('accion') || undefined;
    const tabla = searchParams.get('tabla') || undefined;
    const fechaDesdeStr = searchParams.get('fechaDesde');
    const fechaHastaStr = searchParams.get('fechaHasta');
    const limitStr = searchParams.get('limit');
    const offsetStr = searchParams.get('offset');

    const fechaDesde = fechaDesdeStr ? new Date(fechaDesdeStr) : undefined;
    const fechaHasta = fechaHastaStr ? new Date(fechaHastaStr) : undefined;
    const limit = limitStr ? parseInt(limitStr) : 100;
    const offset = offsetStr ? parseInt(offsetStr) : 0;

    // Consultar logs
    const logs = await consultarLogs({
      usuarioId,
      accion,
      tabla,
      fechaDesde,
      fechaHasta,
      limit,
      offset,
    });

    // Obtener el total de registros (sin límite)
    const totalLogs = await consultarLogs({
      usuarioId,
      accion,
      tabla,
      fechaDesde,
      fechaHasta,
      limit: 999999, // Sin límite para contar todos
      offset: 0,
    });

    // Registrar que el admin consultó la auditoría
    await registrarLog({
      usuarioId: user.userId,
      accion: AccionAuditoria.CONSULTA_AUDITORIA,
      tabla: 'AuditoriaLog',
      detalles: {
        filtros: { usuarioId, accion, tabla, fechaDesde, fechaHasta },
        cantidadResultados: logs.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        limit,
        offset,
        count: logs.length,
        total: totalLogs.length,
      },
    });
  } catch (error) {
    console.error('Error al consultar logs de auditoría:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
