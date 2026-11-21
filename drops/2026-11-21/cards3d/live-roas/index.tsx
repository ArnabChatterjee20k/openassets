import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Live ROAS',
  description: 'Feature card for Multiball live reporting: a glossy white dial gauge on a stand, its glowing arc lit in the seeded light and the needle sweeping up as ROAS climbs.',
  tags: ['card', 'reports', 'roas', 'gauge', 'analytics', 'ad agent'],
};

export const schema = beamSchema({ name: 'Live ROAS' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'hi-score': { name: 'Hi-Score' },
  'spend-pacing': { name: 'Spend Pacing' },
  sunflower: { lightMode: 'custom', light: '#FFC93C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const ARC = Math.PI * 1.4; // sweep of the dial
const START = Math.PI / 2 + ARC / 2; // left end (angle measured CCW from +x)
const TICKS = 9;

export default function LiveRoas(p: P) {
  const light = beamLight(p).color;
  const needle = useRef<THREE.Group>(null);
  const arc = useRef<THREE.MeshStandardMaterial>(null);

  // Housing: a lathe disc with a rolled rim, facing the camera.
  const housing = useMemo(() => {
    const g = new THREE.LatheGeometry(
      [
        [0, -0.14],
        [0.82, -0.14],
        [0.9, -0.1],
        [0.93, -0.02],
        [0.92, 0.07],
        [0.86, 0.12],
        [0.78, 0.1],
        [0.76, 0.04],
        [0, 0.04],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      72,
    );
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  // Idle: the needle sweeps from mid-dial up into the red-line and settles,
  // with a small jitter like a live reading; the arc pulses as it peaks.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const v = 0.55 + wave(m.t, 1, -0.25) * 0.25 + wave(m.t, 4) * 0.025 + m.hover * 0.15 + press * 0.3;
    if (needle.current) needle.current.rotation.z = START - Math.min(1, Math.max(0, v)) * ARC - Math.PI / 2;
    const peak = blink(m.t, 0.5, 0.12);
    if (arc.current) arc.current.emissiveIntensity = 0.9 + peak * 1.2 + m.hover * 0.5 + Math.abs(press) * 1.5;
  });

  return (
    <IconMotion seed={61}>
      <group rotation={[0.12, -0.35, 0]} position={[0, 0.08, 0]} scale={1.36}>
        {/* stand */}
        <RoundedBox args={[0.9, 0.18, 0.55]} radius={0.07} smoothness={4} position={[0, -1.02, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        <mesh position={[0, -0.86, 0]}>
          <cylinderGeometry args={[0.1, 0.14, 0.2, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* housing + face */}
        <mesh geometry={housing}>
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <circleGeometry args={[0.77, 72]} />
          <meshPhysicalMaterial color="#2A2A36" roughness={0.35} clearcoat={1} />
        </mesh>
        {/* glowing arc */}
        <mesh position={[0, 0, 0.06]} rotation={[0, 0, START - ARC]}>
          <torusGeometry args={[0.6, 0.05, 16, 80, ARC]} />
          <meshStandardMaterial ref={arc} color={light} emissive={light} emissiveIntensity={1.1} roughness={0.25} />
        </mesh>
        {/* ticks */}
        {Array.from({ length: TICKS }, (_, i) => {
          const a = START - (i / (TICKS - 1)) * ARC;
          const big = i % 2 === 0;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.06]} rotation={[0, 0, a]}>
              <boxGeometry args={[big ? 0.12 : 0.07, 0.03, 0.02]} />
              <meshStandardMaterial color="#E6E3DE" roughness={0.4} />
            </mesh>
          );
        })}
        {/* needle */}
        <group ref={needle} position={[0, 0, 0.09]} rotation={[0, 0, START - 0.55 * ARC - Math.PI / 2]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.022, 0.065, 0.56, 16]} />
            <meshPhysicalMaterial color="#F5F3F0" roughness={0.2} clearcoat={1} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 32]} />
          <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
        </mesh>
      </group>
    </IconMotion>
  );
}
