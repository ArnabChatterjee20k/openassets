import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Access Policies',
  description: 'Project card for Ambit Access Policies: a glossy white padlock with a glowing keyhole that clicks open and shut.',
  tags: ['card', 'security', 'policy', 'padlock', 'governance'],
};

export const schema = beamSchema({ name: 'Access Policies' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'sso-scim': { name: 'SSO & SCIM' },
  'data-guard': { name: 'Data Guard' },
  teal: { lightMode: 'custom', light: '#2EC4B6' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#E4E7EE" metalness={0.85} roughness={0.28} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFF6" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AccessPolicies(p: P) {
  const light = beamLight(p).color;
  const shackle = useRef<THREE.Group>(null);
  const glow = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Keyhole: a circle over a tapered slot, extruded.
  const keyhole = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0.06, 0.085, 0, Math.PI * 2, false);
    const slot = new THREE.Shape();
    slot.moveTo(-0.04, 0.04);
    slot.lineTo(0.04, 0.04);
    slot.lineTo(0.065, -0.17);
    slot.lineTo(-0.065, -0.17);
    slot.closePath();
    const opts = { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 3 };
    return [new THREE.ExtrudeGeometry(s, opts), new THREE.ExtrudeGeometry(slot, opts)];
  }, []);

  // Idle: the keyhole breathes and once per loop the shackle pops up and clicks
  // back. Hover holds it a little open; a click springs it.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const pop = blink(m.t, 0.55, 0.08);
    const lift = pop * 0.12 + m.hover * 0.06 + Math.max(0, press) * 0.25;
    if (shackle.current) {
      shackle.current.position.y = lift;
      shackle.current.rotation.y = lift * 2.2;
    }
    const e = 1.5 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8 + pop * 1.4 + m.hover * 0.8;
    glow.current.forEach((mt) => mt && (mt.emissiveIntensity = e));
  });

  return (
    <IconMotion seed={91} float={0.05}>
      <group position={[0, -0.3, 0]} rotation={[0.1, -0.4, 0]} scale={1.3}>
        {/* shackle: a half torus with two legs; pivots around the left leg */}
        <group position={[-0.28, 0, 0]}>
          <group ref={shackle}>
            <group position={[0.28, 0, 0]}>
              <mesh position={[0, 0.5, 0]}>
                <torusGeometry args={[0.28, 0.075, 24, 48, Math.PI]} />
                <meshStandardMaterial color="#E6E8EE" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position={[-0.28, 0.34, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.32, 24]} />
                <meshStandardMaterial color="#E6E8EE" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position={[0.28, 0.34, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.32, 24]} />
                <meshStandardMaterial color="#E6E8EE" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          </group>
        </group>
        {/* body */}
        <RoundedBox args={[0.9, 0.78, 0.36]} radius={0.14} smoothness={6} position={[0, -0.05, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* glowing keyhole */}
        <group position={[0, -0.04, 0.17]}>
          {keyhole.map((g, i) => (
            <mesh key={i} geometry={g}>
              <meshStandardMaterial ref={(mt) => void (glow.current[i] = mt)} color={light} emissive={light} emissiveIntensity={1.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
