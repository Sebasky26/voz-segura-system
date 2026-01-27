// Request Logger Middleware - Log de requests y métricas

import { Request, Response, NextFunction } from 'express';
import { recordHttpRequest } from './metrics';

/**
 * Middleware para registrar requests y métricas
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    // Registrar métricas
    recordHttpRequest(req.method, route, res.statusCode, duration);

    // Log adicional para requests lentos
    if (duration > 5) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}s`);
    }
  });

  next();
};