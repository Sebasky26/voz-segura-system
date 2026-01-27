"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Error interno del servidor';
    console.error(`🔴 Error en logs-service:`, {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        statusCode,
        timestamp: new Date().toISOString(),
    });
    if (error.message.includes('Unique constraint')) {
        statusCode = 409;
        message = 'Registro duplicado';
    }
    if (error.message.includes('Record to update not found')) {
        statusCode = 404;
        message = 'Registro no encontrado';
    }
    if (error.message.includes('Foreign key constraint')) {
        statusCode = 400;
        message = 'Relación de datos inválida';
    }
    if (error.message.includes('timeout')) {
        statusCode = 503;
        message = 'Tiempo de espera agotado, intente nuevamente';
    }
    if (error.message.includes('validation')) {
        statusCode = 400;
        message = 'Datos de entrada inválidos';
    }
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Error interno del servidor';
    }
    res.status(statusCode).json({
        success: false,
        message,
        service: 'logs-service',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.message,
        }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map