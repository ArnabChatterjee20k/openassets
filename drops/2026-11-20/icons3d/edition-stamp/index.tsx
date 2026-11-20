import { useMemo, useRef, type RefObject } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, clamp, cycle, pressBounce, useLoop } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Edition Stamp',
  description:
    'Approvals hero for an AI ad agent: a chunky rubber stamp hovering over a sheet that already carries one two-ink star mark. It thunks down to sign off the next print run, leaves a fresh misregistered impression, and pops a yellow spark when clicked.',
  tags: ['approvals', 'stamp', 'sign off', '3d', 'print', 'ads'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  blockColor: color('Stamp block').default('#F6E9FF'),
  handleColor: color('Handle').default('#B026FF'),
  inkColor: color('Ink').default('#B026FF'),
  ink2Color: color('Second ink').default('#FF2E88'),
  paperColor: color('Paper').default('#FBEFFF'),
  padColor: color('Ink pad').default('#2A0647'),
  sparkColor: color('Spark').default('#FFD600'),
  mood: select(['calm', 'busy'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', handleColor: '#FF2E88', mood: 'busy' },
  metal: { material: 'metal', blockColor: '#D9DCE4', handleColor: '#2E1A12', inkColor: '#C9A45C', ink2Color: '#6E6A62', paperColor: '#F3EDE2', padColor: '#1C1C20', sparkColor: '#E8D9B5' },
  glass: { material: 'glass', blockColor: '#EBD6FF', handleColor: '#FF2E88', inkColor: '#FF2E88', ink2Color: '#B026FF' },
  risograph: { material: 'clay', blockColor: '#F4EFE6', handleColor: '#0078BF', inkColor: '#0078BF', ink2Color: '#FF48B0', paperColor: '#FFFFFF', padColor: '#EAE2D3', sparkColor: '#FFE800', mood: 'busy' },
  lava: { blockColor: '#FFEDE0', handleColor: '#2E120B', inkColor: '#FF4D00', ink2Color: '#FFB000', paperColor: '#FFEDE0', padColor: '#2E120B', sparkColor: '#FF2E63' },
};

type P = z.infer<typeof schema>;

function Body({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.8} ior={1.4} iridescence={0.35} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} />;
  }
}

const PAPER_Y = -0.62; // paper top
const STAMP_X = 0.42;
const STAMP_Z = -0.18;
const LIFT = 0.62; // rest height of the rubber face above the paper
const MARK_X = -0.5; // the earlier impression
const MARK_Z = 0.36;

/** A five-point star, the stamp's design. */
function useStar(outer: number, inner: number) {
  return useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 ? inner : outer;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [outer, inner]);
}

/** Ink impression on the paper: a pink pass, then violet slightly out of register. */
function Impression({ p, star, opacityRef }: { p: P; star: THREE.ShapeGeometry; opacityRef?: RefObject<THREE.Group | null> }) {
  return (
    <group ref={opacityRef} rotation={[-Math.PI / 2, 0, 0]}>
      <group position={[0.035, -0.025, 0.001]}>
        <mesh>
          <ringGeometry args={[0.25, 0.31, 64]} />
          <meshStandardMaterial color={p.ink2Color} roughness={0.6} transparent opacity={0.9} />
        </mesh>
        <mesh geometry={star}>
          <meshStandardMaterial color={p.ink2Color} roughness={0.6} transparent opacity={0.9} />
        </mesh>
      </group>
      <group position={[0, 0, 0.002]}>
        <mesh>
          <ringGeometry args={[0.25, 0.31, 64]} />
          <meshStandardMaterial color={p.inkColor} roughness={0.5} transparent opacity={0.92} />
        </mesh>
        <mesh geometry={star}>
          <meshStandardMaterial color={p.inkColor} roughness={0.5} transparent opacity={0.92} />
        </mesh>
      </group>
    </group>
  );
}

/** Height of the rubber face over one press cycle u ∈ [0, 1): hover, drop, hold, rise. */
function pressHeight(u: number) {
  if (u < 0.34) return LIFT;
  if (u < 0.46) {
    const k = (u - 0.34) / 0.12;
    return LIFT * (1 - k * k * k); // accelerate down
  }
  if (u < 0.56) return 0;
  const k = clamp((u - 0.56) / 0.3);
  return LIFT * (1 - Math.pow(1 - k, 3)); // ease back up
}

