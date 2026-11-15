import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Launch Everywhere',
  description: 'Feature card for Firebrand Launch Everywhere: a glossy white megaphone with a glowing bell rim that sends rings out to 34 platforms.',
  tags: ['card', 'launch', 'megaphone', 'channels', 'feature'],
};

export const schema = beamSchema({ name: 'Launch Everywhere' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ctv-launch': { name: 'CTV Launch' },
  'retail-media': { name: 'Retail Media' },
  hotpink: { lightMode: 'custom', light: '#FF2E63' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" side={THREE.DoubleSide} />;
  return <meshPhysicalMaterial color="#F5F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
}

export default function LaunchEverywhere(p: P) {
  const light = beamLight(p).color;
  const rim = useRef<THREE.MeshStandardMaterial>(null);
  const horn = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);

  // Bell: a flared horn with wall thickness, lathed along y then laid on its side.
  const bell = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      pts.push(new THREE.Vector2(0.16 + Math.pow(u, 1.6) * 0.5, u * 1.1));
    }
    for (let i = 24; i >= 0; i--) {
      const u = i / 24;
      pts.push(new THREE.Vector2(0.11 + Math.pow(u, 1.6) * 0.47, u * 1.1 - 0.02));
    }
    return new THREE.LatheGeometry(pts, 72);
  }, []);

  // Idle: rings pulse out of the bell, the rim breathes and the horn gives a little kick on each pulse.
  // Hover brightens; a click recoils the horn and flashes the rim.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (rim.current) rim.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.9 + m.hover * 1 + Math.abs(press) * 2.5;
    if (horn.current) horn.current.position.x = -Math.max(0, wave(m.t, 2, 0.1)) * 0.03 - press * 0.08;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const u = cycle(m.t, 2, i / 3);
      r.scale.setScalar(0.7 + u * 0.9);
      r.position.x = 1.2 + u * 0.7;
      (r.material as THREE.MeshStandardMaterial).opacity = (1 - u) * (0.75 + m.hover * 0.25);
    });
  });

  return (
    <IconMotion seed={88}>
      <group rotation={[0.15, 0.3, 0.28]} position={[-0.5, -0.15, 0]} scale={1}>
        <group ref={horn}>
          {/* bell, mouth facing +x */}
          <mesh geometry={bell} rotation={[0, 0, -Math.PI / 2]} position={[0.05, 0, 0]}>
            <Shell finish={p.finish} />
          </mesh>
          {/* glowing rim at the mouth */}
          <mesh position={[1.14, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.64, 0.045, 20, 96]} />
            <meshStandardMaterial ref={rim} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          {/* rear driver housing */}
          <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.36, 48]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[-0.31, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <sphereGeometry args={[0.24, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* pistol grip + trigger */}
          <mesh position={[-0.05, -0.36, 0]} rotation={[0, 0, -0.18]}>
            <capsuleGeometry args={[0.1, 0.36, 8, 24]} />
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </mesh>
          <mesh position={[0.1, -0.24, 0]} rotation={[0, 0, -0.5]}>
            <capsuleGeometry args={[0.035, 0.12, 6, 12]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.8} />
          </mesh>
        </group>
        {/* sound rings */}
        {Array.from({ length: 3 }, (_, i) => (
          <mesh key={i} ref={(el) => void (rings.current[i] = el)} rotation={[0, Math.PI / 2, 0]} position={[1.3, 0, 0]}>
            <torusGeometry args={[0.6, 0.018, 12, 96]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.8} transparent opacity={0.6} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
