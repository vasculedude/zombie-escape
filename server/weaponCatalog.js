export const WEAPON_PRICES = Object.freeze({
    Common: 500,
    Uncommon: 1000,
    Rare: 2500
});

export const STARTER_WEAPON_CATALOG = [
    {
        id: 'blaster',
        name: 'Blaster',
        category: 'Gun',
        damage: 20,
        range: 300,
        fireRate: 500,
        magazineSize: 10
    },
    {
        id: 'rapid',
        name: 'Rapid Blaster',
        category: 'Gun',
        damage: 10,
        range: 350,
        fireRate: 150,
        magazineSize: 10
    },
    {
        id: 'heavy',
        name: 'Heavy Blaster',
        category: 'Gun',
        damage: 40,
        range: 250,
        fireRate: 900,
        magazineSize: 10
    },
    {
        id: 'sword',
        name: 'Sword',
        category: 'Special',
        damage: 100,
        range: 120,
        fireRate: 5000,
        magazineSize: 10
    }
];

export const WEAPON_CATALOG = [
    {
        id: 'baseball_bat',
        name: 'Baseball Bat',
        category: 'Melee',
        rarity: 'Common',
        damage: 25,
        range: 55,
        fireRate: 500,
        attackSpeed: 'Medium'
    },
    {
        id: 'crowbar',
        name: 'Crowbar',
        category: 'Melee',
        rarity: 'Common',
        damage: 30,
        range: 55,
        fireRate: 900,
        attackSpeed: 'Slow'
    },
    {
        id: 'hammer',
        name: 'Hammer',
        category: 'Melee',
        rarity: 'Uncommon',
        damage: 40,
        range: 48,
        fireRate: 900,
        attackSpeed: 'Slow'
    },
    {
        id: 'machete',
        name: 'Machete',
        category: 'Melee',
        rarity: 'Uncommon',
        damage: 35,
        range: 60,
        fireRate: 350,
        attackSpeed: 'Fast'
    },
    {
        id: 'pistol',
        name: 'Pistol',
        category: 'Gun',
        rarity: 'Common',
        damage: 20,
        range: 350,
        fireRate: 350,
        magazineSize: 12
    },
    {
        id: 'shotgun',
        name: 'Shotgun',
        category: 'Gun',
        rarity: 'Uncommon',
        damage: 15,
        range: 260,
        fireRate: 800,
        magazineSize: 5,
        pellets: 5
    },
    {
        id: 'assault_rifle',
        name: 'Assault Rifle',
        category: 'Gun',
        rarity: 'Uncommon',
        damage: 15,
        range: 400,
        fireRate: 150,
        magazineSize: 30
    },
    {
        id: 'sniper_rifle',
        name: 'Sniper Rifle',
        category: 'Gun',
        rarity: 'Rare',
        damage: 75,
        range: 700,
        fireRate: 1000,
        magazineSize: 5
    }
];

export function getWeaponPrice(weaponId) {
    const weapon = WEAPON_CATALOG.find(item => item.id === weaponId);
    if (!weapon) {
        throw new RangeError(`Unknown purchasable weapon: ${weaponId}`);
    }

    const price = WEAPON_PRICES[weapon.rarity];
    if (!price) {
        throw new RangeError(`Unknown weapon rarity: ${weapon.rarity}`);
    }

    return price;
}

export function getWeaponById(id) {
    return WEAPON_CATALOG.find(weapon => weapon.id === id) ||
        STARTER_WEAPON_CATALOG.find(weapon => weapon.id === id);
}

export function getSpawnableWeaponIds(ownedWeaponIds, selectedWeaponIds) {
    const rawOwnedWeaponIds = Array.isArray(ownedWeaponIds)
        ? ownedWeaponIds
        : typeof ownedWeaponIds === 'string'
            ? [ownedWeaponIds]
            : [];

    const availableWeaponIds = [...new Set([
        ...STARTER_WEAPON_CATALOG.map(weapon => weapon.id),
        ...rawOwnedWeaponIds.filter(
            id => typeof id === 'string' &&
                WEAPON_CATALOG.some(weapon => weapon.id === id)
        )
    ])];

    if (!Array.isArray(selectedWeaponIds)) {
        return availableWeaponIds;
    }

    return [...new Set(selectedWeaponIds.filter(
        id => typeof id === 'string' && availableWeaponIds.includes(id)
    ))];
}
