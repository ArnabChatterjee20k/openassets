import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Line Camera Card',
  description: "Project card for Loupe's Line Camera (the Vision Station hardware): a glossy white inspection camera whose lens ring glows in the card's seeded light and snaps like a shutter on click.",
  tags: ['card', 'camera', 'vision', 'inspection', 'project'],
};

export const schema = beamSchema({ name: 'Line Camera' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'vision-station': { name: 'Vision Station' },
  'defect-vision': { name: 'Defect Vision' },
  lilac: { lightMode: 'custom', light: '#8F7FF0' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#E4E7EE" metalness={1} roughness={0.32} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0F5" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function VisionStation(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const iris = useRef<THREE.Mesh>(null);

  // Idle: the lens ring breathes, the status LED blinks; hover brightens; a click "snaps" the iris.
  useLoop((m) => {
    const hit = Math.abs(pressBounce(m.pressAge));
    if (ring.current) ring.current.emissiveIntensity = 1.3 + (wave(m.t, 1) * 0.5 + 0.5) * 0.9 + m.hover * 0.9 + hit * 3;
    if (led.current) led.current.emissiveIntensity = 0.4 + blink(m.t, 0.25, 0.05) * 3 + blink(m.t, 0.75, 0.05) * 3;
    if (iris.current) iris.current.scale.setScalar(1 - hit * 0.55 + wave(m.t, 2) * 0.04);
  });

  return (
    <IconMotion seed={23}>
      <group rotation={[0.16, -0.32, 0]} position={[0, -0.12, 0]} scale={1.25}>
        {/* body */}
        <RoundedBox args={[1.3, 0.9, 0.95]} radius={0.16} smoothness={5}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* top cooling ridge */}
        <RoundedBox args={[0.8, 0.12, 0.6]} radius={0.05} smoothness={4} position={[-0.1, 0.5, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* lens barrel, stepped */}
        <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.36, 0.38, 0.3, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.33, 0.18, 64]} />
          <meshPhysicalMaterial color="#2A2440" roughness={0.3} clearcoat={1} />
        </mesh>
        {/* glowing ring + glass */}
        <mesh position={[0, 0, 0.92]}>
          <torusGeometry args={[0.27, 0.035, 20, 64]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        <mesh ref={iris} position={[0, 0, 0.915]}>
          <circleGeometry args={[0.2, 48]} />
          <meshPhysicalMaterial color="#120F22" roughness={0.05} clearcoat={1} />
        </mesh>
        <mesh position={[-0.07, 0.07, 0.92]}>
          <circleGeometry args={[0.05, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
        {/* status LED on the body face */}
        <mesh position={[0.48, 0.3, 0.48]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial ref={led} color={light} emissive={light} emissiveIntensity={1} />
        </mesh>
      </group>
    </IconMotion>
  );
}
