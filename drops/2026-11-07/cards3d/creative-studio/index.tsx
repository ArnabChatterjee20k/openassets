import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Creative Studio',
  description: 'Project card for Mandate Creative Studio: a compact glossy white camera with a glowing lens ring; the focus ring turns as variants are generated and the shutter flashes once per loop.',
  tags: ['card', 'creatives', 'camera', 'studio', 'project'],
};

export const schema = beamSchema({ name: 'Creative Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'variant-lab': { name: 'Variant Lab' },
  'ugc-review': { name: 'UGC Review' },
  gold: { lightMode: 'custom', light: '#C9A45C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const Dark = () => <meshPhysicalMaterial color="#1C1C20" roughness={0.3} clearcoat={0.8} />;
const Steel = () => <meshPhysicalMaterial color="#E2E4EA" metalness={0.55} roughness={0.2} clearcoat={1} />;

const BODY = { w: 1.5, h: 0.92, d: 0.56 };

export default function CreativeStudio(p: P) {
  const light = beamLight(p).color;
  const focus = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const flash = useRef<THREE.MeshStandardMaterial>(null);
  const button = useRef<THREE.Group>(null);

  // Idle: the focus ring hunts back and forth, the shutter fires once per loop
  // (button dips, flash window pops, lens ring flares). Hover speeds the ring;
  // a click fires the shutter.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    const shot = blink(m.t, 0.7, 0.03);
    if (focus.current) focus.current.rotation.z = wave(m.t, 1) * 0.6 + cycle(m.t, 1) * Math.PI * 2 * m.hover;
    if (button.current) button.current.position.y = BODY.h / 2 + 0.05 - Math.max(blink(m.t, 0.68, 0.03), press) * 0.04;
    if (ring.current) ring.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + shot * 2 + press * 2.5 + m.hover * 0.6;
    if (flash.current) flash.current.emissiveIntensity = 0.05 + Math.max(shot, press) * 4;
  });

  const front = BODY.d / 2;
  return (
    <IconMotion seed={71} float={0.05}>
      <group position={[0, -0.18, 0]} rotation={[0.14, -0.42, 0]} scale={1.02}>
        {/* body */}
        <RoundedBox args={[BODY.w, BODY.h, BODY.d]} radius={0.14} smoothness={6}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* textured grip band */}
        <RoundedBox args={[BODY.w + 0.01, BODY.h * 0.42, BODY.d + 0.01]} radius={0.06} smoothness={4} position={[0, -0.08, 0]}>
          <meshPhysicalMaterial color="#E7E5E0" roughness={0.6} />
        </RoundedBox>
        {/* viewfinder hump */}
        <RoundedBox args={[0.5, 0.2, 0.42]} radius={0.07} smoothness={4} position={[-0.28, BODY.h / 2 + 0.06, -0.02]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* shutter button */}
        <group ref={button} position={[0.46, BODY.h / 2 + 0.05, 0]}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 32]} />
            <Steel />
          </mesh>
        </group>
        {/* flash window */}
        <RoundedBox args={[0.28, 0.13, 0.03]} radius={0.02} smoothness={3} position={[0.48, 0.26, front]}>
          <meshStandardMaterial ref={flash} color="#F7F5EF" emissive="#FFFFFF" emissiveIntensity={0.05} roughness={0.15} toneMapped={false} />
        </RoundedBox>
        {/* lens: barrel, knurled focus ring, glowing front ring, glass */}
        <group position={[-0.06, -0.02, front]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.4, 0.42, 0.12, 64]} />
            <Steel />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.34, 0.36, 0.2, 64]} />
            <Dark />
          </mesh>
        </group>
        <group ref={focus} position={[-0.06, -0.02, front + 0.2]}>
          {Array.from({ length: 28 }, (_, i) => {
            const a = (i / 28) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.355, Math.sin(a) * 0.355, 0]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.03, 0.035, 0.16]} />
                <meshStandardMaterial color="#3A3A40" roughness={0.45} />
              </mesh>
            );
          })}
        </group>
        <mesh position={[-0.06, -0.02, front + 0.305]}>
          <torusGeometry args={[0.3, 0.03, 16, 96]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.25} toneMapped={false} />
        </mesh>
        <mesh position={[-0.06, -0.02, front + 0.29]}>
          <circleGeometry args={[0.27, 64]} />
          <meshPhysicalMaterial color="#0B0B10" roughness={0.05} metalness={0.2} clearcoat={1} />
        </mesh>
        {/* lens reflection highlight */}
        <mesh position={[-0.13, 0.06, front + 0.295]}>
          <circleGeometry args={[0.06, 32]} />
          <meshBasicMaterial color={light} transparent opacity={0.35} toneMapped={false} />
        </mesh>
      </group>
    </IconMotion>
  );
}
