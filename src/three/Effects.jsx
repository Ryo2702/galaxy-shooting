import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export default function Effects() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef(null);
  useEffect(() => {
    const result = new EffectComposer(gl);
    result.addPass(new RenderPass(scene, camera));
    result.addPass(new UnrealBloomPass(new Vector2(256, 256), 0.3, 0.5, 0.7));
    result.addPass(new OutputPass());
    result.setPixelRatio(Math.min(gl.getPixelRatio(), 1));
    result.setSize(gl.domElement.clientWidth, gl.domElement.clientHeight);
    composer.current = result;
    return () => {
      composer.current = null;
      result.passes.forEach((pass) => pass.dispose?.());
      result.dispose();
    };
  }, [gl, scene, camera]);
  useEffect(() => {
    composer.current?.setSize(size.width, size.height);
  }, [size]);
  useFrame((_, dt) => {
    if (composer.current) composer.current.render(dt);
    else gl.render(scene, camera);
  }, 1);
  return null;
}
