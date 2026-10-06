import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Color,
  Object3D,
  Plane,
  Raycaster,
  Sphere,
  Vector2,
  Vector3,
} from 'three';
import { createGame } from '../game/engine.js';
import { input, resetInput } from '../game/input.js';
import { gameConfig } from '../config/game.js';
import { models } from '../config/models.js';
import {
  Asteroid,
  Enemy,
  Projectile,
  Spaceship,
} from '../three/models/Models.jsx';
import { useStore } from '../store/useStore.js';
import { audio } from '../services/audioService.js';

function onGameEvent(event) {
  const store = useStore.getState();
  if (event.type === 'kill')
    store.rewardKill({
      type: event.enemyType,
      score: event.score,
      combo: event.combo,
      milestone: event.milestone,
    });
  if (event.type === 'damage') {
    useStore.setState({ health: event.health, combo: 1 });
    audio.play('alert');
  }
  if (event.type === 'combo') useStore.setState({ combo: event.combo });
  if (event.type === 'wave') {
    useStore.setState({ wave: event.wave });
    store.notify(`Wave ${event.wave} · Incoming contacts`);
    audio.play('alert');
  }
  if (event.type === 'shot') audio.play('laser');
  if (event.type === 'over') store.finishGame();
}

export default function GameScene() {
  const gameId = useStore((s) => s.gameId),
    status = useStore((s) => s.gameStatus);
  const game = useMemo(() => createGame(onGameEvent), [gameId]);
  const { camera, gl, size } = useThree();
  const asteroidMesh = useRef(),
    droneMesh = useRef(),
    bullets = useRef(),
    explosions = useRef(),
    ship = useRef(),
    reticle = useRef();
  const customEnemies = useRef([]),
    customBullets = useRef([]);
  const objects = useMemo(
    () => ({
      dummy: new Object3D(),
      ray: new Raycaster(),
      pointer: new Vector2(),
      plane: new Plane(new Vector3(0, 0, 1), 8),
      target: new Vector3(),
      hit: new Vector3(),
      sphere: new Sphere(),
    }),
    [],
  );
  useEffect(() => {
    useStore.setState({ gameReady: true });
    const keydown = (e) => {
      if (e.target.closest('button, input, select, textarea, [role="dialog"]'))
        return;
      if (
        [
          'Space',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
        ].includes(e.code)
      ) {
        e.preventDefault();
        input.keys.add(e.code);
      }
    };
    const keyup = (e) => input.keys.delete(e.code);
    const pointermove = (e) => {
      if (e.target.closest('button, [role="dialog"], nav')) return;
      const rect = gl.domElement.getBoundingClientRect();
      input.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      input.pointerY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      input.pointerActive = true;
    };
    const pointerdown = (e) => {
      if (
        e.button === 0 &&
        !e.target.closest('button, [role="dialog"], nav, header')
      ) {
        pointermove(e);
        input.shoot = true;
      }
    };
    const pointerup = () => {
      input.shoot = false;
    };
    const blur = () => {
      resetInput();
      if (useStore.getState().gameStatus === 'playing')
        useStore.getState().pauseGame();
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('pointermove', pointermove);
    window.addEventListener('pointerdown', pointerdown);
    window.addEventListener('pointerup', pointerup);
    window.addEventListener('pointercancel', pointerup);
    window.addEventListener('blur', blur);
    return () => {
      resetInput();
      useStore.setState({ gameReady: false });
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('pointermove', pointermove);
      window.removeEventListener('pointerdown', pointerdown);
      window.removeEventListener('pointerup', pointerup);
      window.removeEventListener('pointercancel', pointerup);
      window.removeEventListener('blur', blur);
    };
  }, [gl]);
  useFrame((_, elapsed) => {
    const { dummy, ray, pointer, plane, target, sphere, hit } = objects;
    if (status === 'playing') {
      if (input.pointerActive) {
        pointer.set(input.pointerX, input.pointerY);
        ray.setFromCamera(pointer, camera);
        ray.ray.intersectPlane(plane, target);
        let nearest = Infinity;
        for (const enemy of game.enemies) {
          if (!enemy.active) continue;
          sphere.center.set(enemy.x, enemy.y, enemy.z);
          sphere.radius = enemy.radius;
          if (ray.ray.intersectSphere(sphere, hit)) {
            const distance = ray.ray.origin.distanceToSquared(hit);
            if (distance < nearest) {
              nearest = distance;
              target.copy(sphere.center);
            }
          }
        }
      } else target.set(game.player.x, game.player.y, -8);
      game.step(elapsed, {
        boundX: Math.max(
          0.5,
          (Math.tan((camera.fov * Math.PI) / 360) *
            (camera.position.z - gameConfig.playerZ) *
            size.width) /
            size.height -
            0.4,
        ),
        dx:
          Number(input.keys.has('KeyD') || input.keys.has('ArrowRight')) -
          Number(input.keys.has('KeyA') || input.keys.has('ArrowLeft')),
        dy:
          Number(input.keys.has('KeyW') || input.keys.has('ArrowUp')) -
          Number(input.keys.has('KeyS') || input.keys.has('ArrowDown')),
        shoot: input.shoot || input.keys.has('Space'),
        aimX: target.x,
        aimY: target.y,
        aimZ: target.z,
      });
    }
    if (ship.current) {
      ship.current.position.set(game.player.x, game.player.y, game.player.z);
      ship.current.rotation.z =
        -(input.pointerActive ? target.x - game.player.x : 0) * 0.025;
    }
    if (reticle.current) {
      reticle.current.position.copy(target);
      reticle.current.visible = status === 'playing';
    }
    for (let i = 0; i < game.enemies.length; i++) {
      const enemy = game.enemies[i];
      dummy.position.set(enemy.x, enemy.y, enemy.z);
      dummy.rotation.set(
        enemy.rotation,
        enemy.rotation * 0.7,
        enemy.rotation * 0.4,
      );
      dummy.scale.setScalar(
        enemy.active && enemy.type === 'asteroid' ? enemy.radius : 0,
      );
      dummy.updateMatrix();
      asteroidMesh.current?.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(
        enemy.active && enemy.type === 'drone' ? enemy.radius : 0,
      );
      dummy.updateMatrix();
      droneMesh.current?.setMatrixAt(i, dummy.matrix);
      const custom = customEnemies.current[i];
      if (custom) {
        custom.visible = enemy.active;
        custom.position.copy(dummy.position);
        custom.rotation.copy(dummy.rotation);
        custom.scale.setScalar(enemy.radius);
        custom.children[0].visible = enemy.type === 'asteroid';
        custom.children[1].visible = enemy.type === 'drone';
      }
    }
    for (let i = 0; i < game.projectiles.length; i++) {
      const bullet = game.projectiles[i];
      dummy.position.set(bullet.x, bullet.y, bullet.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(
        bullet.active ? 0.055 : 0,
        bullet.active ? 0.055 : 0,
        bullet.active ? 0.55 : 0,
      );
      dummy.updateMatrix();
      bullets.current?.setMatrixAt(i, dummy.matrix);
      const custom = customBullets.current[i];
      if (custom) {
        custom.visible = bullet.active;
        custom.position.copy(dummy.position);
      }
    }
    for (let i = 0; i < game.explosions.length; i++) {
      const effect = game.explosions[i];
      dummy.position.set(effect.x, effect.y, effect.z);
      dummy.scale.setScalar(
        effect.active ? (1 - effect.life / 0.55) * 2 + 0.1 : 0,
      );
      dummy.updateMatrix();
      explosions.current?.setMatrixAt(i, dummy.matrix);
      if (effect.active)
        explosions.current?.setColorAt(
          i,
          explosionColor.setRGB(
            effect.life * 2,
            effect.life * 1.3,
            effect.life * 0.6,
          ),
        );
    }
    for (const ref of [asteroidMesh, droneMesh, bullets, explosions])
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    if (explosions.current?.instanceColor)
      explosions.current.instanceColor.needsUpdate = true;
  });
  const customModels = models.enemy || models.asteroid;
  return (
    <group>
      <group ref={ship}>
        <Spaceship />
      </group>
      <mesh ref={reticle}>
        <torusGeometry args={[0.22, 0.008, 6, 24]} />
        <meshBasicMaterial color="#b7eacf" transparent opacity={0.55} />
      </mesh>
      {customModels ? (
        game.enemies.map((_, i) => (
          <group
            key={i}
            ref={(ref) => {
              customEnemies.current[i] = ref;
            }}
          >
            <group>
              <Asteroid />
            </group>
            <group>
              <Enemy />
            </group>
          </group>
        ))
      ) : (
        <>
          <instancedMesh
            ref={asteroidMesh}
            args={[null, null, gameConfig.enemyPoolSize]}
            frustumCulled={false}
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color="#a59c8d"
              flatShading
              roughness={0.88}
            />
          </instancedMesh>
          <instancedMesh
            ref={droneMesh}
            args={[null, null, gameConfig.enemyPoolSize]}
            frustumCulled={false}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#d4a299"
              emissive="#ad3430"
              emissiveIntensity={0.7}
              metalness={0.6}
              roughness={0.4}
            />
          </instancedMesh>
        </>
      )}
      {models.projectile ? (
        game.projectiles.map((_, i) => (
          <group
            key={i}
            ref={(ref) => {
              customBullets.current[i] = ref;
            }}
          >
            <Projectile />
          </group>
        ))
      ) : (
        <instancedMesh
          ref={bullets}
          args={[null, null, gameConfig.projectilePoolSize]}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#a8ffdf" />
        </instancedMesh>
      )}
      <instancedMesh
        ref={explosions}
        args={[null, null, gameConfig.explosionPoolSize]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.8}
        />
      </instancedMesh>
      <gridHelper
        args={[70, 24, '#24484e', '#102a35']}
        position={[0, -5, -14]}
      />
    </group>
  );
}
const explosionColor = new Color();
