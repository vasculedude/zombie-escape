import { io } from 'socket.io-client';

const socketUrl = window.location.hostname.includes('github.io')
  ? 'https://zombie-escape-api.onrender.com'
  : 'http://localhost:3001';

export const socket = io(socketUrl, {
  transports: ['websocket', 'polling']
});
