import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Permite conexiuni din aplicatia mobila/web de dev
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client nou conectat: ${socket.id}`);

    // Cand un voluntar porneste aplicatia, intra in camera generala de alerte
    socket.on('join_volunteers', () => {
      socket.join('volunteers_room');
      console.log(`[Socket.io] Socket ${socket.id} a intrat in volunteers_room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client deconectat: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io nu a fost initializat inca!');
  }
  return io;
};