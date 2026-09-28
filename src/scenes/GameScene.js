import Phaser from 'phaser';
import House from '../entities/House.js';
import Tree from '../entities/Tree.js';
import Player from '../entities/Player.js';
import Zombie from '../entities/Zombie.js';
import EasyStar from 'easystarjs';
import Weapon from '../entities/Weapon.js';
import AmmoPickup from '../entities/AmmoPickup.js';
import MedKitPickup from '../entities/MedKitPickup.js';
import CoinPickup from '../entities/CoinPickup.js';

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

        this.score = 0;
        this.coins = 0;

        this.scoreText = this.add.text(
            this.cameras.main.width /
                this.cameras.main.zoom - 20,
            20,
            'Score: 0',
            {
                fontSize: '20px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );

        this.scoreText
            .setOrigin(1, 0)
            .setDepth(200000);

        this.coinsText = this.add.text(
            this.cameras.main.width /
                this.cameras.main.zoom - 20,
            48,
            'Coins: 0',
            {
                fontSize: '18px',
                color: '#ffd45c',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );

        this.coinsText
            .setOrigin(1, 0)
            .setDepth(200000);

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

        const roadCenterY = 1500;
        const roadHeight = 180;

        this.add.rectangle(
            1500,
            roadCenterY,
            3000,
            roadHeight,
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
        this.obstacles = this.physics.add.staticGroup();
        this.obstacles.add(this.house.body);

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

            const treeFootprint = 25;
            const roadTop = roadCenterY - roadHeight / 2;
            const roadBottom = roadCenterY + roadHeight / 2;

            if (
                y + treeFootprint >= roadTop &&
                y - treeFootprint <= roadBottom
            ) {
                continue;
            }

            const tree = new Tree(
                this,
                x,
                y
            );

            this.trees.push(tree);
            this.obstacles.add(tree.body);

            // Block tree for pathfinding
            this.blockPathfindingArea(
                tree.body
            );
        }

        // Player ↔ obstacles
        this.physics.add.collider(
            this.player,
            this.obstacles
        );
        
      // =========================
// WEAPON DROPS
// =========================

this.weapons = [];

const weaponTypes = [
    'blaster',
    'rapid',
    'heavy'
];

for (let i = 0; i < 22; i++) {

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

this.ammoPickups = [];
this.maxAmmoPickups = 20;

for (let i = 0; i < this.maxAmmoPickups; i++) {
    this.spawnAmmoNearPlayer();
}

this.time.addEvent({
    delay: 15000,
    callback: () => {
        if (this.ammoPickups.length < this.maxAmmoPickups) {
            this.spawnAmmoNearPlayer();
        }
    },
    loop: true
});

this.medKitPickups = [];

this.time.addEvent({
    delay: 60000,
    callback: () => {
        this.spawnMedKitNearPlayer();
        this.spawnMedKitNearPlayer();
    },
    loop: true
});

this.coinPickups = [];

this.time.addEvent({
    delay: 60000,
    callback: () => {
        this.spawnCoinNearPlayer();
        this.spawnCoinNearPlayer();
    },
    loop: true
});



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
        this.zombieSpawnRadius = 500;

        for (let i = 0; i < 5; i++) {

            this.spawnZombieNearPlayer();
        }

        this.time.addEvent({
            delay: 10000,
            callback: () => {
                this.spawnZombieNearPlayer();
            },
            loop: true
        });
    }

    spawnAmmoNearPlayer() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(120, 900);
        const x = Phaser.Math.Clamp(
            this.player.x + Math.cos(angle) * distance,
            35,
            2965
        );
        const y = Phaser.Math.Clamp(
            this.player.y + Math.sin(angle) * distance,
            35,
            2965
        );

        const pickup = new AmmoPickup(this, x, y);
        this.ammoPickups.push(pickup);
    }

    spawnMedKitNearPlayer() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(120, 900);
        const x = Phaser.Math.Clamp(
            this.player.x + Math.cos(angle) * distance,
            35,
            2965
        );
        const y = Phaser.Math.Clamp(
            this.player.y + Math.sin(angle) * distance,
            35,
            2965
        );

        const pickup = new MedKitPickup(this, x, y);
        this.medKitPickups.push(pickup);
    }

    spawnCoinNearPlayer() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(120, 900);
        const x = Phaser.Math.Clamp(
            this.player.x + Math.cos(angle) * distance,
            35,
            2965
        );
        const y = Phaser.Math.Clamp(
            this.player.y + Math.sin(angle) * distance,
            35,
            2965
        );

        const pickup = new CoinPickup(this, x, y);
        this.coinPickups.push(pickup);
    }

    addCoins(amount) {
        this.coins += amount;
        this.coinsText.setText(`Coins: ${this.coins}`);
    }

    spawnZombieNearPlayer() {

        const angle = Phaser.Math.FloatBetween(
            0,
            Math.PI * 2
        );

        const distance =
            Math.sqrt(Math.random()) *
            this.zombieSpawnRadius;

        const x = Phaser.Math.Clamp(
            this.player.x + Math.cos(angle) * distance,
            25,
            2975
        );

        const y = Phaser.Math.Clamp(
            this.player.y + Math.sin(angle) * distance,
            25,
            2975
        );

        this.spawnZombie(x, y);
    }

    spawnZombie(x, y) {

        const zombie = new Zombie(
            this,
            x,
            y
        );

        this.zombies.push(zombie);

        // Zombie and obstacles
        this.physics.add.collider(
            zombie,
            this.obstacles,
            () => {
                zombie.pickNewDirection();
            }
        );

        // Zombie and player
        this.physics.add.collider(
            zombie,
            this.player
        );
    }

    // =========================
    // UPDATE
    // =========================

 update() {

    this.scoreText.setPosition(
        this.cameras.main.worldView.right - 20,
        this.cameras.main.worldView.top + 20
    );
    this.coinsText.setPosition(
        this.cameras.main.worldView.right - 20,
        this.cameras.main.worldView.top + 48
    );

    this.player.update();

    for (const zombie of [...this.zombies]) {

        if (zombie.active) {
            zombie.update();
        }
    }

    for (const projectile of [...this.projectiles]) {

        if (projectile.active && projectile.body) {
            projectile.update();

            if (!projectile.active || !projectile.body) {
                continue;
            }

            const projectileBounds = new Phaser.Geom.Rectangle(
                projectile.body.x,
                projectile.body.y,
                projectile.body.width,
                projectile.body.height
            );
            const hitHouse =
                Phaser.Geom.Intersects.RectangleToRectangle(
                    projectileBounds,
                    this.house.body.body
                );
            const hitTree = this.trees.some(tree =>
                Phaser.Geom.Intersects.RectangleToRectangle(
                    projectileBounds,
                    tree.body.body
                )
            );

            if (hitHouse || hitTree) {
                projectile.destroy();
                continue;
            }

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