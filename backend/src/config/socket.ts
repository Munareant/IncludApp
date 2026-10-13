import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { pool } from './db.js'; // conexiunea ta de PostgreSQL

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

    // --- EVENIMENTE CHAT MISIUNE ---

    // 1. Intrarea in camera specifica unei cereri (voluntar + beneficiar)
    socket.on('join_request_chat', ({ requestId }: { requestId: string }) => {
      if (!requestId) return;
      const room = `request_${requestId}`;
      socket.join(room);
      console.log(`[Socket.io] Socket ${socket.id} a intrat in camera ${room}`);
    });

    // 2. Trimiterea unui mesaj in cadrul cererii
    socket.on(
      'send_message',
      async ({
        requestId,
        senderId,
        message,
      }: {
        requestId: string;
        senderId: string;
        message: string;
      }) => {
        try {
          if (!requestId || !senderId || !message?.trim()) return;

          // Salvam mesajul in tabela request_messages
          const query = `
            INSERT INTO request_messages (request_id, sender_id, message)
            VALUES ($1, $2, $3)
            RETURNING id, request_id, sender_id, message, created_at;
          `;
          const result = await pool.query(query, [requestId, senderId, message.trim()]);
          const savedMessage = result.rows[0];

          // Trimitem mesajul tuturor din camera cererii (inclusiv emitatorului)
          io?.to(`request_${requestId}`).emit('receive_message', savedMessage);
        } catch (err) {
          console.error('[Socket.io] Eroare la salvarea/trimiterea mesajului:', err);
        }
      }
    );

    // 3. Parasirea camerei de chat la inchiderea modalului
    socket.on('leave_request_chat', ({ requestId }: { requestId: string }) => {
      if (!requestId) return;
      const room = `request_${requestId}`;
      socket.leave(room);
      console.log(`[Socket.io] Socket ${socket.id} a parasit camera ${room}`);
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