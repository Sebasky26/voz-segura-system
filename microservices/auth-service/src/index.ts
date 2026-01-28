// Auth Service - Microservicio de Autenticación
// Puerto: 3001
// Responsabilidad: Login, registro, JWT, gestión de usuarios

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createLogger, format, transports } from 'winston';
import { register, collectDefaultMetrics } from 'prom-client';

// Inicializar métricas de Prometheus
collectDefaultMetrics({ prefix: 'auth_service_' });
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Logger configuration
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.Console({
      format: format.simple()
    })
  ]
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: ['http://localhost:3000', 'http://frontend:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Metrics endpoint para Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Routes
app.use('/auth', authRoutes);
app.use('/auth/users', userRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    service: 'auth-service'
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
  logger.info(`🔐 Auth Service running on port ${PORT}`);
  logger.info('📊 Health check: http://localhost:' + PORT + '/health');
});

export default app;