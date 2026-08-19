import Phaser from 'phaser';
import House from '../entities/House.js';
import Tree from '../entities/Tree.js';
import Player from '../entities/Player.js';
import Zombie from '../entities/Zombie.js';
import EasyStar from 'easystarjs';
import Weapon from '../entities/Weapon.js';

export default class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    create() {

        // =========================
        // BACKGROUND
        // =========================

        this.cameras.main.setBackgroundColor('#202020');

        // =========================
        // PLAYER
        // =========================

        this.player = new Player(
            this,
            400,
            300
        );

        // =========================
        // WORLD
        // =========================

        this.physics.world.setBounds(
            0,
            0,
            3000,
            3000
        );

        this.player.setCollideWorldBounds(true);

        // Camera
        this.cameras.main.startFollow(
            this.player
        );

        this.cameras.main.setZoom(2);

        this.cameras.main.setBounds(
            0,
            0,
            3000,
            3000
        );

        // =========================
        // GROUND
        // =========================

        this.add.rectangle(
            1500,
            1500,
            3000,
            3000,
            0x3a8f3a
        ).setDepth(-1);

        // =========================
        // ROAD
        // =========================

        this.add.rectangle(
            1500,
            1500,
            3000,
            180,
            0x555555
        ).setDepth(-1);

        // =========================
        // PATHFINDING
        // =========================

        this.pathfinder = new EasyStar.js();

        this.tileSize = 50;

        this.gridWidth = 60;
        this.gridHeight = 60;

        this.navigationGrid = [];

        // Create empty navigation grid
        for (
            let y = 0;
            y < this.gridHeight;
            y++
        ) {

            const row = [];

            for (
                let x = 0;
                x < this.gridWidth;
                x++
            ) {

                // 0 = walkable
                // 1 = blocked

                row.push(0);
            }

            this.navigationGrid.push(row);
        }

        // Function for blocking areas
        this.blockPathfindingArea = (body) => {

            const startX = Math.floor(
                body.x / this.tileSize
            );

            const startY = Math.floor(
                body.y / this.tileSize
            );

            const endX = Math.ceil(
                (body.x + body.width) /
                this.tileSize
            );

            const endY = Math.ceil(
                (body.y + body.height) /
                this.tileSize
            );

            for (
                let y = startY;
                y < endY;
                y++
            ) {

                for (
                    let x = startX;
                    x < endX;
                    x++
                ) {

                    if (
                        x >= 0 &&
                        x < this.gridWidth &&
                        y >= 0 &&
                        y < this.gridHeight
                    ) {

                        this.navigationGrid[y][x] = 1;
                    }
                }
            }
        };

        // =========================
        // HOUSE
        // =========================

        this.house = new House(
            this,
            450,
            420
        );

        // Player ↔ house
        this.physics.add.collider(
            this.player,
            this.house.body
        );

        // Block house for pathfinding
        this.blockPathfindingArea(
            this.house.body
        );

        // =========================
        // TREES
        // =========================

        this.trees = [];

        for (let i = 0; i < 240; i++) {

            const x =
                Phaser.Math.Between(
                    50,
                    1200
                );

            const y =
                Phaser.Math.Between(
                    50,
                    2900
                );

            // Leave space around house
            if (
                x > 250 &&
                x < 650 &&
                y > 250 &&
                y < 650
            ) {
                continue;
            }

            const tree = new Tree(
                this,
                x,
                y
            );

            this.trees.push(tree);

            // Player ↔ tree
            this.physics.add.collider(
                this.player,
                tree.body
            );

            // Block tree for pathfinding
            this.blockPathfindingArea(
                tree.body
            );
        }
        
      // =========================
// WEAPON DROPS
// =========================

this.weapons = [];

const weaponTypes = [
    'blaster',
    'rapid',
    'heavy'
];

for (let i = 0; i < 12; i++) {

    const x = Phaser.Math.Between(
        100,
        2900
    );

    const y = Phaser.Math.Between(
        100,
        2900
    );

    const randomType =
        Phaser.Utils.Array.GetRandom(
            weaponTypes
        );

    const weapon = new Weapon(
        this,
        x,
        y,
        randomType
    );

    this.weapons.push(weapon);
}



        // =========================
        // GIVE GRID TO EASYSTAR
        // =========================

        this.pathfinder.setGrid(
            this.navigationGrid
        );

        this.pathfinder.setAcceptableTiles([
            0
        ]);

        this.pathfinder.enableDiagonals();

        this.pathfinder.disableCornerCutting();

        // =========================
        // ZOMBIES
        // =========================
         this.projectiles = [];
        this.zombies = [];

        for (let i = 0; i < 5; i++) {

            const zombie = new Zombie(
                this,
                650 + i * 80,
                350
            );

            this.zombies.push(zombie);

            // Zombie ↔ house
            this.physics.add.collider(
                zombie,
                this.house.body,
                () => {
                    zombie.pickNewDirection();
                }
            );

            // Zombie ↔ trees
            for (const tree of this.trees) {

                this.physics.add.collider(
                    zombie,
                    tree.body,
                    () => {
                        zombie.pickNewDirection();
                    }
                );
            }

            // Zombie ↔ player
            this.physics.add.collider(
                zombie,
                this.player
            );
        }
    }

    // =========================
    // UPDATE
    // =========================

 update() {

    this.player.update();

    for (const zombie of [...this.zombies]) {

        if (zombie.active) {
            zombie.update();
        }
    }

    for (const projectile of [...this.projectiles]) {

        if (projectile.active) {
            projectile.update();

            // Check projectile against zombies
            for (const zombie of [...this.zombies]) {

                if (!zombie.active) {
                    continue;
                }

                const distance =
                    Phaser.Math.Distance.Between(
                        projectile.x,
                        projectile.y,
                        zombie.x,
                        zombie.y
                    );

                if (distance < 25) {

                    zombie.takeDamage(
                        projectile.damage
                    );

                    projectile.destroy();

                    break;
                }
            }
        }
    }

    // Remove destroyed projectiles
    this.projectiles =
        this.projectiles.filter(
            projectile => projectile.active
        );
}
}