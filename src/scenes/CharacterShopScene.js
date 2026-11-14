import Phaser from 'phaser';
import {
    CHARACTER_CATALOG,
    DEFAULT_CHARACTER_ID
} from '../utils/characterCatalog.js';

export default class CharacterShopScene extends Phaser.Scene {
    constructor() {
        super('CharacterShopScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');
        this.ownedCharacters = this.registry.get('ownedCharacters') || [];
        this.pendingPurchases = new Set();
        this.characterButtons = new Map();

        this.add.text(400, 40, 'CHARACTER SHOP', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(
            780,
            20,
            `Coins: ${this.registry.get('coins') ?? 0}`,
            { fontSize: '20px', color: '#ffd45c', fontStyle: 'bold' }
        ).setOrigin(1, 0);

        this.statusText = this.add.text(400, 495, '', {
            fontSize: '16px',
            color: '#ffff66',
            align: 'center',
            wordWrap: { width: 720 }
        }).setOrigin(0.5);

        CHARACTER_CATALOG
            .filter(character => character.id !== DEFAULT_CHARACTER_ID)
            .forEach((character, index) => {
                const column = index % 2;
                const row = Math.floor(index / 2);
                const x = 20 + column * 390;
                const y = 105 + row * 165;

                this.add.rectangle(x + 180, y + 62, 370, 132, 0x202020)
                    .setStrokeStyle(1, 0x555555);
                this.add.text(x + 14, y + 12, character.name, {
                    fontSize: '21px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                });
                this.add.text(x + 14, y + 48, character.description, {
                    fontSize: '14px',
                    color: '#bbbbbb',
                    wordWrap: { width: 205 }
                });

                const button = this.add.text(x + 300, y + 78, '', {
                    fontSize: '15px',
                    color: '#ffffff',
                    backgroundColor: '#245c24',
                    padding: { x: 9, y: 9 }
                }).setOrigin(0.5);
                this.characterButtons.set(character.id, button);
                button.setInteractive({ useHandCursor: true });
                button.on('pointerdown', () => this.purchaseCharacter(character.id));
                this.updateCharacterButton(character.id);
            });

        const backButton = this.add.text(400, 555, 'BACK TO SHOP', {
            fontSize: '19px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 18, y: 8 }
        }).setOrigin(0.5);
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => this.scene.start('ShopScene'));

        this.loadInventory();
    }

    updateCharacterButton(characterId) {
        const button = this.characterButtons.get(characterId);
        if (!button) return;

        const owned = this.ownedCharacters.includes(characterId);
        const pending = this.pendingPurchases.has(characterId);
        const character = CHARACTER_CATALOG.find(item => item.id === characterId);
        button.setText(owned ? 'OWNED' : pending ? 'BUYING...' : `${character.price} COINS`);
        button.setStyle({
            backgroundColor: owned ? '#333333' : '#245c24',
            color: '#ffffff'
        });
        button.disableInteractive();
        if (!owned && !pending) {
            button.setInteractive({ useHandCursor: true });
        }
    }

    async loadInventory() {
        const token = this.registry.get('authToken');
        if (!token) {
            this.statusText.setText('Please log in to view the character shop.');
            return;
        }

        try {
            const response = await fetch(`${this.getServerUrl()}/weapons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (
                !response.ok ||
                !result.success ||
                !Array.isArray(result.ownedCharacters)
            ) {
                throw new Error(result.message || 'Could not load owned characters.');
            }

            this.ownedCharacters = result.ownedCharacters;
            this.registry.set('ownedCharacters', this.ownedCharacters);
            this.registry.set('selectedCharacter', result.selectedCharacter);
            this.registry.set('coins', result.coins);
            this.coinsText.setText(`Coins: ${result.coins}`);
            for (const character of CHARACTER_CATALOG) {
                this.updateCharacterButton(character.id);
            }
        } catch (error) {
            console.error('Could not load character shop inventory:', error);
            this.statusText.setText('Could not load your character shop. Please try again.');
        }
    }

    async purchaseCharacter(characterId) {
        if (
            this.pendingPurchases.has(characterId) ||
            this.ownedCharacters.includes(characterId)
        ) {
            return;
        }

        const token = this.registry.get('authToken');
        if (!token) {
            this.statusText.setText('Please log in to buy characters.');
            return;
        }

        this.pendingPurchases.add(characterId);
        this.updateCharacterButton(characterId);
        this.statusText.setText('Purchasing character...');

        try {
            const response = await fetch(`${this.getServerUrl()}/characters/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ characterId })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Could not purchase character.');
            }

            this.ownedCharacters = result.ownedCharacters;
            this.registry.set('ownedCharacters', this.ownedCharacters);
            this.registry.set('coins', result.coins);
            this.coinsText.setText(`Coins: ${result.coins}`);
            const character = CHARACTER_CATALOG.find(item => item.id === characterId);
            this.statusText.setText(`${character.name} unlocked! Choose it before your next run.`);
        } catch (error) {
            console.error('Character purchase failed:', error);
            this.statusText.setText(error.message);
        } finally {
            this.pendingPurchases.delete(characterId);
            this.updateCharacterButton(characterId);
        }
    }

    getServerUrl() {
        return import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';
    }
}
