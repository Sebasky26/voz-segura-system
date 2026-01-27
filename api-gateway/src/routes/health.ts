// Health Check Routes - Verificación de estado de microservicios

import { Router } from 'express';
import axios from 'axios';

const router = Router();

// URLs de los microservicios
const SERVICES = {
  'auth-service': process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  'denuncias-service': process.env.DENUNCIAS_SERVICE_URL || 'http://denuncias-service:3002',
  'logs-service': process.env.LOGS_SERVICE_URL || 'http://logs-service:3003',
};

/**
 * GET /api/health/all
 * Verificar estado de todos los microservicios
 */
router.get('/all', async (req, res) => {
  const results: any = {
    gateway: 'healthy',
    services: {},
    timestamp: new Date().toISOString(),
  };

  // Verificar cada servicio
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const response = await axios.get(`${url}/health`, {
        timeout: 5000,
      });

      results.services[name] = {
        status: response.data.status || 'healthy',
        url,
        responseTime: response.headers['x-response-time'] || 'N/A',
      };
    } catch (error: any) {
      results.services[name] = {
        status: 'unhealthy',
        url,
        error: error.message,
      };
    }
  }

  // Determinar estado general
  const allHealthy = Object.values(results.services).every(
    (service: any) => service.status === 'healthy'
  );

  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: allHealthy,
    ...results,
  });
});

/**
 * GET /api/health/:service
 * Verificar estado de un microservicio específico
 */
router.get('/:service', async (req, res) => {
  const { service } = req.params;
  const serviceUrl = SERVICES[service as keyof typeof SERVICES];

  if (!serviceUrl) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
      availableServices: Object.keys(SERVICES),
    });
  }

  try {
    const response = await axios.get(`${serviceUrl}/health`, {
      timeout: 5000,
    });

    res.json({
      success: true,
      service,
      status: response.data.status || 'healthy',
      url: serviceUrl,
      data: response.data,
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      service,
      status: 'unhealthy',
      url: serviceUrl,
      error: error.message,
    });
  }
});

export const healthCheckRoutes = router;