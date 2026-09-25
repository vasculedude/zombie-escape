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
            } else {
                graphics.fillRoundedRect(9, 7, 24, 11, 3);
                graphics.fillRect(31, 10, 14, 5);
                graphics.fillRoundedRect(15, 17, 7, 11, 2);
            }

            graphics.fillStyle(accent, 1);
            graphics.fillRoundedRect(16, 9, type === 'heavy' ? 10 : 9, 4, 2);
            graphics.fillStyle(0xb8c3cc, 1);
            graphics.fillRect(37, 9, type === 'rapid' ? 7 : 5, 2);

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
        }

        // =========================
        // VISUAL
        // =========================

        this.setDisplaySize(48, 32);
        this.setDepth(10);
    }
}