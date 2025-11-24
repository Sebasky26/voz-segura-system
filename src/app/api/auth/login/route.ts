// Archivo: src/app/api/auth/login/route.ts
// Descripción: Endpoint para autenticación de usuarios (Login/SignIn)
// Cumple con RF-12 (FIA_AFL.1), RF-14 (FIA_SOS.1)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  generateToken,
  isUserLocked,
  recordFailedLogin,
  resetFailedLogins,
} from '@/lib/auth';
import { registrarLoginExitoso, registrarLoginFallido } from '@/lib/auditoria';

/**
 * Esquema de validación para login
 */
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

/**
 * POST /api/auth/login
 * Pantalla: SignIn (Login)
 * Rúbrica: 10% - Pantalla login con lectura/escritura encriptada
 */
export async function POST(request: NextRequest) {
  try {
    // Parsear y validar datos de entrada
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

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

    const { email, password } = validation.data;

    // Buscar usuario por email
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    // Si no existe el usuario
    if (!user) {
      await registrarLoginFallido(
        email,
        'Usuario no encontrado',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // RF-12 (FIA_AFL.1): Verificar si el usuario está bloqueado
    const locked = await isUserLocked(user.id);
    if (locked) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Cuenta bloqueada temporalmente debido a múltiples intentos fallidos. Intente más tarde.',
        },
        { status: 403 }
      );
    }

    // Verificar si el usuario está inactivo
    if (user.estado === 'INACTIVO' || user.estado === 'BLOQUEADO') {
      await registrarLoginFallido(
        email,
        'Cuenta inactiva o bloqueada',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Cuenta inactiva. Contacte al administrador.',
        },
        { status: 403 }
      );
    }

    // RF-14 (FIA_SOS.1): Verificar contraseña
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      // RF-12: Registrar intento fallido y posible bloqueo
      await recordFailedLogin(user.id);

      await registrarLoginFallido(
        email,
        'Contraseña incorrecta',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // RF-12: Resetear intentos fallidos
    await resetFailedLogins(user.id);

    // RNF-S3: Registrar login exitoso en auditoría
    await registrarLoginExitoso(
      user.id,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    // Generar JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    // Preparar datos del usuario (sin contraseña)
    const userData = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellido: user.apellido,
      telefono: user.telefono,
    };

    // RNF-S2: Retornar token con información de expiración
    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userData,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}