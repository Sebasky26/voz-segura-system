"use strict";
// Prometheus Metrics - Configuración de métricas personalizadas
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTimeMiddleware = exports.setupPrometheusMetrics = exports.recordResponseTime = exports.incrementConfigMetric = exports.incrementBusinessMetric = exports.incrementAuditLogMetric = exports.activeLogsGauge = exports.databaseSizeGauge = exports.logsServiceResponseTime = exports.configChangeCounter = exports.businessMetricCounter = exports.auditLogCounter = void 0;
var prom_client_1 = require("prom-client");
// Métricas de logs de auditoría
exports.auditLogCounter = new prom_client_1.Counter({
    name: 'audit_logs_total',
    help: 'Total number of audit logs created',
    labelNames: ['action', 'service', 'success'],
    registers: [prom_client_1.register],
});
// Métricas de negocio
exports.businessMetricCounter = new prom_client_1.Counter({
    name: 'business_metrics_total',
    help: 'Total number of business metrics recorded',
    labelNames: ['metric_name', 'service'],
    registers: [prom_client_1.register],
});
// Métricas de configuraciones
exports.configChangeCounter = new prom_client_1.Counter({
    name: 'config_changes_total',
    help: 'Total number of configuration changes',
    labelNames: ['operation', 'service'],
    registers: [prom_client_1.register],
});
// Métricas de performance de logs-service
exports.logsServiceResponseTime = new prom_client_1.Histogram({
    name: 'logs_service_response_time_seconds',
    help: 'Response time of logs service endpoints',
    labelNames: ['method', 'endpoint', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [prom_client_1.register],
});
// Métricas de almacenamiento
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
// Funciones helper para incrementar métricas
var incrementAuditLogMetric = function (action, service, success) {
    exports.auditLogCounter.inc({
        action: action,
        service: service,
        success: success.toString(),
    });
};
exports.incrementAuditLogMetric = incrementAuditLogMetric;
var incrementBusinessMetric = function (metricName, service) {
    exports.businessMetricCounter.inc({
        metric_name: metricName,
        service: service,
    });
};
exports.incrementBusinessMetric = incrementBusinessMetric;
var incrementConfigMetric = function (operation, service) {
    exports.configChangeCounter.inc({
        operation: operation,
        service: service,
    });
};
exports.incrementConfigMetric = incrementConfigMetric;
var recordResponseTime = function (method, endpoint, status, duration) {
    exports.logsServiceResponseTime
        .labels(method, endpoint, status.toString())
        .observe(duration);
};
exports.recordResponseTime = recordResponseTime;
// Función para inicializar métricas customizadas
var setupPrometheusMetrics = function () {
    console.log('📊 Prometheus metrics initialized for logs-service');
    // Inicializar gauges con valores por defecto
    exports.activeLogsGauge.set({ table: 'auditoria_logs' }, 0);
    exports.activeLogsGauge.set({ table: 'metricas_negocio' }, 0);
    exports.activeLogsGauge.set({ table: 'configuraciones' }, 0);
    exports.databaseSizeGauge.set(0);
};
exports.setupPrometheusMetrics = setupPrometheusMetrics;
// Middleware para medir tiempo de respuesta
var responseTimeMiddleware = function (req, res, next) {
    var start = Date.now();
    res.on('finish', function () {
        var _a;
        var duration = (Date.now() - start) / 1000;
        var endpoint = ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.path;
        (0, exports.recordResponseTime)(req.method, endpoint, res.statusCode, duration);
    });
    next();
};
exports.responseTimeMiddleware = responseTimeMiddleware;
