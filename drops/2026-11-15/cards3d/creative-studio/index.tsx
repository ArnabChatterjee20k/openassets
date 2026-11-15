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
  description: 'Feature card for Firebrand Creative Studio: a glossy white instant camera with a glowing lens that flashes and prints a fresh ad creative.',
  tags: ['card', 'creative', 'camera', 'studio', 'feature'],
};

export const schema = beamSchema({ name: 'Creative Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ad-variations': { name: 'Ad Variations' },
  'ugc-remix': { name: 'UGC Remix' },
  amber: { lightMode: 'custom', light: '#FFB000' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function CreativeStudio(p: P) {
  const light = beamLight(p).color;
  const lens = useRef<THREE.MeshStandardMaterial>(null);
  const flash = useRef<THREE.MeshStandardMaterial>(null);
  const photo = useRef<THREE.Group>(null);

  // Idle: the lens ring breathes, the flash fires once per loop and a print slides out and back.
  // Hover brightens the lens; a click fires the flash and kicks the print out.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    const f = blink(m.t, 0.3, 0.04);
    if (lens.current) lens.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + m.hover * 1 + f * 1.5;
    if (flash.current) flash.current.emissiveIntensity = 0.1 + f * 4 + press * 5;
    if (photo.current) photo.current.position.y = -0.42 - (wave(m.t, 1, -0.25) * 0.5 + 0.5) * 0.32 - press * 0.15;
  });

  return (
    <IconMotion seed={58}>
      <group rotation={[0.12, -0.42, 0]} position={[0, 0.08, 0]} scale={1.1}>
        {/* print sliding out of the slot (behind the body) */}
        <group ref={photo} position={[0, -0.5, 0.05]}>
          <RoundedBox args={[0.92, 0.7, 0.02]} radius={0.01} smoothness={2}>
            <meshPhysicalMaterial color="#F7F5F2" roughness={0.5} />
          </RoundedBox>
          <mesh position={[0, 0.07, 0.012]}>
            <planeGeometry args={[0.76, 0.48]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.35} />
          </mesh>
        </group>
        {/* body */}
        <RoundedBox args={[1.5, 1.1, 0.7]} radius={0.16} smoothness={6}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* top step */}
        <RoundedBox args={[1.2, 0.3, 0.6]} radius={0.1} smoothness={5} position={[0, 0.58, -0.05]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* lens barrel */}
        <mesh position={[0, -0.02, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.4, 0.2, 64]} />
          <Shell finish={p.finish === 'chrome' ? 'glossy' : 'chrome'} />
        </mesh>
        <mesh position={[0, -0.02, 0.51]}>
          <torusGeometry args={[0.3, 0.045, 20, 64]} />
          <meshStandardMaterial ref={lens} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.02, 0.5]}>
          <circleGeometry args={[0.26, 48]} />
          <meshPhysicalMaterial color="#1A1414" roughness={0.05} clearcoat={1} />
        </mesh>
        <mesh position={[0.08, 0.06, 0.505]}>
          <circleGeometry args={[0.06, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
        {/* flash window + viewfinder + shutter */}
        <RoundedBox args={[0.36, 0.18, 0.06]} radius={0.04} smoothness={3} position={[0.42, 0.34, 0.34]}>
          <meshStandardMaterial ref={flash} color="#FFF4E8" emissive="#FFF4E8" emissiveIntensity={0.1} roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.2, 0.16, 0.06]} radius={0.04} smoothness={3} position={[-0.48, 0.34, 0.34]}>
          <meshPhysicalMaterial color="#2A2222" roughness={0.1} clearcoat={1} />
        </RoundedBox>
        <mesh position={[0.48, 0.74, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 32]} />
          <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.8} />
        </mesh>
      </group>
    </IconMotion>
  );
}
