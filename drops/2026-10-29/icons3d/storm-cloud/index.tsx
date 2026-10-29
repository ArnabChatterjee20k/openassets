import { useMemo } from 'react';
import { MarchingCube, MarchingCubes } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, num, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Storm Cloud',
  description: 'A soft, seamless 3D cloud (metaballs) with a beveled lightning bolt and raindrops.',
  tags: ['weather', 'storm', '3d', 'cloud'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  cloudColor: color('Cloud').default('#9AA6FF'),
  boltColor: color('Bolt').default('#FFC21A'),
  dropColor: color('Raindrops').default('#5B8CFF'),
  puffiness: num(0.8, 1.2, 0.05).default(1),
  drops: num(0, 3, 1, 'Raindrops').default(2),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', cloudColor: '#7F8CFF' },
  metal: { material: 'metal', cloudColor: '#D5DAE3', boltColor: '#F2A81C', dropColor: '#9FB8D8' },
  glass: { material: 'glass', cloudColor: '#C9D2FF', drops: 0 },
  night: { cloudColor: '#4B4FD6', boltColor: '#FFE27A', dropColor: '#8B9CFF' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} sheen={0.4} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.32} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={1} thickness={1.2} ior={1.35} iridescence={0.4} attenuationColor={c} attenuationDistance={2} />;
    default:
      // Clay: matte with a soft sheen so edges catch light.
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

/** Cloud puffs as metaballs: positions in the -1..1 field space of <MarchingCubes>. */
const PUFFS: [number, number, number, number][] = [
  [-0.42, -0.08, 0, 0.55],
  [-0.05, 0.18, 0, 0.75],
  [0.38, 0.02, 0, 0.6],
  [0.12, -0.16, 0.18, 0.5],
  [-0.22, -0.16, 0.18, 0.5],
  [0.0, -0.1, -0.15, 0.55],
];

export default function StormCloud(p: P) {
  const bolt = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.12, 0.05);
    s.lineTo(-0.3, -0.58);
    s.lineTo(-0.02, -0.58);
    s.lineTo(-0.18, -1.08);
    s.lineTo(0.36, -0.36);
    s.lineTo(0.06, -0.36);
    s.lineTo(0.28, 0.05);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.06, bevelSegments: 6, curveSegments: 4 });
    g.center();
    return g;
  }, []);

  return (
    <group position={[0, 0.2, 0]}>
      {/* One seamless surface instead of intersecting spheres */}
      <MarchingCubes resolution={72} maxPolyCount={40000} enableUvs={false} enableColors={false} scale={[1.9, 1.9, 1.3]}>
        {PUFFS.map(([x, y, z, s], i) => (
          <MarchingCube key={i} strength={s * p.puffiness * 1.5} subtract={12} position={[x * 0.55, y * 0.55, z * 0.55]} />
        ))}
        <Surface kind={p.material} c={p.cloudColor} />
      </MarchingCubes>

      <mesh geometry={bolt} position={[0.05, -0.85, 0.45]} rotation={[0, -0.15, -0.08]} castShadow>
        <meshPhysicalMaterial color={p.boltColor} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} emissive={p.boltColor} emissiveIntensity={0.08} />
      </mesh>

      {Array.from({ length: p.drops }, (_, i) => {
        const x = [-0.62, 0.62, -0.25][i];
        const y = [-0.95, -0.85, -1.15][i];
        return (
          <group key={i} position={[x, y, 0.25]}>
            {/* Raindrop: sphere + cone, rounded and tilted with the wind */}
            <mesh rotation={[0, 0, 0.18]}>
              <sphereGeometry args={[0.11, 32, 32]} />
              <meshPhysicalMaterial color={p.dropColor} roughness={0.12} clearcoat={1} transmission={p.material === 'glass' ? 0.8 : 0} thickness={0.3} />
            </mesh>
            <mesh position={[0.02, 0.12, 0]} rotation={[0, 0, 0.18]}>
              <coneGeometry args={[0.105, 0.2, 32]} />
              <meshPhysicalMaterial color={p.dropColor} roughness={0.12} clearcoat={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
