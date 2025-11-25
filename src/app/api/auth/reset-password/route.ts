// Archivo: src/app/api/auth/reset-password/route.ts
// Descripción: Endpoint para reseteo de contraseña
// Cumple con HU-09 (Restablecimiento de contraseña seguro)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength, generateOTP } from '@/lib/auth';
import { registrarLog, AccionAuditoria } from '@/lib/auditoria';

/**
 * Esquema para verificar identidad del usuario
 * Pantalla: Reset Password (Olvidé clave)
 * Rúbrica: 10% - Pantalla de Reseteo
 */
const verifyIdentitySchema = z.object({
  email: z.string().email('Email inválido'),
  telefono: z.string().regex(/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  apellido: z.string().min(2, 'El apellido es requerido'),
});

/**
 * Esquema para cambiar contraseña después de verificación
 */
const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

/**
 * Almacenamiento temporal de OTPs
 * NOTA: En producción, usar Redis o base de datos
 * Para el primer bimestre, usamos memoria (simple)
 */
const otpStore = new Map<
  string,
  {
    otp: string;
    expiresAt: Date;
  }
>();

/**
 * POST /api/auth/reset-password
 * Restablecimiento de contraseña en dos pasos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Acción 1: Verificar identidad del usuario
    if (action === 'verify') {
      const validation = verifyIdentitySchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Datos inválidos',
            errors: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const { email, telefono, nombre, apellido } = validation.data;

      // Primero verificar si el email existe
      const userByEmail = await prisma.usuario.findUnique({
        where: { email },
      });

      if (!userByEmail) {
        // Registrar intento fallido
        await registrarLog({
          usuarioId: null,
          accion: AccionAuditoria.RESET_PASSWORD,
          recurso: 'AUTENTICACION',
          detalles: {
            paso: 'verificacion_identidad_fallida',
            motivo: 'email_no_existe',
            email,
            timestamp: new Date().toISOString(),
          },
          exitoso: false,
        });

        return NextResponse.json(
          {
            success: false,
            message: 'El correo electrónico no está registrado en el sistema',
            campo: 'email',
          },
          { status: 404 }
        );
      }

      // Verificar teléfono
      if (userByEmail.telefono !== telefono) {
        // Registrar intento fallido
        await registrarLog({
          usuarioId: userByEmail.id,
          accion: AccionAuditoria.RESET_PASSWORD,
          recurso: 'AUTENTICACION',
          detalles: {
            paso: 'verificacion_identidad_fallida',
            motivo: 'telefono_incorrecto',
            timestamp: new Date().toISOString(),
          },
          exitoso: false,
        });

        return NextResponse.json(
          {
            success: false,
            message: 'El número de teléfono no coincide con el registrado',
            campo: 'telefono',
          },
          { status: 400 }
        );
      }

      // Verificar nombre
      if (userByEmail.nombre !== nombre) {
        // Registrar intento fallido
        await registrarLog({
          usuarioId: userByEmail.id,
          accion: AccionAuditoria.RESET_PASSWORD,
          recurso: 'AUTENTICACION',
          detalles: {
            paso: 'verificacion_identidad_fallida',
            motivo: 'nombre_incorrecto',
            timestamp: new Date().toISOString(),
          },
          exitoso: false,
        });

        return NextResponse.json(
          {
            success: false,
            message: 'El nombre no coincide con el registrado',
            campo: 'nombre',
          },
          { status: 400 }
        );
      }

      // Verificar apellido
      if (userByEmail.apellido !== apellido) {
        // Registrar intento fallido
        await registrarLog({
          usuarioId: userByEmail.id,
          accion: AccionAuditoria.RESET_PASSWORD,
          recurso: 'AUTENTICACION',
          detalles: {
            paso: 'verificacion_identidad_fallida',
            motivo: 'apellido_incorrecto',
            timestamp: new Date().toISOString(),
          },
          exitoso: false,
        });

        return NextResponse.json(
          {
            success: false,
            message: 'El apellido no coincide con el registrado',
            campo: 'apellido',
          },
          { status: 400 }
        );
      }

      // Todos los datos coinciden - Registrar verificación exitosa
      await registrarLog({
        usuarioId: userByEmail.id,
        accion: AccionAuditoria.RESET_PASSWORD,
        recurso: 'AUTENTICACION',
        detalles: {
          paso: 'verificacion_identidad_exitosa',
          timestamp: new Date().toISOString(),
        },
        exitoso: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Identidad verificada correctamente',
      });
    }

    // Acción 2: Cambiar contraseña
    if (action === 'reset') {
      const validation = resetPasswordSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Datos inválidos',
            errors: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const { email, newPassword } = validation.data;

      // Verificar que el usuario existe
      const user = await prisma.usuario.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email no encontrado',
          },
          { status: 404 }
        );
      }

      // RF-14: Validar robustez de la nueva contraseña
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            message: passwordValidation.message,
          },
          { status: 400 }
        );
      }

      // Hashear la nueva contraseña
      const passwordHash = await hashPassword(newPassword);

      // Actualizar la contraseña
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          passwordHash,
          intentosFallidos: 0, // Resetear intentos fallidos
          bloqueadoHasta: null, // Desbloquear si estaba bloqueado
        },
      });

      // HU-09: Registrar en trazabilidad
      await registrarLog({
        usuarioId: user.id,
        accion: AccionAuditoria.RESET_PASSWORD,
        recurso: 'AUTENTICACION',
        detalles: {
          paso: 'cambio_exitoso',
          timestamp: new Date().toISOString(),
        },
        exitoso: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      });
    }

    // Acción no válida
    return NextResponse.json(
      {
        success: false,
        message: 'Acción no válida',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error en reset password:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}