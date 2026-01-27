"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    console.error(`🔴 Error in API Gateway:`, {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        statusCode,
        timestamp: new Date().toISOString(),
    });
    const errorMessage = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : message;
    res.status(statusCode).json({
        success: false,
        message: errorMessage,
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
        }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map