import { useRef } from 'react';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Live Monitor',
  description: 'Project card for Crossfade Live Monitor, the agent’s 24/7 watch over every campaign: glossy white headphones with glowing ear rings, lit by beams seeded from the project name.',
  tags: ['card', 'monitoring', 'headphones', 'alerts', 'project'],
};

export const schema = beamSchema({ name: 'Live Monitor' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { name: 'Night Shift' },
  'roas-radar': { name: 'ROAS Radar' },
  gold: { lightMode: 'custom', light: '#FFD27F' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

function Cup({ side, finish, light, mat }: { side: 1 | -1; finish: P['finish']; light: string; mat: (el: THREE.MeshStandardMaterial | null) => void }) {
  return (
    <group position={[side * 0.74, -0.32, 0]} rotation={[0, 0, (side * Math.PI) / 2]}>
      {/* shell */}
      <mesh>
        <cylinderGeometry args={[0.36, 0.4, 0.3, 48]} />
        <Shell finish={finish} />
      </mesh>
      {/* cushion facing inward */}
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.09, 16, 48]} />
        <meshPhysicalMaterial color="#3A2A34" roughness={0.85} sheen={0.6} sheenColor="#8A6A7A" />
      </mesh>
      {/* glowing outer ring */}
      <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.035, 16, 48]} />
        <meshStandardMaterial ref={mat} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.155, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 40]} />
        <Shell finish={finish} color="#E8E5E2" />
      </mesh>
    </group>
  );
}

export default function LiveMonitor(p: P) {
  const light = beamLight(p).color;
  const rings = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const band = useRef<THREE.Group>(null);

  // Idle: the ear rings pulse alternately like a stereo meter. Hover lights
  // both up; a click makes the headband flex like it just heard a spike.
  useLoop((m) => {
    rings.current.forEach((r, i) => {
      if (r) r.emissiveIntensity = 1 + Math.abs(wave(m.t, 2, i * 0.25)) * 1.8 + m.hover * 1.2 + Math.abs(pressBounce(m.pressAge)) * 3;
    });
    if (band.current) band.current.scale.x = 1 + pressBounce(m.pressAge) * 0.08 + wave(m.t, 2) * 0.008;
  });

  return (
    <IconMotion seed={88}>
      <group position={[0, 0.02, 0]} rotation={[0.1, -0.38, 0]} scale={1.35}>
        <group ref={band}>
          {/* headband */}
          <mesh position={[0, -0.18, 0]}>
            <torusGeometry args={[0.76, 0.07, 20, 64, Math.PI]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <torusGeometry args={[0.7, 0.05, 16, 64, Math.PI]} />
            <meshPhysicalMaterial color="#3A2A34" roughness={0.85} />
          </mesh>
          {/* sliders down to the cups */}
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.76, -0.22, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.18, 16]} />
              <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
            </mesh>
          ))}
        </group>
        <Cup side={-1} finish={p.finish} light={light} mat={(el) => void (rings.current[0] = el)} />
        <Cup side={1} finish={p.finish} light={light} mat={(el) => void (rings.current[1] = el)} />
      </group>
    </IconMotion>
  );
}
