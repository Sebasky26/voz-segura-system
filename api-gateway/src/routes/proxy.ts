// Proxy Routes - Configuración de enrutamiento a microservicios

import { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Logger } from 'winston';
import { recordProxyRequest, recordProxyError } from '../middleware/metrics';

// Función para obtener configuración de servicios (lee env vars en runtime)
const getServices = () => ({
  auth: {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    pathPrefix: '/api/auth',
    timeout: 10000,
  },
  usuarios: {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    pathPrefix: '/api/usuarios',
    timeout: 10000,
  },
  denuncias: {
    target: process.env.DENUNCIAS_SERVICE_URL || 'http://localhost:3002',
    pathPrefix: '/api/denuncias',
    timeout: 30000, // Mayor timeout para uploads
  },
  reglas: {
    target: process.env.DENUNCIAS_SERVICE_URL || 'http://localhost:3002',
    pathPrefix: '/api/reglas',
    timeout: 10000,
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

/**
 * Setup proxy routes to microservices
 */
export const setupProxyRoutes = (app: Express, logger: Logger) => {
  // Obtener configuración en runtime (después de cargar .env)
  const SERVICES = getServices();
  
  // Auth Service Proxy
  app.use(
    SERVICES.auth.pathPrefix,
    (req, res, next) => {
      logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.auth.target}`);
      recordProxyRequest('auth-service', req.method || 'GET', req.originalUrl || '');
      next();
    },
    createProxyMiddleware({
      target: SERVICES.auth.target,
      changeOrigin: true,
      pathRewrite: (path) => {
        const newPath = '/auth' + path;  // /login → /auth/login
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
          recordProxyError('auth-service', err.message);
        },
      },
    })
  );

  // Denuncias Service Proxy
  app.use(
    SERVICES.denuncias.pathPrefix,
    (req, res, next) => {
      logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.denuncias.target}`);
      recordProxyRequest('denuncias-service', req.method || 'GET', req.originalUrl || '');
      next();
    },
    createProxyMiddleware({
      target: SERVICES.denuncias.target,
      changeOrigin: true,
      pathRewrite: (path) => '/denuncias' + path,
      timeout: SERVICES.denuncias.timeout,
    })
  );

  // Reglas Service Proxy (apunta a denuncias-service)
  app.use(
    SERVICES.reglas.pathPrefix,
    (req, res, next) => {
      logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.reglas.target}/reglas`);
      recordProxyRequest('denuncias-service', req.method || 'GET', req.originalUrl || '');
      next();
    },
    createProxyMiddleware({
      target: SERVICES.reglas.target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/reglas': '/reglas'  // /api/reglas → /reglas
      },
      timeout: SERVICES.reglas.timeout,
      on: {
        proxyReq: (proxyReq, req) => {
          logger.info(`[REGLAS PROXY REQ] ${req.method} ${req.url} → ${proxyReq.path}`);
        },
        error: (err, req, res) => {
          logger.error(`[REGLAS PROXY ERROR] ${err.message}`);
        },
      },
    })
  );

  // Usuarios Service Proxy (apunta a auth-service)
  app.use(
    SERVICES.usuarios.pathPrefix,
    (req, res, next) => {
      logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.usuarios.target}/users`);
      recordProxyRequest('auth-service', req.method || 'GET', req.originalUrl || '');
      next();
    },
    createProxyMiddleware({
      target: SERVICES.usuarios.target,
      changeOrigin: true,
      pathRewrite: (path) => '/users' + path,
      timeout: SERVICES.usuarios.timeout,
    })
  );

  // Logs Service Proxy (rutas /api/logs/*)
  app.use(
    SERVICES.logs.pathPrefix,
    (req, res, next) => {
      logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.logs.target}/logs`);
      recordProxyRequest('logs-service', req.method || 'GET', req.originalUrl || '');
      next();
    },
    createProxyMiddleware({
      target: SERVICES.logs.target,
      changeOrigin: true,
      pathRewrite: (path) => '/logs' + path,
      timeout: SERVICES.logs.timeout,
    })
  );

  // Metrics Service Proxy (rutas /api/metrics/*)
  app.use(
    SERVICES.metrics.pathPrefix,
    (req, res, next) => {
      logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.metrics.target}/metrics`);
      recordProxyRequest('logs-service-metrics', req.method || 'GET', req.originalUrl || '');
      next();
    },
    createProxyMiddleware({
      target: SERVICES.metrics.target,
      changeOrigin: true,
      pathRewrite: (path) => '/metrics' + path,
      timeout: SERVICES.metrics.timeout,
    })
  );

  // Config Service Proxy (rutas /api/config/*)
  app.use(
    SERVICES.config.pathPrefix,
    (req, res, next) => {
      logger.info(`[PROXY] ${req.method} ${req.originalUrl} → ${SERVICES.config.target}/config`);
      recordProxyRequest('logs-service-config', req.method || 'GET', req.originalUrl || '');
      next();
    },
    createProxyMiddleware({
      target: SERVICES.config.target,
      changeOrigin: true,
      pathRewrite: (path) => '/config' + path,
      timeout: SERVICES.config.timeout,
    })
  );

  logger.info('✅ All proxy routes configured successfully');
};