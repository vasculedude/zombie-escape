import Phaser from 'phaser';
import House from '../entities/House.js';
import Tree from '../entities/Tree.js';
import Player from '../entities/Player.js';
import Zombie from '../entities/Zombie.js';
import EasyStar from 'easystarjs';
import Weapon from '../entities/Weapon.js';
import AmmoPickup from '../entities/AmmoPickup.js';
import SurvivalItemPickup from '../entities/SurvivalItemPickup.js';
import CoinPickup from '../entities/CoinPickup.js';
import GrenadePickup from '../entities/GrenadePickup.js';
import createSoundEffects from '../utils/soundEffects.js';
import { getSurvivalCoinReward } from '../utils/coinRewards.js';
import {
    getSpawnableWeaponIds,
    getWeaponById
} from '../utils/weaponCatalog.js';
import { socket } from '../network/socket.js';
import {
    getMaxWeaponSelections,
    getSpawnableSurvivalItemIds
} from '../utils/survivalItemCatalog.js';
import {
    getAmmoPickupCount,
    getAmmoSpawnInterval,
    getCharacterById,
    getHealthSpawnInterval,
    getItemSpawnInterval,
    getWeaponDropCount
} from '../utils/characterCatalog.js';

function createSeededRandom(seed) {
    let value = seed;
    return () => {
        value = (value * 48271) % 2147483647;
        return value / 2147483647;
    };
}

export default class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    create() {
        this.isMultiplayer = this.registry.get('gameMode') === 'multiplayer';
        const mapRandom = this.isMultiplayer
            ? createSeededRandom(8675309)
            : Math.random;
        const mapBetween = (min, max) =>
            Math.floor(mapRandom() * (max - min + 1) + min);
        this.mapBetween = this.isMultiplayer ? mapBetween : Phaser.Math.Between;

        this.soundEffects = createSoundEffects();
        this.input.on('pointerdown', () => {
            this.soundEffects.unlock();
        });
        this.input.keyboard.on('keydown', () => {
            this.soundEffects.unlock();
        });

        // =========================
        // BACKGROUND
        // =========================

        this.cameras.main.setBackgroundColor('#202020');

        // =========================
        // PLAYER
        // =========================

        this.character = getCharacterById(
            this.registry.get('selectedCharacter')
        );
        const availableWeaponIds = getSpawnableWeaponIds(
            this.registry.get('ownedWeapons')
        );
        const selectedWeaponIds = getSpawnableWeaponIds(
            this.registry.get('ownedWeapons'),
            this.registry.get('spawnWeapons')
        );
        const maxWeaponSelections = getMaxWeaponSelections(
            this.registry.get('ownedSpecials')
        );
        this.armoryWeaponIds = selectedWeaponIds.length === maxWeaponSelections
            ? selectedWeaponIds
            : availableWeaponIds.slice(0, maxWeaponSelections);
        this.armorySpecialIds = getSpawnableSurvivalItemIds(
            this.registry.get('ownedSpecials'),
            this.registry.get('spawnSpecials')
        );

        this.player = new Player(
            this,
            400,
            300
        );
        if (this.isMultiplayer) {
            this.add.text(400, 24, 'Q: swap with a nearby weapon or drop current weapon', {
                fontSize: '13px',
                color: '#ffffff',
                backgroundColor: '#111111',
                padding: { x: 8, y: 5 }
            }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200002);
        }

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

        this.runCoins = 0;
        this.coins = this.registry.get('coins') || 0;
        this.survivalSeconds = 0;
        this.runStartedAt = performance.now();
        this.runEnded = false;
        this.runReward = null;
        this.runRewardSaved = 0;
        this.runSavePromise = null;

