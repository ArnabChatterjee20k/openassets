import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, flicker, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Branch Guard',
  description: 'Project card for Latch\'s Branch Guard: a glossy white shield with a keyhole glowing in the seeded light. Auto-commits never touch main.',
  tags: ['card', 'security', 'shield', 'branch', 'project'],
};

export const schema = beamSchema({ name: 'Branch Guard' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'secret-scan': { name: 'Secret Scan' },
  'main-lock': { name: 'Main Lock' },
  blueprint: { lightMode: 'custom', light: '#7FB2FF', background: '#06142F' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshPhysicalMaterial color="#E4E8EF" metalness={0.85} roughness={0.3} clearcoat={1} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

function shieldShape(w: number, h: number) {
  const s = new THREE.Shape();
  const top = h * 0.5, bot = -h * 0.5;
  s.moveTo(0, top);
  s.bezierCurveTo(w * 0.25, top - h * 0.02, w * 0.4, top - h * 0.1, w * 0.5, top - h * 0.12);
  s.bezierCurveTo(w * 0.52, top - h * 0.5, w * 0.4, bot + h * 0.2, 0, bot);
  s.bezierCurveTo(-w * 0.4, bot + h * 0.2, -w * 0.52, top - h * 0.5, -w * 0.5, top - h * 0.12);
  s.bezierCurveTo(-w * 0.4, top - h * 0.1, -w * 0.25, top - h * 0.02, 0, top);
  return s;
}

function keyholeShape() {
  const s = new THREE.Shape();
  s.absarc(0, 0.08, 0.12, -Math.PI * 0.3, Math.PI * 1.3, false);
  s.lineTo(-0.08, -0.26);
  s.lineTo(0.08, -0.26);
  s.closePath();
  return s;
}

export default function BranchGuard(p: P) {
  const light = beamLight(p).color;
  const keyMat = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);

  const shield = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shieldShape(1.3, 1.55), { depth: 0.16, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.08, bevelSegments: 6, curveSegments: 32 });
    g.center();
    return g;
  }, []);
  const rim = useMemo(() => {
    // a raised inner rim, inset from the edge
    const g = new THREE.ExtrudeGeometry(shieldShape(1.0, 1.2), { depth: 0.02, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4, curveSegments: 32 });
    g.center();
    return g;
  }, []);
  const key = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(keyholeShape(), { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 24 });
    g.center();
    return g;
  }, []);

  // Idle: the keyhole breathes and gives an electric double-flicker once per loop (a
  // blocked push), the halo ring turns slowly; hover brightens; a click flashes it.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    if (keyMat.current) keyMat.current.emissiveIntensity = 1.3 + (wave(m.t, 1) * 0.5 + 0.5) * 0.6 + flicker(m.t, 0.62) * 1.8 + m.hover * 0.9 + press * 2.5;
    if (ring.current) ring.current.rotation.z = (m.t / 4) * Math.PI * 2 * 0.25;
  });

  return (
    <IconMotion seed={66}>
      <group position={[0, -0.06, 0]} rotation={[0.12, -0.38, 0]} scale={1.25}>
        <mesh geometry={shield}>
          <Shell finish={p.finish} />
        </mesh>
        <mesh geometry={rim} position={[0, 0.02, 0.15]}>
          <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
        </mesh>
        <mesh geometry={key} position={[0, 0.02, 0.2]} scale={1.45}>
          <meshStandardMaterial ref={keyMat} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} />
        </mesh>
        {/* a thin glowing ring round the keyhole, dashed by segments so its turn reads */}
        <mesh ref={ring} position={[0, 0.06, 0.2]}>
          <torusGeometry args={[0.36, 0.016, 8, 48, Math.PI * 1.6]} />
          <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.2} />
        </mesh>
      </group>
    </IconMotion>
  );
}
