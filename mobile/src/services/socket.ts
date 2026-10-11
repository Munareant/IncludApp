import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[Socket Mobile] Conectat la IncludApp backend:', socket?.id);
      socket?.emit('join_volunteers');
    });

    socket.on('disconnect', () => {
      console.log('[Socket Mobile] Deconectat de la server');
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;