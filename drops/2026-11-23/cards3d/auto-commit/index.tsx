import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Auto Commit',
  description: 'Project card for Latch\'s Auto Commit: a glossy white floppy disk, the save icon made solid, with a label stripe glowing in the seeded light and a shutter that slides open.',
  tags: ['card', 'save', 'commit', 'floppy', 'project'],
};

export const schema = beamSchema({ name: 'Auto Commit' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'wip-snapshots': { name: 'WIP Snapshots' },
  'save-points': { name: 'Save Points' },
  commit: { lightMode: 'custom', light: '#FFDD00', background: '#06142F' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshPhysicalMaterial color="#E4E8EF" metalness={0.85} roughness={0.3} clearcoat={1} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const S = 1.36; // disk size

export default function AutoCommit(p: P) {
  const light = beamLight(p).color;
  const labelMat = useRef<THREE.MeshStandardMaterial>(null);
  const shutter = useRef<THREE.Group>(null);
  const dot = useRef<THREE.MeshStandardMaterial>(null);

  // Body with a clipped top-right corner (the floppy's write-protect bevel).
  const body = useMemo(() => {
    const h = S / 2, c = 0.18, r = 0.08;
    const s = new THREE.Shape();
    s.moveTo(-h + r, -h);
    s.lineTo(h - r, -h);
    s.quadraticCurveTo(h, -h, h, -h + r);
    s.lineTo(h, h - c);
    s.lineTo(h - c, h);
    s.lineTo(-h + r, h);
    s.quadraticCurveTo(-h, h, -h, h - r);
    s.lineTo(-h, -h + r);
    s.quadraticCurveTo(-h, -h, -h + r, -h);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.04, bevelSegments: 5, curveSegments: 8 });
    g.translate(0, 0, -0.05);
    return g;
  }, []);

  // Idle: the shutter slides open and closed once per loop (a save), the label breathes,
  // the write LED blinks; hover brightens; a click slams the shutter and flashes the label.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const open = 0.5 - 0.5 * Math.cos((m.t / 4) * Math.PI * 2); // 0 at rest, fully open mid-loop
    if (shutter.current) shutter.current.position.x = -0.1 + open * 0.34 + press * 0.06;
    if (labelMat.current) labelMat.current.emissiveIntensity = 1.1 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + m.hover * 0.8 + Math.abs(press) * 2;
    if (dot.current) dot.current.emissiveIntensity = 0.8 + blink(m.t, 0.55, 0.05) * 3;
  });

  return (
    <IconMotion seed={58}>
      <group position={[0, -0.08, 0]} rotation={[0.18, -0.42, 0.06]} scale={1.3}>
        <mesh geometry={body}>
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing label stripe on the lower half */}
        <RoundedBox args={[S * 0.74, S * 0.4, 0.03]} radius={0.03} smoothness={4} position={[0, -S * 0.18, 0.1]}>
          <meshStandardMaterial ref={labelMat} color={light} emissive={light} emissiveIntensity={1.2} roughness={0.35} />
        </RoundedBox>
        {/* ruled lines on the label */}
        {[0, 1].map((i) => (
          <mesh key={i} position={[-0.06, -S * 0.12 - i * 0.14, 0.118]}>
            <planeGeometry args={[S * 0.5, 0.025]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.55} />
          </mesh>
        ))}
        {/* metal shutter at the top */}
        <group ref={shutter} position={[-0.1, S * 0.3, 0.08]}>
          <RoundedBox args={[S * 0.5, S * 0.34, 0.05]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.28} />
          </RoundedBox>
          <RoundedBox args={[S * 0.12, S * 0.22, 0.03]} radius={0.01} smoothness={2} position={[S * 0.1, 0, 0.03]}>
            <meshStandardMaterial color="#2A2F3A" roughness={0.5} />
          </RoundedBox>
        </group>
        {/* write LED */}
        <mesh position={[S * 0.38, S * 0.3, 0.1]}>
          <sphereGeometry args={[0.045, 20, 20]} />
          <meshStandardMaterial ref={dot} color={light} emissive={light} emissiveIntensity={1} />
        </mesh>
      </group>
    </IconMotion>
  );
}
