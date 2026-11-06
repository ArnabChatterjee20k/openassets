import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Ad Balloon',
  description:
    'Towline hero: a chunky toy hot-air balloon in 70s sunset stripes, carrying a wicker basket with a pennant and sandbags. The burner flickers and the pennant waves; hover fires it up and lifts off, click gives a burner whoosh.',
  tags: ['3d', 'balloon', 'launch', 'reach', 'hero', 'ads'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  pattern: select(['bands', 'gores'], 'Stripes').default('bands'),
  stripe1: color('Stripe 1 (crown)').default('#7B2CBF'),
  stripe2: color('Stripe 2').default('#FF4F6D'),
  stripe3: color('Stripe 3').default('#FFB627'),
  stripe4: color('Stripe 4 (skirt)').default('#FFD3C2'),
  basket: color('Basket').default('#C98A4B'),
  flag: color('Pennant').default('#FF4F6D'),
  flame: color('Flame').default('#FFB627'),
  mood: select(['calm', 'gusty'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', pattern: 'gores', stripe1: '#FF4F6D', stripe2: '#FFEDE1', stripe3: '#7B2CBF', stripe4: '#FFB627', flag: '#7B2CBF' },
  'desert-dusk': { stripe1: '#E5487A', stripe2: '#FF8E5E', stripe3: '#FFD27F', stripe4: '#45293F', flag: '#FFD27F', basket: '#8A5A3C', mood: 'gusty' },
  metal: { material: 'metal', stripe1: '#C9A45C', stripe2: '#E8E4DC', stripe3: '#C9A45C', stripe4: '#E8E4DC', basket: '#7A5A3A', flag: '#C9A45C', flame: '#FFE7A8' },
  glass: { material: 'glass', pattern: 'gores', stripe1: '#BFE6FF', stripe2: '#FFD3C2', stripe3: '#BFE6FF', stripe4: '#FFD3C2' },
  citrus: { material: 'glossy', stripe1: '#2BB24C', stripe2: '#FFE9A8', stripe3: '#FF7A00', stripe4: '#FF3D7F', flag: '#2BB24C', mood: 'gusty' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c, side }: { kind: string; c: string; side?: THREE.Side }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} side={side} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} side={side} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={1} thickness={1} ior={1.4} iridescence={0.3} attenuationColor={c} attenuationDistance={1.5} side={side} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" side={side} />;
  }
}

// Envelope profile (radius, y), mouth at the bottom, crown on top: a smooth teardrop.
const MOUTH_Y = -0.42;
const MOUTH_R = 0.2;
function envelopeProfile() {
  const ctrl = [
    [MOUTH_R, MOUTH_Y],
    [0.32, -0.22],
    [0.6, 0.12],
    [0.76, 0.5],
    [0.78, 0.78],
    [0.66, 1.06],
    [0.4, 1.25],
    [0.001, 1.32],
  ].map(([r, y]) => new THREE.Vector3(r, y, 0));
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  return curve.getPoints(64).map((v) => new THREE.Vector2(Math.max(v.x, 0.001), v.y));
}

const BASKET_Y = -1.08;
const GORES = 12;

