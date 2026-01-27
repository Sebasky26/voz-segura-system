// Metrics Middleware - Métricas de Prometheus para API Gateway

import { Counter, Histogram, register } from 'prom-client';

// Contador de requests totales
export const httpRequestsTotal = new Counter({
  name: 'api_gateway_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Histograma de tiempos de respuesta
export const httpRequestDuration = new Histogram({
  name: 'api_gateway_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Contador de requests proxy
export const proxyRequestsTotal = new Counter({
  name: 'api_gateway_proxy_requests_total',
  help: 'Total number of proxied requests',
  labelNames: ['service', 'method', 'path'],
  registers: [register],
});

// Contador de errores de proxy
export const proxyErrorsTotal = new Counter({
  name: 'api_gateway_proxy_errors_total',
  help: 'Total number of proxy errors',
  labelNames: ['service', 'method'],
  registers: [register],
});

// Rate limit hits
export const rateLimitHitsTotal = new Counter({
  name: 'api_gateway_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['ip'],
  registers: [register],
});

/**
 * Setup metrics collectors
 */
export const setupMetrics = () => {
  console.log('📊 API Gateway metrics initialized');
};

/**
 * Record HTTP request
 */
export const recordHttpRequest = (method: string, route: string, status: number, duration: number) => {
  httpRequestsTotal.inc({ method, route, status: status.toString() });
  httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
};

/**
 * Record proxy request
 */
export const recordProxyRequest = (service: string, method: string, path: string) => {
  proxyRequestsTotal.inc({ service, method, path });
};

/**
 * Record proxy error
 */
export const recordProxyError = (service: string, method: string) => {
  proxyErrorsTotal.inc({ service, method });
};

/**
 * Record rate limit hit
 */
export const recordRateLimitHit = (ip: string) => {
  rateLimitHitsTotal.inc({ ip });
};