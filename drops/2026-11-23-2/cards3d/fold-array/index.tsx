import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Fold Array',
  description: 'Project card for Sparkcrate Fold Array, the fold-out solar wings: a glossy white panel on a tilt stand, with a glowing cell strip that scans like it is tracking the sun.',
  tags: ['card', 'solar', 'panel', 'generation', 'project'],
};

export const schema = beamSchema({ name: 'Fold Array' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'sun-track': { name: 'Sun Track' },
  'panel-kit': { name: 'Panel Kit 120' },
  coral: { lightMode: 'custom', light: '#FF6B4A' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function FoldArray(p: P) {
  const light = beamLight(p).color;
  const panel = useRef<THREE.Group>(null);
  const cells = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Idle: the panel tilts gently as if tracking the sun and a light scan runs
  // across the cells. Hover tilts it further toward the viewer; a click flashes it.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (panel.current) panel.current.rotation.x = -0.6 + wave(m.t, 1) * 0.06 + m.hover * 0.18 + press * 0.25;
    const head = cycle(m.t, 1) * 6 - 1;
    cells.current.forEach((c, i) => {
      if (!c) return;
      const col = i % 4;
      const k = Math.max(0, 1 - Math.abs(head - col) / 1.1);
      c.emissiveIntensity = 0.12 + k * 1.6 + m.hover * 0.4 + Math.abs(press) * 3;
    });
  });

  return (
    <IconMotion seed={23}>
      <group position={[0, -0.1, 0]} rotation={[0.1, -0.42, 0]} scale={1.3}>
        {/* base foot + post */}
        <RoundedBox args={[0.9, 0.12, 0.55]} radius={0.05} smoothness={4} position={[0, -0.62, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.6, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* tilting panel; the hinge hub sits behind it */}
        <group ref={panel} rotation={[-0.6, 0, 0]}>
          <mesh position={[0, 0, -0.12]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.36, 24]} />
            <Shell finish={p.finish} />
          </mesh>
          <RoundedBox args={[1.9, 1.08, 0.09]} radius={0.06} smoothness={5} position={[0, 0.1, 0]}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <RoundedBox key={`${r}${c}`} args={[0.4, 0.28, 0.03]} radius={0.015} smoothness={2} position={[(c - 1.5) * 0.44, 0.1 + (r - 1) * 0.31, 0.05]}>
                <meshStandardMaterial ref={(el) => void (cells.current[r * 4 + c] = el)} color="#20232C" emissive={light} emissiveIntensity={0.12} roughness={0.25} metalness={0.3} />
              </RoundedBox>
            )),
          )}
        </group>
      </group>
    </IconMotion>
  );
}
