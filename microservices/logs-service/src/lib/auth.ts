// Auth Utils - Integración con auth-service para verificación de tokens

import axios from 'axios';

interface AuthServiceUser {
  userId: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'USUARIO';
}

// URL del auth-service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

/**
 * Verifica token con el auth-service
 */
export const verifyWithAuthService = async (req: any): Promise<AuthServiceUser | null> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // Verificar token con auth-service
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/auth/verify`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 segundos timeout
      }
    );

    if (response.data.success && response.data.valid) {
      return response.data.user;
    }

    return null;

  } catch (error) {
    // Log del error pero no revelar detalles de seguridad
    console.error('Error verificando token con auth-service:', error.message);
    return null;
  }
};

/**
 * Extrae información básica del usuario de un token sin verificar
 * SOLO para logs, NO usar para autorización
 */
export const extractUserInfoForLogging = (req: any): { userId?: string; userAgent?: string; ip?: string } => {
  try {
    const authHeader = req.headers.authorization;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    // Si no hay token, solo retornar info de conexión
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userAgent, ip };
    }

    // Intentar extraer userId del token (sin verificar)
    const token = authHeader.substring(7);
    
    // Decodificar JWT sin verificar (SOLO para logs)
    const payloadBase64 = token.split('.')[1];
    if (payloadBase64) {
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      return {
        userId: payload.userId || payload.sub,
        userAgent,
        ip,
      };
    }

    return { userAgent, ip };

  } catch (error) {
    // Si hay error, solo retornar info básica
    return {
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown',
    };
  }
};

/**
 * Middleware para extraer información de usuario para logs
 * Sin autorización estricta
 */
export const extractUserMiddleware = (req: any, res: any, next: any) => {
  const userInfo = extractUserInfoForLogging(req);
  req.logUserInfo = userInfo;
  next();
};