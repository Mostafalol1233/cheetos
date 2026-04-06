import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./queryClient";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl = API_BASE_URL.startsWith('http') ? API_BASE_URL : undefined;
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Prioritize WebSocket to reduce edge requests
      upgrade: true,
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 5000,
      autoConnect: true,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected via', socket?.io.engine.transport.name);
    });

    socket.on('connect_error', (err) => {
      console.debug('Socket connection error:', err.message);
    });
  }
  return socket;
};
