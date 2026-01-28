// Denuncias Routes - CRUD completo de denuncias
// Migrado del proyecto original: /src/app/api/denuncias/route.ts

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyWithAuthService } from '../lib/auth';
import { logToAuditService } from '../lib/logging';
import { generarCodigoAnonimo, asignarSupervisorAutomatico } from '../lib/utils';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const crearDenunciaSchema = z.object({
  titulo: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  descripcion: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  categoria: z.enum(['ACOSO_LABORAL', 'DISCRIMINACION', 'FALTA_DE_PAGO', 'ACOSO_SEXUAL', 'VIOLACION_DERECHOS', 'OTRO']),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  ubicacionGeneral: z.string().optional(),
});

const actualizarDenunciaSchema = z.object({
  titulo: z.string().min(5).optional(),
  descripcion: z.string().min(20).optional(),
  categoria: z.enum(['ACOSO_LABORAL', 'DISCRIMINACION', 'FALTA_DE_PAGO', 'ACOSO_SEXUAL', 'VIOLACION_DERECHOS', 'OTRO']).optional(),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  ubicacionGeneral: z.string().optional(),
});

const cambiarEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_REVISION', 'APROBADA', 'DERIVADA', 'CERRADA', 'RECHAZADA']),
  comentario: z.string().optional(),
  derivadaA: z.string().optional(),
});

/**
 * GET /denuncias
 * Listar denuncias según rol del usuario
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

    let denuncias;
    const { estado, categoria, page = '1', limit = '10' } = req.query;

    // Construir filtros
    const filtros: any = {};
    if (estado) filtros.estado = estado;
    if (categoria) filtros.categoria = categoria;

    // Paginación
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    switch (user.rol) {
      case 'ADMIN':
        // Admin ve todas las denuncias
        denuncias = await prisma.denuncia.findMany({
          where: filtros,
          include: {
            evidencias: {
              select: { id: true, nombreOriginal: true, tipo: true, createdAt: true },
            },
            historial: {
              select: {
                id: true,
                estadoAnterior: true,
                estadoNuevo: true,
                comentario: true,
                realizadoPor: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: { evidencias: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        });
        break;

      case 'SUPERVISOR':
        // Supervisor ve solo denuncias asignadas a él
        denuncias = await prisma.denuncia.findMany({
          where: {
            ...filtros,
            supervisorId: user.userId,
          },
          include: {
            evidencias: {
              select: { id: true, nombreOriginal: true, tipo: true, createdAt: true },
            },
            historial: {
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: { evidencias: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        });
        break;

      case 'DENUNCIANTE':
        // Denunciante ve solo sus propias denuncias
        denuncias = await prisma.denuncia.findMany({
          where: {
            ...filtros,
            denuncianteId: user.userId,
          },
          include: {
            evidencias: {
              select: { id: true, nombreOriginal: true, tipo: true, createdAt: true },
            },
            _count: {
              select: { evidencias: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        });
        break;

      default:
        return res.status(403).json({
          success: false,
          message: 'Rol no válido',
        });
    }

    // Log de auditoría
    await logToAuditService('LISTAR_DENUNCIAS', {
      usuarioId: user.userId,
      filtros,
      resultados: denuncias.length,
    });

    res.json({
      success: true,
      data: denuncias,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: denuncias.length,
      },
    });

  } catch (error) {
    console.error('Error listando denuncias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /denuncias
 * Crear nueva denuncia (solo denunciantes)
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /denuncias - Iniciando creación de denuncia');
    
    const user = await verifyWithAuthService(req);
    console.log('👤 Usuario verificado:', user?.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo denunciantes pueden crear denuncias
    if (user.rol !== 'DENUNCIANTE') {
      console.log('❌ Usuario no es DENUNCIANTE, rol:', user.rol);
      return res.status(403).json({
        success: false,
        message: 'Solo los denunciantes pueden crear denuncias',
      });
    }

    const validation = crearDenunciaSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { titulo, descripcion, categoria, prioridad, ubicacionGeneral } = validation.data;
    console.log('📋 Datos validados. Título:', titulo.substring(0, 30) + '...');

    // Generar código anónimo único
    const codigoAnonimo = await generarCodigoAnonimo();
    console.log('🔐 Código anónimo generado:', codigoAnonimo);

    // Asignar supervisor automáticamente según reglas
    const supervisorId = await asignarSupervisorAutomatico(categoria, prioridad || 'MEDIA');
    console.log('👨‍💼 Supervisor asignado:', supervisorId);

    // Crear denuncia
    console.log('💾 Creando denuncia en BD...');
    const nuevaDenuncia = await prisma.denuncia.create({
      data: {
        titulo,
        descripcion,
        categoria,
        prioridad: prioridad || 'MEDIA',
        ubicacionGeneral,
        codigoAnonimo,
        denuncianteId: user.userId,
        supervisorId,
      },
    });
    console.log('✅ Denuncia creada. ID:', nuevaDenuncia.id);

    // Crear registro en historial
    console.log('📝 Creando registro en historial...');
    await prisma.historialDenuncia.create({
      data: {
        denunciaId: nuevaDenuncia.id,
        estadoAnterior: 'PENDIENTE',
        estadoNuevo: 'PENDIENTE',
        comentario: 'Denuncia creada',
        realizadoPor: user.userId,
      },
    });
    console.log('✅ Historial creado');

    // Log de auditoría
    console.log('📊 Registrando en auditoría...');
    await logToAuditService('CREAR_DENUNCIA', {
      usuarioId: user.userId,
      denunciaId: nuevaDenuncia.id,
      codigoAnonimo: nuevaDenuncia.codigoAnonimo,
      categoria,
      supervisorAsignado: supervisorId,
    });
    console.log('✅ Auditoría registrada');

    console.log('📤 Retornando respuesta...');
    res.status(201).json({
      success: true,
      message: 'Denuncia creada exitosamente',
      data: nuevaDenuncia,
    });

  } catch (error) {
    console.error('❌ ERROR creando denuncia:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Desconocido');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
});

/**
 * GET /denuncias/:id
 * Obtener denuncia específica
 */
