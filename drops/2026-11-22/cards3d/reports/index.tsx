import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Reports',
  description: 'Feature card for Folio Reports: three white bars on a plinth, the tallest crowned with a glowing cap that rises as results come in, lit by beams seeded from the feature name.',
  tags: ['card', 'reports', 'analytics', 'chart', 'feature'],
};

export const schema = beamSchema({ name: 'Reports' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'weekly-digest': { name: 'Weekly Digest' },
  attribution: { name: 'Attribution' },
  'swiss-red': { lightMode: 'custom', light: '#E3000F' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F5F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const BARS = [
  { x: -0.5, h: 0.55 },
  { x: 0, h: 0.85 },
  { x: 0.5, h: 1.25 },
];

export default function Reports(p: P) {
  const light = beamLight(p).color;
  const bars = useRef<(THREE.Group | null)[]>([]);
  const cap = useRef<THREE.Group>(null);
  const capMat = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: bars breathe out of phase like live numbers; the glowing cap rides the
  // tallest bar. Hover grows the winner; click bounces all three.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    let top = 0;
    bars.current.forEach((g, i) => {
      if (!g) return;
      const h = BARS[i].h * (1 + wave(m.t, 1, i * 0.22) * 0.15 + (i === 2 ? m.hover * 0.15 : 0) + b * 0.12 * (i + 1) * 0.5);
      g.scale.y = h;
      if (i === 2) top = h;
    });
    if (cap.current) cap.current.position.y = top + 0.07;
    if (capMat.current) capMat.current.emissiveIntensity = 1.6 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + m.hover;
  });

  return (
    <IconMotion seed={88} float={0.05}>
      <group rotation={[0.2, -0.55, 0]} position={[0, -0.85, 0]} scale={1.12}>
        <RoundedBox args={[1.65, 0.14, 0.75]} radius={0.06} smoothness={5} position={[0, -0.07, 0]}>
          <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
        </RoundedBox>
        {BARS.map((bar, i) => (
          <group key={i} position={[bar.x, 0, 0]} ref={(el) => void (bars.current[i] = el)}>
            <RoundedBox args={[0.36, 1, 0.36]} radius={0.05} smoothness={4} position={[0, 0.5, 0]}>
              <Shell finish={p.finish} />
            </RoundedBox>
          </group>
        ))}
        {/* glowing cap on the leading bar */}
        <group ref={cap} position={[0.5, 1.3, 0]}>
          <RoundedBox args={[0.4, 0.1, 0.4]} radius={0.04} smoothness={4}>
            <meshStandardMaterial ref={capMat} color={light} emissive={light} emissiveIntensity={1.8} roughness={0.3} />
          </RoundedBox>
        </group>
      </group>
    </IconMotion>
  );
}
