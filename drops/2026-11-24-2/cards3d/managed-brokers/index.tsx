import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Managed Brokers',
  description: 'Project card for Halfstream Managed Brokers: a glossy white broker blade whose status bar glows in the card light, with a scanning activity LED.',
  tags: ['card', 'kafka', 'broker', 'server', 'project'],
};

export const schema = beamSchema({ name: 'Managed Brokers' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'tiered-storage': { name: 'Tiered Storage' },
  'kafka-connect': { name: 'Kafka Connect' },
  signal: { lightMode: 'custom', light: '#E3000F' },
  matte: { finish: 'matte', beams: 0.6 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F4F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function ManagedBrokers(p: P) {
  const light = beamLight(p).color;
  const bar = useRef<THREE.MeshStandardMaterial>(null);
  const scan = useRef<THREE.Mesh>(null);
  const dots = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Idle: the status bar breathes, a scan light sweeps the bar, the activity
  // dots tick. Hover brightens; click flashes everything.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    if (bar.current) bar.current.emissiveIntensity = 1 + (wave(m.t, 1) * 0.5 + 0.5) * 0.6 + m.hover * 0.8 + press * 2.5;
    if (scan.current) scan.current.position.x = -0.6 + (0.5 - 0.5 * Math.cos(((m.t / 4) * 2 % 2) * Math.PI)) * 1.2;
    dots.current.forEach((d, i) => {
      if (d) d.emissiveIntensity = 0.4 + blink(m.t, (0.1 + i * 0.27) % 1, 0.05) * 2.5 + press * 2;
    });
  });

  return (
    <IconMotion seed={53}>
      <group rotation={[0.06, -0.32, 0]} position={[0, -0.3, 0]} scale={1.3}>
        <RoundedBox args={[2.1, 0.5, 1.3]} radius={0.14} smoothness={6}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* faceplate recess */}
        <RoundedBox args={[1.86, 0.3, 0.06]} radius={0.05} smoothness={4} position={[0, 0, 0.64]}>
          <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} color="#E2E3E6" />
        </RoundedBox>
        {/* glowing status bar */}
        <mesh position={[-0.2, 0, 0.68]}>
          <boxGeometry args={[1.25, 0.08, 0.02]} />
          <meshStandardMaterial ref={bar} color={light} emissive={light} emissiveIntensity={1.3} roughness={0.3} />
        </mesh>
        <mesh ref={scan} position={[-0.6, 0, 0.695]}>
          <boxGeometry args={[0.12, 0.1, 0.01]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} />
        </mesh>
        {/* activity dots */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.58 + i * 0.12, 0, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 20]} />
            <meshStandardMaterial ref={(el) => void (dots.current[i] = el)} color="#C9CCD3" emissive={light} emissiveIntensity={0.4} />
          </mesh>
        ))}
        {/* vent grooves on the top */}
        {[-0.3, -0.15, 0, 0.15, 0.3].map((z) => (
          <mesh key={z} position={[0.45, 0.252, z]}>
            <boxGeometry args={[0.7, 0.01, 0.04]} />
            <meshStandardMaterial color="#B9BCC4" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
