import { lazy, Suspense, useEffect, useRef } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useStore } from './store/useStore.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import {
  Header,
  EntryAndHub,
  BottomHud,
  MapHud,
  Notifications,
} from './components/Hud.jsx';
import GameHud from './components/GameHud.jsx';

const Universe = lazy(() => import('./three/Universe.jsx'));
const Panels = lazy(() => import('./components/Panels.jsx'));

function NoWebGL() {
  useEffect(() => {
    useStore.setState({ ready: true, webglAvailable: false });
  }, []);
  return (
    <div className="fallback-universe">
      <div className="fallback-planet" />
      <p>
        3D rendering is unavailable. Your star chart, wallet, and missions are
        still here.
      </p>
    </div>
  );
}

export default function App() {
  const scene = useStore((s) => s.scene),
    panel = useStore((s) => s.panel),
    initialized = useStore((s) => s.initialized),
    reduced = useStore((s) => s.reducedMotion),
    webgl = useStore((s) => s.webglAvailable);
  const scrollRef = useRef();
  useEffect(() => {
    const keyboard = (e) => {
      if (e.key === 'Escape') {
        const s = useStore.getState();
        if (s.panel) s.closePanel();
        else if (s.scene === 'GAME') s.pauseGame();
        else if (s.initialized && s.scene !== 'GALAXY') s.navigate('GALAXY');
      }
    };
    const wheel = (e) => {
      const s = useStore.getState();
      if (
        s.scene === 'GALAXY' &&
        !s.panel &&
        !s.reducedMotion &&
        scrollRef.current
      ) {
        e.preventDefault();
        scrollRef.current.scrollTop += e.deltaY;
      }
    };
    const visibility = () => {
      if (document.hidden && useStore.getState().gameStatus === 'playing')
        useStore.getState().pauseGame();
    };
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionChange = (e) => useStore.getState().setReducedMotion(e.matches);
    window.addEventListener('keydown', keyboard);
    window.addEventListener('wheel', wheel, { passive: false });
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', motionChange);
    return () => {
      window.removeEventListener('keydown', keyboard);
      window.removeEventListener('wheel', wheel);
      document.removeEventListener('visibilitychange', visibility);
      media.removeEventListener('change', motionChange);
    };
  }, []);
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <main
        className={`experience ${initialized ? 'initialized' : 'uninitialized'} ${scene === 'GAME' ? 'in-combat' : ''} ${panel ? 'panel-open' : ''}`}
      >
        <div
          className="canvas-wrap"
          aria-label="Interactive three-dimensional galaxy"
        >
          <ErrorBoundary fallback={<NoWebGL />}>
            {webgl ? (
              <Suspense fallback={<div className="canvas-loading" />}>
                <Universe />
              </Suspense>
            ) : (
              <NoWebGL />
            )}
          </ErrorBoundary>
        </div>
        <div className="scene-vignette" />
        <div className="film-grain" />
        <div className="screen-edge top-edge" />
        <div className="screen-edge bottom-edge" />
        <div id="orbit-scroll" ref={scrollRef} aria-hidden="true">
          <div />
        </div>
        <div className="hud-layer" inert={panel ? true : undefined}>
          <Header />
          <EntryAndHub />
          <MapHud />
          {scene === 'GAME' && <GameHud />}
          <BottomHud />
        </div>
        <AnimatePresence>
          {panel && (
            <Suspense
              fallback={
                <div className="panel-loading">ESTABLISHING UPLINK…</div>
              }
            >
              <Panels key={panel} panel={panel} />
            </Suspense>
          )}
        </AnimatePresence>
        <Notifications />
        <motion.div
          className="intro-darkness"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 2, delay: 0.15 }}
        />
      </main>
    </MotionConfig>
  );
}
