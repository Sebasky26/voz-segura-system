// Prometheus Metrics - Configuración de métricas personalizadas

import { Counter, Histogram, Gauge, register } from 'prom-client';

// Métricas de logs de auditoría
export const auditLogCounter = new Counter({
  name: 'audit_logs_total',
  help: 'Total number of audit logs created',
  labelNames: ['action', 'service', 'success'],
  registers: [register],
});

// Métricas de negocio
export const businessMetricCounter = new Counter({
  name: 'business_metrics_total',
  help: 'Total number of business metrics recorded',
  labelNames: ['metric_name', 'service'],
  registers: [register],
});

// Métricas de configuraciones
export const configChangeCounter = new Counter({
  name: 'config_changes_total',
  help: 'Total number of configuration changes',
  labelNames: ['operation', 'service'],
  registers: [register],
});

// Métricas de performance de logs-service
export const logsServiceResponseTime = new Histogram({
  name: 'logs_service_response_time_seconds',
  help: 'Response time of logs service endpoints',
  labelNames: ['method', 'endpoint', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Métricas de almacenamiento
export const databaseSizeGauge = new Gauge({
  name: 'logs_database_size_bytes',
  help: 'Size of logs database',
  registers: [register],
});

export const activeLogsGauge = new Gauge({
  name: 'active_logs_count',
  help: 'Total number of active logs in database',
  labelNames: ['table'],
  registers: [register],
});

// Funciones helper para incrementar métricas
export const incrementAuditLogMetric = (action: string, service: string, success: boolean) => {
  auditLogCounter.inc({
    action,
    service,
    success: success.toString(),
  });
};

export const incrementBusinessMetric = (metricName: string, service: string) => {
  businessMetricCounter.inc({
    metric_name: metricName,
    service,
  });
};

export const incrementConfigMetric = (operation: string, service: string) => {
  configChangeCounter.inc({
    operation,
    service,
  });
};

export const recordResponseTime = (method: string, endpoint: string, status: number, duration: number) => {
  logsServiceResponseTime
    .labels(method, endpoint, status.toString())
    .observe(duration);
};

// Función para inicializar métricas customizadas
export const setupPrometheusMetrics = () => {
  console.log('📊 Prometheus metrics initialized for logs-service');
  
  // Inicializar gauges con valores por defecto
  activeLogsGauge.set({ table: 'auditoria_logs' }, 0);
  activeLogsGauge.set({ table: 'metricas_negocio' }, 0);
  activeLogsGauge.set({ table: 'configuraciones' }, 0);
  
  databaseSizeGauge.set(0);
};

// Middleware para medir tiempo de respuesta
export const responseTimeMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const endpoint = req.route?.path || req.path;
    
    recordResponseTime(
      req.method,
      endpoint,
      res.statusCode,
      duration
    );
  });
  
  next();
};