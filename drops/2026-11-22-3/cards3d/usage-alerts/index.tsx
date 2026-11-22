import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Usage Alerts',
  description: 'Project card for Ambit Usage Alerts: a glossy white bell with a glowing rim and clapper that rings when a team nears its AI budget.',
  tags: ['card', 'alerts', 'bell', 'budget', 'notifications'],
};

export const schema = beamSchema({ name: 'Usage Alerts' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'spend-caps': { name: 'Spend Caps' },
  'weekly-digest': { name: 'Weekly Digest' },
  violet: { lightMode: 'custom', light: '#5E4AE3' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#E4E7EE" metalness={0.85} roughness={0.28} side={THREE.DoubleSide} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFF6" roughness={0.75} sheen={0.4} sheenColor="#ffffff" side={THREE.DoubleSide} />;
  return <meshPhysicalMaterial color="#F5F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
}

export default function UsageAlerts(p: P) {
  const light = beamLight(p).color;
  const bell = useRef<THREE.Group>(null);
  const clapper = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);

  // Bell profile: a domed shoulder flaring to a lip, spun on a lathe.
  const body = useMemo(() => {
    const pts = [
      [0.0, 0.62],
      [0.16, 0.6],
      [0.3, 0.52],
      [0.37, 0.36],
      [0.4, 0.12],
      [0.45, -0.1],
      [0.56, -0.26],
      [0.62, -0.32],
      [0.6, -0.36],
      [0.5, -0.34],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 64);
  }, []);

  // Idle: a little swing; twice per loop the bell rings (clapper flashes).
  // Hover swings harder; a click gives a big ring.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const ringA = blink(m.t, 0.3, 0.06) + blink(m.t, 0.8, 0.06);
    const swing = wave(m.t, 4) * (0.05 + ringA * 0.12 + m.hover * 0.1) + press * 0.5;
    if (bell.current) bell.current.rotation.z = swing;
    if (clapper.current) clapper.current.rotation.z = -swing * 1.6;
    if (glow.current) glow.current.emissiveIntensity = 1.4 + ringA * 1.6 + m.hover * 0.8 + Math.abs(press) * 2;
    if (ring.current) ring.current.emissiveIntensity = 1.1 + ringA * 1.2 + m.hover * 0.6;
  });

  return (
    <IconMotion seed={23} float={0.05}>
      <group position={[0, -0.12, 0]} rotation={[0.08, -0.3, 0]} scale={1.4}>
        <group ref={bell} position={[0, 0.7, 0]}>
          <group position={[0, -0.7, 0]}>
            {/* hanging loop */}
            <mesh position={[0, 0.72, 0]}>
              <torusGeometry args={[0.1, 0.035, 16, 40]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh geometry={body}>
              <Shell finish={p.finish} />
            </mesh>
            {/* glowing band around the lip */}
            <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.6, 0.03, 16, 80]} />
              <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.2} roughness={0.3} />
            </mesh>
            {/* clapper */}
            <group ref={clapper} position={[0, 0.1, 0]}>
              <mesh position={[0, -0.3, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.5, 12]} />
                <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.58, 0]}>
                <sphereGeometry args={[0.13, 32, 32]} />
                <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
