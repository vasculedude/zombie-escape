import Phaser from 'phaser';

export default class MedKitPickup extends Phaser.GameObjects.Image {

    static createTexture(scene) {
        const textureKey = 'med-kit';

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            graphics.fillStyle(0x000000, 0.25);
            graphics.fillEllipse(24, 30, 36, 9);

            graphics.fillStyle(0xf4f1e8, 1);
            graphics.fillRoundedRect(5, 5, 38, 24, 4);
            graphics.lineStyle(2, 0xaaa69c, 1);
            graphics.strokeRoundedRect(5, 5, 38, 24, 4);

            graphics.fillStyle(0xc83d3d, 1);
            graphics.fillRect(20, 9, 8, 16);
            graphics.fillRect(16, 13, 16, 8);

            graphics.generateTexture(textureKey, 48, 36);
            graphics.destroy();
        }

        return textureKey;
    }

    constructor(scene, x, y) {
        super(scene, x, y, MedKitPickup.createTexture(scene));

        scene.add.existing(this);

        this.healAmount = 20;
        this.setDisplaySize(48, 36);
        this.setDepth(9);
    }
}