"use strict";
// Auth Library - Migrado del proyecto original
// Funciones de autenticación, JWT, validación de contraseñas
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.isUserLocked = isUserLocked;
exports.recordFailedLogin = recordFailedLogin;
exports.resetFailedLogins = resetFailedLogins;
exports.validatePasswordStrength = validatePasswordStrength;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'voz-segura-jwt-secret-super-seguro-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15');
/**
 * Hashear contraseña con bcrypt (12 rounds)
 */
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
/**
 * Verificar contraseña
 */
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
/**
 * Generar token JWT
 */
function generateToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        rol: user.rol,
    };
    // @ts-ignore - JWT types issue with expiresIn
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
/**
 * Verificar token JWT
 */
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
/**
 * Verificar si un usuario está bloqueado
 */
async function isUserLocked(userId) {
    const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { bloqueadoHasta: true, estado: true },
    });
    if (!user || user.estado === 'BLOQUEADO')
        return true;
    // Verificar si el bloqueo temporal expiró
    if (user.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
        return true;
    }
    // Si el bloqueo expiró, resetear
    if (user.bloqueadoHasta && user.bloqueadoHasta <= new Date()) {
        await prisma.usuario.update({
            where: { id: userId },
            data: {
                bloqueadoHasta: null,
                intentosFallidos: 0,
            },
        });
    }
    return false;
}
/**
 * Registrar intento fallido de login
 */
async function recordFailedLogin(userId) {
    const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { intentosFallidos: true },
    });
    if (!user)
        return;
    const newAttempts = user.intentosFallidos + 1;
    const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
    await prisma.usuario.update({
        where: { id: userId },
        data: {
            intentosFallidos: newAttempts,
            bloqueadoHasta: shouldLock
                ? new Date(Date.now() + LOCKOUT_DURATION * 60 * 1000)
                : null,
        },
    });
}
/**
 * Resetear intentos fallidos
 */
async function resetFailedLogins(userId) {
    await prisma.usuario.update({
        where: { id: userId },
        data: {
            intentosFallidos: 0,
            bloqueadoHasta: null,
        },
    });
}
/**
 * Validar fortaleza de contraseña
 */
function validatePasswordStrength(password) {
    if (password.length < 8) {
        return {
            valid: false,
            message: 'La contraseña debe tener al menos 8 caracteres',
        };
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasUpperCase) {
        return {
            valid: false,
            message: 'La contraseña debe contener al menos una letra mayúscula',
        };
    }
    if (!hasLowerCase) {
        return {
            valid: false,
            message: 'La contraseña debe contener al menos una letra minúscula',
        };
    }
    if (!hasNumbers) {
        return {
            valid: false,
            message: 'La contraseña debe contener al menos un número',
        };
    }
    if (!hasSpecialChar) {
        return {
            valid: false,
            message: 'La contraseña debe contener al menos un carácter especial',
        };
    }
    return {
        valid: true,
        message: 'Contraseña válida',
    };
}
//# sourceMappingURL=auth.js.map