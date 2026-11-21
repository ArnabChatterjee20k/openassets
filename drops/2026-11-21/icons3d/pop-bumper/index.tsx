import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { color, num, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Pop Bumper',
  description:
    'Multiball hero: a glossy pinball pop bumper with chasing lamps and three balls in orbit (multiball = every platform in play). The cap kicks once per loop; hover speeds the lamps, a click fires the bumper.',
  tags: ['pinball', 'bumper', 'arcade', 'hero', '3d', 'ad agent'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  baseColor: color('Base').default('#FFF6E9'),
  skirtColor: color('Skirt').default('#FF6F91'),
  capColor: color('Cap').default('#00B3A4'),
  lampColor: color('Lamps').default('#FFC93C'),
  ballStyle: select(['candy', 'chrome'], 'Balls').default('candy'),
  balls: num(0, 3, 1, 'Balls in play').default(3),
  mood: select(['calm', 'tilt'], 'Mood').default('tilt'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay' },
  chrome: { material: 'metal', ballStyle: 'chrome', baseColor: '#E4E6EC', skirtColor: '#C9CDD6', capColor: '#FF6F91', lampColor: '#FFC93C' },
  'after-dark': { skirtColor: '#B026FF', capColor: '#FF2E88', lampColor: '#FFD600', baseColor: '#FBEFFF', ballStyle: 'chrome' },
  glass: { material: 'glass', capColor: '#7FE3D8', balls: 1 },
  calm: { mood: 'calm', balls: 1, skirtColor: '#00B3A4', capColor: '#FF6F91' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.8} ior={1.4} iridescence={0.3} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
  }
}

const lathe = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 72);

const LAMPS = 10;
const BALL_COLORS = ['#FF6F91', '#00B3A4', '#FFC93C'];