export default function AdBalloon(p: P) {
  const gusty = p.mood === 'gusty';
  const prof = useMemo(envelopeProfile, []);

  // Horizontal bands: split the profile into four height ranges (sharing edge points).
  const bands = useMemo(() => {
    const cuts = [0, 22, 36, 48, prof.length - 1];
    return [3, 2, 1, 0].map((ci, i) => ({ ci, g: new THREE.LatheGeometry(prof.slice(cuts[i], cuts[i + 1] + 1), 64) }));
  }, [prof]);
  // Vertical gores: wedges of the full lathe.
  const gores = useMemo(
    () => Array.from({ length: GORES }, (_, i) => ({ ci: i % 4, g: new THREE.LatheGeometry(prof, 8, (i / GORES) * Math.PI * 2, (Math.PI * 2) / GORES) })),
    [prof],
  );

  const pennant = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 10;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const h = 0.09 * (1 - u);
      pos.push(u * 0.34, h, 0, u * 0.34, -h, 0);
      if (i < N) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.userData.base = Float32Array.from(pos);
    g.computeVertexNormals();
    return g;
  }, []);

  const lift = useRef<THREE.Group>(null);
  const flameG = useRef<THREE.Group>(null);
  const flameMat = useRef<THREE.MeshStandardMaterial>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const bagL = useRef<THREE.Group>(null);
  const bagR = useRef<THREE.Group>(null);

  useLoop((m) => {
    const t = m.t;
    const burst = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 3.5) : 0;
    // Burner flicker: two integer-cycle waves, hotter on hover, a burst on click.
    const fl = 0.5 + 0.5 * wave(t, 8) * 0.6 + 0.5 * wave(t, 12, 0.3) * 0.4;
    const s = 0.85 + fl * 0.25 + m.hover * 0.55 + burst * 1.3;
    if (flameG.current) flameG.current.scale.set(0.9 + fl * 0.15 + burst * 0.3, s, 0.9 + fl * 0.15 + burst * 0.3);
    if (flameMat.current) flameMat.current.emissiveIntensity = 1.4 + fl * 0.8 + m.hover * 0.8 + burst * 2.5;
    if (coreMat.current) coreMat.current.emissiveIntensity = 2 + fl + burst * 3;
    // Lift: rises on hover, hops on click.
    if (lift.current) lift.current.position.y = m.hover * 0.12 + burst * 0.1 + pressBounce(m.pressAge) * 0.04;
    // Sandbags swing on their ropes.
    const amp = gusty ? 0.32 : 0.16;
    if (bagL.current) bagL.current.rotation.z = wave(t, 2) * amp;
    if (bagR.current) bagR.current.rotation.z = wave(t, 2, 0.35) * amp;
    // Pennant ripple travelling to the tip.
    const ph = cycle(t, gusty ? 4 : 2) * Math.PI * 2;
    const famp = (gusty ? 0.07 : 0.045) * (1 + m.hover * 0.6);
    const base = pennant.userData.base as Float32Array;
    const pos = pennant.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      const d = base[i] / 0.34;
      pos[i + 2] = Math.sin(d * 6 - ph) * famp * d;
      pos[i + 1] = base[i + 1] - d * d * 0.02;
    }
    pennant.attributes.position.needsUpdate = true;
    pennant.computeVertexNormals();
  });

  const cols = [p.stripe1, p.stripe2, p.stripe3, p.stripe4];
  const env = p.pattern === 'gores' ? gores : bands;
  const trimKind = p.material === 'glass' ? 'glossy' : p.material;
  const ink = '#3D0E2A';

  // Rope anchors: four points on the mouth ring down to the basket rim corners.
  const ropes = [45, 135, 225, 315].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const top = new THREE.Vector3(Math.cos(a) * MOUTH_R * 0.95, MOUTH_Y - 0.04, Math.sin(a) * MOUTH_R * 0.95);
    const bot = new THREE.Vector3(Math.cos(a) * 0.2, BASKET_Y + 0.17, Math.sin(a) * 0.2);
    const mid = top.clone().add(bot).multiplyScalar(0.5);
    const len = top.distanceTo(bot);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bot.clone().sub(top).normalize());
    return { mid, len, q, key: deg };
  });

  return (
    <IconMotion seed={41} float={0.06} sway={0.07}>
      <group position={[0, -0.12, 0]} rotation={[0.12, -0.35, 0]} scale={0.98}>
        <group ref={lift}>
          {/* envelope */}
          {env.map(({ ci, g }, i) => (
            <mesh key={i} geometry={g}>
              <Surface kind={p.material} c={cols[ci]} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* crown cap + mouth load ring */}
          <mesh position={[0, 1.31, 0]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.12, 24, 12]} />
            <Surface kind={trimKind} c={p.stripe1} />
          </mesh>
          <mesh position={[0, MOUTH_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[MOUTH_R, 0.03, 12, 40]} />
            <meshPhysicalMaterial color={ink} roughness={0.5} clearcoat={0.3} />
          </mesh>
          {/* ropes */}
          {ropes.map((r) => (
            <mesh key={r.key} position={r.mid} quaternion={r.q}>
              <cylinderGeometry args={[0.012, 0.012, r.len, 6]} />
              <meshStandardMaterial color={ink} roughness={0.6} />
            </mesh>
          ))}
          {/* burner frame + flame */}
          <mesh position={[0, BASKET_Y + 0.38, 0]}>
            <cylinderGeometry args={[0.09, 0.07, 0.1, 24]} />
            <meshStandardMaterial color="#B9B2B8" metalness={0.9} roughness={0.32} />
          </mesh>
          <group ref={flameG} position={[0, BASKET_Y + 0.43, 0]}>
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.08, 24, 16]} />
              <meshStandardMaterial ref={flameMat} color={p.flame} emissive={p.flame} emissiveIntensity={1.6} roughness={0.4} transparent opacity={0.92} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <coneGeometry args={[0.072, 0.2, 24]} />
              <meshStandardMaterial color={p.flame} emissive={p.flame} emissiveIntensity={1.6} roughness={0.4} transparent opacity={0.92} />
            </mesh>
            <mesh position={[0, 0.11, 0]}>
              <sphereGeometry args={[0.045, 16, 12]} />
              <meshStandardMaterial ref={coreMat} color="#FFF4D6" emissive="#FFF4D6" emissiveIntensity={2.2} />
            </mesh>
          </group>
          {/* basket */}
          <group position={[0, BASKET_Y, 0]}>
            <RoundedBox args={[0.46, 0.32, 0.46]} radius={0.07} smoothness={4}>
              <Surface kind={p.material === 'glass' ? 'clay' : p.material} c={p.basket} />
            </RoundedBox>
            {/* weave bands + padded rim */}
            {[-0.06, 0.04].map((y) => (
              <RoundedBox key={y} args={[0.475, 0.035, 0.475]} radius={0.016} smoothness={3} position={[0, y, 0]}>
                <meshPhysicalMaterial color={new THREE.Color(p.basket).multiplyScalar(0.72)} roughness={0.75} />
              </RoundedBox>
            ))}
            <RoundedBox args={[0.5, 0.06, 0.5]} radius={0.028} smoothness={3} position={[0, 0.17, 0]}>
              <meshPhysicalMaterial color={ink} roughness={0.55} clearcoat={0.3} />
            </RoundedBox>
            {/* pennant on a pole at the front-right corner */}
            <group position={[0.21, 0.17, 0.21]}>
              <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 0.4, 8]} />
                <meshStandardMaterial color={ink} roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.41, 0]}>
                <sphereGeometry args={[0.022, 12, 10]} />
                <meshStandardMaterial color={p.flame} roughness={0.4} />
              </mesh>
              <mesh geometry={pennant} position={[0.01, 0.34, 0]}>
                <Surface kind={trimKind} c={p.flag} side={THREE.DoubleSide} />
              </mesh>
            </group>
            {/* sandbags hanging off the rim */}
            {[
              { ref: bagL, x: -0.26 },
              { ref: bagR, x: 0.26 },
            ].map(({ ref, x }) => (
              <group key={x} ref={ref} position={[x, 0.15, 0.05]}>
                <mesh position={[0, -0.07, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
                  <meshStandardMaterial color={ink} roughness={0.6} />
                </mesh>
                <mesh position={[0, -0.18, 0]} scale={[1, 1.15, 1]}>
                  <sphereGeometry args={[0.065, 20, 16]} />
                  <meshPhysicalMaterial color="#E9D3B4" roughness={0.8} sheen={0.5} sheenColor="#ffffff" />
                </mesh>
                <mesh position={[0, -0.115, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.03, 0.01, 8, 20]} />
                  <meshStandardMaterial color={ink} roughness={0.6} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
