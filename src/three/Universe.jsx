import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../store/useStore.js';
import { graphicsPresets, resolveQuality } from '../config/graphics.js';
import { Space } from './Space.jsx';
import { CameraManager } from './CameraManager.jsx';
import { ModelPreloader } from './models/Models.jsx';
import { ErrorBoundary } from '../components/ErrorBoundary.jsx';

const GalaxyScene = lazy(() => import('../scenes/GalaxyScene.jsx'));
const GameScene = lazy(() => import('../scenes/GameScene.jsx'));
const Effects = lazy(() => import('./Effects.jsx'));

function ReadyAndPerformance({ qualityName }) {
  const frames = useRef({ time: 0, count: 0, warmup: 0 }),
    ready = useRef(false);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const context = gl.getContext();
    const debug = context.getExtension('WEBGL_debug_renderer_info');
    const renderer = debug
      ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : '';
    if (
      useStore.getState().quality === 'AUTO' &&
      /swiftshader|llvmpipe|software/i.test(renderer)
    )
      useStore.setState({ autoQuality: 'LOW' });
    const lost = (e) => {
      e.preventDefault();
      useStore.setState({ webglAvailable: false, ready: true });
      if (useStore.getState().gameStatus === 'playing')
        useStore.getState().pauseGame();
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl]);
  useFrame((_, dt) => {
    if (!ready.current) {
      ready.current = true;
      useStore.setState({ ready: true });
    }
    const f = frames.current;
    if (document.hidden || useStore.getState().quality !== 'AUTO') return;
    f.warmup += dt;
    if (f.warmup < 5) return;
    f.time += dt;
    f.count++;
    if (f.time > 4) {
      if (f.count / f.time < 30 && qualityName !== 'LOW')
        useStore.setState({
          autoQuality: qualityName === 'HIGH' ? 'MEDIUM' : 'LOW',
        });
      f.time = 0;
      f.count = 0;
    }
  });
  return null;
}
export default function Universe() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = (event) => setMobile(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const scene = useStore((s) => s.scene),
    mode = useStore((s) => s.quality),
    autoQuality = useStore((s) => s.autoQuality),
    reduced = useStore((s) => s.reducedMotion);
  const qualityName =
    mode === 'AUTO' && mobile
      ? 'LOW'
      : mode === 'AUTO' && autoQuality
        ? autoQuality
        : resolveQuality(mode);
  const quality = graphicsPresets[qualityName];
  return (
    <Canvas
      camera={{ position: [0, 2, 30], fov: 48, near: 0.1, far: 220 }}
      dpr={[1, Math.min(quality.dpr, mobile ? 1.25 : 1.75)]}
      gl={{
        antialias: qualityName !== 'LOW',
        powerPreference: 'high-performance',
        alpha: false,
      }}
      fallback={<span>Your browser needs WebGL to render the galaxy.</span>}
    >
      <color attach="background" args={['#05090f']} />
      <fog attach="fog" args={['#05090f', 45, 140]} />
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[-8, 8, 10]}
        intensity={2.4}
        color="#d8eee7"
      />
      <pointLight position={[5, -3, 7]} intensity={25} color="#5f9fbb" />
      <Space quality={quality} reducedMotion={reduced} />
      <CameraManager />
      <ModelPreloader />
      <ErrorBoundary
        key={scene === 'GAME' ? 'game' : 'galaxy'}
        onError={() =>
          useStore
            .getState()
            .notify(
              'This sector could not load. Return to the galaxy to retry.',
            )
        }
      >
        <Suspense fallback={null}>
          {scene === 'GAME' ? <GameScene /> : <GalaxyScene quality={quality} />}
          <ReadyAndPerformance qualityName={qualityName} />
        </Suspense>
      </ErrorBoundary>
      {quality.bloom && !reduced && !mobile && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        </ErrorBoundary>
      )}
    </Canvas>
  );
}
