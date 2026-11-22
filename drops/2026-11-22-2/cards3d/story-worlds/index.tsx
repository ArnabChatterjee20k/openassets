import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Story Worlds',
  description:
    'Project card for Ardor Story Worlds: a crystal orb on a glossy pedestal with a glowing world inside and a tiny moon in orbit, lit by beams seeded from the project name.',
  tags: ['card', 'worlds', 'orb', 'romance', 'project'],
};

export const schema = beamSchema({ name: 'Story Worlds' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'midnight-court': { name: 'The Midnight Court' },
  'neo-seoul': { name: 'Neo-Seoul Rooftops' },
  cherry: { lightMode: 'custom', light: '#E3173E' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function StoryWorlds(p: P) {
  const light = beamLight(p).color;
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const coreMesh = useRef<THREE.Mesh>(null);
  const moon = useRef<THREE.Group>(null);

  // Pedestal profile: a turned base with a waist and a cup for the orb.
  const pedestal = useMemo(() => {
    const prof: [number, number][] = [
      [0, -0.62], [0.62, -0.62], [0.66, -0.58], [0.66, -0.48], [0.6, -0.44], [0.36, -0.38], [0.26, -0.24], [0.26, -0.12], [0.4, -0.04], [0.44, 0.0], [0.4, 0.03], [0, 0.03],
    ];
    return new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72);
  }, []);

  // Idle: the world inside breathes and flares once per loop; the moon orbits.
  // Hover brightens it and speeds the orbit; a click makes the core flash and swell.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    const flare = blink(m.t, 0.55, 0.06);
    if (core.current) core.current.emissiveIntensity = 0.55 + (wave(m.t, 2) * 0.5 + 0.5) * 0.35 + flare * 1.1 + m.hover * 0.8 + press * 2.5;
    if (coreMesh.current) coreMesh.current.scale.setScalar(1 + flare * 0.06 + press * 0.15);
    if (moon.current) moon.current.rotation.y = cycle(m.t, m.hover > 0.5 ? 2 : 1) * Math.PI * 2;
  });

  return (
    <IconMotion seed={88}>
      <group position={[0, -0.22, 0]} scale={1.18}>
        <mesh geometry={pedestal}>
          <Shell finish={p.finish} />
        </mesh>
        {/* glass orb */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.5, 64, 48]} />
          <meshPhysicalMaterial color="#F6F4FF" roughness={0} transmission={0.92} thickness={0.25} ior={1.5} clearcoat={1} iridescence={0.3} />
        </mesh>
        {/* the world inside */}
        <mesh ref={coreMesh} position={[0, 0.5, 0]}>
          <icosahedronGeometry args={[0.15, 3]} />
          <meshStandardMaterial ref={core} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.35} />
        </mesh>
        {/* tilted orbit with a white moon */}
        <group position={[0, 0.5, 0]} rotation={[0.42, 0, -0.32]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.66, 0.018, 12, 96]} />
            <Shell finish={p.finish} />
          </mesh>
          <group ref={moon}>
            <mesh position={[0.66, 0, 0]}>
              <sphereGeometry args={[0.075, 32, 24]} />
              <Shell finish={p.finish} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
