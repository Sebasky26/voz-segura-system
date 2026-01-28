"use strict";
// Auth Service - Microservicio de Autenticación
// Puerto: 3001
// Responsabilidad: Login, registro, JWT, gestión de usuarios
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
// Inicializar métricas de Prometheus
(0, prom_client_1.collectDefaultMetrics)({ prefix: 'auth_service_' });
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const prisma = new client_1.PrismaClient();
// Logger configuration
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json()),
    defaultMeta: { service: 'auth-service' },
    transports: [
        new winston_1.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.transports.File({ filename: 'logs/combined.log' }),
        new winston_1.transports.Console({
            format: winston_1.format.simple()
        })
    ]
});
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://frontend:3000'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'healthy',
            service: 'auth-service',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    }
    catch (error) {
        logger.error('Health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            service: 'auth-service',
            timestamp: new Date().toISOString(),
            database: 'disconnected'
        });
    }
});
// Metrics endpoint para Prometheus
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', prom_client_1.register.contentType);
        res.end(await prom_client_1.register.metrics());
    }
    catch (error) {
        res.status(500).end(error);
    }
});
// Routes
app.use('/auth', auth_1.default);
app.use('/auth/users', users_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        service: 'auth-service'
    });
});
// Graceful shutdown
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
// Start server
app.listen(PORT, () => {
    logger.info(`🔐 Auth Service running on port ${PORT}`);
    logger.info('📊 Health check: http://localhost:' + PORT + '/health');
});
exports.default = app;
//# sourceMappingURL=index.js.map