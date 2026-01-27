"use strict";
// Evidencias Routes - Gestión de archivos de evidencia
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const auth_1 = require("../lib/auth");
const logging_1 = require("../lib/logging");
const utils_1 = require("../lib/utils");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Configuración de multer para upload de archivos
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5, // Máximo 5 archivos por request
    },
    fileFilter: (req, file, cb) => {
        if (!(0, utils_1.validarTipoArchivo)(file.mimetype)) {
            cb(new Error('Tipo de archivo no permitido'));
            return;
        }
        cb(null, true);
    },
});
/**
 * POST /evidencias
 * Subir evidencias para una denuncia
 */
router.post('/', upload.array('archivos', 5), async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        const { denunciaId } = req.body;
        if (!denunciaId) {
            return res.status(400).json({
                success: false,
                message: 'denunciaId es requerido',
            });
        }
        // Verificar que la denuncia existe
        const denuncia = await prisma.denuncia.findUnique({
            where: { id: denunciaId },
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
                message: 'No tienes permiso para subir evidencias a esta denuncia',
            });
        }
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se enviaron archivos',
            });
        }
        const evidenciasCreadas = [];
        for (const file of files) {
            // Validar tamaño
            if (!(0, utils_1.validarTamanoArchivo)(file.size)) {
                return res.status(400).json({
                    success: false,
                    message: `Archivo ${file.originalname} excede el tamaño máximo de 10MB`,
                });
            }
            // Generar nombre cifrado
            const nombreCifrado = (0, utils_1.generarNombreCifrado)(file.originalname);
            // TODO: En una implementación real, aquí se subiría a un storage (AWS S3, etc.)
            // Por ahora simulamos guardando la metadata
            const rutaCifrada = `/uploads/evidencias/${nombreCifrado}`;
            // Crear registro en BD
            const evidencia = await prisma.evidencia.create({
                data: {
                    denunciaId,
                    nombreOriginal: file.originalname,
                    nombreCifrado,
                    tipo: file.mimetype,
                    tamano: file.size,
                    rutaCifrada,
                },
            });
            evidenciasCreadas.push(evidencia);
        }
        // Log de auditoría
        await (0, logging_1.logToAuditService)('SUBIR_EVIDENCIA', {
            usuarioId: user.userId,
            denunciaId,
            evidenciasSubidas: evidenciasCreadas.length,
            archivos: evidenciasCreadas.map(e => e.nombreOriginal),
        });
        res.status(201).json({
            success: true,
            message: `${evidenciasCreadas.length} evidencia(s) subida(s) exitosamente`,
            data: evidenciasCreadas,
        });
    }
    catch (error) {
        console.error('Error subiendo evidencias:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
/**
 * GET /evidencias/:denunciaId
 * Listar evidencias de una denuncia
 */
router.get('/:denunciaId', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        const { denunciaId } = req.params;
        // Verificar que la denuncia existe
        const denuncia = await prisma.denuncia.findUnique({
            where: { id: denunciaId },
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
                message: 'No tienes permiso para ver las evidencias de esta denuncia',
            });
        }
        const evidencias = await prisma.evidencia.findMany({
            where: { denunciaId },
            select: {
                id: true,
                nombreOriginal: true,
                tipo: true,
                tamano: true,
                createdAt: true,
                // No incluir rutaCifrada por seguridad
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: evidencias,
        });
    }
    catch (error) {
        console.error('Error listando evidencias:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
/**
 * DELETE /evidencias/:id
 * Eliminar evidencia específica
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
        // Verificar que la evidencia existe
        const evidencia = await prisma.evidencia.findUnique({
            where: { id },
            include: {
                denuncia: true,
            },
        });
        if (!evidencia) {
            return res.status(404).json({
                success: false,
                message: 'Evidencia no encontrada',
            });
        }
        // Verificar permisos (solo el denunciante puede eliminar sus evidencias)
        if (user.rol !== 'DENUNCIANTE' || evidencia.denuncia.denuncianteId !== user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes eliminar evidencias de tus propias denuncias',
            });
        }
        // Eliminar evidencia
        await prisma.evidencia.delete({
            where: { id },
        });
        // TODO: En una implementación real, también eliminar el archivo del storage
        // Log de auditoría
        await (0, logging_1.logToAuditService)('ELIMINAR_EVIDENCIA', {
            usuarioId: user.userId,
            denunciaId: evidencia.denunciaId,
            evidenciaId: id,
            nombreOriginal: evidencia.nombreOriginal,
        });
        res.json({
            success: true,
            message: 'Evidencia eliminada exitosamente',
        });
    }
    catch (error) {
        console.error('Error eliminando evidencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
/**
 * GET /evidencias/download/:id
 * Descargar evidencia (implementación futura)
 */
router.get('/download/:id', async (req, res) => {
    try {
        const user = await (0, auth_1.verifyWithAuthService)(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
        // TODO: Implementar descarga segura de archivos
        res.status(501).json({
            success: false,
            message: 'Funcionalidad de descarga en desarrollo',
        });
    }
    catch (error) {
        console.error('Error descargando evidencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
exports.default = router;
//# sourceMappingURL=evidencias.js.map