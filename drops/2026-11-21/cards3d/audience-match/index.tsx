import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Match',
  description: 'Feature card for Multiball Audience Match: a white bullseye target with a dart in its glowing centre, which pulses like a lock-on; lit by beams seeded from the project name.',
  tags: ['card', 'audiences', 'target', 'bullseye', 'ad agent'],
};

export const schema = beamSchema({ name: 'Audience Match' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lookalikes: { name: 'Lookalikes' },
  retargeting: { name: 'Retargeting' },
  teal: { lightMode: 'custom', light: '#00B3A4' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, tone = '#F5F3F0' }: { finish: P['finish']; tone?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={tone} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={tone} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AudienceMatch(p: P) {
  const light = beamLight(p).color;
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const coreMesh = useRef<THREE.Mesh>(null);
  const dart = useRef<THREE.Group>(null);

  // Target disc: lathe facing +z with stepped rings.
  const disc = useMemo(() => {
    const prof: [number, number][] = [
      [0, 0.0],
      [0.82, 0.0],
      [0.86, 0.04],
      [0.86, 0.12],
      [0.8, 0.16],
      [0, 0.16],
    ];
    return new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72);
  }, []);

  // Idle: the centre pulses like a lock-on and the dart quivers after landing;
  // hover brightens, a click re-throws (dart shakes hard).
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const k = wave(m.t, 2) * 0.5 + 0.5;
    if (core.current) core.current.emissiveIntensity = 0.6 + k * 0.8 + m.hover * 0.8 + Math.abs(press) * 1.5;
    if (coreMesh.current) coreMesh.current.scale.setScalar(1 + k * 0.06);
    if (dart.current) {
      const q = wave(m.t, 8) * 0.03 * (0.4 + (wave(m.t, 1) * 0.5 + 0.5)) + press * 0.25;
      dart.current.rotation.x = 0.55 + q;
      dart.current.rotation.y = -0.5 + q * 0.6;
    }
  });

  return (
    <IconMotion seed={59}>
      <group rotation={[0.1, -0.42, 0]} position={[0.1, -0.08, 0]} scale={1.3}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh geometry={disc} rotation={[Math.PI, 0, 0]} position={[0, 0.08, 0]}>
            <Shell finish={p.finish} />
          </mesh>
        </group>
        {/* raised rings */}
        {[0.66, 0.44].map((r) => (
          <mesh key={r} position={[0, 0, 0.09]}>
            <torusGeometry args={[r, 0.035, 16, 72]} />
            <Shell finish={p.finish} tone="#E2DFDA" />
          </mesh>
        ))}
        {/* glowing bullseye */}
        <mesh ref={coreMesh} position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.06, 48]} />
          <meshStandardMaterial ref={core} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} />
        </mesh>
        {/* dart stuck in the centre, pointing into the board */}
        <group ref={dart} position={[0.04, 0.03, 0.12]} rotation={[0.55, -0.5, 0]}>
          <mesh position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.012, 0.72, 20]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.05, 0.22, 24]} />
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0, 0.84]} rotation={[0, 0, (i / 3) * Math.PI]}>
              <boxGeometry args={[0.3, 0.012, 0.2]} />
              <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
