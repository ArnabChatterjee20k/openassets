import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Brand Safety',
  description: 'Feature card for Inkrun Brand Safety: a chunky glossy white shield with a glowing inlaid border that pulses as it checks every placement, lit by beams seeded from the feature name.',
  tags: ['card', 'brand safety', 'shield', 'security', 'feature'],
};

export const schema = beamSchema({ name: 'Brand Safety' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'policy-check': { name: 'Policy Check' },
  'fraud-filter': { name: 'Fraud Filter' },
  ultraviolet: { lightMode: 'custom', light: '#B026FF' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEF4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F6F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** Classic heater shield outline, scaled by k. */
function shieldShape(k: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0.78 * k);
  s.bezierCurveTo(0.22 * k, 0.66 * k, 0.48 * k, 0.62 * k, 0.66 * k, 0.62 * k);
  s.bezierCurveTo(0.66 * k, 0.1 * k, 0.5 * k, -0.48 * k, 0, -0.8 * k);
  s.bezierCurveTo(-0.5 * k, -0.48 * k, -0.66 * k, 0.1 * k, -0.66 * k, 0.62 * k);
  s.bezierCurveTo(-0.48 * k, 0.62 * k, -0.22 * k, 0.66 * k, 0, 0.78 * k);
  return s;
}

export default function BrandSafety(p: P) {
  const light = beamLight(p).color;
  const groove = useRef<THREE.MeshStandardMaterial>(null);
  const check = useRef<THREE.Group>(null);
  const checkMat = useRef<THREE.MeshStandardMaterial>(null);

  const geo = useMemo(() => {
    const opts = (depth: number, bevel: number) => ({ depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 48 });
    const outer = new THREE.ExtrudeGeometry(shieldShape(1), opts(0.22, 0.07));
    // Each layer stands proud of the one below: shell (front 0.18) → glowing inlay (0.23) → white centre (0.27).
    const glow = new THREE.ExtrudeGeometry(shieldShape(0.86), opts(0.3, 0.04));
    const inner = new THREE.ExtrudeGeometry(shieldShape(0.72), opts(0.32, 0.06));
    [outer, glow, inner].forEach((g) => g.translate(0, 0, -0.11));
    return { outer, glow, inner };
  }, []);

  // Idle: the inlay pulses twice per loop and a scan glints once; hover brightens,
  // a click pops the check mark forward.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    if (groove.current) groove.current.emissiveIntensity = 1.2 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + blink(m.t, 0.5, 0.06) * 1.4 + m.hover * 0.8 + Math.abs(b) * 1.6;
    if (check.current) {
      check.current.position.z = 0.3 + Math.abs(b) * 0.12;
      check.current.scale.setScalar(1 + Math.abs(b) * 0.25 + m.hover * 0.06);
    }
    if (checkMat.current) checkMat.current.emissiveIntensity = 0.9 + blink(m.t, 0.5, 0.06) * 1.2 + m.hover * 0.6;
  });

  return (
    <IconMotion seed={73}>
      <group rotation={[0.08, -0.36, 0]} position={[0, -0.3, 0]} scale={1.22}>
        <mesh geometry={geo.outer}>
          <Shell finish={p.finish} />
        </mesh>
        <mesh geometry={geo.glow}>
          <meshStandardMaterial ref={groove} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
        </mesh>
        <mesh geometry={geo.inner}>
          <Shell finish={p.finish} />
        </mesh>
        {/* raised check mark in the light colour */}
        <group ref={check} position={[0, -0.02, 0.3]}>
          <mesh position={[-0.13, -0.06, 0]} rotation={[0, 0, Math.PI / 4]}>
            <capsuleGeometry args={[0.055, 0.2, 8, 16]} />
            <meshStandardMaterial ref={checkMat} color={light} emissive={light} emissiveIntensity={1} />
          </mesh>
          <mesh position={[0.08, 0.06, 0]} rotation={[0, 0, -Math.PI / 5]}>
            <capsuleGeometry args={[0.055, 0.42, 8, 16]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
