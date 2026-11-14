import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Finder',
  description:
    "Project card for Plotwell's audience discovery: a glossy white map pin with a glowing core, dropping pulse rings where the agent finds buyers, lit by beams seeded from the project name.",
  tags: ['card', 'audience', 'targeting', 'geo', 'project'],
};

export const schema = beamSchema({ name: 'Audience Finder' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'geo-targeting': { name: 'Geo Targeting' },
  lookalikes: { name: 'Lookalikes' },
  highlighter: { lightMode: 'custom', light: '#FFDD00' },
  cyanotype: { lightMode: 'custom', light: '#7FB2FF', background: '#061634' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshPhysicalMaterial color="#E4E8EF" metalness={0.75} roughness={0.28} clearcoat={1} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AudienceFinder(p: P) {
  const light = beamLight(p).color;
  const pin = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);

  // Teardrop lathe: round head tapering to a point at y = 0.
  const pinGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const R = 0.5;
    const cy = 1.0;
    // round top (from the pole down past the equator)
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * (Math.PI * 0.72);
      pts.push(new THREE.Vector2(Math.sin(a) * R, cy + Math.cos(a) * R));
    }
    // taper to the tip
    const last = pts[pts.length - 1];
    for (let i = 1; i <= 16; i++) {
      const u = i / 16;
      const x = last.x * (1 - u) * (1 - u * 0.15);
      const y = last.y * (1 - u);
      pts.push(new THREE.Vector2(Math.max(0.001, x), y));
    }
    // Lathe wants the profile bottom → top for outward-facing normals.
    return new THREE.LatheGeometry(pts.reverse(), 64);
  }, []);

  // Idle: the pin bobs a little and taps down twice per loop, each tap sends a
  // ground ring out. Hover lifts it and brightens the core; click drops it hard.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    const tap = Math.pow(Math.max(0, wave(m.t, 2, 0.25)), 6);
    if (pin.current) {
      pin.current.position.y = 0.12 - tap * 0.08 + m.hover * 0.08 - b * 0.08;
      pin.current.rotation.y = wave(m.t, 1) * 0.35;
    }
    const flash = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 3) * 3 : 0;
    if (core.current) core.current.emissiveIntensity = 1.8 + tap * 1.4 + m.hover * 1 + flash;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const k = cycle(m.t, 2, i * 0.5);
      r.scale.setScalar(0.25 + k * 1.0);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - k) * (0.6 + m.hover * 0.3);
    });
  });

  return (
    <IconMotion seed={71} float={0.03}>
      <group position={[0, -0.95, 0]} rotation={[0.18, 0, 0]} scale={1.25}>
        {/* ground pulse rings */}
        {[0, 1].map((i) => (
          <mesh key={i} ref={(el) => { rings.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[0.55, 0.6, 64]} />
            <meshBasicMaterial color={light} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {/* landing dot */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <circleGeometry args={[0.07, 32]} />
          <meshBasicMaterial color={light} />
        </mesh>
        <group ref={pin} position={[0, 0.12, 0]}>
          <mesh geometry={pinGeo}>
            <Shell finish={p.finish} />
          </mesh>
          {/* glowing core set into the head, front and back */}
          {[0.455, -0.455].map((z) => (
            <mesh key={z} position={[0, 1.0, z]}>
              <torusGeometry args={[0.2, 0.035, 20, 48]} />
              <meshPhysicalMaterial color="#C9CDD5" metalness={0.8} roughness={0.25} clearcoat={1} />
            </mesh>
          ))}
          <mesh position={[0, 1.0, 0]} scale={[1, 1, 3.05]}>
            <sphereGeometry args={[0.17, 32, 16]} />
            <meshStandardMaterial ref={core} color={light} emissive={light} emissiveIntensity={2} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
