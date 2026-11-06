import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Ad Studio',
  description: 'Project card for Towline Ad Studio, the creative generator: a glossy white instant camera with a glowing lens ring that ejects a fresh print each loop. Light is seeded by the project name.',
  tags: ['card', 'creative', 'camera', 'studio', 'project'],
};

export const schema = beamSchema({ name: 'Ad Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'creative-lab': { name: 'Creative Lab' },
  'ugc-remix': { name: 'UGC Remix' },
  marigold: { lightMode: 'custom', light: '#FFB627' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', beams: 0.6 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AdStudio(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const flash = useRef<THREE.MeshStandardMaterial>(null);
  const print = useRef<THREE.Group>(null);

  // Idle: lens ring breathes, the flash fires once a loop and a print slides out
  // and back (rest pose: tucked in). Hover brightens; click fires the flash.
  useLoop((m) => {
    const pop = blink(m.t, 0.35, 0.03) + Math.abs(pressBounce(m.pressAge)) * 1.6;
    if (ring.current) ring.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8 + m.hover * 0.8 + pop;
    if (flash.current) flash.current.emissiveIntensity = 0.15 + pop * 3;
    if (print.current) {
      const u = cycle(m.t, 1);
      const out = u < 0.4 ? 0 : u < 0.6 ? THREE.MathUtils.smootherstep((u - 0.4) / 0.2, 0, 1) : u < 0.85 ? 1 : 1 - THREE.MathUtils.smootherstep((u - 0.85) / 0.15, 0, 1);
      print.current.position.y = -0.2 - out * (0.62 + m.hover * 0.1);
    }
  });

  return (
    <IconMotion seed={88}>
      <group position={[0, 0.05, 0]} rotation={[0.18, -0.42, 0.04]} scale={1.05}>
        {/* print sliding out of the bottom slot (behind the body) */}
        <group ref={print} position={[0, -0.2, 0.12]}>
          <RoundedBox args={[0.78, 0.7, 0.025]} radius={0.01} smoothness={2}>
            <meshPhysicalMaterial color="#FAF7F2" roughness={0.4} />
          </RoundedBox>
          <mesh position={[0, 0.06, 0.014]}>
            <planeGeometry args={[0.64, 0.5]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.35} />
          </mesh>
        </group>
        {/* body */}
        <RoundedBox args={[1.6, 1.12, 0.78]} radius={0.2} smoothness={6}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* top step */}
        <RoundedBox args={[1.3, 0.28, 0.5]} radius={0.1} smoothness={4} position={[0, 0.62, -0.05]}>
          <Shell finish={p.finish} color="#E9E6E3" />
        </RoundedBox>
        {/* viewfinder + flash window */}
        <RoundedBox args={[0.26, 0.2, 0.06]} radius={0.04} smoothness={3} position={[0.5, 0.33, 0.39]}>
          <meshPhysicalMaterial color="#1A1418" roughness={0.1} clearcoat={1} />
        </RoundedBox>
        <RoundedBox args={[0.34, 0.2, 0.06]} radius={0.04} smoothness={3} position={[-0.5, 0.33, 0.39]}>
          <meshStandardMaterial ref={flash} color="#FFF8EE" emissive="#FFFFFF" emissiveIntensity={0.15} roughness={0.2} />
        </RoundedBox>
        {/* shutter button */}
        <mesh position={[-0.52, 0.74, 0.05]}>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 24]} />
          <Shell finish={p.finish === 'matte' ? 'glossy' : p.finish} color="#DAD6D2" />
        </mesh>
        {/* lens barrel */}
        <mesh position={[0, -0.04, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.45, 0.16, 64]} />
          <Shell finish={p.finish} color="#ECEAE7" />
        </mesh>
        <mesh position={[0, -0.04, 0.505]}>
          <torusGeometry args={[0.34, 0.045, 20, 64]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.04, 0.5]}>
          <circleGeometry args={[0.3, 48]} />
          <meshPhysicalMaterial color="#120C10" roughness={0.05} clearcoat={1} />
        </mesh>
        <mesh position={[0, -0.04, 0.47]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#2A2230" roughness={0.02} clearcoat={1} metalness={0.3} />
        </mesh>
        <mesh position={[-0.08, 0.04, 0.56]}>
          <circleGeometry args={[0.05, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      </group>
    </IconMotion>
  );
}
