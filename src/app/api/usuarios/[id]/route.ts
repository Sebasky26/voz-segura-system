import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { registrarLog } from "@/lib/auditoria";

export async function DELETE(
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

    const usuarioAEliminar = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        rol: true,
      },
    });

    if (!usuarioAEliminar) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (usuarioAEliminar.rol !== "SUPERVISOR") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar usuarios con rol SUPERVISOR" },
        { status: 400 }
      );
    }

    await prisma.usuario.delete({
      where: { id },
    });

    await registrarLog({
      accion: "ELIMINAR_SUPERVISOR",
      tabla: "Usuario",
      registroId: id,
      usuarioId: usuario.id || "",
      detalles: { email: usuarioAEliminar.email, mensaje: "Supervisor eliminado" },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      exitoso: true,
    });

    return NextResponse.json({ message: "Supervisor eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
