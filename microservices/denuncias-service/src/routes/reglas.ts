// Reglas Routes - Gestión de reglas de asignación de supervisores

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyWithAuthService } from '../lib/auth';
import { logToAuditService } from '../lib/logging';
import { mapNumberToPrioridad } from '../lib/utils';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const crearReglaSchema = z.object({
  categoria: z.string().min(1, 'Categoría requerida'),
  supervisorId: z.string().min(1, 'Supervisor requerido'),
  descripcion: z.string().optional(),
});

const actualizarReglaSchema = z.object({
  nombre: z.string().min(3).optional(),
  descripcion: z.string().optional(),
  categoria: z.enum(['ACOSO_LABORAL', 'DISCRIMINACION', 'FALTA_DE_PAGO', 'ACOSO_SEXUAL', 'VIOLACION_DERECHOS', 'OTRO']).optional(),
  prioridad: z.number().min(0).max(3).optional(),
  supervisorId: z.string().uuid().optional(),
  activa: z.boolean().optional(),
});

/**
 * GET /reglas
 * Listar todas las reglas de asignación (solo admin)
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

    // Solo admin puede ver las reglas
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden gestionar reglas',
      });
    }

    const { categoria, activa, page = '1', limit = '20' } = req.query;

    // Construir filtros
    const filtros: any = {};
    if (categoria) filtros.categoria = categoria;
    if (activa !== undefined) filtros.activa = activa === 'true';

    // Paginación
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const reglas = await prisma.reglaSupervisor.findMany({
      where: filtros,
      orderBy: [
        { categoria: 'asc' },
        { prioridad: 'desc' },
        { createdAt: 'asc' },
      ],
      skip,
      take: limitNum,
    });

    // Mapear prioridades numéricas a texto para mejor lectura
    const reglasConPrioridad = reglas.map(regla => ({
      ...regla,
      prioridadTexto: mapNumberToPrioridad(regla.prioridad),
    }));

    // Log de auditoría
    await logToAuditService('LISTAR_REGLAS_SUPERVISOR', {
      usuarioId: user.userId,
      filtros,
      resultados: reglas.length,
    });

    res.json({
      success: true,
      data: reglasConPrioridad,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: reglasConPrioridad.length,
      },
    });

  } catch (error) {
    console.error('Error listando reglas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /reglas
 * Crear nueva regla de asignación (solo admin)
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

    // Solo admin puede crear reglas
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear reglas',
      });
    }

    const validation = crearReglaSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { descripcion, categoria, supervisorId } = validation.data;

    // Verificar que no existe una regla activa para la misma categoría y prioridad
    const reglaExistente = await prisma.reglaSupervisor.findFirst({
      where: {
        categoria: categoria as any,
        activa: true,
      },
    });

    if (reglaExistente) {
      return res.status(409).json({
        success: false,
        message: `Ya existe una regla activa para ${categoria}`,
      });
    }

    // Crear regla
    const nuevaRegla = await prisma.reglaSupervisor.create({
      data: {
        nombre: `Regla ${categoria}`,
        descripcion,
        categoria: categoria as any,
        prioridad: 1, // Prioridad media por defecto
        supervisorId,
      },
    });

    // Log de auditoría
    await logToAuditService('CREAR_REGLA_SUPERVISOR', {
      usuarioId: user.userId,
      reglaId: nuevaRegla.id,
      categoria,
      prioridad: 'MEDIA',
      supervisorId,
    });

    res.status(201).json({
      success: true,
      message: 'Regla creada exitosamente',
      data: {
        ...nuevaRegla,
        prioridadTexto: mapNumberToPrioridad(nuevaRegla.prioridad),
      },
    });

  } catch (error) {
    console.error('Error creando regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * GET /reglas/:id
 * Obtener regla específica (solo admin)
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo admin puede ver reglas
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden ver reglas',
      });
    }

    const { id } = req.params;

    const regla = await prisma.reglaSupervisor.findUnique({
      where: { id },
    });

    if (!regla) {
      return res.status(404).json({
        success: false,
        message: 'Regla no encontrada',
      });
    }

    res.json({
      success: true,
      data: {
        ...regla,
        prioridadTexto: mapNumberToPrioridad(regla.prioridad),
      },
    });

  } catch (error) {
    console.error('Error obteniendo regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * PUT /reglas/:id
 * Actualizar regla existente (solo admin)
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

    // Solo admin puede actualizar reglas
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden actualizar reglas',
      });
    }

    const { id } = req.params;

    const validation = actualizarReglaSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // Verificar que la regla existe
    const reglaExistente = await prisma.reglaSupervisor.findUnique({
      where: { id },
    });

    if (!reglaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Regla no encontrada',
      });
    }

    // Si se está cambiando categoría o prioridad, verificar conflictos
    if (validation.data.categoria || validation.data.prioridad !== undefined) {
      const nuevaCategoria = validation.data.categoria || reglaExistente.categoria;
      const nuevaPrioridad = validation.data.prioridad !== undefined ? validation.data.prioridad : reglaExistente.prioridad;

      const conflicto = await prisma.reglaSupervisor.findFirst({
        where: {
          categoria: nuevaCategoria as any,
          prioridad: nuevaPrioridad,
          activa: true,
          id: { not: id }, // Excluir la regla actual
        },
      });

      if (conflicto) {
        return res.status(409).json({
          success: false,
          message: `Ya existe una regla activa para ${nuevaCategoria} con prioridad ${mapNumberToPrioridad(nuevaPrioridad)}`,
        });
      }
    }

    // Actualizar regla
    const reglaActualizada = await prisma.reglaSupervisor.update({
      where: { id },
      data: validation.data,
    });

    // Log de auditoría
    await logToAuditService('MODIFICAR_REGLA_SUPERVISOR', {
      usuarioId: user.userId,
      reglaId: id,
      cambios: validation.data,
    });

    res.json({
      success: true,
      message: 'Regla actualizada exitosamente',
      data: {
        ...reglaActualizada,
        prioridadTexto: mapNumberToPrioridad(reglaActualizada.prioridad),
      },
    });

  } catch (error) {
    console.error('Error actualizando regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * DELETE /reglas/:id
 * Eliminar regla (solo admin)
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

    // Solo admin puede eliminar reglas
    if (user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar reglas',
      });
    }

    const { id } = req.params;

    // Verificar que la regla existe
    const regla = await prisma.reglaSupervisor.findUnique({
      where: { id },
    });

    if (!regla) {
      return res.status(404).json({
        success: false,
        message: 'Regla no encontrada',
      });
    }

    // Eliminar regla
    await prisma.reglaSupervisor.delete({
      where: { id },
    });

    // Log de auditoría
    await logToAuditService('ELIMINAR_REGLA_SUPERVISOR', {
      usuarioId: user.userId,
      reglaId: id,
      categoria: regla.categoria,
      prioridad: mapNumberToPrioridad(regla.prioridad),
    });

    res.json({
      success: true,
      message: 'Regla eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error eliminando regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

export default router;