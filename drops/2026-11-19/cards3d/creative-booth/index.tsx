import { useRef } from 'react';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Creative Booth',
  description: 'Project card for Crossfade Creative Booth, where the agent writes and renders ad creatives: a glossy studio microphone with a glowing grille band, lit by beams seeded from the project name.',
  tags: ['card', 'creatives', 'microphone', 'copywriting', 'project'],
};

export const schema = beamSchema({ name: 'Creative Booth' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'hook-writer': { name: 'Hook Writer' },
  'voiceover-lab': { name: 'Voiceover Lab' },
  rose: { lightMode: 'custom', light: '#E5487A' },
  matte: { finish: 'matte', beams: 0.6 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function CreativeBooth(p: P) {
  const light = beamLight(p).color;
  const band = useRef<THREE.MeshStandardMaterial>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const head = useRef<THREE.Group>(null);

  // Idle: the grille band pulses like a voice level, the ON-AIR LED blinks.
  // Hover brightens the band; a click makes the head nod in its yoke.
  useLoop((m) => {
    const voice = Math.abs(wave(m.t, 4)) * 0.6 + Math.abs(wave(m.t, 2, 0.3)) * 0.4;
    if (band.current) band.current.emissiveIntensity = 0.9 + voice * 1.6 + m.hover * 1.2;
    if (led.current) led.current.emissiveIntensity = 0.6 + blink(m.t, 0.5, 0.08) * 3;
    if (head.current) head.current.rotation.x = -0.12 + wave(m.t, 1, 0.1) * 0.05 + pressBounce(m.pressAge) * 0.35;
  });

  return (
    <IconMotion seed={63}>
      <group position={[0, -0.05, 0]} rotation={[0.08, -0.3, 0]} scale={1.15}>
        {/* base + stand */}
        <mesh position={[0, -0.92, 0]}>
          <cylinderGeometry args={[0.5, 0.56, 0.12, 48]} />
          <Shell finish={p.finish} color="#E6E3E0" />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.55, 24]} />
          <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
        </mesh>
        {/* yoke */}
        <mesh position={[0, -0.12, 0]} rotation={[0, Math.PI / 2, Math.PI]}>
          <torusGeometry args={[0.46, 0.045, 16, 48, Math.PI]} />
          <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <sphereGeometry args={[0.08, 24, 16]} />
          <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
        </mesh>
        {/* mic head */}
        <group ref={head} position={[0, -0.05, 0]}>
          <mesh position={[0, 0.12, 0]}>
            <capsuleGeometry args={[0.38, 0.7, 12, 40]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* grille ribs on the upper dome */}
          {[0.32, 0.46, 0.6].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[Math.sqrt(Math.max(0.02, 0.385 * 0.385 - Math.max(0, y - 0.47) ** 2)), 0.012, 8, 48]} />
              <Shell finish={p.finish} color="#DAD6D2" />
            </mesh>
          ))}
          {/* glowing band */}
          <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.385, 0.075, 16, 64]} />
            <meshStandardMaterial ref={band} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.25} />
          </mesh>
          {/* ON-AIR LED */}
          <mesh position={[0, -0.28, 0.37]}>
            <sphereGeometry args={[0.045, 16, 12]} />
            <meshStandardMaterial ref={led} color={light} emissive={light} emissiveIntensity={1} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
