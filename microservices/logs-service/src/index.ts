// Logs Service - Microservicio de Auditoría y Métricas
// Puerto: 3003
// Responsabilidad: Logs de auditoría, métricas de negocio, configuraciones

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createLogger, format, transports } from 'winston';
import { register, collectDefaultMetrics } from 'prom-client';
import logsRoutes from './routes/logs';
import metricsRoutes from './routes/metrics';
import configRoutes from './routes/config';
import { errorHandler } from './middleware/errorHandler';
import { setupPrometheusMetrics } from './lib/prometheus';

const app = express();
const PORT = process.env.PORT || 3003;
const prisma = new PrismaClient();

// Logger configuration
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'logs-service' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.Console({
      format: format.simple()
    })
  ]
});

// Initialize Prometheus metrics
collectDefaultMetrics({ register });
setupPrometheusMetrics();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: ['http://localhost:3000', 'http://frontend:3000', 'http://localhost:8000', 'http://api-gateway:8000'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (más permisivo para logs)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Más requests para logs frecuentes
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      service: 'logs-service',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'logs-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics', error);
    res.status(500).end();
  }
});

// Routes
app.use('/logs', logsRoutes);
app.use('/metrics', metricsRoutes);
app.use('/config', configRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    service: 'logs-service'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`📊 Logs Service running on port ${PORT}`);
  logger.info('📈 Health check: http://localhost:' + PORT + '/health');
  logger.info('📊 Metrics: http://localhost:' + PORT + '/metrics');
});

export default app;