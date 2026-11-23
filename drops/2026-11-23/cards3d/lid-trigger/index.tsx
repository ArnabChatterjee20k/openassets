import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Lid Trigger',
  description: 'Project card for Latch\'s Lid Trigger: a glossy white crescent moon (the sleep event) with a glowing star that twinkles in the card\'s seeded light.',
  tags: ['card', 'sleep', 'moon', 'trigger', 'project'],
};

export const schema = beamSchema({ name: 'Lid Trigger' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'sleep-hooks': { name: 'Sleep Hooks' },
  'night-shift': { name: 'Night Shift' },
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

/** Crescent outline: outer circle points outside an offset circle, then back along that circle. */
function crescentShape(R: number) {
  const ox = R * 0.46, oy = R * 0.3, r = R * 0.84;
  const s = new THREE.Shape();
  // Angles where the circles intersect, solved numerically by sampling.
  const outer: [number, number][] = [];
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2 + 0.6; // start inside the bite so the run is contiguous
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    if (Math.hypot(x - ox, y - oy) >= r) outer.push([x, y]);
  }
  const [ex, ey] = outer[outer.length - 1];
  const [sx, sy] = outer[0];
  const a0 = Math.atan2(ey - oy, ex - ox);
  let a1 = Math.atan2(sy - oy, sx - ox);
  // go round the inner circle the way that stays inside the outer disc
  const mid = (a0 + a1) / 2;
  if (Math.hypot(Math.cos(mid) * r + ox, Math.sin(mid) * r + oy) > R) a1 += a1 < a0 ? Math.PI * 2 : -Math.PI * 2;
  outer.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  for (let i = 1; i < 48; i++) {
    const a = a0 + ((a1 - a0) * i) / 48;
    s.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r);
  }
  s.closePath();
  return s;
}

function starShape(R: number, r: number) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 2 + (i / 8) * Math.PI * 2;
    const k = i % 2 ? r : R;
    if (i) s.lineTo(Math.cos(a) * k, Math.sin(a) * k);
    else s.moveTo(Math.cos(a) * k, Math.sin(a) * k);
  }
  s.closePath();
  return s;
}

export default function LidTrigger(p: P) {
  const light = beamLight(p).color;
  const star = useRef<THREE.Mesh>(null);
  const starMat = useRef<THREE.MeshStandardMaterial>(null);
  const small = useRef<THREE.Mesh>(null);

  const moon = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(crescentShape(0.78), { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.07, bevelSegments: 6, curveSegments: 24 });
    g.center();
    return g;
  }, []);
  const starGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(starShape(0.24, 0.07), { depth: 0.08, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.03, bevelSegments: 4 });
    g.center();
    return g;
  }, []);

  // Idle: the star twinkles (spins a quarter turn and flares once per loop), a second
  // star blinks on the off-beat; hover brightens; a click makes the star pop and spin.
  useLoop((m) => {
    const tw = blink(m.t, 0.3, 0.08);
    const press = pressBounce(m.pressAge);
    if (star.current) {
      star.current.rotation.z = tw * (Math.PI / 4) + press * 1.2;
      star.current.scale.setScalar(1 + tw * 0.25 + Math.abs(press) * 0.4);
    }
    if (starMat.current) starMat.current.emissiveIntensity = 1.4 + tw * 2 + m.hover * 1 + Math.abs(press) * 2 + (wave(m.t, 2) * 0.5 + 0.5) * 0.4;
    if (small.current) small.current.scale.setScalar(0.35 + blink(m.t, 0.75, 0.07) * 0.25);
  });

  return (
    <IconMotion seed={41}>
      <group position={[-0.12, -0.1, 0]} rotation={[0.1, -0.3, 0]} scale={1.35}>
        <mesh geometry={moon} rotation={[0, 0, 0.35]}>
          <Shell finish={p.finish} />
        </mesh>
        <mesh ref={star} geometry={starGeo} position={[0.52, 0.42, 0.12]}>
          <meshStandardMaterial ref={starMat} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        <mesh ref={small} geometry={starGeo} position={[0.82, -0.05, 0.05]} scale={0.35}>
          <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
        </mesh>
      </group>
    </IconMotion>
  );
}
