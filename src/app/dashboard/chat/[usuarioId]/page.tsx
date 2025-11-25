"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  SendIcon,
  MessageSquareIcon,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  mensaje: string;
  rol: string;
  esPropio: boolean;
  createdAt: string;
}

export default function ChatDirectoPage() {
  const router = useRouter();
  const params = useParams();
  const otroUsuarioId = params.usuarioId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; rol: string } | null>(null);
  const [casoInfo, setCasoInfo] = useState<{ id: string; titulo: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadCasoInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/chat/conversaciones", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const conv = data.conversaciones?.find(
          (c: { usuarioId: string; casoId?: string; casoTitulo?: string }) => c.usuarioId === otroUsuarioId
        );
        if (conv?.casoId) {
          setCasoInfo({ id: conv.casoId, titulo: conv.casoTitulo || 'Sin título' });
        }
      }
    } catch (error) {
      console.error("Error al cargar info del caso:", error);
    }
  };

  // Función loadMessages con useCallback para evitar advertencias de dependencias
  const loadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/chat/directo?otroUsuarioId=${otroUsuarioId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.mensajes || []);
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    } finally {
      setLoading(false);
    }
  }, [otroUsuarioId]);

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cargar mensajes
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userData);
    setCurrentUser(user);
    loadMessages();
    loadCasoInfo();

    // Actualizar mensajes cada 3 segundos
    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otroUsuarioId, router, loadMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/chat/directo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mensaje: newMessage.trim(),
          destinatarioId: otroUsuarioId,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        await loadMessages();
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/chat")}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver a Conversaciones</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquareIcon className="w-10 h-10 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chat Anónimo</h1>
                <p className="text-gray-600 text-sm">
                  {currentUser?.rol === "SUPERVISOR" ? "Denunciante" : "Supervisor Asignado"}
                  {casoInfo && ` • Caso: ${casoInfo.titulo}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header del chat */}
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {currentUser?.rol === "SUPERVISOR" ? "DENUNCIANTE" : "SUPERVISOR"}
                </h2>
                <p className="text-indigo-100 text-sm">
                  Conversación anónima y segura
                  {casoInfo && ` • ${casoInfo.titulo}`}
                </p>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <MessageSquareIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>No hay mensajes aún. Inicia la conversación.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.esPropio ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                      message.esPropio
                        ? "bg-linear-to-br from-indigo-600 to-purple-600 text-white"
                        : "bg-white border-2 border-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.rol}
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.mensaje}</p>
                    <p className="text-xs mt-2 opacity-60">
                      {new Date(message.createdAt).toLocaleTimeString("es-EC", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensaje */}
          <div className="p-4 border-t-2 border-gray-200 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Escribe tu mensaje anónimo..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-linear-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <SendIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
