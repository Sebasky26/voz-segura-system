"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRateLimitHit = exports.recordProxyError = exports.recordProxyRequest = exports.recordHttpRequest = exports.setupMetrics = exports.rateLimitHitsTotal = exports.proxyErrorsTotal = exports.proxyRequestsTotal = exports.httpRequestDuration = exports.httpRequestsTotal = void 0;
const prom_client_1 = require("prom-client");
exports.httpRequestsTotal = new prom_client_1.Counter({
    name: 'api_gateway_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [prom_client_1.register],
});
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'api_gateway_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [prom_client_1.register],
});
exports.proxyRequestsTotal = new prom_client_1.Counter({
    name: 'api_gateway_proxy_requests_total',
    help: 'Total number of proxied requests',
    labelNames: ['service', 'method', 'path'],
    registers: [prom_client_1.register],
});
exports.proxyErrorsTotal = new prom_client_1.Counter({
    name: 'api_gateway_proxy_errors_total',
    help: 'Total number of proxy errors',
    labelNames: ['service', 'method'],
    registers: [prom_client_1.register],
});
exports.rateLimitHitsTotal = new prom_client_1.Counter({
    name: 'api_gateway_rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['ip'],
    registers: [prom_client_1.register],
});
const setupMetrics = () => {
    console.log('📊 API Gateway metrics initialized');
};
exports.setupMetrics = setupMetrics;
const recordHttpRequest = (method, route, status, duration) => {
    exports.httpRequestsTotal.inc({ method, route, status: status.toString() });
    exports.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
};
exports.recordHttpRequest = recordHttpRequest;
const recordProxyRequest = (service, method, path) => {
    exports.proxyRequestsTotal.inc({ service, method, path });
};
exports.recordProxyRequest = recordProxyRequest;
const recordProxyError = (service, method) => {
    exports.proxyErrorsTotal.inc({ service, method });
};
exports.recordProxyError = recordProxyError;
const recordRateLimitHit = (ip) => {
    exports.rateLimitHitsTotal.inc({ ip });
};
exports.recordRateLimitHit = recordRateLimitHit;
//# sourceMappingURL=metrics.js.map