import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { encrypt, decrypt, maskText } from "@/lib/encryption";
import bcrypt from "bcryptjs";
import { registrarLog } from "@/lib/auditoria";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuario = verifyToken(token) as unknown as { id: string; rol: string };
    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rolParam = searchParams.get("rol");

    const whereClause = rolParam ? { rol: rolParam as "ADMIN" | "SUPERVISOR" | "DENUNCIANTE" } : {};

    const usuarios = await prisma.usuario.findMany({
      where: whereClause,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        estado: true,
        createdAt: true,
        _count: {
          select: {
            denunciasAsignadas: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Descifrar y enmascarar datos sensibles para la lista
    const usuariosSeguros = usuarios.map(u => ({
      id: u.id,
      nombre: maskText(decrypt(u.nombre)), // Mostrar parcialmente
      apellido: maskText(decrypt(u.apellido)),
      email: u.email,
      rol: u.rol,
      estado: u.estado,
      createdAt: u.createdAt,
      cantidadDenuncias: u._count.denunciasAsignadas,
    }));

    return NextResponse.json(usuariosSeguros);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuario = verifyToken(token) as unknown as { id: string; rol: string };
    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { nombre, apellido, telefono, email, password, rol } = await request.json();

    if (!nombre || !apellido || !email || !password || !rol) {
      return NextResponse.json(
        { error: "Nombre, apellido, email, password y rol son obligatorios" },
        { status: 400 }
      );
    }

    if (rol !== "SUPERVISOR") {
      return NextResponse.json(
        { error: "Solo se pueden crear usuarios con rol SUPERVISOR" },
        { status: 400 }
      );
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: encrypt(nombre), // Cifrar antes de guardar
        apellido: encrypt(apellido),
        telefono: telefono ? encrypt(telefono) : null,
        email,
        passwordHash: hashedPassword,
        rol: "SUPERVISOR",
      },
      select: {
        id: true,
        email: true,
        rol: true,
        estado: true,
        createdAt: true,
      },
    });

    await registrarLog({
      accion: "CREAR_SUPERVISOR",
      tabla: "Usuario",
      registroId: nuevoUsuario.id,
      usuarioId: usuario.id,
      detalles: { usuarioId: nuevoUsuario.id, mensaje: "Usuario creado" },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      exitoso: true,
    });

    return NextResponse.json(nuevoUsuario, { status: 201 });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
