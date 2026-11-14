import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMaxWeaponSelections,
  getSpawnableSurvivalItemIds,
  getSurvivalItemById,
  getSurvivalItemPrice,
  SURVIVAL_ITEM_CATALOG,
  SURVIVAL_ITEM_PRICES
} from '../src/utils/survivalItemCatalog.js';

test('survival items have the requested effects and rarity prices', () => {
  assert.deepEqual(SURVIVAL_ITEM_PRICES, {
    Common: 500,
    Uncommon: 1000
  });
  assert.equal(SURVIVAL_ITEM_CATALOG.length, 5);
  assert.equal(getSurvivalItemPrice('medkit'), 500);
  assert.equal(getSurvivalItemPrice('bandages'), 500);
  assert.equal(getSurvivalItemPrice('armour_vest'), 1000);
  assert.equal(getSurvivalItemPrice('energy_drink'), 500);
  assert.equal(getSurvivalItemPrice('backpack'), 1000);
  assert.deepEqual(
    ['medkit', 'bandages', 'armour_vest', 'energy_drink', 'backpack']
      .map(id => getSurvivalItemById(id).effect),
    ['heal', 'heal', 'armour', 'speed', 'backpack']
  );
  assert.equal(getSurvivalItemById('medkit').amount, 50);
  assert.equal(getSurvivalItemById('bandages').amount, 20);
  assert.equal(getSurvivalItemById('armour_vest').amount, 30);
  assert.equal(getSurvivalItemById('energy_drink').amount, 1.2);
  assert.equal(getSurvivalItemById('energy_drink').duration, 10000);
});

test('only owned non-backpack items can be selected to spawn', () => {
  assert.deepEqual(
    getSpawnableSurvivalItemIds(
      ['medkit', 'bandages', 'backpack', 'medkit', 'unknown'],
      ['bandages', 'backpack', 'unknown', 'bandages']
    ),
    ['bandages']
  );
  assert.deepEqual(
    getSpawnableSurvivalItemIds(['medkit', 'backpack']),
    ['medkit']
  );
});

test('backpack adds one weapon selection slot', () => {
  assert.equal(getMaxWeaponSelections([]), 4);
  assert.equal(getMaxWeaponSelections(['medkit']), 4);
  assert.equal(getMaxWeaponSelections(['backpack']), 5);
});
