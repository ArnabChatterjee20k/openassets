import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Feature Toggle',
  description:
    'Landing-page hero for a feature-flag product: a chunky switch in the ON position on a glowing track, with a status LED, pixel "ON" plate and rollout pips. The LED blinks and the pips count up; hover makes it glow; a click flicks the knob off and back on.',
  tags: ['saas', 'feature flag', 'toggle', 'switch', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  baseColor: color('Base').default('#1C1C20'),
  trackColor: color('Track (ON)').default('#C6FF00'),
  knobColor: color('Knob').default('#F0FFE0'),
  ledColor: color('Status LED').default('#00F0FF'),
  pixelColor: color('Pixel lettering').default('#FF00E5'),
  mood: select(['calm', 'lively'], 'Mood').default('lively'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', baseColor: '#2A2A30', trackColor: '#C6FF00', pixelColor: '#00F0FF', ledColor: '#FF00E5' },
  ultraviolet: { baseColor: '#24003D', trackColor: '#B026FF', knobColor: '#FBEFFF', ledColor: '#FFD600', pixelColor: '#FF2E88' },
  chrome: { material: 'metal', baseColor: '#C3C8D1', trackColor: '#3D5AFE', knobColor: '#F2F4F8', ledColor: '#FF3DB4', pixelColor: '#101219' },
  glass: { material: 'glass', baseColor: '#BFEFFF', trackColor: '#C6FF00', ledColor: '#FF00E5', pixelColor: '#FF00E5', mood: 'calm' },
  brutal: { material: 'clay', baseColor: '#FFE45C', trackColor: '#FF5C8A', knobColor: '#FFFDF2', ledColor: '#00D1A0', pixelColor: '#111111' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      // Transparent clearcoat reads as glass without the cost of a transmission pass.
      return <meshPhysicalMaterial color={c} roughness={0.05} transparent opacity={0.5} clearcoat={1} clearcoatRoughness={0.04} iridescence={0.5} metalness={0.1} depthWrite={false} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.24} clearcoat={1} clearcoatRoughness={0.08} />;
  }
}

// 3x5 / 4x5 pixel glyphs for the "ON" plate (arcade lettering).
const GLYPH_O = ['111', '101', '101', '101', '111'];
const GLYPH_N = ['10001', '11001', '10101', '10011', '10001'];

/** Capsule / rounded-rect outline centred on the origin, extruded with a soft bevel. */
function pillGeometry(w: number, h: number, r: number, depth: number, bevel: number) {
  const s = new THREE.Shape();
  const x = w / 2 - r;
  const y = h / 2 - r;
  s.moveTo(-x, -h / 2);
  s.lineTo(x, -h / 2);
  s.absarc(x, -y, r, -Math.PI / 2, 0, false);
  s.lineTo(w / 2, y);
  s.absarc(x, y, r, 0, Math.PI / 2, false);
  s.lineTo(-x, h / 2);
  s.absarc(-x, y, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-w / 2, -y);
  s.absarc(-x, -y, r, Math.PI, Math.PI * 1.5, false);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 6, curveSegments: 32 });
  g.translate(0, 0, -depth / 2);
  return g;
}

const W = 2.7; // base width
const H = 1.56; // base height
const ON_X = 0.56;
const OFF_X = -0.56;
const TY = 0.14; // track centre height
const BY = -0.56; // bottom row (LED, ON plate, pips)

