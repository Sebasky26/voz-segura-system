// Config Routes - Gestión de configuraciones del sistema

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyWithAuthService } from '../lib/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const crearConfigSchema = z.object({
  clave: z.string().min(1, 'La clave es requerida'),
  valor: z.string().min(1, 'El valor es requerido'),
  descripcion: z.string().optional(),
  servicio: z.string().optional(),
});

const actualizarConfigSchema = z.object({
  valor: z.string().min(1, 'El valor es requerido'),
  descripcion: z.string().optional(),
});

/**
 * GET /config
 * Listar todas las configuraciones (solo admin)
 */
router.get('/', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede gestionar configuraciones
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden gestionar configuraciones',
      });
    }

    const { servicio, page = '1', limit = '50' } = req.query;

    // Construir filtros
    const filtros: any = {};
    if (servicio) filtros.servicio = servicio;

    // Paginación
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [configuraciones, total] = await Promise.all([
      prisma.configuracion.findMany({
        where: filtros,
        orderBy: [
          { servicio: 'asc' },
          { clave: 'asc' },
        ],
        skip,
        take: limitNum,
      }),
      prisma.configuracion.count({ where: filtros }),
    ]);

    res.json({
      success: true,
      data: configuraciones,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });

  } catch (error) {
    console.error('Error listando configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * GET /config/:clave
 * Obtener configuración específica
 */
router.get('/:clave', async (req, res) => {
  try {
    const { clave } = req.params;
    const { servicio } = req.query;

    // Construir filtros
    const filtros: any = { clave };
    if (servicio) filtros.servicio = servicio;

    const configuracion = await prisma.configuracion.findFirst({
      where: filtros,
    });

    if (!configuracion) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada',
      });
    }

    res.json({
      success: true,
      data: configuracion,
    });

  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /config
 * Crear nueva configuración (solo admin)
 */
router.post('/', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede crear configuraciones
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear configuraciones',
      });
    }

    const validation = crearConfigSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { clave, valor, descripcion, servicio } = validation.data;

    // Verificar que no exista la configuración
    const configExistente = await prisma.configuracion.findFirst({
      where: {
        clave,
        servicio: servicio || null,
      },
    });

    if (configExistente) {
      return res.status(409).json({
        success: false,
        message: 'La configuración ya existe',
      });
    }

    // Crear configuración
    const nuevaConfig = await prisma.configuracion.create({
      data: {
        clave,
        valor,
        descripcion,
        servicio,
      },
    });

    // Log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: user.userId,
        accion: 'CREAR_CONFIGURACION',
        servicio: 'logs-service',
        tabla: 'configuraciones',
        detalles: JSON.stringify({
          clave,
          servicio: servicio || 'global',
        }),
        exitoso: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Configuración creada exitosamente',
      data: nuevaConfig,
    });

  } catch (error) {
    console.error('Error creando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * PUT /config/:id
 * Actualizar configuración existente (solo admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede actualizar configuraciones
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden actualizar configuraciones',
      });
    }

    const { id } = req.params;

    const validation = actualizarConfigSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // Verificar que existe la configuración
    const configExistente = await prisma.configuracion.findUnique({
      where: { id },
    });

    if (!configExistente) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada',
      });
    }

    // Actualizar configuración
    const configActualizada = await prisma.configuracion.update({
      where: { id },
      data: validation.data,
    });

    // Log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: user.userId,
        accion: 'MODIFICAR_CONFIGURACION',
        servicio: 'logs-service',
        tabla: 'configuraciones',
        registroId: id,
        detalles: JSON.stringify({
          configId: id,
          clave: configExistente.clave,
          valorAnterior: configExistente.valor,
          valorNuevo: validation.data.valor,
        }),
        exitoso: true,
      },
    });

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: configActualizada,
    });

  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * DELETE /config/:id
 * Eliminar configuración (solo admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede eliminar configuraciones
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar configuraciones',
      });
    }

    const { id } = req.params;

    // Verificar que existe la configuración
    const config = await prisma.configuracion.findUnique({
      where: { id },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada',
      });
    }

    // Eliminar configuración
    await prisma.configuracion.delete({
      where: { id },
    });

    // Log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: user.userId,
        accion: 'ELIMINAR_CONFIGURACION',
        servicio: 'logs-service',
        tabla: 'configuraciones',
        registroId: id,
        detalles: JSON.stringify({
          configId: id,
          clave: config.clave,
          servicio: config.servicio || 'global',
        }),
        exitoso: true,
      },
    });

    res.json({
      success: true,
      message: 'Configuración eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error eliminando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

export default router;