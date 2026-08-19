import Phaser from 'phaser';

export default class CharacterScene extends Phaser.Scene {
    constructor() {
        super('CharacterScene');
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor('#1b1b1b');

        // Title
        this.add.text(400, 80, 'CREATE SURVIVOR', {
            fontSize: '42px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Message
        this.add.text(400, 170,
            'Character creation is coming soon!',
        {
            fontSize: '26px',
            color: '#ffff66'
        }).setOrigin(0.5);

        // Start button
        const startButton = this.add.text(400, 320, 'START ADVENTURE', {
            fontSize: '30px',
            color: '#ffffff',
            backgroundColor: '#006600',
            padding: {
                x: 20,
                y: 10
            }
        }).setOrigin(0.5);

        startButton.setInteractive({ useHandCursor: true });

        startButton.on('pointerover', () => {
            startButton.setStyle({ color: '#ffff00' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ color: '#ffffff' });
        });

        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}