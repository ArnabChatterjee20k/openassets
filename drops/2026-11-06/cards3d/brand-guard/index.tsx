import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Brand Guard',
  description: 'Project card for Towline Brand Guard, the brand-safety check that runs before anything goes live: a glossy white shield with a glowing keyhole gem. Light is seeded by the project name.',
  tags: ['card', 'brand-safety', 'shield', 'security', 'project'],
};

export const schema = beamSchema({ name: 'Brand Guard' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'safe-launch': { name: 'Safe Launch' },
  'policy-check': { name: 'Policy Check' },
  teal: { lightMode: 'custom', light: '#2EC4B6' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** Classic heater shield outline, centred on the origin. */
function shieldShape(w: number, h: number) {
  const s = new THREE.Shape();
  const top = h * 0.5;
  const bot = -h * 0.5;
  s.moveTo(0, top);
  s.quadraticCurveTo(w * 0.28, top - h * 0.02, w * 0.5, top - h * 0.1);
  s.lineTo(w * 0.5, top - h * 0.38);
  s.bezierCurveTo(w * 0.5, bot + h * 0.3, w * 0.22, bot + h * 0.08, 0, bot);
  s.bezierCurveTo(-w * 0.22, bot + h * 0.08, -w * 0.5, bot + h * 0.3, -w * 0.5, top - h * 0.38);
  s.lineTo(-w * 0.5, top - h * 0.1);
  s.quadraticCurveTo(-w * 0.28, top - h * 0.02, 0, top);
  return s;
}

function keyholeShape() {
  const s = new THREE.Shape();
  s.absarc(0, 0.07, 0.1, -Math.PI * 0.28, Math.PI * 1.28, false);
  s.lineTo(-0.065, -0.2);
  s.lineTo(0.065, -0.2);
  s.closePath();
  return s;
}

export default function BrandGuard(p: P) {
  const light = beamLight(p).color;
  const body = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shieldShape(1.3, 1.55), { depth: 0.16, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.08, bevelSegments: 6, curveSegments: 32 });
    g.translate(0, 0, -0.08);
    return g;
  }, []);
  const face = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shieldShape(1.02, 1.24), { depth: 0.04, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 5, curveSegments: 32 });
    g.translate(0, -0.02, 0.12);
    return g;
  }, []);
  const key = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(keyholeShape(), { depth: 0.04, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.03, bevelSegments: 4, curveSegments: 24 });
    g.translate(0, 0, 0.2);
    return g;
  }, []);

  const gem = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const spin = useRef<THREE.Group>(null);

  // Idle: the keyhole breathes twice per loop with a quick "check passed" blink;
  // hover holds it bright; click flashes it and gives the shield a half-turn wobble.
  useLoop((m) => {
    const flash = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 4) : 0;
    const pulse = wave(m.t, 2) * 0.5 + 0.5;
    const k = pulse * 0.9 + blink(m.t, 0.82, 0.03) * 1.6 + m.hover * 0.9 + flash * 4;
    if (gem.current) gem.current.emissiveIntensity = 0.9 + k * 0.7;
    if (halo.current) halo.current.scale.setScalar(1 + pulse * 0.08 + flash * 0.5);
    if (haloMat.current) haloMat.current.opacity = 0.35 + pulse * 0.35 + m.hover * 0.2 + flash * 0.4;
    if (spin.current) spin.current.rotation.y = pressBounce(m.pressAge) * 0.35;
  });

  return (
    <IconMotion seed={63}>
      <group position={[0, -0.2, 0]} rotation={[0.08, -0.32, 0]} scale={1.2}>
        <group ref={spin}>
          <mesh geometry={body}>
            <Shell finish={p.finish} />
          </mesh>
          <mesh geometry={face}>
            <Shell finish={p.finish} color="#FBFAF8" />
          </mesh>
          {/* glowing keyhole gem + soft halo behind it */}
          {/* dark lens the keyhole sits in, so the glow has contrast */}
          <mesh position={[0, 0.02, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.04, 48]} />
            <meshPhysicalMaterial color="#1A1418" roughness={0.3} clearcoat={1} />
          </mesh>
          <mesh ref={halo} position={[0, 0.02, 0.215]}>
            <ringGeometry args={[0.24, 0.3, 48]} />
            <meshBasicMaterial ref={haloMat} color={light} transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <mesh geometry={key} position={[0, 0.02, 0]}>
            <meshStandardMaterial ref={gem} color={light} emissive={light} emissiveIntensity={1.2} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
