"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../lib/auth");
const prometheus_1 = require("../lib/prometheus");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const crearLogSchema = zod_1.z.object({
    usuarioId: zod_1.z.string().uuid().optional(),
    accion: zod_1.z.string().min(1, 'La acción es requerida'),
    servicio: zod_1.z.string().optional(),
    recurso: zod_1.z.string().optional(),
    detalles: zod_1.z.string().optional(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    exitoso: zod_1.z.boolean().optional(),
    tabla: zod_1.z.string().optional(),
    registroId: zod_1.z.string().optional(),
});
const buscarLogsSchema = zod_1.z.object({
    usuarioId: zod_1.z.string().uuid().optional(),
    accion: zod_1.z.string().optional(),
    servicio: zod_1.z.string().optional(),
    tabla: zod_1.z.string().optional(),
    exitoso: zod_1.z.boolean().optional(),
    fechaInicio: zod_1.z.string().datetime().optional(),
    fechaFin: zod_1.z.string().datetime().optional(),
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
});
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
        const { usuarioId, accion, servicio, recurso, detalles, ipAddress, userAgent, exitoso, tabla, registroId } = validation.data;
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
        (0, prometheus_1.incrementAuditLogMetric)(accion, servicio || 'unknown', exitoso !== false);
        res.status(201).json({
            success: true,
            message: 'Log de auditoría creado exitosamente',
            data: nuevoLog,
        });
    }
    catch (error) {
        console.error('Error creando log de auditoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.get('/audit', async (req, res) => {
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
        const { usuarioId, accion, servicio, tabla, exitoso, fechaInicio, fechaFin, page = 1, limit = 50 } = validation.data;
        const filtros = {};
        if (usuarioId)
            filtros.usuarioId = usuarioId;
        if (accion)
            filtros.accion = { contains: accion, mode: 'insensitive' };
        if (servicio)
            filtros.servicio = servicio;
        if (tabla)
            filtros.tabla = tabla;
        if (exitoso !== undefined)
            filtros.exitoso = exitoso;
        if (fechaInicio || fechaFin) {
            filtros.createdAt = {};
            if (fechaInicio)
                filtros.createdAt.gte = new Date(fechaInicio);
            if (fechaFin)
                filtros.createdAt.lte = new Date(fechaFin);
        }
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma.auditoriaLog.findMany({
                where: filtros,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.auditoriaLog.count({ where: filtros }),
        ]);
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
    }
    catch (error) {
        console.error('Error buscando logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.get('/stats', async (req, res) => {
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
                message: 'Solo los administradores pueden ver estadísticas',
            });
        }
        const [totalLogs, logsExitosos, logsFallidos, acciones, servicios, usuarios, ultimosMensajes] = await Promise.all([
            prisma.auditoriaLog.count(),
            prisma.auditoriaLog.count({ where: { exitoso: true } }),
            prisma.auditoriaLog.count({ where: { exitoso: false } }),
            prisma.auditoriaLog.groupBy({
                by: ['accion'],
                _count: { accion: true },
                orderBy: { _count: { accion: 'desc' } },
                take: 10,
            }),
            prisma.auditoriaLog.groupBy({
                by: ['servicio'],
                _count: { servicio: true },
                orderBy: { _count: { servicio: 'desc' } },
                take: 5,
            }),
            prisma.auditoriaLog.groupBy({
                by: ['usuarioId'],
                _count: { usuarioId: true },
                where: { usuarioId: { not: null } },
                orderBy: { _count: { usuarioId: 'desc' } },
                take: 10,
            }),
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
        (0, prometheus_1.incrementBusinessMetric)('audit_stats_consulted', 'logs-service');
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.delete('/audit/cleanup', async (req, res) => {
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
                message: 'Solo los administradores pueden limpiar logs',
            });
        }
        const { diasAntiguedad = '90' } = req.query;
        const dias = parseInt(diasAntiguedad);
        if (isNaN(dias) || dias < 30) {
            return res.status(400).json({
                success: false,
                message: 'Los días de antigüedad deben ser al menos 30',
            });
        }
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);
        const resultado = await prisma.auditoriaLog.deleteMany({
            where: {
                createdAt: {
                    lt: fechaLimite,
                },
            },
        });
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
    }
    catch (error) {
        console.error('Error limpiando logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map