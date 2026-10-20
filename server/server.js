import cors from 'cors';
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
app.use(express.json());

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.107:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://192.168.1.107:5174',
    'https://vasculedude.github.io',
    'https://www.vasculedude.github.io'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origin not allowed: ' + origin));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

const usersFile = path.join(__dirname, 'users.json');

// Create the user database if it doesn't exist.
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

function readUsers() {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// REGISTER
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (
            typeof username !== 'string' ||
            !/^[a-zA-Z0-9_]{3,16}$/.test(username)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Username must be 3–16 letters, numbers or underscores.'
            });
        }

        if (
            typeof password !== 'string' ||
            password.length < 6 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters.'
            });
        }

        const users = readUsers();
        const usernameKey = username.toLowerCase();

        if (users[usernameKey] || Object.values(users).some(user =>
            user.username.toLowerCase() === usernameKey
        )) {
            return res.status(409).json({
                success: false,
                message: 'That username is already taken.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        users[usernameKey] = {
            username,
            passwordHash
        };

        saveUsers(users);
        console.log('Registration saved for:', usernameKey);
        return res.status(201).json({
            success: true,
            message: 'Account created!'
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Could not create account.'
        });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (
            typeof username !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Enter your username and password.'
            });
        }

        const users = readUsers();

        const user = users[username.toLowerCase()] || Object.values(users).find(
            item => item.username.toLowerCase() === username.toLowerCase()
        );

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect username or password.'
            });
        }

        return res.json({
            success: true,
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Could not log in.'
        });
    }
});

// MULTIPLAYER SERVER
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

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
        if (!data || !Number.isFinite(data.x) ||
            !Number.isFinite(data.y)) return;

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
