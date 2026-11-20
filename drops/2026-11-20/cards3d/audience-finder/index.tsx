import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Finder',
  description: 'Feature card for Inkrun Audience Finder, which discovers lookalike audiences on every platform: a glossy white magnifying glass with a glowing lens that pans, lit by beams seeded from the feature name.',
  tags: ['card', 'audience', 'search', 'magnifier', 'feature'],
};

export const schema = beamSchema({ name: 'Audience Finder' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lookalikes: { name: 'Lookalikes' },
  'keyword-scout': { name: 'Keyword Scout' },
  highlighter: { lightMode: 'custom', light: '#FFD600' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEF4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F6F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AudienceFinder(p: P) {
  const light = beamLight(p).color;
  const glass = useRef<THREE.Group>(null);
  const lensMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const ping = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the magnifier pans in a slow figure-eight (searching) and the lens
  // glow breathes. Hover brightens; a click "finds" someone: the lens flashes and a ring pings out.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    if (glass.current) {
      glass.current.position.x = wave(m.t, 1) * 0.12;
      glass.current.position.y = wave(m.t, 2) * 0.05;
      glass.current.rotation.z = -0.7 + wave(m.t, 1, 0.25) * 0.08;
    }
    if (lensMat.current) lensMat.current.emissiveIntensity = 0.08 + Math.abs(b) * 1.2;
    if (ringMat.current) ringMat.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8 + m.hover * 0.9;
    if (ping.current) {
      const age = Number.isFinite(m.pressAge) ? Math.min(1, m.pressAge * 1.6) : 1;
      ping.current.scale.setScalar(1 + age * 0.8);
      (ping.current.material as THREE.MeshStandardMaterial).opacity = (1 - age) * 0.9;
    }
  });

  return (
    <IconMotion seed={88}>
      <group rotation={[0.2, -0.35, 0]} position={[0.1, -0.25, 0]} scale={1.3}>
        <group ref={glass} rotation={[0, 0, -0.7]}>
          {/* rim */}
          <mesh position={[0, 0.3, 0]}>
            <torusGeometry args={[0.5, 0.1, 32, 80]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* clear lens, faintly tinted by the light */}
          <mesh position={[0, 0.3, 0]} scale={[1, 1, 0.16]}>
            <sphereGeometry args={[0.46, 48, 32]} />
            <meshPhysicalMaterial ref={lensMat} color="#F4F0FA" emissive={light} emissiveIntensity={0.12} roughness={0.04} transmission={1} thickness={0.5} ior={1.45} clearcoat={1} />
          </mesh>
          {/* glowing inner ring: the accent */}
          <mesh position={[0, 0.3, 0.05]}>
            <torusGeometry args={[0.4, 0.028, 16, 72]} />
            <meshStandardMaterial ref={ringMat} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          {/* specular glint */}
          <mesh position={[-0.17, 0.48, 0.09]} rotation={[0, 0, 0.7]}>
            <capsuleGeometry args={[0.03, 0.14, 6, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
          {/* ping ring on click */}
          <mesh ref={ping} position={[0, 0.3, 0.02]}>
            <torusGeometry args={[0.52, 0.015, 8, 64]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} transparent opacity={0} />
          </mesh>
          {/* neck + handle */}
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.18, 24]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, -0.72, 0]}>
            <capsuleGeometry args={[0.105, 0.72, 8, 24]} />
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <torusGeometry args={[0.1, 0.02, 12, 32]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.9} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
