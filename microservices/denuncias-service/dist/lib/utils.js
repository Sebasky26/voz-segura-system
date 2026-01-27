"use strict";
// Utils Library - Funciones auxiliares para denuncias
// Generación de códigos, asignación de supervisores
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarCodigoAnonimo = generarCodigoAnonimo;
exports.asignarSupervisorAutomatico = asignarSupervisorAutomatico;
exports.mapNumberToPrioridad = mapNumberToPrioridad;
exports.generarNombreCifrado = generarNombreCifrado;
exports.validarTipoArchivo = validarTipoArchivo;
exports.validarTamanoArchivo = validarTamanoArchivo;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Generar código anónimo único para denuncia
 * Formato: DEN-YYYY-XXXX
 */
async function generarCodigoAnonimo() {
    let codigoUnico;
    let existe = true;
    while (existe) {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        codigoUnico = `DEN-${year}-${random}`;
        // Verificar que no exista
        const denunciaExistente = await prisma.denuncia.findUnique({
            where: { codigoAnonimo: codigoUnico },
        });
        existe = !!denunciaExistente;
    }
    return codigoUnico;
}
/**
 * Asignar supervisor automáticamente según reglas configuradas
 */
async function asignarSupervisorAutomatico(categoria, prioridad) {
    try {
        // Mapear prioridades a números
        const prioridadNum = mapPrioridadToNumber(prioridad);
        // Buscar regla activa para esta categoría y prioridad
        const regla = await prisma.reglaSupervisor.findFirst({
            where: {
                categoria: categoria,
                prioridad: prioridadNum,
                activa: true,
            },
            orderBy: { createdAt: 'asc' }, // Regla más antigua tiene prioridad
        });
        if (regla) {
            return regla.supervisorId;
        }
        // Si no hay regla específica, buscar regla general para la categoría
        const reglaGeneral = await prisma.reglaSupervisor.findFirst({
            where: {
                categoria: categoria,
                activa: true,
            },
            orderBy: { prioridad: 'desc' }, // Mayor prioridad primero
        });
        if (reglaGeneral) {
            return reglaGeneral.supervisorId;
        }
        // No hay reglas configuradas, devolver null
        console.warn(`No se encontraron reglas para categoria: ${categoria}, prioridad: ${prioridad}`);
        return null;
    }
    catch (error) {
        console.error('Error asignando supervisor:', error);
        return null;
    }
}
/**
 * Mapear texto de prioridad a número
 */
function mapPrioridadToNumber(prioridad) {
    const map = {
        BAJA: 0,
        MEDIA: 1,
        ALTA: 2,
        URGENTE: 3,
    };
    return map[prioridad] || 1; // Default: MEDIA
}
/**
 * Mapear número a texto de prioridad
 */
function mapNumberToPrioridad(numero) {
    const map = {
        0: 'BAJA',
        1: 'MEDIA',
        2: 'ALTA',
        3: 'URGENTE',
    };
    return map[numero] || 'MEDIA';
}
/**
 * Generar nombre cifrado para archivo de evidencia
 */
function generarNombreCifrado(nombreOriginal) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const extension = nombreOriginal.split('.').pop() || 'bin';
    return `evidencia_${timestamp}_${random}.${extension}`;
}
/**
 * Validar tipos de archivo permitidos para evidencias
 */
function validarTipoArchivo(mimetype) {
    const tiposPermitidos = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'video/mp4',
        'video/avi',
        'video/quicktime'
    ];
    return tiposPermitidos.includes(mimetype);
}
/**
 * Calcular tamaño máximo permitido (10MB)
 */
function validarTamanoArchivo(size) {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    return size <= MAX_SIZE;
}
//# sourceMappingURL=utils.js.map