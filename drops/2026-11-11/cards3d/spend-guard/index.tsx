import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Spend Guard',
  description: 'Project card for Mimo Spend Guard: a glossy white piggy bank whose coin slot glows in the beam light as a coin drops in, for daily caps and budget pacing.',
  tags: ['card', 'budget', 'spend', 'piggy bank', 'project'],
};

export const schema = beamSchema({ name: 'Spend Guard' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'daily-caps': { name: 'Daily Caps' },
  'budget-pacing': { name: 'Budget Pacing' },
  bubblegum: { lightMode: 'custom', light: '#FF3DB4' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#DCE0E8" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F2F5" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F5F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function SpendGuard(p: P) {
  const light = beamLight(p).color;
  const coin = useRef<THREE.Group>(null);
  const slot = useRef<THREE.MeshStandardMaterial>(null);
  const tail = useRef<THREE.Mesh>(null);

  // Idle: a coin drops into the slot once per loop and the slot flares; the tail wiggles.
  // Hover: the slot glows brighter. Click: a second coin plinks in (squash from IconMotion).
  useLoop((m) => {
    const u = cycle(m.t, 1, 0.1);
    const pop = Math.abs(pressBounce(m.pressAge));
    if (coin.current) {
      const fall = Math.min(1, u / 0.55);
      coin.current.position.y = 1.15 - fall * fall * 0.6;
      coin.current.rotation.y = u * Math.PI * 4;
      coin.current.scale.setScalar(u < 0.55 ? Math.min(1, u * 8) : 0.001);
    }
    if (slot.current) {
      const flare = u > 0.55 ? Math.exp(-(u - 0.55) * 10) : 0;
      slot.current.emissiveIntensity = 1.3 + flare * 2.5 + m.hover * 0.8 + pop * 2;
    }
    if (tail.current) tail.current.rotation.z = wave(m.t, 2) * 0.35;
  });

  return (
    <IconMotion seed={88}>
      <group position={[0, -0.3, 0]} rotation={[0.12, -0.7, 0]} scale={1.3}>
        {/* body: one scaled sphere, seamless */}
        <mesh scale={[1.05, 0.82, 0.82]} castShadow>
          <sphereGeometry args={[0.72, 64, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* snout */}
        <mesh position={[0.74, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.25, 0.18, 40]} />
          <Shell finish={p.finish} />
        </mesh>
        {[-0.07, 0.07].map((z, i) => (
          <mesh key={i} position={[0.835, -0.02, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
            <meshStandardMaterial color="#9EA3AD" roughness={0.5} />
          </mesh>
        ))}
        {/* ears */}
        {[-0.28, 0.28].map((z, i) => (
          <mesh key={i} position={[0.42, 0.52, z]} rotation={[z * 0.8, 0, -0.5]}>
            <coneGeometry args={[0.14, 0.26, 24]} />
            <Shell finish={p.finish} />
          </mesh>
        ))}
        {/* legs */}
        {[
          [0.38, 0.28],
          [0.38, -0.28],
          [-0.38, 0.28],
          [-0.38, -0.28],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.6, z]}>
            <cylinderGeometry args={[0.12, 0.11, 0.2, 24]} />
            <Shell finish={p.finish} />
          </mesh>
        ))}
        {/* curly tail */}
        <mesh ref={tail} position={[-0.78, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.08, 0.025, 12, 32, Math.PI * 1.6]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing coin slot on the back */}
        <mesh position={[-0.02, 0.585, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.36, 0.04, 0.07]} />
          <meshStandardMaterial ref={slot} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} />
        </mesh>
        {/* coin */}
        <group ref={coin} position={[-0.02, 1.15, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 40]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.9} metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
