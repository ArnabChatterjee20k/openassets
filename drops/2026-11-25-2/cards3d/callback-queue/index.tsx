import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Callback Queue',
  description: 'Project card for Ringside Callback Queue: a glossy white twin-bell alarm clock with a glowing face ring; the minute hand sweeps and the hammer rattles on click.',
  tags: ['card', 'callback', 'clock', 'follow-up', 'project'],
};

export const schema = beamSchema({ name: 'Callback Queue' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'follow-ups': { name: 'Follow-ups' },
  'crm-sync': { name: 'CRM Sync' },
  sage: { lightMode: 'custom', light: '#7FB08C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F2EF" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function CallbackQueue(p: P) {
  const light = beamLight(p).color;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const minute = useRef<THREE.Group>(null);
  const hammer = useRef<THREE.Group>(null);

  // The minute hand sweeps once per loop; the face ring brightens when the alarm "rings"; click rattles the hammer.
  useLoop((m) => {
    if (minute.current) minute.current.rotation.z = Math.PI - (m.t / 4) * Math.PI * 2;
    const alarm = Math.max(blink(m.t, 0.5, 0.06), Math.abs(pressBounce(m.pressAge)));
    if (ring.current) ring.current.emissiveIntensity = 1.2 + alarm * 2 + m.hover * 0.6 + wave(m.t, 2) * 0.2;
    if (hammer.current) hammer.current.rotation.z = Math.sin(m.t * 70) * alarm * 0.5;
  });

  return (
    <IconMotion seed={88}>
      <group position={[0, -0.12, 0]} rotation={[0.1, -0.35, 0]} scale={1.1}>
        {/* body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.42, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing face ring */}
        <mesh position={[0, 0, 0.215]}>
          <torusGeometry args={[0.6, 0.045, 20, 80]} />
          <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
        </mesh>
        {/* dial face */}
        <mesh position={[0, 0, 0.212]}>
          <circleGeometry args={[0.56, 64]} />
          <meshPhysicalMaterial color="#ECE8E2" roughness={0.45} />
        </mesh>
        {/* hour ticks */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.46, Math.cos(a) * 0.46, 0.22]} rotation={[0, 0, -a]}>
              <boxGeometry args={[0.025, i % 3 === 0 ? 0.1 : 0.05, 0.01]} />
              <meshStandardMaterial color="#5B5753" />
            </mesh>
          );
        })}
        {/* hour hand at 10 */}
        <group rotation={[0, 0, (Math.PI * 2) / 12 * 2]} position={[0, 0, 0.23]}>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.05, 0.28, 0.02]} />
            <meshStandardMaterial color="#3F3B38" />
          </mesh>
        </group>
        {/* minute hand (rest pose: 30, i.e. pointing down) */}
        <group ref={minute} rotation={[0, 0, Math.PI]} position={[0, 0, 0.24]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.035, 0.4, 0.02]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.6} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 20]} />
          <meshStandardMaterial color="#3F3B38" />
        </mesh>
        {/* bells */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.46, 0.66, -0.02]} rotation={[0, 0, -s * 0.6]}>
            <sphereGeometry args={[0.24, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Shell finish={p.finish} />
          </mesh>
        ))}
        {/* hammer between the bells */}
        <group ref={hammer} position={[0, 0.72, -0.02]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            <meshStandardMaterial color="#B8B4AE" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.05, 0.12, 8, 16]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
        {/* legs */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.45, -0.72, 0]} rotation={[0, 0, s * 0.5]}>
            <capsuleGeometry args={[0.06, 0.2, 8, 16]} />
            <Shell finish={p.finish} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
