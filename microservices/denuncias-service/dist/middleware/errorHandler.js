"use strict";
// Error Handler Middleware para Denuncias Service
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const winston_1 = require("winston");
const logger = (0, winston_1.createLogger)({
    level: 'error',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json()),
    defaultMeta: { service: 'denuncias-service' },
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
    // Errores específicos de Multer (upload de archivos)
    if (err.message === 'Tipo de archivo no permitido') {
        res.status(400).json({
            success: false,
            message: 'Tipo de archivo no permitido',
            service: 'denuncias-service'
        });
        return;
    }
    if (err.message.includes('File too large')) {
        res.status(400).json({
            success: false,
            message: 'El archivo es demasiado grande. Máximo 10MB por archivo.',
            service: 'denuncias-service'
        });
        return;
    }
    if (err.message.includes('Too many files')) {
        res.status(400).json({
            success: false,
            message: 'Demasiados archivos. Máximo 5 archivos por request.',
            service: 'denuncias-service'
        });
        return;
    }
    // Error genérico
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        service: 'denuncias-service'
    });
}
//# sourceMappingURL=errorHandler.js.map