import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./queryClient";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['polling'],
      upgrade: false,
      path: '/socket.io',
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
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
