import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSpawnableWeaponIds,
  getWeaponById,
  WEAPON_CATALOG,
  WEAPON_PRICE
} from '../src/utils/weaponCatalog.js';

test('all listed weapons cost 2000 and have unique ids', () => {
  assert.equal(WEAPON_PRICE, 2000);
  assert.equal(WEAPON_CATALOG.length, 8);
  assert.equal(new Set(WEAPON_CATALOG.map(weapon => weapon.id)).size, 8);
  assert.ok(WEAPON_CATALOG.every(weapon =>
    Number.isInteger(weapon.damage) &&
    weapon.damage > 0 &&
    Number.isFinite(weapon.fireRate) &&
    weapon.fireRate > 0
  ));
});

test('catalog includes the requested magazine sizes and damage values', () => {
  assert.equal(getWeaponById('pistol').magazineSize, 12);
  assert.equal(getWeaponById('shotgun').damage, 15);
  assert.equal(getWeaponById('shotgun').magazineSize, 5);
  assert.equal(getWeaponById('assault_rifle').damage, 15);
  assert.equal(getWeaponById('assault_rifle').magazineSize, 30);
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
