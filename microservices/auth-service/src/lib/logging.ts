// Logging Library - Comunicación con logs-service
// Función para enviar logs al microservicio de auditoría

import axios from 'axios';

const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || 'http://logs-service:3003';

interface LogData {
  usuarioId?: string;
  accion: string;
  detalles?: any;
  ip?: string;
  userAgent?: string;
  exitoso?: boolean;
}

/**
 * Enviar log al microservicio de auditoría
 */
export async function logToAuditService(accion: string, data: any): Promise<void> {
  try {
    await axios.post(`${LOGS_SERVICE_URL}/logs/audit`, {
      usuarioId: data.usuarioId || null,
      accion,
      servicio: 'auth-service',
      detalles: JSON.stringify(data),
      ipAddress: data.ip || null,
      userAgent: data.userAgent || null,
      exitoso: data.exitoso !== undefined ? data.exitoso : true,
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    // No fallar la operación principal si el logging falla
    console.error('Error enviando log a audit service:', error);
  }
}