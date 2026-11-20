import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Budget Pacer',
  description: 'Feature card for Inkrun Budget Pacer: a glossy white stopwatch with a glowing bezel and a sweeping hand, lit by beams seeded from the feature name.',
  tags: ['card', 'budget', 'pacing', 'stopwatch', 'feature'],
};

export const schema = beamSchema({ name: 'Budget Pacer' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dayparting: { name: 'Dayparting' },
  'spend-caps': { name: 'Spend Caps' },
  ultraviolet: { lightMode: 'custom', light: '#B026FF' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEF4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F6F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function BudgetPacer(p: P) {
  const light = beamLight(p).color;
  const hand = useRef<THREE.Group>(null);
  const bezel = useRef<THREE.MeshStandardMaterial>(null);
  const crown = useRef<THREE.Group>(null);

  // Idle: the hand sweeps one full turn per loop and the bezel breathes;
  // hover brightens; a click presses the crown and snaps the hand.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    if (hand.current) hand.current.rotation.z = -cycle(m.t, 1) * Math.PI * 2 - b * 0.5;
    if (bezel.current) bezel.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + m.hover * 0.9 + Math.abs(b) * 1.5;
    if (crown.current) crown.current.position.y = 0.98 - Math.max(0, b) * 0.08;
  });

  return (
    <IconMotion seed={23}>
      <group rotation={[0.18, -0.4, 0.08]} position={[0, -0.32, 0]} scale={1.3}>
        {/* case */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.78, 0.78, 0.3, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0, 0.15]}>
          <torusGeometry args={[0.72, 0.07, 24, 72]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing bezel ring */}
        <mesh position={[0, 0, 0.17]}>
          <torusGeometry args={[0.6, 0.03, 16, 72]} />
          <meshStandardMaterial ref={bezel} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* dial face */}
        <mesh position={[0, 0, 0.152]}>
          <circleGeometry args={[0.56, 64]} />
          <meshPhysicalMaterial color="#EDE8F0" roughness={0.4} />
        </mesh>
        {/* ticks */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const r = 0.47;
          return (
            <mesh key={i} position={[Math.sin(a) * r, Math.cos(a) * r, 0.16]} rotation={[0, 0, -a]}>
              <boxGeometry args={[0.025, i % 3 === 0 ? 0.1 : 0.05, 0.01]} />
              <meshStandardMaterial color="#6E6878" />
            </mesh>
          );
        })}
        {/* hand */}
        <group ref={hand} position={[0, 0, 0.18]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.035, 0.44, 0.02]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.2} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 24]} />
            <meshStandardMaterial color="#3A3446" />
          </mesh>
        </group>
        {/* crown + side pusher */}
        <group ref={crown} position={[0, 0.98, 0]}>
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.12, 20]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.1, 32]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
        <mesh position={[0.6, 0.66, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.065, 0.065, 0.18, 20]} />
          <Shell finish={p.finish} />
        </mesh>
      </group>
    </IconMotion>
  );
}