        this.scoreText = this.add.text(
            this.cameras.main.width /
                this.cameras.main.zoom - 20,
            20,
            'Time survived: 0:00',
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
                this.mapBetween(
                    50,
                    1200
                );

            const y =
                this.mapBetween(
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

const weaponTypes = this.armoryWeaponIds;
const weaponDropCount = getWeaponDropCount(22, this.character);

if (!this.isMultiplayer) {
for (let i = 0; i < weaponDropCount && weaponTypes.length > 0; i++) {

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
}

this.ammoPickups = [];
this.maxAmmoPickups = getAmmoPickupCount(20, this.character);

if (!this.isMultiplayer) {
    for (let i = 0; i < this.maxAmmoPickups; i++) {
        this.spawnAmmoNearPlayer();
    }

this.time.addEvent({
    delay: getAmmoSpawnInterval(15000, this.character),
    callback: () => {
        if (this.ammoPickups.length < this.maxAmmoPickups) {
            this.spawnAmmoNearPlayer();
        }
    },
    loop: true
});
}

this.specialPickups = [];

if (!this.isMultiplayer) {
this.time.addEvent({
    delay: getHealthSpawnInterval(60000, this.character),
    callback: () => {
        if (this.armorySpecialIds.length > 0) {
            this.spawnSpecialNearPlayer();
            this.spawnSpecialNearPlayer();
        }
    },
    loop: true
});
}

this.grenadePickups = [];

if (!this.isMultiplayer) {
this.time.addEvent({
    delay: getItemSpawnInterval(45000, this.character),
    callback: () => {
        this.spawnGrenadeNearPlayer();
    },
    loop: true
});
}

this.coinPickups = [];

if (!this.isMultiplayer) {
this.time.addEvent({
    delay: getItemSpawnInterval(60000, this.character),
    callback: () => {
        this.spawnCoinNearPlayer();
        this.spawnCoinNearPlayer();
    },
    loop: true
});
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
        this.zombieSpawnRadius = 500;
        this.nextRegularZombieSpawnAt = 10;
        this.nextArmouredSpawnAt = 60;
        this.nextTankSpawnAt = 181;
        this.nextBossSpawnAt = 302;

        if (this.isMultiplayer) {
            this.connectToSharedGame();
        } else {
            for (let i = 0; i < 5; i++) {
                this.spawnZombieNearPlayer();
            }
        }

    }

    connectToSharedGame() {
        this.networkReady = false;
        this.networkPendingPickups = new Set();
        this.remotePlayers = new Map();
        this.networkStatus = this.add.text(400, 270, 'Connecting to the shared server...', {
            fontSize: '22px',
            color: '#ffffff',
            backgroundColor: '#111111',
            padding: { x: 16, y: 12 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300000);

        const token = this.registry.get('authToken');
        if (!token) {
            this.showNetworkError('Log in before joining multiplayer.');
            return;
        }

        this.socketHandlers = {
            connect: () => {
                socket.emit('session:join', result => {
                    if (!result?.success || !result.state) {
                        this.showNetworkError(result?.message || 'Could not join the shared server.');
                        return;
                    }

                    this.networkReady = true;
                    this.networkStatus.destroy();
                    this.networkExitButton?.destroy();
                    this.syncNetworkState(result.state, true);
                });
            },
            connectError: error => {
                this.showNetworkError(error.message || 'Could not connect to multiplayer.');
            },
            worldState: state => this.syncNetworkState(state),
            worldPickup: pickup => {
                this.player.applyNetworkPickup(pickup);
                this.removeNetworkPickup(pickup.id);
            },
            worldWeaponSwap: result => {
                this.player.dropNetworkWeapon(result.droppedWeaponId);
                if (result.pickup) {
                    this.removeNetworkPickup(result.pickup.id);
                    this.player.applyNetworkPickup(result.pickup, true);
                }
            },
            worldDamage: damage => {
                this.player.takeDamage(damage.amount);
                if (Number.isFinite(damage.health)) {
                    this.player.health = damage.health;
                }
                if (Number.isFinite(damage.armour)) {
                    this.player.armour = damage.armour;
                }
                this.player.healthBar.width =
                    170 * (this.player.health / this.player.maxHealth);
            },
            worldReward: reward => this.addCoins(reward.coins),
            combatShot: shot => this.showNetworkShot(shot),
            combatExplosion: explosion => this.showNetworkExplosion(explosion)
        };

        socket.on('connect', this.socketHandlers.connect);
        socket.on('connect_error', this.socketHandlers.connectError);
        socket.on('world:state', this.socketHandlers.worldState);
        socket.on('world:pickup', this.socketHandlers.worldPickup);
        socket.on('world:weaponSwap', this.socketHandlers.worldWeaponSwap);
        socket.on('world:damage', this.socketHandlers.worldDamage);
        socket.on('world:reward', this.socketHandlers.worldReward);
        socket.on('combat:shot', this.socketHandlers.combatShot);
        socket.on('combat:explosion', this.socketHandlers.combatExplosion);
        this.events.once('shutdown', this.disconnectFromSharedGame, this);

        socket.auth = { token };
        if (socket.connected) {
            this.socketHandlers.connect();
        } else {
            socket.connect();
        }
    }

    showNetworkError(message) {
        this.networkReady = false;
        if (this.networkStatus?.active) {
            this.networkStatus.setText(`${message}\n\nReturn to the menu and try again.`);
        }
        if (!this.networkExitButton?.active) {
            this.networkExitButton = this.add.text(400, 355, 'RETURN TO MENU', {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 16, y: 9 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(300001)
                .setInteractive({ useHandCursor: true });
            this.networkExitButton.on('pointerdown', () => {
                this.disconnectFromSharedGame();
                this.registry.set('gameMode', 'singleplayer');
                this.scene.start('MenuScene');
            });
        }
    }

    disconnectFromSharedGame() {
        if (this.socketHandlers) {
            socket.off('connect', this.socketHandlers.connect);
            socket.off('connect_error', this.socketHandlers.connectError);
            socket.off('world:state', this.socketHandlers.worldState);
            socket.off('world:pickup', this.socketHandlers.worldPickup);
            socket.off('world:weaponSwap', this.socketHandlers.worldWeaponSwap);
            socket.off('world:damage', this.socketHandlers.worldDamage);
            socket.off('world:reward', this.socketHandlers.worldReward);
            socket.off('combat:shot', this.socketHandlers.combatShot);
            socket.off('combat:explosion', this.socketHandlers.combatExplosion);
            this.socketHandlers = null;
        }
        if (socket.connected) socket.disconnect();
    }

    syncNetworkState(state, initial = false) {
        if (!state || !Array.isArray(state.players)) return;
        this.networkElapsedSeconds = state.elapsedSeconds || 0;
        if (initial) {
            const ownPlayer = state.players.find(player => player.id === socket.id);
            if (ownPlayer) {
                this.player.setPosition(ownPlayer.x, ownPlayer.y);
            }
        }
        const ownPlayer = state.players.find(player => player.id === socket.id);
        if (ownPlayer) {
            this.player.health = ownPlayer.health;
            this.player.armour = ownPlayer.armour;
            this.player.grenades = ownPlayer.grenades;
            this.player.healthBar.width =
                170 * (this.player.health / this.player.maxHealth);
        }

        this.syncRemotePlayers(state.players);
        this.zombies = this.syncNetworkEntities(
            this.zombies,
            state.zombies || [],
            zombie => {
                const entity = new Zombie(
                    this,
                    zombie.x,
                    zombie.y,
                    zombie.type,
                    { networkReplica: true }
                );
                entity.body.setEnable(false);
                return entity;
            },
            (entity, zombie) => {
                entity.setPosition(zombie.x, zombie.y);
                entity.health = zombie.health;
                entity.healthBar.width = 46 * (zombie.health / zombie.maxHealth);
                entity.healthBarBg.setPosition(
                    zombie.x,
                    zombie.y - entity.healthBarOffset
                );
                entity.healthBar.setPosition(
                    zombie.x,
                    zombie.y - entity.healthBarOffset
                );
            }
        );
        this.weapons = this.syncNetworkEntities(
            this.weapons,
            (state.pickups || []).filter(pickup => pickup.kind === 'weapon'),
            pickup => new Weapon(this, pickup.x, pickup.y, pickup.type),
            (entity, pickup) => {
                entity.setPosition(pickup.x, pickup.y);
                entity.networkPickup = pickup;
            }
        );
        this.ammoPickups = this.syncNetworkEntities(
            this.ammoPickups,
            (state.pickups || []).filter(pickup => pickup.kind === 'ammo'),
            pickup => new AmmoPickup(this, pickup.x, pickup.y),
            (entity, pickup) => {
                entity.setPosition(pickup.x, pickup.y);
                entity.networkPickup = pickup;
            }
        );
        this.specialPickups = this.syncNetworkEntities(
            this.specialPickups,
            (state.pickups || []).filter(pickup => pickup.kind === 'special'),
            pickup => new SurvivalItemPickup(this, pickup.x, pickup.y, pickup.type),
            (entity, pickup) => {
                entity.setPosition(pickup.x, pickup.y);
                entity.networkPickup = pickup;
            }
        );
        this.grenadePickups = this.syncNetworkEntities(
            this.grenadePickups,
            (state.pickups || []).filter(pickup => pickup.kind === 'grenade'),
            pickup => new GrenadePickup(this, pickup.x, pickup.y),
            (entity, pickup) => {
                entity.setPosition(pickup.x, pickup.y);
                entity.networkPickup = pickup;
            }
        );
        this.coinPickups = this.syncNetworkEntities(
            this.coinPickups,
            (state.pickups || []).filter(pickup => pickup.kind === 'coin'),
            pickup => new CoinPickup(this, pickup.x, pickup.y, pickup.amount),
            (entity, pickup) => {
                entity.setPosition(pickup.x, pickup.y);
                entity.networkPickup = pickup;
            }
        );
    }

    syncNetworkEntities(current, snapshots, createEntity, updateEntity) {
        const existing = new Map(current.map(entity => [entity.networkId, entity]));
        const next = snapshots.map(snapshot => {
            let entity = existing.get(snapshot.id);
            if (entity) {
                existing.delete(snapshot.id);
            } else {
                entity = createEntity(snapshot);
                entity.networkId = snapshot.id;
            }
            updateEntity(entity, snapshot);
            return entity;
        });
        for (const entity of existing.values()) {
            entity.destroy();
        }
        return next;
    }

    syncRemotePlayers(players) {
        const existingIds = new Set(this.remotePlayers.keys());
        for (const player of players) {
            if (player.id === socket.id) continue;

            existingIds.delete(player.id);
            let remote = this.remotePlayers.get(player.id);
            if (!remote) {
                remote = {
                    sprite: this.add.image(
                        player.x,
                        player.y,
                        Player.createSpriteTexture(this, player.characterId)
                    ).setDisplaySize(42, 42).setDepth(15),
                    heldWeapon: null,
                    name: this.add.text(player.x, player.y - 32, player.name, {
                        fontSize: '12px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setOrigin(0.5).setDepth(200000)
                };
                this.remotePlayers.set(player.id, remote);
            }

            remote.sprite.setPosition(player.x, player.y);
            remote.sprite.setRotation(player.angle + Math.PI / 2);
            remote.name.setPosition(player.x, player.y - 32);
            if (player.weaponId) {
                const texture = Weapon.createTexture(this, player.weaponId);
                if (!remote.heldWeapon || remote.heldWeapon.texture.key !== texture) {
                    remote.heldWeapon?.destroy();
                    remote.heldWeapon = this.add.image(player.x, player.y, texture)
                        .setDisplaySize(30, 20)
                        .setDepth(16);
                }
                remote.heldWeapon.setPosition(
                    player.x + Math.cos(player.angle) * 13,
                    player.y + Math.sin(player.angle) * 13
                );
                remote.heldWeapon.setRotation(player.angle);
            } else if (remote.heldWeapon) {
                remote.heldWeapon.destroy();
                remote.heldWeapon = null;
            }
        }

        for (const id of existingIds) {
            const remote = this.remotePlayers.get(id);
            remote.sprite.destroy();
            remote.heldWeapon?.destroy();
            remote.name.destroy();
            this.remotePlayers.delete(id);
        }
    }

    requestNearbyPickups() {
        if (!this.networkReady) return;
        const groups = [
            this.weapons,
            this.ammoPickups,
            this.specialPickups,
            this.grenadePickups,
            this.coinPickups
        ];
        for (const group of groups) {
            for (const pickup of group) {
                if (
                    !pickup.active ||
                    !pickup.networkId ||
                    this.networkPendingPickups.has(pickup.networkId) ||
                    !this.player.canApplyNetworkPickup(pickup.networkPickup) ||
                    Phaser.Math.Distance.Between(
                        this.player.x,
                        this.player.y,
                        pickup.x,
                        pickup.y
                    ) >= 35
                ) {
                    continue;
                }

                const pickupId = pickup.networkId;
                this.networkPendingPickups.add(pickupId);
                socket.emit('world:collect', pickupId, result => {
                    if (!result?.success) this.networkPendingPickups.delete(pickupId);
                });
            }
        }
    }

    removeNetworkPickup(pickupId) {
        for (const groupName of [
            'weapons',
            'ammoPickups',
            'specialPickups',
            'grenadePickups',
            'coinPickups'
        ]) {
            const group = this[groupName];
            const pickup = group.find(entity => entity.networkId === pickupId);
            if (!pickup) continue;
            pickup.destroy();
            this[groupName] = group.filter(entity => entity !== pickup);
            break;
        }
        this.networkPendingPickups.delete(pickupId);
    }

    findNearbyNetworkWeapon() {
        return this.weapons
            .filter(weapon =>
                weapon.active &&
                weapon.networkId &&
                Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    weapon.x,
                    weapon.y
                ) < 35
            )
            .sort((first, second) =>
                Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    first.x,
                    first.y
                ) - Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    second.x,
                    second.y
                )
            )[0];
    }

    swapNetworkWeapon(weaponId, pickupId) {
        if (!this.networkReady || !weaponId) return;
        socket.emit('world:swapWeapon', { weaponId, pickupId });
    }

    syncLocalPlayer() {
        if (!this.networkReady) return;
        const now = this.time.now;
        if (now < this.nextPlayerSyncAt) return;
        this.nextPlayerSyncAt = now + 50;
        socket.emit('player:state', {
            x: this.player.x,
            y: this.player.y,
            angle: this.player.facingAngle,
            weaponId: this.player.weapon?.type || null
        });
    }

    sendCombatAttack(kind) {
        if (!this.networkReady) return;
        socket.emit('combat:attack', {
            kind,
            angle: this.player.facingAngle,
            weaponId: this.player.weapon?.type
        });
    }

    sendGrenadeAttack(x, y) {
        if (!this.networkReady) return;
        socket.emit('combat:grenade', { x, y });
    }

    showNetworkShot(shot) {
        if (shot.playerId === socket.id) return;
        const weapon = getWeaponById(shot.weaponId);
        if (!weapon) return;
        if (weapon.category === 'Melee') {
            const slash = this.add.graphics().setDepth(30);
            slash.lineStyle(5, 0xe7d9b6, 0.9);
            slash.lineBetween(
                shot.x,
                shot.y,
                shot.x + Math.cos(shot.angle) * weapon.range,
                shot.y + Math.sin(shot.angle) * weapon.range
            );
            this.time.delayedCall(120, () => slash.destroy());
            return;
        }
        const projectile = new Projectile(
            this,
            shot.x,
            shot.y,
            shot.angle,
            0,
            weapon.id === 'sword' ? 420 : weapon.range,
            weapon.id === 'sword'
                ? { type: 'energy', size: 36, speed: 460, splashRadius: 100 }
                : {}
        );
        this.projectiles.push(projectile);
    }

    showNetworkExplosion(explosion) {
        const glow = this.add.circle(explosion.x, explosion.y, 12, 0xffa500, 0.6)
            .setDepth(30);
        this.tweens.add({
            targets: glow,
            radius: 120,
            alpha: 0,
            duration: 350,
            ease: 'Quad.easeOut',
            onComplete: () => glow.destroy()
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

    spawnSpecialNearPlayer() {
        if (this.armorySpecialIds.length === 0) return;

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

        const itemId = Phaser.Utils.Array.GetRandom(this.armorySpecialIds);
        const pickup = new SurvivalItemPickup(this, x, y, itemId);
        this.specialPickups.push(pickup);
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

    spawnGrenadeNearPlayer() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(180, 900);
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

        const pickup = new GrenadePickup(this, x, y);
        this.grenadePickups.push(pickup);
    }

    addCoins(amount) {
        if (this.runEnded) return;

        if (!Number.isInteger(amount) || amount < 1) {
            console.error('Could not add invalid run coin amount:', amount);
            return;
        }

        this.runCoins += amount;
    }

    endRun() {
        if (this.runEnded) return;

        this.runEnded = true;
        this.survivalSeconds = Math.floor(
            (performance.now() - this.runStartedAt) / 1000
        );
        this.scoreText.setText(
            `Time survived: ${this.formatSurvivalTime(this.survivalSeconds)}`
        );
        this.runReward = getSurvivalCoinReward(
            this.runCoins,
            this.survivalSeconds
        );
    }

    formatSurvivalTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    async saveRunReward() {
        if (!this.runEnded) this.endRun();
        if (this.runReward === 0) return;
        if (this.runSavePromise) return this.runSavePromise;

        this.runSavePromise = this.persistRunReward().catch(error => {
            this.runSavePromise = null;
            throw error;
        });
        return this.runSavePromise;
    }

    async persistRunReward() {
        const token = this.registry.get('authToken');
        if (!token) throw new Error('You must be logged in to save run coins.');

        const SERVER_URL = import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';

        while (this.runRewardSaved < this.runReward) {
            const amount = Math.min(100, this.runReward - this.runRewardSaved);
            const response = await fetch(`${SERVER_URL}/coins/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Could not save run coins.');
            }

            this.coins = result.coins;
            this.registry.set('coins', this.coins);
            this.runRewardSaved += amount;
        }
    }

    spawnZombieNearPlayer(type) {

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

        this.spawnZombie(x, y, type);
    }

    spawnZombie(x, y, type) {

        const zombie = new Zombie(
            this,
            x,
            y,
            type || Phaser.Utils.Array.GetRandom(['normal', 'runner'])
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
    if (this.isMultiplayer && !this.networkReady) return;

    let spawnedTimedZombie = false;

    if (!this.isMultiplayer && !this.runEnded) {
        const elapsedSeconds = Math.floor(
            (performance.now() - this.runStartedAt) / 1000
        );
        if (elapsedSeconds !== this.survivalSeconds) {
            this.survivalSeconds = elapsedSeconds;
            this.scoreText.setText(
                `Time survived: ${this.formatSurvivalTime(elapsedSeconds)}`
            );
        }

        if (elapsedSeconds >= this.nextArmouredSpawnAt) {
            this.spawnZombieNearPlayer('armoured');
            this.nextArmouredSpawnAt += 60;
            spawnedTimedZombie = true;
        }

        if (elapsedSeconds >= this.nextTankSpawnAt) {
            this.spawnZombieNearPlayer('tank');
            this.nextTankSpawnAt += 180;
            spawnedTimedZombie = true;
        }

        if (elapsedSeconds >= this.nextBossSpawnAt) {
            this.spawnZombieNearPlayer('boss');
            this.nextBossSpawnAt += 300;
            spawnedTimedZombie = true;
        }

        if (elapsedSeconds >= this.nextRegularZombieSpawnAt) {
            if (!spawnedTimedZombie) {
                this.spawnZombieNearPlayer();
            }
            this.nextRegularZombieSpawnAt = elapsedSeconds + 10;
        }
    }
    if (this.isMultiplayer && this.networkElapsedSeconds !== undefined) {
        this.survivalSeconds = this.networkElapsedSeconds;
        this.scoreText.setText(
            `Time survived: ${this.formatSurvivalTime(this.survivalSeconds)}`
        );
    }

    this.scoreText.setPosition(
        this.cameras.main.worldView.right - 20,
        this.cameras.main.worldView.top + 20
    );
    this.player.update();
    if (this.isMultiplayer) {
        this.syncLocalPlayer();
        this.requestNearbyPickups();
    }

    for (const zombie of [...this.zombies]) {

        if (zombie.active && !this.isMultiplayer) {
            zombie.update();
        }
    }

    for (const projectile of [...this.projectiles]) {

        if (projectile.active && projectile.body) {
            projectile.update();

            if (!projectile.active || !projectile.body) {
                continue;
            }
            if (this.isMultiplayer) continue;

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
                if (projectile.splashRadius > 0) {
                    this.damageZombiesAround(projectile);
                }
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

                if (distance < projectile.hitRadius) {
                    if (projectile.splashRadius > 0) {
                        this.damageZombiesAround(projectile);
                    } else {
                        zombie.takeDamage(projectile.damage);
                    }

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

damageZombiesAround(projectile) {
    for (const zombie of [...this.zombies]) {
    if (!zombie.active) {
        continue;
    }

    const distance = Phaser.Math.Distance.Between(
        projectile.x,
        projectile.y,
        zombie.x,
        zombie.y
    );

    if (distance <= projectile.splashRadius) {
        const damageScale = 1 - 0.5 * (distance / projectile.splashRadius);
        zombie.takeDamage(projectile.damage * damageScale);
    }
    }
}
}