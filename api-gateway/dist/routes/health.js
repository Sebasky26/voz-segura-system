"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckRoutes = void 0;
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
const SERVICES = {
    'auth-service': process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    'denuncias-service': process.env.DENUNCIAS_SERVICE_URL || 'http://denuncias-service:3002',
    'logs-service': process.env.LOGS_SERVICE_URL || 'http://logs-service:3003',
};
router.get('/all', async (req, res) => {
    const results = {
        gateway: 'healthy',
        services: {},
        timestamp: new Date().toISOString(),
    };
    for (const [name, url] of Object.entries(SERVICES)) {
        try {
            const response = await axios_1.default.get(`${url}/health`, {
                timeout: 5000,
            });
            results.services[name] = {
                status: response.data.status || 'healthy',
                url,
                responseTime: response.headers['x-response-time'] || 'N/A',
            };
        }
        catch (error) {
            results.services[name] = {
                status: 'unhealthy',
                url,
                error: error.message,
            };
        }
    }
    const allHealthy = Object.values(results.services).every((service) => service.status === 'healthy');
    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json({
        success: allHealthy,
        ...results,
    });
});
router.get('/:service', async (req, res) => {
    const { service } = req.params;
    const serviceUrl = SERVICES[service];
    if (!serviceUrl) {
        return res.status(404).json({
            success: false,
            message: 'Service not found',
            availableServices: Object.keys(SERVICES),
        });
    }
    try {
        const response = await axios_1.default.get(`${serviceUrl}/health`, {
            timeout: 5000,
        });
        res.json({
            success: true,
            service,
            status: response.data.status || 'healthy',
            url: serviceUrl,
            data: response.data,
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            service,
            status: 'unhealthy',
            url: serviceUrl,
            error: error.message,
        });
    }
});
exports.healthCheckRoutes = router;
//# sourceMappingURL=health.js.map