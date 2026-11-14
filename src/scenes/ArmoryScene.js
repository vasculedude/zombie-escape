import Phaser from 'phaser';
import {
    getSpawnableWeaponIds,
    getWeaponById,
    STARTER_WEAPON_CATALOG
} from '../utils/weaponCatalog.js';
import {
    getMaxWeaponSelections,
    getSpawnableSurvivalItemIds,
    SURVIVAL_ITEM_CATALOG
} from '../utils/survivalItemCatalog.js';

const STARTER_WEAPON_IDS = STARTER_WEAPON_CATALOG.map(weapon => weapon.id);

export default class ArmoryScene extends Phaser.Scene {
    constructor() {
        super('ArmoryScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');
        this.ownedWeapons = this.registry.get('ownedWeapons') || [];
        this.ownedSpecials = this.registry.get('ownedSpecials') || [];
        this.selectedWeapons = this.getInitialSelection();
        this.selectedSpecials = getSpawnableSurvivalItemIds(
            this.ownedSpecials,
            this.registry.get('spawnSpecials')
        );
        this.weaponButtons = new Map();
        this.specialButtons = new Map();
        this.weaponItems = [];
        this.specialItems = [];
        this.saving = false;
        this.currentCategory = 'weapons';

        this.add.text(400, 40, 'ARMORY', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.weaponsTab = this.createButton(340, 82, 'WEAPONS', () => {
            this.showCategory('weapons');
        }).setStyle({ backgroundColor: '#245c24' });
        this.specialsTab = this.createButton(460, 82, 'SPECIAL', () => {
            this.showCategory('special');
        });
        this.selectionText = this.add.text(400, 108, '', {
            fontSize: '14px',
            color: '#ffda70'
        }).setOrigin(0.5);

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

            const title = this.add.text(x + 10, y + 12, weapon.name, {
                fontSize: '15px',
                color: '#ffffff',
                fontStyle: 'bold',
                wordWrap: { width: 160 }
            });

            const details = weapon.category === 'Melee'
                ? `Melee | Damage ${weapon.damage}`
                : `${weapon.category} | Damage ${weapon.damage}`;
            const detailText = this.add.text(x + 10, y + 42, details, {
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
            this.weaponItems.push(card, title, detailText, button);
        });

        SURVIVAL_ITEM_CATALOG.forEach((item, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = 25 + column * 390;
            const y = 128 + row * 104;
            const card = this.add.rectangle(x + 180, y + 42, 370, 88, 0x202020)
                .setStrokeStyle(2, 0x555555)
                .setVisible(false);
            const title = this.add.text(x + 12, y + 8, `${item.name} - ${item.rarity}`, {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setVisible(false);
            const description = this.add.text(x + 12, y + 36, item.description, {
                fontSize: '12px',
                color: '#bbbbbb',
                wordWrap: { width: 235 }
            }).setVisible(false);
            const button = this.add.text(x + 250, y + 59, '', {
                fontSize: '11px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 7, y: 5 }
            }).setOrigin(0.5).setVisible(false);
            const selectable = item.effect !== 'backpack';
            if (selectable) {
                button.setInteractive({ useHandCursor: true });
                button.on('pointerdown', () => this.toggleSpecial(item.id));
            }
            this.specialButtons.set(item.id, { button, card, selectable });
            this.specialItems.push(card, title, description, button);
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
        this.refreshSpecialButtons();
        this.showCategory('weapons');
        this.loadArmory();
    }

    getInitialSelection() {
        const savedSelection = this.registry.get('spawnWeapons');
        const maxSelections = getMaxWeaponSelections(
            this.registry.get('ownedSpecials')
        );
        if (
            Array.isArray(savedSelection) &&
            savedSelection.length === maxSelections
        ) {
            return [...savedSelection];
        }

        return STARTER_WEAPON_IDS.slice(0, maxSelections);
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
        const maxSelections = getMaxWeaponSelections(this.ownedSpecials);

        if (this.selectedWeapons.includes(weaponId)) {
            this.selectedWeapons = this.selectedWeapons.filter(
                id => id !== weaponId
            );
        } else if (this.selectedWeapons.length < maxSelections) {
            this.selectedWeapons.push(weaponId);
        } else {
            this.statusText.setText(
                `Choose only ${maxSelections} weapons. Unselect one first.`
            );
            return;
        }

        this.statusText.setText('');
        this.refreshWeaponButtons();
    }

    refreshWeaponButtons() {
        const maxSelections = getMaxWeaponSelections(this.ownedSpecials);
        if (this.currentCategory === 'weapons') {
            this.selectionText.setText(
                `Weapons selected: ${this.selectedWeapons.length}/${maxSelections}`
            );
        }

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

    toggleSpecial(itemId) {
        if (this.saving) return;
        if (this.selectedSpecials.includes(itemId)) {
            this.selectedSpecials = this.selectedSpecials.filter(id => id !== itemId);
        } else {
            this.selectedSpecials.push(itemId);
        }
        this.statusText.setText('');
        this.refreshSpecialButtons();
    }

    refreshSpecialButtons() {
        if (this.currentCategory === 'special') {
            this.selectionText.setText(
                `Selected survival items: ${this.selectedSpecials.length}`
            );
        }

        for (const [itemId, { button, card, selectable }] of this.specialButtons) {
            const owned = this.ownedSpecials.includes(itemId);
            const selected = this.selectedSpecials.includes(itemId);
            button.setText(!owned
                ? 'LOCKED - SHOP'
                : selectable
                    ? selected ? 'SELECTED - REMOVE' : 'SELECT TO SPAWN'
                    : 'OWNED - +1 WEAPON SLOT'
            );
            button.setStyle({
                backgroundColor: !owned ? '#333333' : selected ? '#245c24' : '#333333',
                color: '#ffffff'
            });
            button.disableInteractive();
            if (owned && selectable && !this.saving) {
                button.setInteractive({ useHandCursor: true });
            }
            card.setStrokeStyle(2, selected ? 0x55ff55 : 0x555555);
        }
    }

    showCategory(category) {
        const showWeapons = category === 'weapons';
        this.currentCategory = category;
        for (const item of this.weaponItems) {
            item.setVisible(showWeapons);
        }
        for (const item of this.specialItems) {
            item.setVisible(!showWeapons);
        }
        this.weaponsTab.setStyle({
            backgroundColor: showWeapons ? '#245c24' : '#333333',
            color: '#ffffff'
        });
        this.specialsTab.setStyle({
            backgroundColor: showWeapons ? '#333333' : '#245c24',
            color: '#ffffff'
        });
        this.selectionText.setText(showWeapons
            ? `Weapons selected: ${this.selectedWeapons.length}/${getMaxWeaponSelections(this.ownedSpecials)}`
            : `Selected survival items: ${this.selectedSpecials.length}`
        );
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
            this.ownedSpecials = Array.isArray(result.ownedSpecials)
                ? result.ownedSpecials
                : [];
            this.registry.set('ownedSpecials', this.ownedSpecials);

            const availableIds = getSpawnableWeaponIds(this.ownedWeapons);
            const maxSelections = getMaxWeaponSelections(this.ownedSpecials);
            const serverSelection = Array.isArray(result.spawnWeapons)
                ? result.spawnWeapons
                : STARTER_WEAPON_IDS;
            const validSelection = getSpawnableWeaponIds(
                this.ownedWeapons,
                serverSelection
            );

            this.selectedWeapons = validSelection.length === maxSelections
                ? validSelection
                : availableIds.slice(0, maxSelections);
            this.registry.set('spawnWeapons', this.selectedWeapons);
            this.selectedSpecials = getSpawnableSurvivalItemIds(
                this.ownedSpecials,
                result.spawnSpecials
            );
            this.registry.set('spawnSpecials', this.selectedSpecials);
            this.refreshWeaponButtons();
            this.refreshSpecialButtons();

            if (availableIds.length < maxSelections) {
                this.statusText.setText(
                    `You need ${maxSelections} available weapons to save your armory.`
                );
            }
        } catch (error) {
            console.error('Could not load armory:', error);
            this.statusText.setText(error.message || 'Could not load your armory.');
        }
    }

    async saveArmory() {
        const maxSelections = getMaxWeaponSelections(this.ownedSpecials);
        if (this.selectedWeapons.length !== maxSelections) {
            this.statusText.setText(`Select exactly ${maxSelections} weapons before saving.`);
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
                body: JSON.stringify({
                    weaponIds: this.selectedWeapons,
                    specialIds: this.selectedSpecials
                })
            });
            const result = await response.json();

            if (
                !response.ok ||
                !result.success ||
                !Array.isArray(result.spawnWeapons) ||
                !Array.isArray(result.spawnSpecials)
            ) {
                throw new Error(result.message || 'Could not save your armory.');
            }

            this.selectedWeapons = result.spawnWeapons;
            this.selectedSpecials = result.spawnSpecials;
            this.registry.set('spawnWeapons', this.selectedWeapons);
            this.registry.set('spawnSpecials', this.selectedSpecials);
            this.refreshWeaponButtons();
            this.refreshSpecialButtons();
            this.statusText.setText(
                `Armory saved. Your ${maxSelections} weapons and selected survival items can spawn next run.`
            );
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
