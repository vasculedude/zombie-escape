import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.DEV
    ? 'http://localhost:3001'
    : 'https://zombie-escape-2qlc.onrender.com';

export const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling']
});
