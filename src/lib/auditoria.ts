// Archivo: src/lib/auditoria.ts
// Descripción: Sistema de logs y auditoría
// Cumple con RNF-S3, RNF-S5 (Auditoría y trazabilidad)

import { prisma } from './prisma';

/**
 * Tipos de acciones auditables
 */
export enum AccionAuditoria {
  // Autenticación
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FALLIDO = 'LOGIN_FALLIDO',
  CAMBIO_PASSWORD = 'CAMBIO_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',

  // Denuncias
  CREAR_DENUNCIA = 'CREAR_DENUNCIA',
  MODIFICAR_DENUNCIA = 'MODIFICAR_DENUNCIA',
  ELIMINAR_DENUNCIA = 'ELIMINAR_DENUNCIA',
  VER_DENUNCIA = 'VER_DENUNCIA',
  LISTAR_DENUNCIAS = 'LISTAR_DENUNCIAS',
  CAMBIO_ESTADO_DENUNCIA = 'CAMBIO_ESTADO_DENUNCIA',
  ASIGNAR_DENUNCIA = 'ASIGNAR_DENUNCIA',
  DERIVAR_DENUNCIA = 'DERIVAR_DENUNCIA',

  // Chat (para denunciante y supervisor)
  ENVIAR_MENSAJE = 'ENVIAR_MENSAJE',
  VER_MENSAJES = 'VER_MENSAJES',

  // Evidencias
  SUBIR_EVIDENCIA = 'SUBIR_EVIDENCIA',
  VER_EVIDENCIA = 'VER_EVIDENCIA',
  ELIMINAR_EVIDENCIA = 'ELIMINAR_EVIDENCIA',

  // Usuarios
  CREAR_USUARIO = 'CREAR_USUARIO',
  MODIFICAR_USUARIO = 'MODIFICAR_USUARIO',
  ELIMINAR_USUARIO = 'ELIMINAR_USUARIO',
  BLOQUEAR_USUARIO = 'BLOQUEAR_USUARIO',

  // Sistema
  ACCESO_ADMIN = 'ACCESO_ADMIN',
  CAMBIO_CONFIGURACION = 'CAMBIO_CONFIGURACION',
  CONSULTA_AUDITORIA = 'CONSULTA_AUDITORIA',
  CREAR_REGLA_SUPERVISOR = 'CREAR_REGLA_SUPERVISOR',
  MODIFICAR_REGLA_SUPERVISOR = 'MODIFICAR_REGLA_SUPERVISOR',
}

/**
 * Interfaz para los datos del log
 */
interface LogData {
  usuarioId?: string | null;
  accion: AccionAuditoria | string;
  tabla?: string;
  registroId?: string;
  recurso?: string;
  detalles?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  exitoso?: boolean;
}

/**
 * RNF-S3: Registrar evento en el sistema de auditoría
 * Todos los eventos críticos quedan registrados para trazabilidad
 * 
 * @param data - Datos del evento a registrar
 * @returns Log creado
 */
export async function registrarLog(data: LogData) {
  try {
    return await prisma.auditoriaLog.create({
      data: {
        usuarioId: data.usuarioId || null,
        accion: data.accion,
        tabla: data.tabla || null,
        registroId: data.registroId || null,
        recurso: data.recurso || null,
        detalles: data.detalles ? JSON.stringify(data.detalles) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        exitoso: data.exitoso !== undefined ? data.exitoso : true,
      },
    });
  } catch (error) {
    // En caso de error, log en consola (no debe fallar la operación principal)
    console.error('Error al registrar log de auditoría:', error);
    return null;
  }
}

/**
 * Registrar login exitoso
 */
export async function registrarLoginExitoso(
  usuarioId: string,
  ipAddress?: string,
  userAgent?: string
) {
  return registrarLog({
    usuarioId,
    accion: AccionAuditoria.LOGIN,
    recurso: 'AUTENTICACION',
    detalles: {
      metodo: 'credenciales',
      timestamp: new Date().toISOString(),
    },
    ipAddress,
    userAgent,
    exitoso: true,
  });
}

/**
 * Registrar login fallido
 */
export async function registrarLoginFallido(
  email: string,
  razon: string,
  ipAddress?: string,
  userAgent?: string
) {
  return registrarLog({
    usuarioId: null,
    accion: AccionAuditoria.LOGIN_FALLIDO,
    recurso: 'AUTENTICACION',
    detalles: {
      email,
      razon,
      timestamp: new Date().toISOString(),
    },
    ipAddress,
    userAgent,
    exitoso: false,
  });
}

/**
 * Registrar creación de denuncia
 */
export async function registrarCreacionDenuncia(
  usuarioId: string | undefined,
  denunciaId: string,
  codigoAnonimo: string
) {
  return registrarLog({
    usuarioId: usuarioId || null,
    accion: AccionAuditoria.CREAR_DENUNCIA,
    recurso: `DENUNCIA:${denunciaId}`,
    detalles: {
      codigoAnonimo,
      timestamp: new Date().toISOString(),
    },
    exitoso: true,
  });
}

/**
 * Registrar cambio de estado de denuncia (para HU-04: Historial)
 */
