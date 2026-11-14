import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSpawnableWeaponIds,
  getWeaponPrice,
  getWeaponById,
  WEAPON_CATALOG,
  WEAPON_PRICES
} from '../src/utils/weaponCatalog.js';

test('weapons are priced by rarity and have unique ids', () => {
  assert.deepEqual(WEAPON_PRICES, {
    Common: 500,
    Uncommon: 1000,
    Rare: 2000
  });
  assert.equal(WEAPON_CATALOG.length, 8);
  assert.equal(new Set(WEAPON_CATALOG.map(weapon => weapon.id)).size, 8);
  assert.ok(WEAPON_CATALOG.every(weapon =>
    Number.isInteger(weapon.damage) &&
    weapon.damage > 0 &&
    Number.isFinite(weapon.fireRate) &&
    weapon.fireRate > 0
  ));
  for (const weapon of WEAPON_CATALOG) {
    assert.equal(getWeaponPrice(weapon.id), WEAPON_PRICES[weapon.rarity]);
  }
  assert.equal(getWeaponPrice('pistol'), 500);
  assert.equal(getWeaponPrice('machete'), 1000);
  assert.equal(getWeaponPrice('sniper_rifle'), 2000);
  assert.equal(getWeaponPrice('assault_rifle'), 2000);
});

test('catalog includes the requested magazine sizes and damage values', () => {
  assert.equal(getWeaponById('pistol').magazineSize, 12);
  assert.equal(getWeaponById('shotgun').damage, 15);
  assert.equal(getWeaponById('shotgun').magazineSize, 5);
  assert.equal(getWeaponById('assault_rifle').damage, 15);
  assert.equal(getWeaponById('assault_rifle').magazineSize, 30);
  assert.equal(getWeaponById('assault_rifle').name, 'Minigun');
  assert.equal(getWeaponById('assault_rifle').rarity, 'Rare');
  assert.equal(getWeaponById('sniper_rifle').damage, 75);
  assert.equal(getWeaponById('sniper_rifle').magazineSize, 5);
});

test('only unique purchased catalog weapons can spawn', () => {
  assert.deepEqual(
    getSpawnableWeaponIds(['pistol', 'unknown', 'pistol', 'machete']),
    ['blaster', 'rapid', 'heavy', 'sword', 'pistol', 'machete']
  );
  assert.deepEqual(
    getSpawnableWeaponIds(undefined),
    ['blaster', 'rapid', 'heavy', 'sword']
  );
});

test('selected spawn weapons are limited to unique unlocked weapons', () => {
  assert.deepEqual(
    getSpawnableWeaponIds(
      ['pistol'],
      ['pistol', 'unknown', 'pistol', 'sword']
    ),
    ['pistol', 'sword']
  );
});
