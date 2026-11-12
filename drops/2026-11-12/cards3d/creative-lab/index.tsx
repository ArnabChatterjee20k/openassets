import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Creative Lab',
  description: 'Project card for Junction Creative Lab, which writes and resizes ad creative for every platform: a glossy white megaphone with a glowing rim sending out rings of sound.',
  tags: ['card', 'creative', 'megaphone', 'ads', 'project'],
};

export const schema = beamSchema({ name: 'Creative Lab' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'hook writer': { name: 'Hook Writer' },
  'promo blast': { name: 'Promo Blast' },
  grapefruit: { lightMode: 'custom', light: '#FF3D7F' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} side={THREE.DoubleSide} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" side={THREE.DoubleSide} />;
  return <meshPhysicalMaterial color="#F5F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
}

export default function CreativeLab(p: P) {
  const light = beamLight(p).color;
  const rim = useRef<THREE.MeshStandardMaterial>(null);
  const waves = useRef<(THREE.Mesh | null)[]>([]);

  // Idle: two sound rings travel out of the bell per loop and fade; the rim glows.
  // Hover adds energy to the rings; click blasts a big pulse.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    if (rim.current) rim.current.emissiveIntensity = 1.4 + (0.5 + 0.5 * wave(m.t, 2)) * 0.6 + m.hover + press * 2;
    waves.current.forEach((w, i) => {
      if (!w) return;
      const u = cycle(m.t, 2, i * 0.5);
      w.position.x = 0.62 + u * 0.55;
      w.scale.setScalar(1 + u * 0.7 + press * 0.3);
      const mat = w.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.sin(Math.PI * u) * (0.55 + m.hover * 0.35);
    });
  });

  return (
    <IconMotion seed={88}>
      <group position={[-0.2, 0, 0]} rotation={[0.08, -0.22, 0.2]} scale={1.15}>
        {/* bell: an open cone pointing along +x */}
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.52, 0.18, 0.95, 64, 1, true]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* inner bell darker so the opening reads */}
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.49, 0.16, 0.9, 64, 1, true]} />
          <meshStandardMaterial color="#3B3D3A" roughness={0.6} side={THREE.BackSide} />
        </mesh>
        {/* glowing rim */}
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0.58, 0, 0]}>
          <torusGeometry args={[0.52, 0.045, 20, 96]} />
          <meshStandardMaterial ref={rim} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* neck + rear driver */}
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[-0.52, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 0.32, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[-0.72, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.1, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* pistol grip + trigger */}
        <RoundedBox args={[0.18, 0.52, 0.2]} radius={0.07} smoothness={4} position={[-0.42, -0.36, 0]} rotation={[0, 0, 0.22]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        <RoundedBox args={[0.07, 0.18, 0.08]} radius={0.03} smoothness={3} position={[-0.25, -0.24, 0]} rotation={[0, 0, 0.3]}>
          <meshStandardMaterial color="#2A2E2A" />
        </RoundedBox>
        {/* sound rings */}
        {[0, 1].map((i) => (
          <mesh key={i} ref={(el) => void (waves.current[i] = el)} rotation={[0, Math.PI / 2, 0]} position={[0.7, 0, 0]}>
            <torusGeometry args={[0.5, 0.018, 12, 96]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} transparent opacity={0.5} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
