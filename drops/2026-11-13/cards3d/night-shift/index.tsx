import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, flicker, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Night Shift',
  description: "Project card for Pike's Night Shift, the 24/7 optimiser that rebalances budgets while you sleep: a white storm lantern whose core breathes and flickers, lit by beams seeded from the project name.",
  tags: ['card', 'automation', '24/7', 'lantern', 'project'],
};

export const schema = beamSchema({ name: 'Night Shift' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  autopilot: { name: 'Autopilot' },
  'budget-guard': { name: 'Budget Guard' },
  ember: { lightMode: 'custom', light: '#E4572E', background: '#0C0806' },
  aurora: { lightMode: 'custom', light: '#2EF2C4', background: '#021016' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#E4E8EE" metalness={1} roughness={0.34} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#EEF1F3" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F3F5F7" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function NightShift(p: P) {
  const light = beamLight(p).color;
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const handle = useRef<THREE.Group>(null);

  // Lantern profile: a lathed cap with a soft dome and lip.
  const cap = useMemo(() => {
    const pts = [
      [0.0, 0.32],
      [0.12, 0.3],
      [0.3, 0.2],
      [0.46, 0.06],
      [0.5, 0.02],
      [0.5, 0.0],
      [0.0, 0.0],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 64);
  }, []);

  // Idle: the flame breathes and gutters once a loop; the handle sways.
  // Hover brightens it; a click flares it.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    const f = 1 + wave(m.t, 2) * 0.12 - flicker(m.t, 0.62) * 0.45;
    if (coreMat.current) coreMat.current.emissiveIntensity = (1.0 + m.hover * 0.8 + press * 2) * f;
    if (core.current) core.current.scale.set(1, 1 + wave(m.t, 4) * 0.06 + press * 0.3, 1);
    if (handle.current) handle.current.rotation.z = wave(m.t, 1, 0.25) * 0.18 + pressBounce(m.pressAge) * 0.5;
  });

  return (
    <IconMotion seed={57} float={0.05}>
      <group rotation={[0.18, 0.4, 0]} position={[0, -0.05, 0]} scale={1.12}>
        {/* Base */}
        <mesh position={[0, -0.62, 0]}>
          <cylinderGeometry args={[0.46, 0.52, 0.18, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <torusGeometry args={[0.43, 0.04, 16, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* Glass chimney */}
        <mesh>
          <cylinderGeometry args={[0.36, 0.4, 0.95, 64, 1, true]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} transmission={1} thickness={0.2} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
        {/* Guard wires */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42]}>
              <cylinderGeometry args={[0.022, 0.022, 0.95, 12]} />
              <Shell finish={p.finish} />
            </mesh>
          );
        })}
        {/* Flame core */}
        <mesh ref={core} position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial ref={coreMat} color={light} emissive={light} emissiveIntensity={2} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.06, 0.09, 0.2, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* Cap */}
        <mesh geometry={cap} position={[0, 0.47, 0]}>
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0.82, 0]}>
          <sphereGeometry args={[0.07, 24, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* Bail handle */}
        <group ref={handle} position={[0, 0.82, 0]}>
          <mesh position={[0, 0.12, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.32, 0.032, 16, 64, Math.PI]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
