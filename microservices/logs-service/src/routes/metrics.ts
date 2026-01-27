// Metrics Routes - Métricas de negocio y sistema

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyWithAuthService } from '../lib/auth';
import { incrementBusinessMetric } from '../lib/prometheus';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const crearMetricaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  valor: z.number(),
  unidad: z.string().optional(),
  servicio: z.string().min(1, 'El servicio es requerido'),
  categoria: z.enum(['business', 'technical', 'performance']).optional(),
});

const buscarMetricasSchema = z.object({
  nombre: z.string().optional(),
  servicio: z.string().optional(),
  categoria: z.string().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * POST /metrics/business
 * Registrar métrica de negocio
 */
router.post('/business', async (req, res) => {
  try {
    const validation = crearMetricaSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { nombre, valor, unidad, servicio, categoria } = validation.data;

    // Crear métrica de negocio
    const nuevaMetrica = await prisma.metricaNegocio.create({
      data: {
        nombre,
        valor,
        unidad: unidad || 'count',
        servicio,
        categoria: categoria || 'business',
      },
    });

    // Incrementar contador en Prometheus
    incrementBusinessMetric(nombre, servicio);

    res.status(201).json({
      success: true,
      message: 'Métrica registrada exitosamente',
      data: nuevaMetrica,
    });

  } catch (error) {
    console.error('Error registrando métrica:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * GET /metrics/business
 * Consultar métricas de negocio (solo admin)
 */
router.get('/business', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede consultar métricas
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden consultar métricas',
      });
    }

    const validation = buscarMetricasSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de búsqueda inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const {
      nombre,
      servicio,
      categoria,
      fechaInicio,
      fechaFin,
      page = 1,
      limit = 50
    } = validation.data;

    // Construir filtros
    const filtros: any = {};
    if (nombre) filtros.nombre = { contains: nombre, mode: 'insensitive' };
    if (servicio) filtros.servicio = servicio;
    if (categoria) filtros.categoria = categoria;

    // Filtro por fechas
    if (fechaInicio || fechaFin) {
      filtros.fecha = {};
      if (fechaInicio) filtros.fecha.gte = new Date(fechaInicio);
      if (fechaFin) filtros.fecha.lte = new Date(fechaFin);
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar búsqueda
    const [metricas, total] = await Promise.all([
      prisma.metricaNegocio.findMany({
        where: filtros,
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.metricaNegocio.count({ where: filtros }),
    ]);

    res.json({
      success: true,
      data: metricas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filtros: validation.data,
    });

  } catch (error) {
    console.error('Error consultando métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * GET /metrics/business/dashboard
 * Dashboard de métricas de negocio (solo admin)
 */
router.get('/business/dashboard', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede ver dashboard
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden ver el dashboard',
      });
    }

    // Obtener métricas de los últimos 30 días
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    const [
      metricasPorServicio,
      metricasPorCategoria,
      tendenciasDiarias,
      topMetricas
    ] = await Promise.all([
      // Métricas por servicio
      prisma.metricaNegocio.groupBy({
        by: ['servicio'],
        _count: { nombre: true },
        _avg: { valor: true },
        where: { fecha: { gte: fechaInicio } },
        orderBy: { _count: { nombre: 'desc' } },
      }),

      // Métricas por categoría
      prisma.metricaNegocio.groupBy({
        by: ['categoria'],
        _count: { categoria: true },
        _sum: { valor: true },
        where: { fecha: { gte: fechaInicio } },
      }),

      // Tendencias diarias (últimos 7 días)
      prisma.metricaNegocio.groupBy({
        by: ['fecha'],
        _count: { nombre: true },
        _sum: { valor: true },
        where: {
          fecha: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { fecha: 'asc' },
      }),

      // Top métricas
      prisma.metricaNegocio.groupBy({
        by: ['nombre'],
        _count: { nombre: true },
        _sum: { valor: true },
        _avg: { valor: true },
        where: { fecha: { gte: fechaInicio } },
        orderBy: { _count: { nombre: 'desc' } },
        take: 10,
      }),
    ]);

    const dashboard = {
      resumen: {
        totalMetricas: await prisma.metricaNegocio.count({
          where: { fecha: { gte: fechaInicio } },
        }),
        serviciosActivos: metricasPorServicio.length,
        categorias: metricasPorCategoria.length,
      },
      metricasPorServicio: metricasPorServicio.map(m => ({
        servicio: m.servicio,
        cantidad: m._count.nombre,
        promedio: m._avg.valor,
      })),
      metricasPorCategoria: metricasPorCategoria.map(m => ({
        categoria: m.categoria,
        cantidad: m._count.categoria,
        total: m._sum.valor,
      })),
      tendenciasDiarias: tendenciasDiarias.map(t => ({
        fecha: t.fecha,
        cantidad: t._count.nombre,
        total: t._sum.valor,
      })),
      topMetricas: topMetricas.map(t => ({
        nombre: t.nombre,
        frecuencia: t._count.nombre,
        total: t._sum.valor,
        promedio: t._avg.valor,
      })),
    };

    res.json({
      success: true,
      data: dashboard,
    });

  } catch (error) {
    console.error('Error obteniendo dashboard de métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * DELETE /metrics/business/cleanup
 * Limpiar métricas antiguas (solo admin)
 */
router.delete('/business/cleanup', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede limpiar métricas
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden limpiar métricas',
      });
    }

    const { diasAntiguedad = '180' } = req.query;
    const dias = parseInt(diasAntiguedad as string);

    if (isNaN(dias) || dias < 90) {
      return res.status(400).json({
        success: false,
        message: 'Los días de antigüedad deben ser al menos 90',
      });
    }

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    // Eliminar métricas antiguas
    const resultado = await prisma.metricaNegocio.deleteMany({
      where: {
        fecha: {
          lt: fechaLimite,
        },
      },
    });

    res.json({
      success: true,
      message: `${resultado.count} métricas antiguas eliminadas exitosamente`,
      data: {
        metricasEliminadas: resultado.count,
        fechaLimite: fechaLimite.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error limpiando métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

export default router;