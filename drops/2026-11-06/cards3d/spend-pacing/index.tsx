import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Spend Pacing',
  description: 'Project card for Towline Spend Pacing, the budget guard: a white hourglass with glowing sand that trickles down and flips itself over. Light is seeded by the project name.',
  tags: ['card', 'budget', 'pacing', 'hourglass', 'project'],
};

export const schema = beamSchema({ name: 'Spend Pacing' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'budget-guard': { name: 'Budget Guard' },
  'overnight-rebalance': { name: 'Overnight Rebalance' },
  violet: { lightMode: 'custom', light: '#9B5CFF' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const BULB = 0.66; // height of one bulb from the neck

export default function SpendPacing(p: P) {
  const light = beamLight(p).color;
  const glass = useMemo(() => {
    // One bulb from the neck (y=0) up; mirrored for the lower bulb.
    const prof = [
      [0.055, 0],
      [0.12, 0.08],
      [0.3, 0.24],
      [0.38, 0.42],
      [0.36, 0.58],
      [0.3, BULB],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(prof, 48);
  }, []);

  const flip = useRef<THREE.Group>(null);
  const top = useRef<THREE.Mesh>(null);
  const bottom = useRef<THREE.Mesh>(null);
  const stream = useRef<THREE.Mesh>(null);
  const sandMat = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: sand drains top→bottom, then the hourglass flips itself (symmetric, so the
  // loop is seamless). Hover makes the sand glow hotter; click gives a jolt.
  useLoop((m) => {
    const u = cycle(m.t, 1);
    const s = Math.min(1, u / 0.8);
    const turn = u < 0.82 ? 0 : THREE.MathUtils.smootherstep((u - 0.82) / 0.18, 0, 1);
    if (flip.current) {
      flip.current.rotation.z = turn * Math.PI + pressBounce(m.pressAge) * 0.25;
    }
    if (top.current) top.current.scale.setScalar(Math.max(0.001, Math.cbrt(1 - s)));
    if (bottom.current) bottom.current.scale.setScalar(Math.max(0.001, Math.cbrt(s)));
    if (stream.current) stream.current.visible = s > 0.02 && s < 0.98 && turn === 0;
    if (sandMat.current) sandMat.current.emissiveIntensity = 2.2 + (wave(m.t, 4) * 0.5 + 0.5) * 0.6 + m.hover * 1.2;
  });

  const sand = <meshStandardMaterial ref={sandMat} color={light} emissive={light} emissiveIntensity={1.2} roughness={0.6} toneMapped={false} />;

  return (
    <IconMotion seed={64}>
      <group position={[0, -0.05, 0]} rotation={[0.12, 0, 0]} scale={1.18}>
        <group ref={flip}>
          {/* caps */}
          {[1, -1].map((k) => (
            <group key={k} position={[0, k * (BULB + 0.07), 0]}>
              <mesh>
                <cylinderGeometry args={[0.52, 0.52, 0.12, 48]} />
                <Shell finish={p.finish} />
              </mesh>
              <mesh position={[0, k * 0.075, 0]}>
                <cylinderGeometry args={[0.46, 0.5, 0.05, 48]} />
                <Shell finish={p.finish} color="#E6E3E0" />
              </mesh>
            </group>
          ))}
          {/* posts */}
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2 + 0.5;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.44, 0, Math.sin(a) * 0.44]}>
                <cylinderGeometry args={[0.035, 0.035, BULB * 2 + 0.08, 16]} />
                <Shell finish={p.finish} />
              </mesh>
            );
          })}
          {/* sand: cone hanging into the neck (top), mound growing from the floor (bottom) */}
          <group position={[0, 0.06, 0]}>
            <mesh ref={top} position={[0, 0, 0]}>
              <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.31, 0.4, 40]} />
                {sand}
              </mesh>
            </mesh>
          </group>
          <group position={[0, -BULB + 0.02, 0]}>
            <mesh ref={bottom}>
              <mesh position={[0, 0.14, 0]}>
                <coneGeometry args={[0.34, 0.28, 40]} />
                {sand}
              </mesh>
            </mesh>
          </group>
          <mesh ref={stream} position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.6, 8]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} />
          </mesh>
          {/* glass bulbs */}
          {[1, -1].map((k) => (
            <mesh key={k} geometry={glass} scale={[1, k, 1]}>
              <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={1} thickness={0.25} ior={1.35} transparent opacity={0.75} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
