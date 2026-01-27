"use strict";
// Metrics Routes - Métricas de negocio y sistema
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
var crearMetricaSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido'),
    valor: zod_1.z.number(),
    unidad: zod_1.z.string().optional(),
    servicio: zod_1.z.string().min(1, 'El servicio es requerido'),
    categoria: zod_1.z.enum(['business', 'technical', 'performance']).optional(),
});
var buscarMetricasSchema = zod_1.z.object({
    nombre: zod_1.z.string().optional(),
    servicio: zod_1.z.string().optional(),
    categoria: zod_1.z.string().optional(),
    fechaInicio: zod_1.z.string().datetime().optional(),
    fechaFin: zod_1.z.string().datetime().optional(),
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
});
/**
 * POST /metrics/business
 * Registrar métrica de negocio
 */
router.post('/business', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validation, _a, nombre, valor, unidad, servicio, categoria, nuevaMetrica, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                validation = crearMetricaSchema.safeParse(req.body);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Datos inválidos',
                            errors: validation.error.flatten().fieldErrors,
                        })];
                }
                _a = validation.data, nombre = _a.nombre, valor = _a.valor, unidad = _a.unidad, servicio = _a.servicio, categoria = _a.categoria;
                return [4 /*yield*/, prisma.metricaNegocio.create({
                        data: {
                            nombre: nombre,
                            valor: valor,
                            unidad: unidad || 'count',
                            servicio: servicio,
                            categoria: categoria || 'business',
                        },
                    })];
            case 1:
                nuevaMetrica = _b.sent();
                // Incrementar contador en Prometheus
                (0, prometheus_1.incrementBusinessMetric)(nombre, servicio);
                res.status(201).json({
                    success: true,
                    message: 'Métrica registrada exitosamente',
                    data: nuevaMetrica,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Error registrando métrica:', error_1);
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
 * GET /metrics/business
 * Consultar métricas de negocio (solo admin)
 */
router.get('/business', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, validation, _a, nombre, servicio, categoria, fechaInicio, fechaFin, _b, page, _c, limit, filtros, skip, _d, metricas, total, error_2;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, auth_1.verifyWithAuthService)(req)];
            case 1:
                user = _e.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Token inválido',
                        })];
                }
                // Solo admin puede consultar métricas
                if (user.rol !== 'ADMIN') {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Solo los administradores pueden consultar métricas',
                        })];
                }
                validation = buscarMetricasSchema.safeParse(req.query);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Parámetros de búsqueda inválidos',
                            errors: validation.error.flatten().fieldErrors,
                        })];
                }
                _a = validation.data, nombre = _a.nombre, servicio = _a.servicio, categoria = _a.categoria, fechaInicio = _a.fechaInicio, fechaFin = _a.fechaFin, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 50 : _c;
                filtros = {};
                if (nombre)
                    filtros.nombre = { contains: nombre, mode: 'insensitive' };
                if (servicio)
                    filtros.servicio = servicio;
                if (categoria)
                    filtros.categoria = categoria;
                // Filtro por fechas
                if (fechaInicio || fechaFin) {
                    filtros.fecha = {};
                    if (fechaInicio)
                        filtros.fecha.gte = new Date(fechaInicio);
                    if (fechaFin)
                        filtros.fecha.lte = new Date(fechaFin);
                }
                skip = (page - 1) * limit;
                return [4 /*yield*/, Promise.all([
                        prisma.metricaNegocio.findMany({
                            where: filtros,
                            orderBy: { fecha: 'desc' },
                            skip: skip,
                            take: limit,
                        }),
                        prisma.metricaNegocio.count({ where: filtros }),
                    ])];
            case 2:
                _d = _e.sent(), metricas = _d[0], total = _d[1];
                res.json({
                    success: true,
                    data: metricas,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                    },
                    filtros: validation.data,
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _e.sent();
                console.error('Error consultando métricas:', error_2);
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
 * GET /metrics/business/dashboard
 * Dashboard de métricas de negocio (solo admin)
 */
router.get('/business/dashboard', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, fechaInicio, _a, metricasPorServicio, metricasPorCategoria, tendenciasDiarias, topMetricas, dashboard, error_3;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, auth_1.verifyWithAuthService)(req)];
            case 1:
                user = _d.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Token inválido',
                        })];
                }
                // Solo admin puede ver dashboard
                if (user.rol !== 'ADMIN') {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Solo los administradores pueden ver el dashboard',
                        })];
                }
                fechaInicio = new Date();
                fechaInicio.setDate(fechaInicio.getDate() - 30);
                return [4 /*yield*/, Promise.all([
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
                    ])];
            case 2:
                _a = _d.sent(), metricasPorServicio = _a[0], metricasPorCategoria = _a[1], tendenciasDiarias = _a[2], topMetricas = _a[3];
                _b = {};
                _c = {};
                return [4 /*yield*/, prisma.metricaNegocio.count({
                        where: { fecha: { gte: fechaInicio } },
                    })];
            case 3:
                dashboard = (_b.resumen = (_c.totalMetricas = _d.sent(),
                    _c.serviciosActivos = metricasPorServicio.length,
                    _c.categorias = metricasPorCategoria.length,
                    _c),
                    _b.metricasPorServicio = metricasPorServicio.map(function (m) { return ({
                        servicio: m.servicio,
                        cantidad: m._count.nombre,
                        promedio: m._avg.valor,
                    }); }),
                    _b.metricasPorCategoria = metricasPorCategoria.map(function (m) { return ({
                        categoria: m.categoria,
                        cantidad: m._count.categoria,
                        total: m._sum.valor,
                    }); }),
                    _b.tendenciasDiarias = tendenciasDiarias.map(function (t) { return ({
                        fecha: t.fecha,
                        cantidad: t._count.nombre,
                        total: t._sum.valor,
                    }); }),
                    _b.topMetricas = topMetricas.map(function (t) { return ({
                        nombre: t.nombre,
                        frecuencia: t._count.nombre,
                        total: t._sum.valor,
                        promedio: t._avg.valor,
                    }); }),
                    _b);
                res.json({
                    success: true,
                    data: dashboard,
                });
                return [3 /*break*/, 5];
            case 4:
                error_3 = _d.sent();
                console.error('Error obteniendo dashboard de métricas:', error_3);
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
 * DELETE /metrics/business/cleanup
 * Limpiar métricas antiguas (solo admin)
 */
router.delete('/business/cleanup', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, diasAntiguedad, dias, fechaLimite, resultado, error_4;
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
                // Solo admin puede limpiar métricas
                if (user.rol !== 'ADMIN') {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Solo los administradores pueden limpiar métricas',
                        })];
                }
                _a = req.query.diasAntiguedad, diasAntiguedad = _a === void 0 ? '180' : _a;
                dias = parseInt(diasAntiguedad);
                if (isNaN(dias) || dias < 90) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Los días de antigüedad deben ser al menos 90',
                        })];
                }
                fechaLimite = new Date();
                fechaLimite.setDate(fechaLimite.getDate() - dias);
                return [4 /*yield*/, prisma.metricaNegocio.deleteMany({
                        where: {
                            fecha: {
                                lt: fechaLimite,
                            },
                        },
                    })];
            case 2:
                resultado = _b.sent();
                res.json({
                    success: true,
                    message: "".concat(resultado.count, " m\u00E9tricas antiguas eliminadas exitosamente"),
                    data: {
                        metricasEliminadas: resultado.count,
                        fechaLimite: fechaLimite.toISOString(),
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _b.sent();
                console.error('Error limpiando métricas:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
