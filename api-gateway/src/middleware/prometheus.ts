// Middleware para Prometheus - Recolección de métricas

import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Limpiar métricas por defecto
register.clear();

// Métricas personalizadas
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'path', 'status'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duración de requests HTTP en ms',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 5, 15, 50, 100, 500],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Conexiones activas en este momento',
});

// Middleware para registrar métricas
export const prometheusMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  activeConnections.inc();
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.route?.path || req.path;

    httpRequestCounter.labels(req.method, path, res.statusCode.toString()).inc();
    httpRequestDuration.labels(req.method, path, res.statusCode.toString()).observe(duration);
    activeConnections.dec();
  });

  next();
};

// Endpoint para exponer las métricas
export function metricsRoute(app: any) {
  app.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}
