/**
 * Generar código anónimo único para denuncia
 * Formato: DEN-YYYY-XXXX
 */
export declare function generarCodigoAnonimo(): Promise<string>;
/**
 * Asignar supervisor automáticamente según reglas configuradas
 */
export declare function asignarSupervisorAutomatico(categoria: string, prioridad: string): Promise<string | null>;
/**
 * Mapear número a texto de prioridad
 */
export declare function mapNumberToPrioridad(numero: number): string;
/**
 * Generar nombre cifrado para archivo de evidencia
 */
export declare function generarNombreCifrado(nombreOriginal: string): string;
/**
 * Validar tipos de archivo permitidos para evidencias
 */
export declare function validarTipoArchivo(mimetype: string): boolean;
/**
 * Calcular tamaño máximo permitido (10MB)
 */
export declare function validarTamanoArchivo(size: number): boolean;
//# sourceMappingURL=utils.d.ts.map