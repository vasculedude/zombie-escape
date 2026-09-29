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

function showGame() {
    if (authPanel) authPanel.remove();
    new Phaser.Game(config);
}

showGame();