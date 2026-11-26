import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Human Review',
  description: 'Project card for Postnook’s human-in-the-loop review: a glossy white rubber stamp whose glowing face lights up as it stamps an approval.',
  tags: ['card', 'review', 'approval', 'stamp', 'human in the loop', 'project'],
};

export const schema = beamSchema({ name: 'Human Review' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  approvals: { name: 'Approvals' },
  'guard-rails': { name: 'Guard Rails' },
  postbox: { lightMode: 'custom', light: '#FF6A48' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function HumanReview(p: P) {
  const light = beamLight(p).color;
  const stamp = useRef<THREE.Group>(null);
  const face = useRef<THREE.MeshStandardMaterial>(null);
  const pad = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the stamp lifts and thumps down once per loop; its face flares on contact
  // and leaves a glowing imprint that fades. Hover lifts it; a click stamps hard.
  useLoop((m) => {
    const lift = blink(m.t, 0.45, 0.14); // up then back down
    const hit = blink(m.t, 0.6, 0.05);
    const pop = Math.abs(pressBounce(m.pressAge));
    if (stamp.current) {
      stamp.current.position.y = lift * 0.32 + m.hover * 0.12 - pop * 0.05;
      stamp.current.rotation.z = lift * 0.12;
    }
    if (face.current) face.current.emissiveIntensity = 1 + hit * 2.5 + pop * 2 + m.hover * 0.5;
    if (pad.current) pad.current.emissiveIntensity = 0.25 + hit * 1.6 + pop * 1.2;
  });

  return (
    <IconMotion seed={88} float={0.04}>
      <group rotation={[0.16, -0.55, 0]} position={[0, -0.3, 0]} scale={1.3}>
        {/* Imprint on the "paper" below */}
        <mesh position={[0, -0.37, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.7, 64]} />
          <meshStandardMaterial ref={pad} color={light} emissive={light} emissiveIntensity={0.3} transparent opacity={0.85} />
        </mesh>
        <group ref={stamp}>
          {/* Glowing rubber face */}
          <RoundedBox args={[1.04, 0.13, 1.04]} radius={0.04} smoothness={3} position={[0, -0.29, 0]}>
            <meshStandardMaterial ref={face} color={light} emissive={light} emissiveIntensity={1.1} roughness={0.4} />
          </RoundedBox>
          {/* Mount block */}
          <RoundedBox args={[1.0, 0.28, 1.0]} radius={0.08} smoothness={4} position={[0, -0.1, 0]}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* Waisted handle */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.12, 0.2, 0.55, 40]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <sphereGeometry args={[0.27, 48, 32]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
