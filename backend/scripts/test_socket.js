
import { io } from 'socket.io-client';

const PORT = 3001;
const URL = `http://localhost:${PORT}`;

console.log(`Testing Socket.IO connection to ${URL}...`);

const socket = io(URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 3
});

socket.on('connect', () => {
  console.log(`✅ Connected to Socket.IO server with ID: ${socket.id}`);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.log(`❌ Connection error: ${err.message}`);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

setTimeout(() => {
  console.log('❌ Timeout waiting for connection');
  process.exit(1);
}, 5000);