export default function PopBumper(p: P) {
  // Lathe profiles: a plinth with a lip, a flared skirt, and a domed cap.
  const geo = useMemo(() => {
    const plinth = lathe([
      [0, -0.62],
      [0.92, -0.62],
      [0.98, -0.58],
      [1.0, -0.5],
      [0.98, -0.42],
      [0.9, -0.38],
      [0.66, -0.36],
      [0, -0.36],
    ]);
    // Thin flared skirt (the bumper's "spoon" plate).
    const skirt = lathe([
      [0.3, -0.37],
      [0.84, -0.35],
      [0.9, -0.31],
      [0.86, -0.27],
      [0.5, -0.22],
      [0.3, -0.2],
    ]);
    const post = lathe([
      [0, -0.22],
      [0.3, -0.22],
      [0.3, 0.42],
      [0, 0.42],
    ]);
    const cap = lathe([
      [0, 0.38],
      [0.64, 0.38],
      [0.71, 0.43],
      [0.71, 0.5],
      [0.62, 0.6],
      [0.44, 0.7],
      [0.22, 0.75],
      [0, 0.76],
    ]);
    // Five-point star on top of the cap.
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 === 0 ? 0.3 : 0.13;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    const star = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 4 });
    star.center();
    return { plinth, skirt, post, cap, star };
  }, []);

  const capRef = useRef<THREE.Group>(null);
  const kickRef = useRef<THREE.Group>(null);
  // Glass is for the cap only (a real bumper's translucent lamp cap); the rest stays glossy.
  const body = p.material === 'glass' ? 'glossy' : p.material;
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const lampMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const ballRefs = useRef<(THREE.Group | null)[]>([]);
  const tilt = p.mood === 'tilt';

  // Idle life: lamps chase round the plinth, balls orbit and hop, the cap kicks
  // once per loop. Hover brightens the chase, a click fires the bumper.
  useLoop((m) => {
    const kick = Math.max(blink(m.t, 0.5, 0.04), tilt ? blink(m.t, 0.0, 0.04) : 0);
    const press = Math.abs(pressBounce(m.pressAge));
    const hit = Math.max(kick, press * 1.6);
    if (kickRef.current) kickRef.current.position.y = -hit * 0.16;
    if (capRef.current) {
      capRef.current.position.y = hit * 0.04;
      capRef.current.scale.set(1 + hit * 0.05, 1 - hit * 0.06, 1 + hit * 0.05);
    }
    if (ring.current) ring.current.emissiveIntensity = 0.18 + hit * 1.6 + m.hover * 0.4;
    const head = cycle(m.t, tilt ? 2 : 1);
    lampMats.current.forEach((mat, i) => {
      if (!mat) return;
      const d = (head - i / LAMPS + 1) % 1; // 0 = lamp is the chase head
      const tail = Math.max(0, 1 - d * (tilt ? 3.5 : 2.5));
      mat.emissiveIntensity = 0.02 + tail * (0.9 + m.hover * 0.8) + hit * 0.8;
    });
    ballRefs.current.forEach((b, i) => {
      if (!b) return;
      const a = cycle(m.t, 1, i / 3) * Math.PI * 2;
      const r = 1.28 + wave(m.t, 2, i * 0.3) * 0.04;
      b.position.set(Math.cos(a) * r, -0.44 + Math.abs(wave(m.t, tilt ? 4 : 2, i / 3)) * (0.28 + m.hover * 0.12), Math.sin(a) * r);
    });
  });

  const lampPos = Array.from({ length: LAMPS }, (_, i) => {
    const a = (i / LAMPS) * Math.PI * 2;
    return [Math.cos(a) * 1.0, -0.5, Math.sin(a) * 1.0] as [number, number, number];
  });

  return (
    <IconMotion seed={21}>
      <group rotation={[0.42, 0.25, 0]} position={[0, 0.05, 0]} scale={1.05}>
        <mesh geometry={geo.plinth} castShadow>
          <Surface kind={body} c={p.baseColor} />
        </mesh>
        {lampPos.map((pos, i) => (
          <mesh key={i} position={pos} scale={[1, 0.7, 1]}>
            <sphereGeometry args={[0.085, 20, 20]} />
            <meshStandardMaterial ref={(el) => void (lampMats.current[i] = el)} color={p.lampColor} emissive={p.lampColor} emissiveIntensity={0.4} roughness={0.25} />
          </mesh>
        ))}
        <mesh geometry={geo.skirt}>
          <Surface kind={body} c={p.skirtColor} />
        </mesh>
        <mesh geometry={geo.post}>
          <Surface kind={body} c={p.baseColor} />
        </mesh>
        {/* the kicker ring: glows and snaps down on every hit */}
        <group ref={kickRef}>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.075, 24, 72]} />
            <meshStandardMaterial ref={ring} color={p.lampColor} emissive={p.lampColor} emissiveIntensity={0.8} roughness={0.28} />
          </mesh>
        </group>
        <group ref={capRef}>
          <mesh geometry={geo.cap} castShadow>
            <Surface kind={p.material} c={p.capColor} />
          </mesh>
          <mesh geometry={geo.star} position={[0, 0.79, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshPhysicalMaterial color={p.baseColor} roughness={0.2} clearcoat={1} />
          </mesh>
        </group>
        {Array.from({ length: p.balls }, (_, i) => (
          <group key={i} ref={(el) => void (ballRefs.current[i] = el)} position={[Math.cos((i / 3) * Math.PI * 2) * 1.28, -0.44, Math.sin((i / 3) * Math.PI * 2) * 1.28]}>
            <mesh castShadow>
              <sphereGeometry args={[0.17, 40, 40]} />
              {p.ballStyle === 'chrome' ? (
                <meshStandardMaterial color="#E9EBF0" metalness={1} roughness={0.26} />
              ) : (
                <meshPhysicalMaterial color={BALL_COLORS[i]} roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} />
              )}
            </mesh>
          </group>
        ))}
      </group>
    </IconMotion>
  );
}
