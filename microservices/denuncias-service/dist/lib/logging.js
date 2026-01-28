"use strict";
// Logging Library - Comunicación con logs-service
// Función para enviar logs al microservicio de auditoría
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logToAuditService = logToAuditService;
const axios_1 = __importDefault(require("axios"));
const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || 'http://logs-service:3003';
/**
 * Enviar log al microservicio de auditoría
 */
async function logToAuditService(accion, data) {
    try {
        await axios_1.default.post(`${LOGS_SERVICE_URL}/logs/audit`, {
            usuarioId: data.usuarioId || null,
            accion,
            servicio: 'denuncias-service',
            detalles: JSON.stringify(data),
            ipAddress: data.ip || null,
            userAgent: data.userAgent || null,
            exitoso: data.exitoso !== undefined ? data.exitoso : true,
            tabla: 'denuncias',
            registroId: data.denunciaId || null,
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    catch (error) {
        // No fallar la operación principal si el logging falla
        console.error('Error enviando log a audit service:', error);
    }
}
//# sourceMappingURL=logging.js.map