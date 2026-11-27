import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Bridge Watch',
  description: 'Project card for Plumbline Bridge Watch: a glossy white deck-arch bridge with a glowing strain line along its deck, lit by beams seeded from the project name.',
  tags: ['card', 'bridge', 'structure', 'monitoring', 'project'],
};

export const schema = beamSchema({ name: 'Bridge Watch' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'span-alerts': { name: 'Span Alerts' },
  'viaduct-12': { name: 'Viaduct 12' },
  molten: { lightMode: 'custom', light: '#FF4D00' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.5 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F2EE" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const ARCH_R = 0.78;
const COLS = [-0.56, -0.3, 0.3, 0.56];

export default function BridgeWatch(p: P) {
  const light = beamLight(p).color;
  const strip = useRef<THREE.MeshStandardMaterial>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const deck = useRef<THREE.Group>(null);

  // Idle: a bright pulse travels along the deck strip (a train of data), the strip breathes.
  // Hover speeds the scan; a click makes the deck flex like a load test.
  useLoop((m) => {
    if (strip.current) strip.current.emissiveIntensity = 1.1 + (0.5 + 0.5 * wave(m.t, 2)) * 0.6 + m.hover * 0.8;
    if (pulse.current) {
      const u = cycle(m.t, m.hover > 0.5 ? 2 : 1);
      pulse.current.position.x = -1.05 + u * 2.1;
      pulse.current.scale.setScalar(0.6 + Math.sin(Math.PI * u) * 0.6);
    }
    if (deck.current) deck.current.position.y = -pressBounce(m.pressAge) * 0.05;
  });

  return (
    <IconMotion seed={23} float={0.05} sway={0.1}>
      <group rotation={[0.02, -0.12, 0]} position={[0, -0.12, 0]} scale={0.95}>
        {/* the arch: a half torus springing from two footings */}
        <mesh position={[0, -0.5, 0]}>
          <torusGeometry args={[ARCH_R, 0.09, 24, 64, Math.PI]} />
          <Shell finish={p.finish} />
        </mesh>
        {[-ARCH_R, ARCH_R].map((x) => (
          <RoundedBox key={x} args={[0.32, 0.18, 0.4]} radius={0.05} smoothness={4} position={[x, -0.56, 0]}>
            <Shell finish={p.finish} />
          </RoundedBox>
        ))}
        {/* spandrel columns from the arch to the deck */}
        {COLS.map((x) => {
          const y0 = -0.5 + Math.sqrt(ARCH_R * ARCH_R - x * x);
          const h = 0.42 - y0;
          return (
            <mesh key={x} position={[x, y0 + h / 2, 0]}>
              <cylinderGeometry args={[0.035, 0.035, h, 16]} />
              <Shell finish={p.finish} />
            </mesh>
          );
        })}
        <group ref={deck}>
          <RoundedBox args={[2.3, 0.12, 0.46]} radius={0.05} smoothness={4} position={[0, 0.46, 0]}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* glowing strain line along the deck's face */}
          <mesh position={[0, 0.46, 0.235]}>
            <boxGeometry args={[2.1, 0.045, 0.012]} />
            <meshStandardMaterial ref={strip} color={light} emissive={light} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          <mesh ref={pulse} position={[0, 0.46, 0.245]}>
            <sphereGeometry args={[0.045, 20, 20]} />
            <meshStandardMaterial color="#ffffff" emissive={light} emissiveIntensity={3} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
