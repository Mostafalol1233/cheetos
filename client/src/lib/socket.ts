import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./queryClient";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl = API_BASE_URL.startsWith('http') ? API_BASE_URL : undefined;
    const isProduction = window.location.hostname === 'diaasadek.com';
    
    socket = io(socketUrl, {
      transports: isProduction ? ['polling', 'websocket'] : ['websocket', 'polling'], // Fallback to polling for production issues
      upgrade: true,
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 5000,
      autoConnect: true,
      withCredentials: true,
      secure: window.location.protocol === 'https:',
    });

    socket.on('connect', () => {
      console.log('Socket connected via', socket?.io.engine.transport.name);
    });

    socket.on('connect_error', (err) => {
      if (window.location.hostname === 'diaasadek.com' && err.message === 'websocket error') {
        // Suppress noisy websocket upgrade errors in production console
        return;
      }
      console.debug('Socket connection error:', err.message);
    });
  }
  return socket;
};
