import { randomUUID } from 'crypto';
import {
    getSpawnableWeaponIds,
    STARTER_WEAPON_CATALOG,
    WEAPON_CATALOG,
    getWeaponById
} from './weaponCatalog.js';
import {
    DEFAULT_CHARACTER_ID,
    getCharacterById
} from '../src/utils/characterCatalog.js';
import { SURVIVAL_ITEM_CATALOG } from '../src/utils/survivalItemCatalog.js';
import { ZOMBIE_TYPES } from '../src/utils/zombieTypes.js';

const WORLD_SIZE = 3000;
const PICKUP_RADIUS = 50;
const WEAPON_IDS = [
    ...STARTER_WEAPON_CATALOG,
    ...WEAPON_CATALOG
].map(weapon => weapon.id);
const SPAWNABLE_SPECIAL_IDS = SURVIVAL_ITEM_CATALOG
    .filter(item => item.effect !== 'backpack')
    .map(item => item.id);

export function registerMultiplayer(io, pool) {
    const players = new Map();
    const zombies = new Map();
    const pickups = new Map();
    let worldStartedAt = 0;
    let nextZombieAt = 10;
    let nextArmouredAt = 60;
    let nextTankAt = 181;
    let nextBossAt = 302;
    let nextAmmoAt = 15;
    let nextSpecialAt = 60;
    let nextGrenadeAt = 45;
    let nextCoinAt = 60;
    let lastTickAt = Date.now();

    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (typeof token !== 'string' || token.length === 0) {
            return next(new Error('Please log in to play multiplayer.'));
        }

        try {
            const result = await pool.query(
                `SELECT username, username_key, selected_character,
                        owned_weapons, spawn_weapons, owned_specials, spawn_specials
                 FROM users
                 WHERE session_token = $1`,
                [token]
            );
            if (result.rows.length === 0) {
                return next(new Error('Your session expired. Please log in again.'));
            }

            socket.data.user = result.rows[0];
            return next();
        } catch (error) {
            console.error('Multiplayer authentication failed:', error);
            return next(new Error('Could not authenticate multiplayer connection.'));
        }
    });

    function randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomPointNear(x, y, minDistance = 150, maxDistance = 750) {
        const angle = Math.random() * Math.PI * 2;
        const distance = randomBetween(minDistance, maxDistance);
        return {
            x: Math.max(35, Math.min(WORLD_SIZE - 35, x + Math.cos(angle) * distance)),
            y: Math.max(35, Math.min(WORLD_SIZE - 35, y + Math.sin(angle) * distance))
        };
    }

    function addZombie(x, y, type = Math.random() < 0.5 ? 'normal' : 'runner') {
        const stats = ZOMBIE_TYPES[type];
        const zombie = {
            id: randomUUID(),
            type,
            x,
            y,
            health: stats.health,
            maxHealth: stats.health,
            lastAttackAt: 0
        };
        zombies.set(zombie.id, zombie);
        return zombie;
    }

    function addPickup(kind, type, x, y, amount) {
        const pickup = {
            id: randomUUID(),
            kind,
            type,
            x,
            y
        };
        if (Number.isInteger(amount)) pickup.amount = amount;
        pickups.set(pickup.id, pickup);
        return pickup;
    }

    function resetWorld() {
        const now = Date.now();
        worldStartedAt = now;
        nextZombieAt = 10;
        nextArmouredAt = 60;
        nextTankAt = 181;
        nextBossAt = 302;
        nextAmmoAt = 15;
        nextSpecialAt = 60;
        nextGrenadeAt = 45;
        nextCoinAt = 60;
        zombies.clear();
        pickups.clear();

        const firstPlayer = [...players.values()][0];
        const centerX = firstPlayer?.x ?? 400;
        const centerY = firstPlayer?.y ?? 300;
        for (let index = 0; index < 5; index++) {
            const point = randomPointNear(centerX, centerY, 300, 500);
            addZombie(point.x, point.y);
        }

        for (const weaponId of WEAPON_IDS) {
            const point = randomPointNear(centerX, centerY, 120, 650);
            addPickup('weapon', weaponId, point.x, point.y);
        }
        for (let index = WEAPON_IDS.length; index < 22; index++) {
            const point = randomPointNear(centerX, centerY, 120, 900);
            addPickup('weapon', WEAPON_IDS[randomBetween(0, WEAPON_IDS.length - 1)], point.x, point.y);
        }
        for (let index = 0; index < 20; index++) {
            const point = randomPointNear(centerX, centerY, 120, 900);
            addPickup('ammo', 'ammo', point.x, point.y, 10);
        }
        for (let index = 0; index < 2; index++) {
            const point = randomPointNear(centerX, centerY, 120, 900);
            addPickup('special', SPAWNABLE_SPECIAL_IDS[randomBetween(0, SPAWNABLE_SPECIAL_IDS.length - 1)], point.x, point.y);
        }
        for (let index = 0; index < 2; index++) {
            const point = randomPointNear(centerX, centerY, 180, 900);
            addPickup('grenade', 'grenade', point.x, point.y, 1);
        }
        for (let index = 0; index < 2; index++) {
            const point = randomPointNear(centerX, centerY, 120, 900);
            addPickup('coin', 'coin', point.x, point.y, randomBetween(10, 100));
        }
    }

    function snapshot() {
        return {
            elapsedSeconds: worldStartedAt
                ? Math.floor((Date.now() - worldStartedAt) / 1000)
                : 0,
            players: [...players.values()].map(player => ({
                id: player.id,
                name: player.name,
                characterId: player.characterId,
                x: player.x,
                y: player.y,
                angle: player.angle,
                weaponId: player.weaponId,
                health: player.health,
                maxHealth: player.maxHealth,
                armour: player.armour,
                grenades: player.grenades
            })),
            zombies: [...zombies.values()],
            pickups: [...pickups.values()]
        };
    }

    function emitWorld() {
        if (players.size > 0) io.emit('world:state', snapshot());
    }

    function damageZombie(zombie, damage, attacker) {
        if (!zombies.has(zombie.id)) return;
        zombie.health = Math.max(0, zombie.health - damage);
        if (zombie.health === 0) {
            zombies.delete(zombie.id);
            attacker.socket.emit('world:reward', { coins: 1 });
        }
    }

    function distanceToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }

    function damageAlongRay(player, angle, range, damage, radius, splashRadius = 0) {
        const endX = player.x + Math.cos(angle) * range;
        const endY = player.y + Math.sin(angle) * range;
        let hit = null;
        let hitDistance = Infinity;

        for (const zombie of zombies.values()) {
            const distance = distanceToSegment(zombie.x, zombie.y, player.x, player.y, endX, endY);
            const along = Math.hypot(zombie.x - player.x, zombie.y - player.y);
            if (distance <= radius && along < hitDistance) {
                hit = zombie;
                hitDistance = along;
            }
        }

        if (!hit) return;
        if (splashRadius > 0) {
            for (const zombie of [...zombies.values()]) {
                const distance = Math.hypot(zombie.x - hit.x, zombie.y - hit.y);
                if (distance <= splashRadius) {
                    damageZombie(zombie, damage * (1 - 0.5 * distance / splashRadius), player);
                }
            }
        } else {
            damageZombie(hit, damage, player);
        }
    }

    function handleAttack(player, action) {
        if (!action || typeof action.kind !== 'string' || !Number.isFinite(action.angle)) return;
        const now = Date.now();
        const weaponId = action.weaponId || player.weaponId;
        const weapon = getWeaponById(weaponId);
        if (action.kind !== 'punch' && !weapon) return;
        if (action.kind !== 'punch' && !player.weapons.includes(weaponId)) return;
        if (weapon) player.weaponId = weaponId;

        const attackKey = action.kind === 'punch' ? 'punch' : weaponId;
        const delay = action.kind === 'punch'
            ? 400
            : weapon.id === 'sword' ? 420 : weapon.fireRate;
        if (now < (player.lastAttackAt[attackKey] ?? 0) + delay) return;
        player.lastAttackAt[attackKey] = now;

        const character = getCharacterById(player.characterId);
        const damageMultiplier = character.damageMultiplier;
        const angle = action.angle;

        if (action.kind === 'punch') {
            for (const zombie of [...zombies.values()]) {
                if (Math.hypot(zombie.x - player.x, zombie.y - player.y) < 70) {
                    damageZombie(zombie, 20 * damageMultiplier, player);
                }
            }
            return;
        }

        io.emit('combat:shot', {
            playerId: player.id,
            x: player.x,
            y: player.y,
            angle,
            weaponId: weapon.id
        });

        if (weapon.id === 'sword') {
            damageAlongRay(player, angle, 420, weapon.damage * damageMultiplier, 25, 100);
        } else if (weapon.category === 'Melee') {
            for (const zombie of [...zombies.values()]) {
                const dx = zombie.x - player.x;
                const dy = zombie.y - player.y;
                const distance = Math.hypot(dx, dy);
                const difference = Math.abs(Math.atan2(
                    Math.sin(Math.atan2(dy, dx) - angle),
                    Math.cos(Math.atan2(dy, dx) - angle)
                ));
                if (distance <= weapon.range && difference <= Math.PI / 3) {
                    damageZombie(zombie, weapon.damage * damageMultiplier, player);
                }
            }
        } else {
            const pellets = weapon.pellets || 1;
            for (let pellet = 0; pellet < pellets; pellet++) {
                const spread = pellets > 1
                    ? (pellet / (pellets - 1) - 0.5) * 0.32
                    : 0;
                damageAlongRay(
                    player,
                    angle + spread,
                    weapon.range,
                    weapon.damage * damageMultiplier,
                    24
                );
            }
        }
    }

    io.on('connection', socket => {
        socket.on('session:join', (acknowledge = () => {}) => {
            const existing = players.get(socket.id);
            if (existing) {
                acknowledge({
                    success: true,
                    playerId: socket.id,
                    state: snapshot()
                });
                return;
            }

            const user = socket.data.user;
            const characterId = user.selected_character || DEFAULT_CHARACTER_ID;
            const character = getCharacterById(characterId);
            const weapons = getSpawnableWeaponIds(user.owned_weapons, user.spawn_weapons);
            const offset = players.size * 60;
            const player = {
                id: socket.id,
                socket,
                name: user.username,
                characterId: character.id,
                x: Math.min(WORLD_SIZE - 100, 400 + offset),
                y: 300,
                angle: 0,
                weaponId: null,
                weapons,
                health: character.maxHealth,
                maxHealth: character.maxHealth,
                armour: 0,
                grenades: 0,
                speedBoostUntil: 0,
                lastAttackAt: Object.create(null),
                lastStateAt: Date.now(),
                lastDamageAt: 0
            };
            players.set(socket.id, player);
            if (!worldStartedAt) resetWorld();

            acknowledge({
                success: true,
                playerId: socket.id,
                state: snapshot()
            });
            emitWorld();
        });

        socket.on('player:state', state => {
            const player = players.get(socket.id);
            if (
                !player ||
                player.health <= 0 ||
                !state ||
                !Number.isFinite(state.x) ||
                !Number.isFinite(state.y) ||
                !Number.isFinite(state.angle) ||
                state.x < 0 ||
                state.x > WORLD_SIZE ||
                state.y < 0 ||
                state.y > WORLD_SIZE
            ) {
                return;
            }

            const now = Date.now();
            const elapsed = Math.max(0.05, (now - player.lastStateAt) / 1000);
            const maxDistance = 200 * getCharacterById(player.characterId).speedMultiplier * elapsed + 100;
            if (Math.hypot(state.x - player.x, state.y - player.y) > maxDistance) return;

            player.x = state.x;
            player.y = state.y;
            player.angle = state.angle;
            player.weaponId = player.weapons.includes(state.weaponId)
                ? state.weaponId
                : null;
            player.lastStateAt = now;
        });

        socket.on('combat:attack', action => {
            const player = players.get(socket.id);
            if (player && player.health > 0) handleAttack(player, action);
        });

        socket.on('combat:grenade', target => {
            const player = players.get(socket.id);
            if (
                !player ||
                player.health <= 0 ||
                player.grenades <= 0 ||
                !target ||
                !Number.isFinite(target.x) ||
                !Number.isFinite(target.y) ||
                Math.hypot(target.x - player.x, target.y - player.y) > 700
            ) {
                return;
            }

            player.grenades -= 1;
            const multiplier = getCharacterById(player.characterId).damageMultiplier;
            io.emit('combat:explosion', { x: target.x, y: target.y });
            for (const zombie of [...zombies.values()]) {
                const distance = Math.hypot(target.x - zombie.x, target.y - zombie.y);
                if (distance <= 120) {
                    const damage = Math.max(20, 100 - distance / 120 * 70) * multiplier;
                    damageZombie(zombie, damage, player);
                }
            }
        });

        socket.on('world:collect', (pickupId, acknowledge = () => {}) => {
            const player = players.get(socket.id);
            const pickup = pickups.get(pickupId);
            if (
                !player ||
                !pickup ||
                Math.hypot(pickup.x - player.x, pickup.y - player.y) > PICKUP_RADIUS
            ) {
                acknowledge({ success: false });
                return;
            }

            pickups.delete(pickupId);
            if (pickup.kind === 'weapon' && !player.weapons.includes(pickup.type)) {
                player.weapons.push(pickup.type);
            } else if (pickup.kind === 'grenade') {
                player.grenades = Math.min(3, player.grenades + pickup.amount);
            } else if (pickup.kind === 'special') {
                const item = SURVIVAL_ITEM_CATALOG.find(
                    candidate => candidate.id === pickup.type
                );
                if (item?.effect === 'heal') {
                    player.health = Math.min(
                        player.maxHealth,
                        player.health + item.amount
                    );
                } else if (item?.effect === 'armour') {
                    player.armour = item.amount;
                } else if (item?.effect === 'speed') {
                    player.speedBoostUntil = Date.now() + item.duration;
                }
            }
            socket.emit('world:pickup', pickup);
            acknowledge({ success: true });
            emitWorld();
        });
        socket.on('world:swapWeapon', (request, acknowledge = () => {}) => {
            const player = players.get(socket.id);
            const weaponId = request?.weaponId;
            if (
                !player ||
                player.health <= 0 ||
                typeof weaponId !== 'string' ||
                !player.weapons.includes(weaponId)
            ) {
                acknowledge({ success: false });
                return;
            }

            const pickup = request.pickupId
                ? pickups.get(request.pickupId)
                : null;
            if (
                (request.pickupId && pickup?.kind !== 'weapon') ||
                (pickup && Math.hypot(pickup.x - player.x, pickup.y - player.y) > PICKUP_RADIUS)
            ) {
                acknowledge({ success: false });
                return;
            }

            if (pickup) pickups.delete(pickup.id);
            player.weapons = player.weapons.filter(id => id !== weaponId);
            if (pickup && !player.weapons.includes(pickup.type)) {
                player.weapons.push(pickup.type);
            }
            player.weaponId = pickup?.type ?? null;

            const dropX = Math.max(
                35,
                Math.min(WORLD_SIZE - 35, player.x - Math.cos(player.angle) * 55)
            );
            const dropY = Math.max(
                35,
                Math.min(WORLD_SIZE - 35, player.y - Math.sin(player.angle) * 55)
            );
            addPickup('weapon', weaponId, dropX, dropY);
            socket.emit('world:weaponSwap', {
                droppedWeaponId: weaponId,
                pickup
            });
            acknowledge({ success: true });
            emitWorld();
        });
        socket.on('disconnect', () => {
            if (!players.delete(socket.id)) return;
            if (players.size === 0) {
                worldStartedAt = 0;
                zombies.clear();
                pickups.clear();
            } else {
                emitWorld();
            }
        });
    });

    setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.min(0.1, Math.max(0, (now - lastTickAt) / 1000));
        lastTickAt = now;
        if (players.size === 0) return;

        const elapsed = Math.floor((now - worldStartedAt) / 1000);
        const activePlayers = [...players.values()].filter(player => player.health > 0);
        if (activePlayers.length === 0) {
            emitWorld();
            return;
        }

        for (const zombie of zombies.values()) {
            const stats = ZOMBIE_TYPES[zombie.type];
            let target = null;
            let nearestDistance = Infinity;
            for (const player of activePlayers) {
                const distance = Math.hypot(player.x - zombie.x, player.y - zombie.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    target = player;
                }
            }
            if (!target) continue;

            if (nearestDistance > 55) {
                const angle = Math.atan2(target.y - zombie.y, target.x - zombie.x);
                zombie.x = Math.max(25, Math.min(WORLD_SIZE - 25, zombie.x + Math.cos(angle) * stats.speed * deltaSeconds));
                zombie.y = Math.max(25, Math.min(WORLD_SIZE - 25, zombie.y + Math.sin(angle) * stats.speed * deltaSeconds));
            } else if (now >= zombie.lastAttackAt + 1000) {
                zombie.lastAttackAt = now;
                const absorbed = Math.min(target.armour, stats.damagePerSecond);
                target.armour -= absorbed;
                target.health = Math.max(
                    0,
                    target.health - (stats.damagePerSecond - absorbed)
                );
                target.socket.emit('world:damage', {
                    amount: stats.damagePerSecond,
                    health: target.health,
                    armour: target.armour
                });
            }
        }

        if (elapsed >= nextZombieAt) {
            if (zombies.size < 120) {
                const point = randomPointNear(
                    activePlayers[0]?.x ?? 400,
                    activePlayers[0]?.y ?? 300,
                    300,
                    500
                );
                addZombie(point.x, point.y);
            }
            nextZombieAt = elapsed + 10;
        }
        if (elapsed >= nextArmouredAt) {
            if (zombies.size < 120) {
                const point = randomPointNear(activePlayers[0]?.x ?? 400, activePlayers[0]?.y ?? 300, 300, 500);
                addZombie(point.x, point.y, 'armoured');
            }
            nextArmouredAt += 60;
        }
        if (elapsed >= nextTankAt) {
            if (zombies.size < 120) {
                const point = randomPointNear(activePlayers[0]?.x ?? 400, activePlayers[0]?.y ?? 300, 300, 500);
                addZombie(point.x, point.y, 'tank');
            }
            nextTankAt += 180;
        }
        if (elapsed >= nextBossAt) {
            if (zombies.size < 120) {
                const point = randomPointNear(activePlayers[0]?.x ?? 400, activePlayers[0]?.y ?? 300, 300, 500);
                addZombie(point.x, point.y, 'boss');
            }
            nextBossAt += 300;
        }
        if (elapsed >= nextAmmoAt && pickups.size < 100) {
            const player = activePlayers[0];
            if (player) {
                const point = randomPointNear(player.x, player.y);
                addPickup('ammo', 'ammo', point.x, point.y, 10);
            }
            nextAmmoAt = elapsed + 15;
        }
        if (elapsed >= nextSpecialAt && pickups.size < 100) {
            const player = activePlayers[0];
            if (player) {
                for (let index = 0; index < 2; index++) {
                    const point = randomPointNear(player.x, player.y);
                    addPickup('special', SPAWNABLE_SPECIAL_IDS[randomBetween(0, SPAWNABLE_SPECIAL_IDS.length - 1)], point.x, point.y);
                }
            }
            nextSpecialAt = elapsed + 60;
        }
        if (elapsed >= nextGrenadeAt && pickups.size < 100) {
            const player = activePlayers[0];
            if (player) {
                const point = randomPointNear(player.x, player.y, 180, 900);
                addPickup('grenade', 'grenade', point.x, point.y, 1);
            }
            nextGrenadeAt = elapsed + 45;
        }
        if (elapsed >= nextCoinAt && pickups.size < 100) {
            const player = activePlayers[0];
            if (player) {
                for (let index = 0; index < 2; index++) {
                    const point = randomPointNear(player.x, player.y);
                    addPickup('coin', 'coin', point.x, point.y, randomBetween(10, 100));
                }
            }
            nextCoinAt = elapsed + 60;
        }

        emitWorld();
    }, 100).unref();
}
