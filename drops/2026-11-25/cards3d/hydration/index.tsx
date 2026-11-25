import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Hydration',
  description: 'Project card for Satiate Hydration: a glossy white water bottle with a glowing level window that fills and settles, lit by beams seeded from the project name. A click pops the flip cap.',
  tags: ['card', 'water', 'hydration', 'habit', 'bottle'],
};

export const schema = beamSchema({ name: 'Hydration' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'water-goal': { name: 'Water Goal' },
  habits: { name: 'Daily Habits' },
  aqua: { lightMode: 'custom', light: '#3DA8FF' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.5 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function Hydration(p: P) {
  const light = beamLight(p).color;
  const body = useMemo(() => {
    const prof: [number, number][] = [[0, -0.9], [0.3, -0.9], [0.37, -0.86], [0.4, -0.78], [0.4, 0.42], [0.37, 0.56], [0.27, 0.66], [0.22, 0.7], [0.22, 0.78], [0, 0.78]];
    return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 64);
  }, []);
  const level = useRef<THREE.Group>(null);
  const levelMat = useRef<THREE.MeshStandardMaterial>(null);
  const lid = useRef<THREE.Group>(null);

  // Idle: the level window fills and settles; hover glows harder; click flips the cap.
  useLoop((m) => {
    const l = 0.62 + wave(m.t, 1, -0.25) * 0.28;
    if (level.current) level.current.scale.y = l;
    if (levelMat.current) levelMat.current.emissiveIntensity = 1.3 + m.hover * 0.9 + (wave(m.t, 4) * 0.5 + 0.5) * 0.3;
    if (lid.current) lid.current.rotation.x = -Math.abs(pressBounce(m.pressAge)) * 1.4 - m.hover * 0.15;
  });

  return (
    <IconMotion seed={57}>
      <group position={[0, -0.05, 0]} rotation={[0.12, -0.4, 0.12]} scale={0.95}>
        <mesh geometry={body}>
          <Shell finish={p.finish} />
        </mesh>
        {/* dark recessed window track */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.404, 0.404, 1.0, 48, 1, true, 0.05, 0.7]} />
          <meshStandardMaterial color="#1A1C24" roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* glowing water level, grows from the bottom of the track */}
        <group ref={level} position={[0, -0.7, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.41, 0.41, 1.0, 48, 1, true, 0.1, 0.6]} />
            <meshStandardMaterial ref={levelMat} color={light} emissive={light} emissiveIntensity={1.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
        {/* grip ring */}
        <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.39, 0.025, 16, 64]} />
          <meshStandardMaterial color="#B8C0CC" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* flip cap on a hinge at the back */}
        <group ref={lid} position={[0, 0.8, -0.2]}>
          <mesh position={[0, 0.07, 0.2]}>
            <cylinderGeometry args={[0.25, 0.26, 0.16, 48]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, 0.17, 0.2]}>
            <sphereGeometry args={[0.25, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* carry loop */}
          <mesh position={[0, 0.26, 0.2]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.13, 0.035, 16, 32, Math.PI]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
