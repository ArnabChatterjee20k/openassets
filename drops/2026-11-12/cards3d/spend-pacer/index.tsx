import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Spend Pacer',
  description: 'Project card for Junction Spend Pacer, which keeps every platform on budget through the month: a glossy white stopwatch with a glowing bezel ring and a sweeping hand.',
  tags: ['card', 'budget', 'pacing', 'stopwatch', 'project'],
};

export const schema = beamSchema({ name: 'Spend Pacer' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'budget guard': { name: 'Budget Guard' },
  'flight clock': { name: 'Flight Clock' },
  lime: { lightMode: 'custom', light: '#2BB24C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function SpendPacer(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const hand = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);

  // Idle: the hand sweeps one full lap per loop, the bezel glow breathes twice.
  // Hover brightens the ring; click presses the crown and kicks the hand forward.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (hand.current) hand.current.rotation.z = -cycle(m.t, 1) * Math.PI * 2 - Math.abs(press) * 0.6;
    if (ring.current) ring.current.emissiveIntensity = 1.2 + (0.5 + 0.5 * wave(m.t, 2)) * 0.7 + m.hover * 1;
    if (crown.current) crown.current.position.y = 0.98 - Math.max(0, press) * 0.08;
  });

  return (
    <IconMotion seed={57}>
      <group position={[0, -0.12, 0]} rotation={[0.12, -0.4, 0.06]} scale={1.12}>
        {/* case */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.78, 0.78, 0.3, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.78, 0.08, 24, 96]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing bezel ring */}
        <mesh position={[0, 0, 0.16]}>
          <torusGeometry args={[0.66, 0.035, 20, 96]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} />
        </mesh>
        {/* dial face + ticks */}
        <mesh position={[0, 0, 0.152]}>
          <circleGeometry args={[0.6, 64]} />
          <meshPhysicalMaterial color="#FBFAF6" roughness={0.35} clearcoat={0.6} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const big = i % 3 === 0;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.5, Math.cos(a) * 0.5, 0.16]} rotation={[0, 0, -a]}>
              <boxGeometry args={[big ? 0.035 : 0.022, big ? 0.11 : 0.06, 0.01]} />
              <meshStandardMaterial color="#2A2E2A" />
            </mesh>
          );
        })}
        {/* hand */}
        <group ref={hand} position={[0, 0, 0.17]}>
          <RoundedBox args={[0.045, 0.5, 0.025]} radius={0.012} smoothness={3} position={[0, 0.2, 0]}>
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.9} />
          </RoundedBox>
        </group>
        <mesh position={[0, 0, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 24]} />
          <meshStandardMaterial color="#2A2E2A" />
        </mesh>
        {/* crown and side button */}
        <group ref={crown} position={[0, 0.98, 0]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.13, 0.12, 32]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.12, 24]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
        <group position={[0.62, 0.62, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.12, 24]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
