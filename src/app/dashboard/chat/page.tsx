"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Users, Clock, ArrowRight, Loader2 } from "lucide-react";

interface Conversacion {
  usuarioId: string;
  nombre: string;
  rol: string;
  casoId?: string;
  casoTitulo?: string;
  ultimoMensaje?: string;
  ultimaActividad?: string;
  noLeidos: number;
}

export default function ChatGeneralPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; rol: string; nombre: string } | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.rol === "ADMIN") {
      router.push("/dashboard");
      return;
    }

    cargarConversaciones();

    // Actualizar cada 5 segundos
    const interval = setInterval(() => cargarConversaciones(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const cargarConversaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/chat/conversaciones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversaciones(data.conversaciones || []);
      }
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirChat = (usuarioId: string) => {
    router.push(`/dashboard/chat/${usuarioId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-10 h-10 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-900">Chat Anónimo</h1>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Volver al Dashboard
            </button>
          </div>
          <p className="text-gray-600">
            {user?.rol === "SUPERVISOR"
              ? "Lista de denunciantes con los que puedes comunicarte de forma anónima"
              : "Chatea de forma segura con el supervisor asignado a tu denuncia"}
          </p>
        </div>

        {/* Lista de conversaciones */}
        {conversaciones.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay conversaciones disponibles
            </h3>
            <p className="text-gray-600">
              {user?.rol === "SUPERVISOR"
                ? "Aún no tienes denuncias asignadas con denunciantes activos"
                : "Espera a que un supervisor sea asignado a tu denuncia para iniciar el chat"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversaciones.map((conv) => (
              <div
                key={conv.usuarioId}
                onClick={() => abrirChat(conv.usuarioId)}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-indigo-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {conv.rol === "SUPERVISOR" ? "Supervisor Asignado" : conv.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Caso: {conv.casoTitulo || 'Sin título'}
                      </p>
                      {conv.ultimoMensaje && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conv.ultimoMensaje}
                        </p>
                      )}
                      {conv.ultimaActividad && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="w-4 h-4" />
                          {new Date(conv.ultimaActividad).toLocaleString("es-EC")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {conv.noLeidos > 0 && (
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                        {conv.noLeidos}
                      </span>
                    )}
                    <ArrowRight className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
