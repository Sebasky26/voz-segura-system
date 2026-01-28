// Auth Library para Denuncias Service
// Comunicación con auth-service para verificar tokens

import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

interface UserPayload {
  userId: string;
  email: string;
  rol: string;
}

/**
 * Verificar token con auth-service
 */
export async function verifyWithAuthService(req: any): Promise<UserPayload | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/verify`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    if (response.data.success && response.data.valid) {
      return response.data.user;
    }

    return null;
  } catch (error) {
    console.error('Error verificando token con auth-service:', error);
    return null;
  }
}