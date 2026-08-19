 import Phaser from 'phaser';

export default class Zombie extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {

        super(scene, x, y, null);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // =========================
        // APPEARANCE
        // =========================

        this.setDisplaySize(50, 50);
        this.setTint(0xff0000);

        // =========================
        // MOVEMENT
        // =========================

        this.speed = 60;

        // Start chasing within this distance
        this.chaseDistance = 700;

        // =========================
        // HEALTH
        // =========================

        this.maxHealth = 100;
        this.health = 100;

        // =========================
        // ATTACK
        // =========================

        this.attackDamage = 10;

        this.attackCooldown = 1000;

        this.lastAttackTime = 0;

        // =========================
        // HEALTH BAR
        // =========================

        this.healthBarBg = scene.add.rectangle(
            x,
            y - 35,
            50,
            7,
            0x222222
        );

        this.healthBar = scene.add.rectangle(
            x,
            y - 35,
            46,
            5,
            0xff0000
        );

        // =========================
        // WANDERING
        // =========================

        this.direction = Phaser.Math.Between(
            0,
            3
        );

        scene.time.addEvent({
            delay: 2000,
            callback: this.pickNewDirection,
            callbackScope: this,
            loop: true
        });

        // =========================
        // PATHFINDING
        // =========================

        this.path = [];

        this.pathIndex = 0;

        this.lastPathTime = 0;

        this.pathCooldown = 500;

        this.isPathfinding = false;
    }

    // =========================
    // RANDOM DIRECTION
    // =========================

    pickNewDirection() {

        this.direction =
            Phaser.Math.Between(0, 3);
    }

    // =========================
    // DAMAGE
    // =========================

    takeDamage(amount) {

        this.health -= amount;

        if (this.health <= 0) {

            this.health = 0;

            this.healthBar.destroy();
            this.healthBarBg.destroy();

            const index =
                this.scene.zombies.indexOf(
                    this
                );

            if (index !== -1) {

                this.scene.zombies.splice(
                    index,
                    1
                );
            }

            this.destroy();

            return;
        }

        this.healthBar.width =
            46 *
            (this.health / this.maxHealth);
    }

    // =========================
    // GET GRID POSITION
    // =========================

    getGridPosition(x, y) {

        return {
            x: Phaser.Math.Clamp(
                Math.floor(
                    x /
                    this.scene.tileSize
                ),
                0,
                this.scene.gridWidth - 1
            ),

            y: Phaser.Math.Clamp(
                Math.floor(
                    y /
                    this.scene.tileSize
                ),
                0,
                this.scene.gridHeight - 1
            )
        };
    }

    // =========================
    // FIND PATH
    // =========================

    findPathToPlayer() {

        const player =
            this.scene.player;

        if (!player) {
            return;
        }

        const start =
            this.getGridPosition(
                this.x,
                this.y
            );

        const end =
            this.getGridPosition(
                player.x,
                player.y
            );

        this.isPathfinding = true;

        this.scene.pathfinder.findPath(
            start.x,
            start.y,
            end.x,
            end.y,
            (newPath) => {

                this.isPathfinding = false;

                if (
                    newPath &&
                    newPath.length > 0
                ) {

                    this.path = newPath;

                    this.pathIndex = 0;
                }
            }
        );

        this.scene.pathfinder.calculate();
    }

    // =========================
    // FOLLOW PATH
    // =========================

    followPath() {

        if (
            !this.path ||
            this.path.length === 0
        ) {

            this.setVelocity(0, 0);

            return;
        }

        if (
            this.pathIndex >=
            this.path.length
        ) {

            this.setVelocity(0, 0);

            return;
        }

        const target =
            this.path[this.pathIndex];

        const targetX =
            target.x *
            this.scene.tileSize +
            this.scene.tileSize / 2;

        const targetY =
            target.y *
            this.scene.tileSize +
            this.scene.tileSize / 2;

        const distance =
            Phaser.Math.Distance.Between(
                this.x,
                this.y,
                targetX,
                targetY
            );

        // Move to next path point
        if (distance < 10) {

            this.pathIndex++;

            return;
        }

        const angle =
            Phaser.Math.Angle.Between(
                this.x,
                this.y,
                targetX,
                targetY
            );

        this.setVelocity(
            Math.cos(angle) *
            this.speed,

            Math.sin(angle) *
            this.speed
        );
    }

    // =========================
    // UPDATE
    // =========================

    update() {

        const player =
            this.scene.player;

        if (!player) {
            return;
        }

        const distance =
            Phaser.Math.Distance.Between(
                this.x,
                this.y,
                player.x,
                player.y
            );

        // =========================
        // CHASE
        // =========================

        if (
            distance <
            this.chaseDistance
        ) {

            // Calculate a new path
            // every 500 milliseconds

            if (
                this.scene.time.now >=
                this.lastPathTime +
                this.pathCooldown &&
                !this.isPathfinding
            ) {

                this.lastPathTime =
                    this.scene.time.now;

                this.findPathToPlayer();
            }

            this.followPath();

        } else {

            // =========================
            // RANDOM WANDERING
            // =========================

            switch (this.direction) {

                case 0:
                    this.setVelocity(
                        this.speed,
                        0
                    );
                    break;

                case 1:
                    this.setVelocity(
                        -this.speed,
                        0
                    );
                    break;

                case 2:
                    this.setVelocity(
                        0,
                        this.speed
                    );
                    break;

                case 3:
                    this.setVelocity(
                        0,
                        -this.speed
                    );
                    break;
            }
        }

        // =========================
        // ATTACK
        // =========================

        if (
            distance < 55 &&
            this.scene.time.now >=
            this.lastAttackTime +
            this.attackCooldown
        ) {

            this.lastAttackTime =
                this.scene.time.now;

            player.takeDamage(
                this.attackDamage
            );
        }

        // =========================
        // HEALTH BAR
        // =========================

        this.healthBarBg.setPosition(
            this.x,
            this.y - 35
        );

        this.healthBar.setPosition(
            this.x,
            this.y - 35
        );
    }
}