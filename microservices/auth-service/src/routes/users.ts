// Users Routes - Gestión de usuarios

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../lib/auth';

const router = Router();
const prisma = new PrismaClient();

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

export default router;