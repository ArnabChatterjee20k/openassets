import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Gem Shop',
  description:
    'Project card for the Ardor Gem Shop: a glossy white ring with a glowing brilliant-cut gem that turns and sparkles, lit by beams seeded from the project name.',
  tags: ['card', 'store', 'gems', 'ring', 'project'],
};

export const schema = beamSchema({ name: 'Gem Shop' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'proposal-pack': { name: 'Proposal Pack' },
  'valentine-bundle': { name: 'Valentine Bundle' },
  cherry: { lightMode: 'custom', light: '#E3173E' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function GemShop(p: P) {
  const light = beamLight(p).color;
  const gem = useRef<THREE.Mesh>(null);
  const gemMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const glint = useRef<THREE.Mesh>(null);

  // Brilliant cut: table, crown and pavilion as a faceted lathe (8 sides, flat shaded).
  const cut = useMemo(() => {
    const prof: [number, number][] = [[0, -0.34], [0.3, -0.02], [0.32, 0.0], [0.32, 0.04], [0.2, 0.16], [0, 0.16]];
    const g = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 8);
    return g.toNonIndexed();
  }, []);

  // Idle: the gem turns and throws a glint once per loop. Hover spins it faster
  // and brightens it; a click pops it up out of the setting with a flash.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const g = blink(m.t, 0.35, 0.05);
    if (gem.current) {
      gem.current.rotation.y = cycle(m.t, m.hover > 0.5 ? 2 : 1) * (Math.PI / 4) * 2;
      gem.current.position.y = 0.66 + Math.max(0, press) * 0.12;
    }
    if (gemMat.current) gemMat.current.emissiveIntensity = 0.35 + (wave(m.t, 2) * 0.5 + 0.5) * 0.3 + g * 1.2 + m.hover * 0.6 + Math.abs(press) * 2;
    if (glint.current) {
      const s = Math.max(0.001, g * 1.2 + Math.abs(press));
      glint.current.scale.set(s, s, s);
    }
  });

  return (
    <IconMotion seed={31}>
      <group position={[0, -0.38, 0]} rotation={[0.18, -0.5, 0.08]} scale={1.3}>
        {/* band, standing upright */}
        <mesh>
          <torusGeometry args={[0.52, 0.1, 32, 96]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* setting: a little cup with four prongs */}
        <mesh position={[0, 0.56, 0]}>
          <cylinderGeometry args={[0.2, 0.12, 0.14, 32]} />
          <Shell finish={p.finish} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.24, 0.7, Math.sin(a) * 0.24]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]}>
              <capsuleGeometry args={[0.026, 0.16, 6, 12]} />
              <Shell finish={p.finish} />
            </mesh>
          );
        })}
        {/* the gem */}
        <mesh ref={gem} geometry={cut} position={[0, 0.66, 0]} scale={[1.15, 1.15, 1.15]}>
          <meshPhysicalMaterial ref={gemMat} color={light} emissive={light} emissiveIntensity={1.1} roughness={0.08} metalness={0.1} clearcoat={1} flatShading />
        </mesh>
        {/* glint star */}
        <mesh ref={glint} position={[0.2, 0.92, 0.25]}>
          <octahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
      </group>
    </IconMotion>
  );
}
