import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Inbound Webhooks',
  description: 'Project card for Postnook’s inbound-mail webhooks: a glossy white service bell that dings, with a ring of light that pulses each time an event fires.',
  tags: ['card', 'webhooks', 'events', 'bell', 'notification', 'project'],
};

export const schema = beamSchema({ name: 'Inbound Webhooks' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  events: { name: 'Events' },
  'reply-hooks': { name: 'Reply Hooks' },
  brass: { lightMode: 'custom', light: '#E3B53A', finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F0" roughness={0.16} clearcoat={1} clearcoatRoughness={0.06} />;
}

export default function InboundWebhooks(p: P) {
  const light = beamLight(p).color;
  const plunger = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const dome = useRef<THREE.Group>(null);

  // Idle: two "dings" per loop: the plunger dips, the dome shivers, the ring flares.
  // Hover brightens the ring; a click rings the bell hard.
  useLoop((m) => {
    const ding = Math.max(blink(m.t, 0.3, 0.04), blink(m.t, 0.8, 0.04));
    const pop = Math.abs(pressBounce(m.pressAge));
    if (plunger.current) plunger.current.position.y = 0.52 - (ding + pop) * 0.08;
    if (dome.current) dome.current.rotation.z = (ding * 0.4 + pop) * Math.sin(m.t * 60) * 0.03;
    const flare = Math.max(ding, pop);
    if (ringMat.current) ringMat.current.emissiveIntensity = 1.1 + (0.5 + 0.5 * wave(m.t, 2, -0.25)) * 0.4 + flare * 2 + m.hover * 0.6;
    if (ring.current) ring.current.scale.setScalar(1 + flare * 0.05);
  });

  return (
    <IconMotion seed={57}>
      <group rotation={[0.3, -0.3, 0]} position={[0, -0.28, 0]} scale={1.3}>
        {/* Base plinth */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.78, 0.82, 0.18, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* Glowing event ring around the base */}
        <mesh ref={ring} position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.035, 16, 96]} />
          <meshStandardMaterial ref={ringMat} color={light} emissive={light} emissiveIntensity={1.3} roughness={0.3} />
        </mesh>
        {/* Dome */}
        <group ref={dome}>
          <mesh position={[0, -0.02, 0]}>
            <sphereGeometry args={[0.6, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
        {/* Plunger */}
        <group ref={plunger} position={[0, 0.52, 0]}>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.16, 20]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.08, 0]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.19, 32, 16]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
