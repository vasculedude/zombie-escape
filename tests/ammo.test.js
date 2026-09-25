import test from 'node:test';
import assert from 'node:assert/strict';

import { applyAmmoPickup, MAX_TOTAL_AMMO } from '../src/utils/ammoUtils.js';

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
