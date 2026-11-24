import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Plate Library',
  description: 'Project card for the Benchwire Plate Library: a glossy white 24-well plate whose wells light up column by column as a run reads them, lit by beams seeded from the project name.',
  tags: ['card', 'well plate', 'assay', 'lab', 'project'],
};

export const schema = beamSchema({ name: 'Plate Library' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  assays: { name: 'Assay Catalog' },
  screens: { name: 'HTS Screens' },
  coral: { lightMode: 'custom', light: '#FF5A36' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.25} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F2F1" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F5F4" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const COLS = 6;
const ROWS = 4;

export default function PlateLibrary(p: P) {
  const light = beamLight(p).color;
  const wells = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lid = useRef<THREE.Group>(null);

  // Idle: a read head sweeps the columns once per loop, each well lighting as it passes, row B stays lit.
  // Hover lifts the lid a little; a click flashes every well.
  useLoop((m) => {
    const kick = Math.abs(pressBounce(m.pressAge));
    const head = cycle(m.t, 1) * (COLS + 1);
    wells.current.forEach((w, i) => {
      if (!w) return;
      const c = i % COLS;
      const r = Math.floor(i / COLS);
      const d = Math.abs(head - c - 0.5);
      const pass = Math.max(0, 1 - d) ** 2;
      w.emissiveIntensity = (r === 1 ? 1.4 : 0.05) + pass * 1.8 + kick * 2.5 + m.hover * 0.3;
    });
    if (lid.current) lid.current.position.y = 0.2 + m.hover * 0.12;
  });

  return (
    <IconMotion seed={88} sway={0.08}>
      <group rotation={[0.55, -0.45, 0]} position={[0, -0.45, 0]} scale={1.2}>
        <RoundedBox args={[2.0, 0.24, 1.36]} radius={0.07} smoothness={4}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* corner notch tab */}
        <RoundedBox args={[0.18, 0.1, 0.18]} radius={0.03} smoothness={3} position={[-0.96, 0.06, -0.62]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const x = (c - (COLS - 1) / 2) * 0.29;
          const z = (r - (ROWS - 1) / 2) * 0.29;
          return (
            <group key={i} position={[x, 0.12, z]}>
              <mesh>
                <cylinderGeometry args={[0.115, 0.115, 0.02, 32]} />
                <meshPhysicalMaterial color="#C9D3D0" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.005, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.02, 32]} />
                <meshStandardMaterial ref={(el) => void (wells.current[i] = el)} color={r === 1 ? light : '#30403E'} emissive={light} emissiveIntensity={0.05} toneMapped={false} />
              </mesh>
            </group>
          );
        })}
        {/* clear lid hovering just above */}
        <group ref={lid} position={[0, 0.2, 0]}>
          <RoundedBox args={[2.06, 0.06, 1.42]} radius={0.03} smoothness={3}>
            <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={1} thickness={0.1} transparent opacity={0.25} />
          </RoundedBox>
        </group>
      </group>
    </IconMotion>
  );
}
