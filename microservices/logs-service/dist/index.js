"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const winston_1 = require("winston");
const prom_client_1 = require("prom-client");
const logs_1 = __importDefault(require("./routes/logs"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const config_1 = __importDefault(require("./routes/config"));
const errorHandler_1 = require("./middleware/errorHandler");
const prometheus_1 = require("./lib/prometheus");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3003;
const prisma = new client_1.PrismaClient();
const logger = (0, winston_1.createLogger)({
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
(0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
(0, prometheus_1.setupPrometheusMetrics)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://frontend:3000', 'http://localhost:8000', 'http://api-gateway:8000'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'healthy',
            service: 'logs-service',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    }
    catch (error) {
        logger.error('Health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            service: 'logs-service',
            timestamp: new Date().toISOString(),
            database: 'disconnected'
        });
    }
});
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', prom_client_1.register.contentType);
        res.end(await prom_client_1.register.metrics());
    }
    catch (error) {
        logger.error('Error generating metrics', error);
        res.status(500).end();
    }
});
app.use('/logs', logs_1.default);
app.use('/metrics', metrics_1.default);
app.use('/config', config_1.default);
app.use(errorHandler_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        service: 'logs-service'
    });
});
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});
app.listen(PORT, () => {
    logger.info(`📊 Logs Service running on port ${PORT}`);
    logger.info('📈 Health check: http://localhost:' + PORT + '/health');
    logger.info('📊 Metrics: http://localhost:' + PORT + '/metrics');
});
exports.default = app;
//# sourceMappingURL=index.js.map