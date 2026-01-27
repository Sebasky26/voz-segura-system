"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProxyRoutes = void 0;
const http_proxy_middleware_1 = require("http-proxy-middleware");
const metrics_1 = require("../middleware/metrics");
const getServices = () => ({
    auth: {
        target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        pathPrefix: '/api/auth',
        timeout: 10000,
    },
    denuncias: {
        target: process.env.DENUNCIAS_SERVICE_URL || 'http://localhost:3002',
        pathPrefix: '/api/denuncias',
        timeout: 30000,
    },
    logs: {
        target: process.env.LOGS_SERVICE_URL || 'http://localhost:3003',
        pathPrefix: '/api/logs',
        timeout: 10000,
    },
    metrics: {
        target: process.env.LOGS_SERVICE_URL || 'http://localhost:3003',
        pathPrefix: '/api/metrics',
        timeout: 10000,
    },
    config: {
        target: process.env.LOGS_SERVICE_URL || 'http://localhost:3003',
        pathPrefix: '/api/config',
        timeout: 10000,
    },
});
const setupProxyRoutes = (app, logger) => {
    const SERVICES = getServices();
    app.use(SERVICES.auth.pathPrefix, (req, res, next) => {
        logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.auth.target}`);
        (0, metrics_1.recordProxyRequest)('auth-service', req.method || 'GET', req.originalUrl || '');
        next();
    }, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: SERVICES.auth.target,
        changeOrigin: true,
        pathRewrite: (path) => {
            const newPath = '/auth' + path;
            return newPath;
        },
        timeout: SERVICES.auth.timeout,
        on: {
            proxyReq: (proxyReq, req, res) => {
                logger.info(`[AUTH PROXY REQ] ${req.method} ${req.url} → ${proxyReq.path}`);
            },
            proxyRes: (proxyRes, req, res) => {
                logger.info(`[AUTH PROXY RES] ${proxyRes.statusCode} for ${req.url}`);
            },
            error: (err, req, res) => {
                logger.error(`[AUTH PROXY ERROR] ${err.message}`);
                (0, metrics_1.recordProxyError)('auth-service', err.message);
            },
        },
    }));
    app.use(SERVICES.denuncias.pathPrefix, (req, res, next) => {
        logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.denuncias.target}`);
        (0, metrics_1.recordProxyRequest)('denuncias-service', req.method || 'GET', req.originalUrl || '');
        next();
    }, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: SERVICES.denuncias.target,
        changeOrigin: true,
        pathRewrite: (path) => '/denuncias' + path,
        timeout: SERVICES.denuncias.timeout,
    }));
    app.use(SERVICES.logs.pathPrefix, (req, res, next) => {
        logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.logs.target}/logs`);
        (0, metrics_1.recordProxyRequest)('logs-service', req.method || 'GET', req.originalUrl || '');
        next();
    }, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: SERVICES.logs.target,
        changeOrigin: true,
        pathRewrite: (path) => '/logs' + path,
        timeout: SERVICES.logs.timeout,
    }));
    app.use(SERVICES.metrics.pathPrefix, (req, res, next) => {
        logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.metrics.target}/metrics`);
        (0, metrics_1.recordProxyRequest)('logs-service-metrics', req.method || 'GET', req.originalUrl || '');
        next();
    }, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: SERVICES.metrics.target,
        changeOrigin: true,
        pathRewrite: (path) => '/metrics' + path,
        timeout: SERVICES.metrics.timeout,
    }));
    app.use(SERVICES.config.pathPrefix, (req, res, next) => {
        logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.config.target}/config`);
        (0, metrics_1.recordProxyRequest)('logs-service-config', req.method || 'GET', req.originalUrl || '');
        next();
    }, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: SERVICES.config.target,
        changeOrigin: true,
        pathRewrite: (path) => '/config' + path,
        timeout: SERVICES.config.timeout,
    }));
    logger.info('✅ All proxy routes configured successfully');
};
exports.setupProxyRoutes = setupProxyRoutes;
//# sourceMappingURL=proxy.js.map