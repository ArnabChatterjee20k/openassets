import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, flicker, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Brand Safety',
  description:
    'Project card for Lanternfish Brand Safety: a glossy white lighthouse whose lamp sweeps a beam over every placement. The lamp spins, flickers once per loop, spins faster on hover and flares on click.',
  tags: ['card', 'brand safety', 'lighthouse', 'guardrails', 'project'],
};

export const schema = beamSchema({ name: 'Brand Safety' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'placement-guard': { name: 'Placement Guard' },
  'blocklists': { name: 'Blocklists' },
  photophore: { lightMode: 'custom', light: '#2EF2C4', background: '#021B26' },
  amber: { lightMode: 'custom', light: '#FFB020', finish: 'matte' },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F4F6' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function BrandSafety(p: P) {
  const light = beamLight(p).color;
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const beam = useRef<THREE.Group>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);

  // Idle: the lamp turns (one revolution per loop) and flickers once; hover
  // doubles the speed; a click flares the lamp and beam.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    const f = flicker(m.t, 0.7);
    if (beam.current) beam.current.rotation.y = (m.t / 4) * Math.PI * 2 * (1 + (m.hover > 0.5 ? 1 : 0)) + 0.6;
    if (lamp.current) lamp.current.emissiveIntensity = 1.6 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + f * 1.5 + press * 3 + m.hover * 0.6;
    if (beamMat.current) beamMat.current.opacity = 0.16 + f * 0.18 + press * 0.25 + m.hover * 0.08;
  });

  return (
    <IconMotion seed={37} sway={0.06}>
      <group position={[0, -0.32, 0]} rotation={[0.12, 0, 0]} scale={1.02}>
        {/* rock plinth */}
        <RoundedBox args={[1.25, 0.28, 1.0]} radius={0.12} smoothness={6} position={[0, -0.92, 0]}>
          <Shell finish={p.finish} color="#E3E4E9" />
        </RoundedBox>
        {/* tapered tower */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.3, 0.44, 1.3, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* two grey bands */}
        {[-0.45, 0.05].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.36 - (y + 0.45) * 0.1 + 0.012, 0.38 - (y + 0.45) * 0.1 + 0.012, 0.14, 48]} />
            <Shell finish={p.finish} color="#C9CCD3" />
          </mesh>
        ))}
        {/* door */}
        <RoundedBox args={[0.16, 0.26, 0.06]} radius={0.04} position={[0, -0.7, 0.43]}>
          <Shell finish={p.finish} color="#C9CCD3" />
        </RoundedBox>
        {/* gallery deck + rail */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.46, 0.4, 0.08, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.02, 12, 64]} />
          <Shell finish={p.finish} color="#D5D7DD" />
        </mesh>
        {/* lantern room: glowing lamp inside a white frame */}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 32]} />
          <meshStandardMaterial ref={lamp} color={light} emissive={light} emissiveIntensity={2} roughness={0.2} toneMapped={false} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.22, 0.72, Math.sin(a) * 0.22]}>
              <boxGeometry args={[0.03, 0.38, 0.03]} />
              <Shell finish={p.finish} />
            </mesh>
          );
        })}
        {/* dome cap + finial */}
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.27, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.05, 16, 12]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* sweeping beam: a soft cone that rotates around the lamp */}
        <group ref={beam} position={[0, 0.72, 0]}>
          {/* bright narrow core + wide faint halo, both fading out by distance via additive overlap */}
          <mesh position={[1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.16, 2.0, 32, 1, true]} />
            <meshBasicMaterial ref={beamMat} color={light} transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh position={[1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.42, 2.4, 32, 1, true]} />
            <meshBasicMaterial color={light} transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
