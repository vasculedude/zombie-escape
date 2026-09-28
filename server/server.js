import express from 'express';
import { createServer } from 'http';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { Server } from 'socket.io';

const scrypt = promisify(scryptCallback);
const app = express();
const httpServer = createServer(app);

const users = new Map();
const sessions = new Map();
const sessionCookie = 'zombie_escape_session';
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_ORIGIN
].filter(Boolean));

app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigin = req.headers.origin;
  if (allowedOrigins.has(allowedOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function getSessionUser(req) {
  const cookies = req.headers.cookie?.split(';').map((cookie) => cookie.trim()) ?? [];
  const sessionId = cookies.find((cookie) => cookie.startsWith(`${sessionCookie}=`))?.split('=')[1];
  const username = sessionId ? sessions.get(sessionId) : undefined;
  return username ? users.get(username) : undefined;
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: hash.toString('hex') };
}

function setSession(res, username) {
  const sessionId = randomUUID();
  sessions.set(sessionId, username);
  res.setHeader('Set-Cookie', `${sessionCookie}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
}

function publicUser(user) {
  return { username: user.username };
}

app.get('/api/me', (req, res) => {
  const user = getSessionUser(req);
  res.json({ user: user ? publicUser(user) : null });
});

app.post('/api/register', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 letters, numbers, or underscores.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (users.has(username.toLowerCase())) {
    return res.status(409).json({ error: 'That username is already registered.' });
  }

  const passwordData = await hashPassword(password);
  const user = { username, ...passwordData };
  users.set(username.toLowerCase(), user);
  setSession(res, username.toLowerCase());
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = users.get(username);

  if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

  const { hash } = await hashPassword(password, user.salt);
  const matches = timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex'));
  if (!matches) return res.status(401).json({ error: 'Invalid username or password.' });

  setSession(res, username);
  res.json({ user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  const cookies = req.headers.cookie?.split(';').map((cookie) => cookie.trim()) ?? [];
  const sessionId = cookies.find((cookie) => cookie.startsWith(`${sessionCookie}=`))?.split('=')[1];
  if (sessionId) sessions.delete(sessionId);
  res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.sendStatus(204);
});

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

const port = process.env.PORT || 3001;

httpServer.listen(port, () => {
  console.log(`Zombie Escape server running on port ${port}`);
});
