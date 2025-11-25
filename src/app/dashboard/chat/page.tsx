// Archivo: src/app/dashboard/chat/page.tsx
// Descripción: Chat en tiempo real con Socket.IO (Admin-Usuario únicamente)
// Rúbrica: 10% - Pantalla Chat con WebSockets

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  SendIcon, 
  MessageSquareIcon, 
  UsersIcon, 
  ArrowLeft, 
  ShieldCheck,
  User as UserIcon,
  Loader2
} from 'lucide-react';
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
  sala?: string;
}

interface OnlineUser {
  userId: string;
  nombre: string;
  apellido: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ 
    id: string; 
    nombre: string; 
    apellido: string; 
    rol: string;
  } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [adminOnline, setAdminOnline] = useState(false);
  const [typing, setTyping] = useState<{ userId: string; nombre: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicializar Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    setCurrentUser(user);

    // Conectar a Socket.IO
    const socketInstance = io('http://localhost:3000', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Conectado a Socket.IO');
      setConnected(true);
      
      // Autenticar usuario
      socketInstance.emit('authenticate', token);
    });

    socketInstance.on('authenticated', (data: { success: boolean; user: any }) => {
      console.log('✅ Autenticado:', data.user);
      loadMessages();
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.IO');
      setConnected(false);
    });

    socketInstance.on('error', (error: string) => {
      console.error('❌ Error:', error);
    });

    // Recibir mensajes en tiempo real
    socketInstance.on('receive-message', (message: Message) => {
      console.log('📩 Nuevo mensaje:', message);
      setMessages((prev) => {
        // Evitar duplicados
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // Lista de usuarios online (solo para admin)
    socketInstance.on('online-users', (users: OnlineUser[]) => {
      console.log('👥 Usuarios online:', users);
      setOnlineUsers(users);
    });

    // Usuario se conectó
    socketInstance.on('user-online', (user: OnlineUser & { room: string }) => {
      console.log('🟢 Usuario online:', user);
      setOnlineUsers((prev) => {
        if (prev.some(u => u.userId === user.userId)) {
          return prev;
        }
        return [...prev, user];
      });
    });

    // Usuario se desconectó
    socketInstance.on('user-offline', (user: OnlineUser) => {
      console.log('🔴 Usuario offline:', user);
      setOnlineUsers((prev) => prev.filter(u => u.userId !== user.userId));
    });

    // Admin online/offline
    socketInstance.on('admin-online', (data: { nombre: string; apellido: string }) => {
      console.log('👑 Admin online:', data);
      setAdminOnline(true);
    });

    socketInstance.on('admin-offline', () => {
      console.log('👑 Admin offline');
      setAdminOnline(false);
    });

    // Indicador de "escribiendo..."
    socketInstance.on('user-typing', (data: { userId: string; nombre: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTyping(data);
        // Limpiar después de 3 segundos
        setTimeout(() => setTyping(null), 3000);
      } else {
        setTyping(null);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [router]);

  // Cargar mensajes históricos
  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      let url = '/api/chat?limit=100';
      
      // Si es admin y tiene un usuario seleccionado, cargar mensajes de esa sala
      if ((user.rol === 'ADMIN' || user.rol === 'SUPERVISOR') && selectedUser) {
        url += `&sala=user-${selectedUser}`;
      } else if (user.rol === 'DENUNCIANTE') {
        // Usuario normal carga de sala general o su sala personal
        url += `&sala=general`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.mensajes || []);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensaje
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !connected) return;

    const messageData: { mensaje: string; destinatarioId?: string } = {
      mensaje: newMessage.trim(),
    };

    // Si es admin y tiene un usuario seleccionado, enviar a ese usuario
    if (currentUser && (currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERVISOR') && selectedUser) {
      messageData.destinatarioId = selectedUser;
    }

    socket.emit('send-message', messageData);
    setNewMessage('');
    
    // Detener indicador de "escribiendo..."
    socket.emit('typing', { isTyping: false, destinatarioId: selectedUser || undefined });
  };

  // Manejar tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Indicador de "escribiendo..."
  const handleTyping = () => {
    if (!socket || !connected) return;

    socket.emit('typing', { 
      isTyping: true, 
      destinatarioId: selectedUser || undefined 
    });

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Detener indicador después de 2 segundos de inactividad
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { 
        isTyping: false, 
        destinatarioId: selectedUser || undefined 
      });
    }, 2000);
  };

  // Seleccionar usuario para chatear (solo admin)
  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
    setMessages([]);
    setLoading(true);
    
    // Cargar mensajes de ese usuario
    setTimeout(() => {
      loadMessages();
    }, 100);
  };

  const isAdmin = currentUser && (currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERVISOR');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con botón volver */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver al Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageSquareIcon className="w-8 h-8 mr-3 text-indigo-600" />
                Chat en Tiempo Real
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdmin 
                  ? 'Comunícate con los usuarios que necesitan ayuda' 
                  : 'Comunícate con los administradores de forma segura'}
              </p>
            </div>

            {/* Indicador de conexión */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Layout del chat */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Solo visible para admin */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <UsersIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Usuarios Online</h3>
                  <span className="bg-indigo-100 text-indigo-600 text-xs font-medium px-2 py-1 rounded-full">
                    {onlineUsers.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {onlineUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay usuarios conectados
                    </p>
                  ) : (
                    onlineUsers.map((user) => (
                      <button
                        key={user.userId}
                        onClick={() => handleSelectUser(user.userId)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          selectedUser === user.userId
                            ? 'bg-indigo-100 border-2 border-indigo-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {user.nombre.charAt(0)}{user.apellido.charAt(0)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 text-sm">
                            {user.nombre} {user.apellido}
                          </p>
                          <p className="text-xs text-green-600 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            En línea
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Panel del chat */}
          <div className={isAdmin ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: '70vh' }}>
              {/* Header del chat */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isAdmin ? (
                      selectedUser ? (
                        <>
                          <UserIcon className="w-6 h-6" />
                          <div>
                            <p className="font-medium">
                              {onlineUsers.find(u => u.userId === selectedUser)?.nombre || 'Usuario'}
                            </p>
                            <p className="text-xs text-indigo-100">En línea</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <MessageSquareIcon className="w-6 h-6" />
                          <p className="font-medium">Selecciona un usuario para chatear</p>
                        </>
                      )
                    ) : (
                      <>
                        <ShieldCheck className="w-6 h-6" />
                        <div>
                          <p className="font-medium">Administradores</p>
                          <p className="text-xs text-indigo-100">
                            {adminOnline ? 'En línea' : 'Offline'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquareIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay mensajes aún</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {isAdmin ? 'Selecciona un usuario y comienza a chatear' : 'Envía un mensaje para comenzar'}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = currentUser && message.usuario.id === currentUser.id;
                    const isAdminMessage = message.usuario.rol === 'ADMIN' || message.usuario.rol === 'SUPERVISOR';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                          {/* Nombre del usuario */}
                          <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {isAdminMessage && <ShieldCheck className="w-4 h-4 text-indigo-600" />}
                            <span className="text-xs font-medium text-gray-600">
                              {message.usuario.nombre} {message.usuario.apellido}
                            </span>
                          </div>

                          {/* Mensaje */}
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isOwn
                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                                : 'bg-white border-2 border-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.mensaje}
                            </p>
                          </div>

                          {/* Timestamp */}
                          <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
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

                {/* Indicador de "escribiendo..." */}
                {typing && typing.userId !== currentUser?.id && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-gray-200 rounded-2xl px-4 py-3">
                      <p className="text-sm text-gray-500 italic">
                        {typing.nombre} está escribiendo...
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="p-4 bg-white border-t-2 border-gray-100">
                {!connected ? (
                  <div className="text-center text-sm text-red-600 py-2">
                    Desconectado. Reconectando...
                  </div>
                ) : (
                  <div className="flex items-end space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu mensaje..."
                      rows={2}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      disabled={!connected}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !connected}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SendIcon className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
