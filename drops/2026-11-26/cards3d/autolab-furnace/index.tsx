import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Autolab Furnace',
  description: "Project card for Ternary's Autolab: a glossy white tube furnace with a glowing sight port that breathes with heat, lit by beams seeded from the project name.",
  tags: ['card', 'furnace', 'autonomous lab', 'materials', 'project'],
};

export const schema = beamSchema({ name: 'Autolab Furnace' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'kiln-02': { name: 'Kiln 02' },
  sintering: { name: 'Sintering Queue' },
  furnace: { lightMode: 'custom', light: '#D96C3D' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEE8" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F2EE" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AutolabFurnace(p: P) {
  const light = beamLight(p).color;
  const port = useRef<THREE.MeshStandardMaterial>(null);
  const tubeGlow = useRef<THREE.MeshStandardMaterial>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the port breathes with heat, the status LED blinks; hover heats it; click flares the port.
  useLoop((m) => {
    const flare = Math.abs(pressBounce(m.pressAge));
    const heat = 0.5 + 0.5 * wave(m.t, 2);
    if (port.current) port.current.emissiveIntensity = 1.3 + heat * 0.9 + m.hover * 1.2 + flare * 3;
    if (tubeGlow.current) tubeGlow.current.emissiveIntensity = 0.6 + heat * 0.6 + m.hover * 0.8 + flare * 2;
    if (led.current) led.current.emissiveIntensity = 0.3 + blink(m.t, 0.3, 0.05) * 3 + blink(m.t, 0.8, 0.05) * 3;
  });

  return (
    <IconMotion seed={41}>
      <group rotation={[0.22, -0.42, 0]} position={[0, -0.32, 0]} scale={1.25}>
        {/* body */}
        <RoundedBox args={[1.5, 0.95, 0.85]} radius={0.16} smoothness={5}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* ceramic work tube running through */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 2.2, 40]} />
          <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
        </mesh>
        {/* flange caps */}
        {[-1.1, 1.1].map((x) => (
          <mesh key={x} rotation={[0, 0, Math.PI / 2]} position={[x, 0.08, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 40]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.28} />
          </mesh>
        ))}
        {/* glowing tube mouth on the near flange */}
        <mesh rotation={[0, Math.PI / 2, 0]} position={[1.145, 0.08, 0]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial ref={tubeGlow} color={light} emissive={light} emissiveIntensity={1} />
        </mesh>
        {/* sight port: bezel + glowing glass */}
        {/* furnace door: a raised panel with a wide glowing heat slot */}
        <RoundedBox args={[0.95, 0.62, 0.08]} radius={0.05} smoothness={4} position={[-0.12, -0.04, 0.44]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        <RoundedBox args={[0.7, 0.16, 0.04]} radius={0.06} smoothness={4} position={[-0.12, -0.04, 0.48]}>
          <meshStandardMaterial ref={port} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </RoundedBox>
        {/* door handle */}
        <mesh position={[-0.12, 0.2, 0.5]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.025, 0.4, 8, 16]} />
          <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
        </mesh>
        {/* vent slits */}
        {[0.12, 0.0, -0.12].map((y) => (
          <RoundedBox key={y} args={[0.18, 0.04, 0.02]} radius={0.015} smoothness={2} position={[0.52, y - 0.08, 0.43]}>
            <meshStandardMaterial color="#9EA3AD" />
          </RoundedBox>
        ))}
        <mesh position={[0.52, 0.24, 0.43]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial ref={led} color={light} emissive={light} emissiveIntensity={1} />
        </mesh>
        {/* feet */}
        {[-0.55, 0.55].map((x) => (
          <RoundedBox key={x} args={[0.22, 0.12, 0.7]} radius={0.04} smoothness={3} position={[x, -0.52, 0]}>
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.3} />
          </RoundedBox>
        ))}
      </group>
    </IconMotion>
  );
}
