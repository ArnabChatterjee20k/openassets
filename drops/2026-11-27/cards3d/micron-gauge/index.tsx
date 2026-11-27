import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Tolerance Studio Card',
  description: "Project card for Loupe's Tolerance Studio, where teams set micron limits per part family: a glossy dial indicator whose needle glows in the seeded light, hunts around zero and kicks when clicked.",
  tags: ['card', 'gauge', 'measurement', 'tolerance', 'project'],
};

export const schema = beamSchema({ name: 'Tolerance Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'micron-gauge': { name: 'Micron Gauge' },
  'spc-charts': { name: 'SPC Charts' },
  pink: { lightMode: 'custom', light: '#F49CBB' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0F5" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const TICKS = 40;

export default function MicronGauge(p: P) {
  const light = beamLight(p).color;
  const needle = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const plunger = useRef<THREE.Group>(null);

  // Idle: the needle hunts around zero while the plunger rides a surface; hover
  // brightens; a click kicks the needle and the plunger.
  useLoop((m) => {
    const hit = pressBounce(m.pressAge);
    if (needle.current) needle.current.rotation.z = wave(m.t, 2) * 0.18 + wave(m.t, 1, 0.3) * 0.08 + hit * 1.4;
    if (plunger.current) plunger.current.position.y = wave(m.t, 2) * 0.03 + hit * 0.08;
    if (glow.current) glow.current.emissiveIntensity = 1.5 + m.hover * 1 + Math.abs(hit) * 2;
  });

  return (
    <IconMotion seed={57}>
      <group rotation={[0.1, -0.24, 0]} position={[0, 0.12, 0]} scale={1.1}>
        {/* stem + plunger below the dial */}
        <mesh position={[0, -0.86, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.3, 32]} />
          <Shell finish={p.finish} />
        </mesh>
        <group ref={plunger}>
          <mesh position={[0, -1.1, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.3, 16]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
          </mesh>
          <mesh position={[0, -1.27, 0]}>
            <sphereGeometry args={[0.055, 24, 24]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.8} />
          </mesh>
        </group>
        {/* top lug */}
        <mesh position={[0, 0.78, -0.02]}>
          <torusGeometry args={[0.1, 0.04, 16, 32]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* case and bezel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.28, 72]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0, 0.14]}>
          <torusGeometry args={[0.66, 0.06, 24, 96]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* dial face */}
        <mesh position={[0, 0, 0.142]}>
          <circleGeometry args={[0.62, 72]} />
          <meshPhysicalMaterial color="#FBFAFF" roughness={0.4} />
        </mesh>
        {Array.from({ length: TICKS }, (_, i) => {
          const a = (i / TICKS) * Math.PI * 2;
          const major = i % 5 === 0;
          const r = major ? 0.5 : 0.53;
          return (
            <mesh key={i} position={[Math.sin(a) * r, Math.cos(a) * r, 0.146]} rotation={[0, 0, -a]}>
              <planeGeometry args={[major ? 0.022 : 0.012, major ? 0.1 : 0.05]} />
              <meshBasicMaterial color="#3A3550" />
            </mesh>
          );
        })}
        {/* glowing needle */}
        <group ref={needle} position={[0, 0, 0.16]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.06, 0.48, 0.02]} />
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.6} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.04, 32]} />
            <meshStandardMaterial color="#2A2440" roughness={0.3} />
          </mesh>
        </group>
        {/* crystal */}
        <mesh position={[0, 0, 0.2]}>
          <circleGeometry args={[0.62, 72]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.02} transmission={1} thickness={0.1} transparent opacity={0.25} />
        </mesh>
      </group>
    </IconMotion>
  );
}
