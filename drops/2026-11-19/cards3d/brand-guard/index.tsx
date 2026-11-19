import { useMemo, useRef } from 'react';
import { Shape } from 'three';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Brand Guard',
  description: 'Project card for Crossfade Brand Guard, the brand-safety layer that checks every ad before it ships: a glossy white shield with a glowing gem at its heart, lit by beams seeded from the project name.',
  tags: ['card', 'brand safety', 'shield', 'approvals', 'project'],
};

export const schema = beamSchema({ name: 'Brand Guard' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'safe-mode': { name: 'Safe Mode' },
  'approval-gate': { name: 'Approval Gate' },
  coral: { lightMode: 'custom', light: '#FF8E5E' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** Classic heater shield outline, scaled by k, centred on the origin. */
function shieldShape(k: number) {
  const s = new Shape();
  s.moveTo(0, 0.95 * k);
  s.bezierCurveTo(0.3 * k, 0.78 * k, 0.55 * k, 0.74 * k, 0.8 * k, 0.76 * k);
  s.bezierCurveTo(0.82 * k, 0.1 * k, 0.62 * k, -0.6 * k, 0, -1.0 * k);
  s.bezierCurveTo(-0.62 * k, -0.6 * k, -0.82 * k, 0.1 * k, -0.8 * k, 0.76 * k);
  s.bezierCurveTo(-0.55 * k, 0.74 * k, -0.3 * k, 0.78 * k, 0, 0.95 * k);
  return s;
}

export default function BrandGuard(p: P) {
  const light = beamLight(p).color;
  const outer = useMemo(() => shieldShape(1), []);
  const inner = useMemo(() => shieldShape(0.72), []);
  const gem = useRef<THREE.Group>(null);
  const gemMat = useRef<THREE.MeshStandardMaterial>(null);
  const scan = useRef<THREE.Mesh>(null);
  const scanMat = useRef<THREE.MeshBasicMaterial>(null);

  // Idle: the gem turns and breathes, a scan line sweeps the face once per
  // loop (every ad checked). Hover brightens; a click flashes "approved".
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    if (gem.current) {
      gem.current.rotation.y = cycle(m.t, 1) * Math.PI;
      const s = 1 + wave(m.t, 2) * 0.04 + press * 0.3;
      gem.current.scale.set(s, s, s);
    }
    if (gemMat.current) gemMat.current.emissiveIntensity = 1.8 + blink(m.t, 0.5, 0.06) * 1.6 + m.hover * 1 + press * 4;
    const u = cycle(m.t, 1, 0.5);
    if (scan.current) scan.current.position.y = 0.62 - u * 1.3;
    if (scanMat.current) scanMat.current.opacity = Math.sin(u * Math.PI) * (0.85 + m.hover * 0.15);
  });

  const bevel = { depth: 0.16, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 8, curveSegments: 48 };
  const innerBevel = { depth: 0.06, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 6, curveSegments: 48 };

  return (
    <IconMotion seed={17}>
      <group rotation={[0.05, -0.35, 0]} position={[0, -0.15, 0]} scale={1.12}>
        <mesh position={[0, 0, -0.08]}>
          <extrudeGeometry args={[outer, bevel]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* raised inner plate */}
        <mesh position={[0, 0.02, 0.13]}>
          <extrudeGeometry args={[inner, innerBevel]} />
          <Shell finish={p.finish} color="#E9E6E3" />
        </mesh>
        {/* scan line across the face, clipped visually by its short width */}
        <mesh ref={scan} position={[0, 0.3, 0.27]}>
          <planeGeometry args={[0.95, 0.04]} />
          <meshBasicMaterial ref={scanMat} color={light} transparent opacity={0.4} toneMapped={false} />
        </mesh>
        {/* glowing gem */}
        <group ref={gem} position={[0, 0.02, 0.36]}>
          <mesh scale={[1, 1.25, 0.6]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial ref={gemMat} color={light} emissive={light} emissiveIntensity={2} roughness={0.15} metalness={0.1} flatShading />
          </mesh>
        </group>
        {/* gem setting */}
        <mesh position={[0, 0.02, 0.26]}>
          <torusGeometry args={[0.36, 0.04, 16, 48]} />
          <Shell finish={p.finish} color="#FBFAF9" />
        </mesh>
      </group>
    </IconMotion>
  );
}
