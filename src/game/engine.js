import { gameConfig as config } from '../config/game.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const entity = () => ({
  active: false,
  x: 0,
  y: 0,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  health: 1,
  radius: 0.5,
  rotation: 0,
  life: 0,
  type: 'asteroid',
});

export function segmentHitsSphere(a, b, target, radius) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    dz = b.z - a.z;
  const length = dx * dx + dy * dy + dz * dz;
  const t = length
    ? clamp(
        ((target.x - a.x) * dx +
          (target.y - a.y) * dy +
          (target.z - a.z) * dz) /
          length,
        0,
        1,
      )
    : 0;
  return (
    (a.x + dx * t - target.x) ** 2 +
      (a.y + dy * t - target.y) ** 2 +
      (a.z + dz * t - target.z) ** 2 <=
    radius ** 2
  );
}

export function createGame(onEvent = () => {}, random = Math.random) {
  const game = {
    enemies: Array.from({ length: config.enemyPoolSize }, entity),
    projectiles: Array.from({ length: config.projectilePoolSize }, entity),
    explosions: Array.from({ length: config.explosionPoolSize }, entity),
    player: { x: 0, y: -1.5, z: config.playerZ },
    time: 0,
    score: 0,
    health: config.playerHealth,
    combo: 1,
    lastKill: -10,
    wave: 1,
    spawnTimer: 0.25,
    shotTimer: 0,
    ended: false,
  };
  const previous = { x: 0, y: 0, z: 0 };
  game.spawn = (overrides = {}) => {
    const enemy = game.enemies.find((e) => !e.active);
    if (!enemy) return null;
    const drone = random() > 0.66;
    Object.assign(enemy, {
      active: true,
      type: drone ? 'drone' : 'asteroid',
      x: (random() - 0.5) * config.fieldWidth * 1.5,
      y: (random() - 0.5) * config.fieldHeight * 1.35,
      z: config.spawnZ,
      health: drone ? config.droneHealth : config.asteroidHealth,
      radius: drone ? 0.55 : 0.65 + random() * 0.25,
      rotation: random() * Math.PI,
      ...overrides,
    });
    return enemy;
  };
  game.explode = (enemy) => {
    const effect = game.explosions.find((e) => !e.active);
    if (effect)
      Object.assign(effect, {
        active: true,
        x: enemy.x,
        y: enemy.y,
        z: enemy.z,
        life: 0.55,
        radius: enemy.radius,
      });
  };
  game.step = (elapsed, input = {}) => {
    if (game.ended) return;
    const dt = Math.min(Math.max(elapsed, 0), 0.05);
    game.time += dt;
    const wave = 1 + Math.floor(game.time / config.difficultyInterval);
    if (wave !== game.wave) {
      game.wave = wave;
      onEvent({ type: 'wave', wave });
    }
    if (game.time - game.lastKill > config.comboWindow && game.combo !== 1) {
      game.combo = 1;
      onEvent({ type: 'combo', combo: 1 });
    }
    const boundX = Math.min(
      config.fieldWidth / 2,
      input.boundX ?? config.fieldWidth / 2,
    );
    game.player.x = clamp(
      game.player.x + (input.dx || 0) * config.playerSpeed * dt,
      -boundX,
      boundX,
    );
    game.player.y = clamp(
      game.player.y + (input.dy || 0) * config.playerSpeed * dt,
      -config.fieldHeight / 2,
      config.fieldHeight / 2,
    );
    game.spawnTimer -= dt;
    game.shotTimer -= dt;
    if (game.spawnTimer <= 0) {
      game.spawn();
      game.spawnTimer =
        config.spawnInterval / (1 + (wave - 1) * config.difficultyMultiplier);
    }
    if (input.shoot && game.shotTimer <= 0) {
      const bullet = game.projectiles.find((p) => !p.active);
      if (bullet) {
        const dx = (input.aimX ?? game.player.x) - game.player.x,
          dy = (input.aimY ?? game.player.y) - game.player.y,
          dz = (input.aimZ ?? -8) - game.player.z;
        const distance = Math.hypot(dx, dy, dz);
        Object.assign(bullet, {
          active: true,
          x: game.player.x,
          y: game.player.y,
          z: game.player.z - 0.6,
          vx: (dx / distance) * config.projectileSpeed,
          vy: (dy / distance) * config.projectileSpeed,
          vz: (dz / distance) * config.projectileSpeed,
        });
        game.shotTimer = config.fireInterval;
        onEvent({ type: 'shot' });
      }
    }
    for (const enemy of game.enemies) {
      if (!enemy.active) continue;
      enemy.z +=
        config.enemySpeed * (1 + (wave - 1) * config.difficultyMultiplier) * dt;
      enemy.rotation += dt * (enemy.type === 'drone' ? 0.3 : 0.5);
      if (enemy.z > config.playerZ + 1) {
        enemy.active = false;
        game.health = Math.max(0, game.health - config.hitDamage);
        game.combo = 1;
        onEvent({ type: 'damage', health: game.health });
        if (game.health <= 0) {
          game.ended = true;
          onEvent({ type: 'over' });
          return;
        }
      }
    }
    for (const bullet of game.projectiles) {
      if (!bullet.active) continue;
      previous.x = bullet.x;
      previous.y = bullet.y;
      previous.z = bullet.z;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.z += bullet.vz * dt;
      if (bullet.z < config.spawnZ - 4) {
        bullet.active = false;
        continue;
      }
      // ponytail: bounded 64×28 pool scan; use a spatial grid if the pools grow significantly.
      for (const enemy of game.enemies) {
        if (
          !enemy.active ||
          !segmentHitsSphere(previous, bullet, enemy, enemy.radius + 0.15)
        )
          continue;
        bullet.active = false;
        enemy.health -= config.weaponDamage;
        if (enemy.health <= 0) {
          enemy.active = false;
          game.explode(enemy);
          game.combo =
            game.time - game.lastKill < config.comboWindow
              ? Math.min(config.maxCombo, game.combo + 1)
              : 1;
          game.lastKill = game.time;
          const oldScore = game.score;
          game.score +=
            (enemy.type === 'drone'
              ? config.droneScore
              : config.asteroidScore) * game.combo;
          onEvent({
            type: 'kill',
            enemyType: enemy.type,
            score: game.score,
            combo: game.combo,
            milestone:
              Math.floor(game.score / config.milestoneScore) -
              Math.floor(oldScore / config.milestoneScore),
          });
        }
        break;
      }
    }
    for (const effect of game.explosions)
      if (effect.active) {
        effect.life -= dt;
        if (effect.life <= 0) effect.active = false;
      }
  };
  return game;
}
