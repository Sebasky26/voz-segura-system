"use strict";
// Logs Routes - Sistema de auditoría migrado del proyecto original
// Endpoints: /logs/audit, /logs/search, /logs/stats
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var zod_1 = require("zod");
var client_1 = require("@prisma/client");
var auth_1 = require("../lib/auth");
var prometheus_1 = require("../lib/prometheus");
var router = (0, express_1.Router)();
var prisma = new client_1.PrismaClient();
// Validation schemas
var crearLogSchema = zod_1.z.object({
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
var buscarLogsSchema = zod_1.z.object({
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
/**
 * POST /logs/audit
 * Crear nuevo log de auditoría (usado por otros microservicios)
 */
router.post('/audit', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validation, _a, usuarioId, accion, servicio, recurso, detalles, ipAddress, userAgent, exitoso, tabla, registroId, nuevoLog, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                validation = crearLogSchema.safeParse(req.body);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Datos inválidos',
                            errors: validation.error.flatten().fieldErrors,
                        })];
                }
                _a = validation.data, usuarioId = _a.usuarioId, accion = _a.accion, servicio = _a.servicio, recurso = _a.recurso, detalles = _a.detalles, ipAddress = _a.ipAddress, userAgent = _a.userAgent, exitoso = _a.exitoso, tabla = _a.tabla, registroId = _a.registroId;
                return [4 /*yield*/, prisma.auditoriaLog.create({
                        data: {
                            usuarioId: usuarioId || null,
                            accion: accion,
                            servicio: servicio || 'unknown',
                            recurso: recurso || null,
                            detalles: detalles || null,
                            ipAddress: ipAddress || null,
                            userAgent: userAgent || null,
                            exitoso: exitoso !== undefined ? exitoso : true,
                            tabla: tabla || null,
                            registroId: registroId || null,
                        },
                    })];
            case 1:
                nuevoLog = _b.sent();
                // Incrementar métricas de Prometheus
                (0, prometheus_1.incrementAuditLogMetric)(accion, servicio || 'unknown', exitoso !== false);
                res.status(201).json({
                    success: true,
                    message: 'Log de auditoría creado exitosamente',
                    data: nuevoLog,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Error creando log de auditoría:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /logs/audit
 * Buscar y filtrar logs de auditoría (solo admin)
 */
router.get('/audit', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, validation, _a, usuarioId, accion, servicio, tabla, exitoso, fechaInicio, fechaFin, _b, page, _c, limit, filtros, skip, _d, logs, total, error_2;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, auth_1.verifyWithAuthService)(req)];
            case 1:
                user = _e.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Token inválido',
                        })];
                }
                // Solo admin puede consultar logs de auditoría
                if (user.rol !== 'ADMIN') {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Solo los administradores pueden consultar logs de auditoría',
                        })];
                }
                validation = buscarLogsSchema.safeParse(req.query);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Parámetros de búsqueda inválidos',
                            errors: validation.error.flatten().fieldErrors,
                        })];
                }
                _a = validation.data, usuarioId = _a.usuarioId, accion = _a.accion, servicio = _a.servicio, tabla = _a.tabla, exitoso = _a.exitoso, fechaInicio = _a.fechaInicio, fechaFin = _a.fechaFin, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 50 : _c;
                filtros = {};
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
                // Filtro por fechas
                if (fechaInicio || fechaFin) {
                    filtros.createdAt = {};
                    if (fechaInicio)
                        filtros.createdAt.gte = new Date(fechaInicio);
                    if (fechaFin)
                        filtros.createdAt.lte = new Date(fechaFin);
                }
                skip = (page - 1) * limit;
                return [4 /*yield*/, Promise.all([
                        prisma.auditoriaLog.findMany({
                            where: filtros,
                            orderBy: { createdAt: 'desc' },
                            skip: skip,
                            take: limit,
                        }),
                        prisma.auditoriaLog.count({ where: filtros }),
                    ])];
            case 2:
                _d = _e.sent(), logs = _d[0], total = _d[1];
                // Log de consulta de auditoría
                return [4 /*yield*/, prisma.auditoriaLog.create({
                        data: {
                            usuarioId: user.userId,
                            accion: 'CONSULTA_AUDITORIA',
                            servicio: 'logs-service',
                            tabla: 'auditoria_logs',
                            detalles: JSON.stringify({
                                filtros: filtros,
                                resultados: logs.length,
                                total: total,
                            }),
                            exitoso: true,
                        },
                    })];
            case 3:
                // Log de consulta de auditoría
                _e.sent();
                res.json({
                    success: true,
                    data: logs,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                    },
                    filtros: validation.data,
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _e.sent();
                console.error('Error buscando logs:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /logs/stats
 * Estadísticas de logs de auditoría (solo admin)
 */
router.get('/stats', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, totalLogs, logsExitosos, logsFallidos, acciones, servicios, usuarios, ultimosMensajes, stats, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, auth_1.verifyWithAuthService)(req)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Token inválido',
                        })];
                }
                // Solo admin puede ver estadísticas
                if (user.rol !== 'ADMIN') {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Solo los administradores pueden ver estadísticas',
                        })];
                }
                return [4 /*yield*/, Promise.all([
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
                    ])];
            case 2:
                _a = _b.sent(), totalLogs = _a[0], logsExitosos = _a[1], logsFallidos = _a[2], acciones = _a[3], servicios = _a[4], usuarios = _a[5], ultimosMensajes = _a[6];
                stats = {
                    resumen: {
                        totalLogs: totalLogs,
                        logsExitosos: logsExitosos,
                        logsFallidos: logsFallidos,
                        tasaExito: totalLogs > 0 ? ((logsExitosos / totalLogs) * 100).toFixed(2) + '%' : '0%',
                    },
                    topAcciones: acciones.map(function (a) { return ({
                        accion: a.accion,
                        cantidad: a._count.accion,
                    }); }),
                    logsPorServicio: servicios.map(function (s) { return ({
                        servicio: s.servicio,
                        cantidad: s._count.servicio,
                    }); }),
                    usuariosMasActivos: usuarios.map(function (u) { return ({
                        usuarioId: u.usuarioId,
                        cantidad: u._count.usuarioId,
                    }); }),
                    ultimosLogs: ultimosMensajes,
                };
                // Incrementar métrica de consulta de estadísticas
                (0, prometheus_1.incrementBusinessMetric)('audit_stats_consulted', 'logs-service');
                res.json({
                    success: true,
                    data: stats,
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.error('Error obteniendo estadísticas:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * DELETE /logs/audit/cleanup
 * Limpiar logs antiguos (solo admin)
 */
router.delete('/audit/cleanup', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, diasAntiguedad, dias, fechaLimite, resultado, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, auth_1.verifyWithAuthService)(req)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Token inválido',
                        })];
                }
                // Solo admin puede limpiar logs
                if (user.rol !== 'ADMIN') {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Solo los administradores pueden limpiar logs',
                        })];
                }
                _a = req.query.diasAntiguedad, diasAntiguedad = _a === void 0 ? '90' : _a;
                dias = parseInt(diasAntiguedad);
                if (isNaN(dias) || dias < 30) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Los días de antigüedad deben ser al menos 30',
                        })];
                }
                fechaLimite = new Date();
                fechaLimite.setDate(fechaLimite.getDate() - dias);
                return [4 /*yield*/, prisma.auditoriaLog.deleteMany({
                        where: {
                            createdAt: {
                                lt: fechaLimite,
                            },
                        },
                    })];
            case 2:
                resultado = _b.sent();
                // Log de la limpieza
                return [4 /*yield*/, prisma.auditoriaLog.create({
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
                    })];
            case 3:
                // Log de la limpieza
                _b.sent();
                res.json({
                    success: true,
                    message: "".concat(resultado.count, " logs antiguos eliminados exitosamente"),
                    data: {
                        logsEliminados: resultado.count,
                        fechaLimite: fechaLimite.toISOString(),
                    },
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _b.sent();
                console.error('Error limpiando logs:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
