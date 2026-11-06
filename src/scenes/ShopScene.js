import Phaser from 'phaser';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');

        this.add.text(400, 120, 'SHOP', {
            fontSize: '42px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const backButton = this.add.text(400, 520, 'BACK', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerover', () => {
            backButton.setStyle({ color: '#ffff00' });
        });
        backButton.on('pointerout', () => {
            backButton.setStyle({ color: '#ffffff' });
        });
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}
