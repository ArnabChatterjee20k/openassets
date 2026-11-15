import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Budget Autopilot',
  description: 'Feature card for Firebrand Budget Autopilot: a glossy white thermostat dial whose glowing ring and pointer turn budget up where a channel runs hot.',
  tags: ['card', 'budget', 'autopilot', 'thermostat', 'feature'],
};

export const schema = beamSchema({ name: 'Budget Autopilot' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'spend-guard': { name: 'Spend Guard' },
  'hourly-rebalance': { name: 'Hourly Rebalance' },
  molten: { lightMode: 'custom', light: '#FF4D00' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function BudgetAutopilot(p: P) {
  const light = beamLight(p).color;
  const knob = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const pip = useRef<THREE.MeshStandardMaterial>(null);

  // Bezel: a soft rounded disc, lathed then turned to face the camera.
  const bezel = useMemo(() => {
    const pts = [
      [0, -0.16], [0.88, -0.16], [0.98, -0.1], [1.02, 0], [0.98, 0.1], [0.9, 0.15], [0, 0.15],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  const cap = useMemo(() => {
    const pts = [
      [0, 0], [0.6, 0], [0.64, 0.06], [0.64, 0.2], [0.58, 0.28], [0.3, 0.33], [0, 0.34],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 96);
  }, []);

  // Idle: the dial hunts for the right setting and the ring breathes. Hover brightens; click spins it.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (knob.current) knob.current.rotation.z = wave(m.t, 1) * 0.55 + press * 1.4;
    if (ring.current) ring.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.9 + m.hover * 1 + Math.abs(press) * 2;
    if (pip.current) pip.current.emissiveIntensity = 2 + m.hover * 1.5;
  });

  return (
    <IconMotion seed={23}>
      <group rotation={[-0.08, -0.16, 0]} position={[0, -0.02, 0]} scale={1}>
        <mesh geometry={bezel} rotation={[Math.PI / 2, 0, 0]}>
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing heat ring set into the bezel */}
        <mesh position={[0, 0, 0.155]}>
          <torusGeometry args={[0.78, 0.035, 16, 128]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* tick marks around the dial */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.14]} rotation={[0, 0, a]}>
              <boxGeometry args={[i % 6 === 0 ? 0.07 : 0.04, 0.014, 0.02]} />
              <meshStandardMaterial color="#9A948E" />
            </mesh>
          );
        })}
        <group ref={knob} position={[0, 0, 0.15]}>
          <mesh geometry={cap} rotation={[Math.PI / 2, 0, 0]}>
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </mesh>
          {/* pointer pip */}
          <mesh position={[0, 0.42, 0.3]}>
            <capsuleGeometry args={[0.05, 0.14, 8, 24]} />
            <meshStandardMaterial ref={pip} color={light} emissive={light} emissiveIntensity={2} />
          </mesh>
          {/* grip grooves on the cap rim */}
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.645, Math.sin(a) * 0.645, 0.14]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.02, 0.05, 0.16]} />
                <meshStandardMaterial color="#CFCAC4" roughness={0.4} />
              </mesh>
            );
          })}
        </group>
      </group>
    </IconMotion>
  );
}
