import Phaser from 'phaser';
import {
    getSpawnableWeaponIds,
    getWeaponById,
    STARTER_WEAPON_CATALOG
} from '../utils/weaponCatalog.js';

const STARTER_WEAPON_IDS = STARTER_WEAPON_CATALOG.map(weapon => weapon.id);
const MAX_SELECTED_WEAPONS = 4;

export default class ArmoryScene extends Phaser.Scene {
    constructor() {
        super('ArmoryScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');
        this.ownedWeapons = this.registry.get('ownedWeapons') || [];
        this.selectedWeapons = this.getInitialSelection();
        this.weaponButtons = new Map();
        this.saving = false;

        this.add.text(400, 40, 'ARMORY', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.selectionText = this.add.text(
            400,
            82,
            '',
            { fontSize: '16px', color: '#ffda70' }
        ).setOrigin(0.5);

        const weapons = getSpawnableWeaponIds(this.ownedWeapons)
            .map(getWeaponById)
            .filter(Boolean);

        weapons.forEach((weapon, index) => {
            const column = index % 4;
            const row = Math.floor(index / 4);
            const x = 12 + column * 195;
            const y = 112 + row * 112;
            const card = this.add.rectangle(
                x + 88,
                y + 48,
                180,
                98,
                0x202020
            ).setStrokeStyle(2, 0x555555);

            this.add.text(x + 10, y + 12, weapon.name, {
                fontSize: '15px',
                color: '#ffffff',
                fontStyle: 'bold',
                wordWrap: { width: 160 }
            });

            const details = weapon.category === 'Melee'
                ? `Melee | Damage ${weapon.damage}`
                : `${weapon.category} | Damage ${weapon.damage}`;
            this.add.text(x + 10, y + 42, details, {
                fontSize: '12px',
                color: '#bbbbbb'
            });

            const button = this.add.text(x + 10, y + 68, '', {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 8, y: 5 }
            });
            button.setInteractive({ useHandCursor: true });
            button.on('pointerdown', () => this.toggleWeapon(weapon.id));
            this.weaponButtons.set(weapon.id, { button, card });
        });

        this.statusText = this.add.text(400, 466, '', {
            fontSize: '14px',
            color: '#bbbbbb',
            align: 'center',
            wordWrap: { width: 740 }
        }).setOrigin(0.5);

        this.createButton(300, 535, 'BACK', () => {
            this.scene.start('MenuScene');
        });
        this.saveButton = this.createButton(500, 535, 'SAVE ARMORY', () => {
            this.saveArmory();
        });

        this.refreshWeaponButtons();
        this.loadArmory();
    }

    getInitialSelection() {
        const savedSelection = this.registry.get('spawnWeapons');
        if (
            Array.isArray(savedSelection) &&
            savedSelection.length === MAX_SELECTED_WEAPONS
        ) {
            return [...savedSelection];
        }

        return [...STARTER_WEAPON_IDS];
    }

    createButton(x, y, label, callback) {
        const button = this.add.text(x, y, label, {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 16, y: 9 }
        }).setOrigin(0.5);

        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => button.setStyle({ color: '#ffff00' }));
        button.on('pointerout', () => button.setStyle({ color: '#ffffff' }));
        button.on('pointerdown', callback);
        return button;
    }

    toggleWeapon(weaponId) {
        if (this.saving) return;

        if (this.selectedWeapons.includes(weaponId)) {
            this.selectedWeapons = this.selectedWeapons.filter(
                id => id !== weaponId
            );
        } else if (this.selectedWeapons.length < MAX_SELECTED_WEAPONS) {
            this.selectedWeapons.push(weaponId);
        } else {
            this.statusText.setText('Choose only four weapons. Unselect one first.');
            return;
        }

        this.statusText.setText('');
        this.refreshWeaponButtons();
    }

    refreshWeaponButtons() {
        this.selectionText.setText(
            `Selected to spawn: ${this.selectedWeapons.length}/${MAX_SELECTED_WEAPONS}`
        );

        for (const [weaponId, { button, card }] of this.weaponButtons) {
            const selected = this.selectedWeapons.includes(weaponId);
            button.setText(selected ? 'SELECTED - CLICK TO REMOVE' : 'CLICK TO SELECT');
            button.setStyle({
                backgroundColor: selected ? '#245c24' : '#333333',
                color: '#ffffff'
            });
            card.setStrokeStyle(2, selected ? 0x55ff55 : 0x555555);
        }
    }

    async loadArmory() {
        const token = this.registry.get('authToken');
        if (!token) {
            this.statusText.setText('Log in to load and save your armory.');
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
                !Array.isArray(result.ownedWeapons)
            ) {
                throw new Error(result.message || 'Could not load your armory.');
            }

            this.ownedWeapons = result.ownedWeapons;
            this.registry.set('ownedWeapons', this.ownedWeapons);

            const availableIds = getSpawnableWeaponIds(this.ownedWeapons);
            const serverSelection = Array.isArray(result.spawnWeapons)
                ? result.spawnWeapons
                : STARTER_WEAPON_IDS;
            const validSelection = getSpawnableWeaponIds(
                this.ownedWeapons,
                serverSelection
            );

            this.selectedWeapons = validSelection.length === MAX_SELECTED_WEAPONS
                ? validSelection
                : availableIds.slice(0, MAX_SELECTED_WEAPONS);
            this.registry.set('spawnWeapons', this.selectedWeapons);
            this.refreshWeaponButtons();

            if (availableIds.length < MAX_SELECTED_WEAPONS) {
                this.statusText.setText('You need four available weapons to save your armory.');
            }
        } catch (error) {
            console.error('Could not load armory:', error);
            this.statusText.setText(error.message || 'Could not load your armory.');
        }
    }

    async saveArmory() {
        if (this.selectedWeapons.length !== MAX_SELECTED_WEAPONS) {
            this.statusText.setText('Select exactly four weapons before saving.');
            return;
        }

        const token = this.registry.get('authToken');
        if (!token) {
            this.statusText.setText('Log in to save your armory.');
            return;
        }

        this.saving = true;
        this.saveButton.disableInteractive();
        this.statusText.setText('Saving armory...');

        try {
            const response = await fetch(`${this.getServerUrl()}/armory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ weaponIds: this.selectedWeapons })
            });
            const result = await response.json();

            if (!response.ok || !result.success || !Array.isArray(result.spawnWeapons)) {
                throw new Error(result.message || 'Could not save your armory.');
            }

            this.selectedWeapons = result.spawnWeapons;
            this.registry.set('spawnWeapons', this.selectedWeapons);
            this.refreshWeaponButtons();
            this.statusText.setText('Armory saved. These four weapons can spawn in your next game.');
        } catch (error) {
            console.error('Could not save armory:', error);
            this.statusText.setText(error.message || 'Could not save your armory.');
        } finally {
            this.saving = false;
            this.saveButton.setInteractive({ useHandCursor: true });
        }
    }

    getServerUrl() {
        return import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';
    }
}
