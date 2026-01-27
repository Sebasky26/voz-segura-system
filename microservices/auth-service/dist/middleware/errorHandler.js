"use strict";
// Error Handler Middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const winston_1 = require("winston");
const logger = (0, winston_1.createLogger)({
    level: 'error',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json()),
    defaultMeta: { service: 'auth-service' },
    transports: [
        new winston_1.transports.File({ filename: 'logs/error.log' }),
        new winston_1.transports.Console()
    ]
});
function errorHandler(err, req, res, next) {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        service: 'auth-service'
    });
}
//# sourceMappingURL=errorHandler.js.map