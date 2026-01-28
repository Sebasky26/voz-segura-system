// Users Routes - Gestión de usuarios

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyToken, hashPassword } from '../lib/auth';
import { logToAuditService } from '../lib/logging';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createSupervisorSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

/**
 * Middleware para verificar autenticación
 */
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token requerido'
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  req.user = payload;
  next();
};

/**
 * GET /users/me
 * Obtener información del usuario actual
 */
router.get('/me', requireAuth, async (req: any, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        rol: true,
        nombre: true,
        apellido: true,
        telefono: true,
        estado: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * GET /users (Solo admin)
 * Listar todos los usuarios
 */
router.get('/', requireAuth, async (req: any, res) => {
  try {
    // Verificar que sea admin
    if (req.user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado',
      });
    }

    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        rol: true,
        nombre: true,
        apellido: true,
        estado: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Log de auditoría
    await logToAuditService('LISTAR_USUARIOS', {
      usuarioId: req.user.userId,
      total: users.length,
    });

    res.json({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /users (Solo admin)
 * Crear nuevo supervisor
 */
router.post('/', requireAuth, async (req: any, res) => {
  try {
    // Verificar que sea admin
    if (req.user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden crear supervisores',
      });
    }

    const validation = createSupervisorSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { nombre, apellido, email, password } = validation.data;

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

    // Crear supervisor
    const newSupervisor = await prisma.usuario.create({
      data: {
        email,
        passwordHash,
        nombre,
        apellido,
        rol: 'SUPERVISOR',
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        createdAt: true,
      },
    });

    // Log de auditoría
    await logToAuditService('CREAR_SUPERVISOR', {
      usuarioId: req.user.userId,
      supervisorId: newSupervisor.id,
      email: newSupervisor.email,
      nombre: `${nombre} ${apellido}`,
    });

    res.status(201).json({
      success: true,
      message: 'Supervisor creado correctamente',
      data: newSupervisor,
    });

  } catch (error) {
    console.error('Error creando supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * DELETE /users/:id (Solo admin)
 * Eliminar un usuario
 */
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    // Verificar que sea admin
    if (req.user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar usuarios',
      });
    }

    const { id } = req.params;

    // Verificar que existe el usuario
    const user = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // No permitir eliminar el último admin
    if (user.rol === 'ADMIN') {
      const adminCount = await prisma.usuario.count({
        where: { rol: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar el último administrador',
        });
      }
    }

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id },
    });

    // Log de auditoría
    await logToAuditService('ELIMINAR_USUARIO', {
      usuarioId: req.user.userId,
      eliminadoId: id,
      eliminadoEmail: user.email,
      eliminadoRol: user.rol,
    });

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

export default router;