export default function EditionStamp(p: P) {
  const busy = p.mood === 'busy';
  const star = useStar(0.19, 0.08);
  const stamp = useRef<THREE.Group>(null);
  const fresh = useRef<THREE.Group | null>(null);
  const spark = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.MeshStandardMaterial>(null);

  // Lathe-turned wooden handle: neck flaring into a round knob.
  const handle = useMemo(() => {
    const pts = [
      [0.0, 0],
      [0.17, 0],
      [0.12, 0.05],
      [0.085, 0.16],
      [0.08, 0.3],
      [0.12, 0.38],
      [0.2, 0.46],
      [0.22, 0.54],
      [0.19, 0.63],
      [0.1, 0.69],
      [0.0, 0.7],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 48);
  }, []);

  useLoop((m) => {
    const n = busy ? 2 : 1;
    const u = cycle(m.t, n);
    // Hover presses a little harder and faster to feel eager.
    const h = pressHeight(u) * (1 + m.hover * 0.15);
    const b = pressBounce(m.pressAge);
    const contact = u >= 0.46 && u < 0.56 ? Math.sin(((u - 0.46) / 0.1) * Math.PI) : 0;
    if (stamp.current) {
      stamp.current.position.y = PAPER_Y + h + Math.max(0, -b) * 0.08;
      const sq = contact * 0.1 + Math.max(0, b) * 0.16;
      stamp.current.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    }
    // Fresh impression: appears at contact, fades before the loop ends (0 at rest).
    if (fresh.current) {
      const a = u < 0.5 ? 0 : 1 - clamp((u - 0.78) / 0.2);
      fresh.current.visible = a > 0.01;
      fresh.current.scale.setScalar(0.92 + a * 0.08);
      fresh.current.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (mat && 'opacity' in mat) mat.opacity = a * 0.92;
      });
    }
    if (spark.current) {
      const s = blink(m.t, 0.08, 0.05) + Math.abs(b) * 2.2 + m.hover * 0.4;
      spark.current.scale.setScalar(0.001 + s);
      spark.current.rotation.z = m.t * 0.8;
    }
    if (halo.current) halo.current.emissiveIntensity = 0.5 + contact * 1.6 + m.hover * 0.5 + Math.abs(b) * 1.5;
  });

  return (
    <IconMotion seed={57} float={0.04} sway={0.06}>
      <group rotation={[0.42, -0.6, 0]} position={[0, 0.02, 0]} scale={1.08}>
        {/* paper sheet, a hair rotated so it reads as placed by hand */}
        <RoundedBox args={[2.1, 0.04, 1.4]} radius={0.015} smoothness={2} position={[0, PAPER_Y - 0.02, 0]} rotation={[0, 0.05, 0]}>
          <meshPhysicalMaterial color={p.paperColor} roughness={0.85} sheen={0.3} sheenColor="#ffffff" />
        </RoundedBox>
        {/* earlier impression, already signed off */}
        <group position={[MARK_X, PAPER_Y + 0.001, MARK_Z]} rotation={[0, 0.25, 0]}>
          <Impression p={p} star={star} />
        </group>
        {/* the fresh one, under the stamp */}
        <group position={[STAMP_X, PAPER_Y + 0.002, STAMP_Z]}>
          <Impression p={p} star={star} opacityRef={fresh} />
        </group>

        {/* ink pad, back left */}
        <group position={[-0.58, PAPER_Y + 0.05, -0.4]} rotation={[0, 0.25, 0]}>
          <RoundedBox args={[0.78, 0.1, 0.5]} radius={0.04} smoothness={4}>
            <meshPhysicalMaterial color={p.padColor} roughness={0.35} clearcoat={0.6} />
          </RoundedBox>
          <RoundedBox args={[0.64, 0.04, 0.36]} radius={0.015} smoothness={2} position={[0, 0.04, 0]}>
            <meshPhysicalMaterial color={p.inkColor} roughness={0.12} clearcoat={1} emissive={p.inkColor} emissiveIntensity={0.08} />
          </RoundedBox>
        </group>

        {/* the stamp (origin at the rubber face) */}
        <group ref={stamp} position={[STAMP_X, PAPER_Y + LIFT, STAMP_Z]}>
          {/* inked rubber */}
          <RoundedBox args={[0.74, 0.07, 0.74]} radius={0.025} smoothness={3} position={[0, 0.035, 0]}>
            <meshPhysicalMaterial color={p.inkColor} roughness={0.15} clearcoat={1} emissive={p.inkColor} emissiveIntensity={0.05} />
          </RoundedBox>
          {/* block */}
          <RoundedBox args={[0.86, 0.24, 0.86]} radius={0.07} smoothness={5} position={[0, 0.18, 0]}>
            <Body kind={p.material} c={p.blockColor} />
          </RoundedBox>
          {/* the design shown on top of the block, and a glowing index ring */}
          <mesh position={[0, 0.316, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={star}>
            <meshStandardMaterial color={p.ink2Color} emissive={p.ink2Color} emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0, 0.312, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.27, 0.32, 64]} />
            <meshStandardMaterial ref={halo} color={p.inkColor} emissive={p.inkColor} emissiveIntensity={0.5} side={THREE.DoubleSide} />
          </mesh>
          {/* handle */}
          <mesh geometry={handle} position={[0, 0.3, 0]}>
            <meshPhysicalMaterial color={p.handleColor} roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.1} />
          </mesh>
          {/* spark */}
          <mesh ref={spark} position={[0.42, 0.95, 0.3]}>
            <octahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color={p.sparkColor} emissive={p.sparkColor} emissiveIntensity={2} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
