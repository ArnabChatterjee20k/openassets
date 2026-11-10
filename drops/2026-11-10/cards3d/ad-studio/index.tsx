import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Ad Studio',
  description: 'Project card for Formwork Ad Studio, the creative generator: a glossy white megaphone whose glowing bell sends out rings of light. Lit by beams seeded from the project name.',
  tags: ['card', 'creative', 'ads', 'megaphone', 'project'],
};

export const schema = beamSchema({ name: 'Ad Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'creative-lab': { name: 'Creative Lab' },
  'launch-desk': { name: 'Launch Desk' },
  cobalt: { lightMode: 'custom', light: '#3D7BFF' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2EE' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
}

export default function AdStudio(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const waves = useRef<(THREE.Mesh | null)[]>([]);

  // Idle: the bell ring breathes and two light rings travel out of the bell
  // (twice per loop). Hover makes it louder; a click blasts a bright pulse.
  useLoop((m) => {
    const kick = Math.abs(pressBounce(m.pressAge));
    if (ring.current) ring.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + m.hover * 0.8 + kick * 2.5;
    waves.current.forEach((w, i) => {
      if (!w) return;
      const u = cycle(m.t, 2, i * 0.5);
      w.position.x = 0.62 + u * 0.55;
      w.scale.setScalar(0.9 + u * 0.5);
      const mat = w.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.sin(Math.PI * u) * (0.75 + m.hover * 0.25);
      mat.emissiveIntensity = 1.2 + kick * 2;
    });
  });

  return (
    <IconMotion seed={57}>
      <group position={[-0.1, -0.1, 0]} rotation={[0.12, 0.42, 0.14]} scale={1.08}>
        {/* bell: open cone pointing +x */}
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.56, 1.0, 64, 1, true]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* lip */}
        <mesh position={[0.55, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.56, 0.05, 20, 72]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing ring inside the mouth */}
        <mesh position={[0.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.47, 0.035, 16, 72]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* driver at the back of the bell */}
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.3, 48]} />
          <Shell finish={p.finish} color="#E8E5DE" />
        </mesh>
        <mesh position={[-0.66, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.2, 0.05, 16, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* pistol grip + trigger */}
        <RoundedBox args={[0.2, 0.52, 0.22]} radius={0.08} smoothness={5} position={[-0.42, -0.36, 0]} rotation={[0, 0, 0.22]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        <RoundedBox args={[0.08, 0.18, 0.1]} radius={0.035} smoothness={4} position={[-0.25, -0.25, 0]} rotation={[0, 0, 0.3]}>
          <Shell finish={p.finish} color="#DAD6CD" />
        </RoundedBox>
        {/* light rings travelling out */}
        {[0, 1].map((i) => (
          <mesh key={i} ref={(el) => void (waves.current[i] = el)} position={[0.7, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.5, 0.018, 12, 72]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.2} transparent opacity={0.5} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
