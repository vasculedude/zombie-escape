import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');

        // Game title
        this.add.text(400, 120, 'ZOMBIE ESCAPE', {
            fontSize: '52px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(
            780,
            20,
            `Coins: ${this.registry.get('coins') ?? 0}`,
            {
                fontSize: '22px',
                color: '#ffd45c',
                fontStyle: 'bold'
            }
        ).setOrigin(1, 0);
        this.loadCoins();

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

        const shop = this.add.text(400, 375, 'SHOP', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        shop.setInteractive({ useHandCursor: true });

        shop.on('pointerover', () => {
            shop.setStyle({ color: '#ffff00' });
        });

        shop.on('pointerout', () => {
            shop.setStyle({ color: '#ffffff' });
        });

        shop.on('pointerdown', () => {
            this.scene.start('ShopScene');
        });

        // Settings button
        const settings = this.add.text(400, 425, 'SETTINGS', {
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
        const credits = this.add.text(400, 475, 'CREDITS', {
            fontSize: '24px',
            color: '#00ff37'
        }).setOrigin(0.5);
    }
    async loadCoins() {
        const token = this.registry.get('authToken');
        if (!token) return;

        const serverUrl = import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';

        try {
            const response = await fetch(`${serverUrl}/coins`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (!response.ok || !result.success || !Number.isInteger(result.coins)) {
                throw new Error(result.message || 'Could not load coins.');
            }

            this.registry.set('coins', result.coins);
            this.coinsText.setText(`Coins: ${result.coins}`);
        } catch (error) {
            console.error('Could not load coins on the main screen:', error);
        }
    }
}