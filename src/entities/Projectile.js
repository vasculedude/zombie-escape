import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, angle, damage, range) {

        super(scene, x, y, null);

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