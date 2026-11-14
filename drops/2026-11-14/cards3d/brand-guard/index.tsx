import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Brand Guard',
  description:
    "Project card for Plotwell's brand-safety checks: a glossy white shield with a glowing gem that scans every placement before an ad ships, lit by beams seeded from the project name.",
  tags: ['card', 'brand safety', 'shield', 'compliance', 'project'],
};

export const schema = beamSchema({ name: 'Brand Guard' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'placement-check': { name: 'Placement Check' },
  'policy-review': { name: 'Policy Review' },
  highlighter: { lightMode: 'custom', light: '#FFDD00' },
  cyanotype: { lightMode: 'custom', light: '#7FB2FF', background: '#061634' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshPhysicalMaterial color="#E4E8EF" metalness={0.75} roughness={0.28} clearcoat={1} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** Classic heater-shield outline, flat top with soft shoulders and a pointed base. */
function shieldShape(s: number) {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.62 * s);
  sh.bezierCurveTo(0.22 * s, 0.5 * s, 0.42 * s, 0.5 * s, 0.56 * s, 0.52 * s);
  sh.bezierCurveTo(0.58 * s, 0.05 * s, 0.42 * s, -0.42 * s, 0, -0.68 * s);
  sh.bezierCurveTo(-0.42 * s, -0.42 * s, -0.58 * s, 0.05 * s, -0.56 * s, 0.52 * s);
  sh.bezierCurveTo(-0.42 * s, 0.5 * s, -0.22 * s, 0.5 * s, 0, 0.62 * s);
  return sh;
}

export default function BrandGuard(p: P) {
  const light = beamLight(p).color;
  const gem = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const body = useRef<THREE.Group>(null);

  const outer = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shieldShape(1), { depth: 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 6, curveSegments: 48 });
    g.translate(0, 0, -0.08);
    return g;
  }, []);
  const inner = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shieldShape(0.78), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 48 });
    g.translate(0, -0.01, 0.13);
    return g;
  }, []);

  // Idle: the gem breathes and a scan ring sweeps out once per beat pair; a glint
  // blink near the loop end. Hover brightens; click flashes and wobbles.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    const flash = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 3) * 3 : 0;
    if (body.current) body.current.rotation.y = wave(m.t, 1) * 0.18 + b * 0.25;
    if (gem.current) gem.current.emissiveIntensity = 0.8 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + blink(m.t, 0.82, 0.03) * 1.5 + m.hover * 1 + flash;
    const k = ((m.t / 2) % 1 + 1) % 1; // 2 s period → divides the 4 s loop
    if (ring.current) ring.current.scale.setScalar(0.6 + k * 1.1);
    if (ringMat.current) ringMat.current.opacity = (1 - k) * (0.35 + m.hover * 0.3 + flash * 0.2);
  });

  return (
    <IconMotion seed={23}>
      <group position={[0, -0.1, 0]} rotation={[0.12, -0.28, 0]} scale={1.5}>
        <group ref={body}>
          <mesh geometry={outer}>
            <Shell finish={p.finish} />
          </mesh>
          {/* raised inner plate, a touch cooler for a two-tone read */}
          <mesh geometry={inner}>
            <meshPhysicalMaterial color="#E6E9EF" roughness={p.finish === 'matte' ? 0.7 : 0.25} clearcoat={1} metalness={p.finish === 'chrome' ? 0.7 : 0} />
          </mesh>
          {/* gem bezel */}
          <mesh position={[0, 0.04, 0.2]}>
            <torusGeometry args={[0.24, 0.04, 16, 48]} />
            <meshPhysicalMaterial color="#C9CDD5" metalness={0.8} roughness={0.25} clearcoat={1} />
          </mesh>
          {/* the glowing gem */}
          <mesh position={[0, 0.04, 0.21]} scale={[1, 1, 0.5]}>
            <icosahedronGeometry args={[0.21, 0]} />
            <meshStandardMaterial ref={gem} color={light} emissive={light} emissiveIntensity={2} roughness={0.15} flatShading />
          </mesh>
          {/* scan ring */}
          <mesh ref={ring} position={[0, 0.04, 0.22]}>
            <ringGeometry args={[0.28, 0.305, 64]} />
            <meshBasicMaterial ref={ringMat} color={light} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
