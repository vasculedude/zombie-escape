import Phaser from 'phaser';
import Projectile from './Projectile.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {

    static createSpriteTexture(scene) {
        const textureKey = 'player-human';

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0,
                add: false
            });

            graphics.clear();

            // Shadow
            graphics.fillStyle(0x000000, 0.25);
            graphics.fillEllipse(24, 38, 20, 8);

            // Legs
            graphics.fillStyle(0x2a2a2a, 1);
            graphics.fillRect(17, 29, 4, 12);
            graphics.fillRect(27, 29, 4, 12);

            // Body
            graphics.fillStyle(0x4dabf7, 1);
            graphics.fillRoundedRect(13, 15, 22, 14, 4);

            // Head
            graphics.fillStyle(0xf2d0b5, 1);
            graphics.fillEllipse(24, 10, 12, 12);

            // Hair
            graphics.fillStyle(0x2b1d12, 1);
            graphics.fillRoundedRect(16, 5, 16, 6, 3);

            // Arms
            graphics.fillStyle(0xf2d0b5, 1);
            graphics.fillRoundedRect(9, 17, 4, 14, 2);
            graphics.fillRoundedRect(35, 17, 4, 14, 2);

            // Weapon hand
            graphics.fillStyle(0x7d7d7d, 1);
            graphics.fillRect(29, 20, 13, 3);

            graphics.generateTexture(textureKey, 48, 48);
            graphics.destroy();
        }

        return textureKey;
    }

    constructor(scene, x, y) {

        super(scene, x, y, Player.createSpriteTexture(scene));

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // =========================
        // PLAYER
        // =========================

        this.setDisplaySize(42, 42);
        this.setOrigin(0.5, 0.5);
        this.setDepth(15);

        this.body.setSize(18, 24);
        this.body.setOffset(15, 16);

        this.speed = 200;
        this.facingAngle = 0;

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
        this.shotCount = 0;
        this.reloadUntil = 0;
        this.reloadDelay = 1000;

        // =========================
        // PLAYER HP BAR
        // =========================

        this.healthBg =
            scene.add.rectangle(
                0,
                0,
                180,
                18,
                0x222222
            );

        this.healthBar =
            scene.add.rectangle(
                0,
                0,
                170,
                12,
                0x00aaff
            );

        this.healthBg.setPosition(110, 80);
        this.healthBar.setPosition(110, 80);
        this.healthBg.setOrigin(0, 0);
        this.healthBar.setOrigin(0, 0);
        this.healthBg.setDepth(200000);
        this.healthBar.setDepth(200001);
        this.healthBg.setScrollFactor(1);
        this.healthBar.setScrollFactor(1);

        this.weaponText =
            scene.add.text(
                20,
                20,
                'NO WEAPON',
                {
                    fontSize: '20px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            );

        this.ammoText =
            scene.add.text(
                20,
                48,
                'Ammo: --',
                {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            );

        this.weaponText.setDepth(200000);
        this.ammoText.setDepth(200000);
        this.weaponText.setScrollFactor(0);
        this.ammoText.setScrollFactor(0);

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
            170 *
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
                this.shotCount = 0;
                this.reloadUntil = 0;

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

        if (now < this.reloadUntil) {
            return;
        }

        if (
            now <
            this.lastShotTime +
            this.weapon.fireRate
        ) {
            return;
        }

        this.lastShotTime = now;
        this.shotCount += 1;

        if (this.shotCount >= 10) {
            this.reloadUntil = now + this.reloadDelay;
            this.shotCount = 0;
        }

        const angle = this.facingAngle;

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

        const pointer = this.scene.input.activePointer;
        const worldPoint = this.scene.cameras.main.getWorldPoint(
            pointer.x,
            pointer.y
        );

        const angle = Phaser.Math.Angle.Between(
            this.x,
            this.y,
            worldPoint.x,
            worldPoint.y
        );

        this.facingAngle = angle;
        this.setRotation(angle + Math.PI / 2);

        let velocityX = 0;
        let velocityY = 0;

        const moveForward =
            this.cursors.up.isDown ||
            this.keys.W.isDown;

        if (moveForward) {
            const dx = worldPoint.x - this.x;
            const dy = worldPoint.y - this.y;
            const length = Math.hypot(dx, dy) || 1;

            velocityX = (dx / length) * this.speed;
            velocityY = (dy / length) * this.speed;

        } else {
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
                this.cursors.down.isDown ||
                this.keys.S.isDown
            ) {

                velocityY = this.speed;
            }
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
        // HUD
        // =========================

        const hudX =
            this.scene.cameras.main.worldView.left + 20;
        const hudY =
            this.scene.cameras.main.worldView.top + 20;

        this.healthBg.setPosition(
            hudX,
            hudY
        );

        this.healthBar.setPosition(
            hudX,
            hudY
        );

        const nameText =
            this.weapon ? this.weapon.name : 'NO WEAPON';
        this.weaponText.setText(nameText);

        if (!this.weapon) {
            this.ammoText.setText('Ammo: --');
        } else if (this.scene.time.now < this.reloadUntil) {
            this.ammoText.setText('Ammo: Reloading...');
        } else {
            const ammoLeft =
                Math.max(0, 10 - this.shotCount);
            this.ammoText.setText(
                `Ammo: ${ammoLeft}/10`
            );
        }

        // =========================
        // UPDATE HP
        // =========================

        this.healthBar.width =
            170 *
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