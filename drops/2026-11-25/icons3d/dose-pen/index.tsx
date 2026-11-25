import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Dose Pen',
  description:
    'Satiate hero object: a Y2K chrome-and-white GLP-1 injection pen with a ridged dose dial that clicks round, a glowing dose window and a jelly-pink cap. Hover brightens the window; a click presses the plunger with a spark.',
  tags: ['glp-1', 'injection pen', 'health', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['chrome', 'glossy', 'clay', 'glass'], 'Material').default('glossy'),
  bodyColor: color('Body').default('#EEF0F5'),
  dialColor: color('Dial').default('#C3C8D1'),
  capColor: color('Cap').default('#FF3DB4'),
  glowColor: color('Dose window').default('#3D5AFE'),
  mood: select(['calm', 'shot day'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  chrome: { material: 'chrome', bodyColor: '#D4D9E2', dialColor: '#3D5AFE', capColor: '#FF3DB4' },
  'shot-day': { mood: 'shot day', dialColor: '#3D5AFE' },
  clay: { material: 'clay', bodyColor: '#E9E3F5', dialColor: '#5E4AE3', capColor: '#F49CBB', glowColor: '#2EC4B6' },
  glass: { material: 'glass', bodyColor: '#DCE3FF', dialColor: '#B8C0CC', glowColor: '#FF3DB4', capColor: '#3D5AFE' },
  sorbet: { bodyColor: '#FFEDE1', dialColor: '#7B2CBF', capColor: '#FF4F6D', glowColor: '#FFB627' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'chrome':
      return <meshStandardMaterial color={c} metalness={1} roughness={0.32} envMapIntensity={1.5} />;
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.8} ior={1.4} iridescence={0.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
  }
}

/** Lathe a (radius, height) profile into a smooth solid of revolution. */
const lathe = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 64);

const RIDGES = 16;
const STEP = (Math.PI * 2) / RIDGES;

export default function DosePen(p: P) {
  const body = useMemo(
    () => lathe([[0, -0.95], [0.18, -0.95], [0.25, -0.91], [0.275, -0.84], [0.28, -0.7], [0.28, 0.52], [0.272, 0.58], [0.24, 0.62], [0, 0.62]]),
    [],
  );
  // Cap: a smooth bullet nose (quarter-ellipse profile) so it doesn't facet.
  const cap = useMemo(() => {
    const pts: [number, number][] = [[0, -1.5]];
    for (let i = 1; i <= 16; i++) {
      const a = (i / 16) * (Math.PI / 2);
      pts.push([Math.sin(a) * 0.25, -1.5 + (1 - Math.cos(a)) * 0.3]);
    }
    pts.push([0.25, -1.0], [0, -1.0]);
    return lathe(pts);
  }, []);
  const button = useMemo(() => lathe([[0, 0.2], [0.13, 0.19], [0.165, 0.15], [0.17, 0.0], [0, 0.0]]), []);

  const dial = useRef<THREE.Group>(null);
  const plunger = useRef<THREE.Group>(null);
  const windowMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const spark = useRef<THREE.Group>(null);
  const busy = p.mood === 'shot day';

  // Idle: the dial clicks round one notch per beat and the window breathes.
  // Hover brightens the window; a click presses the plunger and pops a spark.
  useLoop((m) => {
    const clicks = busy ? 8 : 4; // clicks per loop; dial turns one full ridge-set per loop
    const u = cycle(m.t, clicks);
    const step = Math.floor((m.t / 4) * clicks) % clicks;
    const settle = Math.min(1, u * 5); // fast snap at the start of each beat
    const ease = 1 - Math.pow(1 - settle, 3);
    // One full turn per loop in `clicks` snappy notches, so the loop is seamless.
    if (dial.current) dial.current.rotation.y = ((step + ease) * Math.PI * 2) / clicks;
    const press = Math.abs(pressBounce(m.pressAge));
    if (plunger.current) plunger.current.position.y = 0.72 - press * 0.12;
    if (windowMat.current) {
      const snapGlow = (1 - settle) * 0.6;
      windowMat.current.emissiveIntensity = 0.22 + (wave(m.t, 2) * 0.5 + 0.5) * 0.18 + snapGlow * 0.5 + m.hover * 0.7 + press * 1.6;
    }
    if (spark.current) {
      const s = Math.max(press * 1.6, blink(m.t, 0.62, 0.05) * (busy ? 1 : 0.6));
      spark.current.scale.setScalar(Math.max(0.001, s));
      spark.current.rotation.z = m.t * 1.5;
    }
  });

  return (
    <IconMotion seed={41} float={0.06} sway={0.07}>
      <group rotation={[0.18, 0.12, -0.92]} position={[0.05, 0.12, 0]} scale={1.18}>
        {/* barrel */}
        <mesh geometry={body} castShadow>
          <Surface kind={p.material} c={p.bodyColor} />
        </mesh>
        {/* glowing dose window, a curved panel on the barrel's front */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.287, 0.287, 0.56, 48, 1, true, -0.62, 1.24]} />
          <meshPhysicalMaterial ref={windowMat} color={p.glowColor} emissive={p.glowColor} emissiveIntensity={0.3} roughness={0.15} clearcoat={1} side={THREE.DoubleSide} />
        </mesh>
        {/* dose scale ticks on the window */}
        {[-0.16, -0.08, 0, 0.08, 0.16].map((y, i) => (
          <mesh key={y} position={[0, y + 0.02, 0.29]}>
            <boxGeometry args={[i === 2 ? 0.16 : 0.09, 0.016, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
        {/* label band */}
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.284, 0.284, 0.12, 64, 1, true]} />
          <meshStandardMaterial color={p.capColor} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        {/* jelly cap */}
        <mesh geometry={cap} castShadow>
          <meshPhysicalMaterial color={p.capColor} roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} transmission={p.material === 'glass' ? 0.6 : 0} thickness={0.5} />
        </mesh>
        {/* ridged dose dial */}
        <group ref={dial} position={[0, 0.79, 0]}>
          <mesh>
            <cylinderGeometry args={[0.27, 0.27, 0.3, 48]} />
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.dialColor} />
          </mesh>
          {/* indicator notch, so each click of the dial is visible */}
          <RoundedBox args={[0.07, 0.3, 0.07]} radius={0.025} smoothness={3} position={[0, 0, 0.3]}>
            <meshPhysicalMaterial color={p.capColor} emissive={p.capColor} emissiveIntensity={0.25} roughness={0.2} clearcoat={1} />
          </RoundedBox>
          {Array.from({ length: RIDGES }, (_, i) => {
            const a = i * STEP;
            return (
              <RoundedBox key={i} args={[0.06, 0.28, 0.06]} radius={0.02} smoothness={3} position={[Math.sin(a) * 0.275, 0, Math.cos(a) * 0.275]} rotation={[0, a, 0]}>
                <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.dialColor} />
              </RoundedBox>
            );
          })}
        </group>
        {/* plunger button */}
        <group ref={plunger} position={[0, 0.72, 0]}>
          <mesh geometry={button} position={[0, 0.22, 0]}>
            <meshPhysicalMaterial color={p.capColor} roughness={0.2} clearcoat={1} />
          </mesh>
        </group>
        {/* spark at the cap tip */}
        <group ref={spark} position={[0, -1.68, 0.1]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial color={p.capColor} emissive={p.capColor} emissiveIntensity={2} />
          </mesh>
          <mesh scale={[0.35, 1.6, 0.35]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
