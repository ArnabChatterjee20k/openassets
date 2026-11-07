import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Bid Desk',
  description: 'Project card for Mandate Bid Desk: a glossy white auction gavel with a glowing band, poised over its sound block; it taps a bid every loop and strikes on click.',
  tags: ['card', 'bids', 'auction', 'gavel', 'project'],
};

export const schema = beamSchema({ name: 'Bid Desk' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'target-cpa': { name: 'Target CPA' },
  'auction-insights': { name: 'Auction Insights' },
  gold: { lightMode: 'custom', light: '#C9A45C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function BidDesk(p: P) {
  const light = beamLight(p).color;
  const gavel = useRef<THREE.Group>(null);
  const band = useRef<THREE.MeshStandardMaterial>(null);
  const block = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the gavel hovers raised, then taps the block once per loop (the
  // band flares on contact). Hover raises it higher; a click is a hard strike.
  useLoop((m) => {
    const tap = blink(m.t, 0.5, 0.06); // 0..1 around mid-loop
    const strike = Math.abs(pressBounce(m.pressAge));
    const raise = 0.3 + wave(m.t, 2) * 0.04 + m.hover * 0.2;
    const angle = raise * (1 - Math.max(tap, strike * 1.4));
    if (gavel.current) gavel.current.rotation.z = Math.max(-0.05, angle);
    const hit = Math.max(tap, strike);
    if (band.current) band.current.emissiveIntensity = 1.3 + hit * 2.5 + m.hover * 0.6;
    if (block.current) block.current.emissiveIntensity = hit * 1.4;
  });

  return (
    <IconMotion seed={57} float={0.04}>
      <group position={[0.45, -0.1, 0]} rotation={[0.3, 0.32, 0]} scale={1.0}>
        {/* sound block */}
        <mesh position={[0.15, -0.62, 0]}>
          <cylinderGeometry args={[0.52, 0.56, 0.2, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0.15, -0.515, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.022, 12, 64]} />
          <meshStandardMaterial ref={block} color={light} emissive={light} emissiveIntensity={0} toneMapped={false} />
        </mesh>
        {/* gavel pivots near the handle end */}
        <group position={[-1.25, -0.02, 0]}>
          <group ref={gavel}>
            {/* handle with a turned grip */}
            <mesh position={[0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.06, 1.3, 8, 24]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.085, 0.22, 8, 24]} />
              <Shell finish={p.finish} />
            </mesh>
            {/* head */}
            <group position={[1.4, 0.0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.2, 0.2, 0.74, 48]} />
                <Shell finish={p.finish} />
              </mesh>
              {[0.37, -0.37].map((y) => (
                <mesh key={y} position={[0, y, 0]}>
                  <cylinderGeometry args={[0.23, 0.23, 0.07, 48]} />
                  <Shell finish={p.finish} />
                </mesh>
              ))}
              {/* the glowing band */}
              <mesh>
                <cylinderGeometry args={[0.212, 0.212, 0.1, 48]} />
                <meshStandardMaterial ref={band} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.25} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
