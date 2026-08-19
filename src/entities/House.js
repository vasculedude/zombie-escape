import Phaser from 'phaser';

export default class House {

    constructor(scene, x, y) {

        // Invisible collision box
        this.body = scene.add.rectangle(
            x,
            y,
            180,
            130,
            0x000000,
            0
        );

        scene.physics.add.existing(this.body, true);

        // Roof
        scene.add.rectangle(
            x,
            y,
            240,
            180,
            0x8B4513
        );

        // Walls
        scene.add.rectangle(
            x,
            y,
            180,
            130,
            0xD2B48C
        );

        // Door
        scene.add.rectangle(
            x,
            y + 25,
            30,
            55,
            0x654321
        );

        // HOME sign
        scene.add.text(
            x - 32,
            y - 75,
            "HOME",
            {
                fontSize: "20px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        );
    }
}