"use strict";
// Auth Library para Denuncias Service
// Comunicación con auth-service para verificar tokens
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWithAuthService = verifyWithAuthService;
const axios_1 = __importDefault(require("axios"));
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
/**
 * Verificar token con auth-service
 */
async function verifyWithAuthService(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.substring(7);
        const response = await axios_1.default.post(`${AUTH_SERVICE_URL}/auth/verify`, {
            token
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (response.data.success && response.data.valid) {
            return response.data.user;
        }
        return null;
    }
    catch (error) {
        console.error('Error verificando token con auth-service:', error);
        return null;
    }
}
//# sourceMappingURL=auth.js.map