export default function FeatureToggle(p: P) {
  const lively = p.mood === 'lively';
  const knobGeo = useMemo(() => {
    // Domed puck profile, revolved around its axis then turned to face the camera.
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, -0.2));
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * (Math.PI / 2);
      pts.push(new THREE.Vector2(0.3 + Math.cos(a - Math.PI / 2) * 0.06, -0.14 + Math.sin(a - Math.PI / 2) * 0.06 + 0.0));
    }
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.cos(a) * 0.36, 0.02 + Math.sin(a) * 0.17));
    }
    const g = new THREE.LatheGeometry(pts, 64);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  const bezelGeo = useMemo(() => pillGeometry(2.14, 1.0, 0.5, 0.08, 0.04), []);
  const trackGeo = useMemo(() => pillGeometry(1.9, 0.78, 0.39, 0.06, 0.035), []);
  const pixels = useMemo(() => {
    const out: [number, number][] = [];
    const put = (rows: string[], ox: number) =>
      rows.forEach((r, j) => r.split('').forEach((c, i) => c === '1' && out.push([ox + i, 4 - j])));
    put(GLYPH_O, 0);
    put(GLYPH_N, 4);
    return out;
  }, []);

  const knob = useRef<THREE.Group>(null);
  const trackMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const led = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const pips = useRef<(THREE.Mesh | null)[]>([]);

  useLoop((m) => {
    // Click: the knob flicks off and snaps back on within ~0.7 s.
    const age = m.pressAge;
    const flick = Number.isFinite(age) && age < 0.7 ? Math.sin(Math.PI * Math.min(1, age / 0.7)) ** 0.6 : 0;
    const nudge = (lively ? 0.22 : 0.1) * blink(m.t, 0.5, 0.09); // a little "are you sure?" wiggle
    const k = knob.current;
    if (k) {
      k.position.x = ON_X - nudge - flick * (ON_X - OFF_X);
      k.rotation.y = -m.hover * 0.25 + Math.abs(pressBounce(age)) * 0.2;
      k.position.z = 0.32 + m.hover * 0.05;
    }
    if (trackMat.current) {
      const on = 1 - flick;
      trackMat.current.emissiveIntensity = (0.06 + (wave(m.t, 2) * 0.5 + 0.5) * 0.08 + m.hover * 0.3) * on + 0.01;
    }
    if (led.current) {
      const b = Math.max(blink(m.t, 0.2, 0.05), lively ? blink(m.t, 0.7, 0.05) : 0, flick);
      (led.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + b * 2.5;
      led.current.scale.setScalar(1 + b * 0.25);
    }
    if (ring.current) {
      const r = Number.isFinite(age) && age < 0.9 ? age / 0.9 : 1;
      ring.current.scale.setScalar(1 + r * 0.9);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - r) * 0.8;
    }
    // Rollout pips count 25 → 50 → 75 → 100 %.
    const lit = Math.floor(cycle(m.t, lively ? 2 : 1) * 4) + 1;
    pips.current.forEach((pip, i) => {
      if (!pip) return;
      const mat = pip.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = i < lit ? 0.9 + m.hover * 0.6 : 0;
      mat.opacity = i < lit ? 1 : 0.35;
    });
  });

  const px = 0.058;
  return (
    <IconMotion seed={41} float={0.06} sway={0.07}>
      <group position={[0, 0.08, 0]} scale={1.12}>
        {/* Base plate */}
        <RoundedBox args={[W, H, 0.42]} radius={0.2} smoothness={6} castShadow receiveShadow>
          <Surface kind={p.material} c={p.baseColor} />
        </RoundedBox>
        {/* Raised pill housing around the track */}
        <mesh geometry={bezelGeo} position={[0, TY, 0.25]} castShadow>
          <meshPhysicalMaterial color={new THREE.Color(p.baseColor).multiplyScalar(0.5)} roughness={0.3} clearcoat={0.8} metalness={p.material === 'metal' ? 0.8 : 0} />
        </mesh>
        {/* Track: the ON state */}
        <mesh geometry={trackGeo} position={[0, TY, 0.3]}>
          <meshPhysicalMaterial ref={trackMat} color={p.trackColor} emissive={p.trackColor} emissiveIntensity={0.08} roughness={0.35} clearcoat={0.5} clearcoatRoughness={0.2} />
        </mesh>
        {/* Click flash ring around the knob */}
        <mesh ref={ring} position={[ON_X, TY, 0.42]}>
          <ringGeometry args={[0.42, 0.47, 64]} />
          <meshBasicMaterial color={p.trackColor} transparent opacity={0} toneMapped={false} />
        </mesh>
        {/* Knob */}
        <group ref={knob} position={[ON_X, TY, 0.36]}>
          <mesh geometry={knobGeo} castShadow>
            <meshPhysicalMaterial color={p.knobColor} roughness={p.material === 'clay' ? 0.6 : 0.2} clearcoat={p.material === 'clay' ? 0.2 : 1} metalness={p.material === 'metal' ? 0.6 : 0} />
          </mesh>
          <mesh position={[0, 0, 0.19]}>
            <circleGeometry args={[0.07, 32]} />
            <meshStandardMaterial color={p.trackColor} emissive={p.trackColor} emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* Status LED */}
        <mesh ref={led} position={[-1.06, BY, 0.22]}>
          <sphereGeometry args={[0.065, 24, 24]} />
          <meshStandardMaterial color={p.ledColor} emissive={p.ledColor} emissiveIntensity={0.6} roughness={0.2} />
        </mesh>
        {/* Pixel "ON" plate */}
        <group position={[-0.88, BY - 2 * px, 0.215]}>
          {pixels.map(([x, y], i) => (
            <mesh key={i} position={[x * px + (x >= 4 ? px * 0.8 : 0), y * px, 0]}>
              <boxGeometry args={[px * 0.9, px * 0.9, 0.035]} />
              <meshStandardMaterial color={p.pixelColor} emissive={p.pixelColor} emissiveIntensity={0.35} roughness={0.4} />
            </mesh>
          ))}
        </group>
        {/* Rollout pips (25 / 50 / 75 / 100 %) */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} ref={(el) => void (pips.current[i] = el)} position={[0.6 + i * 0.15, BY, 0.22]}>
            <boxGeometry args={[0.1, 0.1, 0.04]} />
            <meshStandardMaterial color={p.trackColor} emissive={p.trackColor} emissiveIntensity={0.9} transparent />
          </mesh>
        ))}
        {/* Screws in the top corners */}
        {[
          [-1.18, 0.62],
          [1.18, 0.62],
        ].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 20]} />
            <meshStandardMaterial color="#9A9AA2" metalness={0.9} roughness={0.35} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
