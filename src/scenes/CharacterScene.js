import Phaser from 'phaser';
import {
    CHARACTER_CATALOG,
    DEFAULT_CHARACTER_ID
} from '../utils/characterCatalog.js';

export default class CharacterScene extends Phaser.Scene {
    constructor() {
        super('CharacterScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#1b1b1b');
        this.ownedCharacters = this.registry.get('ownedCharacters') || [];
        this.selectedCharacter = this.registry.get('selectedCharacter') ||
            DEFAULT_CHARACTER_ID;
        if (!this.isOwned(this.selectedCharacter)) {
            this.selectedCharacter = DEFAULT_CHARACTER_ID;
        }

        this.add.text(400, 40, 'CHOOSE YOUR CHARACTER', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(400, 78, 'Choose an unlocked character for this run.', {
            fontSize: '17px',
            color: '#bbbbbb'
        }).setOrigin(0.5);

        this.characterCards = new Map();
        CHARACTER_CATALOG.forEach((character, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = 205 + column * 390;
            const y = 155 + row * 108;
            const background = this.add.rectangle(
                x,
                y,
                360,
                92,
                0x252525
            ).setStrokeStyle(2, 0x666666);
            const title = this.add.text(x - 160, y - 28, character.name, {
                fontSize: '19px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            this.add.circle(x + 160, y - 27, 7, character.color);
            const detailCopy =
                `HP ${character.maxHealth}  |  Speed ${character.speedMultiplier}x  |  Damage ${character.damageMultiplier}x\n${character.description}`;
            const details = this.add.text(
                x - 160,
                y + 2,
                detailCopy,
                {
                    fontSize: '12px',
                    color: '#bbbbbb',
                    lineSpacing: 2,
                    wordWrap: { width: 315 }
                }
            );
            const card = { background, title, details, character };
            this.characterCards.set(character.id, card);

            if (this.isOwned(character.id)) {
                background.setInteractive({ useHandCursor: true });
                background.on('pointerdown', () => this.selectCharacter(character.id));
                title.setInteractive({ useHandCursor: true });
                title.on('pointerdown', () => this.selectCharacter(character.id));
                details.setInteractive({ useHandCursor: true });
                details.on('pointerdown', () => this.selectCharacter(character.id));
            } else {
                details.setText(`${detailCopy}\nLOCKED - UNLOCK IN THE SHOP`);
                details.setColor('#888888');
            }
        });

        this.statusText = this.add.text(400, 475, '', {
            fontSize: '15px',
            color: '#ffff66',
            align: 'center',
            wordWrap: { width: 720 }
        }).setOrigin(0.5);

        this.startButton = this.add.text(400, 525, 'START ADVENTURE', {
            fontSize: '25px',
            color: '#ffffff',
            backgroundColor: '#006600',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.startButton.on('pointerdown', () => this.startAdventure());

        const backButton = this.add.text(400, 580, 'BACK', {
            fontSize: '17px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 14, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => this.scene.start('MenuScene'));

        this.updateCharacterCards();
    }

    isOwned(characterId) {
        return characterId === DEFAULT_CHARACTER_ID ||
            this.ownedCharacters.includes(characterId);
    }

    selectCharacter(characterId) {
        if (!this.isOwned(characterId)) return;
        this.selectedCharacter = characterId;
        this.statusText.setText('');
        this.updateCharacterCards();
    }

    updateCharacterCards() {
        for (const [characterId, card] of this.characterCards) {
            const selected = characterId === this.selectedCharacter;
            card.background.setFillStyle(selected ? 0x245c24 : 0x252525);
            card.background.setStrokeStyle(2, selected ? 0x55ff55 : 0x666666);
            if (!this.isOwned(characterId)) {
                card.title.setColor('#888888');
            } else {
                card.title.setColor('#ffffff');
            }
        }
    }

    async startAdventure() {
        const token = this.registry.get('authToken');
        if (!token) {
            this.statusText.setText('Please log in before starting a run.');
            return;
        }

        this.startButton.disableInteractive();
        this.startButton.setText('SAVING...');
        this.statusText.setText('Saving your character choice...');

        try {
            const response = await fetch(`${this.getServerUrl()}/characters/select`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ characterId: this.selectedCharacter })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Could not save your character choice.');
            }

            this.registry.set('selectedCharacter', result.selectedCharacter);
            this.scene.start('GameScene');
        } catch (error) {
            console.error('Could not save character choice:', error);
            this.statusText.setText(error.message);
            this.startButton.setText('START ADVENTURE');
            this.startButton.setInteractive({ useHandCursor: true });
        }
    }

    getServerUrl() {
        return import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';
    }
}
