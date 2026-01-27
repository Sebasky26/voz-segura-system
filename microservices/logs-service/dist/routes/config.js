"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const crearConfigSchema = zod_1.z.object({
    clave: zod_1.z.string().min(1, 'La clave es requerida'),
    valor: zod_1.z.string().min(1, 'El valor es requerido'),
    descripcion: zod_1.z.string().optional(),
    servicio: zod_1.z.string().optional(),
});
const actualizarConfigSchema = zod_1.z.object({
    valor: zod_1.z.string().min(1, 'El valor es requerido'),
    descripcion: zod_1.z.string().optional(),
});
router.get('/', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        if (user.rol !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden gestionar configuraciones',
            });
        }
        const { servicio, page = '1', limit = '50' } = req.query;
        const filtros = {};
        if (servicio)
            filtros.servicio = servicio;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
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
    }
    catch (error) {
        console.error('Error listando configuraciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.get('/:clave', async (req, res) => {
    try {
        const { clave } = req.params;
        const { servicio } = req.query;
        const filtros = { clave };
        if (servicio)
            filtros.servicio = servicio;
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
    }
    catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
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
        const nuevaConfig = await prisma.configuracion.create({
            data: {
                clave,
                valor,
                descripcion,
                servicio,
            },
        });
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
    }
    catch (error) {
        console.error('Error creando configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
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
        const configExistente = await prisma.configuracion.findUnique({
            where: { id },
        });
        if (!configExistente) {
            return res.status(404).json({
                success: false,
                message: 'Configuración no encontrada',
            });
        }
        const configActualizada = await prisma.configuracion.update({
            where: { id },
            data: validation.data,
        });
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
    }
    catch (error) {
        console.error('Error actualizando configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        if (user.rol !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden eliminar configuraciones',
            });
        }
        const { id } = req.params;
        const config = await prisma.configuracion.findUnique({
            where: { id },
        });
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Configuración no encontrada',
            });
        }
        await prisma.configuracion.delete({
            where: { id },
        });
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
    }
    catch (error) {
        console.error('Error eliminando configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map