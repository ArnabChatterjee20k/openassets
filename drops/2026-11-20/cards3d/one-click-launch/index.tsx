import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, clamp, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'One-Click Launch',
  description: 'Feature card for Inkrun One-Click Launch: a glossy white arcade push-button whose glowing cap clicks down and flashes, lit by beams seeded from the feature name.',
  tags: ['card', 'launch', 'button', 'publish', 'feature'],
};

export const schema = beamSchema({ name: 'One-Click Launch' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'go-live': { name: 'Go Live' },
  'bulk-publish': { name: 'Bulk Publish' },
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

/** One click per cycle: quick press, short hold, springy release. 0 = up, 1 = fully down. */
function clickDepth(u: number) {
  if (u < 0.48) return 0;
  if (u < 0.53) return (u - 0.48) / 0.05;
  if (u < 0.62) return 1;
  const k = clamp((u - 0.62) / 0.2);
  return Math.max(0, 1 - k) * Math.cos(k * Math.PI * 1.5) ** 2;
}

export default function OneClickLaunch(p: P) {
  const light = beamLight(p).color;
  const cap = useRef<THREE.Group>(null);
  const capMat = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);

  // Stepped housing: wide foot, waist, bezel collar.
  const housing = useMemo(() => {
    const pts = [
      [0.0, 0],
      [0.86, 0],
      [0.92, 0.04],
      [0.92, 0.14],
      [0.86, 0.2],
      [0.66, 0.24],
      [0.62, 0.3],
      [0.62, 0.42],
      [0.66, 0.46],
      [0.66, 0.52],
      [0.58, 0.56],
      [0.0, 0.56],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 72);
  }, []);
  // Domed button cap.
  const dome = useMemo(() => {
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0.5, 0.14)];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.cos(a) * 0.5, 0.14 + Math.sin(a) * 0.16));
    }
    return new THREE.LatheGeometry(pts, 72);
  }, []);

  // Idle: one decisive click per loop with a flash; the bezel ring breathes.
  // Hover lifts the glow; a click mashes it.
  useLoop((m) => {
    const d = Math.max(clickDepth(cycle(m.t, 1)), Math.abs(pressBounce(m.pressAge)));
    if (cap.current) cap.current.position.y = 0.5 - d * 0.12;
    if (capMat.current) capMat.current.emissiveIntensity = 0.4 + d * 1.6 + m.hover * 0.5;
    if (ring.current) ring.current.emissiveIntensity = 1.0 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + d * 1.2 + m.hover * 0.5;
  });

  return (
    <IconMotion seed={88}>
      <group rotation={[0.42, -0.3, 0]} position={[0, -0.62, 0]} scale={1.15}>
        <mesh geometry={housing}>
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing ring in the collar */}
        <mesh position={[0, 0.535, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.56, 0.03, 16, 72]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.2} />
        </mesh>
        {/* button cap */}
        <group ref={cap} position={[0, 0.5, 0]}>
          <mesh geometry={dome}>
            <meshStandardMaterial ref={capMat} color={light} emissive={light} emissiveIntensity={1} roughness={0.2} />
          </mesh>
          {/* a glossy highlight cap so it reads as a lit plastic dome, not a flat glow */}
          <mesh position={[0, 0.001, 0]} geometry={dome} scale={[1.01, 1.01, 1.01]}>
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} roughness={0.05} clearcoat={1} />
          </mesh>
        </group>
        {/* screws on the foot */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.78, 0.175, Math.sin(a) * 0.78]} rotation={[0.2 * Math.sin(a), 0, -0.2 * Math.cos(a)]}>
              <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
              <meshStandardMaterial color="#8A8496" metalness={0.6} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
    </IconMotion>
  );
}
