import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Autopilot',
  description: 'Feature card for Multiball Autopilot: a glossy white arcade joystick with a glowing ball top that rocks on its own, lit by beams seeded from the project name.',
  tags: ['card', 'autopilot', 'joystick', 'arcade', 'ad agent'],
};

export const schema = beamSchema({ name: 'Autopilot' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'player-one': { name: 'Player One' },
  'bid-pilot': { name: 'Bid Pilot' },
  bubblegum: { lightMode: 'custom', light: '#FF6F91' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function Autopilot(p: P) {
  const light = beamLight(p).color;
  const stick = useRef<THREE.Group>(null);
  const knob = useRef<THREE.MeshStandardMaterial>(null);
  const btn = useRef<THREE.Group>(null);

  // Rubber boot: a short flared lathe around the stick's base.
  const boot = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.32, 0],
          [0.3, 0.06],
          [0.2, 0.14],
          [0.12, 0.22],
          [0.07, 0.26],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        48,
      ),
    [],
  );

  // Idle: the stick steers in small figure-eights (the agent playing);
  // the ball top breathes, the fire button taps once per loop.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (stick.current) {
      stick.current.rotation.z = wave(m.t, 1) * 0.28 + press * 0.4;
      stick.current.rotation.x = wave(m.t, 2) * 0.16;
    }
    if (knob.current) knob.current.emissiveIntensity = 0.45 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + m.hover * 0.6 + Math.abs(press) * 1.5;
    if (btn.current) btn.current.position.y = 0.2 - blink(m.t, 0.25, 0.05) * 0.05 - blink(m.t, 0.75, 0.05) * 0.05;
  });

  return (
    <IconMotion seed={31}>
      <group rotation={[0.42, -0.5, 0]} position={[0.05, -0.55, 0]} scale={1.3}>
        {/* base */}
        <RoundedBox args={[1.6, 0.36, 1.0]} radius={0.14} smoothness={5}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* boot + stick + glowing ball top */}
        <group position={[-0.32, 0.18, 0]}>
          <mesh geometry={boot}>
            <meshPhysicalMaterial color="#2A2A36" roughness={0.55} />
          </mesh>
          <group ref={stick}>
            <mesh position={[0, 0.42, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.8, 24]} />
              <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <sphereGeometry args={[0.24, 48, 48]} />
              <meshStandardMaterial ref={knob} color={light} emissive={light} emissiveIntensity={1.2} roughness={0.25} />
            </mesh>
          </group>
        </group>
        {/* fire button */}
        <group ref={btn} position={[0.42, 0.2, 0.05]}>
          <mesh>
            <cylinderGeometry args={[0.17, 0.17, 0.08, 40]} />
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.04, 40]} />
            <meshStandardMaterial color="#9EA3AD" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
