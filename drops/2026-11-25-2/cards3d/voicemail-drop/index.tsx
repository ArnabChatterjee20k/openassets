import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Voicemail Drop',
  description: 'Project card for Ringside Voicemail Drop: a glossy white cassette with a glowing tape window and spinning reels, lit by beams seeded from the name.',
  tags: ['card', 'voicemail', 'cassette', 'recording', 'project'],
};

export const schema = beamSchema({ name: 'Voicemail Drop' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'vm-library': { name: 'VM Library' },
  'greetings': { name: 'Local Greetings' },
  saffron: { lightMode: 'custom', light: '#F2A541' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F2EF" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function VoicemailDrop(p: P) {
  const light = beamLight(p).color;
  const reels = useRef<(THREE.Group | null)[]>([]);
  const win = useRef<THREE.MeshStandardMaterial>(null);

  // Reels turn (faster on hover, a burst on click); the tape window glows like it's recording.
  useLoop((m) => {
    const spin = cycle(m.t, m.hover > 0.5 ? 4 : 2) * Math.PI * 2 + Math.abs(pressBounce(m.pressAge)) * 3;
    reels.current.forEach((r) => r && (r.rotation.z = -spin));
    if (win.current) win.current.emissiveIntensity = 1 + (wave(m.t, 2) * 0.5 + 0.5) * 0.9 + m.hover * 0.6;
  });

  return (
    <IconMotion seed={57}>
      <group position={[0, -0.12, 0]} rotation={[-0.12, -0.4, 0.08]} scale={1.3}>
        <RoundedBox args={[2.0, 1.26, 0.26]} radius={0.1} smoothness={5}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* label band */}
        <RoundedBox args={[1.7, 0.72, 0.04]} radius={0.04} smoothness={3} position={[0, 0.12, 0.13]}>
          <meshPhysicalMaterial color="#E9E5DF" roughness={0.5} />
        </RoundedBox>
        {/* glowing tape window */}
        <RoundedBox args={[1.1, 0.36, 0.03]} radius={0.06} smoothness={4} position={[0, 0.1, 0.155]}>
          <meshStandardMaterial ref={win} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
        </RoundedBox>
        {/* reels */}
        {[-0.34, 0.34].map((x, i) => (
          <group key={x} ref={(el) => void (reels.current[i] = el)} position={[x, 0.1, 0.18]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.04, 6]} />
              <meshPhysicalMaterial color="#F4F2EF" roughness={0.3} clearcoat={1} />
            </mesh>
            {[0, 1, 2].map((k) => (
              <mesh key={k} position={[Math.cos((k * Math.PI * 2) / 3) * 0.08, Math.sin((k * Math.PI * 2) / 3) * 0.08, 0.02]}>
                <boxGeometry args={[0.04, 0.04, 0.02]} />
                <meshStandardMaterial color="#6E6A66" />
              </mesh>
            ))}
          </group>
        ))}
        {/* bottom trapezoid head-guard */}
        <RoundedBox args={[1.1, 0.26, 0.08]} radius={0.04} smoothness={3} position={[0, -0.5, 0.14]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[x, -0.48, 0.135]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 24]} />
            <meshStandardMaterial color="#9B9792" />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
