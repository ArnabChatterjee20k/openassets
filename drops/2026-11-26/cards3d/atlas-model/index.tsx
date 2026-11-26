import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Atlas Model',
  description: "Project card for Atlas, Ternary's discovery model: a glossy white atom with three orbits, travelling electrons and a glowing nucleus, lit by beams seeded from the name.",
  tags: ['card', 'atom', 'ai model', 'discovery', 'project'],
};

export const schema = beamSchema({ name: 'Atlas Model' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  candidates: { name: 'Candidate Queue' },
  'atlas-2': { name: 'Atlas 2' },
  brass: { lightMode: 'custom', light: '#E9B44C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', beams: 0.6 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEE8" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F2EE" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const ORBITS: [number, number][] = [
  [Math.PI / 2, 0],
  [Math.PI / 2 + 1.05, 0.5],
  [Math.PI / 2 - 1.05, -0.5],
];

export default function AtlasModel(p: P) {
  const light = beamLight(p).color;
  const nucleus = useRef<THREE.MeshStandardMaterial>(null);
  const core = useRef<THREE.Mesh>(null);
  const electrons = useRef<(THREE.Mesh | null)[]>([]);
  const R = 0.95;

  // Idle: electrons travel their orbits (1–2 laps per loop), the nucleus pulses; hover brightens; click flashes and swells it.
  useLoop((m) => {
    const flash = Math.abs(pressBounce(m.pressAge));
    if (nucleus.current) nucleus.current.emissiveIntensity = 1.2 + (0.5 + 0.5 * wave(m.t, 2)) * 0.8 + m.hover * 1 + flash * 3;
    if (core.current) core.current.scale.setScalar(1 + flash * 0.25 + wave(m.t, 2) * 0.03);
    electrons.current.forEach((e, i) => {
      if (!e) return;
      const a = cycle(m.t, i === 0 ? 2 : 1, i / 3) * Math.PI * 2;
      e.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    });
  });

  return (
    <IconMotion seed={58}>
      <group position={[0, -0.22, 0]} rotation={[0.2, 0.3, 0]} scale={1.15}>
        {ORBITS.map(([rx, ry], i) => (
          <group key={i} rotation={[rx, ry, 0]}>
            <mesh>
              <torusGeometry args={[R, 0.05, 16, 120]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh ref={(el) => void (electrons.current[i] = el)} position={[R, 0, 0]}>
              <sphereGeometry args={[0.085, 24, 24]} />
              <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.4} />
            </mesh>
          </group>
        ))}
        {/* nucleus: a white shell cupping a glowing core */}
        <mesh ref={core}>
          <sphereGeometry args={[0.26, 48, 48]} />
          <meshStandardMaterial ref={nucleus} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {[[-0.2, 0.14, 0.12], [0.2, -0.12, 0.14], [0.05, 0.2, -0.16], [-0.1, -0.2, -0.12]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.14, 32, 32]} />
            <Shell finish={p.finish} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
