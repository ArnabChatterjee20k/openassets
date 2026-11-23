import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Crate Battery',
  description: 'Project card for the Sparkcrate 480 kWh LFP battery: a glossy white cell with a glowing charge column that fills and breathes.',
  tags: ['card', 'battery', 'storage', 'lfp', 'project'],
};

export const schema = beamSchema({ name: 'Crate Battery' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
  level: select(['full', 'half'], 'Charge level').default('full'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-reserve': { name: 'Night Reserve' },
  'lfp-480': { name: 'LFP 480' },
  green: { lightMode: 'custom', light: '#00D1A0' },
  chrome: { finish: 'chrome' },
  half: { level: 'half', finish: 'matte', glow: 0.6 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function CrateBattery(p: P) {
  const light = beamLight(p).color;
  const fill = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const bolt = useRef<THREE.Mesh>(null);
  const top = p.level === 'full' ? 1 : 0.55;

  // Idle: the charge column breathes up and down a little and glows; hover tops
  // it up; a click spins the cap terminal and flashes.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const lvl = Math.min(1, top - 0.06 + (wave(m.t, 1, 0.75) + 1) * 0.03 + m.hover * 0.15);
    if (fill.current) {
      fill.current.scale.y = lvl;
      fill.current.position.y = -0.55 + (1.1 * lvl) / 2;
    }
    if (glow.current) glow.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + m.hover * 0.8 + Math.abs(press) * 3;
    if (bolt.current) bolt.current.rotation.y = press * 3;
  });

  return (
    <IconMotion seed={58}>
      <group position={[0, -0.05, 0]} rotation={[0.16, -0.32, 0]} scale={1.2}>
        {/* cell body: a rounded can */}
        <RoundedBox args={[0.95, 1.45, 0.95]} radius={0.22} smoothness={6}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* window slot with the glowing charge column */}
        <RoundedBox args={[0.36, 1.2, 0.08]} radius={0.06} smoothness={4} position={[0, 0, 0.47]}>
          <meshPhysicalMaterial color="#16171C" roughness={0.2} clearcoat={1} />
        </RoundedBox>
        <mesh ref={fill} position={[0, 0, 0.52]}>
          <boxGeometry args={[0.24, 1.1, 0.03]} />
          <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* positive terminal */}
        <mesh ref={bolt} position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.16, 32]} />
          <Shell finish={p.finish === 'chrome' ? 'glossy' : 'chrome'} />
        </mesh>
        {/* base skirt */}
        <RoundedBox args={[1.02, 0.14, 1.02]} radius={0.06} smoothness={4} position={[0, -0.7, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
      </group>
    </IconMotion>
  );
}
