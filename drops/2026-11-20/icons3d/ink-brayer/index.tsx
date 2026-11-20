import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Ink Brayer',
  description:
    'Inkrun hero: a chunky hand ink roller on a slab, laying a fresh stripe of UV-violet ink. It rocks and rolls on a loop, rolls harder on hover, and squashes with a pop of pink ink when clicked.',
  tags: ['hero', 'print', 'roller', '3d', 'ads', 'agent'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  frameColor: color('Frame').default('#F6E9FF'),
  handleColor: color('Handle').default('#FF2E88'),
  inkColor: color('Ink').default('#B026FF'),
  ink2Color: color('Second ink').default('#FF2E88'),
  slabColor: color('Ink slab').default('#2A0647'),
  sparkColor: color('Spark').default('#FFD600'),
  mood: select(['calm', 'rush'], 'Mood').default('rush'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', frameColor: '#FBEFFF', handleColor: '#FFD600', mood: 'calm' },
  metal: { material: 'metal', frameColor: '#D9DCE4', handleColor: '#2E1A12', inkColor: '#C9A45C', ink2Color: '#E8D9B5', slabColor: '#1C1C20', sparkColor: '#E8D9B5' },
  glass: { material: 'glass', frameColor: '#EBD6FF', inkColor: '#FF2E88', ink2Color: '#B026FF' },
  risograph: { material: 'clay', frameColor: '#F4EFE6', handleColor: '#0078BF', inkColor: '#FF48B0', ink2Color: '#0078BF', slabColor: '#EAE2D3', sparkColor: '#FFE800' },
  lava: { frameColor: '#FFEDE0', handleColor: '#2E120B', inkColor: '#FF4D00', ink2Color: '#FFB000', slabColor: '#2E120B', sparkColor: '#FF2E63' },
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

/** Wet ink: always glossy, whatever the frame material. */
const Ink = ({ c, glow = 0.06 }: { c: string; glow?: number }) => (
  <meshPhysicalMaterial color={c} roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} emissive={c} emissiveIntensity={glow} />
);

const R = 0.27; // roller radius
const LEN = 0.92; // roller length (z)
const SLAB_Y = -0.62; // slab top
const REST_X = 0.28;
const STRIPE_L = -0.98; // stripe starts here

export default function InkBrayer(p: P) {
  const rush = p.mood === 'rush';
  const printed = useMemo(() => '#' + new THREE.Color(p.inkColor).lerp(new THREE.Color(p.slabColor), 0.42).getHexString(), [p.inkColor, p.slabColor]);
  const brayer = useRef<THREE.Group>(null);
  const roller = useRef<THREE.Group>(null);
  const stripe = useRef<THREE.Mesh>(null);
  const blob = useRef<THREE.Group>(null);
  const spark = useRef<THREE.Mesh>(null);

  // Bent-rod frame: from each axle end up and back to the handle socket.
  const rod = useMemo(() => {
    const make = (side: 1 | -1) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, side * (LEN / 2 + 0.06)),
          new THREE.Vector3(-0.08, 0.2, side * (LEN / 2 + 0.07)),
          new THREE.Vector3(-0.3, 0.42, side * 0.3),
          new THREE.Vector3(-0.46, 0.52, side * 0.04),
          new THREE.Vector3(-0.5, 0.54, 0),
        ]),
        48,
        0.045,
        16,
        false,
      );
    return [make(1), make(-1)];
  }, []);

  // A softly bulging handle, turned on a lathe.
  const handle = useMemo(() => {
    const pts = [
      [0.0, 0],
      [0.08, 0.0],
      [0.1, 0.06],
      [0.085, 0.14],
      [0.11, 0.36],
      [0.12, 0.52],
      [0.1, 0.64],
      [0.0, 0.68],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 40);
  }, []);

  // Idle: the brayer rolls back and forth laying ink (stripe tracks it),
  // a yellow spark glints once per loop. Hover rolls further; click squashes
  // and pops a blob of pink ink.
  useLoop((m) => {
    const amp = (rush ? 0.3 : 0.16) + m.hover * 0.12;
    // Starts at rest (wave = 0 at t = 0) and returns there each loop.
    const x = REST_X + wave(m.t, rush ? 2 : 1) * amp;
    if (brayer.current) {
      brayer.current.position.x = x;
      const sq = pressBounce(m.pressAge) * 0.18;
      brayer.current.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    }
    if (roller.current) roller.current.rotation.z = -(x - REST_X) / R;
    if (stripe.current) {
      const len = Math.max(0.02, x - STRIPE_L);
      stripe.current.scale.x = len;
      stripe.current.position.x = STRIPE_L + len / 2;
    }
    if (blob.current) {
      const b = Math.abs(pressBounce(m.pressAge));
      blob.current.scale.setScalar(1 + b * 1.4 + m.hover * 0.15);
    }
    if (spark.current) {
      const s = blink(m.t, 0.3, 0.06) + Math.abs(pressBounce(m.pressAge)) * 2;
      spark.current.scale.setScalar(0.001 + s);
      spark.current.rotation.z = m.t * 0.6;
    }
  });

  return (
    <IconMotion seed={41} float={0.04} sway={0.06}>
      <group rotation={[0.38, -0.55, 0]} position={[0.05, 0.1, 0]} scale={1.15}>
        {/* Ink slab */}
        <RoundedBox args={[2.3, 0.14, 1.3]} radius={0.06} smoothness={4} position={[0, SLAB_Y - 0.07, 0]}>
          <meshPhysicalMaterial color={p.slabColor} roughness={0.25} clearcoat={0.8} />
        </RoundedBox>

        {/* Fresh ink stripe (scaled along x to follow the roller) */}
        <mesh ref={stripe} position={[(STRIPE_L + REST_X) / 2, SLAB_Y + 0.006, 0]}>
          <boxGeometry args={[1, 0.012, LEN * 0.94]} />
          {/* Printed ink sits flatter and deeper than the wet roller, so the two separate. */}
          <meshPhysicalMaterial color={printed} roughness={0.45} clearcoat={0.3} />
        </mesh>

        {/* Pink puddle + a few beads, waiting to be rolled in */}
        <group ref={blob} position={[-0.72, SLAB_Y, 0.48]}>
          <mesh scale={[1, 0.28, 0.8]}>
            <sphereGeometry args={[0.16, 32, 24]} />
            <Ink c={p.ink2Color} glow={0.1} />
          </mesh>
          <mesh position={[0.2, 0, -0.08]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.06, 24, 16]} />
            <Ink c={p.ink2Color} glow={0.1} />
          </mesh>
        </group>
        <mesh position={[0.82, SLAB_Y, -0.5]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.07, 24, 16]} />
          <Ink c={p.inkColor} />
        </mesh>

        {/* The brayer */}
        <group ref={brayer} position={[REST_X, SLAB_Y + R, 0]}>
          {/* inked roller */}
          <group ref={roller}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[R, R, LEN, 64, 1]} />
              <Ink c={p.inkColor} glow={0.02} />
            </mesh>
            {/* bevelled end caps + a seam so the spin reads */}
            {[1, -1].map((s) => (
              <mesh key={s} position={[0, 0, s * (LEN / 2)]}>
                <torusGeometry args={[R - 0.025, 0.028, 16, 48]} />
                <Body kind={p.material} c={p.frameColor} />
              </mesh>
            ))}
            <mesh position={[0, R, 0]}>
              <boxGeometry args={[0.03, 0.012, LEN * 0.98]} />
              <meshStandardMaterial color={p.ink2Color} emissive={p.ink2Color} emissiveIntensity={0.2} />
            </mesh>
          </group>
          {/* axle bosses */}
          {[1, -1].map((s) => (
            <mesh key={s} position={[0, 0, s * (LEN / 2 + 0.05)]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.08, 24]} />
              <Body kind={p.material} c={p.frameColor} />
            </mesh>
          ))}
          {rod.map((g, i) => (
            <mesh key={i} geometry={g}>
              <Body kind={p.material} c={p.frameColor} />
            </mesh>
          ))}
          {/* ferrule + handle, angled up and back */}
          <group position={[-0.5, 0.54, 0]} rotation={[0, 0, 0.95]}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.075, 0.085, 0.1, 24]} />
              <Body kind={p.material === 'glass' ? 'glossy' : p.material} c={p.frameColor} />
            </mesh>
            <mesh geometry={handle} position={[0, 0.07, 0]}>
              <meshPhysicalMaterial color={p.handleColor} roughness={0.32} clearcoat={0.7} />
            </mesh>
          </group>
          {/* spark glint on the ink */}
          <mesh ref={spark} position={[0.12, R + 0.18, LEN / 2 - 0.1]}>
            <octahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color={p.sparkColor} emissive={p.sparkColor} emissiveIntensity={2} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
