import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Autopilot',
  description: 'Project card for Formwork Autopilot, the hourly budget pilot: a glossy white compass whose glowing needle hunts and settles. Lit by beams seeded from the project name.',
  tags: ['card', 'autopilot', 'budget', 'compass', 'project'],
};

export const schema = beamSchema({ name: 'Autopilot' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'budget-pilot': { name: 'Budget Pilot' },
  'pacing': { name: 'Spend Pacing' },
  vermilion: { lightMode: 'custom', light: '#FF5A36' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', beams: 0.6 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2EE' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function Autopilot(p: P) {
  const light = beamLight(p).color;
  const needle = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the needle hunts left/right and settles, like the agent rebalancing.
  // Hover widens the hunt and brightens it; a click spins it a full turn.
  useLoop((m) => {
    const kick = pressBounce(m.pressAge);
    if (needle.current) needle.current.rotation.z = 0.5 + wave(m.t, 1) * (0.22 + m.hover * 0.3) + wave(m.t, 4, 0.2) * 0.04 + kick * 2.4;
    if (glow.current) glow.current.emissiveIntensity = 2.2 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + m.hover * 0.8 + Math.abs(kick) * 2;
  });

  return (
    <IconMotion seed={31}>
      <group position={[0, -0.12, 0]} rotation={[0.22, -0.28, 0]} scale={1.05}>
        {/* case */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.26, 72]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0, 0.13]}>
          <torusGeometry args={[0.86, 0.07, 24, 96]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* lanyard bail */}
        <mesh position={[0, 1.0, 0]}>
          <torusGeometry args={[0.16, 0.045, 16, 40]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* dark face so the needle glows */}
        <mesh position={[0, 0, 0.131]}>
          <circleGeometry args={[0.8, 72]} />
          <meshPhysicalMaterial color="#1E1D1B" roughness={0.45} clearcoat={0.6} />
        </mesh>
        {/* tick marks */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const major = i % 3 === 0;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.66, Math.cos(a) * 0.66, 0.135]} rotation={[0, 0, -a]}>
              <planeGeometry args={[major ? 0.05 : 0.025, major ? 0.16 : 0.08]} />
              <meshStandardMaterial color="#D9D4CA" />
            </mesh>
          );
        })}
        {/* glowing needle */}
        <group ref={needle} position={[0, 0, 0.17]} rotation={[0, 0, 0.5]}>
          <mesh position={[0, 0.3, 0]} scale={[1, 1, 0.35]}>
            <coneGeometry args={[0.13, 0.6, 4]} />
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI]} scale={[1, 1, 0.35]}>
            <coneGeometry args={[0.13, 0.6, 4]} />
            <meshStandardMaterial color="#F1EEE8" roughness={0.4} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 32]} />
          <Shell finish={p.finish === 'matte' ? 'glossy' : p.finish} />
        </mesh>
        {/* glass dome */}
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.22, 1]}>
          <sphereGeometry args={[0.8, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} transmission={1} thickness={0.2} clearcoat={1} transparent opacity={0.6} />
        </mesh>
      </group>
    </IconMotion>
  );
}
