import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Creative Studio',
  description: 'Feature card for Mycel Creative Studio, where the agent writes and resizes ad creatives: a glossy white magic wand whose star tip glows in the card light, with twinkling sparkles.',
  tags: ['card', 'creative', 'wand', 'ai', 'feature'],
};

export const schema = beamSchema({ name: 'Creative Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
  sparkles: select(['none', 'few', 'many'], 'Sparkles').default('few'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ad-variants': { name: 'Ad Variants' },
  'brand-kit': { name: 'Brand Kit' },
  ember: { lightMode: 'custom', light: '#FF9F43' },
  chrome: { finish: 'chrome', sparkles: 'many' },
  matte: { finish: 'matte', sparkles: 'none', beams: 0.6 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F5F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCD6" metalness={1} roughness={0.34} envMapIntensity={1.8} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const SPARKS: [number, number, number, number][] = [
  [0.85, 0.6, 0.1, 0.16],
  [0.1, 0.95, -0.1, 0.11],
  [1.05, 0.05, 0.05, 0.12],
  [0.5, 1.1, 0.0, 0.09],
  [1.2, 0.85, -0.1, 0.08],
];

export default function CreativeStudio(p: P) {
  const light = beamLight(p).color;
  const starMat = useRef<THREE.MeshStandardMaterial>(null);
  const star = useRef<THREE.Mesh>(null);
  const sparks = useRef<(THREE.Mesh | null)[]>([]);
  const wand = useRef<THREE.Group>(null);
  const count = p.sparkles === 'none' ? 0 : p.sparkles === 'few' ? 3 : 5;

  const starGeo = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? 0.42 : 0.2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.05, bevelSegments: 5 });
    g.center();
    return g;
  }, []);

  // Idle: the star breathes and turns gently, sparkles twinkle in turn, the wand
  // makes a small flourish. Hover brightens; a click casts (a flick + flash).
  useLoop((m) => {
    const kick = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 4) : 0;
    if (starMat.current) starMat.current.emissiveIntensity = 0.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.45 + m.hover * 0.4 + kick * 1.5;
    if (star.current) {
      star.current.rotation.z = wave(m.t, 1) * 0.15;
      star.current.scale.setScalar(1 + kick * 0.25 + m.hover * 0.05);
    }
    if (wand.current) wand.current.rotation.z = wave(m.t, 1, 0.1) * 0.05 + pressBounce(m.pressAge) * 0.35;
    sparks.current.forEach((s, i) => {
      if (!s) return;
      const tw = blink(m.t, (i * 0.21 + 0.1) % 1, 0.09) + blink(m.t, (i * 0.21 + 0.6) % 1, 0.09);
      s.scale.setScalar(Math.max(0.001, 0.35 + tw * 0.8 + kick * 0.6 + m.hover * 0.2));
      s.rotation.z = (m.t / 4) * Math.PI * 2 * (i % 2 ? 1 : -1);
    });
  });

  return (
    <IconMotion seed={88}>
      <group position={[-0.05, -0.28, 0]} rotation={[0.2, -0.3, 0]} scale={1.3}>
        <group ref={wand} rotation={[0, 0, -0.75]}>
          {/* shaft: white handle, a glowing band, a tip ferrule */}
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 1.45, 40]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, -0.95, 0]}>
            <sphereGeometry args={[0.125, 32, 16]} />
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.112, 0.112, 0.1, 40]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.45} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.055, 0.085, 0.12, 32]} />
            <Shell finish={p.finish} color="#E3E5DF" />
          </mesh>
          {/* star tip */}
          <mesh ref={star} geometry={starGeo} position={[0, 0.82, 0]}>
            <meshPhysicalMaterial ref={starMat} color={light} emissive={light} emissiveIntensity={0.6} roughness={0.25} clearcoat={1} />
          </mesh>
        </group>
        {SPARKS.slice(0, count).map(([x, y, z, s], i) => (
          <mesh key={i} ref={(el) => void (sparks.current[i] = el)} position={[x, y, z]}>
            <octahedronGeometry args={[s, 0]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.7} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
