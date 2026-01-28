// Middleware de Prometheus para microservicios
// Recolecta métricas de HTTP requests

import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Métricas personalizadas
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP procesadas',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de requests HTTP en segundos',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Número de conexiones activas',
  registers: [register],
});

// Middleware para Prometheus
export function prometheusMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  activeConnections.inc();
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convertir a segundos
    const path = req.route?.path || req.path || 'unknown';
    
    httpRequestsTotal
      .labels(req.method, path, res.statusCode.toString())
      .inc();
    
    httpRequestDurationSeconds
      .labels(req.method, path, res.statusCode.toString())
      .observe(duration);
    
    activeConnections.dec();
  });

  next();
}

// Ruta para exponer métricas
export function setupMetricsRoute(app: any) {
  app.get('/metrics', async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).json({ error: 'Error collecting metrics' });
    }
  });
}
