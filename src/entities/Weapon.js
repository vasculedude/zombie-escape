import Phaser from 'phaser';

export default class Weapon extends Phaser.GameObjects.Image {

    static createTexture(scene, type) {
        const textureKey = `weapon-${type}`;

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            const accent = type === 'blaster'
                ? 0xffd43b
                : type === 'rapid'
                    ? 0x25d9e8
                    : type === 'sword'
                        ? 0xc4c4c4
                        : 0xff8738;

            graphics.fillStyle(0x20242a, 1);
            if (type === 'heavy') {
                graphics.fillRoundedRect(5, 5, 29, 14, 3);
                graphics.fillRect(31, 8, 15, 8);
                graphics.fillRoundedRect(12, 15, 8, 13, 2);
                graphics.fillRect(38, 6, 4, 2);
            } else if (type === 'rapid') {
                graphics.fillRoundedRect(7, 7, 25, 10, 3);
                graphics.fillRect(30, 8, 16, 3);
                graphics.fillRect(30, 13, 16, 3);
                graphics.fillRoundedRect(12, 16, 6, 10, 2);
                graphics.fillRect(7, 4, 5, 3);
            } else if (type === 'sword') {
                graphics.fillRoundedRect(17, 2, 8, 22, 2);
                graphics.fillRect(14, 22, 14, 6);
                graphics.fillTriangle(12, 1, 24, 1, 18, 12);
            } else {
                graphics.fillRoundedRect(9, 7, 24, 11, 3);
                graphics.fillRect(31, 10, 14, 5);
                graphics.fillRoundedRect(15, 17, 7, 11, 2);
            }

            graphics.fillStyle(accent, 1);
            graphics.fillRoundedRect(16, 9, type === 'heavy' ? 10 : 9, 4, 2);
            if (type === 'sword') {
                graphics.fillStyle(0xdfe7f0, 1);
                graphics.fillRect(15, 8, 12, 3);
            } else {
                graphics.fillStyle(0xb8c3cc, 1);
                graphics.fillRect(37, 9, type === 'rapid' ? 7 : 5, 2);
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

        this.type = type;

        // =========================
        // WEAPON STATS
        // =========================

        if (type === 'blaster') {

            this.damage = 20;
            this.range = 300;
            this.fireRate = 500;
            this.name = 'BLASTER';

        } else if (type === 'rapid') {

            this.damage = 10;
            this.range = 350;
            this.fireRate = 150;
            this.name = 'RAPID BLASTER';

        } else if (type === 'heavy') {

            this.damage = 40;
            this.range = 250;
            this.fireRate = 900;
            this.name = 'HEAVY BLASTER';

        } else if (type === 'sword') {

            this.damage = 100;
            this.range = 120;
            this.fireRate = 5000;
            this.name = 'SWORD';
        }

        // =========================
        // VISUAL
        // =========================

        this.setDisplaySize(48, 32);
        this.setDepth(10);
    }
}