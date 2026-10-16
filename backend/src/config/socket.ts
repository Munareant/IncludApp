import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { GoogleGenAI } from '@google/genai';
import { pool } from './db.js';

let io: SocketIOServer | null = null;
const aiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI() : null;
const AI_SENDER_ID = '00000000-0000-0000-0000-000000000099';

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client conectat: ${socket.id}`);

    socket.on('join_volunteers', () => {
      socket.join('volunteers_room');
    });

    socket.on('join_request_chat', ({ requestId }: { requestId: string }) => {
      if (!requestId) return;
      socket.join(`request_${requestId}`);
      console.log(`[Socket.io] Socket ${socket.id} s-a alaturat camerei request_${requestId}`);
    });

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

          // 1. Salvam mesajul utilizatorului
          const queryUser = `
            INSERT INTO request_messages (request_id, sender_id, message)
            VALUES ($1, $2, $3)
            RETURNING id, request_id, sender_id, message, created_at;
          `;
          const resUser = await pool.query(queryUser, [requestId, senderId, message.trim()]);
          const userMsg = resUser.rows[0];

          io?.to(`request_${requestId}`).emit('receive_message', userMsg);

          // 2. Declanșare răspuns AI dacă mesajul conține @ai sau este în camera de test
          const isAiRequested =
            message.toLowerCase().includes('@ai') ||
            requestId === '00000000-0000-0000-0000-000000000099';

          if (isAiRequested) {
            let aiResponseText = 'Salut! Sunt asistentul IncludApp. Cum te pot sprijini în această misiune?';

            if (aiClient) {
              try {
                const prompt = `Ești un asistent util și empatic integrat în aplicația de asistență comunitară IncludApp. 
Răspunde concis (maxim 2-3 propoziții), în limba română, sprijinind voluntarul sau beneficiarul în misiune.
Mesaj utilizator: "${message.replace(/@ai/gi, '').trim()}"`;

                const aiResult = await aiClient.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: prompt,
                });
                if (aiResult.text) {
                  aiResponseText = aiResult.text.trim();
                }
              } catch (aiErr) {
                console.warn('[Gemini AI] Eroare generare raspuns, folosire fallback:', aiErr);
              }
            }

            // Salvam mesajul generat de AI
            const queryAi = `
              INSERT INTO request_messages (request_id, sender_id, message)
              VALUES ($1, $2, $3)
              RETURNING id, request_id, sender_id, message, created_at;
            `;
            const resAi = await pool.query(queryAi, [requestId, AI_SENDER_ID, `🤖 ${aiResponseText}`]);
            const aiMsg = resAi.rows[0];

            io?.to(`request_${requestId}`).emit('receive_message', aiMsg);
          }
        } catch (err) {
          console.error('[Socket.io] Eroare procesare mesaj:', err);
        }
      }
    );

    socket.on('leave_request_chat', ({ requestId }: { requestId: string }) => {
      if (!requestId) return;
      socket.leave(`request_${requestId}`);
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