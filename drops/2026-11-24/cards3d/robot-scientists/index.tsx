import { useRef } from 'react';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Robot Scientists',
  description: 'Project card for Benchwire Robot Scientists: a glossy white articulated lab arm with a glowing gripper joint that dips to pipette, lit by beams seeded from the project name.',
  tags: ['card', 'robot', 'automation', 'lab', 'project'],
};

export const schema = beamSchema({ name: 'Robot Scientists' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  workcells: { name: 'Workcells' },
  autolab: { name: 'Autolab Agents' },
  teal: { lightMode: 'custom', light: '#3FA7A0' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.25} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F2F1" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F5F4" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const Dark = () => <meshPhysicalMaterial color="#26302F" roughness={0.35} clearcoat={0.6} />;

export default function RobotScientists(p: P) {
  const light = beamLight(p).color;
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const joint = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the arm dips to pipette twice per loop and the base turns a little; the joint pulses at each dip.
  // Hover lifts it attentively; a click makes it nod.
  useLoop((m) => {
    const dip = wave(m.t, 2) * 0.5 + 0.5;
    const kick = pressBounce(m.pressAge);
    if (shoulder.current) shoulder.current.rotation.y = wave(m.t, 1) * 0.35;
    if (elbow.current) elbow.current.rotation.z = -0.25 - dip * 0.22 + m.hover * 0.15 + kick * 0.4;
    if (wrist.current) wrist.current.rotation.z = -1.0 + dip * 0.3 - m.hover * 0.1;
    if (joint.current) joint.current.emissiveIntensity = 1.2 + blink(m.t, 0.25, 0.06) * 2 + blink(m.t, 0.75, 0.06) * 2 + m.hover + Math.abs(kick) * 3;
  });

  return (
    <IconMotion seed={58} sway={0.06}>
      <group position={[-0.1, -1.05, 0]} rotation={[0.1, -0.5, 0]} scale={1.25}>
        {/* base */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.5, 0.58, 0.16, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        <group ref={shoulder} position={[0, 0.16, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.24, 0.3, 0.32, 40]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* upper arm, tilted */}
          <group position={[0, 0.34, 0]} rotation={[0, 0, 0.38]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.32, 32]} />
              <Dark />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <capsuleGeometry args={[0.12, 0.7, 8, 24]} />
              <Shell finish={p.finish} />
            </mesh>
            {/* elbow */}
            <group ref={elbow} position={[0, 0.86, 0]} rotation={[0, 0, -0.35]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.28, 32]} />
                <Dark />
              </mesh>
              <group rotation={[0, 0, -1.2]}>
                <mesh position={[0, 0.36, 0]}>
                  <capsuleGeometry args={[0.1, 0.56, 8, 24]} />
                  <Shell finish={p.finish} />
                </mesh>
                {/* wrist with the glowing joint ring + pipette tip */}
                <group ref={wrist} position={[0, 0.72, 0]} rotation={[0, 0, -1]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.1, 0.035, 16, 40]} />
                    <meshStandardMaterial ref={joint} color={light} emissive={light} emissiveIntensity={1.6} toneMapped={false} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.085, 0.085, 0.2, 24]} />
                    <Dark />
                  </mesh>
                  <mesh position={[0, 0.18, 0]}>
                    <cylinderGeometry args={[0.07, 0.08, 0.22, 24]} />
                    <Shell finish={p.finish} />
                  </mesh>
                  <mesh position={[0, 0.38, 0]}>
                    <coneGeometry args={[0.05, 0.22, 24]} />
                    <meshPhysicalMaterial color="#E8F1EE" roughness={0.1} transmission={0.6} thickness={0.2} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
