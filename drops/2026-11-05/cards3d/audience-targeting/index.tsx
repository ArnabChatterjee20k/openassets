import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Targeting',
  description: 'Feature card for Mycel Audience Targeting: a glossy white bullseye with a dart in its glowing centre, which pulses in the card light. Light is seeded from the project name.',
  tags: ['card', 'audience', 'target', 'bullseye', 'feature'],
};

export const schema = beamSchema({ name: 'Audience Targeting' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
  dart: select(['show', 'hide'], 'Dart').default('show'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lookalikes: { name: 'Lookalikes' },
  retargeting: { name: 'Retargeting' },
  fern: { lightMode: 'custom', light: '#4E8A5B' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', dart: 'hide', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F5F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCD6" metalness={1} roughness={0.34} envMapIntensity={1.8} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function AudienceTargeting(p: P) {
  const light = beamLight(p).color;
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const rippleMat = useRef<THREE.MeshStandardMaterial>(null);
  const dart = useRef<THREE.Group>(null);

  // Idle: the centre pulses and a ring of light ripples outward twice per loop.
  // Hover brightens it; a click thunks the dart (it shivers) and flashes the core.
  useLoop((m) => {
    const kick = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 4) : 0;
    if (core.current) core.current.emissiveIntensity = 0.5 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + m.hover * 0.4 + kick * 1.5;
    const u = ((m.t / 4) * 2) % 1;
    if (ripple.current) ripple.current.scale.setScalar(0.3 + u * 0.75);
    if (rippleMat.current) rippleMat.current.opacity = (1 - u) * (0.7 + m.hover * 0.3);
    if (dart.current) {
      const shiver = pressBounce(m.pressAge);
      dart.current.rotation.x = 0.55 + shiver * 0.18 + wave(m.t, 1) * 0.02;
      dart.current.rotation.y = -0.35 + shiver * 0.12;
    }
  });

  const rings = [0.82, 0.62, 0.42];

  return (
    <IconMotion seed={12}>
      <group position={[0, -0.2, 0]} rotation={[0.08, -0.38, 0]} scale={1.12}>
        {/* board */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.2, 72]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* raised concentric rings */}
        {rings.map((r, i) => (
          <mesh key={r} position={[0, 0, 0.1 + i * 0.03]}>
            <torusGeometry args={[r, 0.045, 16, 96]} />
            <Shell finish={p.finish} color={i % 2 ? '#F4F5F2' : '#DDE0D8'} />
          </mesh>
        ))}
        {/* glowing centre */}
        <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 48]} />
          <meshStandardMaterial ref={core} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
        </mesh>
        <mesh ref={ripple} position={[0, 0, 0.13]}>
          <ringGeometry args={[0.92, 1, 64]} />
          <meshStandardMaterial ref={rippleMat} color={light} emissive={light} emissiveIntensity={1.2} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* stand */}
        <mesh position={[0, -0.95, -0.15]}>
          <cylinderGeometry args={[0.32, 0.42, 0.12, 40]} />
          <Shell finish={p.finish} color="#E3E5DF" />
        </mesh>
        {/* dart: tip buried in the centre, shaft angled toward the viewer */}
        {p.dart === 'show' && (
          <group ref={dart} position={[0.04, 0.03, 0.2]} rotation={[0.55, -0.35, 0]}>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh position={[0, 0.06, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.035, 0.14, 16]} />
                <meshStandardMaterial color="#C9CCC4" metalness={1} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.05, 0.035, 0.5, 24]} />
                <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
              </mesh>
              {[0, 1, 2].map((k) => (
                <mesh key={k} position={[0, 0.66, 0]} rotation={[0, (k * Math.PI * 2) / 3, 0]}>
                  <boxGeometry args={[0.24, 0.2, 0.012]} />
                  <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.6} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          </group>
        )}
      </group>
    </IconMotion>
  );
}
