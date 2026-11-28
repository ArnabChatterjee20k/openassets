import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Fulfillment',
  description: 'Project card for Sprue Fulfillment (parts shipped in 5 days): a glossy white parcel with a glowing tape seal and a shipping label, lit by beams seeded from the project name.',
  tags: ['card', 'shipping', 'parcel', 'fulfillment', 'delivery', 'project'],
};

export const schema = beamSchema({ name: 'Fulfillment' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ships-in-5-days': { name: 'Ships in 5 Days' },
  freight: { name: 'Global Freight' },
  lime: { lightMode: 'custom', light: '#B5E550' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1EC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function Fulfillment(p: P) {
  const light = beamLight(p).color;
  const tape = useRef<THREE.MeshStandardMaterial>(null);
  const box = useRef<THREE.Group>(null);
  const tag = useRef<THREE.Group>(null);

  // Idle: the parcel does a little "ready to ship" hop once per loop and the tape seal pulses;
  // hover brightens; a click jolts it like it was just stamped.
  useLoop((m) => {
    const hop = blink(m.t, 0.7, 0.08);
    const click = pressBounce(m.pressAge);
    if (box.current) {
      box.current.position.y = hop * 0.14 + Math.max(0, click) * 0.15;
      box.current.rotation.z = hop * 0.06 - click * 0.12;
    }
    if (tape.current) tape.current.emissiveIntensity = 1.2 + (wave(m.t, 2) * 0.5 + 0.5) * 0.7 + m.hover * 0.9 + hop * 1.2;
    if (tag.current) tag.current.rotation.x = -0.05 + wave(m.t, 1, 0.3) * 0.05 + click * 0.3;
  });

  const tapeMat = <meshStandardMaterial ref={tape} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.35} />;

  return (
    <IconMotion seed={83}>
      <group rotation={[0.32, -0.62, 0]} position={[0, -0.25, 0]} scale={1.4}>
        <group ref={box}>
          <RoundedBox args={[1.3, 0.9, 1.0]} radius={0.07} smoothness={5}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* lid seam */}
          <mesh position={[0, 0.452, 0]}>
            <boxGeometry args={[1.22, 0.004, 0.012]} />
            <meshStandardMaterial color="#B9BDB5" />
          </mesh>
          {/* glowing tape seal: over the top and down the front and back */}
          <mesh position={[0, 0.455, 0]}>
            <boxGeometry args={[0.24, 0.012, 1.02]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.4} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.25, 0.505]}>
            <boxGeometry args={[0.24, 0.42, 0.012]} />
            {tapeMat}
          </mesh>
          {/* shipping label on the side */}
          <group ref={tag} position={[0.655, -0.05, 0.05]}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.52, 0.36]} />
              <meshStandardMaterial color="#E4E6DF" roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
            {[0.09, 0.02, -0.05].map((y, i) => (
              <mesh key={i} position={[0.002, y, i === 0 ? 0.06 : 0.02]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[i === 0 ? 0.22 : 0.4, 0.035]} />
                <meshStandardMaterial color="#8E938B" side={THREE.DoubleSide} />
              </mesh>
            ))}
            <mesh position={[0.002, -0.12, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.36, 0.06]} />
              <meshStandardMaterial color="#2B302C" side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
