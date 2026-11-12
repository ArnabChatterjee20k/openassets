import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Scout',
  description: 'Project card for Junction Audience Scout, which finds lookalike buyers on every platform before launch: a glossy pair of binoculars whose objective lenses glow in the card light.',
  tags: ['card', 'audiences', 'targeting', 'binoculars', 'project'],
};

export const schema = beamSchema({ name: 'Audience Scout' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lookalikes: { name: 'Lookalikes' },
  'intent radar': { name: 'Intent Radar' },
  citrus: { lightMode: 'custom', light: '#FF7A00' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const Grip = () => <meshPhysicalMaterial color="#2A2E2A" roughness={0.55} clearcoat={0.3} />;

export default function AudienceScout(p: P) {
  const light = beamLight(p).color;
  const rings = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lenses = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const wheel = useRef<THREE.Mesh>(null);

  // Idle: lenses breathe, a glint sweeps each lens once per loop, the focus wheel
  // turns back and forth. Hover brightens; click flashes like a lens flare.
  useLoop((m) => {
    const press = Math.min(1, Math.abs(pressBounce(m.pressAge)) * 2.5);
    [0, 1].forEach((i) => {
      const r = rings.current[i];
      if (r) r.emissiveIntensity = 1.3 + (0.5 + 0.5 * wave(m.t, 2, i * 0.15)) * 0.6 + m.hover * 0.9 + press * 1.5;
      const l = lenses.current[i];
      if (l) l.emissiveIntensity = 0.6 + blink(m.t, 0.35 + i * 0.08, 0.05) * 0.9 + m.hover * 0.3 + press * 1.2;
    });
    if (wheel.current) wheel.current.rotation.x = wave(m.t, 1) * 1.2;
  });

  return (
    <IconMotion seed={71}>
      <group position={[0, -0.05, 0]} rotation={[0.2, -0.42, 0.04]} scale={1.45}>
        {[-1, 1].map((s, i) => (
          <group key={i} position={[s * 0.42, 0, 0]}>
            {/* barrel: objective tube (front) + body + eyepiece (back) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.18]}>
              <cylinderGeometry args={[0.34, 0.31, 0.62, 48]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.18]}>
              <cylinderGeometry args={[0.345, 0.345, 0.24, 48]} />
              <Grip />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.28]}>
              <cylinderGeometry args={[0.26, 0.3, 0.32, 40]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.5]}>
              <cylinderGeometry args={[0.2, 0.22, 0.16, 36]} />
              <Grip />
            </mesh>
            {/* glowing objective ring + tinted lens */}
            <mesh position={[0, 0, 0.5]}>
              <torusGeometry args={[0.3, 0.045, 20, 64]} />
              <meshStandardMaterial ref={(el) => void (rings.current[i] = el)} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.47]} scale={[1, 1, 0.3]}>
              <sphereGeometry args={[0.27, 40, 24]} />
              <meshPhysicalMaterial ref={(el) => void (lenses.current[i] = el)} color="#1A2230" emissive={light} emissiveIntensity={0.35} roughness={0.05} clearcoat={1} clearcoatRoughness={0.02} />
            </mesh>
            {/* specular catch-light on the glass */}
            <mesh position={[-0.09, 0.1, 0.56]} scale={[1, 0.6, 1]}>
              <circleGeometry args={[0.055, 20]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.75} />
            </mesh>
          </group>
        ))}
        {/* hinge bridge and focus wheel */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, -0.05]}>
          <cylinderGeometry args={[0.11, 0.11, 0.7, 32]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0.06, 0.12]} scale={[0.52, 0.18, 0.4]}>
          <boxGeometry args={[1, 1, 1]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh ref={wheel} position={[0, 0.2, -0.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.16, 24]} />
          <Grip />
        </mesh>
      </group>
    </IconMotion>
  );
}
