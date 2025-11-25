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
    
    interface Conversacion {
      usuarioId: string;
      nombre: string;
      rol: string;
      ultimoMensaje: string | null;
      ultimaActividad: string | null;
      noLeidos: number;
    }
    
    let conversaciones: Conversacion[] = [];

    if (user.rol === "SUPERVISOR") {
      // El supervisor ve todos los denunciantes de denuncias que tiene asignadas
      const denuncias = await prisma.denuncia.findMany({
        where: {
          supervisorId: userId,
        },
        select: {
          denuncianteId: true,
          denunciante: {
            select: {
              id: true,
              rol: true,
            },
          },
        },
        distinct: ["denuncianteId"],
      });

      conversaciones = denuncias
        .filter((d) => d.denuncianteId)
        .map((d, index) => ({
          usuarioId: d.denuncianteId!,
          nombre: `#${String(index + 1).padStart(3, "0")}`,
          rol: "DENUNCIANTE",
          ultimoMensaje: null,
          ultimaActividad: null,
          noLeidos: 0,
        }));
    } else if (user.rol === "DENUNCIANTE") {
      // El denunciante SOLO ve al supervisor asignado específicamente a SU caso
      // No puede elegir con quién hablar - solo con quien le fue asignado
      const denuncias = await prisma.denuncia.findMany({
        where: {
          denuncianteId: userId,
          supervisorId: { not: null },
        },
        select: {
          supervisorId: true,
          supervisor: {
            select: {
              id: true,
              rol: true,
            },
          },
        },
        distinct: ["supervisorId"],
      });

      // Solo mostrar los supervisores únicos asignados
      conversaciones = denuncias
        .filter((d) => d.supervisorId)
        .map((d) => ({
          usuarioId: d.supervisorId!,
          nombre: "Supervisor Asignado",
          rol: "SUPERVISOR",
          ultimoMensaje: null,
          ultimaActividad: null,
          noLeidos: 0,
        }));
    }

    return NextResponse.json({ conversaciones });
  } catch (error) {
    console.error("Error al cargar conversaciones:", error);
    return NextResponse.json(
      { error: "Error al cargar conversaciones" },
      { status: 500 }
    );
  }
}
