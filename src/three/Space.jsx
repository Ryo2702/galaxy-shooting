import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, Object3D } from 'three';

const starVertex = `attribute vec3 aColor; varying vec3 vColor; uniform float size; void main(){vColor=aColor; vec4 p=modelViewMatrix*vec4(position,1.); gl_PointSize=clamp(size*(70./-p.z),1.,4.); gl_Position=projectionMatrix*p;}`;
const starFragment = `varying vec3 vColor; void main(){float d=length(gl_PointCoord-.5); if(d>.5)discard; float a=pow(1.-d*2.,1.8); gl_FragColor=vec4(vColor,a);}`;

export function Space({ quality, reducedMotion }) {
  const group = useRef(),
    shootingStar = useRef();
  const stars = useMemo(() => {
    const count = quality.particles + quality.galaxyParticles;
    const positions = new Float32Array(count * 3),
      colors = new Float32Array(count * 3);
    const palette = [
      new Color('#93b4c5'),
      new Color('#ccebe4'),
      new Color('#eee9d5'),
      new Color('#777e9d'),
    ];
    for (let i = 0; i < count; i++) {
      if (i < quality.particles) {
        positions.set(
          [
            (Math.random() - 0.5) * 170,
            (Math.random() - 0.5) * 105,
            -15 - Math.random() * 75,
          ],
          i * 3,
        );
      } else {
        const r = 3 + Math.random() ** 0.7 * 38,
          arm = ((i % 3) * Math.PI * 2) / 3,
          angle = r * 0.19 + arm + (Math.random() - 0.5) * 1.1;
        const x = Math.cos(angle) * r,
          y = Math.sin(angle) * r * 0.4;
        positions.set(
          [
            x * 0.92 - y * 0.4 + 9,
            x * 0.29 + y * 0.7 + 3,
            -32 + (Math.random() - 0.5) * 6,
          ],
          i * 3,
        );
      }
      const color = palette[i % palette.length];
      const brightness = 0.25 + Math.random() * 0.7;
      colors.set(
        [color.r * brightness, color.g * brightness, color.b * brightness],
        i * 3,
      );
    }
    return { positions, colors };
  }, [quality]);
  useFrame(({ clock }, dt) => {
    if (reducedMotion) return;
    if (group.current) group.current.rotation.z += dt * 0.0007;
    if (shootingStar.current) {
      const phase = clock.elapsedTime % 16;
      shootingStar.current.visible = phase < 1.1;
      shootingStar.current.position.set(14 - phase * 25, 8 - phase * 10, -15);
    }
  });
  return (
    <group>
      <group ref={group}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[stars.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-aColor"
              args={[stars.colors, 3]}
            />
          </bufferGeometry>
          <shaderMaterial
            vertexShader={starVertex}
            fragmentShader={starFragment}
            uniforms={{ size: { value: 2 } }}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
      </group>
      <mesh ref={shootingStar} rotation={[0, 0, -0.4]}>
        <planeGeometry args={[1.6, 0.018]} />
        <meshBasicMaterial
          color="#bcebe6"
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
      {quality.segments > 32 && <Nebula />}
    </group>
  );
}

function Nebula() {
  return (
    <mesh position={[0, 0, -70]}>
      <planeGeometry args={[190, 115]} />
      <shaderMaterial
        depthWrite={false}
        transparent
        vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
        fragmentShader={`
    varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){vec2 p=vUv*6.;float n=0.;float a=.5;for(int i=0;i<5;i++){n+=noise(p)*a;p=p*2.1+3.4;a*=.5;}float band=exp(-pow((vUv.y-.35-vUv.x*.3)*7.,2.));vec3 c=mix(vec3(.025,.044,.065),vec3(.06,.15,.17),n);gl_FragColor=vec4(c,band*n*.8);}
  `}
      />
    </mesh>
  );
}

export function Debris({ count, reducedMotion }) {
  const ref = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const positions = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return {
          x: Math.cos(angle) * (6.2 + Math.random() * 1.6) + 2,
          y: Math.sin(angle) * 1.45 - 0.4,
          z: Math.sin(angle) * 3 - 3,
          size: 0.025 + Math.random() * 0.075,
          r: Math.random() * 6,
        };
      }),
    [count],
  );
  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      const p = positions[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(
        p.r,
        reducedMotion ? p.r : p.r + clock.elapsedTime * 0.025,
        p.r,
      );
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#606f76" roughness={0.9} />
    </instancedMesh>
  );
}
