import Phaser from 'phaser';
import { getWeaponPrice, WEAPON_CATALOG } from '../utils/weaponCatalog.js';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');
        this.ownedWeapons = this.registry.get('ownedWeapons') || [];
        this.pendingPurchases = new Set();

        this.add.text(400, 48, 'WEAPON SHOP', {
            fontSize: '38px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(
            780,
            20,
            `Coins: ${this.registry.get('coins') ?? 0}`,
            { fontSize: '20px', color: '#ffd45c', fontStyle: 'bold' }
        ).setOrigin(1, 0);

        this.statusText = this.add.text(400, 510, '', {
            fontSize: '16px',
            color: '#ffff66',
            align: 'center',
            wordWrap: { width: 720 }
        }).setOrigin(0.5);

        this.weaponButtons = new Map();
        WEAPON_CATALOG.forEach((weapon, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = 20 + column * 390;
            const y = 105 + row * 95;

            this.add.rectangle(x + 180, y + 38, 370, 84, 0x202020)
                .setStrokeStyle(1, 0x555555)
                .setOrigin(0.5);

            this.add.text(x + 10, y + 8, `${weapon.name}  -  ${weapon.rarity}`, {
                fontSize: '17px',
                color: '#ffffff',
                fontStyle: 'bold'
            });

            const details = weapon.category === 'Melee'
                ? `${weapon.category} | Damage ${weapon.damage} | ${weapon.attackSpeed}`
                : `${weapon.category} | Damage ${weapon.damage}${weapon.pellets ? ' x ' + weapon.pellets + ' pellets' : ''} | Magazine ${weapon.magazineSize}`;
            this.add.text(x + 10, y + 38, details, {
                fontSize: '13px',
                color: '#bbbbbb'
            });

            const button = this.add.text(x + 285, y + 48, '', {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#245c24',
                padding: { x: 8, y: 8 }
            }).setOrigin(0.5);

            this.weaponButtons.set(weapon.id, button);
            button.setInteractive({ useHandCursor: true });
            this.updateWeaponButton(weapon.id);
            button.on('pointerover', () => {
                if (!this.ownedWeapons.includes(weapon.id)) {
                    button.setStyle({ color: '#ffff00' });
                }
            });
            button.on('pointerout', () => button.setStyle({ color: '#ffffff' }));
            button.on('pointerdown', () => this.purchaseWeapon(weapon.id));
        });

        const backButton = this.add.text(400, 565, 'BACK', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 18, y: 8 }
        }).setOrigin(0.5);

        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerover', () => backButton.setStyle({ color: '#ffff00' }));
        backButton.on('pointerout', () => backButton.setStyle({ color: '#ffffff' }));
        backButton.on('pointerdown', () => this.scene.start('MenuScene'));

        this.loadInventory();
    }

    updateWeaponButton(weaponId) {
        const button = this.weaponButtons.get(weaponId);
        if (!button) return;

        const owned = this.ownedWeapons.includes(weaponId);
        button.setText(
            owned ? 'OWNED' : this.pendingPurchases.has(weaponId)
                ? 'BUYING...'
                : `${getWeaponPrice(weaponId)} COINS`
        );
        button.setStyle({
            backgroundColor: owned ? '#333333' : '#245c24',
            color: '#ffffff'
        });
        button.disableInteractive();
        if (!owned && !this.pendingPurchases.has(weaponId)) {
            button.setInteractive({ useHandCursor: true });
        }
    }

    async loadInventory() {
        const token = this.registry.get('authToken');
        if (!token) {
            this.statusText.setText('Please log in to view your weapon shop.');
            return;
        }

        try {
            const response = await fetch(`${this.getServerUrl()}/weapons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok || !result.success || !Array.isArray(result.ownedWeapons)) {
                throw new Error(result.message || 'Could not load owned weapons.');
            }

            this.ownedWeapons = result.ownedWeapons;
            this.registry.set('ownedWeapons', this.ownedWeapons);
            if (Array.isArray(result.spawnWeapons)) {
                this.registry.set('spawnWeapons', result.spawnWeapons);
            }
            this.registry.set('coins', result.coins);
            this.coinsText.setText(`Coins: ${result.coins}`);
            for (const weapon of WEAPON_CATALOG) {
                this.updateWeaponButton(weapon.id);
            }
        } catch (error) {
            console.error('Could not load weapon shop inventory:', error);
            this.statusText.setText('Could not load your shop inventory. Please try again.');
        }
    }

    async purchaseWeapon(weaponId) {
        if (this.pendingPurchases.has(weaponId) ||
            this.ownedWeapons.includes(weaponId)) {
            return;
        }

        const token = this.registry.get('authToken');
        if (!token) {
            this.statusText.setText('Please log in to buy weapons.');
            return;
        }

        this.pendingPurchases.add(weaponId);
        this.updateWeaponButton(weaponId);
        this.statusText.setText('Purchasing weapon...');

        try {
            const response = await fetch(`${this.getServerUrl()}/weapons/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ weaponId })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Could not purchase weapon.');
            }

            this.ownedWeapons = result.ownedWeapons;
            this.registry.set('ownedWeapons', this.ownedWeapons);
            this.registry.set('coins', result.coins);
            this.coinsText.setText(`Coins: ${result.coins}`);
            this.statusText.setText('Weapon purchased. It can now spawn in your next game.');
        } catch (error) {
            console.error('Weapon purchase failed:', error);
            this.statusText.setText(error.message);
        } finally {
            this.pendingPurchases.delete(weaponId);
            this.updateWeaponButton(weaponId);
        }
    }

    getServerUrl() {
        return import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';
    }
}
