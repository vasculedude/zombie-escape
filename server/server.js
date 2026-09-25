import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const players = {};

io.on('connection', (socket) => {
  console.log('Player joined:', socket.id);

  players[socket.id] = {
    id: socket.id,
    x: 400,
    y: 300,
    name: "Player"
  };

  socket.emit('currentPlayers', players);
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('playerMove', (data) => {
    if (!players[socket.id]) return;
    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
    console.log('Player left:', socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log('Zombie Escape server running on port 3001');
});
