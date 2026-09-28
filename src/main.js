import Phaser from 'phaser';

import MenuScene from './scenes/MenuScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import GameScene from './scenes/GameScene.js';

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
const authDescription = document.querySelector('#auth-description');
const authMessage = document.querySelector('#auth-message');
const authSubmit = document.querySelector('#auth-submit');
const authSwitch = document.querySelector('#auth-switch');
const apiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
let registerMode = false;

function showGame() {
    authPanel.remove();
    new Phaser.Game(config);
}

async function requestAuth(path, body) {
    const response = await fetch(`${apiUrl}/api/${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Authentication failed.');
    return data;
}

authSwitch.addEventListener('click', () => {
    registerMode = !registerMode;
    authDescription.textContent = registerMode
        ? 'Create an account to enter the quarantine zone.'
        : 'Sign in to enter the quarantine zone.';
    authSubmit.textContent = registerMode ? 'REGISTER' : 'SIGN IN';
    authSwitch.textContent = registerMode ? 'Already registered? Sign in' : 'Need an account? Register';
    authMessage.textContent = '';
});

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authMessage.textContent = '';
    authSubmit.disabled = true;
    try {
        await requestAuth(registerMode ? 'register' : 'login', {
            username: authForm.username.value,
            password: authForm.password.value
        });
        showGame();
    } catch (error) {
        authMessage.textContent = error.message;
        authSubmit.disabled = false;
    }
});

fetch(`${apiUrl}/api/me`, { credentials: 'include' })
    .then((response) => response.json())
    .then(({ user }) => {
        if (user) showGame();
    })
    .catch(() => {
        authMessage.textContent = 'Authentication server unavailable. Start the game server and try again.';
    });