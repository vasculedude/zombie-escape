import Phaser from 'phaser';

import MenuScene from './scenes/MenuScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import GameScene from './scenes/GameScene.js';

console.log('MAIN.JS LOADED');
console.log('GAME SCENE:', GameScene);

const config = {
    type: Phaser.AUTO,

    width: 800,
    height: 600,

    backgroundColor: '#0bf1e6',

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

new Phaser.Game(config);