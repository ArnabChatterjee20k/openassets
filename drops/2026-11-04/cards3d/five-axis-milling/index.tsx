import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: '5-Axis Milling',
  description: 'Project card for Redbrick 5-Axis Milling: a white tool holder with a fluted end mill that spins in the card light, a glowing collar at the collet.',
  tags: ['card', 'cnc', 'milling', 'tool', 'project'],
};

export const schema = beamSchema({ name: '5-Axis Milling' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'cnc-turning': { name: 'CNC Turning' },
  'lights-out-cell': { name: 'Lights-Out Cell' },
  amber: { lightMode: 'custom', light: '#F2A541' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', beams: 0.6 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, c = '#F5F2EE' }: { finish: P['finish']; c?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8D4CE" metalness={1} roughness={0.2} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={c} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={c} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** Two helical flutes wrapped around the cutter core. */
function useFlutes() {
  return useMemo(() => {
    const make = (phase: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const a = phase + t * Math.PI * 3;
        pts.push(new THREE.Vector3(Math.cos(a) * 0.13, -t * 0.82, Math.sin(a) * 0.13));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.065, 14, false);
    };
    return [make(0), make(Math.PI)];
  }, []);
}

export default function FiveAxisMilling(p: P) {
  const light = beamLight(p).color;
  const spin = useRef<THREE.Group>(null);
  const collar = useRef<THREE.MeshStandardMaterial>(null);
  const flutes = useFlutes();

  // Idle: the cutter turns (a full turn per loop, two when busy on hover),
  // the collar pulses. Click: a quick burst of extra spin.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (spin.current) spin.current.rotation.y = cycle(m.t, m.hover > 0.5 ? 4 : 1) * Math.PI * 2 + Math.abs(press) * 4;
    if (collar.current) collar.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 1.0 + m.hover * 1.2 + Math.abs(press) * 2.5;
  });

  return (
    <IconMotion seed={53} float={0.05}>
      <group position={[0.05, 0.02, 0]} rotation={[0.18, 0, -0.38]} scale={1.2}>
        <group ref={spin}>
          {/* Taper shank (top) */}
          <mesh position={[0, 0.82, 0]}>
            <cylinderGeometry args={[0.16, 0.28, 0.5, 48]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.08, 32]} />
            <Shell finish={p.finish} c="#E2DED8" />
          </mesh>
          {/* Flange with V-groove */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.1, 64]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.06, 64]} />
            <Shell finish={p.finish} c="#D9D4CD" />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.1, 64]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* Body tapering to the collet */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.32, 0.22, 0.38, 48]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* Glowing collar */}
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.24, 0.065, 20, 56]} />
            <meshStandardMaterial ref={collar} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          {/* Collet nut */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.2, 0.16, 0.16, 6]} />
            <Shell finish={p.finish} c="#E8E4DE" />
          </mesh>
          {/* End mill: shank + fluted cutter */}
          <mesh position={[0, -0.36, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.24, 32]} />
            <meshStandardMaterial color="#D2CCC4" metalness={0.5} roughness={0.35} />
          </mesh>
          <group position={[0, -0.48, 0]}>
            <mesh position={[0, -0.41, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.82, 24]} />
              <meshStandardMaterial color="#B5AFA7" metalness={0.5} roughness={0.4} />
            </mesh>
            {flutes.map((g, i) => (
              <mesh key={i} geometry={g}>
                <meshPhysicalMaterial color="#E9E5DF" metalness={0.35} roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
