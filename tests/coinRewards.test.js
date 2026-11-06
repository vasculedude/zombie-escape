import test from 'node:test';
import assert from 'node:assert/strict';

import { getSurvivalCoinReward } from '../src/utils/coinRewards.js';

test('survival rewards apply the requested tiers and leave gaps unrewarded', () => {
  assert.equal(getSurvivalCoinReward(100, 59), 25);
  assert.equal(getSurvivalCoinReward(100, 60), 0);
  assert.equal(getSurvivalCoinReward(100, 179), 0);
  assert.equal(getSurvivalCoinReward(100, 180), 50);
  assert.equal(getSurvivalCoinReward(100, 300), 50);
  assert.equal(getSurvivalCoinReward(100, 301), 0);
  assert.equal(getSurvivalCoinReward(100, 539), 0);
  assert.equal(getSurvivalCoinReward(100, 540), 1100);
});

test('fractional coin rewards round down to whole coins', () => {
  assert.equal(getSurvivalCoinReward(3, 30), 0);
  assert.equal(getSurvivalCoinReward(3, 180), 1);
});
