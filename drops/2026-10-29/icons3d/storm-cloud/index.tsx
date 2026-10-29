import { useMemo } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { color, num, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Storm Cloud',
  description: 'A puffy 3D cloud with an extruded lightning bolt.',
  tags: ['weather', 'storm', '3d'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  cloudColor: color('Cloud').default('#8B9CFF'),
  boltColor: color('Bolt').default('#FFD34E'),
  puffiness: num(0.8, 1.3, 0.05).default(1),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy' },
  metal: { material: 'metal', cloudColor: '#C9CED6', boltColor: '#F2B51C' },
  glass: { material: 'glass', cloudColor: '#B8C4FF' },
  night: { cloudColor: '#3B3FD8', boltColor: '#FFE27A' },
};

function Mat({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.15} clearcoat={1} clearcoatRoughness={0.1} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.25} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.05} transmission={0.9} thickness={1} ior={1.4} />;
    default:
      return <meshStandardMaterial color={c} roughness={0.9} />;
  }
}

const PUFFS: [number, number, number, number][] = [
  [-0.75, -0.1, 0, 0.55],
  [-0.1, 0.25, 0, 0.75],
  [0.65, 0, 0, 0.6],
  [0.2, -0.25, 0.25, 0.55],
  [-0.4, -0.25, 0.25, 0.5],
];

export default function StormCloud(p: z.infer<typeof schema>) {
  const bolt = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.1, 0);
    s.lineTo(-0.3, -0.6);
    s.lineTo(0, -0.6);
    s.lineTo(-0.15, -1.1);
    s.lineTo(0.35, -0.4);
    s.lineTo(0.05, -0.4);
    s.lineTo(0.25, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
  }, []);

  return (
    <group position={[0, 0.25, 0]}>
      {PUFFS.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r * p.puffiness, 48, 48]} />
          <Mat kind={p.material} c={p.cloudColor} />
        </mesh>
      ))}
      <mesh geometry={bolt} position={[0, -0.4, 0.55]}>
        <meshStandardMaterial color={p.boltColor} emissive={p.boltColor} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
    </group>
  );
}
