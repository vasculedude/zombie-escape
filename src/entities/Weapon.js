import Phaser from 'phaser';

export default class Weapon extends Phaser.GameObjects.Rectangle {

    constructor(scene, x, y, type) {

        super(
            scene,
            x,
            y,
            24,
            24,
            0xffff00
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

        if (type === 'blaster') {

            this.setFillStyle(
                0xffff00
            );

        } else if (type === 'rapid') {

            this.setFillStyle(
                0x00ffff
            );

        } else if (type === 'heavy') {

            this.setFillStyle(
                0xff8800
            );
        }

        this.setDepth(10);
    }
}