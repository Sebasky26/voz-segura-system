import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
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

    const regla = await prisma.reglaSupervisor.findUnique({
      where: { id },
    });

    if (!regla) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    // Obtener información del supervisor
    const supervisor = await prisma.usuario.findUnique({
      where: { id: regla.supervisorId },
      select: {
        id: true,
        email: true,
        rol: true,
        estado: true,
      },
    });

    return NextResponse.json({ ...regla, supervisor });
  } catch (error) {
    console.error("Error al obtener regla:", error);
    return NextResponse.json(
      { error: "Error al obtener regla" },
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

    const usuario = verifyToken(token) as unknown as { id: string; rol: string };
    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const { categoria, supervisorId, prioridad, activa, nombre, descripcion } = await request.json();

    // Verificar que la regla existe
    const reglaExistente = await prisma.reglaSupervisor.findUnique({
      where: { id },
    });

    if (!reglaExistente) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    // Validar prioridad si se proporciona
    if (prioridad !== undefined && (prioridad < 0 || prioridad > 3)) {
      return NextResponse.json(
        { error: "La prioridad debe estar entre 0 (BAJA) y 3 (URGENTE)" },
        { status: 400 }
      );
    }

    // Si se cambia la categoría o prioridad, verificar que no haya otra regla activa
    const categoriaFinal = categoria || reglaExistente.categoria;
    const prioridadFinal = prioridad !== undefined ? prioridad : reglaExistente.prioridad;
    const activaFinal = activa !== undefined ? activa : reglaExistente.activa;

    if ((categoria || prioridad !== undefined) && activaFinal) {
      const otraReglaActiva = await prisma.reglaSupervisor.findFirst({
        where: {
          categoria: categoriaFinal,
          prioridad: prioridadFinal,
          activa: true,
          id: { not: id },
        },
      });

      if (otraReglaActiva) {
        const prioridadTexto = ["BAJA", "MEDIA", "ALTA", "URGENTE"][prioridadFinal];
        return NextResponse.json(
          { error: `Ya existe una regla activa para ${categoriaFinal} con prioridad ${prioridadTexto}` },
          { status: 409 }
        );
      }
    }

    // Si se cambia el supervisor, verificar que existe y es válido
    if (supervisorId && supervisorId !== reglaExistente.supervisorId) {
      const supervisor = await prisma.usuario.findUnique({
        where: { id: supervisorId },
      });

      if (!supervisor || supervisor.rol !== "SUPERVISOR") {
        return NextResponse.json(
          { error: "El usuario especificado no es un supervisor válido" },
          { status: 400 }
        );
      }
    }

    const reglaActualizada = await prisma.reglaSupervisor.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion && { descripcion }),
        ...(categoria && { categoria }),
        ...(supervisorId && { supervisorId }),
        ...(prioridad !== undefined && { prioridad }),
        ...(activa !== undefined && { activa }),
      },
    });

    // Obtener información del supervisor actualizada
    const supervisorActualizado = await prisma.usuario.findUnique({
      where: { id: reglaActualizada.supervisorId },
      select: {
        id: true,
        email: true,
        rol: true,
        estado: true,
      },
    });

    await registrarLog({
      accion: "MODIFICAR_REGLA",
      tabla: "ReglaSupervisor",
      registroId: id,
      usuarioId: usuario.id,
      detalles: { reglaId: id, cambios: { categoria, supervisorId, prioridad, activa, nombre, descripcion }, mensaje: "Regla actualizada" },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      exitoso: true,
    });

    return NextResponse.json({ ...reglaActualizada, supervisor: supervisorActualizado });
  } catch (error) {
    console.error("Error al actualizar regla:", error);
    return NextResponse.json(
      { error: "Error al actualizar regla" },
      { status: 500 }
    );
  }
}

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

    // Verificar que la regla existe
    const regla = await prisma.reglaSupervisor.findUnique({
      where: { id },
    });

    if (!regla) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    // En lugar de eliminar, desactivar la regla
    await prisma.reglaSupervisor.update({
      where: { id },
      data: { activa: false },
    });

    await registrarLog({
      accion: "DESACTIVAR_REGLA",
      tabla: "ReglaSupervisor",
      registroId: id,
      usuarioId: usuario.id,
      detalles: { reglaId: id, mensaje: "Regla desactivada" },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      exitoso: true,
    });

    return NextResponse.json({ message: "Regla desactivada exitosamente" });
  } catch (error) {
    console.error("Error al desactivar regla:", error);
    return NextResponse.json(
      { error: "Error al desactivar regla" },
      { status: 500 }
    );
  }
}
