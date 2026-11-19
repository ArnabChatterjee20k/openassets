import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Launch Boombox',
  description:
    'App-store and launch-day hero for Crossfade: a chunky retro boombox that broadcasts one brief everywhere. Speaker cones thump on the beat, the EQ window dances and the ON AIR light blinks. Hover turns it up; a click drops the bass with a big thump and flash.',
  tags: ['boombox', 'launch', 'speaker', 'hero', '3d', 'ads', 'broadcast'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  body: color('Body').default('#FFE9D6'),
  grille: color('Speaker grille').default('#45293F'),
  ring: color('Speaker rings').default('#FF8E5E'),
  glow: color('EQ glow').default('#E5487A'),
  light: color('On-air light').default('#FFD27F'),
  mood: select(['calm', 'party'], 'Mood').default('party'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', body: '#FF8E5E', grille: '#2B1B2E', ring: '#FFE9D6' },
  chrome: { material: 'metal', body: '#D9D4CF', grille: '#1C1C20', ring: '#C9A45C', glow: '#C9A45C', light: '#F3EDE2' },
  glass: { material: 'glass', body: '#FFD3C2', grille: '#2B1B2E', ring: '#E5487A', light: '#FFD27F' },
  acid: { material: 'glossy', body: '#F0FFE0', grille: '#0B0B0B', ring: '#C6FF00', glow: '#FF00E5', light: '#00F0FF' },
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

const FRONT = 0.36; // front face z
const SPK_X = [-0.78, 0.78];
const BARS = 9;

export default function LaunchBoombox(p: P) {
  const party = p.mood === 'party';
  const cones = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const barMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const onAir = useRef<THREE.MeshStandardMaterial>(null);
  const tweeters = useRef<(THREE.Group | null)[]>([]);
  const antenna = useRef<THREE.Group>(null);

  // Idle: cones thump on every beat (8 per loop), the EQ bounces and the ON AIR
  // light blinks twice. Hover turns the volume up; a click drops the bass.
  useLoop((m) => {
    const energy = (party ? 1 : 0.4) + m.hover * 0.9;
    const press = Math.abs(pressBounce(m.pressAge));
    // A kick envelope: sharp at the start of each beat, decays fast. 0 at t = 0
    // because the envelope is multiplied by a rising wave that is 0 at rest.
    const kick = Math.pow(Math.abs(wave(m.t, 8)), 6);
    cones.current.forEach((g) => {
      if (g) {
        const r = 1 + kick * 0.1 * energy + press * 0.15;
        g.scale.set(r, r, 1 + kick * 1.4 * energy + press * 2.4);
      }
    });
    tweeters.current.forEach((g, i) => {
      if (g) g.scale.z = 1 + Math.abs(wave(m.t, 16, i * 0.25)) * 0.6 * energy;
    });
    rings.current.forEach((mat) => {
      if (mat) mat.emissiveIntensity = 0.9 + kick * 1.6 * energy + press * 4;
    });
    bars.current.forEach((b, i) => {
      if (!b) return;
      const h = 0.25 + Math.abs(wave(m.t, 4, i * 0.13)) * 0.45 * energy + Math.abs(wave(m.t, 2, i * 0.29)) * 0.25 + press * 0.6;
      const s = Math.min(1, h);
      b.scale.y = Math.max(0.12, s);
      b.position.y = 0.27 - 0.16 + (0.32 * Math.max(0.12, s)) / 2;
      const mat = barMats.current[i];
      if (mat) mat.emissiveIntensity = 0.8 + s * 1.6 + press * 2;
    });
    if (onAir.current) onAir.current.emissiveIntensity = 0.6 + blink(m.t, 0.25, 0.05) * 3 + blink(m.t, 0.75, 0.05) * 3 + press * 3;
    if (antenna.current) antenna.current.rotation.z = -0.5 + wave(m.t, 2) * 0.06 * energy - press * 0.25;
  });

  return (
    <IconMotion seed={73}>
      <group rotation={[0.22, -0.38, 0]} position={[0, -0.22, 0]} scale={0.98}>
        {/* body */}
        <RoundedBox args={[2.7, 1.5, 0.72]} radius={0.22} smoothness={6}>
          <Surface kind={p.material} c={p.body} />
        </RoundedBox>
        {/* front bezel panel */}
        <RoundedBox args={[2.5, 1.28, 0.06]} radius={0.05} smoothness={4} position={[0, -0.04, FRONT - 0.01]}>
          <meshPhysicalMaterial color={p.grille} roughness={0.5} clearcoat={0.4} />
        </RoundedBox>

        {/* speakers: grille disc, glowing ring, cone that thumps, dust cap */}
        {SPK_X.map((x, i) => (
          <group key={i} position={[x, -0.1, FRONT + 0.03]}>
            <mesh>
              <torusGeometry args={[0.47, 0.06, 20, 64]} />
              <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.body} />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <torusGeometry args={[0.395, 0.022, 12, 64]} />
              <meshStandardMaterial ref={(el) => void (rings.current[i] = el)} color={p.ring} emissive={p.ring} emissiveIntensity={0.9} roughness={0.3} />
            </mesh>
            <group ref={(el) => void (cones.current[i] = el)}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.06]}>
                <coneGeometry args={[0.37, 0.12, 48, 1, true]} />
                <meshStandardMaterial color="#1A1018" roughness={0.75} side={2} />
              </mesh>
              <mesh position={[0, 0, 0.0]} scale={[1, 1, 0.55]}>
                <sphereGeometry args={[0.13, 32, 16]} />
                <meshPhysicalMaterial color={p.body} roughness={0.3} clearcoat={1} />
              </mesh>
            </group>
          </group>
        ))}

        {/* centre: tape window with EQ bars and two tweeters */}
        <RoundedBox args={[0.78, 0.46, 0.05]} radius={0.06} smoothness={4} position={[0, 0.27, FRONT + 0.02]}>
          <meshPhysicalMaterial color="#120A12" roughness={0.25} clearcoat={1} />
        </RoundedBox>
        {Array.from({ length: BARS }, (_, i) => {
          const c = i === 4 ? p.light : p.glow;
          return (
            <mesh key={i} ref={(el) => void (bars.current[i] = el)} position={[-0.28 + (i * 0.56) / (BARS - 1), 0.27, FRONT + 0.05]}>
              <boxGeometry args={[0.045, 0.32, 0.02]} />
              <meshStandardMaterial ref={(el) => void (barMats.current[i] = el)} color={c} emissive={c} emissiveIntensity={1.2} roughness={0.3} />
            </mesh>
          );
        })}
        {[-0.2, 0.2].map((x, i) => (
          <group key={i} ref={(el) => void (tweeters.current[i] = el)} position={[x, -0.3, FRONT + 0.03]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.04, 32]} />
              <meshStandardMaterial color="#1A1018" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.03]} scale={[1, 1, 0.5]}>
              <sphereGeometry args={[0.06, 24, 12]} />
              <meshPhysicalMaterial color={p.ring} roughness={0.3} clearcoat={1} />
            </mesh>
          </group>
        ))}

        {/* top: carry handle, buttons, on-air light, antenna */}
        <mesh position={[0, 0.98, 0]}>
          <torusGeometry args={[0.72, 0.075, 20, 64, Math.PI]} />
          <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.body} />
        </mesh>
        {[-0.72, 0.72].map((x, i) => (
          <RoundedBox key={i} args={[0.2, 0.26, 0.22]} radius={0.06} smoothness={4} position={[x, 0.86, 0]}>
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.body} />
          </RoundedBox>
        ))}
        {[-0.3, -0.1, 0.1].map((x, i) => (
          <RoundedBox key={i} args={[0.15, 0.08, 0.2]} radius={0.03} smoothness={3} position={[x, 0.77, 0.12]}>
            <meshPhysicalMaterial color={i === 0 ? p.ring : p.grille} roughness={0.3} clearcoat={1} />
          </RoundedBox>
        ))}
        <mesh position={[0.34, 0.78, 0.12]}>
          <sphereGeometry args={[0.065, 24, 16]} />
          <meshStandardMaterial ref={onAir} color={p.light} emissive={p.light} emissiveIntensity={0.6} roughness={0.25} />
        </mesh>
        <group ref={antenna} position={[1.05, 0.72, -0.2]} rotation={[0, 0, -0.5]}>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.018, 0.026, 1.1, 12]} />
            <meshStandardMaterial color="#D9D4CF" metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.12, 0]}>
            <sphereGeometry args={[0.045, 16, 12]} />
            <meshStandardMaterial color={p.light} emissive={p.light} emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
