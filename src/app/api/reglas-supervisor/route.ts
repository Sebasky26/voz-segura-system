import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
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

    const reglas = await prisma.reglaSupervisor.findMany({
      orderBy: [
        { categoria: "asc" },
        { prioridad: "asc" },
        { activa: "desc" },
      ],
    });

    // Obtener información de supervisores
    const reglasConSupervisor = await Promise.all(
      reglas.map(async (regla) => {
        const supervisor = await prisma.usuario.findUnique({
          where: { id: regla.supervisorId },
          select: {
            id: true,
            email: true,
            rol: true,
            estado: true,
          },
        });
        return { ...regla, supervisor };
      })
    );

    return NextResponse.json(reglasConSupervisor);
  } catch (error) {
    console.error("Error al obtener reglas:", error);
    return NextResponse.json(
      { error: "Error al obtener reglas" },
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

    const { categoria, supervisorId, prioridad, nombre, descripcion } = await request.json();

    if (!categoria || !supervisorId || prioridad === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: categoria, supervisorId, prioridad" },
        { status: 400 }
      );
    }

    // Validar que prioridad esté entre 0-3
    if (prioridad < 0 || prioridad > 3) {
      return NextResponse.json(
        { error: "La prioridad debe estar entre 0 (BAJA) y 3 (URGENTE)" },
        { status: 400 }
      );
    }

    // Verificar que el supervisor existe y es SUPERVISOR
    const supervisor = await prisma.usuario.findUnique({
      where: { id: supervisorId },
    });

    if (!supervisor || supervisor.rol !== "SUPERVISOR") {
      return NextResponse.json(
        { error: "El usuario especificado no es un supervisor válido" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una regla activa para esta categoría + prioridad
    const reglaExistente = await prisma.reglaSupervisor.findFirst({
      where: {
        categoria,
        prioridad,
        activa: true,
      },
    });

    if (reglaExistente) {
      const prioridadTexto = ["BAJA", "MEDIA", "ALTA", "URGENTE"][prioridad];
      return NextResponse.json(
        { 
          error: `Ya existe una regla activa para ${categoria} con prioridad ${prioridadTexto}`,
          reglaExistente 
        },
        { status: 409 }
      );
    }

    const prioridadTexto = ["BAJA", "MEDIA", "ALTA", "URGENTE"][prioridad];
    const nuevaRegla = await prisma.reglaSupervisor.create({
      data: {
        nombre: nombre || `Regla ${categoria} - ${prioridadTexto}`,
        descripcion,
        categoria,
        supervisorId,
        prioridad,
        activa: true,
      },
    });

    await registrarLog({
      accion: "CREAR_REGLA",
      tabla: "ReglaSupervisor",
      registroId: nuevaRegla.id,
      usuarioId: usuario.id,
      detalles: { categoria, prioridad, supervisorId, mensaje: "Regla creada" },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      exitoso: true,
    });

    return NextResponse.json(nuevaRegla, { status: 201 });
  } catch (error) {
    console.error("Error al crear regla:", error);
    return NextResponse.json(
      { error: "Error al crear regla" },
      { status: 500 }
    );
  }
}
