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
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Log del error
  console.error(`🔴 Error in API Gateway:`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
    timestamp: new Date().toISOString(),
  });

  // No revelar detalles internos en producción
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