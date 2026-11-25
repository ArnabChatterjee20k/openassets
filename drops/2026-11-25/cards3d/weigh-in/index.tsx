import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Weigh-in',
  description: 'Project card for Satiate Weigh-in: a glossy white bathroom scale with a glowing display and foot pads, lit by beams seeded from the project name. The display blinks its reading; a click squashes the platform.',
  tags: ['card', 'weight', 'scale', 'progress', 'glp-1'],
};

export const schema = beamSchema({ name: 'Weigh-in' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  progress: { name: 'Progress' },
  'body-trends': { name: 'Body Trends' },
  electric: { lightMode: 'custom', light: '#3D5AFE' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.5 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function WeighIn(p: P) {
  const light = beamLight(p).color;
  const disp = useRef<THREE.MeshStandardMaterial>(null);
  const digits = useRef<THREE.Group>(null);
  const plate = useRef<THREE.Group>(null);

  // Idle: the display breathes and blinks the reading; hover brightens; click squashes the plate.
  useLoop((m) => {
    const b = blink(m.t, 0.3, 0.05) + blink(m.t, 0.4, 0.05);
    const press = pressBounce(m.pressAge);
    if (disp.current) disp.current.emissiveIntensity = 1.2 + (wave(m.t, 2) * 0.5 + 0.5) * 0.3 + m.hover * 0.8 + Math.abs(press) * 1.5;
    if (digits.current) digits.current.visible = b < 0.5;
    if (plate.current) plate.current.position.y = -Math.max(0, press) * 0.08;
  });

  return (
    <IconMotion seed={88}>
      <group position={[0, -0.25, 0]} rotation={[0.42, -0.5, 0]} scale={1.08}>
        {/* base and floating top plate: a chunky rounded slab */}
        <RoundedBox args={[1.6, 0.12, 1.7]} radius={0.05} smoothness={4} position={[0, -0.16, 0]}>
          <meshStandardMaterial color="#9EA3AD" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <group ref={plate}>
          <RoundedBox args={[1.7, 0.26, 1.8]} radius={0.12} smoothness={6}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* glowing display near the front edge */}
          <RoundedBox args={[0.7, 0.05, 0.3]} radius={0.02} smoothness={3} position={[0, 0.13, 0.6]}>
            <meshStandardMaterial ref={disp} color={light} emissive={light} emissiveIntensity={1.2} roughness={0.3} />
          </RoundedBox>
          {/* reading as LCD bars */}
          <group ref={digits} position={[0, 0.16, 0.6]}>
            {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
              <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.07, i === 2 ? 0.04 : 0.14]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
          {/* foot pads */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.36, 0.135, -0.2]} rotation={[0, s * -0.12, 0]} scale={[0.22, 0.03, 0.42]}>
              <sphereGeometry args={[1, 40, 20]} />
              <meshPhysicalMaterial color="#AEB5C2" roughness={0.45} clearcoat={0.5} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
