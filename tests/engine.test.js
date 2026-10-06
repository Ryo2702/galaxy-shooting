import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, segmentHitsSphere } from '../src/game/engine.js';
import { gameConfig } from '../src/config/game.js';
import {
  MockCryptoService,
  sanitizeProgress,
  emptyProgress,
} from '../src/services/cryptoService.js';
import { resolveQuality } from '../src/config/graphics.js';
import { useStore } from '../src/store/useStore.js';

test('fast shots cannot tunnel through targets; pooled kills award once and drones take two hits', () => {
  assert.equal(
    segmentHitsSphere(
      { x: 0, y: 0, z: 4 },
      { x: 0, y: 0, z: -20 },
      { x: 0, y: 0, z: -8 },
      0.5,
    ),
    true,
  );
  assert.equal(
    segmentHitsSphere(
      { x: 2, y: 0, z: 4 },
      { x: 2, y: 0, z: -20 },
      { x: 0, y: 0, z: -8 },
      0.5,
    ),
    false,
  );
  const events = [];
  const game = createGame(
    (e) => events.push(e),
    () => 0.5,
  );
  game.spawnTimer = 100;
  const drone = game.spawn({ type: 'drone', x: 0, y: -1.5, z: -2, health: 2 });
  const first = game.projectiles[0];
  const enemyCount = game.enemies.length;
  for (let i = 0; i < 32; i++) game.step(0.025, { shoot: true });
  assert.equal(drone.active, false);
  assert.equal(events.filter((e) => e.type === 'kill').length, 1);
  assert.equal(game.score, gameConfig.droneScore);
  assert.equal(game.enemies.length, enemyCount);
  assert.equal(game.projectiles[0], first);
  assert.equal(game.spawn({ x: 1 }), drone, 'inactive enemy slots are reused');
});

test('missed enemies damage the hull, end the game once, and freeze the simulation', () => {
  const events = [],
    game = createGame((e) => events.push(e));
  game.spawnTimer = 100;
  for (let i = 0; i < 5; i++) {
    game.spawn({ z: gameConfig.playerZ + 2 });
    game.step(0.016);
  }
  assert.equal(game.health, 0);
  assert.equal(game.ended, true);
  const time = game.time;
  game.step(1, { shoot: true });
  assert.equal(game.time, time);
  assert.equal(events.filter((e) => e.type === 'over').length, 1);
});

test('combo expires, motion is bounded, and difficulty increases', () => {
  const game = createGame();
  game.spawnTimer = 1000;
  game.combo = 4;
  for (let i = 0; i < 410; i++) game.step(0.05, { dx: 1, dy: 1 });
  assert.equal(game.combo, 1);
  assert.equal(game.player.x, gameConfig.fieldWidth / 2);
  assert.equal(game.player.y, gameConfig.fieldHeight / 2);
  assert.equal(game.wave, 2);
});

test('wallet validates rewards and recovers from malformed local data', () => {
  const wallet = new MockCryptoService();
  const credited = wallet.credit(emptyProgress(), 25, 'Test flight');
  assert.equal(credited.balance, 25);
  assert.equal(credited.transactions[0].amount, 25);
  assert.throws(() => wallet.credit(credited, -1, 'bad'));
  assert.throws(() => wallet.credit(credited, 1.1, 'bad'));
  assert.deepEqual(sanitizeProgress(null), emptyProgress());
  const recovered = sanitizeProgress({
    balance: -50,
    earned: Infinity,
    completed: ['one', 'one', 7],
    transactions: [{ amount: '100' }, null],
  });
  assert.equal(recovered.balance, 0);
  assert.equal(recovered.earned, 0);
  assert.deepEqual(recovered.completed, ['one']);
  assert.deepEqual(recovered.transactions, []);
});

test('auto graphics protects mobile and constrained devices while manual choices win', () => {
  assert.equal(
    resolveQuality('AUTO', { hardwareConcurrency: 16, deviceMemory: 16 }, 390),
    'LOW',
  );
  assert.equal(resolveQuality('AUTO', { hardwareConcurrency: 2 }, 1440), 'LOW');
  assert.equal(
    resolveQuality('AUTO', { hardwareConcurrency: 8 }, 1440),
    'HIGH',
  );
  assert.equal(
    resolveQuality('MEDIUM', { hardwareConcurrency: 2 }, 390),
    'MEDIUM',
  );
});

test('missions credit once, discovery cannot be farmed, and restarting clears only flight state', () => {
  useStore.setState({
    progress: emptyProgress(),
    sessionEarnings: 0,
    gameStatus: 'playing',
    score: 0,
  });
  for (let i = 1; i <= 10; i++)
    useStore
      .getState()
      .rewardKill({ type: 'asteroid', score: i * 100, combo: 1, milestone: 0 });
  assert.equal(useStore.getState().progress.balance, 200);
  assert.deepEqual(useStore.getState().progress.completed, ['first-contact']);
  useStore
    .getState()
    .rewardKill({ type: 'asteroid', score: 1100, combo: 1, milestone: 0 });
  assert.equal(useStore.getState().progress.balance, 210);
  useStore.getState().discover();
  useStore.getState().discover();
  assert.equal(useStore.getState().progress.balance, 1210);
  useStore.getState().finishGame();
  useStore.getState().finishGame();
  assert.equal(useStore.getState().progress.flights.length, 1);
  useStore.getState().startGame();
  assert.equal(useStore.getState().score, 0);
  assert.equal(useStore.getState().health, gameConfig.playerHealth);
  assert.equal(useStore.getState().progress.balance, 1210);
});
