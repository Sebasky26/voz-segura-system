"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserMiddleware = exports.extractUserInfoForLogging = exports.verifyWithAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const verifyWithAuthService = async (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.substring(7);
        const response = await axios_1.default.post(`${AUTH_SERVICE_URL}/auth/verify`, {}, {
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
    }
    catch (error) {
        console.error('Error verificando token con auth-service:', error.message);
        return null;
    }
};
exports.verifyWithAuthService = verifyWithAuthService;
const extractUserInfoForLogging = (req) => {
    try {
        const authHeader = req.headers.authorization;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ip = req.ip || req.connection.remoteAddress || 'Unknown';
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { userAgent, ip };
        }
        const token = authHeader.substring(7);
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
    }
    catch (error) {
        return {
            userAgent: req.headers['user-agent'] || 'Unknown',
            ip: req.ip || req.connection.remoteAddress || 'Unknown',
        };
    }
};
exports.extractUserInfoForLogging = extractUserInfoForLogging;
const extractUserMiddleware = (req, res, next) => {
    const userInfo = (0, exports.extractUserInfoForLogging)(req);
    req.logUserInfo = userInfo;
    next();
};
exports.extractUserMiddleware = extractUserMiddleware;
//# sourceMappingURL=auth.js.map