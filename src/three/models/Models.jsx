import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, Color, DoubleSide } from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { models, modelCompression } from '../../config/models.js';
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx';

const noise = `
float hash(vec3 p) { p=fract(p*.3183099+vec3(.1,.2,.3)); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise3(vec3 p) { vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p) { float v=0.; float a=.5; for(int i=0;i<5;i++){v+=a*noise3(p);p=p*2.03+7.1;a*=.5;}return v; }
`;
const vertexShader = `varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragmentShader = `
uniform vec3 color; uniform vec3 accent; uniform float time; varying vec3 vNormal; varying vec3 vPosition;
${noise}
void main(){
 vec3 p=normalize(vPosition); float n=fbm(p*5.+vec3(time*.012,0.,0.));
 float detail=noise3(p*36.+n*5.); float bands=sin(p.y*29.+n*13.)*.5+.5;
 float terrain=smoothstep(.35,.72,n*.75+detail*.25);
 vec3 surface=mix(color*.28,color*1.25,terrain); surface=mix(surface,accent*.7,pow(bands,5.)*.2);
 surface*=.76+detail*.55;
 vec3 N=normalize(vNormal); float light=max(dot(N,normalize(vec3(-.7,.7,1.))),0.);
 float rim=pow(1.-max(N.z,0.),3.8);
 vec3 result=surface*(.025+light*1.4)+accent*rim*light*.65;
 gl_FragColor=vec4(result,1.);
}`;

function GLB({ url }) {
  const gl = useThree((s) => s.gl);
  const ktx = useMemo(
    () =>
      modelCompression.ktx2Path
        ? new KTX2Loader()
            .setTranscoderPath(modelCompression.ktx2Path)
            .detectSupport(gl)
        : null,
    [gl],
  );
  const gltf = useGLTF(url, modelCompression.dracoPath, true, (loader) => {
    if (ktx) loader.setKTX2Loader(ktx);
  });
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  useEffect(() => () => ktx?.dispose(), [ktx]);
  return <primitive object={scene} />;
}

export function Model({ name, children }) {
  const url = models[name];
  return url ? (
    <ErrorBoundary key={url} fallback={children}>
      <Suspense fallback={children}>
        <GLB url={url} />
      </Suspense>
    </ErrorBoundary>
  ) : (
    children
  );
}

export function ModelPreloader() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const ktx = modelCompression.ktx2Path
      ? new KTX2Loader()
          .setTranscoderPath(modelCompression.ktx2Path)
          .detectSupport(gl)
      : null;
    Object.values(models)
      .filter(Boolean)
      .forEach((url) =>
        useGLTF.preload(url, modelCompression.dracoPath, true, (loader) => {
          if (ktx) loader.setKTX2Loader(ktx);
        }),
      );
    return () => ktx?.dispose();
  }, [gl]);
  return null;
}

export function Planet({
  color = '#7e9fa8',
  accent = '#a2ebef',
  radius = 1,
  segments = 48,
  rings = false,
  reducedMotion = false,
}) {
  const ref = useRef();
  const uniforms = useMemo(
    () => ({
      color: { value: new Color(color) },
      accent: { value: new Color(accent) },
      time: { value: 0 },
    }),
    [color, accent],
  );
  useFrame((_, dt) => {
    if (!reducedMotion && ref.current) {
      ref.current.rotation.y += dt * 0.025;
      uniforms.time.value += dt;
    }
  });
  return (
    <group>
      <Model name="planet">
        <mesh ref={ref}>
          <sphereGeometry args={[radius, segments, segments]} />
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
          />
        </mesh>
      </Model>
      <mesh scale={1.012}>
        <sphereGeometry args={[radius, 40, 40]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          vertexShader={vertexShader}
          uniforms={{ color: { value: new Color(accent) } }}
          fragmentShader="uniform vec3 color; varying vec3 vNormal; void main(){float rim=pow(1.-abs(normalize(vNormal).z),6.); gl_FragColor=vec4(color,rim*.28);}"
        />
      </mesh>
      {rings && (
        <group rotation={[1.13, -0.28, 0.15]}>
          <mesh>
            <ringGeometry args={[radius * 1.35, radius * 1.8, 160]} />
            <meshBasicMaterial
              color="#9eaeaa"
              transparent
              opacity={0.13}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[radius * 1.83, radius * 1.86, 160]} />
            <meshBasicMaterial
              color="#c8e4df"
              transparent
              opacity={0.27}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[radius * 1.95, radius * 1.98, 160]} />
            <meshBasicMaterial
              color="#b6d6d2"
              transparent
              opacity={0.13}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function Spaceship() {
  return (
    <Model name="spaceship">
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <coneGeometry args={[0.28, 0.95, 4]} />
          <meshStandardMaterial
            color="#d1e9e5"
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.25, 0]} scale={[2.7, 0.5, 0.6]}>
          <octahedronGeometry args={[0.3]} />
          <meshStandardMaterial
            color="#518b9c"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.57, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#84ffff" />
        </mesh>
      </group>
    </Model>
  );
}
export function Asteroid() {
  return (
    <Model name="asteroid">
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#9d9a92" flatShading roughness={1} />
      </mesh>
    </Model>
  );
}
export function Enemy() {
  return (
    <Model name="enemy">
      <mesh>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#cf9f9b"
          emissive="#b7403e"
          emissiveIntensity={0.5}
          flatShading
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
    </Model>
  );
}
export function Projectile() {
  return (
    <Model name="projectile">
      <mesh>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#aaffed" />
      </mesh>
    </Model>
  );
}
export function Station() {
  return (
    <Model name="station">
      <group>
        <mesh rotation={[0.3, 0.4, 0]}>
          <octahedronGeometry args={[0.35]} />
          <meshStandardMaterial
            color="#96adba"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0.4, 0]}>
          <torusGeometry args={[0.6, 0.028, 8, 40]} />
          <meshBasicMaterial color="#aad7d5" />
        </mesh>
      </group>
    </Model>
  );
}
export function Portal() {
  return (
    <Model name="portal">
      <group rotation={[0.15, 0.4, 0.2]}>
        <mesh>
          <torusGeometry args={[0.25, 0.025, 8, 40]} />
          <meshBasicMaterial color="#bcb0ed" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#c4b3f4" transparent opacity={0.55} />
        </mesh>
      </group>
    </Model>
  );
}
