import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Chapter Pass',
  description:
    'Project card for the Ardor Chapter Pass subscription: a glossy white hardback with a glowing bookmark ribbon that sways, lit by beams seeded from the project name.',
  tags: ['card', 'subscription', 'book', 'chapters', 'project'],
};

export const schema = beamSchema({ name: 'Chapter Pass' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'daily-chapters': { name: 'Daily Chapters' },
  'love-letters': { name: 'Love Letters' },
  gold: { lightMode: 'custom', light: '#F7B32B' },
  matte: { finish: 'matte', beams: 0.6 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function ChapterPass(p: P) {
  const light = beamLight(p).color;
  const ribbon = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const cover = useRef<THREE.Group>(null);

  // A ribbon with a swallowtail end, as a thin extruded strip.
  const ribbonGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.1, 0);
    s.lineTo(0.1, 0);
    s.lineTo(0.1, -0.46);
    s.lineTo(0, -0.36);
    s.lineTo(-0.1, -0.46);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 2 });
  }, []);

  const heartGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.55);
    s.bezierCurveTo(0.15, 1.0, 1.0, 1.0, 1.0, 0.35);
    s.bezierCurveTo(1.0, -0.1, 0.4, -0.45, 0, -0.9);
    s.bezierCurveTo(-0.4, -0.45, -1.0, -0.1, -1.0, 0.35);
    s.bezierCurveTo(-1.0, 1.0, -0.15, 1.0, 0, 0.55);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 5, curveSegments: 32 });
    g.center();
    return g;
  }, []);

  // Idle: the ribbon sways and glows; the cover peeks open once per loop.
  // Hover holds the cover ajar and brightens the ribbon; a click flips it wider.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (ribbon.current) ribbon.current.rotation.z = wave(m.t, 1) * 0.12 + press * 0.4;
    if (glow.current) glow.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + m.hover * 0.8 + Math.abs(press) * 2;
    if (cover.current) cover.current.rotation.y = -(blink(m.t, 0.6, 0.08) * 0.22 + m.hover * 0.25 + Math.abs(press) * 0.5);
  });

  const W = 1.2;
  const H = 1.5;
  const D = 0.5;
  return (
    <IconMotion seed={52}>
      <group position={[0, -0.02, 0]} rotation={[0.18, 0.78, -0.12]} scale={1.12}>
        {/* page block, cream, slightly inset */}
        <RoundedBox args={[W - 0.08, H - 0.1, D - 0.1]} radius={0.03} smoothness={4} position={[0.02, 0, 0]}>
          <meshPhysicalMaterial color="#F3E7DC" roughness={0.6} />
        </RoundedBox>
        {/* page lines on the fore-edge */}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[W / 2 - 0.019, 0, -D / 2 + 0.08 + i * 0.033]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.004, H - 0.16]} />
            <meshStandardMaterial color="#D8C6B6" />
          </mesh>
        ))}
        {/* back cover */}
        <RoundedBox args={[W, H, 0.06]} radius={0.025} smoothness={4} position={[0, 0, -D / 2 + 0.03]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* spine */}
        <RoundedBox args={[0.1, H, D]} radius={0.045} smoothness={5} position={[-W / 2 + 0.02, 0, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* front cover, hinged at the spine */}
        <group ref={cover} position={[-W / 2, 0, D / 2 - 0.03]}>
          <RoundedBox args={[W, H, 0.06]} radius={0.025} smoothness={4} position={[W / 2, 0, 0]}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* raised heart emblem on the cover */}
          <mesh geometry={heartGeo} position={[W / 2 + 0.04, 0.08, 0.03]} scale={0.32}>
            <Shell finish={p.finish} color="#ECE6E6" />
          </mesh>
        </group>
        {/* glowing bookmark ribbon hanging from the top of the pages */}
        <group ref={ribbon} position={[0.22, -H / 2 + 0.06, D / 2 - 0.07]}>
          <mesh geometry={ribbonGeo}>
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
