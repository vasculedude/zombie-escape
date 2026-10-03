import Phaser from 'phaser';
import { socket } from './network/socket.js';
import MenuScene from './scenes/MenuScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import GameScene from './scenes/GameScene.js';
socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});
const config = {
    type: Phaser.AUTO,

    width: 800,
    height: 600,

    backgroundColor: '#101010',

    physics: {
        default: 'arcade',

        arcade: {
            debug: false
        }
    },

    scene: [
        MenuScene,
        CharacterScene,
        GameScene
    ]
};

const authPanel = document.querySelector('#auth-panel');
const authForm = document.querySelector('#auth-form');
const authTitle = document.querySelector('#auth-title');
const authSubtitle = document.querySelector('#auth-subtitle');
const authMessage = document.querySelector('#auth-message');
const submitButton = document.querySelector('#submit-button');
const modeButtons = document.querySelectorAll('[data-mode]');
const apiUrl = import.meta.env.VITE_AUTH_API_URL ||
    (window.location.hostname.includes('github.io')
        ? 'https://zombie-escape-api.onrender.com'
        : 'http://localhost:3001');
let mode = 'login';

function setMode(nextMode) {
    mode = nextMode;
    const creatingAccount = mode === 'register';

    authTitle.textContent = creatingAccount ? 'Join the survivors' : 'Welcome back';
    authSubtitle.textContent = creatingAccount
        ? 'Create an account to enter the safehouse.'
        : 'Sign in to continue your escape.';
    submitButton.textContent = creatingAccount ? 'Create account' : 'Enter the safehouse';
    document.querySelector('#password').autocomplete = creatingAccount ? 'new-password' : 'current-password';
    authMessage.textContent = '';
    authMessage.removeAttribute('data-state');

    modeButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
}

async function requestAuth(endpoint, credentials) {
    const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Authentication failed. Please try again.');
    }

    return result;
}

function startGame() {
    authPanel.remove();
    new Phaser.Game(config);
}

modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
});

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const credentials = Object.fromEntries(new FormData(authForm));

    submitButton.disabled = true;
    submitButton.textContent = mode === 'register' ? 'Creating account...' : 'Signing in...';
    authMessage.textContent = '';
    authMessage.removeAttribute('data-state');

    try {
        if (mode === 'register') {
            await requestAuth('register', credentials);
        }

        const user = await requestAuth('login', credentials);
        authMessage.dataset.state = 'success';
        authMessage.textContent = `Welcome, ${user.username}. Opening the safehouse...`;
        startGame();
    } catch (error) {
        authMessage.dataset.state = 'error';
        authMessage.textContent = error instanceof TypeError
            ? 'Could not reach the server. Check that the game server is running.'
            : error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = mode === 'register' ? 'Create account' : 'Enter the safehouse';
    }
});