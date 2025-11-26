// Archivo: src/app/dashboard/denuncias/[id]/chat/page.tsx
// Descripción: Chat anónimo entre denunciante y supervisor asignado a la denuncia

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  SendIcon,
  MessageSquareIcon,
  ShieldCheck,
  UserIcon,
  Loader2,
} from 'lucide-react';

interface Message {
  id: string;
  mensaje: string;
  rol: string;
  esPropio: boolean;
  createdAt: string;
}

export default function ChatDenunciaPage() {
  const router = useRouter();
  const params = useParams();
  const denunciaId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; rol: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar mensajes
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    setCurrentUser(user);
    loadMessages();

    // Actualizar mensajes cada 3 segundos
    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, [denunciaId, router]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔵 [Chat] Cargando mensajes para denuncia:', denunciaId);
      
      const response = await fetch(`/api/chat?denunciaId=${denunciaId}&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('🔵 [Chat] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Chat] Mensajes recibidos:', data);
        setMessages(data.mensajes || []);
      } else {
        const error = await response.json();
        console.error('❌ [Chat] Error al cargar:', error);
      }
    } catch (error) {
      console.error('❌ [Chat] Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    console.log('🔵 [Chat] Enviando mensaje...');
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔵 [Chat] Token existe:', !!token);
      console.log('🔵 [Chat] Denuncia ID:', denunciaId);
      console.log('🔵 [Chat] Mensaje:', newMessage.trim());
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          denunciaId,
          mensaje: newMessage.trim(),
        }),
      });

      console.log('🔵 [Chat] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Chat] Mensaje enviado exitosamente:', data);
        setNewMessage('');
        await loadMessages();
      } else {
        const error = await response.json();
        console.error('❌ [Chat] Error del servidor:', error);
        alert(error.message || error.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('❌ [Chat] Error al enviar mensaje:', error);
      alert('Error al enviar mensaje: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
            onClick={() => router.push(`/dashboard/denuncias/${denunciaId}`)}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver a la Denuncia</span>
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MessageSquareIcon className="w-8 h-8 mr-3 text-indigo-600" />
              Chat Anónimo
            </h1>
            <p className="text-gray-600 mt-2">
              {currentUser?.rol === 'DENUNCIANTE' 
                ? 'Comunícate con el supervisor asignado de forma anónima'
                : 'Comunícate con el denunciante de forma anónima'}
            </p>
          </div>
        </div>

        {/* Panel del chat */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: '70vh' }}>
          {/* Header del chat */}
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentUser?.rol === 'DENUNCIANTE' ? (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    <div>
                      <p className="font-medium">Supervisor Asignado</p>
                      <p className="text-xs text-indigo-100">Identidad protegida</p>
                    </div>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-6 h-6" />
                    <div>
                      <p className="font-medium">Denunciante</p>
                      <p className="text-xs text-indigo-100">Identidad protegida</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm">Activo</span>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquareIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay mensajes aún</p>
                <p className="text-sm text-gray-400 mt-1">Envía un mensaje para comenzar</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.esPropio;
                const isSupervisor = message.rol === 'SUPERVISOR';

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                      {/* Rol del usuario */}
                      <div
                        className={`flex items-center space-x-2 mb-1 ${
                          isOwn ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {isSupervisor && <ShieldCheck className="w-4 h-4 text-indigo-600" />}
                        {!isSupervisor && <UserIcon className="w-4 h-4 text-gray-600" />}
                        <span className="text-xs font-medium text-gray-600">
                          {message.rol === 'DENUNCIANTE' ? 'Denunciante' : 'Supervisor'}
                        </span>
                      </div>

                      {/* Mensaje */}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isOwn
                            ? 'bg-linear-to-br from-indigo-600 to-purple-600 text-white'
                            : 'bg-white border-2 border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.mensaje}</p>
                      </div>

                      {/* Timestamp */}
                      <p
                        className={`text-xs text-gray-400 mt-1 ${
                          isOwn ? 'text-right' : 'text-left'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensaje */}
          <div className="p-4 bg-white border-t-2 border-gray-100">
            <div className="flex items-end space-x-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje de forma anónima..."
                rows={2}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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
            <p className="text-xs text-gray-500 mt-2">
              🔒 Tu identidad está protegida. Solo se muestra tu rol (denunciante o supervisor).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
