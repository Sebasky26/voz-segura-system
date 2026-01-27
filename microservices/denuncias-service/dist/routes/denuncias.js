"use strict";
// Denuncias Routes - CRUD completo de denuncias
// Migrado del proyecto original: /src/app/api/denuncias/route.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../lib/auth");
const logging_1 = require("../lib/logging");
const utils_1 = require("../lib/utils");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Validation schemas
const crearDenunciaSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(5, 'El título debe tener al menos 5 caracteres'),
    descripcion: zod_1.z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
    categoria: zod_1.z.enum(['ACOSO_LABORAL', 'DISCRIMINACION', 'FALTA_DE_PAGO', 'ACOSO_SEXUAL', 'VIOLACION_DERECHOS', 'OTRO']),
    prioridad: zod_1.z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
    ubicacionGeneral: zod_1.z.string().optional(),
});
const actualizarDenunciaSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(5).optional(),
    descripcion: zod_1.z.string().min(20).optional(),
    categoria: zod_1.z.enum(['ACOSO_LABORAL', 'DISCRIMINACION', 'FALTA_DE_PAGO', 'ACOSO_SEXUAL', 'VIOLACION_DERECHOS', 'OTRO']).optional(),
    prioridad: zod_1.z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
    ubicacionGeneral: zod_1.z.string().optional(),
});
const cambiarEstadoSchema = zod_1.z.object({
    estado: zod_1.z.enum(['PENDIENTE', 'EN_REVISION', 'APROBADA', 'DERIVADA', 'CERRADA', 'RECHAZADA']),
    comentario: zod_1.z.string().optional(),
    derivadaA: zod_1.z.string().optional(),
});
/**
 * GET /denuncias
 * Listar denuncias según rol del usuario
 */
router.get('/', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        let denuncias;
        const { estado, categoria, page = '1', limit = '10' } = req.query;
        // Construir filtros
        const filtros = {};
        if (estado)
            filtros.estado = estado;
        if (categoria)
            filtros.categoria = categoria;
        // Paginación
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
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
        await (0, logging_1.logToAuditService)('LISTAR_DENUNCIAS', {
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
    }
    catch (error) {
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
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        // Solo denunciantes pueden crear denuncias
        if (user.rol !== 'DENUNCIANTE') {
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
        // Generar código anónimo único
        const codigoAnonimo = await (0, utils_1.generarCodigoAnonimo)();
        // Asignar supervisor automáticamente según reglas
        const supervisorId = await (0, utils_1.asignarSupervisorAutomatico)(categoria, prioridad || 'MEDIA');
        // Crear denuncia
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
            include: {
                evidencias: true,
                _count: {
                    select: { evidencias: true },
                },
            },
        });
        // Crear registro en historial
        await prisma.historialDenuncia.create({
            data: {
                denunciaId: nuevaDenuncia.id,
                estadoAnterior: 'PENDIENTE',
                estadoNuevo: 'PENDIENTE',
                comentario: 'Denuncia creada',
                realizadoPor: user.userId,
            },
        });
        // Log de auditoría
        await (0, logging_1.logToAuditService)('CREAR_DENUNCIA', {
            usuarioId: user.userId,
            denunciaId: nuevaDenuncia.id,
            codigoAnonimo: nuevaDenuncia.codigoAnonimo,
            categoria,
            supervisorAsignado: supervisorId,
        });
        res.status(201).json({
            success: true,
            message: 'Denuncia creada exitosamente',
            data: nuevaDenuncia,
        });
    }
    catch (error) {
        console.error('Error creando denuncia:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
/**
 * GET /denuncias/:id
 * Obtener denuncia específica
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        const { id } = req.params;
        const denuncia = await prisma.denuncia.findUnique({
            where: { id },
            include: {
                evidencias: {
                    select: { id: true, nombreOriginal: true, tipo: true, tamano: true, createdAt: true },
                },
                historial: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!denuncia) {
            return res.status(404).json({
                success: false,
                message: 'Denuncia no encontrada',
            });
        }
        // Verificar permisos
        const tieneAcceso = user.rol === 'ADMIN' ||
            (user.rol === 'SUPERVISOR' && denuncia.supervisorId === user.userId) ||
            (user.rol === 'DENUNCIANTE' && denuncia.denuncianteId === user.userId);
        if (!tieneAcceso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta denuncia',
            });
        }
        // Log de auditoría
        await (0, logging_1.logToAuditService)('VER_DENUNCIA', {
            usuarioId: user.userId,
            denunciaId: id,
        });
        res.json({
            success: true,
            data: denuncia,
        });
    }
    catch (error) {
        console.error('Error obteniendo denuncia:', error);
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
        const user = await (0, auth_1.verifyWithAuthService)(req);
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
        // Actualizar denuncia
        const denunciaActualizada = await prisma.denuncia.update({
            where: { id },
            data: validation.data,
            include: {
                evidencias: true,
                historial: true,
            },
        });
        // Log de auditoría
        await (0, logging_1.logToAuditService)('MODIFICAR_DENUNCIA', {
            usuarioId: user.userId,
            denunciaId: id,
            cambios: validation.data,
        });
        res.json({
            success: true,
            message: 'Denuncia actualizada exitosamente',
            data: denunciaActualizada,
        });
    }
    catch (error) {
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
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        const { id } = req.params;
        // Verificar que la denuncia existe
        const denuncia = await prisma.denuncia.findUnique({
            where: { id },
            include: { evidencias: true },
        });
        if (!denuncia) {
            return res.status(404).json({
                success: false,
                message: 'Denuncia no encontrada',
            });
        }
        // Solo el denunciante puede eliminar su propia denuncia
        if (user.rol !== 'DENUNCIANTE' || denuncia.denuncianteId !== user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes eliminar tus propias denuncias',
            });
        }
        // Eliminar denuncia (cascada elimina evidencias e historial)
        await prisma.denuncia.delete({
            where: { id },
        });
        // Log de auditoría
        await (0, logging_1.logToAuditService)('ELIMINAR_DENUNCIA', {
            usuarioId: user.userId,
            denunciaId: id,
            codigoAnonimo: denuncia.codigoAnonimo,
            evidenciasEliminadas: denuncia.evidencias.length,
        });
        res.json({
            success: true,
            message: 'Denuncia eliminada exitosamente',
        });
    }
    catch (error) {
        console.error('Error eliminando denuncia:', error);
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
        const user = await (0, auth_1.verifyWithAuthService)(req);
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
        await (0, logging_1.logToAuditService)('CAMBIO_ESTADO_DENUNCIA', {
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
    }
    catch (error) {
        console.error('Error cambiando estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
exports.default = router;
//# sourceMappingURL=denuncias.js.map