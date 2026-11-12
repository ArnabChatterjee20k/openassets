import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Route Planner',
  description: 'Project card for Junction Route Planner, which picks the platforms each brief should run on: a glossy white signpost with a glowing arrow blade, lit by beams seeded from the project name.',
  tags: ['card', 'routes', 'signpost', 'planner', 'project'],
};

export const schema = beamSchema({ name: 'Route Planner' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'channel mix': { name: 'Channel Mix' },
  'geo targets': { name: 'Geo Targets' },
  citrus: { lightMode: 'custom', light: '#FF7A00' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** A sign blade with a pointed end, extruded and bevelled. */
function useBlade(len: number) {
  return useMemo(() => {
    const h = 0.17;
    const s = new THREE.Shape();
    s.moveTo(0, -h);
    s.lineTo(len - 0.2, -h);
    s.lineTo(len, 0);
    s.lineTo(len - 0.2, h);
    s.lineTo(0, h);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4 });
    g.translate(0, 0, -0.04);
    return g;
  }, [len]);
}

export default function RoutePlanner(p: P) {
  const light = beamLight(p).color;
  const upper = useBlade(1.05);
  const lower = useBlade(0.85);
  const stripe = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.12, -0.045);
    s.lineTo(0.8, -0.045);
    s.lineTo(0.86, 0);
    s.lineTo(0.8, 0.045);
    s.lineTo(0.12, 0.045);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const bullet = useRef<THREE.MeshStandardMaterial>(null);
  const bladeA = useRef<THREE.Group>(null);
  const bladeB = useRef<THREE.Group>(null);

  // Idle: the arrow stripe breathes, the blades sway like a sign in the wind and the
  // top bullet blinks once per loop. Hover brightens; click spins the lower blade.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (glow.current) glow.current.emissiveIntensity = 1.3 + (0.5 + 0.5 * wave(m.t, 1)) * 0.8 + m.hover * 0.9;
    if (bullet.current) bullet.current.emissiveIntensity = 0.9 + blink(m.t, 0.5, 0.06) * 2 + m.hover;
    if (bladeA.current) bladeA.current.rotation.y = wave(m.t, 1, 0.1) * 0.08;
    if (bladeB.current) bladeB.current.rotation.y = Math.PI + wave(m.t, 1, 0.4) * 0.1 + press * 0.9;
  });

  return (
    <IconMotion seed={23} sway={0.1}>
      <group position={[0.05, -0.02, 0]} rotation={[0.08, -0.45, 0]} scale={1.3}>
        {/* post + base */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 1.9, 32]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, -1.08, 0]}>
          <cylinderGeometry args={[0.26, 0.32, 0.08, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing line bullet on top */}
        <mesh position={[0, 0.86, 0]}>
          <sphereGeometry args={[0.13, 32, 24]} />
          <meshStandardMaterial ref={bullet} color={light} emissive={light} emissiveIntensity={1} roughness={0.3} />
        </mesh>
        {/* upper blade, pointing right, with the glowing route stripe */}
        <group ref={bladeA} position={[0, 0.48, 0]}>
          <mesh geometry={upper} position={[-0.12, 0, 0]}>
            <Shell finish={p.finish} />
          </mesh>
          <mesh geometry={stripe} position={[-0.08, 0, 0.081]}>
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
        {/* lower blade, pointing left */}
        <group ref={bladeB} position={[0, -0.02, 0]}>
          <mesh geometry={lower} position={[-0.12, 0, 0]}>
            <Shell finish={p.finish} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
