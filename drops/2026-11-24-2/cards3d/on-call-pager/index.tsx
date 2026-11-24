import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'On-Call Pager',
  description: 'Project card for Halfstream On-Call: a glossy white pager whose screen glows in the card light. It buzzes twice per loop, because we carry the pager.',
  tags: ['card', 'pager', 'on-call', 'incident', 'project'],
};

export const schema = beamSchema({ name: 'On-Call' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'incident-desk': { name: 'Incident Desk' },
  'sla-99-95': { name: 'SLA 99.95%' },
  signal: { lightMode: 'custom', light: '#E3000F' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F4F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function OnCallPager(p: P) {
  const light = beamLight(p).color;
  const body = useRef<THREE.Group>(null);
  const screen = useRef<THREE.MeshStandardMaterial>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: two buzzes per loop (a fast side-to-side rattle), the screen flares
  // with each page and the LED blinks. Hover keeps the screen lit; click buzzes.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const page = Math.max(blink(m.t, 0.2, 0.06), blink(m.t, 0.7, 0.06));
    if (body.current) {
      body.current.position.x = Math.sin(m.t * 90) * 0.025 * page + press * 0.06;
      body.current.rotation.z = Math.sin(m.t * 90 + 1) * 0.03 * page;
    }
    if (screen.current) screen.current.emissiveIntensity = 0.9 + page * 1.4 + m.hover * 0.7 + Math.abs(press) * 2;
    if (led.current) led.current.emissiveIntensity = 0.3 + page * 3 + Math.abs(press) * 3;
  });

  return (
    <IconMotion seed={67}>
      <group rotation={[0.18, -0.42, 0.05]} position={[0, -0.25, 0]} scale={1.35}>
        <group ref={body}>
          <RoundedBox args={[1.5, 1.05, 0.46]} radius={0.2} smoothness={6}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* screen bezel + glowing screen */}
          <RoundedBox args={[1.14, 0.46, 0.04]} radius={0.06} smoothness={4} position={[0, 0.17, 0.225]}>
            <meshPhysicalMaterial color="#1A1B1F" roughness={0.25} clearcoat={1} />
          </RoundedBox>
          <mesh position={[0, 0.17, 0.25]}>
            <planeGeometry args={[1.0, 0.34]} />
            <meshStandardMaterial ref={screen} color={light} emissive={light} emissiveIntensity={1.1} roughness={0.4} />
          </mesh>
          {/* buttons */}
          {[-0.4, -0.1].map((x) => (
            <RoundedBox key={x} args={[0.24, 0.13, 0.08]} radius={0.05} smoothness={4} position={[x, -0.27, 0.22]}>
              <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} color="#E0E1E5" />
            </RoundedBox>
          ))}
          {/* page LED */}
          <mesh position={[0.42, -0.27, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 24]} />
            <meshStandardMaterial ref={led} color="#E3000F" emissive="#E3000F" emissiveIntensity={0.3} />
          </mesh>
          {/* belt clip on the back */}
          <RoundedBox args={[0.5, 0.7, 0.08]} radius={0.04} smoothness={4} position={[0, 0.05, -0.27]}>
            <Shell finish={p.finish} color="#DADBDF" />
          </RoundedBox>
        </group>
      </group>
    </IconMotion>
  );
}
