import Phaser from 'phaser';
import { getWeaponById } from '../utils/weaponCatalog.js';

export default class Weapon extends Phaser.GameObjects.Image {

    static createTexture(scene, type) {
        const textureKey = `weapon-${type}`;

        if (!scene.textures.exists(textureKey)) {
            const weapon = getWeaponById(type);
            if (!weapon) {
                throw new RangeError(`Unknown weapon type: ${type}`);
            }

            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            const accent = weapon.category === 'Melee'
                ? 0xc4c4c4
                : type === 'blaster'
                    ? 0xffd43b
                    : type === 'rapid'
                        ? 0x25d9e8
                        : type === 'sword'
                            ? 0xc4c4c4
                            : 0xff8738;

            if (weapon.category === 'Melee') {
                graphics.fillStyle(0x704b2b, 1);
                graphics.fillRoundedRect(21, 14, 6, 16, 2);
                graphics.fillStyle(accent, 1);
                if (type === 'baseball_bat') {
                    graphics.fillRoundedRect(17, 2, 14, 23, 6);
                    graphics.fillRect(19, 20, 10, 5);
                } else if (type === 'crowbar') {
                    graphics.fillRect(19, 4, 10, 4);
                    graphics.fillRect(19, 5, 4, 17);
                    graphics.fillRect(17, 20, 8, 4);
                } else if (type === 'hammer') {
                    graphics.fillRect(21, 4, 6, 21);
                    graphics.fillRoundedRect(11, 3, 26, 8, 2);
                } else if (type === 'sword') {
                    graphics.fillStyle(0xc4c4c4, 1);
                    graphics.fillRoundedRect(17, 2, 8, 22, 2);
                    graphics.fillRect(14, 22, 14, 6);
                    graphics.fillTriangle(12, 1, 24, 1, 18, 12);
                } else {
                    graphics.fillTriangle(24, 1, 14, 20, 34, 20);
                    graphics.fillRect(21, 18, 6, 11);
                }
            } else {
                graphics.fillStyle(0x20242a, 1);
                if (type === 'shotgun') {
                    graphics.fillRoundedRect(6, 8, 28, 12, 3);
                    graphics.fillRect(30, 10, 17, 4);
                    graphics.fillRoundedRect(12, 17, 8, 12, 2);
                } else if (type === 'assault_rifle') {
                    graphics.fillRoundedRect(5, 8, 29, 12, 3);
                    graphics.fillRect(32, 9, 15, 4);
                    graphics.fillRect(18, 19, 5, 9);
                    graphics.fillRect(7, 4, 8, 4);
                } else if (type === 'sniper_rifle') {
                    graphics.fillRoundedRect(3, 9, 34, 9, 3);
                    graphics.fillRect(35, 11, 12, 3);
                    graphics.fillRect(13, 18, 4, 10);
                    graphics.fillRect(19, 5, 11, 3);
                    graphics.fillRect(22, 7, 4, 3);
                } else {
                    graphics.fillRoundedRect(10, 9, 24, 11, 3);
                    graphics.fillRect(32, 12, 13, 4);
                    graphics.fillRoundedRect(15, 18, 7, 10, 2);
                }
                graphics.fillStyle(accent, 1);
                graphics.fillRect(16, 10, 9, 3);
                graphics.fillStyle(0xb8c3cc, 1);
                graphics.fillRect(38, 10, 6, 2);
            }

            graphics.generateTexture(textureKey, 48, 32);
            graphics.destroy();
        }

        return textureKey;
    }

    constructor(scene, x, y, type) {

        super(
            scene,
            x,
            y,
            Weapon.createTexture(scene, type)
        );

        scene.add.existing(this);

        const weapon = getWeaponById(type);
        if (!weapon) {
            throw new RangeError(`Unknown weapon type: ${type}`);
        }

        this.type = type;
        this.name = weapon.name.toUpperCase();
        this.damage = weapon.damage;
        this.range = weapon.range;
        this.fireRate = weapon.fireRate;
        this.magazineSize = weapon.magazineSize || 0;
        this.pellets = weapon.pellets || 1;
        this.isMelee = weapon.category === 'Melee';

        // =========================
        // VISUAL
        // =========================

        this.setDisplaySize(48, 32);
        this.setDepth(10);
    }
}