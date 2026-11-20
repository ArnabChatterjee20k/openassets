import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Split Tests',
  description: 'Feature card for Inkrun Split Tests: a glossy white lab flask full of glowing liquid, bubbles rising out of the neck, lit by beams seeded from the feature name.',
  tags: ['card', 'experiments', 'ab test', 'flask', 'feature'],
};

export const schema = beamSchema({ name: 'Split Tests' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'creative-lab': { name: 'Creative Lab' },
  'hook-tester': { name: 'Hook Tester' },
  'hot-pink': { lightMode: 'custom', light: '#FF2E88' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEF4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F6F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const BUBBLES = [
  { x: -0.04, z: 0.02, r: 0.085, ph: 0.15 },
  { x: 0.06, z: -0.02, r: 0.06, ph: 0.48 },
  { x: 0.0, z: 0.03, r: 0.07, ph: 0.81 },
];

export default function SplitTests(p: P) {
  const light = beamLight(p).color;
  const liquid = useRef<THREE.MeshStandardMaterial>(null);
  const bubbles = useRef<(THREE.Mesh | null)[]>([]);
  const surface = useRef<THREE.Mesh>(null);

  // Erlenmeyer profile: wide flat base, conical shoulder, straight neck, rolled lip.
  const glass = useMemo(() => {
    const pts = [
      [0.0, 0],
      [0.6, 0],
      [0.68, 0.04],
      [0.7, 0.1],
      [0.62, 0.3],
      [0.24, 1.0],
      [0.2, 1.08],
      [0.2, 1.42],
      [0.26, 1.46],
      [0.26, 1.52],
      [0.16, 1.52],
      [0.16, 1.1],
      [0.0, 1.1],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  // The glowing fill: the lower body of the flask, slightly proud of the shell so it reads through.
  const fill = useMemo(() => {
    const pts = [
      [0.0, 0.05],
      [0.62, 0.05],
      [0.705, 0.1],
      [0.635, 0.3],
      [0.43, 0.66],
      [0.0, 0.66],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 64);
  }, []);

  // Idle: liquid breathes, three bubbles cycle up out of the neck. Hover boils it
  // (brighter); a click pops an extra-bright flash.
  useLoop((m) => {
    const b = Math.abs(pressBounce(m.pressAge));
    if (liquid.current) liquid.current.emissiveIntensity = 1.1 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + m.hover * 0.8 + b * 1.8;
    if (surface.current) surface.current.position.y = 0.665 + wave(m.t, 4) * 0.01;
    BUBBLES.forEach((bb, i) => {
      const o = bubbles.current[i];
      if (!o) return;
      const u = cycle(m.t, 2, bb.ph);
      // Bubbles pop out of the neck and drift up, swelling then bursting.
      o.position.y = 1.5 + u * 0.62;
      o.position.x = bb.x + Math.sin(u * 7 + i * 2) * 0.06;
      const s = Math.sin(u * Math.PI) * (1 + m.hover * 0.4);
      o.scale.setScalar(0.001 + s);
    });
  });

  return (
    <IconMotion seed={61}>
      <group rotation={[0.16, -0.35, 0.06]} position={[0, -1.12, 0]} scale={1.2}>
        <mesh geometry={glass}>
          <Shell finish={p.finish} />
        </mesh>
        <mesh geometry={fill}>
          <meshStandardMaterial ref={liquid} color={light} emissive={light} emissiveIntensity={1.3} roughness={0.25} />
        </mesh>
        {/* liquid meniscus (visible through nothing, but catches the tilt) */}
        <mesh ref={surface} position={[0, 0.665, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.43, 48]} />
          <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.6} />
        </mesh>
        {/* measuring ticks on the shoulder */}
        {[0.78, 0.88].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[0.62 - (y - 0.3) * 0.54, 0.008, 8, 48, Math.PI * 0.45]} />
            <meshStandardMaterial color="#8A8496" />
          </mesh>
        ))}
        {BUBBLES.map((bb, i) => (
          <mesh key={i} ref={(o) => { bubbles.current[i] = o; }} position={[bb.x, 0.8, bb.z]}>
            <sphereGeometry args={[bb.r, 20, 14]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.4} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
