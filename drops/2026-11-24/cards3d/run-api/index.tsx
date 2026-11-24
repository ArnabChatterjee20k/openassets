import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Run API',
  description: 'Project card for the Benchwire Run API: a glossy console block with a glowing prompt and a blinking cursor, lit by beams seeded from the project name.',
  tags: ['card', 'api', 'terminal', 'developer', 'project'],
};

export const schema = beamSchema({ name: 'Run API' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  cli: { name: 'Benchwire CLI' },
  webhooks: { name: 'Run Webhooks' },
  chartreuse: { lightMode: 'custom', light: '#D4FF3A' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.25} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F2F1" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F5F4" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function RunApi(p: P) {
  const light = beamLight(p).color;
  const cursor = useRef<THREE.Mesh>(null);
  const prompt = useRef<THREE.MeshStandardMaterial>(null);
  const lines = useRef<(THREE.Mesh | null)[]>([]);

  // Idle: the cursor blinks twice a second, log lines type out one by one; hover brightens; click "runs" (flash).
  useLoop((m) => {
    const kick = Math.abs(pressBounce(m.pressAge));
    if (cursor.current) cursor.current.visible = cycle(m.t, 8) < 0.55 || m.hover > 0.5;
    if (prompt.current) prompt.current.emissiveIntensity = 1.4 + m.hover * 0.8 + kick * 3 + wave(m.t, 1) * 0.2;
    const u = cycle(m.t, 1);
    lines.current.forEach((l, i) => {
      if (!l) return;
      const k = Math.min(1, Math.max(0.001, (u - i * 0.2) / 0.18));
      l.scale.x = k;
      l.position.x = -0.42 + (l.userData.w * k) / 2;
    });
  });

  const W = [0.62, 0.46, 0.7];
  return (
    <IconMotion seed={23} sway={0.1}>
      <group rotation={[0.12, -0.42, 0]} position={[0, -0.2, 0]} scale={1.35}>
        {/* console body */}
        <RoundedBox args={[1.5, 1.1, 0.5]} radius={0.14} smoothness={5}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* recessed dark screen */}
        <RoundedBox args={[1.22, 0.78, 0.06]} radius={0.06} smoothness={4} position={[0, 0.04, 0.24]}>
          <meshPhysicalMaterial color="#0C1416" roughness={0.15} clearcoat={1} />
        </RoundedBox>
        {/* prompt chevron ">" */}
        <group position={[-0.42, 0.2, 0.28]}>
          <mesh position={[0.04, 0.045, 0]} rotation={[0, 0, -0.75]}>
            <boxGeometry args={[0.16, 0.04, 0.02]} />
            <meshStandardMaterial ref={prompt} color={light} emissive={light} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
          <mesh position={[0.04, -0.045, 0]} rotation={[0, 0, 0.75]}>
            <boxGeometry args={[0.16, 0.04, 0.02]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
          {/* block cursor */}
          <mesh ref={cursor} position={[0.24, 0, 0]}>
            <boxGeometry args={[0.1, 0.16, 0.02]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </group>
        {/* log lines typing out */}
        {W.map((w, i) => (
          <mesh key={i} ref={(el) => void (lines.current[i] = el)} position={[-0.42 + w / 2, -0.04 - i * 0.12, 0.28]} userData={{ w }}>
            <boxGeometry args={[w, 0.04, 0.01]} />
            <meshStandardMaterial color={i === 2 ? light : '#8FA6A2'} emissive={i === 2 ? light : '#8FA6A2'} emissiveIntensity={i === 2 ? 0.9 : 0.3} />
          </mesh>
        ))}
        {/* status LED + feet */}
        <mesh position={[0.6, -0.46, 0.24]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} />
        </mesh>
        {[-0.55, 0.55].map((x) => (
          <RoundedBox key={x} args={[0.24, 0.08, 0.36]} radius={0.03} smoothness={3} position={[x, -0.58, 0]}>
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </RoundedBox>
        ))}
      </group>
    </IconMotion>
  );
}
