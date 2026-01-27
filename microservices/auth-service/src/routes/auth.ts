// Auth Routes - Migrado del proyecto original
// Endpoints: /auth/login, /auth/register, /auth/verify, /auth/reset-password

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../lib/auth';
import { validatePasswordStrength, isUserLocked, recordFailedLogin, resetFailedLogins } from '../lib/auth';
import { logToAuditService } from '../lib/logging';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  telefono: z.string().optional(),
  rol: z.enum(['DENUNCIANTE', 'SUPERVISOR', 'ADMIN']).optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * POST /auth/login
 * Autenticar usuario y generar JWT
 */
router.post('/login', async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password } = validation.data;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      await logToAuditService('LOGIN_FALLIDO', {
        email,
        razon: 'Usuario no encontrado',
        ip,
        userAgent
      });

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar si está bloqueado
    const locked = await isUserLocked(user.id);
    if (locked) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta bloqueada temporalmente debido a múltiples intentos fallidos. Intente más tarde.',
      });
    }

    // Verificar estado del usuario
    if (user.estado === 'INACTIVO' || user.estado === 'BLOQUEADO') {
      await logToAuditService('LOGIN_FALLIDO', {
        usuarioId: user.id,
        email,
        razon: 'Cuenta inactiva o bloqueada',
        ip,
        userAgent
      });

      return res.status(403).json({
        success: false,
        message: 'Cuenta inactiva. Contacte al administrador.',
      });
    }

    // Verificar contraseña
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await recordFailedLogin(user.id);
      await logToAuditService('LOGIN_FALLIDO', {
        usuarioId: user.id,
        email,
        razon: 'Contraseña incorrecta',
        ip,
        userAgent
      });

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Login exitoso
    await resetFailedLogins(user.id);
    await logToAuditService('LOGIN_EXITOSO', {
      usuarioId: user.id,
      email,
      ip,
      userAgent
    });

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    // Preparar datos del usuario
    const userData = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellido: user.apellido,
      telefono: user.telefono,
    };

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userData,
        token,
      },
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /auth/register  
 * Registrar nuevo usuario
 */
router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password, nombre, apellido, telefono, rol } = validation.data;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Validar fortaleza de contraseña
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario
    const newUser = await prisma.usuario.create({
      data: {
        email,
        passwordHash,
        rol: rol || 'DENUNCIANTE',
        nombre,
        apellido,
        telefono,
      },
    });

    // Log de auditoría
    await logToAuditService('REGISTRO_EXITOSO', {
      usuarioId: newUser.id,
      email,
      rol: newUser.rol,
      ip
    });

    // Generar token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      rol: newUser.rol,
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          rol: newUser.rol,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          telefono: newUser.telefono,
        },
        token,
      },
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /auth/verify
 * Verificar si un token JWT es válido
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido',
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Verificar que el usuario aún existe y está activo
    const user = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        rol: true,
        estado: true,
      },
    });

    if (!user || user.estado !== 'ACTIVO') {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido',
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
      },
    });

  } catch (error) {
    console.error('Error en verify:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /auth/reset-password
 * Solicitar reset de contraseña
 */
router.post('/reset-password', async (req, res) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    const { email } = validation.data;

    // Verificar si el usuario existe
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    // Siempre responder con éxito por seguridad (no revelar si el email existe)
    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
    });

    if (user) {
      // Log de auditoría
      await logToAuditService('RESET_PASSWORD_SOLICITADO', {
        usuarioId: user.id,
        email,
      });

      // TODO: En una implementación real, aquí se enviaría un email
      console.log(`Password reset solicitado para: ${email}`);
    }

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

export default router;