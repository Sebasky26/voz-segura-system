// Archivo: src/app/api/auth/register/route.ts
// Descripción: Endpoint para registro de nuevos usuarios (SignUp)
// Cumple con RF-14, RF-15 (FIA_SOS.1, FIA_SOS.2)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { registrarLog, AccionAuditoria } from '@/lib/auditoria';

/**
 * Esquema de validación para registro
 * Pantalla: SignUp (Registro/Enrolamiento)
 * Rúbrica: 10% - Pantalla SignUp
 */
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  telefono: z
    .string()
    .regex(/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos')
    .optional(),
  rol: z.enum(['DENUNCIANTE', 'SUPERVISOR', 'ADMIN']).optional(),
});

/**
 * POST /api/auth/register
 * Registrar nuevo usuario en el sistema
 */
export async function POST(request: NextRequest) {
  try {
    // Parsear y validar datos
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

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

    const { email, password, confirmPassword, nombre, apellido, telefono, rol } =
      validation.data;

    // Verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Las contraseñas no coinciden',
        },
        { status: 400 }
      );
    }

    // RF-14 (FIA_SOS.1): Validar robustez de la contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: passwordValidation.message,
        },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'El email ya está registrado',
        },
        { status: 409 }
      );
    }

    // RF-14: Hashear la contraseña con sal (bcrypt con 12 rounds)
    const passwordHash = await hashPassword(password);

    // Crear el nuevo usuario
    // Por defecto, los usuarios registrados son DENUNCIANTES
    const newUser = await prisma.usuario.create({
      data: {
        email,
        passwordHash,
        nombre: nombre || null,
        apellido: apellido || null,
        telefono: telefono || null,
        rol: rol || 'DENUNCIANTE', // Por defecto: DENUNCIANTE
        estado: 'ACTIVO',
        intentosFallidos: 0,
      },
      select: {
        id: true,
        email: true,
        rol: true,
        nombre: true,
        apellido: true,
        telefono: true,
        createdAt: true,
      },
    });

    // Registrar en auditoría
    await registrarLog({
      usuarioId: newUser.id,
      accion: AccionAuditoria.CREAR_USUARIO,
      recurso: `USUARIO:${newUser.id}`,
      detalles: {
        email: newUser.email,
        rol: newUser.rol,
        timestamp: new Date().toISOString(),
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      exitoso: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}