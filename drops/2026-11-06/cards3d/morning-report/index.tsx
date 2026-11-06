import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Morning Report',
  description: 'Project card for Towline Morning Report, the overnight results digest: a glossy white sealed envelope with a glowing wax seal; the flap peeks open to show the report inside. Light is seeded by the project name.',
  tags: ['card', 'report', 'envelope', 'digest', 'project'],
};

export const schema = beamSchema({ name: 'Morning Report' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'weekly-digest': { name: 'Weekly Digest' },
  'overnight-wins': { name: 'Overnight Wins' },
  sorbet: { lightMode: 'custom', light: '#FF4F6D' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const W = 1.6;
const H = 1.04;
const FLAP_H = 0.66;

/** A soft triangle (rounded tip), pointing down from y = 0. */
function flapShape(w: number, h: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0.09, -h + 0.06);
  s.quadraticCurveTo(0, -h - 0.01, -0.09, -h + 0.06);
  s.closePath();
  return s;
}

export default function MorningReport(p: P) {
  const light = beamLight(p).color;
  const flapGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(flapShape(W - 0.08, FLAP_H), { depth: 0.012, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.018, bevelSegments: 4, curveSegments: 16 });
    return g;
  }, []);
  // Lower fold: a wide shallow triangle rising from the bottom edge.
  const foldGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2 + 0.04, 0);
    s.lineTo(W / 2 - 0.04, 0);
    s.lineTo(0.1, H * 0.46);
    s.quadraticCurveTo(0, H * 0.5, -0.1, H * 0.46);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 12 });
  }, []);
  const sealGeo = useMemo(() => {
    // Wax seal: a scalloped disc with a domed bevel.
    const s = new THREE.Shape();
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 0.17 + Math.sin(a * 9) * 0.013;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.04, bevelSegments: 5, curveSegments: 8 });
  }, []);

  const flap = useRef<THREE.Group>(null);
  const paper = useRef<THREE.Group>(null);
  const seal = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the seal glows with a slow pulse plus a "new report" blink and the flap
  // lifts for a peek once per loop; hover opens the flap and slides the report up;
  // click pops the flap with a flash.
  useLoop((m) => {
    const flash = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 4) : 0;
    const peek = blink(m.t, 0.55, 0.12);
    const open = peek * 0.35 + m.hover * 1.1 + Math.abs(pressBounce(m.pressAge)) * 0.6;
    if (flap.current) flap.current.rotation.x = -open;
    if (paper.current) paper.current.position.y = m.hover * 0.32 + peek * 0.06;
    if (seal.current) seal.current.emissiveIntensity = 1.5 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8 + blink(m.t, 0.2, 0.03) * 1.5 + m.hover * 0.6 + flash * 3.5;
  });

  return (
    <IconMotion seed={84}>
      <group position={[0, -0.22, 0]} rotation={[0.1, -0.3, 0.04]} scale={1.45}>
        {/* report sheet tucked inside; slides up when opened */}
        <group ref={paper}>
          <RoundedBox args={[W - 0.24, H - 0.12, 0.03]} radius={0.012} smoothness={3} position={[0, 0.02, -0.01]}>
            <meshPhysicalMaterial color="#FBFAF7" roughness={0.5} />
          </RoundedBox>
        </group>
        {/* envelope body */}
        <RoundedBox args={[W, H, 0.12]} radius={0.05} smoothness={5}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* lower fold */}
        <mesh geometry={foldGeo} position={[0, -H / 2 + 0.03, 0.062]}>
          <Shell finish={p.finish} color="#ECE9E6" />
        </mesh>
        {/* top flap, hinged at the top edge */}
        <group ref={flap} position={[0, H / 2 - 0.03, 0.075]}>
          <mesh geometry={flapGeo}>
            <Shell finish={p.finish} color="#FAF8F6" />
          </mesh>
          <mesh geometry={sealGeo} position={[0, -FLAP_H + 0.16, 0.03]}>
            <meshStandardMaterial ref={seal} color={light} emissive={light} emissiveIntensity={2} roughness={0.3} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
