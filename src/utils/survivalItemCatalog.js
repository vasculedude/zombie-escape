export const SURVIVAL_ITEM_PRICES = Object.freeze({
    Common: 500,
    Uncommon: 1000
});

export const SURVIVAL_ITEM_CATALOG = Object.freeze([
    {
        id: 'medkit',
        name: 'Medkit',
        rarity: 'Common',
        description: 'Restores 50 HP.',
        effect: 'heal',
        amount: 50
    },
    {
        id: 'bandages',
        name: 'Bandages',
        rarity: 'Common',
        description: 'Restores 20 HP.',
        effect: 'heal',
        amount: 20
    },
    {
        id: 'armour_vest',
        name: 'Armour Vest',
        rarity: 'Uncommon',
        description: 'Absorbs 30 damage before breaking.',
        effect: 'armour',
        amount: 30
    },
    {
        id: 'energy_drink',
        name: 'Energy Drink',
        rarity: 'Common',
        description: 'Increases movement speed by 20% for 10 seconds.',
        effect: 'speed',
        amount: 1.2,
        duration: 10000
    },
    {
        id: 'backpack',
        name: 'Backpack',
        rarity: 'Uncommon',
        description: 'Allows one extra weapon in your Armory.',
        effect: 'backpack',
        amount: 1
    }
]);

export function getSurvivalItemById(itemId) {
    return SURVIVAL_ITEM_CATALOG.find(item => item.id === itemId);
}

export function getSurvivalItemPrice(itemId) {
    const item = getSurvivalItemById(itemId);
    if (!item) {
        throw new RangeError(`Unknown survival item: ${itemId}`);
    }

    const price = SURVIVAL_ITEM_PRICES[item.rarity];
    if (!price) {
        throw new RangeError(`Unknown survival item rarity: ${item.rarity}`);
    }

    return price;
}

export function getSpawnableSurvivalItemIds(ownedItemIds, selectedItemIds) {
    const ownedIds = Array.isArray(ownedItemIds)
        ? ownedItemIds
        : [];
    const availableIds = [...new Set(ownedIds.filter(id =>
        typeof id === 'string' &&
        SURVIVAL_ITEM_CATALOG.some(item => item.id === id && item.effect !== 'backpack')
    ))];

    if (!Array.isArray(selectedItemIds)) {
        return availableIds;
    }

    return [...new Set(selectedItemIds.filter(id => availableIds.includes(id)))];
}

export function getMaxWeaponSelections(ownedItemIds) {
    const ownedIds = Array.isArray(ownedItemIds) ? ownedItemIds : [];
    return ownedIds.includes('backpack') ? 5 : 4;
}
