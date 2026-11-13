import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Finder',
  description: "Project card for Pike's Audience Finder: a glossy white field compass whose glowing needle hunts and settles on the buyers, lit by beams seeded from the project name.",
  tags: ['card', 'audiences', 'targeting', 'compass', 'project'],
};

export const schema = beamSchema({ name: 'Audience Finder' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lookalikes: { name: 'Lookalikes' },
  'geo-targeting': { name: 'Geo Targeting' },
  fjord: { lightMode: 'custom', light: '#2F6F8F', background: '#0A1218' },
  'tip-up': { lightMode: 'custom', light: '#E4572E' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#E4E8EE" metalness={1} roughness={0.34} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#EEF1F3" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F3F5F7" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AudienceFinder(p: P) {
  const light = beamLight(p).color;
  const needle = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const pip = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the needle hunts (two swings per loop, damped look) then locks with a
  // pip blink; hover steadies it on target; click spins it a full turn.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const hunt = (wave(m.t, 2) * 0.32 + wave(m.t, 4, 0.15) * 0.12) * (1 - m.hover * 0.8);
    if (needle.current) needle.current.rotation.z = 0.55 + hunt + press * 2.4;
    const lock = blink(m.t, 0.5, 0.06) + blink(m.t, 0.0, 0.06);
    if (glow.current) glow.current.emissiveIntensity = 0.8 + lock * 1.0 + m.hover * 0.5;
    if (pip.current) pip.current.emissiveIntensity = 0.6 + lock * 2.5;
  });

  return (
    <IconMotion seed={23} float={0.05}>
      <group rotation={[-1.0, 0.0, 0.35]} position={[0, -0.12, 0]} scale={1.2}>
        {/* Case */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.78, 0.78, 0.24, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* Bezel */}
        <mesh position={[0, 0, 0.12]}>
          <torusGeometry args={[0.74, 0.07, 24, 96]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* Dial face */}
        <mesh position={[0, 0, 0.122]}>
          <circleGeometry args={[0.68, 64]} />
          <meshPhysicalMaterial color="#DDE4E9" roughness={0.4} />
        </mesh>
        {/* Cardinal ticks */}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const big = i % 4 === 0;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.58, Math.cos(a) * 0.58, 0.126]} rotation={[0, 0, -a]}>
              <planeGeometry args={[big ? 0.035 : 0.018, big ? 0.12 : 0.06]} />
              <meshStandardMaterial color="#5B6B76" />
            </mesh>
          );
        })}
        {/* North pip */}
        <mesh position={[0, 0.58, 0.14]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial ref={pip} color={light} emissive={light} emissiveIntensity={0.8} />
        </mesh>
        {/* Needle */}
        <group ref={needle} position={[0, 0, 0.16]} rotation={[0, 0, 0.55]}>
          <mesh position={[0, 0.27, 0]} scale={[1, 1, 0.4]}>
            <coneGeometry args={[0.1, 0.54, 4]} />
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.27, 0]} rotation={[0, 0, Math.PI]} scale={[1, 1, 0.4]}>
            <coneGeometry args={[0.1, 0.54, 4]} />
            <meshStandardMaterial color="#AEB8C0" roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.05, 24]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
        {/* Glowing luminous ring inside the bezel */}
        <mesh position={[0, 0, 0.13]}>
          <torusGeometry args={[0.66, 0.014, 12, 96]} />
          <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.9} />
        </mesh>
        {/* Glass dome */}
        <mesh position={[0, 0, 0.1]} scale={[1, 1, 0.18]}>
          <sphereGeometry args={[0.68, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.02} transmission={1} thickness={0.1} transparent opacity={0.35} />
        </mesh>
        {/* Sighting lug */}
        <mesh position={[0, 0.84, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.14, 24]} />
          <Shell finish={p.finish} />
        </mesh>
      </group>
    </IconMotion>
  );
}
