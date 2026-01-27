"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../lib/auth");
const prometheus_1 = require("../lib/prometheus");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const crearMetricaSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido'),
    valor: zod_1.z.number(),
    unidad: zod_1.z.string().optional(),
    servicio: zod_1.z.string().min(1, 'El servicio es requerido'),
    categoria: zod_1.z.enum(['business', 'technical', 'performance']).optional(),
});
const buscarMetricasSchema = zod_1.z.object({
    nombre: zod_1.z.string().optional(),
    servicio: zod_1.z.string().optional(),
    categoria: zod_1.z.string().optional(),
    fechaInicio: zod_1.z.string().datetime().optional(),
    fechaFin: zod_1.z.string().datetime().optional(),
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
});
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
        const nuevaMetrica = await prisma.metricaNegocio.create({
            data: {
                nombre,
                valor,
                unidad: unidad || 'count',
                servicio,
                categoria: categoria || 'business',
            },
        });
        (0, prometheus_1.incrementBusinessMetric)(nombre, servicio);
        res.status(201).json({
            success: true,
            message: 'Métrica registrada exitosamente',
            data: nuevaMetrica,
        });
    }
    catch (error) {
        console.error('Error registrando métrica:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.get('/business', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
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
        const { nombre, servicio, categoria, fechaInicio, fechaFin, page = 1, limit = 50 } = validation.data;
        const filtros = {};
        if (nombre)
            filtros.nombre = { contains: nombre, mode: 'insensitive' };
        if (servicio)
            filtros.servicio = servicio;
        if (categoria)
            filtros.categoria = categoria;
        if (fechaInicio || fechaFin) {
            filtros.fecha = {};
            if (fechaInicio)
                filtros.fecha.gte = new Date(fechaInicio);
            if (fechaFin)
                filtros.fecha.lte = new Date(fechaFin);
        }
        const skip = (page - 1) * limit;
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
    }
    catch (error) {
        console.error('Error consultando métricas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.get('/business/dashboard', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        if (user.rol !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden ver el dashboard',
            });
        }
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        const [metricasPorServicio, metricasPorCategoria, tendenciasDiarias, topMetricas] = await Promise.all([
            prisma.metricaNegocio.groupBy({
                by: ['servicio'],
                _count: { nombre: true },
                _avg: { valor: true },
                where: { fecha: { gte: fechaInicio } },
                orderBy: { _count: { nombre: 'desc' } },
            }),
            prisma.metricaNegocio.groupBy({
                by: ['categoria'],
                _count: { categoria: true },
                _sum: { valor: true },
                where: { fecha: { gte: fechaInicio } },
            }),
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
    }
    catch (error) {
        console.error('Error obteniendo dashboard de métricas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.delete('/business/cleanup', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        if (user.rol !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden limpiar métricas',
            });
        }
        const { diasAntiguedad = '180' } = req.query;
        const dias = parseInt(diasAntiguedad);
        if (isNaN(dias) || dias < 90) {
            return res.status(400).json({
                success: false,
                message: 'Los días de antigüedad deben ser al menos 90',
            });
        }
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);
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
    }
    catch (error) {
        console.error('Error limpiando métricas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map