router.get('/:id', async (req, res) => {
  try {
    console.log('👁️ GET /denuncias/:id - Iniciando lectura de denuncia');
    
    const user = await verifyWithAuthService(req);
    console.log('👤 Usuario verificado:', user?.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    const { id } = req.params;
    console.log('🔍 Buscando denuncia con ID:', id);

    const denuncia = await prisma.denuncia.findUnique({
      where: { id },
    });

    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
    }

    console.log('✅ Denuncia encontrada:', denuncia.id);

    // Verificar permisos
    const tieneAcceso = 
      user.rol === 'ADMIN' ||
      (user.rol === 'SUPERVISOR' && denuncia.supervisorId === user.userId) ||
      (user.rol === 'DENUNCIANTE' && denuncia.denuncianteId === user.userId);

    if (!tieneAcceso) {
      console.log('❌ Acceso denegado para usuario:', user.userId);
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta denuncia',
      });
    }

    console.log('📝 Registrando auditoría...');
    // Log de auditoría
    await logToAuditService('VER_DENUNCIA', {
      usuarioId: user.userId,
      denunciaId: id,
    });

    console.log('📤 Retornando denuncia...');
    res.json({
      success: true,
      data: denuncia,
    });

  } catch (error) {
    console.error('❌ ERROR obteniendo denuncia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * PUT /denuncias/:id
 * Actualizar denuncia (solo denunciantes propias)
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('✏️ PUT /denuncias/:id - Iniciando edición de denuncia');
    
    const user = await verifyWithAuthService(req);
    console.log('👤 Usuario verificado:', user?.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    const { id } = req.params;

    const validation = actualizarDenunciaSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    console.log('📋 Datos validados');

    // Verificar que la denuncia existe
    const denuncia = await prisma.denuncia.findUnique({
      where: { id },
    });

    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
    }

    // Solo el denunciante puede editar su propia denuncia
    if (user.rol !== 'DENUNCIANTE' || denuncia.denuncianteId !== user.userId) {
      console.log('❌ Solo puedes editar tus propias denuncias');
      return res.status(403).json({
        success: false,
        message: 'Solo puedes editar tus propias denuncias',
      });
    }

    // No permitir editar denuncias cerradas
    if (denuncia.estado === 'CERRADA' || denuncia.estado === 'RECHAZADA') {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una denuncia cerrada o rechazada',
      });
    }

    console.log('💾 Actualizando denuncia en BD...');
    // Actualizar denuncia
    const denunciaActualizada = await prisma.denuncia.update({
      where: { id },
      data: validation.data,
    });

    console.log('✅ Denuncia actualizada');

    // Log de auditoría
    console.log('📊 Registrando auditoría...');
    await logToAuditService('MODIFICAR_DENUNCIA', {
      usuarioId: user.userId,
      denunciaId: id,
      cambios: validation.data,
    });

    console.log('📤 Retornando respuesta...');
    res.json({
      success: true,
      message: 'Denuncia actualizada exitosamente',
      data: denunciaActualizada,
    });

  } catch (error) {
    console.error('Error actualizando denuncia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * DELETE /denuncias/:id
 * Eliminar denuncia (solo denunciantes propias)
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE /denuncias/:id - Iniciando eliminación de denuncia');
    
    const user = await verifyWithAuthService(req);
    console.log('👤 Usuario verificado:', user?.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    const { id } = req.params;
    console.log('🔍 Buscando denuncia con ID:', id);

    // Verificar que la denuncia existe
    const denuncia = await prisma.denuncia.findUnique({
      where: { id },
    });

    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
    }

    console.log('✅ Denuncia encontrada:', denuncia.id);

    // Solo el denunciante puede eliminar su propia denuncia
    if (user.rol !== 'DENUNCIANTE' || denuncia.denuncianteId !== user.userId) {
      console.log('❌ Solo puedes eliminar tus propias denuncias');
      return res.status(403).json({
        success: false,
        message: 'Solo puedes eliminar tus propias denuncias',
      });
    }

    console.log('💾 Eliminando denuncia de BD...');
    // Eliminar denuncia (cascada elimina evidencias e historial)
    await prisma.denuncia.delete({
      where: { id },
    });

    console.log('✅ Denuncia eliminada');

    // Log de auditoría
    console.log('📊 Registrando auditoría...');
    await logToAuditService('ELIMINAR_DENUNCIA', {
      usuarioId: user.userId,
      denunciaId: id,
      codigoAnonimo: denuncia.codigoAnonimo,
    });

    console.log('📤 Retornando respuesta...');
    res.json({
      success: true,
      message: 'Denuncia eliminada exitosamente',
    });

  } catch (error) {
    console.error('❌ ERROR eliminando denuncia:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Desconocido');
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

/**
 * PATCH /denuncias/:id/estado
 * Cambiar estado de denuncia (solo supervisores)
 */
router.patch('/:id/estado', async (req, res) => {
  try {
    const user = await verifyWithAuthService(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Solo supervisores pueden cambiar el estado
    if (user.rol !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Solo los supervisores pueden cambiar el estado',
      });
    }

    const { id } = req.params;

    const validation = cambiarEstadoSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { estado, comentario, derivadaA } = validation.data;

    // Verificar que la denuncia existe y está asignada al supervisor
    const denuncia = await prisma.denuncia.findUnique({
      where: { id },
    });

    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada',
      });
    }

    if (denuncia.supervisorId !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Esta denuncia no está asignada a ti',
      });
    }

    // Actualizar estado
    const estadoAnterior = denuncia.estado;
    const denunciaActualizada = await prisma.denuncia.update({
      where: { id },
      data: {
        estado,
        derivadaA: estado === 'DERIVADA' ? derivadaA : null,
        fechaDerivacion: estado === 'DERIVADA' ? new Date() : null,
      },
    });

    // Crear registro en historial
    await prisma.historialDenuncia.create({
      data: {
        denunciaId: id,
        estadoAnterior,
        estadoNuevo: estado,
        comentario,
        realizadoPor: user.userId,
      },
    });

    // Log de auditoría
    await logToAuditService('CAMBIO_ESTADO_DENUNCIA', {
      usuarioId: user.userId,
      denunciaId: id,
      estadoAnterior,
      estadoNuevo: estado,
      comentario,
      derivadaA,
    });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: denunciaActualizada,
    });

  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

export default router;