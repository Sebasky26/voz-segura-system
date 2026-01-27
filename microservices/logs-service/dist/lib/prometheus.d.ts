import { Counter, Histogram, Gauge } from 'prom-client';
export declare const auditLogCounter: Counter<"action" | "service" | "success">;
export declare const businessMetricCounter: Counter<"service" | "metric_name">;
export declare const configChangeCounter: Counter<"service" | "operation">;
export declare const logsServiceResponseTime: Histogram<"method" | "endpoint" | "status">;
export declare const databaseSizeGauge: Gauge<string>;
export declare const activeLogsGauge: Gauge<"table">;
export declare const incrementAuditLogMetric: (action: string, service: string, success: boolean) => void;
export declare const incrementBusinessMetric: (metricName: string, service: string) => void;
export declare const incrementConfigMetric: (operation: string, service: string) => void;
export declare const recordResponseTime: (method: string, endpoint: string, status: number, duration: number) => void;
export declare const setupPrometheusMetrics: () => void;
export declare const responseTimeMiddleware: (req: any, res: any, next: any) => void;
//# sourceMappingURL=prometheus.d.ts.map