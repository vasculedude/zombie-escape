import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import pg from 'pg';

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

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initialiseDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            username_key VARCHAR(16) PRIMARY KEY,
            username VARCHAR(16) NOT NULL,
            password_hash TEXT NOT NULL
        )
    `);

    console.log('Neon database connected and ready!');
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

        const usernameKey = username.toLowerCase();

        const existing = await pool.query(
            'SELECT username_key FROM users WHERE username_key = $1',
            [usernameKey]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'That username is already taken.'
            });
        }
        const passwordHash = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (username_key, username, password_hash) VALUES ($1, $2, $3)',
            [usernameKey, username, passwordHash]
        );

        console.log('Registration saved in Neon:', usernameKey);
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

        const result = await pool.query(
            'SELECT username, password_hash FROM users WHERE username_key = $1',
            [username.toLowerCase()]
        );

        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
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

const PORT = process.env.PORT || 3001;

initialiseDatabase()
    .then(() => {
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Database startup failed:', error);
        process.exit(1);
    });
