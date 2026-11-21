import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Budget Caps',
  description: 'Feature card for Multiball Budget Caps: a big white arcade token standing on edge with a glowing inlaid star, slowly turning; lit by beams seeded from the project name.',
  tags: ['card', 'budget', 'token', 'coin', 'spend', 'ad agent'],
};

export const schema = beamSchema({ name: 'Budget Caps' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'spend-guard': { name: 'Spend Guard' },
  'free-play': { name: 'Free Play' },
  sunflower: { lightMode: 'custom', light: '#FFC93C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function BudgetCaps(p: P) {
  const light = beamLight(p).color;
  const coin = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);

  const { body, rim, star } = useMemo(() => {
    // Coin body: a lathe with a raised rim on both faces, axis along y → rotate to face camera.
    const prof: [number, number][] = [
      [0, -0.1],
      [0.62, -0.1],
      [0.7, -0.13],
      [0.76, -0.1],
      [0.78, 0],
      [0.76, 0.1],
      [0.7, 0.13],
      [0.62, 0.1],
      [0, 0.1],
    ];
    const body = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72);
    const rim = new THREE.TorusGeometry(0.5, 0.025, 12, 72);
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 === 0 ? 0.36 : 0.15;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    const star = new THREE.ExtrudeGeometry(s, { depth: 0.24, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 });
    star.center();
    return { body, rim, star };
  }, []);

  // Idle: the token rocks a quarter-turn and back (shows its edge); the star breathes.
  // Hover brightens; a click flips it.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (coin.current) coin.current.rotation.y = -0.45 + wave(m.t, 1) * 0.5 + press * 2.2;
    if (glow.current) glow.current.emissiveIntensity = 0.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + m.hover * 0.6 + Math.abs(press) * 1.2;
  });

  return (
    <IconMotion seed={47}>
      <group position={[0, -0.1, 0]} rotation={[0.12, 0, 0.08]} scale={1.4}>
        <group ref={coin}>
          <mesh geometry={body} rotation={[Math.PI / 2, 0, 0]}>
            <Shell finish={p.finish} />
          </mesh>
          {[0.105, -0.105].map((z) => (
            <mesh key={z} geometry={rim} position={[0, 0, z]}>
              <Shell finish={p.finish} />
            </mesh>
          ))}
          {/* glowing inlaid star, passing through so both faces show it */}
          <mesh geometry={star}>
            <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
