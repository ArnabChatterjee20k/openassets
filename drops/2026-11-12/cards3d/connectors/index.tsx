import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Connectors',
  description: 'Project card for Junction Connectors, which plugs your store, CRM and analytics into every campaign: a glossy white power plug with a glowing LED collar and a curling cable.',
  tags: ['card', 'integrations', 'plug', 'connectors', 'project'],
};

export const schema = beamSchema({ name: 'Connectors' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'shopify sync': { name: 'Shopify Sync' },
  'crm bridge': { name: 'CRM Bridge' },
  grapefruit: { lightMode: 'custom', light: '#FF3D7F' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function Connectors(p: P) {
  const light = beamLight(p).color;
  const collar = useRef<THREE.MeshStandardMaterial>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const prongs = useRef<THREE.Group>(null);
  const cable = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.62, 0),
          new THREE.Vector3(0, -0.9, 0.05),
          new THREE.Vector3(0.25, -1.05, 0.3),
          new THREE.Vector3(0.62, -0.95, 0.15),
          new THREE.Vector3(0.75, -0.75, -0.25),
          new THREE.Vector3(0.6, -0.9, -0.75),
          new THREE.Vector3(0.2, -1.0, -1.1),
        ]),
        64,
        0.07,
        16,
        false,
      ),
    [],
  );

  // Idle: the LED collar breathes and a light pulse runs down the cable twice per
  // loop (data flowing in). Hover pushes the prongs out; click sparks the collar.
  useLoop((m) => {
    const press = Math.min(1, Math.abs(pressBounce(m.pressAge)) * 2.5);
    if (collar.current) collar.current.emissiveIntensity = 1.3 + (0.5 + 0.5 * wave(m.t, 2)) * 0.7 + m.hover * 0.9 + press * 2;
    const u = cycle(m.t, 2);
    if (pulse.current) {
      const pt = cable.parameters.path.getPointAt(1 - u);
      pulse.current.position.copy(pt);
      pulse.current.scale.setScalar(0.6 + Math.sin(u * Math.PI) * 0.6);
    }
    if (prongs.current) prongs.current.position.y = 0.5 + m.hover * 0.08 + Math.max(0, pressBounce(m.pressAge)) * 0.1;
  });

  return (
    <IconMotion seed={88}>
      <group position={[-0.1, 0.2, 0]} rotation={[0.2, -0.55, -0.12]} scale={1.22}>
        {/* body */}
        <RoundedBox args={[0.82, 0.78, 0.62]} radius={0.18} smoothness={6} position={[0, 0.08, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* grip ribs on the front */}
        {[-0.2, 0, 0.2].map((x, i) => (
          <RoundedBox key={i} args={[0.08, 0.42, 0.04]} radius={0.02} smoothness={3} position={[x, 0.06, 0.32]}>
            <meshPhysicalMaterial color="#E4E2DC" roughness={0.4} clearcoat={0.5} />
          </RoundedBox>
        ))}
        {/* glowing LED collar where the body meets the strain relief */}
        <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.06, 20, 64]} />
          <meshStandardMaterial ref={collar} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* strain relief */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.15, 0.1, 0.26, 32]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* cable */}
        <mesh geometry={cable}>
          <meshPhysicalMaterial color="#2A2E2A" roughness={0.45} clearcoat={0.4} />
        </mesh>
        {/* rounded cable end */}
        <mesh position={cable.parameters.path.getPointAt(1)}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshPhysicalMaterial color="#2A2E2A" roughness={0.45} clearcoat={0.4} />
        </mesh>
        <mesh ref={pulse}>
          <sphereGeometry args={[0.085, 20, 14]} />
          <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2.2} />
        </mesh>
        {/* prongs (metal) */}
        <group ref={prongs} position={[0, 0.5, 0]}>
          {[-0.17, 0.17].map((x, i) => (
            <RoundedBox key={i} args={[0.08, 0.44, 0.2]} radius={0.03} smoothness={3} position={[x, 0.18, 0]}>
              <meshStandardMaterial color="#E6E8EC" metalness={0.55} roughness={0.32} />
            </RoundedBox>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
