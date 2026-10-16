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

    static createEnergyTexture(scene) {
        const textureKey = 'projectile-energy';

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            graphics.fillStyle(0x168bff, 0.2);
            graphics.fillCircle(24, 24, 24);
            graphics.fillStyle(0x28aaff, 0.45);
            graphics.fillCircle(24, 24, 17);
            graphics.fillStyle(0x8cddff, 0.9);
            graphics.fillCircle(24, 24, 10);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(21, 21, 4);
            graphics.generateTexture(textureKey, 48, 48);
            graphics.destroy();
        }

        return textureKey;
    }

    constructor(scene, x, y, angle, damage, range, options = {}) {

        const isEnergy = options.type === 'energy';
        const textureKey = isEnergy
            ? Projectile.createEnergyTexture(scene)
            : Projectile.createTexture(scene);

        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.damage = damage;
        this.range = range;
        this.hitRadius = options.hitRadius ?? 25;

        this.startX = x;
        this.startY = y;

        this.speed = options.speed ?? 500;

        const size = options.size ?? 10;
        this.setDisplaySize(size, size);
        this.setDepth(20);

        if (!isEnergy) {
            this.setTint(0xffff00);
        }

        this.body.setAllowGravity(false);

        this.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );

        this.setRotation(angle);

        if (isEnergy) {
            scene.tweens.add({
                targets: this,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 120,
                yoyo: true,
                repeat: -1
            });
        }
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