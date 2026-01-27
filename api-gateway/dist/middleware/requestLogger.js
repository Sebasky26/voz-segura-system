"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const metrics_1 = require("./metrics");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        (0, metrics_1.recordHttpRequest)(req.method, route, res.statusCode, duration);
        if (duration > 5) {
            console.warn(`⚠️ Slow request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}s`);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map