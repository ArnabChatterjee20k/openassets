import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Instant Quote',
  description: 'Project card for Sprue Instant Quote: a glossy white stopwatch with a glowing dial ring and a sweeping hand, lit by beams seeded from the project name.',
  tags: ['card', 'quote', 'stopwatch', 'speed', 'pricing', 'project'],
};

export const schema = beamSchema({ name: 'Instant Quote' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'rush-orders': { name: 'Rush Orders' },
  'dfm-check': { name: 'DFM Check' },
  lime: { lightMode: 'custom', light: '#B5E550' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function InstantQuote(p: P) {
  const light = beamLight(p).color;
  const hand = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const button = useRef<THREE.Group>(null);

  // Idle: the hand sweeps one turn per loop, the ring breathes; hover speeds the glow; click presses the crown.
  useLoop((m) => {
    if (hand.current) hand.current.rotation.z = -cycle(m.t, 1) * Math.PI * 2 - pressBounce(m.pressAge) * 0.8;
    if (ring.current) ring.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + m.hover * 0.9 + blink(m.t, 0.98, 0.03) * 1.5;
    if (button.current) button.current.position.y = 0.78 - Math.max(0, pressBounce(m.pressAge)) * 0.08 - blink(m.t, 0.98, 0.03) * 0.05;
  });

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const big = i % 3 === 0;
    return (
      <mesh key={i} position={[Math.sin(a) * 0.44, Math.cos(a) * 0.44, 0.17]} rotation={[0, 0, -a]}>
        <boxGeometry args={[big ? 0.04 : 0.025, big ? 0.1 : 0.06, 0.01]} />
        <meshStandardMaterial color={big ? light : '#9EA3A0'} emissive={big ? light : '#000000'} emissiveIntensity={big ? 1.2 : 0} />
      </mesh>
    );
  });

  return (
    <IconMotion seed={41}>
      <group rotation={[0.12, -0.32, 0.08]} position={[0, -0.2, 0]} scale={1.5}>
        {/* case */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.3, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* bezel */}
        <mesh position={[0, 0, 0.15]}>
          <torusGeometry args={[0.6, 0.06, 24, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* dial face */}
        <mesh position={[0, 0, 0.155]}>
          <circleGeometry args={[0.55, 64]} />
          <meshStandardMaterial color="#1A1F1C" roughness={0.5} />
        </mesh>
        {/* glowing dial ring */}
        <mesh position={[0, 0, 0.165]}>
          <torusGeometry args={[0.52, 0.018, 12, 96]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} />
        </mesh>
        {ticks}
        {/* hand */}
        <group ref={hand} position={[0, 0, 0.19]}>
          <mesh position={[0, 0.17, 0]}>
            <boxGeometry args={[0.035, 0.38, 0.02]} />
            <meshStandardMaterial color="#F4F4F0" emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 24]} />
          <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1} />
        </mesh>
        {/* stem + crown */}
        <mesh position={[0, 0.67, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.14, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        <group ref={button} position={[0, 0.78, 0]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.13, 0.09, 32]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
        {/* side lap button */}
        <mesh position={[0.46, 0.46, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 24]} />
          <Shell finish={p.finish} />
        </mesh>
      </group>
    </IconMotion>
  );
}
