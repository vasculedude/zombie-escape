import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { io as createClient } from 'socket.io-client';

import { registerMultiplayer } from '../server/multiplayer.js';
import {
  STARTER_WEAPON_CATALOG,
  WEAPON_CATALOG
} from '../server/weaponCatalog.js';

const serverRequire = createRequire(new URL('../server/package.json', import.meta.url));
const { Server } = serverRequire('socket.io');

function withTimeout(promise, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), 5000);
    timer.unref();
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

test('authenticated players join one shared world with all weapon drops', async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);
  const clients = [];
  registerMultiplayer(io, {
    async query(_query, [token]) {
      return {
        rows: [{
          username: `Player-${token}`,
          username_key: token,
          selected_character: 'survivor',
          owned_weapons: [],
          spawn_weapons: STARTER_WEAPON_CATALOG.map(weapon => weapon.id),
          owned_specials: [],
          spawn_specials: []
        }]
      };
    }
  });

  try {
    httpServer.listen(0, '127.0.0.1');
    await once(httpServer, 'listening');
    const url = `http://127.0.0.1:${httpServer.address().port}`;

    async function join(token) {
      const client = createClient(url, {
        autoConnect: false,
        auth: { token },
        transports: ['websocket']
      });
      clients.push(client);
      const connected = once(client, 'connect');
      client.connect();
      await withTimeout(
        connected,
        'Timed out connecting to multiplayer.'
      );
      return withTimeout(
        new Promise((resolve, reject) => {
          client.emit('session:join', result => {
            if (!result?.success) {
              reject(new Error(result?.message || 'Could not join multiplayer.'));
              return;
            }
            resolve(result.state);
          });
        }),
        'Timed out joining multiplayer.'
      );
    }

    const firstWorld = await join('first');
    const secondWorld = await join('second');
    assert.equal(firstWorld.players.length, 1);
    assert.equal(secondWorld.players.length, 2);
    assert.deepEqual(
      firstWorld.zombies.map(zombie => zombie.id).sort(),
      secondWorld.zombies.map(zombie => zombie.id).sort()
    );

    const expectedWeaponIds = [
      ...STARTER_WEAPON_CATALOG,
      ...WEAPON_CATALOG
    ].map(weapon => weapon.id);
    const availablePickupIds = new Set(
      secondWorld.pickups
        .filter(pickup => pickup.kind === 'weapon')
        .map(pickup => pickup.type)
    );
    for (const weaponId of expectedWeaponIds) {
      assert.ok(availablePickupIds.has(weaponId), `Missing multiplayer weapon drop: ${weaponId}`);
    }

    const updatedState = new Promise(resolve => {
      const onState = state => {
        const movedPlayer = state.players.find(player => player.id === clients[0].id);
        if (movedPlayer?.x === 450) {
          clients[1].off('world:state', onState);
          resolve(state);
        }
      };
      clients[1].on('world:state', onState);
    });
    clients[0].emit('player:state', {
      x: 450,
      y: 300,
      angle: 0.5,
      weaponId: null
    });
    const sharedState = await withTimeout(
      updatedState,
      'Timed out waiting for shared player state.'
    );
    const movedPlayer = sharedState.players.find(player => player.id === clients[0].id);
    assert.equal(movedPlayer.x, 450);
    assert.equal(movedPlayer.angle, 0.5);

    const swordShot = once(clients[1], 'combat:shot').then(([shot]) => shot);
    clients[0].emit('combat:attack', {
      kind: 'sword',
      angle: 0.5,
      weaponId: 'sword'
    });
    assert.equal((await withTimeout(swordShot, 'Sword attack was not broadcast.')).weaponId, 'sword');

    await new Promise(resolve => setTimeout(resolve, 450));
    const secondSwordShot = once(clients[1], 'combat:shot').then(([shot]) => shot);
    clients[0].emit('combat:attack', {
      kind: 'sword',
      angle: 0.5,
      weaponId: 'sword'
    });
    assert.equal((await withTimeout(secondSwordShot, 'Sword could not attack again after its dash cooldown.')).weaponId, 'sword');

    const weaponSwap = once(clients[0], 'world:weaponSwap').then(([result]) => result);
    const swapResult = await new Promise(resolve => {
      clients[0].emit('world:swapWeapon', { weaponId: 'sword' }, resolve);
    });
    assert.equal(swapResult.success, true);
    assert.equal((await withTimeout(weaponSwap, 'Dropped weapon was not reported.')).droppedWeaponId, 'sword');
  } finally {
    for (const client of clients) client.disconnect();
    await new Promise(resolve => io.close(resolve));
  }
});
