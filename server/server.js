import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean)
];

app.use((req, res, next) => {
  const origin = req.get('Origin');

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const usersFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify({}, null, 2));
}

function loadUsers() {
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// CREATE ACCOUNT
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Username must be 3-16 characters and use only letters, numbers, or _.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters.'
    });
  }

  const users = loadUsers();

  if (users[username]) {
    return res.status(409).json({
      success: false,
      message: 'That username already exists.'
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  users[username] = {
    username,
    passwordHash
  };

  saveUsers(users);

  res.json({
    success: true,
    message: 'Account created!'
  });
});

// LOGIN
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const users = loadUsers();
  const user = users[username];

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect username or password.'
    });
  }

  const passwordCorrect = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordCorrect) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect username or password.'
    });
  }

  res.json({
    success: true,
    username: user.username
  });
});

// MULTIPLAYER
const players = {};

io.on('connection', (socket) => {
  console.log('Player joined:', socket.id);

  players[socket.id] = {
    id: socket.id,
    x: 400,
    y: 300,
    name: 'Player'
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

const port = process.env.PORT || 3001;

httpServer.listen(port, () => {
  console.log(`Zombie Escape server running on port ${port}`);
});
