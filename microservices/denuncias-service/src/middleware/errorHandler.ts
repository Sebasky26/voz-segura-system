// Error Handler Middleware para Denuncias Service

import { Request, Response, NextFunction } from 'express';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'denuncias-service' },
  transports: [
    new transports.File({ filename: 'logs/error.log' }),
    new transports.Console()
  ]
});

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Errores específicos de Multer (upload de archivos)
  if (err.message === 'Tipo de archivo no permitido') {
    res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido',
      service: 'denuncias-service'
    });
    return;
  }

  if (err.message.includes('File too large')) {
    res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo 10MB por archivo.',
      service: 'denuncias-service'
    });
    return;
  }

  if (err.message.includes('Too many files')) {
    res.status(400).json({
      success: false,
      message: 'Demasiados archivos. Máximo 5 archivos por request.',
      service: 'denuncias-service'
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    service: 'denuncias-service'
  });
}