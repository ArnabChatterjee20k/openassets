import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Brand Guard',
  description: 'Project card for Junction Brand Guard, which checks every ad and placement against your brand rules before it departs: a glossy white shield with a glowing check and a scan ring.',
  tags: ['card', 'brand safety', 'approvals', 'shield', 'project'],
};

export const schema = beamSchema({ name: 'Brand Guard' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'safe placements': { name: 'Safe Placements' },
  'policy check': { name: 'Policy Check' },
  lime: { lightMode: 'custom', light: '#2BB24C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** Heater shield outline, scaled by `k`. */
function shieldShape(k: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0.9 * k);
  s.bezierCurveTo(0.3 * k, 0.78 * k, 0.55 * k, 0.78 * k, 0.72 * k, 0.8 * k);
  s.bezierCurveTo(0.74 * k, 0.2 * k, 0.6 * k, -0.5 * k, 0, -0.95 * k);
  s.bezierCurveTo(-0.6 * k, -0.5 * k, -0.74 * k, 0.2 * k, -0.72 * k, 0.8 * k);
  s.bezierCurveTo(-0.55 * k, 0.78 * k, -0.3 * k, 0.78 * k, 0, 0.9 * k);
  return s;
}

export default function BrandGuard(p: P) {
  const light = beamLight(p).color;
  const outer = useMemo(() => new THREE.ExtrudeGeometry(shieldShape(1), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 6, curveSegments: 48 }), []);
  const inner = useMemo(() => new THREE.ExtrudeGeometry(shieldShape(0.78), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 48 }), []);
  const check = useRef<THREE.MeshStandardMaterial>(null);
  const check2 = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const gem = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the check breathes, a scan ring expands off the shield twice a loop,
  // the top gem blinks. Hover brightens everything; click stamps the check.
  useLoop((m) => {
    const press = Math.min(1, Math.abs(pressBounce(m.pressAge)) * 2.5);
    const glow = 1.7 + (0.5 + 0.5 * wave(m.t, 2)) * 0.8 + m.hover * 0.8 + press * 2;
    if (check.current) check.current.emissiveIntensity = glow;
    if (check2.current) check2.current.emissiveIntensity = glow;
    const u = cycle(m.t, 2);
    if (ring.current) ring.current.scale.setScalar(0.75 + u * 0.55);
    if (ringMat.current) ringMat.current.opacity = (1 - u) * (u > 0.02 ? 0.7 : 0) * (0.6 + m.hover * 0.4);
    if (gem.current) gem.current.emissiveIntensity = 0.8 + blink(m.t, 0.62, 0.05) * 2 + press;
  });

  return (
    <IconMotion seed={33}>
      <group position={[0, -0.12, 0]} rotation={[0.08, -0.42, 0.02]} scale={1.12}>
        <mesh geometry={outer} position={[0, 0, -0.13]}>
          <Shell finish={p.finish} />
        </mesh>
        {/* recessed inner panel, slightly warmer so the shield reads as two pieces */}
        <mesh geometry={inner} position={[0, 0.02, 0.1]}>
          <meshPhysicalMaterial color={p.finish === 'chrome' ? '#BFC5CE' : '#ECEAE4'} roughness={p.finish === 'matte' ? 0.7 : 0.3} metalness={p.finish === 'chrome' ? 1 : 0} clearcoat={0.6} />
        </mesh>
        {/* glowing check: two rounded bars */}
        <group position={[-0.04, -0.02, 0.24]}>
          <RoundedBox args={[0.17, 0.44, 0.1]} radius={0.05} smoothness={4} position={[-0.17, -0.02, 0]} rotation={[0, 0, Math.PI / 4]}>
            <meshStandardMaterial ref={check} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[0.17, 0.8, 0.1]} radius={0.05} smoothness={4} position={[0.14, 0.13, 0]} rotation={[0, 0, -Math.PI / 5.2]}>
            <meshStandardMaterial ref={check2} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} />
          </RoundedBox>
        </group>
        {/* scan ring */}
        <mesh ref={ring} position={[0, -0.02, 0.2]}>
          <torusGeometry args={[0.62, 0.012, 12, 96]} />
          <meshStandardMaterial ref={ringMat} color={light} emissive={light} emissiveIntensity={2} transparent opacity={0} />
        </mesh>
        {/* gem at the top */}
        <mesh position={[0, 0.68, 0.2]} rotation={[0.3, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial ref={gem} color={light} emissive={light} emissiveIntensity={0.8} roughness={0.2} />
        </mesh>
      </group>
    </IconMotion>
  );
}
