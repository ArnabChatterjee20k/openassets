import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Night Shift',
  description: 'Project card for Patchwell Night Shift (overnight budget rebalancing): a glossy twin-bell alarm clock with a glowing dial ring, lit by beams seeded from the project name.',
  tags: ['card', 'pacing', 'clock', 'overnight', 'project'],
};

export const schema = beamSchema({ name: 'Night Shift' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'dayparting': { name: 'Dayparting' },
  'pacing': { name: 'Spend Pacing' },
  'teal-enamel': { lightMode: 'custom', light: '#2C7873' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEE8" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3EF" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const Metal = () => <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />;

export default function NightShift(p: P) {
  const light = beamLight(p).color;
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const second = useRef<THREE.Group>(null);
  const bells = useRef<THREE.Group>(null);
  const hammer = useRef<THREE.Group>(null);

  // Idle: the second hand sweeps, the ring breathes, and once per loop the bells
  // give a short rattle. Hover speeds the hand; click sets off the alarm.
  useLoop((m) => {
    const kick = pressBounce(m.pressAge);
    const ring = blink(m.t, 0.8, 0.07) + Math.abs(kick) * 1.5;
    if (second.current) second.current.rotation.z = -cycle(m.t, m.hover > 0.5 ? 2 : 1) * Math.PI * 2;
    if (glow.current) glow.current.emissiveIntensity = 1.3 + (wave(m.t, 1) * 0.5 + 0.5) * 0.6 + ring * 1.4 + m.hover * 0.6;
    const rattle = wave(m.t, 64) * ring;
    if (bells.current) bells.current.rotation.z = rattle * 0.06;
    if (hammer.current) hammer.current.rotation.z = rattle * 0.5;
  });

  return (
    <IconMotion seed={57}>
      <group rotation={[0.08, -0.26, 0.04]} position={[0, -0.16, 0]} scale={1.08}>
        <group ref={bells}>
          {/* body: a deep drum with the face toward +z */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.72, 0.72, 0.42, 64]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, 0, 0.21]}>
            <torusGeometry args={[0.7, 0.06, 20, 72]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* glowing dial ring + face */}
          <mesh position={[0, 0, 0.235]}>
            <torusGeometry args={[0.6, 0.035, 16, 72]} />
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.215]}>
            <circleGeometry args={[0.58, 64]} />
            <meshPhysicalMaterial color="#F6F3EE" roughness={0.35} emissive="#F6F3EE" emissiveIntensity={0.12} />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const big = i % 3 === 0;
            return (
              <mesh key={i} position={[Math.sin(a) * 0.47, Math.cos(a) * 0.47, 0.225]} rotation={[0, 0, -a]}>
                <boxGeometry args={[big ? 0.04 : 0.022, big ? 0.11 : 0.06, 0.01]} />
                <meshStandardMaterial color="#2E2A24" />
              </mesh>
            );
          })}
          {/* hands: 4:50 on the night shift */}
          <mesh position={[0, 0, 0.235]} rotation={[0, 0, -(4 + 50 / 60) * (Math.PI / 6)]}>
            <boxGeometry args={[0.05, 0.3, 0.012]} />
            <meshStandardMaterial color="#2E2A24" />
          </mesh>
          <mesh position={[0, 0, 0.245]} rotation={[0, 0, -(50 / 60) * Math.PI * 2]}>
            <boxGeometry args={[0.035, 0.44, 0.012]} />
            <meshStandardMaterial color="#2E2A24" />
          </mesh>
          <group ref={second} position={[0, 0, 0.255]}>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.014, 0.46, 0.008]} />
              <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.8} />
            </mesh>
          </group>
          <mesh position={[0, 0, 0.26]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 20]} />
            <Metal />
          </mesh>
          {/* glass dome over the face */}
          <mesh position={[0, 0, 0.2]} scale={[1, 1, 0.18]}>
            <sphereGeometry args={[0.66, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#ffffff" roughness={0.05} clearcoat={1} transparent opacity={0.16} depthWrite={false} />
          </mesh>
          {/* twin bells on stalks */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.46, 0.66, -0.02]} rotation={[0, 0, -s * 0.5]}>
              <mesh position={[0, -0.06, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.16, 12]} />
                <Metal />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <sphereGeometry args={[0.27, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Shell finish={p.finish} />
              </mesh>
              <mesh position={[0, 0.3, 0]}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <Metal />
              </mesh>
            </group>
          ))}
          {/* hammer between the bells */}
          <group ref={hammer} position={[0, 0.72, -0.02]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.2, 10]} />
              <Metal />
            </mesh>
            <mesh position={[0, 0.21, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.14, 16]} />
              <Metal />
            </mesh>
          </group>
          {/* carry handle */}
          <mesh position={[0, 0.78, -0.12]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.2, 0.025, 12, 40, Math.PI]} />
            <Metal />
          </mesh>
          {/* splayed feet */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.42, -0.72, 0]} rotation={[0, 0, s * 0.5]}>
              <capsuleGeometry args={[0.05, 0.16, 6, 12]} />
              <Metal />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
