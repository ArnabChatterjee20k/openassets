import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Patch Bay',
  description: 'Project card for Patchwell Patch Bay (33 ad-platform connections): a glossy switchboard plug with a glowing contact ring, lit by beams seeded from the project name.',
  tags: ['card', 'integrations', 'plug', 'platforms', 'project'],
};

export const schema = beamSchema({ name: 'Patch Bay' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'tiktok-shop': { name: 'TikTok Shop line' },
  'ctv-lines': { name: 'CTV Lines' },
  'switchboard-orange': { lightMode: 'custom', light: '#D96C3D' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEE8" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3EF" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function PatchBay(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const plug = useRef<THREE.Group>(null);

  // Handle: a lathed barrel with a waist and a tapered strain relief (axis = y, tip down).
  const handle = useMemo(() => {
    const prof: [number, number][] = [
      [0.0, 0.0], [0.27, 0.0], [0.31, 0.04], [0.33, 0.14], [0.31, 0.32], [0.28, 0.44], [0.3, 0.58], [0.32, 0.7], [0.3, 0.8], [0.22, 0.9], [0.14, 1.0], [0.11, 1.08], [0.0, 1.08],
    ];
    return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 72);
  }, []);
  const cord = useMemo(() => {
    const c = new THREE.CubicBezierCurve3(new THREE.Vector3(0, 1.04, 0), new THREE.Vector3(0, 1.35, 0), new THREE.Vector3(0.15, 1.45, -0.3), new THREE.Vector3(0.75, 1.25, -0.8));
    return new THREE.TubeGeometry(c, 48, 0.085, 16, false);
  }, []);

  // Idle: the contact ring breathes and gives a quick "patched" double-pulse;
  // hover seats the plug a touch deeper; click jolts it in and flashes the ring.
  useLoop((m) => {
    const kick = pressBounce(m.pressAge);
    const patched = Math.max(blink(m.t, 0.3, 0.04), blink(m.t, 0.38, 0.04) * 0.8);
    if (ring.current) ring.current.emissiveIntensity = 1.4 + (wave(m.t, 1) * 0.5 + 0.5) * 0.6 + patched * 1.6 + m.hover * 0.8 + Math.abs(kick) * 2.5;
    if (plug.current) plug.current.position.y = -patched * 0.05 - m.hover * 0.06 + kick * 0.12;
  });

  return (
    <IconMotion seed={23}>
      <group rotation={[0.25, 0.4, 0.42]} position={[0.05, -0.26, 0]} scale={1.05}>
        <group ref={plug}>
          {/* handle + cord */}
          <mesh geometry={handle}>
            <Shell finish={p.finish} />
          </mesh>
          <mesh geometry={cord}>
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </mesh>
          {/* glowing band around the handle's waist */}
          <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.285, 0.04, 16, 64]} />
            <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          {/* collar */}
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.08, 48]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
          </mesh>
          {/* sleeve shaft */}
          <mesh position={[0, -0.33, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.5, 40]} />
            <meshStandardMaterial color="#D6D9DF" metalness={1} roughness={0.2} />
          </mesh>
          {/* glowing insulator ring between sleeve and tip */}
          <mesh position={[0, -0.62, 0]}>
            <cylinderGeometry args={[0.125, 0.125, 0.08, 40]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} roughness={0.3} />
          </mesh>
          {/* tip */}
          <mesh position={[0, -0.7, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.08, 32]} />
            <meshStandardMaterial color="#D6D9DF" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.77, 0]}>
            <sphereGeometry args={[0.105, 32, 16]} />
            <meshStandardMaterial color="#D6D9DF" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
