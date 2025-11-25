import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = verifyToken(token) as unknown as { id: string; userId: string; rol: string };
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = user.userId || user.id;
    const { searchParams } = new URL(request.url);
    const otroUsuarioId = searchParams.get("otroUsuarioId");

    if (!otroUsuarioId) {
      return NextResponse.json({ error: "Falta otroUsuarioId" }, { status: 400 });
    }

    // Verificar que existe una denuncia compartida entre ambos usuarios
    const denunciaCompartida = await prisma.denuncia.findFirst({
      where: {
        OR: [
          { denuncianteId: userId, supervisorId: otroUsuarioId },
          { denuncianteId: otroUsuarioId, supervisorId: userId },
        ],
      },
    });

    if (!denunciaCompartida) {
      return NextResponse.json(
        { error: "No tienes permiso para chatear con este usuario" },
        { status: 403 }
      );
    }

    // Obtener mensajes entre los dos usuarios
    const mensajes = await prisma.mensajeChat.findMany({
      where: {
        OR: [
          { usuarioId: userId, destinatarioId: otroUsuarioId },
          { usuarioId: otroUsuarioId, destinatarioId: userId },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        mensaje: true,
        usuarioId: true,
        createdAt: true,
        remitente: {
          select: {
            rol: true,
          },
        },
      },
    });

    const mensajesFormateados = mensajes.map((m) => ({
      id: m.id,
      mensaje: m.mensaje,
      rol: m.remitente.rol,
      esPropio: m.usuarioId === userId,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ mensajes: mensajesFormateados });
  } catch (error) {
    console.error("Error al cargar mensajes directos:", error);
    return NextResponse.json(
      { error: "Error al cargar mensajes" },
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

    const user = verifyToken(token) as unknown as { id: string; userId: string; rol: string };
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = user.userId || user.id;
    const { mensaje, destinatarioId } = await request.json();

    if (!mensaje || !destinatarioId) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que existe una denuncia compartida entre ambos usuarios
    const denunciaCompartida = await prisma.denuncia.findFirst({
      where: {
        OR: [
          { denuncianteId: userId, supervisorId: destinatarioId },
          { denuncianteId: destinatarioId, supervisorId: userId },
        ],
      },
    });

    if (!denunciaCompartida) {
      return NextResponse.json(
        { error: "No tienes permiso para chatear con este usuario" },
        { status: 403 }
      );
    }

    // Crear el mensaje
    const nuevoMensaje = await prisma.mensajeChat.create({
      data: {
        mensaje,
        usuarioId: userId,
        destinatarioId,
        denunciaId: denunciaCompartida.id,
      },
      select: {
        id: true,
        mensaje: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ mensaje: nuevoMensaje }, { status: 201 });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    return NextResponse.json(
      { error: "Error al enviar mensaje" },
      { status: 500 }
    );
  }
}
