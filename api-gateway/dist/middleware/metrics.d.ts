import { Counter, Histogram } from 'prom-client';
export declare const httpRequestsTotal: Counter<"method" | "route" | "status">;
export declare const httpRequestDuration: Histogram<"method" | "route" | "status">;
export declare const proxyRequestsTotal: Counter<"method" | "service" | "path">;
export declare const proxyErrorsTotal: Counter<"method" | "service">;
export declare const rateLimitHitsTotal: Counter<"ip">;
export declare const setupMetrics: () => void;
export declare const recordHttpRequest: (method: string, route: string, status: number, duration: number) => void;
export declare const recordProxyRequest: (service: string, method: string, path: string) => void;
export declare const recordProxyError: (service: string, method: string) => void;
export declare const recordRateLimitHit: (ip: string) => void;
//# sourceMappingURL=metrics.d.ts.map