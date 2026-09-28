import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {

    static createTexture(scene) {
        const textureKey = 'projectile-bullet';

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            graphics.fillStyle(0xffff00, 1);
            graphics.fillCircle(5, 5, 5);
            graphics.generateTexture(textureKey, 10, 10);
            graphics.destroy();
        }

        return textureKey;
    }

    constructor(scene, x, y, angle, damage, range) {

        super(scene, x, y, Projectile.createTexture(scene));

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.damage = damage;
        this.range = range;

        this.startX = x;
        this.startY = y;

        this.speed = 500;

        this.setDisplaySize(10, 10);
        this.setTint(0xffff00);

        this.body.setAllowGravity(false);

        this.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );

        this.setRotation(angle);
    }

    update() {

        const distance =
            Phaser.Math.Distance.Between(
                this.startX,
                this.startY,
                this.x,
                this.y
            );

        if (distance >= this.range) {
            this.destroy();
        }
    }
}