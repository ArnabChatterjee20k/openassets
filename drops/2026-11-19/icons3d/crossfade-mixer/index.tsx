import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Crossfade Mixer',
  description:
    'Hero object for Crossfade, the AI ad agent: a compact mixing console whose channel faders ride a groove while LED meters bounce. Hover and the meters jump; click and the crossfader slams across.',
  tags: ['mixer', 'faders', 'hero', '3d', 'ads', 'agent'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  body: color('Console body').default('#FFE9D6'),
  panel: color('Top panel').default('#45293F'),
  fader: color('Fader caps').default('#FF8E5E'),
  glow: color('Crossfader glow').default('#E5487A'),
  peak: color('Meter peak').default('#FFD27F'),
  mood: select(['calm', 'live'], 'Mood').default('live'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', body: '#FF8E5E', panel: '#2B1B2E', fader: '#FFE9D6' },
  chrome: { material: 'metal', body: '#D9D4CF', panel: '#1C1C20', fader: '#C9A45C', glow: '#C9A45C', peak: '#F3EDE2' },
  glass: { material: 'glass', body: '#FFD3C2', panel: '#2B1B2E', fader: '#FFD27F' },
  ultraviolet: { body: '#FBEFFF', panel: '#24003D', fader: '#B026FF', glow: '#FF2E88', peak: '#FFD600' },
  calm: { mood: 'calm' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.1} transmission={0.9} thickness={1} ior={1.4} iridescence={0.3} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

const CH_X = [-0.86, -0.46, -0.06, 0.34];
const REST = [0.05, -0.18, 0.12, -0.08]; // fader rest offsets along the slot (z)
const SEGS = 6;
const SLOT_Z = -0.2; // centre of the fader slots
const TOP = 0.2; // top surface height
const BRIDGE_Y = 0.5; // centre of the rear meter bridge's spectrum window
const BARS = 14;

export default function CrossfadeMixer(p: P) {
  const live = p.mood === 'live';
  const faders = useRef<(THREE.Group | null)[]>([]);
  const leds = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const xf = useRef<THREE.Group>(null);
  const xfMat = useRef<THREE.MeshStandardMaterial>(null);
  const btn = useRef<THREE.MeshStandardMaterial>(null);
  const knobs = useRef<(THREE.Group | null)[]>([]);
  const bars = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const barMeshes = useRef<(THREE.Mesh | null)[]>([]);

  // Idle: faders ride a slow groove, meters bounce on the beat, the AUTO ring
  // blinks. Hover makes the meters jump; a click slams the crossfader across.
  useLoop((m) => {
    const energy = (live ? 1 : 0.45) + m.hover * 0.8;
    const press = pressBounce(m.pressAge);
    faders.current.forEach((g, i) => {
      if (!g) return;
      g.position.z = SLOT_Z + REST[i] + wave(m.t, 1, i * 0.23) * 0.16 * energy;
    });
    CH_X.forEach((_, i) => {
      // Integer cycles keep the loop seamless; |sin| gives a kick-drum bounce.
      const lvl = Math.min(1, (0.25 + Math.abs(wave(m.t, 4, i * 0.17)) * 0.55 + Math.abs(wave(m.t, 2, i * 0.31)) * 0.2) * (0.6 + energy * 0.4) + Math.abs(press) * 0.8);
      for (let s = 0; s < SEGS; s++) {
        const mat = leds.current[i * SEGS + s];
        if (mat) mat.emissiveIntensity = (s + 0.5) / SEGS < lvl ? 2.2 : 0.06;
      }
    });
    bars.current.forEach((mat, i) => {
      if (!mat) return;
      const h = 0.3 + Math.abs(wave(m.t, 2, i * 0.11)) * 0.45 + Math.abs(wave(m.t, 4, i * 0.27)) * 0.25 * energy;
      mat.emissiveIntensity = 0.5 + h * 1.8 + Math.abs(press) * 3;
      const mesh = barMeshes.current[i];
      if (mesh) {
        const s = Math.min(1, h * (0.7 + energy * 0.3) + Math.abs(press));
        mesh.scale.y = Math.max(0.12, s);
        mesh.position.y = BRIDGE_Y - 0.15 + (0.3 * Math.max(0.12, s)) / 2;
      }
    });
    if (xf.current) xf.current.position.x = wave(m.t, 1, 0.5) * -0.08 * energy + press * 0.9;
    if (xfMat.current) xfMat.current.emissiveIntensity = 1.4 + Math.abs(press) * 4 + m.hover * 0.8;
    if (btn.current) btn.current.emissiveIntensity = 0.6 + blink(m.t, 0.5, 0.06) * 2.6 + blink(m.t, 0.0, 0.03) * 2.6;
    knobs.current.forEach((k, i) => {
      if (k) k.rotation.y = wave(m.t, 1, i * 0.4) * 0.6 * energy;
    });
  });

  const ledColor = (s: number) => (s === SEGS - 1 ? p.peak : s >= SEGS - 3 ? p.glow : p.fader);

  return (
    <IconMotion seed={29}>
      <group rotation={[0.62, -0.42, 0]} position={[0, -0.12, 0]} scale={1.08}>
        {/* body */}
        <RoundedBox args={[2.5, 0.4, 1.7]} radius={0.16} smoothness={6} position={[0, 0, 0]}>
          <Surface kind={p.material} c={p.body} />
        </RoundedBox>
        {/* inset top panel */}
        <RoundedBox args={[2.22, 0.06, 1.42]} radius={0.03} smoothness={4} position={[0, TOP - 0.01, 0]}>
          <meshPhysicalMaterial color={p.panel} roughness={0.45} clearcoat={0.6} />
        </RoundedBox>

        {/* rear meter bridge: a raised riser with a glowing spectrum window */}
        <RoundedBox args={[2.5, 0.62, 0.42]} radius={0.14} smoothness={6} position={[0, 0.36, -0.86]}>
          <Surface kind={p.material} c={p.body} />
        </RoundedBox>
        <RoundedBox args={[2.1, 0.4, 0.04]} radius={0.04} smoothness={4} position={[0, BRIDGE_Y, -0.64]}>
          <meshPhysicalMaterial color={p.panel} roughness={0.35} clearcoat={0.8} />
        </RoundedBox>
        {Array.from({ length: BARS }, (_, i) => {
          const c = i % 5 === 2 ? p.peak : i % 2 ? p.glow : p.fader;
          return (
            <mesh key={i} ref={(el) => void (barMeshes.current[i] = el)} position={[-0.91 + (i * 1.82) / (BARS - 1), BRIDGE_Y, -0.615]}>
              <boxGeometry args={[0.085, 0.3, 0.02]} />
              <meshStandardMaterial ref={(el) => void (bars.current[i] = el)} color={c} emissive={c} emissiveIntensity={1.2} roughness={0.3} />
            </mesh>
          );
        })}

        {/* channel strips: slot, fader cap, LED meter */}
        {CH_X.map((x, i) => (
          <group key={i}>
            <mesh position={[x, TOP + 0.025, SLOT_Z]}>
              <boxGeometry args={[0.05, 0.02, 0.86]} />
              <meshStandardMaterial color="#120A12" roughness={0.6} />
            </mesh>
            <group ref={(el) => void (faders.current[i] = el)} position={[x, TOP + 0.09, SLOT_Z + REST[i]]}>
              <RoundedBox args={[0.24, 0.13, 0.13]} radius={0.04} smoothness={4}>
                <meshPhysicalMaterial color={p.fader} roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
              </RoundedBox>
              <mesh position={[0, 0.066, 0]}>
                <boxGeometry args={[0.2, 0.004, 0.02]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
              </mesh>
            </group>
            {Array.from({ length: SEGS }, (_, s) => (
              <mesh key={s} position={[x + 0.16, TOP + 0.03, SLOT_Z + 0.36 - s * 0.13]}>
                <boxGeometry args={[0.07, 0.025, 0.09]} />
                <meshStandardMaterial ref={(el) => void (leds.current[i * SEGS + s] = el)} color="#2A1824" emissive={ledColor(s)} emissiveIntensity={0.06} roughness={0.35} />
              </mesh>
            ))}
          </group>
        ))}

        {/* right column: two knobs and the glowing AUTO ring */}
        {[-0.5, -0.12].map((z, i) => (
          <group key={i} ref={(el) => void (knobs.current[i] = el)} position={[0.86, TOP + 0.07, z]}>
            <mesh>
              <cylinderGeometry args={[0.13, 0.15, 0.12, 40]} />
              <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.body} />
            </mesh>
            <mesh position={[0, 0.062, -0.07]}>
              <boxGeometry args={[0.03, 0.006, 0.1]} />
              <meshStandardMaterial color={p.fader} emissive={p.fader} emissiveIntensity={1.2} />
            </mesh>
          </group>
        ))}
        <group position={[0.86, TOP + 0.04, 0.28]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.03, 16, 48]} />
            <meshStandardMaterial ref={btn} color={p.peak} emissive={p.peak} emissiveIntensity={0.6} roughness={0.3} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.085, 0.085, 0.05, 32]} />
            <meshPhysicalMaterial color={p.body} roughness={0.3} clearcoat={1} />
          </mesh>
        </group>

        {/* crossfader across the front */}
        <mesh position={[-0.26, TOP + 0.025, 0.5]}>
          <boxGeometry args={[1.2, 0.02, 0.05]} />
          <meshStandardMaterial color="#120A12" roughness={0.6} />
        </mesh>
        <group ref={xf} position={[0, 0, 0]}>
          <RoundedBox args={[0.16, 0.14, 0.26]} radius={0.045} smoothness={4} position={[-0.26, TOP + 0.09, 0.5]}>
            <meshStandardMaterial ref={xfMat} color={p.glow} emissive={p.glow} emissiveIntensity={1.4} roughness={0.25} />
          </RoundedBox>
        </group>
      </group>
    </IconMotion>
  );
}
