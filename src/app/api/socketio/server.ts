// Archivo: src/app/api/socketio/server.ts
// Descripción: Servidor Socket.IO para chat en tiempo real
// Funcionalidad: Admin puede chatear con cualquier usuario, usuarios solo con admin

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '@/lib/prisma';
import { verifyToken, type JWTPayload } from '@/lib/auth';

let io: SocketIOServer | null = null;

interface UserSocket {
  userId: string;
  nombre: string;
  apellido: string;
  rol: string;
  socketId: string;
}

interface ExtendedJWTPayload extends JWTPayload {
  nombre?: string;
  apellido?: string;
}

// Mapa de usuarios conectados
const connectedUsers = new Map<string, UserSocket>();

export function initSocketIO(httpServer: HTTPServer) {
  if (io) {
    console.log('✅ Socket.IO ya está inicializado');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Autenticar usuario al conectarse
    socket.on('authenticate', async (token: string) => {
      try {
        const payload = verifyToken(token);
        if (!payload) {
          socket.emit('error', 'Token inválido');
          socket.disconnect();
          return;
        }

        // Obtener datos completos del usuario desde la base de datos
        const userData = await prisma.usuario.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rol: true,
          },
        });

        if (!userData) {
          socket.emit('error', 'Usuario no encontrado');
          socket.disconnect();
          return;
        }

        // Guardar usuario conectado
        const userSocket: UserSocket = {
          userId: userData.id,
          nombre: userData.nombre || 'Usuario',
          apellido: userData.apellido || '',
          rol: userData.rol,
          socketId: socket.id,
        };

        connectedUsers.set(socket.id, userSocket);

        // Si es admin, unirse a todas las salas
        if (userData.rol === 'ADMIN' || userData.rol === 'SUPERVISOR') {
          socket.join('admin-room');
          console.log(`👑 Admin ${userData.nombre} se unió a admin-room`);
          
          // Notificar a todos los usuarios que admin está online
          socket.broadcast.emit('admin-online', {
            nombre: userData.nombre,
            apellido: userData.apellido,
          });
        } else {
          // Usuario normal se une a su sala personal
          const roomName = `user-${userData.id}`;
          socket.join(roomName);
          console.log(`👤 Usuario ${userData.nombre} se unió a ${roomName}`);

          // Notificar a admins que hay un nuevo usuario
          io?.to('admin-room').emit('user-online', {
            userId: userData.id,
            nombre: userData.nombre,
            apellido: userData.apellido,
            room: roomName,
          });
        }

        socket.emit('authenticated', {
          success: true,
          user: {
            userId: userData.id,
            nombre: userData.nombre,
            apellido: userData.apellido,
            rol: userData.rol,
          },
        });

        // Enviar lista de usuarios online (solo para admins)
        if (userData.rol === 'ADMIN' || userData.rol === 'SUPERVISOR') {
          const onlineUsers = Array.from(connectedUsers.values())
            .filter((u) => u.rol === 'DENUNCIANTE')
            .map((u) => ({
              userId: u.userId,
              nombre: u.nombre,
              apellido: u.apellido,
            }));
          
          socket.emit('online-users', onlineUsers);
        }
      } catch (error) {
        console.error('Error al autenticar:', error);
        socket.emit('error', 'Error de autenticación');
        socket.disconnect();
      }
    });

    // Enviar mensaje
    socket.on('send-message', async (data: { mensaje: string; destinatarioId?: string }) => {
      try {
        const userSocket = connectedUsers.get(socket.id);
        if (!userSocket) {
          socket.emit('error', 'Usuario no autenticado');
          return;
        }

        // Validar que el mensaje no esté vacío
        if (!data.mensaje || data.mensaje.trim().length === 0) {
          return;
        }

        let destinatarioId: string | null = null;
        let sala = 'general';

        // Si es admin, puede enviar a un usuario específico
        if ((userSocket.rol === 'ADMIN' || userSocket.rol === 'SUPERVISOR') && data.destinatarioId) {
          destinatarioId = data.destinatarioId;
          sala = `user-${destinatarioId}`;
        } else if (userSocket.rol === 'DENUNCIANTE') {
          // Usuario normal siempre envía a sala general (admin lo verá)
          sala = `user-${userSocket.userId}`;
        }

        // Guardar mensaje en base de datos
        const nuevoMensaje = await prisma.mensajeChat.create({
          data: {
            mensaje: data.mensaje.trim(),
            usuarioId: userSocket.userId,
            sala,
          },
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                rol: true,
              },
            },
          },
        });

        // Emitir mensaje
        const messageData = {
          id: nuevoMensaje.id,
          mensaje: nuevoMensaje.mensaje,
          usuario: {
            id: nuevoMensaje.usuario.id,
            nombre: nuevoMensaje.usuario.nombre || 'Usuario',
            apellido: nuevoMensaje.usuario.apellido || '',
            rol: nuevoMensaje.usuario.rol,
          },
          createdAt: nuevoMensaje.createdAt.toISOString(),
          sala: nuevoMensaje.sala,
        };

        if (userSocket.rol === 'ADMIN' || userSocket.rol === 'SUPERVISOR') {
          // Admin envía a la sala del usuario específico
          if (destinatarioId) {
            io?.to(`user-${destinatarioId}`).emit('receive-message', messageData);
            // También enviarlo a todos los admins
            io?.to('admin-room').emit('receive-message', messageData);
          } else {
            // Broadcast a todos
            io?.emit('receive-message', messageData);
          }
        } else {
          // Usuario envía a admin
          io?.to('admin-room').emit('receive-message', messageData);
          // Y a su propia sala
          socket.emit('receive-message', messageData);
        }
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', 'Error al enviar mensaje');
      }
    });

    // Usuario escribiendo (typing indicator)
    socket.on('typing', (data: { isTyping: boolean; destinatarioId?: string }) => {
      const userSocket = connectedUsers.get(socket.id);
      if (!userSocket) return;

      if (userSocket.rol === 'ADMIN' || userSocket.rol === 'SUPERVISOR') {
        if (data.destinatarioId) {
          io?.to(`user-${data.destinatarioId}`).emit('user-typing', {
            userId: userSocket.userId,
            nombre: userSocket.nombre,
            isTyping: data.isTyping,
          });
        }
      } else {
        io?.to('admin-room').emit('user-typing', {
          userId: userSocket.userId,
          nombre: userSocket.nombre,
          isTyping: data.isTyping,
        });
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      const userSocket = connectedUsers.get(socket.id);
      if (userSocket) {
        console.log(`❌ Usuario desconectado: ${userSocket.nombre} ${userSocket.apellido}`);
        
        if (userSocket.rol === 'ADMIN' || userSocket.rol === 'SUPERVISOR') {
          socket.broadcast.emit('admin-offline');
        } else {
          io?.to('admin-room').emit('user-offline', {
            userId: userSocket.userId,
            nombre: userSocket.nombre,
            apellido: userSocket.apellido,
          });
        }
        
        connectedUsers.delete(socket.id);
      }
    });
  });

  console.log('✅ Socket.IO inicializado correctamente');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO no está inicializado');
  }
  return io;
}
