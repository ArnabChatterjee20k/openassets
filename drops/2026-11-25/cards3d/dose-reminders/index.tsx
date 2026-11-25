import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Dose Reminders',
  description: 'Project card for Satiate Dose Reminders: a glossy white twin-bell alarm clock with a glowing face, lit by beams seeded from the project name. The hammer rattles once a loop; a click rings it.',
  tags: ['card', 'reminder', 'alarm', 'notification', 'glp-1'],
};

export const schema = beamSchema({ name: 'Dose Reminders' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'refill-alerts': { name: 'Refill Alerts' },
  'shot-day': { name: 'Shot Day' },
  electric: { lightMode: 'custom', light: '#3D5AFE' },
  jelly: { lightMode: 'custom', light: '#FF3DB4', finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.5 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const Z = new THREE.Euler(Math.PI / 2, 0, 0); // cylinders face the camera

export default function DoseReminders(p: P) {
  const light = beamLight(p).color;
  const face = useRef<THREE.MeshStandardMaterial>(null);
  const second = useRef<THREE.Group>(null);
  const bells = useRef<THREE.Group>(null);
  const hammer = useRef<THREE.Group>(null);

  // Idle: the second hand sweeps, the hammer rattles once a loop; hover brightens; click rings.
  useLoop((m) => {
    const ring = Math.max(blink(m.t, 0.8, 0.06), Math.abs(pressBounce(m.pressAge)));
    if (face.current) face.current.emissiveIntensity = 1.1 + (wave(m.t, 2) * 0.5 + 0.5) * 0.4 + m.hover * 0.8 + ring * 0.8;
    if (second.current) second.current.rotation.z = -cycle(m.t, 1) * Math.PI * 2;
    if (hammer.current) hammer.current.rotation.z = Math.sin(m.t * 60) * 0.35 * ring;
    if (bells.current) bells.current.rotation.z = Math.sin(m.t * 60 + 1) * 0.05 * ring;
  });

  return (
    <IconMotion seed={23}>
      <group position={[0, -0.12, 0]} rotation={[0.08, -0.32, 0]} scale={0.95}>
        <group ref={bells}>
          {/* case */}
          <mesh rotation={Z}>
            <cylinderGeometry args={[0.62, 0.62, 0.36, 64]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* bezel */}
          <mesh position={[0, 0, 0.18]}>
            <torusGeometry args={[0.56, 0.06, 24, 64]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* glowing face */}
          <mesh position={[0, 0, 0.17]}>
            <circleGeometry args={[0.52, 64]} />
            <meshStandardMaterial ref={face} color={light} emissive={light} emissiveIntensity={1.2} roughness={0.4} />
          </mesh>
          {/* hour ticks */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.sin(a) * 0.42, Math.cos(a) * 0.42, 0.18]} rotation={[0, 0, -a]}>
                <boxGeometry args={[0.03, i % 3 === 0 ? 0.1 : 0.05, 0.01]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            );
          })}
          {/* hands: hour, minute, sweeping second */}
          <mesh position={[0.08, 0.1, 0.2]} rotation={[0, 0, -0.7]}>
            <boxGeometry args={[0.05, 0.26, 0.02]} />
            <meshStandardMaterial color="#101219" />
          </mesh>
          <mesh position={[-0.12, 0.06, 0.205]} rotation={[0, 0, 1.1]}>
            <boxGeometry args={[0.04, 0.34, 0.02]} />
            <meshStandardMaterial color="#101219" />
          </mesh>
          <group ref={second} position={[0, 0, 0.215]}>
            <mesh position={[0, 0.17, 0]}>
              <boxGeometry args={[0.015, 0.36, 0.01]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
            </mesh>
          </group>
          <mesh position={[0, 0, 0.22]} rotation={Z}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 24]} />
            <meshStandardMaterial color="#101219" />
          </mesh>
          {/* twin bells */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.4, 0.58, -0.02]} rotation={[0, 0, -s * 0.55]}>
              <mesh>
                <sphereGeometry args={[0.22, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Shell finish={p.finish} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.22, 48]} />
                <meshStandardMaterial color="#9EA3AD" side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, 0.25, 0]}>
                <sphereGeometry args={[0.045, 16, 16]} />
                <Shell finish={p.finish} />
              </mesh>
            </group>
          ))}
          {/* hammer between the bells */}
          <group ref={hammer} position={[0, 0.6, -0.02]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.03, 0.2, 0.03]} />
              <meshStandardMaterial color="#9EA3AD" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>
        {/* feet */}
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.09, 0.26, 0.12]} radius={0.04} smoothness={3} position={[s * 0.36, -0.62, 0]} rotation={[0, 0, s * 0.45]}>
            <Shell finish={p.finish} />
          </RoundedBox>
        ))}
      </group>
    </IconMotion>
  );
}
