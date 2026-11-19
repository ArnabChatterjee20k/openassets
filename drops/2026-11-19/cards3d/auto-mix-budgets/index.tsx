import { useRef } from 'react';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Auto-Mix Budgets',
  description: 'Project card for Crossfade Auto-Mix Budgets: a glossy white rotary knob whose LED ring sweeps as the agent turns spend up, lit by beams seeded from the project name.',
  tags: ['card', 'budget', 'knob', 'autopilot', 'project'],
};

export const schema = beamSchema({ name: 'Auto-Mix Budgets' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'spend-pacer': { name: 'Spend Pacer' },
  'bid-rider': { name: 'Bid Rider' },
  sunset: { lightMode: 'custom', light: '#FF8E5E' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const DOTS = 15;
const ARC = Math.PI * 1.5; // the ring spans 270°, like a real gain knob
const START = Math.PI * 1.25;

export default function AutoMixBudgets(p: P) {
  const light = beamLight(p).color;
  const knob = useRef<THREE.Group>(null);
  const dots = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Idle: the agent nudges the knob up and back; the LED ring follows the
  // pointer. Hover turns it up further; a click spins it with a kick.
  useLoop((m) => {
    const level = 0.55 + wave(m.t, 1) * 0.22 + m.hover * 0.2 + pressBounce(m.pressAge) * 0.4;
    const lv = Math.min(1, Math.max(0.05, level));
    if (knob.current) knob.current.rotation.y = -(START - ARC * lv) + Math.PI / 2;
    dots.current.forEach((d, i) => {
      if (!d) return;
      const on = i / (DOTS - 1) <= lv;
      d.emissiveIntensity = on ? (i / (DOTS - 1) > lv - 0.08 ? 3.2 : 1.8) : 0.05;
    });
  });

  return (
    <IconMotion seed={51}>
      <group rotation={[0.5, 0, 0]} position={[0, -0.3, 0]} scale={1.25}>
        {/* base plate */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[1.06, 1.1, 0.18, 64]} />
          <Shell finish={p.finish} color="#E9E6E3" />
        </mesh>
        {/* LED ring */}
        {Array.from({ length: DOTS }, (_, i) => {
          const a = START - (ARC * i) / (DOTS - 1);
          return (
            <mesh key={i} position={[Math.cos(a) * 0.9, -0.01, -Math.sin(a) * 0.9]}>
              <sphereGeometry args={[0.07, 16, 12]} />
              <meshStandardMaterial ref={(el) => void (dots.current[i] = el)} color="#1A1418" emissive={light} emissiveIntensity={1.5} roughness={0.3} />
            </mesh>
          );
        })}
        {/* knob */}
        <group ref={knob}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.6, 0.66, 0.42, 48]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* grip ridges */}
          {Array.from({ length: 28 }, (_, i) => {
            const a = (i / 28) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.635, 0.12, Math.sin(a) * 0.635]} rotation={[0, -a, 0]}>
                <boxGeometry args={[0.04, 0.36, 0.05]} />
                <Shell finish={p.finish} color="#E2DFDC" />
              </mesh>
            );
          })}
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.5, 0.58, 0.04, 48]} />
            <Shell finish={p.finish} color="#FBFAF9" />
          </mesh>
          {/* indicator */}
          <mesh position={[0.32, 0.37, 0]}>
            <boxGeometry args={[0.3, 0.02, 0.06]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2.2} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