export async function registrarCambioEstado(
  usuarioId: string,
  denunciaId: string,
  estadoAnterior: string,
  estadoNuevo: string,
  comentario?: string
) {
  // Crear entrada en el historial de la denuncia
  await prisma.historialDenuncia.create({
    data: {
      denunciaId,
      estadoAnterior: estadoAnterior as 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'DERIVADA' | 'CERRADA' | 'RECHAZADA',
      estadoNuevo: estadoNuevo as 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'DERIVADA' | 'CERRADA' | 'RECHAZADA',
      comentario: comentario || null,
      realizadoPor: usuarioId,
    },
  });

  // Registrar en auditoría general
  return registrarLog({
    usuarioId,
    accion: AccionAuditoria.CAMBIO_ESTADO_DENUNCIA,
    recurso: `DENUNCIA:${denunciaId}`,
    detalles: {
      estadoAnterior,
      estadoNuevo,
      comentario,
      timestamp: new Date().toISOString(),
    },
    exitoso: true,
  });
}

/**
 * Registrar asignación de denuncia a supervisor
 */
export async function registrarAsignacionDenuncia(
  adminId: string,
  denunciaId: string,
  supervisorId: string
) {
  return registrarLog({
    usuarioId: adminId,
    accion: AccionAuditoria.ASIGNAR_DENUNCIA,
    recurso: `DENUNCIA:${denunciaId}`,
    detalles: {
      supervisorAsignado: supervisorId,
      timestamp: new Date().toISOString(),
    },
    exitoso: true,
  });
}

/**
 * Registrar derivación de denuncia a institución externa (HU-06)
 */
export async function registrarDerivacionDenuncia(
  supervisorId: string,
  denunciaId: string,
  institucion: string
) {
  return registrarLog({
    usuarioId: supervisorId,
    accion: AccionAuditoria.DERIVAR_DENUNCIA,
    recurso: `DENUNCIA:${denunciaId}`,
    detalles: {
      institucion,
      timestamp: new Date().toISOString(),
    },
    exitoso: true,
  });
}

/**
 * Registrar subida de evidencia (HU-07)
 */
export async function registrarSubidaEvidencia(
  usuarioId: string | undefined,
  denunciaId: string,
  evidenciaId: string,
  nombreArchivo: string
) {
  return registrarLog({
    usuarioId: usuarioId || null,
    accion: AccionAuditoria.SUBIR_EVIDENCIA,
    recurso: `EVIDENCIA:${evidenciaId}`,
    detalles: {
      denunciaId,
      nombreArchivo,
      timestamp: new Date().toISOString(),
    },
    exitoso: true,
  });
}

/**
 * Registrar acceso a evidencia (para detectar accesos no autorizados)
 */
export async function registrarAccesoEvidencia(
  usuarioId: string,
  evidenciaId: string,
  denunciaId: string
) {
  return registrarLog({
    usuarioId,
    accion: AccionAuditoria.VER_EVIDENCIA,
    recurso: `EVIDENCIA:${evidenciaId}`,
    detalles: {
      denunciaId,
      timestamp: new Date().toISOString(),
    },
    exitoso: true,
  });
}

/**
 * Consultar logs de auditoría (solo para administradores)
 * RNF-S3: Disponibilidad de consulta por auditor autorizado
 * 
 * @param filtros - Filtros de búsqueda
 * @returns Logs encontrados
 */
export async function consultarLogs(filtros: {
  usuarioId?: string;
  accion?: string;
  tabla?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filtros.usuarioId) {
    where.usuarioId = filtros.usuarioId;
  }

  if (filtros.accion) {
    where.accion = filtros.accion;
  }

  if (filtros.tabla) {
    where.tabla = filtros.tabla;
  }

  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.createdAt = {} as { gte?: Date; lte?: Date };
    if (filtros.fechaDesde) {
      (where.createdAt as { gte?: Date; lte?: Date }).gte = filtros.fechaDesde;
    }
    if (filtros.fechaHasta) {
      (where.createdAt as { gte?: Date; lte?: Date }).lte = filtros.fechaHasta;
    }
  }

  return prisma.auditoriaLog.findMany({
    where,
    include: {
      usuario: {
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          rol: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filtros.limit || 100,
    skip: filtros.offset || 0,
  });
}

/**
 * Función auxiliar para asignar supervisor según reglas
 */
export async function asignarSupervisorAutomatico(categoria: string): Promise<string | null> {
  // Buscar reglas activas para esta categoría
  const reglas = await prisma.reglaSupervisor.findMany({
    where: {
      activa: true,
      categorias: { has: categoria as 'ACOSO_LABORAL' | 'DISCRIMINACION' | 'FALTA_DE_PAGO' | 'ACOSO_SEXUAL' | 'VIOLACION_DERECHOS' | 'OTRO' },
    },
    orderBy: { prioridad: 'desc' },
  });

  // Si no hay reglas, asignar al supervisor con menos casos activos
  const supervisores = await prisma.usuario.findMany({
    where: { 
      rol: 'SUPERVISOR', 
      estado: 'ACTIVO' 
    },
    include: {
      denunciasAsignadas: {
        where: {
          estado: { in: ['PENDIENTE', 'EN_REVISION'] },
        },
      },
    },
  });

  if (supervisores.length === 0) return null;

  // Asignar al supervisor con menos casos activos
  const supervisorMenosCarga = supervisores.sort((a, b) => 
    a.denunciasAsignadas.length - b.denunciasAsignadas.length
  )[0];

  return supervisorMenosCarga.id;
}