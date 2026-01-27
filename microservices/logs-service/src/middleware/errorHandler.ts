// Error Handler Middleware - Manejo centralizado de errores

import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Error interno del servidor';

  // Log del error
  console.error(`🔴 Error en logs-service:`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
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
  res.status(statusCode).json({
    success: false,
    message,
    service: 'logs-service',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message,
    }),
  });
};