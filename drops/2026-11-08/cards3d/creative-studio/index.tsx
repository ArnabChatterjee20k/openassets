import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Creative Studio',
  description:
    'Project card for Lanternfish Creative Studio: a glossy white clam shell holding a glowing pearl (the winning ad), lit by beams seeded from the project name. The pearl breathes, the shell peeks open on hover and pops on click.',
  tags: ['card', 'creatives', 'pearl', 'shell', 'project', 'deep sea'],
};

export const schema = beamSchema({ name: 'Creative Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ad-variants': { name: 'Ad Variants' },
  'pearl-lab': { name: 'Pearl Lab' },
  photophore: { lightMode: 'custom', light: '#2EF2C4', background: '#021B26' },
  coral: { lightMode: 'custom', light: '#FF7A59', finish: 'matte' },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F4F6' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} side={THREE.DoubleSide} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" side={THREE.DoubleSide} />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
}

/** One half of the clam: a shallow fluted dome (ribs via a wavy radius). */
function Valve({ finish, flip }: { finish: P['finish']; flip?: boolean }) {
  return (
    <group scale={[1, flip ? -0.42 : 0.42, 0.86]}>
      <mesh>
        <sphereGeometry args={[0.82, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Shell finish={finish} />
      </mesh>
      {/* fluted ribs radiating over the dome toward the front edge */}
      {/* rim lip */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1 / 0.42]}>
        <torusGeometry args={[0.815, 0.03, 12, 72]} />
        <Shell finish={finish} color="#E3E4E9" />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const a = ((i - 4) / 4) * 1.3 - Math.PI / 2;
        return (
          <mesh key={i} rotation={[0, a, 0]}>
            <torusGeometry args={[0.815, 0.028, 10, 40, Math.PI / 2.3]} />
            <Shell finish={finish} color="#E9E9EE" />
          </mesh>
        );
      })}
    </group>
  );
}

export default function CreativeStudio(p: P) {
  const light = beamLight(p).color;
  const lid = useRef<THREE.Group>(null);
  const pearl = useRef<THREE.Mesh>(null);
  const pearlMat = useRef<THREE.MeshPhysicalMaterial>(null);

  // Idle: the pearl breathes; the lid lifts a touch once per loop like it's
  // breathing too. Hover opens the shell wider; a click pops the pearl.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (lid.current) lid.current.rotation.x = -0.62 - (wave(m.t, 1) * 0.5 + 0.5) * 0.08 - m.hover * 0.25 - Math.abs(press) * 0.2;
    if (pearlMat.current) pearlMat.current.emissiveIntensity = 0.5 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + m.hover * 0.5 + Math.abs(press) * 1.5;
    if (pearl.current) pearl.current.position.y = 0.2 + Math.max(0, press) * 0.25 + wave(m.t, 2, 0.25) * 0.015;
  });

  return (
    <IconMotion seed={61}>
      <group rotation={[0.5, -0.18, 0]} position={[0, -0.42, 0]} scale={1.5}>
        {/* bottom valve */}
        <Valve finish={p.finish} flip />
        {/* lid, hinged at the back edge */}
        <group ref={lid} position={[0, 0, -0.68]} rotation={[-0.62, 0, 0]}>
          <group position={[0, 0, 0.68]}>
            <Valve finish={p.finish} />
          </group>
        </group>
        {/* hinge knuckle */}
        <mesh position={[0, 0, -0.7]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.42, 24]} />
          <Shell finish={p.finish} color="#E3E4E9" />
        </mesh>
        {/* the pearl: the one glowing accent */}
        <mesh ref={pearl} position={[0, 0.2, 0.05]}>
          <sphereGeometry args={[0.27, 48, 32]} />
          <meshPhysicalMaterial ref={pearlMat} color={light} emissive={light} emissiveIntensity={0.9} roughness={0.12} clearcoat={1} iridescence={0.4} toneMapped={false} />
        </mesh>
      </group>
    </IconMotion>
  );
}
