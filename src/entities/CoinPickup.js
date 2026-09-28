import Phaser from 'phaser';

export default class CoinPickup extends Phaser.GameObjects.Container {

    constructor(scene, x, y) {
        super(scene, x, y);

        scene.add.existing(this);

        this.amount = Phaser.Math.Between(10, 100);

        const shadow = scene.add.ellipse(
            0,
            13,
            36,
            9,
            0x000000,
            0.25
        );
        const coin = scene.add.circle(
            0,
            0,
            16,
            0xf2bd3d
        ).setStrokeStyle(3, 0x875f14);
        const innerRing = scene.add.circle(
            0,
            0,
            11
        ).setStrokeStyle(1, 0xffe69a);
        const symbol = scene.add.text(
            0,
            0,
            '$',
            {
                fontSize: '19px',
                color: '#875f14',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        const value = scene.add.text(
            0,
            -27,
            `+${this.amount}`,
            {
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);

        this.add([
            shadow,
            coin,
            innerRing,
            symbol,
            value
        ]);
        this.setDepth(9);
    }
}