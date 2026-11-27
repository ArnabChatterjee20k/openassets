import { useRef } from 'react';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Pipeline Watch',
  description: 'Project card for Plumbline Pipeline Watch: a glossy white pipe elbow with flanged ends and one glowing seal ring that flickers when a leak is spotted.',
  tags: ['card', 'pipeline', 'leak', 'utility', 'project'],
};

export const schema = beamSchema({ name: 'Pipeline Watch' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'leak-detect': { name: 'Leak Detect' },
  'gas-main-7': { name: 'Gas Main 7' },
  alarm: { lightMode: 'custom', light: '#FF2E63' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.5 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F2EE" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const R = 0.55; // bend radius
const PIPE = 0.24;

function Flange({ finish, position, rotation }: { finish: P['finish']; position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[PIPE * 1.55, PIPE * 1.55, 0.1, 48]} />
        <Shell finish={finish} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * PIPE * 1.3, 0.06, Math.sin(a) * PIPE * 1.3]}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
            <meshStandardMaterial color="#9A8F88" metalness={1} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function PipelineWatch(p: P) {
  const light = beamLight(p).color;
  const seal = useRef<THREE.MeshStandardMaterial>(null);
  const sealMesh = useRef<THREE.Mesh>(null);

  // Idle: the seal ring glows steadily with a "detected" double flicker once per loop.
  // Hover brightens it; a click makes the ring pop.
  useLoop((m) => {
    const f = Math.max(blink(m.t, 0.6, 0.03), blink(m.t, 0.66, 0.03) * 0.8);
    if (seal.current) seal.current.emissiveIntensity = 1.3 + (0.5 + 0.5 * wave(m.t, 1)) * 0.5 + f * 2 + m.hover;
    if (sealMesh.current) sealMesh.current.scale.setScalar(1 + Math.abs(pressBounce(m.pressAge)) * 0.25 + f * 0.05);
  });

  return (
    <IconMotion seed={88} float={0.05} sway={0.1}>
      <group position={[0.35, -0.05, 0]} rotation={[0.25, -0.25, 0.12]} scale={1.1}>
        {/* quarter bend */}
        <mesh position={[-R, -R / 2, 0]}>
          <torusGeometry args={[R, PIPE, 32, 64, Math.PI / 2]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* horizontal run toward the left */}
        <mesh position={[-R - 0.35, R / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[PIPE, PIPE, 0.7, 40]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* vertical run down */}
        <mesh position={[0, -R / 2 - 0.35, 0]}>
          <cylinderGeometry args={[PIPE, PIPE, 0.7, 40]} />
          <Shell finish={p.finish} />
        </mesh>
        <Flange finish={p.finish} position={[-R - 0.72, R / 2, 0]} rotation={[0, 0, Math.PI / 2]} />
        <Flange finish={p.finish} position={[0, -R / 2 - 0.72, 0]} rotation={[0, 0, 0]} />
        {/* glowing seal ring at the joint */}
        <mesh ref={sealMesh} position={[-R - 0.02, R / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[PIPE * 1.08, 0.045, 20, 64]} />
          <meshStandardMaterial ref={seal} color={light} emissive={light} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      </group>
    </IconMotion>
  );
}
