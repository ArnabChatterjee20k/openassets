import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Instant Quote',
  description: 'Project card for Redbrick Instant Quote: a glossy white price tag on a string, its grommet glowing in the card light. Upload a STEP file, get a price in seconds.',
  tags: ['card', 'quote', 'price', 'tag', 'project'],
};

export const schema = beamSchema({ name: 'Instant Quote' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'volume-pricing': { name: 'Volume Pricing' },
  'rfq-portal': { name: 'RFQ Portal' },
  brick: { lightMode: 'custom', light: '#C8553D' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8D4CE" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F2EEE8" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F2EE" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function InstantQuote(p: P) {
  const light = beamLight(p).color;
  const tag = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const lines = useRef<THREE.Group>(null);

  // A notched luggage tag: rectangle with the top corners clipped, hole punched.
  const body = useMemo(() => {
    const w = 0.62;
    const h = 1.0;
    const c = 0.22;
    const s = new THREE.Shape();
    s.moveTo(-w, -h);
    s.lineTo(w, -h);
    s.lineTo(w, h - c);
    s.lineTo(w - c * 1.4, h);
    s.lineTo(-w + c * 1.4, h);
    s.lineTo(-w, h - c);
    s.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, h - 0.24, 0.1, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 5, curveSegments: 32 });
    g.translate(0, 0, -0.05);
    return g;
  }, []);

  // Idle: the tag swings on its string, the grommet breathes; the price lines
  // "recalculate" (a blink). Hover brightens; a click flicks the tag.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (tag.current) {
      tag.current.rotation.z = wave(m.t, 1) * 0.09 + press * 0.5;
      tag.current.rotation.y = wave(m.t, 1, 0.25) * 0.12 - 0.12;
    }
    if (ring.current) ring.current.emissiveIntensity = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.9 + m.hover * 1.2 + Math.abs(press) * 2;
    if (lines.current) {
      const b = blink(m.t, 0.6, 0.06);
      lines.current.scale.x = 1 - b * 0.6;
    }
  });

  return (
    <IconMotion seed={11} float={0.05}>
      {/* string from above */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.0, 8]} />
        <meshStandardMaterial color="#8D847A" roughness={0.8} />
      </mesh>
      <group ref={tag} position={[0, 0.75, 0]} rotation={[0, -0.12, 0]}>
        <group position={[0, -1.12, 0]} scale={1.05} rotation={[0.1, -0.5, 0.1]}>
          <mesh geometry={body}>
            <Shell finish={p.finish} />
          </mesh>
          {/* glowing grommet */}
          <mesh position={[0, 0.76, 0.1]}>
            <torusGeometry args={[0.14, 0.055, 20, 48]} />
            <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          {/* price lines, embossed */}
          <group ref={lines} position={[0, -0.05, 0.11]}>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.7, 0.13, 0.03]} />
              <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.7} />
            </mesh>
            <mesh position={[-0.12, -0.08, 0]}>
              <boxGeometry args={[0.46, 0.06, 0.02]} />
              <meshStandardMaterial color="#A49C92" />
            </mesh>
            <mesh position={[-0.05, -0.24, 0]}>
              <boxGeometry args={[0.6, 0.06, 0.02]} />
              <meshStandardMaterial color="#A49C92" />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
