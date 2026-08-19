import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Game title
        this.add.text(400, 120, 'ZOMBIE ESCAPE', {
            fontSize: '52px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        // New Game button
        const newGame = this.add.text(400, 250, 'NEW GAME', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: {
                x: 30,
                y: 15
            }
        }).setOrigin(0.5);

        newGame.setInteractive({ useHandCursor: true });

        newGame.on('pointerover', () => {
            newGame.setStyle({ color: '#ffff00' });
        });

        newGame.on('pointerout', () => {
            newGame.setStyle({ color: '#ffffff' });
        });

        newGame.on('pointerdown', () => {
            this.scene.start('CharacterScene');
        });

        // Continue button
        const continueButton = this.add.text(400, 330, 'CONTINUE', {
            fontSize: '28px',
            color: '#777777'
        }).setOrigin(0.5);

        // Settings button
        const settings = this.add.text(400, 400, 'SETTINGS', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        settings.setInteractive({ useHandCursor: true });

        settings.on('pointerover', () => {
            settings.setStyle({ color: '#ffff00' });
        });

        settings.on('pointerout', () => {
            settings.setStyle({ color: '#ffffff' });
        });

        // Credits button
        const credits = this.add.text(400, 460, 'CREDITS', {
            fontSize: '24px',
            color: '#00ff37'
        }).setOrigin(0.5);
    }
}