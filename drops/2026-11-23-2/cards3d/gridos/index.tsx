import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'GridOS',
  description: 'Project card for GridOS, the Sparkcrate site controller: a glossy white control puck with a glowing load ring and a needle that sweeps with demand.',
  tags: ['card', 'controller', 'monitoring', 'software', 'project'],
};

export const schema = beamSchema({ name: 'GridOS' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'fleet-view': { name: 'Fleet View' },
  'load-shed': { name: 'Load Shed' },
  blue: { lightMode: 'custom', light: '#5C8AFF' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55, beams: 0.6 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function GridOS(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const needle = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the needle sweeps with site demand, the ring breathes, a status LED
  // blinks twice a loop. Hover pushes the needle up; a click kicks it.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (needle.current) needle.current.rotation.z = 0.5 - (wave(m.t, 1, 0.75) + 1) * 0.35 - m.hover * 0.5 - press * 0.8;
    if (ring.current) ring.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + m.hover * 0.8 + Math.abs(press) * 2;
    if (led.current) led.current.emissiveIntensity = 0.4 + Math.max(blink(m.t, 0.3, 0.04), blink(m.t, 0.4, 0.04)) * 3;
  });

  return (
    <IconMotion seed={91}>
      {/* a puck standing on edge, turned to show its face and depth */}
      <group position={[0, 0, 0]} rotation={[0.12, -0.42, 0]} scale={1.25}>
        {/* body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.34, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0, 0.17]}>
          <torusGeometry args={[0.8, 0.06, 20, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* dark face */}
        <mesh position={[0, 0, 0.175]}>
          <circleGeometry args={[0.66, 64]} />
          <meshPhysicalMaterial color="#15161B" roughness={0.2} clearcoat={1} />
        </mesh>
        {/* glowing load ring: a 270° arc */}
        <mesh position={[0, 0, 0.19]} rotation={[0, 0, -Math.PI / 4]}>
          <torusGeometry args={[0.52, 0.045, 16, 64, Math.PI * 1.5]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* needle */}
        <group ref={needle} position={[0, 0, 0.21]} rotation={[0, 0, 0.5]}>
          <RoundedBox args={[0.06, 0.46, 0.03]} radius={0.015} smoothness={2} position={[0, 0.2, 0]}>
            <meshStandardMaterial color="#F4F4F6" roughness={0.3} />
          </RoundedBox>
        </group>
        <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* status LED on the rim */}
        <mesh position={[0, -0.42, 0.2]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial ref={led} color={light} emissive={light} emissiveIntensity={0.6} />
        </mesh>
        {/* foot */}
        <RoundedBox args={[0.7, 0.14, 0.5]} radius={0.05} smoothness={4} position={[0, -0.84, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
      </group>
    </IconMotion>
  );
}
