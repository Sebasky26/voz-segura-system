"use strict";
// Logs Service - Microservicio de Auditoría y Métricas
// Puerto: 3003
// Responsabilidad: Logs de auditoría, métricas de negocio, configuraciones
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var express_rate_limit_1 = require("express-rate-limit");
var client_1 = require("@prisma/client");
var winston_1 = require("winston");
var prom_client_1 = require("prom-client");
var logs_1 = require("./routes/logs");
var metrics_1 = require("./routes/metrics");
var config_1 = require("./routes/config");
var errorHandler_1 = require("./middleware/errorHandler");
var prometheus_1 = require("./lib/prometheus");
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3003;
var prisma = new client_1.PrismaClient();
// Logger configuration
var logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json()),
    defaultMeta: { service: 'logs-service' },
    transports: [
        new winston_1.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.transports.File({ filename: 'logs/combined.log' }),
        new winston_1.transports.Console({
            format: winston_1.format.simple()
        })
    ]
});
// Initialize Prometheus metrics
(0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
(0, prometheus_1.setupPrometheusMetrics)();
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://frontend:3000', 'http://localhost:8000', 'http://api-gateway:8000'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting (más permisivo para logs)
var limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Más requests para logs frecuentes
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Health check endpoint
app.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
            case 1:
                _a.sent();
                res.status(200).json({
                    status: 'healthy',
                    service: 'logs-service',
                    timestamp: new Date().toISOString(),
                    database: 'connected'
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger.error('Health check failed', error_1);
                res.status(503).json({
                    status: 'unhealthy',
                    service: 'logs-service',
                    timestamp: new Date().toISOString(),
                    database: 'disconnected'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Prometheus metrics endpoint
app.get('/metrics', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                res.set('Content-Type', prom_client_1.register.contentType);
                _b = (_a = res).end;
                return [4 /*yield*/, prom_client_1.register.metrics()];
            case 1:
                _b.apply(_a, [_c.sent()]);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _c.sent();
                logger.error('Error generating metrics', error_2);
                res.status(500).end();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Routes
app.use('/logs', logs_1.default);
app.use('/metrics', metrics_1.default);
app.use('/config', config_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', function (req, res) {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        service: 'logs-service'
    });
});
// Graceful shutdown
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger.info('SIGTERM received, shutting down gracefully');
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger.info('SIGINT received, shutting down gracefully');
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// Start server
app.listen(PORT, function () {
    logger.info("\uD83D\uDCCA Logs Service running on port ".concat(PORT));
    logger.info('📈 Health check: http://localhost:' + PORT + '/health');
    logger.info('📊 Metrics: http://localhost:' + PORT + '/metrics');
});
exports.default = app;
var templateObject_1;
