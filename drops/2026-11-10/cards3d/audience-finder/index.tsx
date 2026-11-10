import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Finder',
  description: 'Project card for Formwork Audience Finder, the targeting engine: a glossy white magnifying glass with a glowing lens that scans and blinks on a match. Lit by beams seeded from the project name.',
  tags: ['card', 'audience', 'targeting', 'magnifier', 'project'],
};

export const schema = beamSchema({ name: 'Audience Finder' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lookalikes: { name: 'Lookalikes' },
  'signal-scout': { name: 'Signal Scout' },
  'chrome-yellow': { lightMode: 'custom', light: '#F2B90F' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', beams: 0.6 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2EE' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AudienceFinder(p: P) {
  const light = beamLight(p).color;
  const scan = useRef<THREE.Group>(null);
  const lens = useRef<THREE.MeshPhysicalMaterial>(null);
  const dot = useRef<THREE.Mesh>(null);

  // Idle: the glass scans in a slow figure-eight; the lens blinks brighter when
  // it "finds" an audience. Hover brightens the lens, a click pops the match dot.
  useLoop((m) => {
    const kick = Math.abs(pressBounce(m.pressAge));
    const found = Math.max(blink(m.t, 0.25, 0.05), blink(m.t, 0.75, 0.05));
    if (scan.current) {
      scan.current.position.x = wave(m.t, 1) * 0.12;
      scan.current.position.y = wave(m.t, 2) * 0.05;
    }
    if (lens.current) lens.current.emissiveIntensity = 0.3 + found * 1.2 + m.hover * 0.6 + kick * 2;
    if (dot.current) dot.current.scale.setScalar(0.6 + found * 0.6 + kick * 0.8 + m.hover * 0.2);
  });

  return (
    <IconMotion seed={88}>
      <group ref={scan}>
        <group position={[-0.15, 0.05, 0]} rotation={[0.2, -0.35, 0.62]} scale={1.12}>
          {/* rim */}
          <mesh>
            <torusGeometry args={[0.58, 0.12, 32, 96]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* glowing lens */}
          <mesh scale={[1, 1, 0.16]}>
            <sphereGeometry args={[0.52, 48, 32]} />
            <meshPhysicalMaterial ref={lens} color={light} emissive={light} emissiveIntensity={0.35} roughness={0.04} transmission={0.75} thickness={0.5} ior={1.45} clearcoat={1} />
          </mesh>
          {/* glowing inner ring */}
          <mesh position={[0, 0, 0.04]}>
            <torusGeometry args={[0.47, 0.03, 16, 96]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} roughness={0.3} />
          </mesh>
          {/* match dot inside the lens */}
          <mesh ref={dot} position={[0.12, 0.1, 0.12]}>
            <sphereGeometry args={[0.07, 24, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
          </mesh>
          {/* collar + handle */}
          <mesh position={[0, -0.78, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.22, 32]} />
            <Shell finish={p.finish} color="#E6E3DC" />
          </mesh>
          <mesh position={[0, -1.22, 0]}>
            <capsuleGeometry args={[0.12, 0.62, 8, 32]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
