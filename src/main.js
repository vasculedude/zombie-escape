import Phaser from 'phaser';
import LoginScene from './scenes/LoginScene.js';
import { socket } from './network/socket.js';
import MenuScene from './scenes/MenuScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import GameScene from './scenes/GameScene.js';
import ShopScene from './scenes/ShopScene.js';
import CharacterShopScene from './scenes/CharacterShopScene.js';
import ArmoryScene from './scenes/ArmoryScene.js';
socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});
const config = {
    type: Phaser.AUTO,

    parent: document.body,

    width: 800,
    height: 600,

    dom: {
        createContainer: true
    },

    backgroundColor: '#05b540',

    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },

    scene: [
        LoginScene,
        MenuScene,
        ShopScene,
        CharacterShopScene,
        ArmoryScene,
        CharacterScene,
        GameScene
    ]
};

new Phaser.Game(config);