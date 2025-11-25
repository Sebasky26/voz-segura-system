import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/encryption";
import bcrypt from "bcryptjs";
import { registrarLog } from "@/lib/auditoria";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuario = verifyToken(token) as unknown as { id: string; rol: string };
    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    const usuarioEncontrado = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
        rol: true,
        estado: true,
        createdAt: true,
      },
    });

    if (!usuarioEncontrado) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Descifrar datos para edición
    const usuarioDescifrado = {
      ...usuarioEncontrado,
      nombre: decrypt(usuarioEncontrado.nombre),
      apellido: decrypt(usuarioEncontrado.apellido),
      telefono: decrypt(usuarioEncontrado.telefono),
    };

    return NextResponse.json(usuarioDescifrado);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioAdmin = verifyToken(token) as unknown as { id: string; rol: string };
    if (!usuarioAdmin || usuarioAdmin.rol !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const { nombre, apellido, telefono, email, password, estado } = await request.json();

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const datosActualizacion: {
      nombre?: string | null;
      apellido?: string | null;
      telefono?: string | null;
      email?: string;
      passwordHash?: string;
      estado?: "ACTIVO" | "INACTIVO";
    } = {};

    if (nombre !== undefined) datosActualizacion.nombre = encrypt(nombre);
    if (apellido !== undefined) datosActualizacion.apellido = encrypt(apellido);
    if (telefono !== undefined) datosActualizacion.telefono = telefono ? encrypt(telefono) : null;
    if (email) datosActualizacion.email = email;
    if (password) datosActualizacion.passwordHash = await bcrypt.hash(password, 10);
    if (estado) datosActualizacion.estado = estado as "ACTIVO" | "INACTIVO";

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: datosActualizacion,
      select: {
        id: true,
        email: true,
        rol: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await registrarLog({
      accion: "MODIFICAR_USUARIO",
      tabla: "Usuario",
      registroId: id,
      usuarioId: usuarioAdmin.id,
      detalles: { usuarioModificado: id, mensaje: "Usuario actualizado" },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      exitoso: true,
    });

    return NextResponse.json(usuarioActualizado);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// NO permitir DELETE por temas de auditoría
export async function DELETE() {
  return NextResponse.json(
    { error: "No se permite eliminar usuarios por temas de auditoría. Use el estado INACTIVO en su lugar." },
    { status: 403 }
  );
}
