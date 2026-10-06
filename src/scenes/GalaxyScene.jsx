import { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { systems } from '../config/galaxy.js';
import { useStore } from '../store/useStore.js';
import { Planet, Station, Portal } from '../three/models/Models.jsx';
import { Debris } from '../three/Space.jsx';
import { audio } from '../services/audioService.js';

function World({ system, quality, isMap }) {
  const ref = useRef();
  const [hover, setHover] = useState(false);
  const reduced = useStore((s) => s.reducedMotion),
    initialized = useStore((s) => s.initialized),
    earned = useStore((s) => s.progress.earned);
  const unlocked = earned >= system.threshold;
  useFrame((_, dt) => {
    if (ref.current) {
      const scale = hover ? 1.06 : 1;
      ref.current.scale.setScalar(
        ref.current.scale.x +
          (scale - ref.current.scale.x) * Math.min(1, dt * 8),
      );
    }
  });
  const select = () => {
    if (!initialized) return;
    if (!unlocked) {
      useStore
        .getState()
        .notify(
          `Earn ${system.threshold.toLocaleString()} lifetime NOVA to unlock ${system.name}.`,
        );
      return;
    }
    useStore
      .getState()
      .navigate(isMap ? 'PLANET' : system.destination, system.id);
  };
  return (
    <group position={system.position}>
      <group
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = initialized ? 'pointer' : 'default';
          if (initialized) audio.play('hover');
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          select();
        }}
      >
        {system.model === 'station' ? (
          <Station />
        ) : system.model === 'portal' ? (
          <Portal />
        ) : (
          <Planet
            color={system.color}
            accent={system.accent}
            radius={system.radius}
            segments={quality.segments}
            rings={system.id === 'nova-prime'}
            reducedMotion={reduced}
          />
        )}
      </group>
      {initialized && (
        <Html
          position={[
            0,
            -system.radius - (system.id === 'nova-prime' ? 0.67 : 0.42),
            0.1,
          ]}
          center
          zIndexRange={[5, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <button
            className={`world-label ${hover ? 'hovered' : ''} ${!unlocked ? 'locked' : ''} ${system.id === 'nova-prime' ? 'home-label' : ''}`}
            onClick={select}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <span className="world-dot" style={{ background: system.accent }} />
            {!unlocked && <span aria-hidden="true">⌑</span>} {system.name}
            <small>
              {system.id === 'nova-prime'
                ? 'YOU ARE HERE'
                : !unlocked
                  ? 'UNEXPLORED'
                  : system.kind.toUpperCase()}
            </small>
          </button>
        </Html>
      )}
    </group>
  );
}

function Orbits() {
  const paths = useMemo(
    () =>
      [3.8, 6, 8.6, 11.4, 15].map((radius) => {
        const points = [];
        for (let i = 0; i <= 180; i++) {
          const angle = (i / 180) * Math.PI * 2;
          points.push(
            Math.cos(angle) * radius + 2,
            Math.sin(angle) * radius * 0.26 - 0.25,
            Math.sin(angle) * radius * 0.37 - 3,
          );
        }
        return new Float32Array(points);
      }),
    [],
  );
  return paths.map((path, index) => (
    <line key={index}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[path, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#9cb8c0"
        transparent
        opacity={0.085 + index * 0.006}
      />
    </line>
  ));
}

export default function GalaxyScene({ quality }) {
  const scene = useStore((s) => s.scene),
    reduced = useStore((s) => s.reducedMotion),
    initialized = useStore((s) => s.initialized);
  return (
    <group>
      <Orbits />
      <Debris count={quality.debris} reducedMotion={reduced} />
      {systems.map((system) => (
        <World
          key={system.id}
          system={system}
          quality={quality}
          isMap={scene === 'MAP'}
        />
      ))}
      <group
        position={[-8.6, -3.8, -6]}
        onClick={(e) => {
          e.stopPropagation();
          if (initialized) useStore.getState().discover();
        }}
      >
        <Portal />
        {initialized && (
          <Html center position={[0, -0.5, 0]} zIndexRange={[5, 0]}>
            <button
              className="signal-label"
              aria-label="Investigate unknown signal"
              onClick={() => useStore.getState().discover()}
            >
              ⌁ <span>UNKNOWN SIGNAL</span>
            </button>
          </Html>
        )}
      </group>
    </group>
  );
}
