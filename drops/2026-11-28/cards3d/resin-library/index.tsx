import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Resin Library',
  description: 'Project card for the Sprue Resin Library (ABS, PC, PA12, TPU): a glossy white pellet canister with a glowing grade band and a screw lid that peeks open.',
  tags: ['card', 'resin', 'materials', 'canister', 'plastic', 'project'],
};

export const schema = beamSchema({ name: 'Resin Library' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'pa12-nylon': { name: 'PA12 Nylon' },
  'color-match': { name: 'Color Match' },
  orange: { lightMode: 'custom', light: '#FF9F43' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

// Loose pellets tumbled at the canister's foot.
const PELLETS: [number, number, number, number][] = [
  [0.62, -0.74, 0.25, 0.3],
  [0.78, -0.75, 0.05, 1.2],
  [0.7, -0.72, -0.18, 2.1],
  [-0.66, -0.74, 0.2, 0.8],
];

export default function ResinLibrary(p: P) {
  const light = beamLight(p).color;
  const lid = useRef<THREE.Group>(null);
  const band = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the lid lifts and twists a quarter turn and back; the band breathes. Hover lifts it higher; click pops it.
  useLoop((m) => {
    const peek = Math.max(0, wave(m.t, 1, 0.75)) ** 3;
    const pop = Math.max(0, pressBounce(m.pressAge));
    if (lid.current) {
      lid.current.position.y = 0.52 + peek * 0.1 + m.hover * 0.12 + pop * 0.3;
      lid.current.rotation.y = peek * 0.8 + pop * 1.5;
    }
    if (band.current) band.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8 + m.hover * 0.8 + pop * 2;
  });

  return (
    <IconMotion seed={57}>
      <group rotation={[0.18, -0.3, 0]} position={[0, -0.12, 0]} scale={1.4}>
        {/* body */}
        <mesh>
          <cylinderGeometry args={[0.48, 0.5, 1.0, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* bottom rim */}
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.47, 0.04, 16, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.48, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing grade band */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.495, 0.497, 0.16, 64, 1, true]} />
          <meshStandardMaterial ref={band} color={light} emissive={light} emissiveIntensity={1.6} side={THREE.DoubleSide} />
        </mesh>
        {/* label panel */}
        <mesh position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.499, 0.501, 0.2, 64, 1, true, -0.6, 1.2]} />
          <meshStandardMaterial color="#D6D9D2" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        {/* screw lid with grip ribs */}
        <group ref={lid} position={[0, 0.52, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.52, 0.52, 0.2, 64]} />
            <Shell finish={p.finish} />
          </mesh>
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.525, 0.08, Math.sin(a) * 0.525]} rotation={[0, -a, 0]}>
                <boxGeometry args={[0.02, 0.16, 0.03]} />
                <Shell finish={p.finish} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.185, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.44, 0.025, 12, 64]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
        {/* spilled pellets */}
        {PELLETS.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[r, r * 0.7, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.09, 24]} />
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
