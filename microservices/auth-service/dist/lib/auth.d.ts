export interface JWTPayload {
    userId: string;
    email: string;
    rol: string;
    iat?: number;
    exp?: number;
}
/**
 * Hashear contraseña con bcrypt (12 rounds)
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verificar contraseña
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Generar token JWT
 */
export declare function generateToken(user: {
    id: string;
    email: string;
    rol: string;
}): string;
/**
 * Verificar token JWT
 */
export declare function verifyToken(token: string): JWTPayload | null;
/**
 * Verificar si un usuario está bloqueado
 */
export declare function isUserLocked(userId: string): Promise<boolean>;
/**
 * Registrar intento fallido de login
 */
export declare function recordFailedLogin(userId: string): Promise<void>;
/**
 * Resetear intentos fallidos
 */
export declare function resetFailedLogins(userId: string): Promise<void>;
/**
 * Validar fortaleza de contraseña
 */
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    message: string;
};
//# sourceMappingURL=auth.d.ts.map