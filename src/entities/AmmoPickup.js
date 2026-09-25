import Phaser from 'phaser';

export default class AmmoPickup extends Phaser.GameObjects.Image {

    static createTexture(scene) {
        const textureKey = 'ammo-packet';

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            graphics.fillStyle(0x000000, 0.25);
            graphics.fillEllipse(24, 30, 36, 9);

            graphics.fillStyle(0x286c3b, 1);
            graphics.fillRoundedRect(5, 5, 38, 24, 4);
            graphics.lineStyle(2, 0x173d25, 1);
            graphics.strokeRoundedRect(5, 5, 38, 24, 4);

            graphics.fillStyle(0xe0b84b, 1);
            graphics.fillRect(10, 10, 4, 14);
            graphics.fillRect(18, 10, 4, 14);
            graphics.fillRect(26, 10, 4, 14);

            graphics.fillStyle(0xf5df9b, 1);
            graphics.fillRect(10, 8, 4, 3);
            graphics.fillRect(18, 8, 4, 3);
            graphics.fillRect(26, 8, 4, 3);

            graphics.generateTexture(textureKey, 48, 36);
            graphics.destroy();
        }

        return textureKey;
    }

    constructor(scene, x, y) {
        super(scene, x, y, AmmoPickup.createTexture(scene));

        scene.add.existing(this);

        this.amount = 10;
        this.setDisplaySize(48, 36);
        this.setDepth(9);
    }
}