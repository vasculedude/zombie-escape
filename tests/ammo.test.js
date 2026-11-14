import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyAmmoPickup,
  distributeAmmoPickup,
  MAX_TOTAL_AMMO
} from '../src/utils/ammoUtils.js';

test('ammo pickups add 10 rounds and never exceed 100 total ammo', () => {
  const afterPickup = applyAmmoPickup({
    magazineAmmo: 0,
    reserveAmmo: 90,
    pickupAmount: 10,
    maxAmmo: MAX_TOTAL_AMMO
  });

  assert.deepEqual(afterPickup, {
    magazineAmmo: 0,
    reserveAmmo: 100
  });

  const fullAlready = applyAmmoPickup({
    magazineAmmo: 10,
    reserveAmmo: 90,
    pickupAmount: 10,
    maxAmmo: MAX_TOTAL_AMMO
  });

  assert.deepEqual(fullAlready, {
    magazineAmmo: 10,
    reserveAmmo: 90
  });
});

test('ammo pickups split evenly across collected guns', () => {
  const slots = ['pistol', 'shotgun', 'assault_rifle'].map(type => ({
    type,
    weapon: { type, isMelee: false },
    magazineAmmo: 10,
    reserveAmmo: 80
  }));

  const result = distributeAmmoPickup(slots, 10);

  assert.deepEqual(
    result.weaponSlots.map(slot => slot.reserveAmmo),
    [84, 83, 83]
  );
  assert.equal(result.ammoAdded, 10);
  assert.deepEqual(slots.map(slot => slot.reserveAmmo), [80, 80, 80]);
});

test('ammo pickup fills remaining capacity evenly and leaves melee weapons unchanged', () => {
  const slots = [
    {
      type: 'pistol',
      weapon: { type: 'pistol', isMelee: false },
      magazineAmmo: 10,
      reserveAmmo: 88
    },
    {
      type: 'shotgun',
      weapon: { type: 'shotgun', isMelee: false },
      magazineAmmo: 10,
      reserveAmmo: 80
    },
    {
      type: 'sword',
      weapon: { type: 'sword', isMelee: true },
      magazineAmmo: 0,
      reserveAmmo: 0
    },
    { type: 'rapid', weapon: null, magazineAmmo: 0, reserveAmmo: 0 }
  ];

  const result = distributeAmmoPickup(slots, 15);

  assert.deepEqual(
    result.weaponSlots.map(slot => slot.reserveAmmo),
    [90, 90, 0, 0]
  );
  assert.equal(result.ammoAdded, 12);
});

test('ammo pickup is not consumed when all collected guns are full', () => {
  const slots = [
    {
      weapon: { type: 'pistol', isMelee: false },
      magazineAmmo: 10,
      reserveAmmo: 90
    },
    {
      weapon: { type: 'sword', isMelee: true },
      magazineAmmo: 0,
      reserveAmmo: 0
    }
  ];

  const result = distributeAmmoPickup(slots, 10);

  assert.equal(result.ammoAdded, 0);
  assert.deepEqual(result.weaponSlots, slots);
});
