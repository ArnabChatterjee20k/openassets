import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Creative Proofs',
  description: "Project card for Plotwell's creative review queue: a glossy white loupe with a glowing lens ring that pulses as it checks each proof, lit by beams seeded from the project name.",
  tags: ['card', 'creative', 'review', 'proof', 'project'],
};

export const schema = beamSchema({ name: 'Creative Proofs' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'brand-check': { name: 'Brand Check' },
  'ad-variants': { name: 'Ad Variants' },
  highlighter: { lightMode: 'custom', light: '#FFDD00' },
  cyanotype: { lightMode: 'custom', light: '#7FB2FF', background: '#061634' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshPhysicalMaterial color="#E4E8EF" metalness={0.75} roughness={0.28} clearcoat={1} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function CreativeProofs(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const lens = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);

  // Idle: the loupe hovers over a proof and nods, the ring pulses and blinks "approved".
  // Hover brightens the ring; a click spins the loupe a little.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    if (ring.current) ring.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + blink(m.t, 0.7, 0.04) * 2 + m.hover * 0.9 + Math.abs(b) * 2;
    if (lens.current) lens.current.rotation.z = -0.65 + wave(m.t, 1, 0.15) * 0.08 + b * 0.5;
    if (scan.current) scan.current.rotation.z = (m.t / 4) * Math.PI * 2;
  });

  return (
    <IconMotion seed={91}>
      <group rotation={[0.15, -0.3, 0]} position={[0.25, 0.12, 0]} scale={1.3}>
        <group ref={lens} rotation={[0, 0, -0.65]}>
          {/* rim */}
          <mesh>
            <torusGeometry args={[0.55, 0.11, 32, 72]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* glowing inner ring */}
          <mesh position={[0, 0, 0.05]}>
            <torusGeometry args={[0.44, 0.03, 20, 72]} />
            <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          {/* lens glass */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.46, 0.46, 0.06, 64]} />
            <meshPhysicalMaterial color={light} roughness={0.05} clearcoat={1} transparent opacity={0.16} depthWrite={false} />
          </mesh>
          {/* scanning tick inside the lens */}
          <mesh ref={scan} position={[0, 0, 0.04]}>
            <ringGeometry args={[0.2, 0.23, 48, 1, 0, Math.PI * 0.6]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.2} side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
          {/* collar + handle */}
          <mesh position={[0, -0.74, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.16, 32]} />
            <meshStandardMaterial color="#C9CDD5" metalness={1} roughness={0.25} />
          </mesh>
          <mesh position={[0, -1.16, 0]}>
            <capsuleGeometry args={[0.105, 0.62, 12, 32]} />
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
