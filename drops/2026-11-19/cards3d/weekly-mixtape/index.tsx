import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Weekly Mixtape',
  description: 'Project card for the Crossfade Weekly Mixtape, the Monday report the agent sends with spend and ROAS by platform: a glossy white cassette whose reels turn behind a glowing tape window.',
  tags: ['card', 'report', 'cassette', 'digest', 'project'],
};

export const schema = beamSchema({ name: 'Weekly Mixtape' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'monday-digest': { name: 'Monday Digest' },
  'roas-recap': { name: 'ROAS Recap' },
  rose: { lightMode: 'custom', light: '#E5487A' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const REEL_X = [-0.42, 0.42];
const Z = 0.13; // front face

export default function WeeklyMixtape(p: P) {
  const light = beamLight(p).color;
  const reels = useRef<(THREE.Group | null)[]>([]);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const tape = useRef<(THREE.Mesh | null)[]>([]);

  // Idle: the reels turn (two turns per loop), the window glow breathes with a
  // blink as the tape passes the head. Hover fast-forwards; a click rewinds.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const spin = (cycle(m.t, 2) + m.hover * cycle(m.t, 4)) * Math.PI * 2;
    reels.current.forEach((g) => {
      if (g) g.rotation.z = -spin + press * 3;
    });
    // tape pack: the left reel slowly empties into the right one and back.
    const u = 0.5 + 0.5 * Math.sin((m.t / 4) * Math.PI * 2);
    tape.current.forEach((t, i) => {
      if (t) {
        const s = 0.82 + (i === 0 ? 1 - u : u) * 0.36;
        t.scale.set(s, s, 1);
      }
    });
    if (glow.current) glow.current.emissiveIntensity = 1.6 + blink(m.t, 0.5, 0.05) * 2 + m.hover * 0.8 + Math.abs(press) * 3;
  });

  return (
    <IconMotion seed={64}>
      <group rotation={[-0.08, -0.32, 0]} position={[0, -0.12, 0]} scale={1.38}>
        {/* shell */}
        <RoundedBox args={[2.1, 1.32, 0.26]} radius={0.1} smoothness={6}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* trapezoid head guard at the bottom */}
        <RoundedBox args={[1.3, 0.3, 0.06]} radius={0.04} smoothness={4} position={[0, -0.5, Z + 0.01]}>
          <Shell finish={p.finish} color="#E9E6E3" />
        </RoundedBox>
        {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
          <mesh key={i} position={[x, -0.5, Z + 0.045]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
            <meshStandardMaterial color="#2A2228" roughness={0.6} />
          </mesh>
        ))}
        {/* label area (raised) */}
        <RoundedBox args={[1.84, 0.82, 0.04]} radius={0.06} smoothness={4} position={[0, 0.12, Z + 0.005]}>
          <Shell finish={p.finish} color="#FBFAF9" />
        </RoundedBox>
        {/* the glowing tape window */}
        <RoundedBox args={[1.22, 0.42, 0.03]} radius={0.12} smoothness={4} position={[0, 0.08, Z + 0.03]}>
          <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.35} />
        </RoundedBox>
        {/* tape packs + reels */}
        {REEL_X.map((x, i) => (
          <group key={i} position={[x, 0.08, Z + 0.05]}>
            <mesh ref={(el) => void (tape.current[i] = el)} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.01, 40]} />
              <meshStandardMaterial color="#2A1A22" roughness={0.5} transparent opacity={0.85} />
            </mesh>
            <group ref={(el) => void (reels.current[i] = el)} position={[0, 0, 0.01]}>
              <mesh>
                <torusGeometry args={[0.11, 0.028, 12, 32]} />
                <Shell finish={p.finish} />
              </mesh>
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <mesh key={k} rotation={[0, 0, (k / 6) * Math.PI * 2]} position={[Math.cos((k / 6) * Math.PI * 2) * 0.1, Math.sin((k / 6) * Math.PI * 2) * 0.1, 0]}>
                  <boxGeometry args={[0.05, 0.025, 0.02]} />
                  <Shell finish={p.finish} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
        {/* screws */}
        {[[-0.95, 0.56], [0.95, 0.56], [-0.95, -0.56], [0.95, -0.56]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, Z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
            <meshStandardMaterial color="#B9B4B0" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
