// Archivo: src/lib/auth.ts
// Descripción: Funciones de autenticación y autorización
// Cumple con RF-12, RF-13, RF-14 (FIA_AFL, FIA_ATD, FIA_SOS)

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import type { Usuario, Rol } from '@prisma/client';

/**
 * Interfaz para el payload del JWT
 */
export interface JWTPayload {
  userId: string;
  email: string;
  rol: Rol;
  iat?: number;
  exp?: number;
}

/**
 * Configuración de seguridad
 */
const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15');

// ============================================
// FUNCIONES DE HASHING
// ============================================

/**
 * Hashear una contraseña usando bcrypt
 * RF-14 (FIA_SOS.1): Verificación de secretos
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  // 12 rounds de sal para seguridad robusta
  return bcrypt.hash(password, 12);
}

/**
 * Verificar una contraseña contra su hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado
 * @returns true si coinciden
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// FUNCIONES DE JWT
// ============================================

/**
 * Generar un token JWT para un usuario
 * @param user - Usuario autenticado
 * @returns Token JWT
 */
export function generateToken(user: { id: string; email: string; rol: Rol }): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    rol: user.rol,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verificar y decodificar un token JWT
 * @param token - Token JWT
 * @returns Payload decodificado o null si es inválido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// ============================================
// CONTROL DE INTENTOS FALLIDOS
// ============================================

/**
 * RF-12 (FIA_AFL.1): Gestionar fallos de autenticación
 * Verificar si un usuario está bloqueado
 * @param userId - ID del usuario
 * @returns true si está bloqueado
 */
export async function isUserLocked(userId: string): Promise<boolean> {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { bloqueadoHasta: true, estado: true },
  });

  if (!user || user.estado === 'BLOQUEADO') return true;

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
 * RF-12: Registrar un intento fallido de login
 * Bloquear usuario si excede el máximo de intentos
 * @param userId - ID del usuario
 */
export async function recordFailedLogin(userId: string): Promise<void> {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { intentosFallidos: true },
  });

  if (!user) return;

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

  // Registrar en auditoría
  await prisma.auditoriaLog.create({
    data: {
      usuarioId: userId,
      accion: 'LOGIN_FALLIDO',
      recurso: 'AUTENTICACION',
      detalles: JSON.stringify({
        intentos: newAttempts,
        bloqueado: shouldLock,
      }),
      exitoso: false,
    },
  });
}

/**
 * RF-12: Resetear intentos fallidos después de login exitoso
 * @param userId - ID del usuario
 */
export async function resetFailedLogins(userId: string): Promise<void> {
  await prisma.usuario.update({
    where: { id: userId },
    data: {
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
  });
}

// ============================================
// VALIDACIÓN DE CONTRASEÑAS
// ============================================

/**
 * RF-14 (FIA_SOS.1): Verificar robustez de contraseña
 * Política de seguridad:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 * @param password - Contraseña a validar
 * @returns Objeto con resultado y mensaje
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Debe incluir al menos una letra mayúscula' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Debe incluir al menos una letra minúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Debe incluir al menos un número' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      message: 'Debe incluir al menos un carácter especial (!@#$%^&*...)',
    };
  }

  return { valid: true, message: 'Contraseña válida' };
}

// ============================================
// GENERACIÓN DE CÓDIGOS
// ============================================

/**
 * RF-15 (FIA_SOS.2): Generar secretos robustos
 * Generar código anónimo único para denuncias
 * @returns Código en formato DEN-YYYY-XXXX
 */
export async function generateCodigoAnonimo(): Promise<string> {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  const codigo = `DEN-${year}-${random}`;

  // Verificar que no exista (muy improbable, pero por seguridad)
  const exists = await prisma.denuncia.findUnique({
    where: { codigoAnonimo: codigo },
  });

  if (exists) {
    // Recursión si existe (muy improbable)
    return generateCodigoAnonimo();
  }

  return codigo;
}

/**
 * RF-15: Generar código OTP de 6 dígitos
 * Usado para verificación de reseteo de contraseña
 * @returns Código OTP de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// AUTORIZACIÓN
// ============================================

/**
 * Verificar si un usuario tiene uno de los roles permitidos
 * @param userRole - Rol del usuario
 * @param allowedRoles - Roles permitidos
 * @returns true si tiene permiso
 */
export function hasRole(userRole: Rol, allowedRoles: Rol[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Verificar si un usuario es supervisor o admin
 * @param userRole - Rol del usuario
 * @returns true si es supervisor o admin
 */
export function isAdminOrSupervisor(userRole: Rol): boolean {
  return userRole === 'ADMIN' || userRole === 'SUPERVISOR';
}