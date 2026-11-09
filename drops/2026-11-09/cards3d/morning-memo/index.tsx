import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Morning Memo',
  description: 'Project card for Patchwell Morning Memo (the 8 a.m. performance report): a glossy hardback with a glowing ribbon bookmark, lit by beams seeded from the project name.',
  tags: ['card', 'report', 'book', 'memo', 'project'],
};

export const schema = beamSchema({ name: 'Morning Memo' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'weekly-ledger': { name: 'Weekly Ledger' },
  'playbook': { name: 'Brand Playbook' },
  'mustard': { lightMode: 'custom', light: '#E9B44C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEE8" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3EF" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const W = 1.1; // cover width (x)
const H = 1.5; // height (y)
const T = 0.34; // thickness (z)

export default function MorningMemo(p: P) {
  const light = beamLight(p).color;
  const ribbonMat = useRef<THREE.MeshStandardMaterial>(null);
  const ribbon = useRef<THREE.Group>(null);
  const cover = useRef<THREE.Group>(null);

  // A ribbon that curls out of the bottom of the page block.
  const ribbonGeo = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.03, -0.2, 0.05),
      new THREE.Vector3(0.12, -0.4, 0.12),
      new THREE.Vector3(0.08, -0.6, 0.2),
    ]);
    const g = new THREE.TubeGeometry(c, 40, 0.05, 8, false);
    g.scale(2.2, 1, 0.3); // flatten into a ribbon
    return g;
  }, []);

  // Idle: the ribbon sways and glows; hover lifts the front cover a little,
  // click flips it open and shut.
  useLoop((m) => {
    const kick = pressBounce(m.pressAge);
    if (ribbon.current) ribbon.current.rotation.z = wave(m.t, 1) * 0.18 + kick * 0.5;
    if (ribbonMat.current) ribbonMat.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + m.hover * 0.8 + Math.abs(kick) * 2;
    if (cover.current) cover.current.rotation.y = -(m.hover * 0.28 + Math.abs(kick) * 0.9 + (wave(m.t, 1, 0.25) * 0.5 + 0.5) * 0.06);
  });

  return (
    <IconMotion seed={88}>
      <group rotation={[0.1, 0.42, -0.1]} position={[0.05, 0.02, 0]} scale={1.08}>
        {/* back cover */}
        <RoundedBox args={[W, H, 0.06]} radius={0.025} smoothness={4} position={[0, 0, -T / 2 + 0.03]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* spine, rounded */}
        <mesh position={[-W / 2, 0, 0]} rotation={[0, 0, 0]} scale={[0.5, 1, 1]}>
          <cylinderGeometry args={[T / 2, T / 2, H, 32, 1, false, Math.PI, Math.PI]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* gilt bands on the spine */}
        {[0.5, -0.5].map((y) => (
          <mesh key={y} position={[-W / 2 - 0.005, y, 0]} scale={[0.5, 1, 1]}>
            <cylinderGeometry args={[T / 2 + 0.006, T / 2 + 0.006, 0.04, 32, 1, false, Math.PI, Math.PI]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
          </mesh>
        ))}
        {/* page block */}
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[W - 0.08, H - 0.08, T - 0.1]} />
          <meshPhysicalMaterial color="#EFEBE3" roughness={0.6} />
        </mesh>
        {[-0.08, -0.03, 0.02, 0.07].map((z) => (
          <mesh key={z} position={[W / 2 - 0.019, 0, z]}>
            <boxGeometry args={[0.004, H - 0.1, 0.006]} />
            <meshStandardMaterial color="#D3CEC4" />
          </mesh>
        ))}
        {/* ribbon bookmark, glowing */}
        <group ref={ribbon} position={[0.18, -H / 2 + 0.06, 0.02]}>
          <mesh geometry={ribbonGeo}>
            <meshStandardMaterial ref={ribbonMat} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.35} side={THREE.DoubleSide} />
          </mesh>
        </group>
        {/* front cover on a hinge at the spine */}
        <group ref={cover} position={[-W / 2, 0, T / 2 - 0.03]}>
          <RoundedBox args={[W, H, 0.06]} radius={0.025} smoothness={4} position={[W / 2, 0, 0]}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* debossed panel + small glowing title bar */}
          <RoundedBox args={[W * 0.68, H * 0.6, 0.012]} radius={0.01} smoothness={2} position={[W / 2 + 0.03, 0.06, 0.03]}>
            <meshPhysicalMaterial color="#E9E6E0" roughness={0.35} clearcoat={0.5} />
          </RoundedBox>
          <mesh position={[W / 2 + 0.03, 0.22, 0.038]}>
            <planeGeometry args={[W * 0.5, 0.08]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[W / 2 + 0.03, 0.1, 0.038]}>
            <planeGeometry args={[W * 0.48, 0.03]} />
            <meshStandardMaterial color="#A9A49B" />
          </mesh>
          <mesh position={[W / 2 + 0.03, 0.02, 0.038]}>
            <planeGeometry args={[W * 0.36, 0.03]} />
            <meshStandardMaterial color="#A9A49B" />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
