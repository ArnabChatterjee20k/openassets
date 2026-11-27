import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Point Cloud',
  description: 'Project card for Plumbline Point Cloud, the digital twin rebuilt from video: a glossy white cube split into eight blocks around a glowing core.',
  tags: ['card', 'twin', '3d', 'spatial', 'project'],
};

export const schema = beamSchema({ name: 'Point Cloud' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'site-twin': { name: 'Site Twin' },
  'digital-twin': { name: 'Digital Twin' },
  amber: { lightMode: 'custom', light: '#FFB000' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.5 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F2EE" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const CORNERS: [number, number, number][] = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) CORNERS.push([x, y, z]);

export default function DigitalTwin(p: P) {
  const light = beamLight(p).color;
  const blocks = useRef<(THREE.Group | null)[]>([]);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const spin = useRef<THREE.Group>(null);

  // Idle: the eight blocks breathe apart to show the core, which pulses; the
  // cube turns a quarter per loop. Hover opens it wider; a click bursts it open.
  useLoop((m) => {
    const open = 0.07 + (0.5 + 0.5 * wave(m.t, 1, -0.25)) * 0.09 + m.hover * 0.08 + Math.abs(pressBounce(m.pressAge)) * 0.25;
    blocks.current.forEach((b, i) => {
      if (!b) return;
      const [x, y, z] = CORNERS[i];
      b.position.set(x * (0.27 + open), y * (0.27 + open), z * (0.27 + open));
    });
    if (core.current) core.current.emissiveIntensity = 1.6 + (0.5 + 0.5 * wave(m.t, 2)) * 1.2 + m.hover;
    if (spin.current) spin.current.rotation.y = (m.t / 4) * (Math.PI / 2);
  });

  return (
    <IconMotion seed={57} float={0.05} sway={0.08}>
      <group position={[0, -0.18, 0]} rotation={[0.55, 0, 0]}>
        <group ref={spin} rotation={[0, Math.PI / 4, 0]}>
          {CORNERS.map(([x, y, z], i) => (
            <group key={i} ref={(el) => void (blocks.current[i] = el)} position={[x * 0.3, y * 0.3, z * 0.3]}>
              <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.08} smoothness={5}>
                <Shell finish={p.finish} />
              </RoundedBox>
            </group>
          ))}
          <mesh>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial ref={core} color={light} emissive={light} emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
