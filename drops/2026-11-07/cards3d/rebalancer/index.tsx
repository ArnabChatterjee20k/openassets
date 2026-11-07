import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Rebalancer',
  description: 'Project card for Mandate Rebalancer: a glossy white balance scale with a glowing pivot gem; the pans tip and settle as budget moves to winners.',
  tags: ['card', 'rebalance', 'budget', 'scales', 'project'],
};

export const schema = beamSchema({ name: 'Rebalancer' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'overnight-moves': { name: 'Overnight Moves' },
  'portfolio-view': { name: 'Portfolio View' },
  gold: { lightMode: 'custom', light: '#C9A45C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** One hanging pan: three thin cords and a shallow dish. */
function Pan({ x, panRef, finish }: { x: number; panRef: (g: THREE.Group | null) => void; finish: P['finish'] }) {
  return (
    <group position={[x, 0, 0]}>
      <group ref={panRef}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + 0.4;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.16, -0.32, Math.sin(a) * 0.16]} rotation={[Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]}>
              <cylinderGeometry args={[0.016, 0.016, 0.66, 8]} />
              <meshStandardMaterial color="#B9BCC4" metalness={1} roughness={0.3} />
            </mesh>
          );
        })}
        <mesh position={[0, -0.68, 0]}>
          <cylinderGeometry args={[0.36, 0.22, 0.14, 48]} />
          <Shell finish={finish} />
        </mesh>
      </group>
    </group>
  );
}

export default function Rebalancer(p: P) {
  const light = beamLight(p).color;
  const beam = useRef<THREE.Group>(null);
  const gem = useRef<THREE.MeshStandardMaterial>(null);
  const pans = useRef<(THREE.Group | null)[]>([]);

  // Idle: the beam tips one way then the other (a rebalance), the gem pulses
  // on each swing; hover steadies it level, a click knocks it and it rocks back.
  useLoop((m) => {
    const tilt = wave(m.t, 1) * 0.16 * (1 - m.hover * 0.7) + pressBounce(m.pressAge) * 0.35;
    if (beam.current) beam.current.rotation.z = tilt;
    // Pans hang plumb: counter-rotate so they stay level.
    pans.current.forEach((g) => g && (g.rotation.z = -tilt));
    if (gem.current) gem.current.emissiveIntensity = 1.4 + Math.abs(wave(m.t, 2)) * 1.2 + m.hover * 0.8;
  });

  return (
    <IconMotion seed={23} float={0.05}>
      <group position={[0, -0.02, 0]} rotation={[0.12, -0.3, 0]} scale={1.15}>
        {/* base and column */}
        <mesh position={[0, -0.92, 0]}>
          <cylinderGeometry args={[0.42, 0.5, 0.12, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, -0.84, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.08, 40]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.085, 0.11, 1.5, 32]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* pivot gem: the one glowing accent */}
        <mesh position={[0, 0.76, 0]}>
          <octahedronGeometry args={[0.21, 0]} />
          <meshStandardMaterial ref={gem} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.2} toneMapped={false} />
        </mesh>
        {/* beam with pans */}
        <group ref={beam} position={[0, 0.56, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.07, 1.6, 8, 24]} />
            <Shell finish={p.finish} />
          </mesh>
          {[-0.82, 0.82].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <sphereGeometry args={[0.07, 24, 24]} />
              <Shell finish={p.finish} />
            </mesh>
          ))}
          <Pan x={-0.82} finish={p.finish} panRef={(g) => void (pans.current[0] = g)} />
          <Pan x={0.82} finish={p.finish} panRef={(g) => void (pans.current[1] = g)} />
        </group>
      </group>
    </IconMotion>
  );
}
