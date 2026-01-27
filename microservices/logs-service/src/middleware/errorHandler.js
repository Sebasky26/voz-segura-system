"use strict";
// Error Handler Middleware - Manejo centralizado de errores
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
var errorHandler = function (error, req, res, next) {
    var statusCode = error.statusCode || 500;
    var message = error.message || 'Error interno del servidor';
    // Log del error
    console.error("\uD83D\uDD34 Error en logs-service:", {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        statusCode: statusCode,
        timestamp: new Date().toISOString(),
    });
    // Errores específicos de Prisma
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
    // Error de timeout de base de datos
    if (error.message.includes('timeout')) {
        statusCode = 503;
        message = 'Tiempo de espera agotado, intente nuevamente';
    }
    // Error de validación
    if (error.message.includes('validation')) {
        statusCode = 400;
        message = 'Datos de entrada inválidos';
    }
    // No revelar detalles internos en producción
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Error interno del servidor';
    }
    // Respuesta de error estructurada
    res.status(statusCode).json(__assign({ success: false, message: message, service: 'logs-service', timestamp: new Date().toISOString() }, (process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.message,
    })));
};
exports.errorHandler = errorHandler;
