// Archivo: src/app/api/auth/reset-password/route.ts
// Descripción: Endpoint para reseteo de contraseña
// Cumple con HU-09 (Restablecimiento de contraseña seguro)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength, generateOTP } from '@/lib/auth';
import { registrarLog, AccionAuditoria } from '@/lib/auditoria';

/**
 * Esquema para solicitar OTP
 * Pantalla: Reset Password (Olvidé clave)
 * Rúbrica: 10% - Pantalla de Reseteo
 */
const requestOTPSchema = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * Esquema para verificar OTP y cambiar contraseña
 */
const verifyOTPSchema = z.object({
  email: z.string().email('Email inválido'),
  otp: z.string().length(6, 'El código OTP debe tener 6 dígitos'),
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
 * POST /api/auth/reset-password/request
 * Solicitar código OTP para resetear contraseña
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Acción 1: Solicitar OTP
    if (action === 'request') {
      const validation = requestOTPSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email inválido',
          },
          { status: 400 }
        );
      }

      const { email } = validation.data;

      // Verificar que el usuario existe
      const user = await prisma.usuario.findUnique({
        where: { email },
      });

      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return NextResponse.json({
          success: true,
          message: 'Si el email existe, recibirá un código OTP',
        });
      }

      // HU-09: Generar token seguro con expiración ≤ 5 minutos
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

      // Almacenar OTP temporalmente
      otpStore.set(email, { otp, expiresAt });

      // Limpiar OTP expirado después de 5 minutos
      setTimeout(() => {
        otpStore.delete(email);
      }, 5 * 60 * 1000);

      // Registrar en auditoría
      await registrarLog({
        usuarioId: user.id,
        accion: AccionAuditoria.RESET_PASSWORD,
        recurso: 'AUTENTICACION',
        detalles: {
          paso: 'solicitud_otp',
          timestamp: new Date().toISOString(),
        },
        exitoso: true,
      });

      // NOTA: En producción, aquí se enviaría el OTP por email o SMS
      // Para desarrollo, lo retornamos en la respuesta
      console.log(`OTP para ${email}: ${otp}`);

      return NextResponse.json({
        success: true,
        message: 'Código OTP generado (revisar consola en desarrollo)',
        // SOLO para desarrollo - REMOVER en producción
        devOTP: process.env.NODE_ENV === 'development' ? otp : undefined,
      });
    }

    // Acción 2: Verificar OTP y cambiar contraseña
    if (action === 'verify') {
      const validation = verifyOTPSchema.safeParse(body);

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

      const { email, otp, newPassword } = validation.data;

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

      // Verificar OTP
      const storedOTP = otpStore.get(email);

      if (!storedOTP) {
        return NextResponse.json(
          {
            success: false,
            message: 'Código OTP no encontrado o expirado',
          },
          { status: 400 }
        );
      }

      // HU-09: Verificar expiración (≤ 5 minutos)
      if (new Date() > storedOTP.expiresAt) {
        otpStore.delete(email);
        return NextResponse.json(
          {
            success: false,
            message: 'Código OTP expirado',
          },
          { status: 400 }
        );
      }

      // Verificar que el OTP coincida
      if (storedOTP.otp !== otp) {
        return NextResponse.json(
          {
            success: false,
            message: 'Código OTP incorrecto',
          },
          { status: 400 }
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

      // Eliminar el OTP usado
      otpStore.delete(email);

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