// Logs Routes - Sistema de auditoría migrado del proyecto original
// Endpoints: /logs/audit, /logs/search, /logs/stats

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyWithAuthService } from '../lib/auth';
import { incrementAuditLogMetric, incrementBusinessMetric } from '../lib/prometheus';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const crearLogSchema = z.object({
  usuarioId: z.string().uuid().nullish(),  // nullish = null | undefined
  accion: z.string().min(1, 'La acción es requerida'),
  servicio: z.string().nullish(),
  recurso: z.string().nullish(),
  detalles: z.string().nullish(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  exitoso: z.boolean().nullish(),
  tabla: z.string().nullish(),
  registroId: z.string().nullish(),
});

const buscarLogsSchema = z.object({
  usuarioId: z.string().uuid().optional(),
  accion: z.string().optional(),
  servicio: z.string().optional(),
  tabla: z.string().optional(),
  exitoso: z.boolean().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * POST /logs/audit
 * Crear nuevo log de auditoría (usado por otros microservicios)
 */
router.post('/audit', async (req, res) => {
  try {
    const validation = crearLogSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const {
      usuarioId,
      accion,
      servicio,
      recurso,
      detalles,
      ipAddress,
      userAgent,
      exitoso,
      tabla,
      registroId
    } = validation.data;

    // Crear log de auditoría
    const nuevoLog = await prisma.auditoriaLog.create({
      data: {
        usuarioId: usuarioId || null,
        accion,
        servicio: servicio || 'unknown',
        recurso: recurso || null,
        detalles: detalles || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        exitoso: exitoso !== undefined ? exitoso : true,
        tabla: tabla || null,
        registroId: registroId || null,
      },
    });

    // Incrementar métricas de Prometheus
    incrementAuditLogMetric(accion, servicio || 'unknown', exitoso !== false);

    res.status(201).json({
      success: true,
      message: 'Log de auditoría creado exitosamente',
      data: nuevoLog,
    });

  } catch (error) {
    console.error('Error creando log de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * GET /logs/audit
 * Buscar y filtrar logs de auditoría (solo admin)
 */
router.get('/audit', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede consultar logs de auditoría
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden consultar logs de auditoría',
      });
    }

    const validation = buscarLogsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de búsqueda inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const {
      usuarioId,
      accion,
      servicio,
      tabla,
      exitoso,
      fechaInicio,
      fechaFin,
      page = 1,
      limit = 50
    } = validation.data;

    // Construir filtros
    const filtros: any = {};
    if (usuarioId) filtros.usuarioId = usuarioId;
    if (accion) filtros.accion = { contains: accion, mode: 'insensitive' };
    if (servicio) filtros.servicio = servicio;
    if (tabla) filtros.tabla = tabla;
    if (exitoso !== undefined) filtros.exitoso = exitoso;

    // Filtro por fechas
    if (fechaInicio || fechaFin) {
      filtros.createdAt = {};
      if (fechaInicio) filtros.createdAt.gte = new Date(fechaInicio);
      if (fechaFin) filtros.createdAt.lte = new Date(fechaFin);
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar búsqueda
    const [logs, total] = await Promise.all([
      prisma.auditoriaLog.findMany({
        where: filtros,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditoriaLog.count({ where: filtros }),
    ]);

    // Log de consulta de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: user.userId,
        accion: 'CONSULTA_AUDITORIA',
        servicio: 'logs-service',
        tabla: 'auditoria_logs',
        detalles: JSON.stringify({
          filtros,
          resultados: logs.length,
          total,
        }),
        exitoso: true,
      },
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filtros: validation.data,
    });

  } catch (error) {
    console.error('Error buscando logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * GET /logs/stats
 * Estadísticas de logs de auditoría (solo admin)
 */
router.get('/stats', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede ver estadísticas
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden ver estadísticas',
      });
    }

    // Estadísticas generales
    const [
      totalLogs,
      logsExitosos,
      logsFallidos,
      acciones,
      servicios,
      usuarios,
      ultimosMensajes
    ] = await Promise.all([
      // Total de logs
      prisma.auditoriaLog.count(),
      
      // Logs exitosos
      prisma.auditoriaLog.count({ where: { exitoso: true } }),
      
      // Logs fallidos
      prisma.auditoriaLog.count({ where: { exitoso: false } }),
      
      // Top acciones
      prisma.auditoriaLog.groupBy({
        by: ['accion'],
        _count: { accion: true },
        orderBy: { _count: { accion: 'desc' } },
        take: 10,
      }),
      
      // Logs por servicio
      prisma.auditoriaLog.groupBy({
        by: ['servicio'],
        _count: { servicio: true },
        orderBy: { _count: { servicio: 'desc' } },
        take: 5,
      }),
      
      // Usuarios más activos
      prisma.auditoriaLog.groupBy({
        by: ['usuarioId'],
        _count: { usuarioId: true },
        where: { usuarioId: { not: null } },
        orderBy: { _count: { usuarioId: 'desc' } },
        take: 10,
      }),
      
      // Últimos 10 logs
      prisma.auditoriaLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          accion: true,
          servicio: true,
          exitoso: true,
          createdAt: true,
        },
      }),
    ]);

    const stats = {
      resumen: {
        totalLogs,
        logsExitosos,
        logsFallidos,
        tasaExito: totalLogs > 0 ? ((logsExitosos / totalLogs) * 100).toFixed(2) + '%' : '0%',
      },
      topAcciones: acciones.map(a => ({
        accion: a.accion,
        cantidad: a._count.accion,
      })),
      logsPorServicio: servicios.map(s => ({
        servicio: s.servicio,
        cantidad: s._count.servicio,
      })),
      usuariosMasActivos: usuarios.map(u => ({
        usuarioId: u.usuarioId,
        cantidad: u._count.usuarioId,
      })),
      ultimosLogs: ultimosMensajes,
    };

    // Incrementar métrica de consulta de estadísticas
    incrementBusinessMetric('audit_stats_consulted', 'logs-service');

    res.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * DELETE /logs/audit/cleanup
 * Limpiar logs antiguos (solo admin)
 */
router.delete('/audit/cleanup', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede limpiar logs
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden limpiar logs',
      });
    }

    const { diasAntiguedad = '90' } = req.query;
    const dias = parseInt(diasAntiguedad as string);

    if (isNaN(dias) || dias < 30) {
      return res.status(400).json({
        success: false,
        message: 'Los días de antigüedad deben ser al menos 30',
      });
    }

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    // Eliminar logs antiguos
    const resultado = await prisma.auditoriaLog.deleteMany({
      where: {
        createdAt: {
          lt: fechaLimite,
        },
      },
    });

    // Log de la limpieza
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: user.userId,
        accion: 'LIMPIEZA_LOGS',
        servicio: 'logs-service',
        tabla: 'auditoria_logs',
        detalles: JSON.stringify({
          diasAntiguedad: dias,
          logsEliminados: resultado.count,
          fechaLimite: fechaLimite.toISOString(),
        }),
        exitoso: true,
      },
    });

    res.json({
      success: true,
      message: `${resultado.count} logs antiguos eliminados exitosamente`,
      data: {
        logsEliminados: resultado.count,
        fechaLimite: fechaLimite.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error limpiando logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

export default router;