export const DEFAULT_CHARACTER_ID = 'survivor';
export const CHARACTER_PRICE = 500;

export const CHARACTER_CATALOG = [
    {
        id: DEFAULT_CHARACTER_ID,
        name: 'Survivor',
        price: 0,
        color: 0x4dabf7,
        description: 'Balanced character with standard stats.',
        maxHealth: 100,
        speedMultiplier: 1,
        damageMultiplier: 1,
        ammoSpawnMultiplier: 1,
        healthSpawnMultiplier: 1,
        weaponDropMultiplier: 1,
        itemSpawnIntervalMultiplier: 1
    },
    {
        id: 'armoured',
        name: 'Armoured',
        price: CHARACTER_PRICE,
        color: 0x858f9a,
        description: '160 HP, but moves at half speed.',
        maxHealth: 160,
        speedMultiplier: 0.5,
        damageMultiplier: 1,
        ammoSpawnMultiplier: 1,
        healthSpawnMultiplier: 1,
        weaponDropMultiplier: 1,
        itemSpawnIntervalMultiplier: 1
    },
    {
        id: 'speedster',
        name: 'Speedster',
        price: CHARACTER_PRICE,
        color: 0xe14848,
        description: '70 HP and moves at 3x speed.',
        maxHealth: 70,
        speedMultiplier: 3,
        damageMultiplier: 1,
        ammoSpawnMultiplier: 1,
        healthSpawnMultiplier: 1,
        weaponDropMultiplier: 1,
        itemSpawnIntervalMultiplier: 1
    },
    {
        id: 'gunner',
        name: 'Gunner',
        price: CHARACTER_PRICE,
        color: 0x667d3a,
        description: '3x damage, 80 HP, fewer weapon, health, and ammo drops.',
        maxHealth: 80,
        speedMultiplier: 1,
        damageMultiplier: 3,
        ammoSpawnMultiplier: 1.25,
        healthSpawnMultiplier: 1.25,
        weaponDropMultiplier: 0.8,
        itemSpawnIntervalMultiplier: 1
    },
    {
        id: 'lucy',
        name: 'Lucy',
        price: CHARACTER_PRICE,
        color: 0xb25ee8,
        description: 'Items spawn twice as often.',
        maxHealth: 100,
        speedMultiplier: 1,
        damageMultiplier: 1,
        ammoSpawnMultiplier: 1,
        healthSpawnMultiplier: 1,
        weaponDropMultiplier: 1,
        itemSpawnIntervalMultiplier: 0.5
    }
];

export function getCharacterById(characterId) {
    return CHARACTER_CATALOG.find(character => character.id === characterId) ||
        CHARACTER_CATALOG[0];
}

export function getItemSpawnInterval(baseInterval, character) {
    const interval = baseInterval *
        character.itemSpawnIntervalMultiplier;

    return Math.max(1, Math.round(interval));
}

export function getAmmoSpawnInterval(baseInterval, character) {
    const interval = getItemSpawnInterval(baseInterval, character) *
        character.ammoSpawnMultiplier;

    return Math.max(1, Math.round(interval));
}

export function getHealthSpawnInterval(baseInterval, character) {
    const interval = getItemSpawnInterval(baseInterval, character) *
        character.healthSpawnMultiplier;

    return Math.max(1, Math.round(interval));
}

export function getWeaponDropCount(baseCount, character) {
    return Math.max(1, Math.round(baseCount * character.weaponDropMultiplier));
}

export function getAmmoPickupCount(baseCount, character) {
    return Math.max(0, Math.floor(baseCount / character.ammoSpawnMultiplier));
}
