import Phaser from 'phaser';
import Projectile from './Projectile.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {

        super(scene, x, y, null);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // =========================
        // PLAYER
        // =========================

        this.setDisplaySize(40, 40);

        this.body.setSize(24, 24);
        this.body.setOffset(8, 8);

        this.setTint(0x0099ff);

        this.speed = 200;

        // =========================
        // HEALTH
        // =========================

        this.maxHealth = 100;
        this.health = 100;

        // =========================
        // PUNCH
        // =========================

        this.attackKey =
            scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.SPACE
            );

        this.punchCooldown = 400;
        this.lastPunchTime = 0;

        // =========================
        // SHOOTING
        // =========================

        this.shootKey =
            scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.E
            );

        this.weapon = null;
        this.lastShotTime = 0;

        // =========================
        // PLAYER HP BAR
        // =========================

        this.healthBg =
            scene.add.rectangle(
                this.x,
                this.y - 32,
                50,
                7,
                0x222222
            );

        this.healthBar =
            scene.add.rectangle(
                this.x,
                this.y - 32,
                46,
                5,
                0x00aaff
            );

        this.healthBg.setDepth(100);
        this.healthBar.setDepth(101);

        // =========================
        // MOVEMENT
        // =========================

        this.cursors =
            scene.input.keyboard.createCursorKeys();

        this.keys =
            scene.input.keyboard.addKeys({
                W: Phaser.Input.Keyboard.KeyCodes.W,
                A: Phaser.Input.Keyboard.KeyCodes.A,
                S: Phaser.Input.Keyboard.KeyCodes.S,
                D: Phaser.Input.Keyboard.KeyCodes.D
            });
    }

    // =========================
    // TAKE DAMAGE
    // =========================

    takeDamage(amount) {

        this.health -= amount;

        if (this.health <= 0) {

            this.health = 0;

            this.setVelocity(0, 0);

            const defeatText =
                this.scene.add.text(
                    400,
                    300,
                    'YOU WERE DEFEATED',
                    {
                        fontSize: '32px',
                        color: '#ffffff',
                        fontStyle: 'bold'
                    }
                );

            defeatText
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(200000);

            this.scene.physics.pause();

            return;
        }

        this.healthBar.width =
            46 *
            (this.health / this.maxHealth);
    }

    // =========================
    // PICK UP WEAPON
    // =========================

    tryPickupWeapon() {

        if (!this.scene.weapons) {
            return;
        }

        for (const weapon of this.scene.weapons) {

            if (!weapon.active) {
                continue;
            }

            const distance =
                Phaser.Math.Distance.Between(
                    this.x,
                    this.y,
                    weapon.x,
                    weapon.y
                );

            if (distance < 35) {

                this.weapon = weapon;

                weapon.destroy();

                this.scene.weapons =
                    this.scene.weapons.filter(
                        item => item !== weapon
                    );

                console.log(
                    'Picked up:',
                    this.weapon.name
                );

                break;
            }
        }
    }

    // =========================
    // SHOOT
    // =========================

    shoot() {

        if (!this.weapon) {
            return;
        }

        const now =
            this.scene.time.now;

        if (
            now <
            this.lastShotTime +
            this.weapon.fireRate
        ) {
            return;
        }

        let closestZombie = null;

        let closestDistance =
            this.weapon.range;

        for (
            const zombie of this.scene.zombies
        ) {

            if (!zombie.active) {
                continue;
            }

            const distance =
                Phaser.Math.Distance.Between(
                    this.x,
                    this.y,
                    zombie.x,
                    zombie.y
                );

            if (
                distance <
                closestDistance
            ) {

                closestDistance = distance;
                closestZombie = zombie;
            }
        }

        if (!closestZombie) {
            return;
        }

        this.lastShotTime = now;

        const angle =
            Phaser.Math.Angle.Between(
                this.x,
                this.y,
                closestZombie.x,
                closestZombie.y
            );

        const projectile =
            new Projectile(
                this.scene,
                this.x,
                this.y,
                angle,
                this.weapon.damage,
                this.weapon.range
            );

        if (!this.scene.projectiles) {
            this.scene.projectiles = [];
        }

        this.scene.projectiles.push(
            projectile
        );
    }

    // =========================
    // UPDATE
    // =========================

    update() {

        let velocityX = 0;
        let velocityY = 0;

        if (
            this.cursors.left.isDown ||
            this.keys.A.isDown
        ) {

            velocityX = -this.speed;

        } else if (
            this.cursors.right.isDown ||
            this.keys.D.isDown
        ) {

            velocityX = this.speed;
        }

        if (
            this.cursors.up.isDown ||
            this.keys.W.isDown
        ) {

            velocityY = -this.speed;

        } else if (
            this.cursors.down.isDown ||
            this.keys.S.isDown
        ) {

            velocityY = this.speed;
        }

        this.setVelocity(
            velocityX,
            velocityY
        );

        if (
            velocityX !== 0 &&
            velocityY !== 0
        ) {

            this.body.velocity
                .normalize()
                .scale(this.speed);
        }

        // =========================
        // FOLLOW PLAYER
        // =========================

        this.healthBg.setPosition(
            this.x,
            this.y - 32
        );

        this.healthBar.setPosition(
            this.x,
            this.y - 32
        );

        // =========================
        // UPDATE HP
        // =========================

        this.healthBar.width =
            46 *
            (this.health / this.maxHealth);

        // =========================
        // PICKUP
        // =========================

        this.tryPickupWeapon();

        // =========================
        // PUNCH
        // =========================

        if (
            Phaser.Input.Keyboard.JustDown(
                this.attackKey
            ) &&
            this.scene.time.now >=
            this.lastPunchTime +
            this.punchCooldown
        ) {

            this.lastPunchTime =
                this.scene.time.now;

            for (
                const zombie of [
                    ...this.scene.zombies
                ]
            ) {

                const distance =
                    Phaser.Math.Distance.Between(
                        this.x,
                        this.y,
                        zombie.x,
                        zombie.y
                    );

                if (distance < 70) {

                    zombie.takeDamage(20);
                }
            }
        }

        // =========================
        // SHOOT
        // =========================

        if (
            Phaser.Input.Keyboard.JustDown(
                this.shootKey
            )
        ) {

            this.shoot();
        }
    }
}