"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTimeMiddleware = exports.setupPrometheusMetrics = exports.recordResponseTime = exports.incrementConfigMetric = exports.incrementBusinessMetric = exports.incrementAuditLogMetric = exports.activeLogsGauge = exports.databaseSizeGauge = exports.logsServiceResponseTime = exports.configChangeCounter = exports.businessMetricCounter = exports.auditLogCounter = void 0;
const prom_client_1 = require("prom-client");
exports.auditLogCounter = new prom_client_1.Counter({
    name: 'audit_logs_total',
    help: 'Total number of audit logs created',
    labelNames: ['action', 'service', 'success'],
    registers: [prom_client_1.register],
});
exports.businessMetricCounter = new prom_client_1.Counter({
    name: 'business_metrics_total',
    help: 'Total number of business metrics recorded',
    labelNames: ['metric_name', 'service'],
    registers: [prom_client_1.register],
});
exports.configChangeCounter = new prom_client_1.Counter({
    name: 'config_changes_total',
    help: 'Total number of configuration changes',
    labelNames: ['operation', 'service'],
    registers: [prom_client_1.register],
});
exports.logsServiceResponseTime = new prom_client_1.Histogram({
    name: 'logs_service_response_time_seconds',
    help: 'Response time of logs service endpoints',
    labelNames: ['method', 'endpoint', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [prom_client_1.register],
});
exports.databaseSizeGauge = new prom_client_1.Gauge({
    name: 'logs_database_size_bytes',
    help: 'Size of logs database',
    registers: [prom_client_1.register],
});
exports.activeLogsGauge = new prom_client_1.Gauge({
    name: 'active_logs_count',
    help: 'Total number of active logs in database',
    labelNames: ['table'],
    registers: [prom_client_1.register],
});
const incrementAuditLogMetric = (action, service, success) => {
    exports.auditLogCounter.inc({
        action,
        service,
        success: success.toString(),
    });
};
exports.incrementAuditLogMetric = incrementAuditLogMetric;
const incrementBusinessMetric = (metricName, service) => {
    exports.businessMetricCounter.inc({
        metric_name: metricName,
        service,
    });
};
exports.incrementBusinessMetric = incrementBusinessMetric;
const incrementConfigMetric = (operation, service) => {
    exports.configChangeCounter.inc({
        operation,
        service,
    });
};
exports.incrementConfigMetric = incrementConfigMetric;
const recordResponseTime = (method, endpoint, status, duration) => {
    exports.logsServiceResponseTime
        .labels(method, endpoint, status.toString())
        .observe(duration);
};
exports.recordResponseTime = recordResponseTime;
const setupPrometheusMetrics = () => {
    console.log('📊 Prometheus metrics initialized for logs-service');
    exports.activeLogsGauge.set({ table: 'auditoria_logs' }, 0);
    exports.activeLogsGauge.set({ table: 'metricas_negocio' }, 0);
    exports.activeLogsGauge.set({ table: 'configuraciones' }, 0);
    exports.databaseSizeGauge.set(0);
};
exports.setupPrometheusMetrics = setupPrometheusMetrics;
const responseTimeMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const endpoint = req.route?.path || req.path;
        (0, exports.recordResponseTime)(req.method, endpoint, res.statusCode, duration);
    });
    next();
};
exports.responseTimeMiddleware = responseTimeMiddleware;
//# sourceMappingURL=prometheus.js.map