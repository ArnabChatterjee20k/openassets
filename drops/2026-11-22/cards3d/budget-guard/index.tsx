import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Budget Guard',
  description: 'Feature card for Folio Budget Guard: a white padlock whose glowing keyhole blinks as the agent checks spend caps, with a shackle that clicks shut on a loop.',
  tags: ['card', 'budget', 'padlock', 'security', 'feature'],
};

export const schema = beamSchema({ name: 'Budget Guard' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'spend-caps': { name: 'Spend Caps' },
  'brand-safety': { name: 'Brand Safety' },
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

export default function BudgetGuard(p: P) {
  const light = beamLight(p).color;
  const shackle = useRef<THREE.Group>(null);
  const hole = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);

  // Keyhole: a circle plus a tapered slot, extruded.
  const keyhole = useMemo(() => {
    const s = new THREE.Shape();
    const a = Math.acos(0.45); // where the slot meets the circle
    s.moveTo(-0.055, -0.2);
    s.absarc(0, 0.06, 0.1, Math.PI + a, -a, true);
    s.lineTo(0.055, -0.2);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false, curveSegments: 24 });
  }, []);

  // Idle: the shackle lifts and clicks shut once per loop, the keyhole blinks
  // as it locks. Hover brightens the ring; click rattles the shackle.
  useLoop((m) => {
    const open = blink(m.t, 0.55, 0.12); // 0 → 1 → 0 around mid-loop
    const lockFlash = blink(m.t, 0.7, 0.05);
    if (shackle.current) {
      shackle.current.position.y = 0.42 + open * 0.2 + Math.abs(pressBounce(m.pressAge)) * 0.12;
      shackle.current.rotation.y = open * 0.5;
    }
    const breathe = wave(m.t, 2) * 0.5 + 0.5;
    if (hole.current) hole.current.emissiveIntensity = 1.4 + breathe * 0.5 + lockFlash * 2.5 + m.hover * 0.8;
    if (ring.current) ring.current.emissiveIntensity = 0.9 + lockFlash * 2 + m.hover * 1.2;
  });

  return (
    <IconMotion seed={57} float={0.05}>
      <group rotation={[0.1, -0.4, 0]} position={[0, -0.45, 0]} scale={1.18}>
        {/* shackle: a half torus with two legs; the right leg drops into the body */}
        <group ref={shackle} position={[0, 0.42, 0]}>
          <group position={[0.0, 0, 0]}>
            <mesh position={[0, 0.32, 0]}>
              <torusGeometry args={[0.38, 0.09, 24, 48, Math.PI]} />
              <meshPhysicalMaterial color="#E4E6EA" metalness={0.55} roughness={0.25} clearcoat={1} />
            </mesh>
            {[-0.38, 0.38].map((x) => (
              <mesh key={x} position={[x, 0.1, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.44, 24]} />
                <meshPhysicalMaterial color="#E4E6EA" metalness={0.55} roughness={0.25} clearcoat={1} />
              </mesh>
            ))}
          </group>
        </group>
        {/* body */}
        <RoundedBox args={[1.25, 0.98, 0.5]} radius={0.16} smoothness={6} position={[0, 0, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* glowing ring around the keyhole */}
        <mesh position={[0, 0.02, 0.255]}>
          <torusGeometry args={[0.24, 0.025, 16, 48]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1} roughness={0.3} />
        </mesh>
        <mesh geometry={keyhole} position={[0, 0.02, 0.24]}>
          <meshStandardMaterial ref={hole} color={light} emissive={light} emissiveIntensity={1.6} />
        </mesh>
      </group>
    </IconMotion>
  );
}
