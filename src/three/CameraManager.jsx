import { useEffect, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useStore } from '../store/useStore.js';
import { cameraConfig, systems } from '../config/galaxy.js';

gsap.registerPlugin(ScrollTrigger);

export function CameraManager() {
  const { camera, pointer, size } = useThree();
  const scene = useStore((s) => s.scene),
    selected = useStore((s) => s.selectedSystem),
    reduced = useStore((s) => s.reducedMotion);
  const target = useMemo(() => new Vector3(), []);
  const base = useMemo(() => new Vector3(0, 2, 30), []);
  const scroll = useRef({ value: 0 });
  const transitioning = useRef(true);
  useEffect(() => {
    let preset = cameraConfig[scene] || cameraConfig.GALAXY;
    const system = systems.find((s) => s.id === selected) || systems[0];
    if (
      scene === 'PLANET' ||
      (system.destination === scene &&
        ['WALLET', 'TOKEN', 'ABOUT', 'LEADERBOARD'].includes(scene))
    ) {
      preset = {
        position: [
          system.position[0],
          system.position[1] + 1,
          system.position[2] + 8,
        ],
        target: system.position,
      };
    }
    const [x, y, originalZ] = preset.position;
    const z = originalZ + (size.width < 768 && scene !== 'GAME' ? 8 : 0);
    transitioning.current = true;
    const timeline = gsap.timeline({
      onComplete: () => {
        transitioning.current = false;
      },
    });
    timeline.to(
      base,
      {
        x,
        y,
        z,
        duration: reduced
          ? 0.05
          : scene === 'INTRO'
            ? 2.6
            : cameraConfig.duration,
        ease: 'power2.inOut',
      },
      0,
    );
    timeline.to(
      target,
      {
        x: preset.target[0],
        y: preset.target[1],
        z: preset.target[2],
        duration: reduced ? 0.05 : cameraConfig.duration,
        ease: 'power2.inOut',
      },
      0,
    );
    return () => timeline.kill();
  }, [scene, selected, camera, reduced, size.width, base, target]);
  useEffect(() => {
    const scroller = document.getElementById('orbit-scroll');
    if (!scroller || scene !== 'GALAXY' || reduced) {
      scroll.current.value = 0;
      return;
    }
    const tween = gsap.to(scroll.current, {
      value: 1,
      ease: 'none',
      scrollTrigger: {
        scroller,
        trigger: scroller.firstElementChild,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [scene, reduced]);
  useFrame((_, dt) => {
    const parallax =
      !reduced &&
      scene !== 'GAME' &&
      !transitioning.current &&
      size.width >= 768;
    camera.position.lerp(
      newPosition.set(
        base.x + (parallax ? pointer.x * 0.2 : 0),
        base.y + (parallax ? pointer.y * 0.13 : 0),
        base.z - scroll.current.value * 2,
      ),
      1 - Math.exp(-dt * 7),
    );
    camera.lookAt(target);
  });
  return null;
}
const newPosition = new Vector3();
