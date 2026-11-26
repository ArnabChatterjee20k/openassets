import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Inbox API',
  description: 'Project card for the Postnook Inbox API: a glossy white mailbox whose flag glows in the card’s light and pops up when mail arrives.',
  tags: ['card', 'api', 'mailbox', 'inbox', 'email', 'project'],
};

export const schema = beamSchema({ name: 'Inbox API' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  aliases: { name: 'Aliases' },
  'agent-mail': { name: 'Agent Mail' },
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

export default function InboxApi(p: P) {
  const light = beamLight(p).color;
  const flag = useRef<THREE.Group>(null);
  const flagMat = useRef<THREE.MeshStandardMaterial>(null);
  const slotMat = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the flag twitches up once per loop ("you've got mail"); the slot glows.
  // Hover raises the flag; a click snaps it up with a bounce.
  useLoop((m) => {
    const up = blink(m.t, 0.55, 0.12);
    const pop = pressBounce(m.pressAge);
    if (flag.current) flag.current.rotation.z = -0.9 + up * 0.9 + m.hover * 1.0 + Math.abs(pop) * 1.2;
    if (flagMat.current) flagMat.current.emissiveIntensity = 1.2 + up * 1.2 + m.hover * 0.6;
    if (slotMat.current) slotMat.current.emissiveIntensity = 0.9 + (0.5 + 0.5 * wave(m.t, 2, -0.25)) * 0.8 + Math.abs(pop) * 2;
  });

  const L = 1.35; // depth of the box along x
  const R = 0.36; // half width
  return (
    <IconMotion seed={23}>
      <group rotation={[0.18, -0.62, 0]} position={[0, 0.05, 0]} scale={1.3}>
        {/* Post */}
        <mesh position={[0, -0.75, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.9, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* Box: rounded lower half + barrel top */}
        <RoundedBox args={[L, 0.42, R * 2]} radius={0.06} smoothness={4} position={[0, -0.08, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[R, R, L, 48, 1, false, 0, Math.PI]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* Front door (rounded arch) */}
        <group position={[L / 2 + 0.005, 0, 0]}>
          <mesh position={[0, 0.12, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[R, 48, 0, Math.PI]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, -0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[R * 2 - 0.04, 0.4]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* Glowing letter slot */}
          <mesh position={[0.02, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.36, 0.06]} />
            <meshStandardMaterial ref={slotMat} color={light} emissive={light} emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.04, -0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.06, 16]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
          </mesh>
        </group>
        {/* Flag on the side, hinged near the back */}
        <group ref={flag} position={[-0.32, 0.02, R + 0.03]} rotation={[0, 0, -0.9]}>
          <mesh position={[0.28, 0, 0]}>
            <boxGeometry args={[0.56, 0.05, 0.03]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.3} />
          </mesh>
          <RoundedBox args={[0.3, 0.24, 0.05]} radius={0.02} smoothness={3} position={[0.5, 0.12, 0]}>
            <meshStandardMaterial ref={flagMat} color={light} emissive={light} emissiveIntensity={1.2} roughness={0.3} />
          </RoundedBox>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.05, 20]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
