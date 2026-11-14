import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Media Plan',
  description: 'Project card for Plotwell Media Plan: a glossy rolled plan sheet, half unrolled, held by a glowing band, lit by beams seeded from the project name.',
  tags: ['card', 'plan', 'blueprint', 'strategy', 'project'],
};

export const schema = beamSchema({ name: 'Media Plan' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'q4-flight-plan': { name: 'Q4 Flight Plan' },
  'launch-brief': { name: 'Launch Brief' },
  cyanotype: { lightMode: 'custom', light: '#7FB2FF', background: '#061634' },
  highlighter: { lightMode: 'custom', light: '#FFDD00' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshPhysicalMaterial color="#E4E8EF" metalness={0.75} roughness={0.28} clearcoat={1} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function MediaPlan(p: P) {
  const light = beamLight(p).color;
  const band = useRef<THREE.MeshStandardMaterial>(null);
  const roll = useRef<THREE.Group>(null);
  const sheet = useRef<THREE.Group>(null);
  const lines = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the band breathes and the roll rocks; hover unrolls the sheet a bit; click flicks it.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    if (band.current) band.current.emissiveIntensity = 1.4 + (wave(m.t, 1) * 0.5 + 0.5) * 0.9 + m.hover * 0.8 + Math.abs(b) * 2;
    if (roll.current) roll.current.rotation.x = wave(m.t, 1, 0.1) * 0.12 + b * 0.5;
    if (sheet.current) sheet.current.scale.z = 1 + m.hover * 0.18 + wave(m.t, 2) * 0.03;
    if (lines.current) lines.current.emissiveIntensity = 0.5 + (wave(m.t, 2, 0.3) * 0.5 + 0.5) * 0.6;
  });

  return (
    <IconMotion seed={23}>
      <group rotation={[0.38, -0.42, 0.04]} position={[0, -0.05, 0]} scale={1.4}>
        {/* the rolled part */}
        <group ref={roll} position={[0, 0.2, -0.32]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 1.9, 48]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* rolled-edge spiral hint at both ends */}
          {[-0.951, 0.951].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.17, 0.018, 12, 40]} />
              <meshPhysicalMaterial color="#D9DDE5" roughness={0.3} />
            </mesh>
          ))}
          {/* glowing band */}
          <mesh position={[0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.31, 0.045, 20, 64]} />
            <meshStandardMaterial ref={band} color={light} emissive={light} emissiveIntensity={1.8} roughness={0.3} />
          </mesh>
        </group>
        {/* the unrolled sheet lying forward, with plotted lines */}
        <group ref={sheet} position={[0, -0.08, -0.32]}>
          <RoundedBox args={[1.86, 0.035, 1.0]} radius={0.015} smoothness={3} position={[0, 0, 0.5]}>
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </RoundedBox>
          <mesh position={[0.1, 0.02, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.24, 48, 1, 0, Math.PI * 1.3]} />
            <meshStandardMaterial ref={lines} color={light} emissive={light} emissiveIntensity={0.8} side={THREE.DoubleSide} />
          </mesh>
          {[0.3, 0.5, 0.7].map((z, i) => (
            <mesh key={z} position={[-0.55, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.5 - i * 0.12, 0.03]} />
              <meshStandardMaterial color="#9EA3AD" />
            </mesh>
          ))}
          <mesh position={[0.62, 0.02, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.4, 0.22]} />
            <meshStandardMaterial color="#C7CBD3" />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
