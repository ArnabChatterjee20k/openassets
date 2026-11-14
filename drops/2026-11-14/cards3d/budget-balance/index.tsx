import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Budget Balance',
  description: "Project card for Plotwell's hourly budget rebalancing: a glossy spirit level whose glowing bubble drifts and re-centres, lit by beams seeded from the project name.",
  tags: ['card', 'budget', 'pacing', 'rebalance', 'project'],
};

export const schema = beamSchema({ name: 'Budget Balance' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'spend-pacing': { name: 'Spend Pacing' },
  'bid-guard': { name: 'Bid Guard' },
  highlighter: { lightMode: 'custom', light: '#FFDD00' },
  cyanotype: { lightMode: 'custom', light: '#7FB2FF', background: '#061634' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshPhysicalMaterial color="#E4E8EF" metalness={0.75} roughness={0.28} clearcoat={1} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function BudgetBalance(p: P) {
  const light = beamLight(p).color;
  const bubble = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const body = useRef<THREE.Group>(null);

  // Idle: the level tips a little and the bubble drifts, then re-centres (rest pose is level).
  // Hover makes the drift bigger; a click jolts the bubble.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    const tilt = wave(m.t, 1) * (0.05 + m.hover * 0.05) + b * 0.06;
    if (body.current) body.current.rotation.z = tilt;
    if (bubble.current) bubble.current.position.x = Math.max(-0.28, Math.min(0.28, -tilt * 4.2));
    if (glow.current) glow.current.emissiveIntensity = 1.6 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8 + m.hover * 0.8 + Math.abs(b) * 2.5;
  });

  return (
    <IconMotion seed={58}>
      <group rotation={[0.55, -0.18, 0]} position={[0, -0.1, 0]} scale={1.45}>
        <group ref={body}>
          {/* bar */}
          <RoundedBox args={[2.0, 0.36, 0.34]} radius={0.08} smoothness={5}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* end caps */}
          {[-1.0, 1.0].map((x) => (
            <RoundedBox key={x} args={[0.12, 0.4, 0.38]} radius={0.04} smoothness={4} position={[x, 0, 0]}>
              <meshPhysicalMaterial color="#C9CDD5" metalness={0.6} roughness={0.3} clearcoat={1} />
            </RoundedBox>
          ))}
          {/* vial window on top */}
          <RoundedBox args={[0.9, 0.06, 0.24]} radius={0.025} smoothness={3} position={[0, 0.17, 0]}>
            <meshPhysicalMaterial color="#2A2F3A" roughness={0.4} />
          </RoundedBox>
          <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.085, 0.64, 12, 32]} />
            <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={1} thickness={0.2} ior={1.3} />
          </mesh>
          {/* centre marks */}
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x, 0.22, 0]}>
              <torusGeometry args={[0.088, 0.008, 8, 32]} />
              <meshStandardMaterial color="#9EA3AD" />
            </mesh>
          ))}
          {/* the glowing bubble */}
          <mesh ref={bubble} position={[0, 0.245, 0]} scale={[1.5, 0.8, 0.8]}>
            <sphereGeometry args={[0.07, 32, 16]} />
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={2} roughness={0.2} />
          </mesh>
          {/* side vials (front face) */}
          {[-0.62, 0.62].map((x) => (
            <mesh key={x} position={[x, 0, 0.172]}>
              <circleGeometry args={[0.07, 32]} />
              <meshPhysicalMaterial color="#2A2F3A" roughness={0.3} />
            </mesh>
          ))}
          {[-0.62, 0.62].map((x) => (
            <mesh key={`r${x}`} position={[x, 0, 0.175]}>
              <ringGeometry args={[0.07, 0.085, 32]} />
              <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
