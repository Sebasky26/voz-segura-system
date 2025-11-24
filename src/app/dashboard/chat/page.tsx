// Archivo: src/app/dashboard/chat/page.tsx
// Descripción: Pantalla de chat con WebSocket en tiempo real
// Rúbrica: 10% - Pantalla Chat que use WebSockets

'use client';

import { useState, useEffect, useRef } from 'react';
import { SendIcon, MessageSquareIcon, UsersIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  mensaje: string;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
  createdAt: string;
  isOwn?: boolean;
}

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const ROOM = 'general'; // Sala general del chat

  // Inicializar WebSocket y cargar mensajes
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    // Cargar mensajes históricos del backend
    loadMessages();

    // Conectar a WebSocket
    const socketInstance = io({
      path: '/api/socketio',
    });

    socketInstance.on('connect', () => {
      console.log('✅ Conectado a WebSocket');
      setConnected(true);
      socketInstance.emit('join-room', ROOM);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Desconectado de WebSocket');
      setConnected(false);
    });

    // Escuchar nuevos mensajes en tiempo real
    socketInstance.on('receive-message', (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // Escuchar usuarios que se unen
    socketInstance.on('user-joined', (data: any) => {
      setOnlineUsers((prev) => prev + 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat?sala=${ROOM}&limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar mensajes');
      }

      const data = await response.json();
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      // Marcar mensajes propios
      const messagesWithOwnership = data.data.map((msg: Message) => ({
        ...msg,
        isOwn: msg.usuario.id === userData.id,
      }));

      setMessages(messagesWithOwnership);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !socket || !currentUser) return;

    try {
      // Guardar en base de datos
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mensaje: newMessage,
          sala: ROOM,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const data = await response.json();

      // Emitir via WebSocket para tiempo real
      const messageData = {
        ...data.data,
        room: ROOM,
        isOwn: true,
      };

      socket.emit('send-message', messageData);

      // Agregar a la lista local
      setMessages((prev) => [...prev, messageData]);
      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar mensaje');
    }
  };

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleColor = (rol: string) => {
    const colors = {
      ADMIN: 'bg-red-500',
      SUPERVISOR: 'bg-blue-500',
      DENUNCIANTE: 'bg-green-500',
    };
    return colors[rol as keyof typeof colors] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white rounded-t-lg shadow-sm p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-3 rounded-full">
              <MessageSquareIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chat General</h1>
              <p className="text-sm text-gray-500">Comunicación en tiempo real con WebSocket</p>
            </div>
          </div>

          {/* Estado de conexión */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UsersIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{onlineUsers} en línea</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}
              ></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="bg-white shadow-sm p-6 h-[calc(100%-180px)] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquareIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay mensajes aún</p>
              <p className="text-sm text-gray-400">Sé el primero en escribir</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-xl ${msg.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full ${getRoleColor(msg.usuario.rol)} flex items-center justify-center text-white font-semibold text-sm`}
                  >
                    {getInitials(msg.usuario.nombre, msg.usuario.apellido)}
                  </div>

                  {/* Mensaje */}
                  <div>
                    {!msg.isOwn && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {msg.usuario.nombre} {msg.usuario.apellido}
                        </span>
                        <span className="text-xs text-gray-500">{msg.usuario.rol}</span>
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        msg.isOwn
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.mensaje}</p>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">
                      {new Date(msg.createdAt).toLocaleTimeString('es-EC', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input de mensaje */}
      <div className="bg-white rounded-b-lg shadow-sm p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={!connected}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!connected || !newMessage.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
        {!connected && (
          <p className="text-xs text-red-500 mt-2">
            Desconectado del servidor. Intentando reconectar...
          </p>
        )}
      </div>
    </div>
  );
}