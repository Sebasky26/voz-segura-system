// Archivo: server.ts
// Descripción: Servidor personalizado de Next.js con Socket.IO
// Este servidor reemplaza el servidor por defecto de Next.js para agregar Socket.IO

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketIO } from './src/app/api/socketio/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Inicializar Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Crear servidor HTTP
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error al manejar la petición', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Inicializar Socket.IO
  initSocketIO(server);

  // Iniciar servidor
  server.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🚀  VOZ SEGURA - Sistema de Denuncias          ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   ✅ Servidor corriendo en: http://${hostname}:${port}       ║
║   ✅ Socket.IO inicializado correctamente                  ║
║   ✅ Chat en tiempo real disponible                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });

  // Manejo de errores
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ El puerto ${port} ya está en uso`);
      process.exit(1);
    } else {
      console.error('❌ Error del servidor:', err);
    }
  });

  // Manejo de cierre del servidor
  const gracefulShutdown = () => {
    console.log('\n🛑 Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});
