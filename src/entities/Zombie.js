 import Phaser from 'phaser';

export default class Zombie extends Phaser.Physics.Arcade.Sprite {

    static createSpriteTexture(scene) {
        const textureKey = 'zombie-cartoon';

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            graphics.clear();

            // Shadow
            graphics.fillStyle(0x000000, 0.18);
            graphics.fillEllipse(32, 52, 30, 9);

            // Arms
            graphics.fillStyle(0x5a3a1d, 1);
            graphics.fillRoundedRect(12, 30, 8, 20, 4);
            graphics.fillRoundedRect(44, 30, 8, 20, 4);

            // Body
            graphics.fillStyle(0x7cae2d, 1);
            graphics.fillEllipse(32, 34, 28, 26);

            // Belt / chest
            graphics.fillStyle(0x506b17, 1);
            graphics.fillRoundedRect(19, 33, 26, 9, 4);

            // Head / mask
            graphics.fillStyle(0x3f2a1b, 1);
            graphics.fillEllipse(32, 16, 16, 14);

            // Face details
            graphics.fillStyle(0x0d0d0d, 1);
            graphics.fillRect(27, 15, 3, 3);
            graphics.fillRect(34, 15, 3, 3);
            graphics.fillRect(29, 20, 6, 2);

            // Legs
            graphics.fillStyle(0x2b2b2b, 1);
            graphics.fillRoundedRect(22, 44, 7, 14, 3);
            graphics.fillRoundedRect(35, 44, 7, 14, 3);

            graphics.generateTexture(textureKey, 64, 64);
            graphics.destroy();
        }

        return textureKey;
    }

    constructor(scene, x, y) {

        super(scene, x, y, Zombie.createSpriteTexture(scene));

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // =========================
        // APPEARANCE
        // =========================

        this.setDisplaySize(50, 50);
        this.setOrigin(0.5, 0.5);
        this.setDepth(12);
        this.body.setSize(24, 30);
        this.body.setOffset(20, 18);

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

        this.animationTime = 0;
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

            this.scene.score++;
            this.scene.scoreText.setText(
                `Score: ${this.scene.score}`
            );

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

        const moveSpeed = Math.hypot(this.body.velocity.x, this.body.velocity.y);
        this.animationTime += this.scene.game.loop.delta;

        if (moveSpeed > 10) {
            const bob = Math.sin(this.animationTime / 160) * 2;
            this.setScale(1, 1 + (Math.abs(Math.sin(this.animationTime / 180)) * 0.05));
            this.setY(this.y + bob * 0.2);
        } else {
            this.setScale(1, 1);
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
            //
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