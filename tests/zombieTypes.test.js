import test from 'node:test';
import assert from 'node:assert/strict';

import { REGULAR_ZOMBIE_TYPES, ZOMBIE_TYPES } from '../src/utils/zombieTypes.js';

test('zombie variants use the requested health and damage values', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(ZOMBIE_TYPES).map(([type, stats]) => [
        type,
        [stats.health, stats.damagePerSecond]
      ])
    ),
    {
      normal: [100, 20],
      runner: [60, 15],
      tank: [250, 30],
      armoured: [150, 20],
      boss: [800, 35]
    }
  );
});

test('regular zombie spawns can only be normal zombies or runners', () => {
  assert.deepEqual(REGULAR_ZOMBIE_TYPES, ['normal', 'runner']);
});
