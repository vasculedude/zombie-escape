import Phaser from 'phaser';

export default class GrenadePickup extends Phaser.GameObjects.Image {
    static createTexture(scene) {
        const textureKey = 'grenade-pickup';

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            graphics.fillStyle(0x000000, 0.25);
            graphics.fillEllipse(20, 28, 24, 8);

            graphics.fillStyle(0x7d7d7d, 1);
            graphics.fillRoundedRect(11, 5, 22, 28, 7);
            graphics.fillStyle(0x4d4d4d, 1);
            graphics.fillRoundedRect(16, 2, 12, 8, 3);
            graphics.fillStyle(0xd93b2b, 1);
            graphics.fillCircle(12, 10, 3);
            graphics.fillStyle(0x2d2d2d, 1);
            graphics.fillRect(22, 20, 4, 8);
            graphics.fillStyle(0xffa000, 1);
            graphics.fillTriangle(18, 30, 24, 30, 21, 36);

            graphics.generateTexture(textureKey, 44, 40);
            graphics.destroy();
        }

        return textureKey;
    }

    constructor(scene, x, y) {
        super(scene, x, y, GrenadePickup.createTexture(scene));

        scene.add.existing(this);

        this.amount = 1;
        this.setDisplaySize(30, 34);
        this.setDepth(9);
    }
}
