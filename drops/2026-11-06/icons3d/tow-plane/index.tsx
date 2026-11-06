import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Tow Plane',
  description:
    'Towline hero: a chunky toy prop plane towing a striped 70s banner. The propeller spins, the banner ripples and the wing lights blink; hover opens the throttle, click does a barrel roll.',
  tags: ['3d', 'plane', 'banner', 'hero', 'ads', 'launch'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  body: color('Fuselage').default('#FFF1E6'),
  trim: color('Nose + tail').default('#FF4F6D'),
  stripe1: color('Banner top').default('#FF4F6D'),
  stripe2: color('Banner middle').default('#FFB627'),
  stripe3: color('Banner bottom').default('#7B2CBF'),
  lights: color('Wing lights').default('#FFB627'),
  banner: toggle('Tow banner').default(true),
  mood: select(['calm', 'gusty'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', body: '#7B2CBF', trim: '#FFB627', stripe1: '#FFEDE1', stripe2: '#FF4F6D', stripe3: '#3D0E2A' },
  metal: { material: 'metal', body: '#D9DCE2', trim: '#C9A45C', stripe1: '#F3EDE2', stripe2: '#C9A45C', stripe3: '#1C1C20', lights: '#FFE7A8' },
  glass: { material: 'glass', body: '#FFD3C2', trim: '#FF4F6D' },
  citrus: { body: '#FFF8E1', trim: '#2BB24C', stripe1: '#FF7A00', stripe2: '#FFE9A8', stripe3: '#FF3D7F', mood: 'gusty' },
  'solo-flight': { banner: false, material: 'glossy', body: '#FF4F6D', trim: '#3D0E2A' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={1} thickness={1} ior={1.4} iridescence={0.3} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

// Banner: three stripes that ripple with one shared wave.
const B_LEN = 1.55;
const B_H = 0.52;
const SEG = 28;

function makeStripe(i: number) {
  const h = B_H / 3;
  const g = new THREE.PlaneGeometry(B_LEN, h, SEG, 1);
  g.translate(-B_LEN / 2, B_H / 2 - h / 2 - i * h, 0);
  g.userData.base = Float32Array.from(g.attributes.position.array as Float32Array);
  return g;
}

export default function TowPlane(p: P) {
  const stripes = useMemo(() => [0, 1, 2].map(makeStripe), []);
  const fuselage = useMemo(() => {
    // Lathe profile (radius, length): tail at -y, nose at +y; rotated onto +x below.
    const prof = [
      [0.0, -0.78],
      [0.09, -0.76],
      [0.15, -0.6],
      [0.23, -0.25],
      [0.29, 0.1],
      [0.31, 0.38],
      [0.29, 0.52],
      [0.0, 0.54],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(prof, 48);
  }, []);
  const fin = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0.34, 0);
    s.quadraticCurveTo(0.1, 0.12, 0.06, 0.42);
    s.lineTo(-0.04, 0.42);
    s.quadraticCurveTo(-0.08, 0.2, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 4 });
    g.translate(0, 0, -0.02);
    return g;
  }, []);

  const prop = useRef<THREE.Group>(null);
  const plane = useRef<THREE.Group>(null);
  const tipL = useRef<THREE.MeshStandardMaterial>(null);
  const tipR = useRef<THREE.MeshStandardMaterial>(null);
  const gusty = p.mood === 'gusty';

  useLoop((m) => {
    const t = m.t;
    // Propeller: integer turns per loop; hover opens the throttle.
    if (prop.current) prop.current.rotation.x = cycle(t, gusty ? 12 : 8) * Math.PI * 2 + t * m.hover * 30;
    // Gentle bank, plus a full barrel roll after a click.
    if (plane.current) {
      const roll = m.pressAge < 0.9 ? THREE.MathUtils.smootherstep(m.pressAge / 0.9, 0, 1) * Math.PI * 2 : 0;
      plane.current.rotation.x = wave(t, 1) * (gusty ? 0.14 : 0.07) + roll;
      plane.current.position.y = pressBounce(m.pressAge) * 0.08;
    }
    // Navigation lights blink alternately.
    if (tipL.current) tipL.current.emissiveIntensity = 0.4 + blink(t, 0.25, 0.05) * 3 + m.hover * 0.6;
    if (tipR.current) tipR.current.emissiveIntensity = 0.4 + blink(t, 0.75, 0.05) * 3 + m.hover * 0.6;
    // Banner ripple: travels from the tow line to the tail, grows toward the free end.
    const ph = cycle(t, gusty ? 4 : 2) * Math.PI * 2;
    const amp = (gusty ? 0.2 : 0.14) * (1 + m.hover * 0.6);
    for (const g of stripes) {
      const base = g.userData.base as Float32Array;
      const pos = g.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length; i += 3) {
        const d = -base[i] / B_LEN; // 0 at the leading edge, 1 at the tail
        pos[i + 2] = Math.sin(d * 9 - ph) * amp * Math.pow(d, 1.1);
        pos[i + 1] = base[i + 1] - d * d * 0.05 + Math.sin(d * 7 - ph) * 0.015 * d;
      }
      g.attributes.position.needsUpdate = true;
      g.computeVertexNormals();
    }
  });

  const stripeColors = [p.stripe1, p.stripe2, p.stripe3];
  return (
    <IconMotion seed={29} sway={0.06}>
      <group rotation={[0.2, -0.6, 0.05]} position={p.banner ? [0.5, -0.3, 0] : [0, -0.25, 0]} scale={p.banner ? 1.08 : 1.35}>
        <group ref={plane}>
          {/* fuselage along +x */}
          <mesh geometry={fuselage} rotation={[0, 0, -Math.PI / 2]}>
            <Surface kind={p.material} c={p.body} />
          </mesh>
          {/* cowling ring + spinner */}
          <mesh position={[0.47, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.27, 0.305, 0.16, 48]} />
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.trim} />
          </mesh>
          <mesh position={[0.555, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.24, 0.035, 16, 48]} />
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.trim} />
          </mesh>
          <mesh position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.11, 0.22, 32]} />
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.trim} />
          </mesh>
          {/* propeller */}
          <group ref={prop} position={[0.62, 0, 0]}>
            {[0, Math.PI].map((a) => (
              <group key={a} rotation={[a, 0, 0]}>
                <RoundedBox args={[0.04, 0.42, 0.1]} radius={0.018} smoothness={3} position={[0, 0.24, 0]} rotation={[0.25, 0, 0]}>
                  <meshPhysicalMaterial color="#3D0E2A" roughness={0.35} clearcoat={0.6} />
                </RoundedBox>
              </group>
            ))}
          </group>
          {/* canopy */}
          <mesh position={[0.12, 0.24, 0]} scale={[1.4, 0.8, 0.9]}>
            <sphereGeometry args={[0.17, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#BFE6FF" roughness={0.05} transmission={0.6} thickness={0.2} clearcoat={1} />
          </mesh>
          {/* wings: high wing with rounded tips */}
          <RoundedBox args={[0.5, 0.07, 2.1]} radius={0.034} smoothness={4} position={[0.12, 0.15, 0]}>
            <Surface kind={p.material} c={p.body} />
          </RoundedBox>
          {/* wing stripe */}
          <RoundedBox args={[0.14, 0.075, 2.06]} radius={0.03} smoothness={3} position={[0.27, 0.152, 0]}>
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.trim} />
          </RoundedBox>
          {/* wingtip nav lights */}
          <mesh position={[0.12, 0.15, 1.07]}>
            <sphereGeometry args={[0.055, 20, 16]} />
            <meshStandardMaterial ref={tipL} color={p.lights} emissive={p.lights} emissiveIntensity={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0.12, 0.15, -1.07]}>
            <sphereGeometry args={[0.055, 20, 16]} />
            <meshStandardMaterial ref={tipR} color={p.lights} emissive={p.lights} emissiveIntensity={0.4} roughness={0.3} />
          </mesh>
          {/* tailplane + fin */}
          <RoundedBox args={[0.26, 0.045, 0.78]} radius={0.02} smoothness={3} position={[-0.62, 0.04, 0]}>
            <Surface kind={p.material} c={p.body} />
          </RoundedBox>
          <mesh geometry={fin} position={[-0.74, 0.05, 0]}>
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.trim} />
          </mesh>
          {/* landing gear */}
          {[0.24, -0.24].map((zz) => (
            <group key={zz} position={[0.2, -0.33, zz]}>
              <mesh position={[0, 0.08, 0]} rotation={[zz > 0 ? -0.35 : 0.35, 0, 0]}>
                <cylinderGeometry args={[0.018, 0.018, 0.2, 10]} />
                <meshStandardMaterial color="#3D0E2A" roughness={0.5} />
              </mesh>
              <mesh rotation={[0, 0, 0]}>
                <torusGeometry args={[0.06, 0.03, 12, 24]} />
                <meshPhysicalMaterial color="#3D0E2A" roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>

        {p.banner && (
          <group position={[-0.78, 0, 0]}>
            {/* tow line */}
            <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 0.56, 6]} />
              <meshStandardMaterial color="#3D0E2A" roughness={0.6} />
            </mesh>
            <group position={[-0.56, 0, 0]}>
              {/* leading pole */}
              <mesh>
                <cylinderGeometry args={[0.02, 0.02, B_H + 0.08, 10]} />
                <meshStandardMaterial color="#FFF1E6" roughness={0.4} />
              </mesh>
              {stripes.map((g, i) => (
                <mesh key={i} geometry={g}>
                  <meshPhysicalMaterial color={stripeColors[i]} roughness={0.5} clearcoat={0.3} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          </group>
        )}
      </group>
    </IconMotion>
  );
}
