import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Magnet Line',
  description: "Project card for Ternary's rare-earth Magnet Line: a glossy white horseshoe magnet with glowing pole caps and pulsing field rings, lit by beams seeded from the name.",
  tags: ['card', 'magnet', 'rare earth', 'ndfeb', 'project'],
};

export const schema = beamSchema({ name: 'Magnet Line' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ndfeb: { name: 'NdFeB Alloys' },
  smco: { name: 'SmCo Program' },
  teal: { lightMode: 'custom', light: '#2C9C94' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.5 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEE8" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F2EE" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const R = 0.56; // arch centre-line radius
const T = 0.23; // bar half-thickness
const LEG = 0.5;

export default function MagnetLine(p: P) {
  const light = beamLight(p).color;
  const caps = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const body = useRef<THREE.Group>(null);

  // Idle: pole caps pulse in alternation, field rings ripple out of the poles; hover strengthens; click snaps the magnet.
  useLoop((m) => {
    const snap = pressBounce(m.pressAge);
    caps.current.forEach((c, i) => {
      if (c) c.emissiveIntensity = 1.1 + (0.5 + 0.5 * wave(m.t, 2, i * 0.5)) * 0.9 + m.hover * 1 + Math.abs(snap) * 3;
    });
    rings.current.forEach((r, i) => {
      if (!r) return;
      const u = cycle(m.t, 2, (i % 2) * 0.5);
      r.scale.setScalar(0.6 + u * 1.3);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - u) * (0.55 + m.hover * 0.35);
    });
    if (body.current) body.current.rotation.z = snap * 0.25;
  });

  return (
    <IconMotion seed={66}>
      <group position={[0.05, -0.12, 0]} rotation={[0.25, -0.2, 0.7]} scale={1.1}>
        <group ref={body}>
          {/* arch: half torus */}
          <mesh position={[0, -0.1, 0]}>
            <torusGeometry args={[R, T, 32, 64, Math.PI]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* legs */}
          {[-R, R].map((x) => (
            <mesh key={x} position={[x, -0.1 - LEG / 2, 0]}>
              <cylinderGeometry args={[T, T, LEG, 40]} />
              <Shell finish={p.finish} />
            </mesh>
          ))}
          {/* glowing pole caps */}
          {[-R, R].map((x, i) => (
            <mesh key={`c${x}`} position={[x, -0.1 - LEG - 0.11, 0]}>
              <cylinderGeometry args={[T * 1.02, T * 1.02, 0.22, 40]} />
              <meshStandardMaterial ref={(el) => void (caps.current[i] = el)} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
            </mesh>
          ))}
          {/* field rings rippling off the poles */}
          {[-R, R, -R, R].map((x, i) => (
            <mesh key={`r${i}`} ref={(el) => void (rings.current[i] = el)} position={[x, -0.1 - LEG - 0.3 - (i > 1 ? 0.12 : 0), 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[T * 1.1, 0.012, 8, 48]} />
              <meshBasicMaterial color={light} transparent opacity={0.5} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
