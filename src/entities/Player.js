import Phaser from 'phaser';
import Projectile from './Projectile.js';
import { MAX_TOTAL_AMMO, distributeAmmoPickup } from '../utils/ammoUtils.js';
import { getCharacterById } from '../utils/characterCatalog.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {

    static createSpriteTexture(scene, characterId) {
        const character = getCharacterById(characterId);
        const textureKey = `player-${character.id}`;

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
            graphics.fillStyle(character.color, 1);
            graphics.fillRoundedRect(13, 15, 22, 14, 4);
            if (character.id === 'armoured') {
                graphics.fillStyle(0x5c6670, 1);
                graphics.fillRoundedRect(11, 16, 26, 10, 4);
                graphics.fillStyle(0xc5cbd0, 1);
                graphics.fillRect(17, 18, 14, 3);
            } else if (character.id === 'speedster') {
                graphics.fillStyle(0xffd45c, 1);
                graphics.fillRect(18, 16, 4, 12);
            } else if (character.id === 'gunner') {
                graphics.fillStyle(0x333b27, 1);
                graphics.fillRect(15, 23, 18, 5);
            } else if (character.id === 'lucy') {
                graphics.fillStyle(0xf0b6d7, 1);
                graphics.fillRect(18, 16, 12, 3);
            }

            // Head
            graphics.fillStyle(0xf2d0b5, 1);
            graphics.fillEllipse(24, 10, 12, 12);

            // Hair
            graphics.fillStyle(character.id === 'lucy' ? 0x7d3b82 : 0x2b1d12, 1);
            graphics.fillRoundedRect(16, 5, 16, 6, 3);
            if (character.id === 'armoured') {
                graphics.fillStyle(0x5c6670, 1);
                graphics.fillRoundedRect(13, 3, 22, 7, 3);
                graphics.fillStyle(0xc5cbd0, 1);
                graphics.fillRect(19, 7, 10, 2);
            }

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

        super(
            scene,
            x,
            y,
            Player.createSpriteTexture(
                scene,
                scene.character?.id || scene.registry.get('selectedCharacter')
            )
        );

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

        this.character = scene.character ||
            getCharacterById(scene.registry.get('selectedCharacter'));
        this.speed = 200 * this.character.speedMultiplier;
        this.speedBoostUntil = 0;
        this.armour = 0;
        this.damageMultiplier = this.character.damageMultiplier;
        this.facingAngle = 0;
        this.soundEffects = this.scene.soundEffects;

        // =========================
        // HEALTH
        // =========================

        this.maxHealth = this.character.maxHealth;
        this.health = this.maxHealth;

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

        this.weaponSlotKeys = [
            Phaser.Input.Keyboard.KeyCodes.ONE,
            Phaser.Input.Keyboard.KeyCodes.TWO,
            Phaser.Input.Keyboard.KeyCodes.THREE,
            Phaser.Input.Keyboard.KeyCodes.FOUR,
            Phaser.Input.Keyboard.KeyCodes.FIVE
        ].map(keyCode => scene.input.keyboard.addKey(keyCode));

        this.weapon = null;
        this.heldWeapon = null;
        this.selectedWeaponSlot = 0;
        this.lastShotTime = 0;
        this.magazineSize = 10;
        this.magazineAmmo = 0;
        this.reserveAmmo = 100;
        this.maxReserveAmmo = MAX_TOTAL_AMMO;
        this.reloadUntil = 0;
        this.reloadDelay = 1000;
        this.meleeSwingUntil = 0;
        this.meleeSwingAngle = 0;

        this.swordDashCharges = 3;
        this.maxSwordDashCharges = 3;
        this.swordRechargeUntil = 0;
        this.swordSwing = null;
        this.weaponSlots = scene.armoryWeaponIds.map(type => ({
            type,
            weapon: null,
            magazineAmmo: 0,
            reserveAmmo: 0,
            reloadUntil: 0,
            swordDashCharges: this.maxSwordDashCharges,
            swordRechargeUntil: 0
        }));

        this.grenades = 0;
        this.maxGrenades = 3;

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

        this.ammoText =
            scene.add.text(
                0,
                0,
                '100',
                {
                    fontSize: '22px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            );

        this.grenadeText =
            scene.add.text(
                0,
                0,
                'G: 0',
                {
                    fontSize: '18px',
                    color: '#ffb000',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            );

        this.ammoText.setDepth(200000);
        this.grenadeText.setDepth(200000);
        this.ammoText.setOrigin(1, 0);
        this.grenadeText.setOrigin(1, 0);
        this.ammoText.setScrollFactor(1);
        this.grenadeText.setScrollFactor(1);

        this.weaponListTexts = [];
        for (let index = 0; index < this.weaponSlots.length; index++) {
            const text = scene.add.text(0, 0, '', {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setScrollFactor(1).setDepth(200001);
            this.weaponListTexts.push(text);
        }

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

        if (this.health <= 0) {
            return;
        }

        const absorbedDamage = Math.min(this.armour, amount);
        this.armour -= absorbedDamage;
        amount -= absorbedDamage;
        if (amount <= 0) {
            return;
        }

        this.health -= amount;

        if (this.health <= 0) {

            this.health = 0;
            this.scene.endRun();

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

            const rewardText = this.scene.add.text(
                400,
                340,
                `Run coins: ${this.scene.runCoins} | Death payout: ${this.scene.runReward}`,
                {
                    fontSize: '18px',
                    color: '#ffd45c',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(200000);

            const addDefeatButton = (label, x, onClick) => {
                const button = this.scene.add.text(
                    x,
                    385,
                    label,
                    {
                        fontSize: '20px',
                        color: '#ffffff',
                        fontStyle: 'bold',
                        backgroundColor: '#333333',
                        padding: {
                            x: 20,
                            y: 8
                        }
                    }
                );

                button
                    .setOrigin(0.5)
                    .setScrollFactor(0)
                    .setDepth(200000)
                    .setInteractive({ useHandCursor: true });

                button.on('pointerover', () => {
                    button.setStyle({ color: '#ffff00' });
                });
                button.on('pointerout', () => {
                    button.setStyle({ color: '#ffffff' });
                });
                button.on('pointerdown', onClick);
            };

            let leavingRun = false;
            const saveThen = (callback) => {
                if (leavingRun) return;
                leavingRun = true;
                this.scene.saveRunReward().then(callback).catch(error => {
                    console.error('Could not save run rewards:', error);
                    defeatText.setText('COINS COULD NOT BE SAVED - TRY AGAIN');
                    leavingRun = false;
                });
            };

            this.scene.saveRunReward().then(() => {
                rewardText.setText(
                    this.scene.runReward > 0
                        ? `Run coins: ${this.scene.runCoins} | Saved: ${this.scene.runReward}`
                        : `Run coins: ${this.scene.runCoins} | No payout at this survival time`
                );
            }).catch(error => {
                console.error('Could not save run rewards:', error);
                rewardText.setText('COINS COULD NOT BE SAVED - choose an option to retry');
            });

            addDefeatButton('HOME', 320, () => {
                saveThen(() => this.scene.scene.start('MenuScene'));
            });

            addDefeatButton('PLAY AGAIN', 460, () => {
                saveThen(() => {
                    this.scene.physics.resume();
                    this.scene.scene.restart();
                });
            });

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
                const slotIndex = this.scene.armoryWeaponIds.indexOf(
                    weapon.type
                );
                if (slotIndex < 0) continue;

                this.storeCurrentWeaponSlot();
                const slot = this.weaponSlots[slotIndex];
                slot.weapon = {
                    type: weapon.type,
                    name: weapon.name,
                    damage: weapon.damage,
                    range: weapon.range,
                    fireRate: weapon.fireRate,
                    magazineSize: weapon.magazineSize,
                    pellets: weapon.pellets,
                    isMelee: weapon.isMelee
                };
                slot.magazineAmmo = weapon.isMelee ? 0 : weapon.magazineSize;
                slot.reserveAmmo = weapon.isMelee
                    ? 0
                    : Math.max(0, MAX_TOTAL_AMMO - slot.magazineAmmo);
                slot.reloadUntil = 0;
                slot.swordDashCharges = this.maxSwordDashCharges;
                slot.swordRechargeUntil = 0;

                if (slotIndex === this.selectedWeaponSlot) {
                    this.applyWeaponSlot(slotIndex);
                }

                weapon.destroy();
                this.scene.weapons = this.scene.weapons.filter(
                    item => item !== weapon
                );

                console.log('Picked up:', weapon.name);
                this.updateWeaponBar();
                break;
            }
        }
    }

    storeCurrentWeaponSlot() {
        const slot = this.weaponSlots[this.selectedWeaponSlot];
        if (!slot || !this.weapon) return;

        slot.weapon = this.weapon;
        slot.magazineAmmo = this.magazineAmmo;
        slot.reserveAmmo = this.reserveAmmo;
        slot.reloadUntil = this.reloadUntil;
        slot.swordDashCharges = this.swordDashCharges;
        slot.swordRechargeUntil = this.swordRechargeUntil;
    }

    applyWeaponSlot(index) {
        this.selectedWeaponSlot = index;
        const slot = this.weaponSlots[index];
        this.weapon = slot.weapon;
        this.magazineSize = this.weapon?.magazineSize || 0;
        this.magazineAmmo = slot.magazineAmmo;
        this.reserveAmmo = slot.reserveAmmo;
        this.reloadUntil = slot.reloadUntil;
        this.swordDashCharges = slot.swordDashCharges;
        this.swordRechargeUntil = slot.swordRechargeUntil;
        this.swordSwing = null;
        this.meleeSwingUntil = 0;

        if (this.heldWeapon) {
            this.heldWeapon.destroy();
            this.heldWeapon = null;
        }

        if (this.weapon) {
            this.heldWeapon = this.scene.add.image(
                this.x,
                this.y,
                `weapon-${this.weapon.type}`
            );
            this.heldWeapon.setDisplaySize(
                this.weapon.type === 'sword' ? 28 : 30,
                this.weapon.type === 'sword' ? 28 : 20
            );
            this.heldWeapon.setDepth(this.depth + 1);
        }

        this.updateWeaponBar();
    }

    selectWeaponSlot(index) {
        if (
            index < 0 ||
            index >= this.weaponSlots.length ||
            index === this.selectedWeaponSlot
        ) {
            return;
        }

        this.storeCurrentWeaponSlot();
        this.applyWeaponSlot(index);
    }

    updateWeaponBar() {
        const activeSlot = this.weaponSlots[this.selectedWeaponSlot];
        if (activeSlot && this.weapon) {
            activeSlot.weapon = this.weapon;
            activeSlot.magazineAmmo = this.magazineAmmo;
            activeSlot.reserveAmmo = this.reserveAmmo;
            activeSlot.reloadUntil = this.reloadUntil;
            activeSlot.swordDashCharges = this.swordDashCharges;
            activeSlot.swordRechargeUntil = this.swordRechargeUntil;
        }

        for (let index = 0; index < this.weaponSlots.length; index++) {
            const slot = this.weaponSlots[index];
            const isSelected = index === this.selectedWeaponSlot;
            const name = slot.weapon?.name || 'no weapon';
            const text = this.weaponListTexts[index];
            text.setText(`${index + 1}. ${name}`);
            text.setColor(isSelected ? '#55ff55' : '#ffffff');
        }
    }

    tryPickupAmmo() {
        if (!this.scene.ammoPickups) {
            return;
        }

        for (const pickup of this.scene.ammoPickups) {
            if (!pickup.active) {
                continue;
            }

            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                pickup.x,
                pickup.y
            );

            if (distance < 35) {
                this.storeCurrentWeaponSlot();
                const result = distributeAmmoPickup(
                    this.weaponSlots,
                    pickup.amount,
                    MAX_TOTAL_AMMO
                );
                if (result.ammoAdded === 0) {
                    continue;
                }

                this.weaponSlots = result.weaponSlots;
                for (const slot of this.weaponSlots) {
                    if (
                        slot.weapon &&
                        !slot.weapon.isMelee &&
                        slot.magazineAmmo === 0 &&
                        slot.reserveAmmo > 0 &&
                        slot.reloadUntil === 0
                    ) {
                        slot.reloadUntil = this.scene.time.now + this.reloadDelay;
                    }
                }

                const activeSlot = this.weaponSlots[this.selectedWeaponSlot];
                this.magazineAmmo = activeSlot.magazineAmmo;
                this.reserveAmmo = activeSlot.reserveAmmo;
                this.reloadUntil = activeSlot.reloadUntil;
                this.updateWeaponBar();

                pickup.destroy();
                this.scene.ammoPickups = this.scene.ammoPickups.filter(
                    item => item !== pickup
                );
            }
        }
    }

    tryPickupSpecial() {
        if (!this.scene.specialPickups) {
            return;
        }

        for (const pickup of this.scene.specialPickups) {
            if (!pickup.active) {
                continue;
            }

            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                pickup.x,
                pickup.y
            );

            if (distance < 35) {
                const { effect, amount, duration } = pickup.item;
                if (effect === 'heal') {
                    if (this.health >= this.maxHealth) continue;
                    this.health = Math.min(this.maxHealth, this.health + amount);
                } else if (effect === 'armour') {
                    if (this.armour >= amount) continue;
                    this.armour = amount;
                } else if (effect === 'speed') {
                    this.speedBoostUntil = this.scene.time.now + duration;
                }

                if (effect === 'heal') {
                    this.healthBar.width =
                        170 * (this.health / this.maxHealth);
                }

                pickup.destroy();
                this.scene.specialPickups = this.scene.specialPickups.filter(
                    item => item !== pickup
                );
            }
        }
    }

    getMovementSpeed() {
        return this.scene.time.now < this.speedBoostUntil
            ? this.speed * 1.2
            : this.speed;
    }

    tryPickupCoin() {
        if (!this.scene.coinPickups) {
            return;
        }

        for (const pickup of this.scene.coinPickups) {
            if (!pickup.active) {
                continue;
            }

            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                pickup.x,
                pickup.y
            );

            if (distance < 35) {
                this.scene.addCoins(pickup.amount);
                pickup.destroy();
                this.scene.coinPickups = this.scene.coinPickups.filter(
                    item => item !== pickup
                );
            }
        }
    }

    tryPickupGrenade() {
        if (!this.scene.grenadePickups || this.grenades >= this.maxGrenades) {
            return;
        }

        for (const pickup of this.scene.grenadePickups) {
            if (!pickup.active) {
                continue;
            }

            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                pickup.x,
                pickup.y
            );

            if (distance < 35) {
                this.grenades = Math.min(
                    this.maxGrenades,
                    this.grenades + pickup.amount
                );

                pickup.destroy();
                this.scene.grenadePickups = this.scene.grenadePickups.filter(
                    item => item !== pickup
                );
            }
        }
    }

    explodeGrenade(x, y) {
        const blastRadius = 120;
        const blastGlow = this.scene.add.circle(x, y, 12, 0xffa500, 0.6);

        this.scene.tweens.add({
            targets: blastGlow,
            radius: blastRadius,
            alpha: 0,
            duration: 350,
            ease: 'Quad.easeOut',
            onComplete: () => blastGlow.destroy()
        });

        this.soundEffects?.playExplosion();

        for (const zombie of [...this.scene.zombies]) {
            const distance = Phaser.Math.Distance.Between(
                x,
                y,
                zombie.x,
                zombie.y
            );

            if (distance <= blastRadius) {
                const damage = 100 - (distance / blastRadius) * 70;
                zombie.takeDamage(
                    Math.max(20, damage) * this.damageMultiplier
                );
            }
        }
    }

    throwGrenade() {
        if (this.grenades <= 0) {
            return;
        }

        this.grenades -= 1;

        const pointer = this.scene.input.activePointer;
        const worldPoint = this.scene.cameras.main.getWorldPoint(
            pointer.x,
            pointer.y
        );

        const grenadeMarker = this.scene.add.circle(
            worldPoint.x,
            worldPoint.y,
            10,
            0xff8c00,
            0.8
        );

        grenadeMarker.setDepth(18);

        this.scene.time.delayedCall(500, () => {
            this.explodeGrenade(worldPoint.x, worldPoint.y);
            grenadeMarker.destroy();
        });
    }

    performSwordDash() {
        const now = this.scene.time.now;

        if (this.swordSwing) {
            return;
        }

        if (this.swordDashCharges <= 0) {
            if (this.swordRechargeUntil !== 0 && now >= this.swordRechargeUntil) {
                this.swordDashCharges = this.maxSwordDashCharges;
                this.swordRechargeUntil = 0;
            }
            return;
        }

        if (this.weapon?.type !== 'sword') {
            return;
        }

        this.swordDashCharges -= 1;
        this.swordSwing = {
            angle: this.facingAngle,
            startedAt: now,
            projectileFired: false
        };

        if (this.swordDashCharges <= 0) {
            this.swordRechargeUntil = now + 5000;
        }
    }

    performMeleeAttack(now) {
        if (now < this.lastShotTime + this.weapon.fireRate) {
            return;
        }

        this.lastShotTime = now;
        this.meleeSwingUntil = now + 180;
        this.meleeSwingAngle = this.facingAngle;

        for (const zombie of [...this.scene.zombies]) {
            if (!zombie.active) continue;

            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                zombie.x,
                zombie.y
            );
            const angleToZombie = Phaser.Math.Angle.Between(
                this.x,
                this.y,
                zombie.x,
                zombie.y
            );
            const angleDifference = Math.abs(
                Phaser.Math.Angle.Wrap(angleToZombie - this.facingAngle)
            );

            if (distance <= this.weapon.range && angleDifference <= Math.PI / 3) {
                zombie.takeDamage(
                    this.weapon.damage * this.damageMultiplier
                );
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

        const now = this.scene.time.now;
        if (this.weapon.isMelee) {
            this.performMeleeAttack(now);
            return;
        }

        if (this.weapon.type === 'sword') {
            this.performSwordDash();
            return;
        }

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

        if (this.magazineAmmo <= 0) {
            if (this.reserveAmmo > 0 && this.reloadUntil === 0) {
                this.reloadUntil = now + this.reloadDelay;
            }

            return;
        }

        this.lastShotTime = now;
        this.magazineAmmo -= 1;

        if (this.magazineAmmo === 0 && this.reserveAmmo > 0) {
            this.reloadUntil = now + this.reloadDelay;
        }

        const angle = this.facingAngle;

        if (!this.scene.projectiles) {
            this.scene.projectiles = [];
        }

        for (let pellet = 0; pellet < this.weapon.pellets; pellet++) {
            const spread = this.weapon.pellets > 1
                ? (pellet / (this.weapon.pellets - 1) - 0.5) * 0.32
                : 0;
            this.scene.projectiles.push(new Projectile(
                this.scene,
                this.x,
                this.y,
                angle + spread,
                this.weapon.damage * this.damageMultiplier,
                this.weapon.range
            ));
        }
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

        if (this.heldWeapon && this.heldWeapon.active) {
            if (this.swordSwing) {
                const elapsed = this.scene.time.now - this.swordSwing.startedAt;
                const spinDuration = 280;

                if (elapsed < spinDuration) {
                    const spinAngle = this.swordSwing.angle +
                        (elapsed / spinDuration) * Math.PI * 3;
                    this.heldWeapon.setPosition(
                        this.x + Math.cos(spinAngle) * 32,
                        this.y + Math.sin(spinAngle) * 32
                    );
                    this.heldWeapon.setRotation(spinAngle + Math.PI / 2);
                } else {
                    this.heldWeapon.setPosition(
                        this.x + Math.cos(this.swordSwing.angle) * 38,
                        this.y + Math.sin(this.swordSwing.angle) * 38
                    );
                    this.heldWeapon.setRotation(this.swordSwing.angle + Math.PI / 2);

                    if (!this.swordSwing.projectileFired) {
                        const strikeX = this.x + Math.cos(this.swordSwing.angle) * 38;
                        const strikeY = this.y + Math.sin(this.swordSwing.angle) * 38;
                        const energyBall = new Projectile(
                            this.scene,
                            strikeX,
                            strikeY,
                            this.swordSwing.angle,
                            this.weapon.damage * this.damageMultiplier,
                            420,
                            {
                                type: 'energy',
                                size: 36,
                                speed: 460,
                                hitRadius: 20,
                                splashRadius: 100
                            }
                        );

                        this.scene.projectiles.push(energyBall);
                        this.swordSwing.projectileFired = true;
                    }
                }

                if (elapsed >= 420) {
                    this.swordSwing = null;
                }
            } else if (this.weapon?.isMelee && this.scene.time.now < this.meleeSwingUntil) {
                    this.heldWeapon.setPosition(
                        this.x + Math.cos(this.meleeSwingAngle) * 25,
                        this.y + Math.sin(this.meleeSwingAngle) * 25
                    );
                    this.heldWeapon.setRotation(
                        this.meleeSwingAngle + Math.PI / 2
                    );
            } else {
                this.heldWeapon.setPosition(
                    this.x + Math.cos(angle) * 13,
                    this.y + Math.sin(angle) * 13
                );
                this.heldWeapon.setRotation(angle);
            }

            this.heldWeapon.setDepth(this.depth + 1);
        }

        let velocityX = 0;
        let velocityY = 0;

        const moveForward =
            this.cursors.up.isDown ||
            this.keys.W.isDown;

        if (moveForward) {
            const dx = worldPoint.x - this.x;
            const dy = worldPoint.y - this.y;
            const length = Math.hypot(dx, dy) || 1;

            const movementSpeed = this.getMovementSpeed();
            velocityX = (dx / length) * movementSpeed;
            velocityY = (dy / length) * movementSpeed;

        } else {
            if (
                this.cursors.left.isDown ||
                this.keys.A.isDown
            ) {

                velocityX = -this.getMovementSpeed();

            } else if (
                this.cursors.right.isDown ||
                this.keys.D.isDown
            ) {

                velocityX = this.getMovementSpeed();
            }

            if (
                this.cursors.down.isDown ||
                this.keys.S.isDown
            ) {

                velocityY = this.getMovementSpeed();
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
                .scale(this.getMovementSpeed());
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
            hudY + 30
        );

        this.healthBar.setPosition(
            hudX,
            hudY + 30
        );

        if (
            this.weapon &&
            this.magazineAmmo === 0 &&
            this.reserveAmmo > 0 &&
            this.reloadUntil > 0 &&
            this.scene.time.now >= this.reloadUntil
        ) {
            const roundsToLoad = Math.min(
                this.magazineSize,
                this.reserveAmmo
            );

            this.magazineAmmo = roundsToLoad;
            this.reserveAmmo -= roundsToLoad;
            this.reloadUntil = 0;
        }

        this.ammoText.setText(
            this.weapon?.isMelee
                ? 'MELEE'
                : this.weapon
                    ? String(this.magazineAmmo + this.reserveAmmo)
                    : '--'
        );
        this.grenadeText.setText(`G: ${this.grenades}`);
        for (let index = 0; index < this.weaponListTexts.length; index++) {
            this.weaponListTexts[index].setPosition(
                hudX,
                hudY + 56 + index * 20
            );
        }
        const view = this.scene.cameras.main.worldView;
        const rightHudX = view.right - 20;
        this.ammoText.setPosition(rightHudX, hudY + 30);
        this.grenadeText.setPosition(rightHudX, hudY + 56);
        this.updateWeaponBar();

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
        this.tryPickupAmmo();
        this.tryPickupSpecial();
        this.tryPickupCoin();
        this.tryPickupGrenade();

        // =========================
        // GRENADE / PUNCH
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

            if (this.grenades > 0) {
                this.throwGrenade();
                return;
            }

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

                    zombie.takeDamage(20 * this.damageMultiplier);
                }
            }
        }

        // =========================
        // SHOOT
        // =========================

        for (let index = 0; index < this.weaponSlotKeys.length; index++) {
            if (Phaser.Input.Keyboard.JustDown(this.weaponSlotKeys[index])) {
                this.selectWeaponSlot(index);
            }
        }

        const isFirearm =
            this.weapon &&
            !this.weapon.isMelee &&
            this.weapon.type !== 'sword';
        if (
            pointer.leftButtonDown() &&
            (pointer.justDown || isFirearm)
        ) {
            this.shoot();
        }
    }
}