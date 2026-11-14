import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARACTER_CATALOG,
  CHARACTER_PRICE,
  DEFAULT_CHARACTER_ID,
  getAmmoPickupCount,
  getAmmoSpawnInterval,
  getCharacterById,
  getHealthSpawnInterval,
  getItemSpawnInterval,
  getWeaponDropCount
} from '../src/utils/characterCatalog.js';

test('all additional characters cost 500 coins and the survivor is the default', () => {
  assert.equal(DEFAULT_CHARACTER_ID, 'survivor');
  assert.equal(CHARACTER_PRICE, 500);
  assert.equal(new Set(CHARACTER_CATALOG.map(character => character.color)).size, 5);
  assert.deepEqual(
    CHARACTER_CATALOG.slice(1).map(({ id, price }) => [id, price]),
    [
      ['armoured', 500],
      ['speedster', 500],
      ['gunner', 500],
      ['lucy', 500]
    ]
  );
  assert.equal(CHARACTER_CATALOG[0].price, 0);
});

test('character stat modifiers match the requested values', () => {
  assert.deepEqual(
    ['armoured', 'speedster', 'gunner', 'lucy'].map(id => {
      const { maxHealth, speedMultiplier, damageMultiplier } =
        getCharacterById(id);
      return { maxHealth, speedMultiplier, damageMultiplier };
    }),
    [
      { maxHealth: 160, speedMultiplier: 0.5, damageMultiplier: 1 },
      { maxHealth: 70, speedMultiplier: 3, damageMultiplier: 1 },
      { maxHealth: 80, speedMultiplier: 1, damageMultiplier: 3 },
      { maxHealth: 100, speedMultiplier: 1, damageMultiplier: 1 }
    ]
  );
});

test('Gunner reduces weapon, health, and ammo spawn rates by 20 percent', () => {
  const gunner = getCharacterById('gunner');
  assert.equal(getWeaponDropCount(22, gunner), 18);
  assert.equal(getAmmoPickupCount(20, gunner), 16);
  assert.equal(getAmmoSpawnInterval(15000, gunner), 18750);
  assert.equal(getHealthSpawnInterval(60000, gunner), 75000);
});

test('Lucy halves timed item spawn intervals', () => {
  const lucy = getCharacterById('lucy');
  assert.equal(getItemSpawnInterval(15000, lucy), 7500);
  assert.equal(getItemSpawnInterval(45000, lucy), 22500);
  assert.equal(getHealthSpawnInterval(60000, lucy), 30000);
  assert.equal(getAmmoSpawnInterval(15000, lucy), 7500);
});
