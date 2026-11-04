import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Severe Alerts',
  description: 'Project card for Stormcast Severe Alerts: a glossy white beacon whose dome pulses in the card light. The light is seeded by the project name.',
  tags: ['card', 'alerts', 'beacon', 'project', 'weather'],
};

export const schema = beamSchema({ name: 'Severe Alerts' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'stormcast-pro': { name: 'Stormcast Pro' },
  'rain-radar': { name: 'Rain Radar' },
  amber: { lightMode: 'custom', light: '#FFB020' },
  matte: { finish: 'matte', beams: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F4F6' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function SevereAlerts(p: P) {
  const light = beamLight(p).color;
  const dome = useRef<THREE.MeshPhysicalMaterial>(null);
  const ring = useRef<THREE.Group>(null);

  // Idle: the dome breathes and blinks like a warning light. Hover spins the
  // inner reflector; a click flashes it.
  useLoop((m) => {
    const flash = Math.max(blink(m.t, 0.3, 0.05), blink(m.t, 0.8, 0.05)) + Math.abs(pressBounce(m.pressAge)) * 1.5;
    if (dome.current) dome.current.emissiveIntensity = 0.6 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + flash * 1.8 + m.hover * 0.5;
    if (ring.current) ring.current.rotation.y = (m.t / 4) * Math.PI * 2 * (1 + m.hover * 2);
  });

  return (
    <IconMotion seed={41}>
      <group position={[0, -0.3, 0]} scale={1.15}>
        {/* base */}
        <RoundedBox args={[1.5, 0.42, 1.5]} radius={0.16} smoothness={6} position={[0, -0.55, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.62, 0.66, 0.16, 48]} />
          <Shell finish={p.finish} color="#E6E7EB" />
        </mesh>
        {/* glowing dome */}
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.56, 64, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial ref={dome} color={light} emissive={light} emissiveIntensity={0.9} roughness={0.15} transmission={0.25} thickness={0.6} clearcoat={1} />
        </mesh>
        {/* reflector inside the dome */}
        <group ref={ring} position={[0, -0.05, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.5, 32]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
          </mesh>
        </group>
        {/* cap */}
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.14, 0.18, 0.1, 32]} />
          <Shell finish={p.finish} />
        </mesh>
      </group>
    </IconMotion>
  );
}
