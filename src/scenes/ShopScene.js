import Phaser from 'phaser';
import { getWeaponPrice, WEAPON_CATALOG } from '../utils/weaponCatalog.js';
import {
    getSurvivalItemPrice,
    SURVIVAL_ITEM_CATALOG
} from '../utils/survivalItemCatalog.js';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');
        this.ownedWeapons = this.registry.get('ownedWeapons') || [];
        this.ownedSpecials = this.registry.get('ownedSpecials') || [];
        this.pendingPurchases = new Set();
        this.pendingSpecialPurchases = new Set();

        this.add.text(400, 38, 'SHOP', {
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

        this.weaponCategoryButton = this.add.text(340, 82, 'WEAPONS', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#245c24',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.specialCategoryButton = this.add.text(460, 82, 'SPECIAL', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.weaponCategoryButton.on('pointerdown', () => this.showCategory('weapons'));
        this.specialCategoryButton.on('pointerdown', () => this.showCategory('special'));

        this.statusText = this.add.text(400, 510, '', {
            fontSize: '16px',
            color: '#ffff66',
            align: 'center',
            wordWrap: { width: 720 }
        }).setOrigin(0.5);

        this.weaponButtons = new Map();
        this.weaponItems = [];
        this.specialButtons = new Map();
        this.specialItems = [];
        WEAPON_CATALOG.forEach((weapon, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = 20 + column * 390;
            const y = 122 + row * 88;

            const card = this.add.rectangle(x + 180, y + 38, 370, 80, 0x202020)
                .setStrokeStyle(1, 0x555555)
                .setOrigin(0.5);

            const title = this.add.text(x + 10, y + 8, `${weapon.name}  -  ${weapon.rarity}`, {
                fontSize: '17px',
                color: '#ffffff',
                fontStyle: 'bold'
            });

            const details = weapon.category === 'Melee'
                ? `${weapon.category} | Damage ${weapon.damage} | ${weapon.attackSpeed}`
                : `${weapon.category} | Damage ${weapon.damage}${weapon.pellets ? ' x ' + weapon.pellets + ' pellets' : ''} | Magazine ${weapon.magazineSize}`;
            const detailText = this.add.text(x + 10, y + 38, details, {
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
            this.weaponItems.push(card, title, detailText, button);
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

        SURVIVAL_ITEM_CATALOG.forEach((item, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = 20 + column * 390;
            const y = 122 + row * 116;
            const card = this.add.rectangle(x + 180, y + 44, 370, 92, 0x202020)
                .setStrokeStyle(1, 0x555555)
                .setOrigin(0.5);
            const title = this.add.text(x + 10, y + 8, `${item.name} - ${item.rarity}`, {
                fontSize: '17px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            const description = this.add.text(x + 10, y + 39, item.description, {
                fontSize: '13px',
                color: '#bbbbbb',
                wordWrap: { width: 235 }
            });
            const button = this.add.text(x + 285, y + 59, '', {
                fontSize: '13px',
                color: '#ffffff',
                backgroundColor: '#245c24',
                padding: { x: 8, y: 7 }
            }).setOrigin(0.5);

            this.specialButtons.set(item.id, button);
            this.specialItems.push(card, title, description, button);
            button.setInteractive({ useHandCursor: true });
            this.updateSpecialButton(item.id);
            button.on('pointerover', () => {
                if (!this.ownedSpecials.includes(item.id)) {
                    button.setStyle({ color: '#ffff00' });
                }
            });
            button.on('pointerout', () => button.setStyle({ color: '#ffffff' }));
            button.on('pointerdown', () => this.purchaseSpecial(item.id));
        });

        const characterShop = this.add.text(400, 565, 'CHARACTERS', {
            fontSize: '19px',
            color: '#ffffff',
            backgroundColor: '#245c24',
            padding: { x: 22, y: 9 }
        }).setOrigin(0.5);
        characterShop.setInteractive({ useHandCursor: true });
        characterShop.on('pointerover', () => characterShop.setStyle({ color: '#ffff00' }));
        characterShop.on('pointerout', () => characterShop.setStyle({ color: '#ffffff' }));
        characterShop.on('pointerdown', () => this.scene.start('CharacterShopScene'));

        const backButton = this.add.text(735, 565, 'BACK', {
            fontSize: '17px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 14, y: 8 }
        }).setOrigin(0.5);
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerover', () => backButton.setStyle({ color: '#ffff00' }));
        backButton.on('pointerout', () => backButton.setStyle({ color: '#ffffff' }));
        backButton.on('pointerdown', () => this.scene.start('MenuScene'));

        this.showCategory('weapons');
        this.loadInventory();
    }

    showCategory(category) {
        const showWeapons = category === 'weapons';
        for (const item of this.weaponItems) {
            item.setVisible(showWeapons);
        }
        for (const item of this.specialItems) {
            item.setVisible(!showWeapons);
        }
        this.weaponCategoryButton.setStyle({
            backgroundColor: showWeapons ? '#245c24' : '#333333'
        });
        this.specialCategoryButton.setStyle({
            backgroundColor: showWeapons ? '#333333' : '#245c24'
        });
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

    updateSpecialButton(itemId) {
        const button = this.specialButtons.get(itemId);
        if (!button) return;

        const owned = this.ownedSpecials.includes(itemId);
        button.setText(
            owned ? 'OWNED' : this.pendingSpecialPurchases.has(itemId)
                ? 'BUYING...'
                : `${getSurvivalItemPrice(itemId)} COINS`
        );
        button.setStyle({
            backgroundColor: owned ? '#333333' : '#245c24',
            color: '#ffffff'
        });
        button.disableInteractive();
        if (!owned && !this.pendingSpecialPurchases.has(itemId)) {
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
            this.ownedSpecials = Array.isArray(result.ownedSpecials)
                ? result.ownedSpecials
                : [];
            this.registry.set('ownedSpecials', this.ownedSpecials);
            if (Array.isArray(result.spawnWeapons)) {
                this.registry.set('spawnWeapons', result.spawnWeapons);
            }
            if (Array.isArray(result.spawnSpecials)) {
                this.registry.set('spawnSpecials', result.spawnSpecials);
            }
            if (Array.isArray(result.ownedCharacters)) {
                this.registry.set('ownedCharacters', result.ownedCharacters);
            }
            if (typeof result.selectedCharacter === 'string') {
                this.registry.set('selectedCharacter', result.selectedCharacter);
            }
            this.registry.set('coins', result.coins);
            this.coinsText.setText(`Coins: ${result.coins}`);
            for (const weapon of WEAPON_CATALOG) {
                this.updateWeaponButton(weapon.id);
            }
            for (const item of SURVIVAL_ITEM_CATALOG) {
                this.updateSpecialButton(item.id);
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

    async purchaseSpecial(itemId) {
        if (
            this.pendingSpecialPurchases.has(itemId) ||
            this.ownedSpecials.includes(itemId)
        ) {
            return;
        }

        const token = this.registry.get('authToken');
        if (!token) {
            this.statusText.setText('Please log in to buy survival items.');
            return;
        }

        this.pendingSpecialPurchases.add(itemId);
        this.updateSpecialButton(itemId);
        this.statusText.setText('Purchasing survival item...');

        try {
            const response = await fetch(`${this.getServerUrl()}/specials/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `******`
                },
                body: JSON.stringify({ itemId })
            });
            const result = await response.json();
            if (
                !response.ok ||
                !result.success ||
                !Array.isArray(result.ownedSpecials) ||
                !Number.isInteger(result.coins)
            ) {
                throw new Error(result.message || 'Could not purchase survival item.');
            }

            this.ownedSpecials = result.ownedSpecials;
            this.registry.set('ownedSpecials', this.ownedSpecials);
            this.registry.set('coins', result.coins);
            this.coinsText.setText(`Coins: ${result.coins}`);
            const item = SURVIVAL_ITEM_CATALOG.find(candidate => candidate.id === itemId);
            this.statusText.setText(
                itemId === 'backpack'
                    ? 'Backpack purchased. Select one additional weapon in the Armory.'
                    : `${item.name} unlocked. Select it in the Armory to spawn it next run.`
            );
        } catch (error) {
            console.error('Survival item purchase failed:', error);
            this.statusText.setText(error.message);
        } finally {
            this.pendingSpecialPurchases.delete(itemId);
            this.updateSpecialButton(itemId);
        }
    }

    getServerUrl() {
        return import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';
    }
}
