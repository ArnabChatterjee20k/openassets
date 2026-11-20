import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Creative Studio',
  description: 'Feature card for Inkrun Creative Studio, which generates and resizes ads for every placement: a glossy white compact camera with a glowing lens ring, lit by beams seeded from the feature name.',
  tags: ['card', 'creative', 'camera', 'design', 'feature'],
};

export const schema = beamSchema({ name: 'Creative Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'auto-resize': { name: 'Auto Resize' },
  'ugc-remix': { name: 'UGC Remix' },
  'hot-pink': { lightMode: 'custom', light: '#FF2E88' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEF4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F6F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function CreativeStudio(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const lens = useRef<THREE.Group>(null);
  const flash = useRef<THREE.MeshStandardMaterial>(null);
  const shutter = useRef<THREE.Group>(null);

  // Idle: the lens ring breathes and turns (focusing), the flash fires once per loop.
  // Hover zooms the lens out; a click presses the shutter and fires the flash.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    if (ring.current) ring.current.emissiveIntensity = 1.3 + (wave(m.t, 1) * 0.5 + 0.5) * 0.7 + m.hover * 0.8;
    if (lens.current) {
      lens.current.position.z = 0.42 + m.hover * 0.1 + wave(m.t, 1, 0.25) * 0.02;
      lens.current.rotation.z = wave(m.t, 1) * 0.4;
    }
    if (flash.current) flash.current.emissiveIntensity = 0.2 + blink(m.t, 0.7, 0.03) * 4 + Math.abs(b) * 5;
    if (shutter.current) shutter.current.position.y = 0.5 - Math.max(0, b) * 0.05;
  });

  return (
    <IconMotion seed={57}>
      <group rotation={[0.15, -0.45, 0]} position={[0, -0.36, 0]} scale={1.3}>
        <RoundedBox args={[1.7, 1.0, 0.56]} radius={0.16} smoothness={6}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* grip */}
        <RoundedBox args={[0.32, 0.86, 0.14]} radius={0.06} smoothness={4} position={[-0.62, -0.02, 0.28]}>
          <meshPhysicalMaterial color="#3A3446" roughness={0.6} />
        </RoundedBox>
        {/* viewfinder hump */}
        <RoundedBox args={[0.5, 0.2, 0.4]} radius={0.07} smoothness={4} position={[0.38, 0.55, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* flash window */}
        <mesh position={[0.62, 0.3, 0.285]}>
          <planeGeometry args={[0.26, 0.12]} />
          <meshStandardMaterial ref={flash} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
        {/* shutter button */}
        <group ref={shutter} position={[-0.5, 0.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 24]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* lens barrel */}
        <group ref={lens} position={[0.08, -0.04, 0.42]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.4, 0.42, 0.24, 64]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.33, 0.04, 16, 64]} />
            <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[0.3, 48]} />
            <meshPhysicalMaterial color="#120A1C" roughness={0.05} clearcoat={1} />
          </mesh>
          <mesh position={[-0.09, 0.09, -0.01]}>
            <circleGeometry args={[0.06, 24]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.5} transparent opacity={0.6} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
