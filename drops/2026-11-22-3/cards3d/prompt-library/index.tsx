import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Prompt Library',
  description: "Project card for Ambit's shared Prompt Library: a glossy white hardback with a glowing bookmark ribbon, its cover easing open.",
  tags: ['card', 'prompts', 'library', 'book', 'knowledge'],
};

export const schema = beamSchema({ name: 'Prompt Library' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  playbooks: { name: 'Playbooks' },
  'team-templates': { name: 'Team Templates' },
  pink: { lightMode: 'custom', light: '#F49CBB' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#E4E7EE" metalness={0.85} roughness={0.28} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFF6" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const W = 1.0; // cover width
const H = 1.3; // cover height
const T = 0.06; // board thickness
const PAGES = 0.22;

export default function PromptLibrary(p: P) {
  const light = beamLight(p).color;
  const cover = useRef<THREE.Group>(null);
  const ribbon = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the front cover breathes open a little and the ribbon sways;
  // hover opens it wider and brightens the ribbon; a click flips it open.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const open = 0.04 + (wave(m.t, 1, -0.25) * 0.5 + 0.5) * 0.14 + m.hover * 0.35 + Math.abs(press) * 0.6;
    if (cover.current) cover.current.rotation.y = -open;
    if (ribbon.current) ribbon.current.rotation.z = wave(m.t, 2) * 0.08 + press * 0.3;
    if (glow.current) glow.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + m.hover * 0.8;
  });

  return (
    <IconMotion seed={58} float={0.05}>
      <group position={[0.1, -0.12, 0]} rotation={[0.2, -0.4, -0.04]} scale={1.15}>
        {/* back board */}
        <RoundedBox args={[W, H, T]} radius={0.025} smoothness={4} position={[0, 0, -PAGES / 2 - T / 2]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* spine */}
        <RoundedBox args={[T * 1.4, H, PAGES + T * 2]} radius={0.03} smoothness={4} position={[-W / 2, 0, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* page block, a touch inset and warmer */}
        <RoundedBox args={[W - 0.06, H - 0.06, PAGES]} radius={0.015} smoothness={3} position={[0.01, 0, 0]}>
          <meshPhysicalMaterial color="#E9E4DA" roughness={0.85} />
        </RoundedBox>
        {/* glowing bookmark ribbon hanging out of the bottom */}
        <group ref={ribbon} position={[0.22, -H / 2 + 0.02, 0.02]}>
          <mesh position={[0, -0.16, 0]}>
            <boxGeometry args={[0.1, 0.36, 0.012]} />
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.35} />
          </mesh>
        </group>
        {/* front cover, hinged at the spine */}
        <group ref={cover} position={[-W / 2, 0, PAGES / 2 + T / 2]}>
          <RoundedBox args={[W, H, T]} radius={0.025} smoothness={4} position={[W / 2, 0, 0]}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* debossed panel lines on the cover */}
          <mesh position={[W / 2 + 0.04, 0.3, T / 2 + 0.002]}>
            <planeGeometry args={[0.56, 0.06]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.9} />
          </mesh>
          <mesh position={[W / 2 + 0.04, 0.17, T / 2 + 0.002]}>
            <planeGeometry args={[0.4, 0.04]} />
            <meshStandardMaterial color="#B9BCC6" />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
