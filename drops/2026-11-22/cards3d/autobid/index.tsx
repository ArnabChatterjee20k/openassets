import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Autobid',
  description: 'Feature card for Folio Autobid: a white rotary bid dial whose glowing indicator ring sweeps as the agent tunes bids, lit by beams seeded from the feature name.',
  tags: ['card', 'bidding', 'dial', 'automation', 'feature'],
};

export const schema = beamSchema({ name: 'Autobid' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'smart-pacing': { name: 'Smart Pacing' },
  'bid-rules': { name: 'Bid Rules' },
  'swiss-red': { lightMode: 'custom', light: '#E3000F' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F5F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const TICKS = 24;

export default function Autobid(p: P) {
  const light = beamLight(p).color;
  const knob = useRef<THREE.Group>(null);
  const arc = useRef<THREE.Mesh>(null);
  const arcMat = useRef<THREE.MeshStandardMaterial>(null);
  const ticks = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Idle: the knob turns up and back (the agent nudging a bid), the glowing arc
  // follows it and the ticks it passes light up. Hover brightens; a click spins it.
  useLoop((m) => {
    const turn = 0.42 + (wave(m.t, 1, -0.25) * 0.5 + 0.5) * 0.4 + pressBounce(m.pressAge) * 0.25; // fraction of the 270° scale
    if (knob.current) knob.current.rotation.z = -turn * Math.PI * 1.5;
    const frac = Math.max(0.04, turn);
    if (arc.current) {
      // Arc spans from the scale's zero (225°) clockwise to the indicator.
      const len = frac * Math.PI * 1.5;
      arc.current.geometry.dispose();
      arc.current.geometry = new THREE.TorusGeometry(0.86, 0.035, 12, 64, len);
      arc.current.rotation.z = Math.PI * 1.25 - len;
    }
    if (arcMat.current) arcMat.current.emissiveIntensity = 1.6 + m.hover * 1.2;
    ticks.current.forEach((t, i) => {
      if (!t) return;
      const on = i / (TICKS - 1) <= frac ? 1 : 0;
      t.emissiveIntensity = on ? 1.4 + m.hover : 0;
      t.color.set(on ? light : '#9A9A96');
    });
  });

  return (
    <IconMotion seed={23} float={0.05}>
      <group rotation={[-0.25, 0.35, 0.05]} position={[0, -0.1, 0]} scale={1.08}>
        {/* base plate */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.12]}>
          <cylinderGeometry args={[1.05, 1.1, 0.16, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* tick ring on a 270° scale, starting at lower-left */}
        {Array.from({ length: TICKS }, (_, i) => {
          const a = Math.PI * 1.25 - (i / (TICKS - 1)) * Math.PI * 1.5;
          const long = i % 4 === 0;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.98, Math.sin(a) * 0.98, -0.02]} rotation={[0, 0, a]}>
              <boxGeometry args={[long ? 0.12 : 0.07, 0.025, 0.03]} />
              <meshStandardMaterial ref={(el) => void (ticks.current[i] = el)} color="#9A9A96" emissive={light} emissiveIntensity={0} roughness={0.4} />
            </mesh>
          );
        })}
        {/* glowing progress arc, rotated so it starts at the scale's zero */}
        <mesh ref={arc} position={[0, 0, -0.02]}>
          <torusGeometry args={[0.86, 0.035, 12, 64, 0.5]} />
          <meshStandardMaterial ref={arcMat} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* the knob: a fluted cylinder with an indicator notch */}
        <group ref={knob}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.62, 0.68, 0.34, 48]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.5, 0.6, 0.06, 48]} />
            <Shell finish={p.finish === 'chrome' ? 'chrome' : 'matte'} />
          </mesh>
          {/* indicator, rotated with the knob; at rest it points to zero */}
          <mesh position={[Math.cos(Math.PI * 1.25) * 0.36, Math.sin(Math.PI * 1.25) * 0.36, 0.34]} rotation={[0, 0, Math.PI * 1.25]}>
            <boxGeometry args={[0.26, 0.06, 0.04]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
