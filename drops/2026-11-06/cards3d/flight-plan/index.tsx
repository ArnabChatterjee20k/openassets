import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Flight Plan',
  description: 'Project card for Towline Flight Plan, the campaign planner: a glossy white pocket compass whose glowing needle hunts for north. Light is seeded by the project name.',
  tags: ['card', 'planner', 'compass', 'strategy', 'project'],
};

export const schema = beamSchema({ name: 'Flight Plan' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'route-planner': { name: 'Route Planner' },
  'audience-map': { name: 'Audience Map' },
  watermelon: { lightMode: 'custom', light: '#FF4F6D' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function FlightPlan(p: P) {
  const light = beamLight(p).color;
  const needle = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the needle hunts around north and settles; hover steadies + brightens it;
  // a click spins it a full turn.
  useLoop((m) => {
    if (needle.current) {
      const spin = m.pressAge < 1.1 ? THREE.MathUtils.smootherstep(m.pressAge / 1.1, 0, 1) * Math.PI * 2 : 0;
      const hunt = (wave(m.t, 1) * 0.3 + wave(m.t, 4, 0.1) * 0.06) * (1 - m.hover * 0.7);
      needle.current.rotation.z = hunt + spin;
    }
    if (glow.current) glow.current.emissiveIntensity = 1.6 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + m.hover * 0.8 + Math.abs(pressBounce(m.pressAge)) * 1.5;
  });

  const ticks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <IconMotion seed={57}>
      <group position={[0, -0.1, 0]} rotation={[0.3, -0.16, 0.06]} scale={1.1}>
        {/* case */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.82, 0.86, 0.26, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0, 0.13]}>
          <torusGeometry args={[0.8, 0.07, 24, 72]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* bow ring on top */}
        <mesh position={[0, 0.98, 0]}>
          <torusGeometry args={[0.15, 0.045, 16, 40]} />
          <Shell finish={p.finish === 'matte' ? 'glossy' : p.finish} color="#E6E4E2" />
        </mesh>
        <mesh position={[0, 0.86, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.12, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* dial face */}
        <mesh position={[0, 0, 0.131]}>
          <circleGeometry args={[0.73, 64]} />
          <meshPhysicalMaterial color="#1A1418" roughness={0.45} clearcoat={0.4} />
        </mesh>
        {/* tick ring */}
        {ticks.map((i) => {
          const a = (i / 24) * Math.PI * 2;
          const big = i % 6 === 0;
          const r = 0.63;
          return (
            <mesh key={i} position={[Math.sin(a) * r, Math.cos(a) * r, 0.14]} rotation={[0, 0, -a]}>
              <boxGeometry args={[big ? 0.035 : 0.016, big ? 0.12 : 0.06, 0.01]} />
              <meshStandardMaterial color={i === 0 ? light : '#E8E4E0'} emissive={i === 0 ? light : '#000000'} emissiveIntensity={i === 0 ? 1.5 : 0} />
            </mesh>
          );
        })}
        {/* needle: glowing north half, white south half */}
        <group ref={needle} position={[0, 0, 0.16]}>
          <mesh position={[0, 0.25, 0]} scale={[1, 1, 0.45]}>
            <coneGeometry args={[0.12, 0.5, 4]} />
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.21, 0]} rotation={[0, 0, Math.PI]} scale={[1, 1, 0.45]}>
            <coneGeometry args={[0.12, 0.42, 4]} />
            <meshPhysicalMaterial color="#F4F2F0" roughness={0.25} clearcoat={1} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.06, 24]} />
            <Shell finish={p.finish === 'matte' ? 'glossy' : p.finish} />
          </mesh>
        </group>
        {/* glass dome */}
        <mesh position={[0, 0, 0.12]} scale={[1, 1, 0.22]}>
          <sphereGeometry args={[0.76, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} transmission={1} thickness={0.1} ior={1.3} transparent opacity={0.6} />
        </mesh>
      </group>
    </IconMotion>
  );
}
