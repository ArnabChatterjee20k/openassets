import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Spend Caps',
  description: 'Project card for Mandate Spend Caps: a glossy white padlock with a glowing keyhole; the shackle clicks shut each loop and lifts when you hover.',
  tags: ['card', 'caps', 'guardrails', 'padlock', 'project'],
};

export const schema = beamSchema({ name: 'Spend Caps' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'frequency-caps': { name: 'Frequency Caps' },
  'daily-limits': { name: 'Daily Limits' },
  gold: { lightMode: 'custom', light: '#C9A45C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function SpendCaps(p: P) {
  const light = beamLight(p).color;
  const shackle = useRef<THREE.Group>(null);
  const hole = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Keyhole: a circle over a tapered slot, extruded so it sits proud of the face.
  const keyhole = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0.07, 0.095, 0, Math.PI * 2, false);
    const slot = new THREE.Shape();
    slot.moveTo(-0.045, 0.04);
    slot.lineTo(0.045, 0.04);
    slot.lineTo(0.07, -0.2);
    slot.lineTo(-0.07, -0.2);
    slot.closePath();
    const opts = { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 3, curveSegments: 24 };
    const a = new THREE.ExtrudeGeometry(s, opts);
    const b = new THREE.ExtrudeGeometry(slot, opts);
    return [a, b];
  }, []);

  // Idle: the shackle lifts and clicks shut once per loop; the keyhole flashes
  // on the click and breathes between. Hover holds it open; click snaps it.
  useLoop((m) => {
    const open = Math.max(blink(m.t, 0.75, 0.12), m.hover);
    const lift = open * 0.22 - Math.abs(pressBounce(m.pressAge)) * 0.05;
    if (shackle.current) {
      shackle.current.position.y = 0.42 + lift;
      shackle.current.rotation.y = open * 0.5;
    }
    const click = blink(m.t, 0.87, 0.03);
    const k =1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + click * 2.5 + Math.abs(pressBounce(m.pressAge)) * 3;
    hole.current.forEach((mat) => mat && (mat.emissiveIntensity = k));
  });

  return (
    <IconMotion seed={88} float={0.05}>
      <group position={[0, -0.18, 0]} rotation={[0.1, -0.4, 0]} scale={1.08}>
        {/* shackle: a half torus plus two legs, pivoting on the left leg */}
        <group position={[-0.34, 0, 0]}>
          <group ref={shackle} position={[0, 0.42, 0]}>
            <group position={[0.34, 0, 0]}>
              <mesh position={[0, 0.28, 0]}>
                <torusGeometry args={[0.34, 0.085, 24, 64, Math.PI]} />
                <meshPhysicalMaterial color="#E2E4EA" metalness={0.55} roughness={0.2} clearcoat={1} />
              </mesh>
              {[-0.34, 0.34].map((x) => (
                <mesh key={x} position={[x, 0.07, 0]}>
                  <cylinderGeometry args={[0.085, 0.085, 0.42, 32]} />
                  <meshPhysicalMaterial color="#E2E4EA" metalness={0.55} roughness={0.2} clearcoat={1} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
        {/* body */}
        <RoundedBox args={[1.12, 0.92, 0.46]} radius={0.16} smoothness={6} position={[0, -0.05, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* keyhole: the one glowing accent */}
        <group position={[0, -0.03, 0.225]}>
          {keyhole.map((g, i) => (
            <mesh key={i} geometry={g}>
              <meshStandardMaterial ref={(mat) => void (hole.current[i] = mat)} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.25} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
