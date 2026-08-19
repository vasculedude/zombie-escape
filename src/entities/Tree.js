import Phaser from 'phaser';

export default class Tree {

    constructor(scene, x, y) {

        // Invisible collision body
        this.body = scene.add.rectangle(
            x,
            y,
            30,
            30,
            0x000000,
            0
        );

        scene.physics.add.existing(this.body, true);

        // Tree top
        scene.add.circle(
            x,
            y,
            22,
            0x228B22
        );

        // Tree trunk
        scene.add.rectangle(
            x,
            y + 28,
            8,
            18,
            0x8B4513
        );
    }
}