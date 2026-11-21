import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, LOOP_SECONDS, cycle, pressBounce, useLoop } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Flipper',
  description:
    'Multiball "launch" hero: a glossy pinball flipper with a candy rubber ring and a ball resting on its tip. Once per loop it flicks the ball high and catches it again; hover arms the pivot lamp, a click fires an extra flick.',
  tags: ['pinball', 'flipper', 'launch', 'arcade', '3d', 'ad agent'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  bodyColor: color('Flipper').default('#FFF6E9'),
  rubberColor: color('Rubber ring').default('#FF6F91'),
  capColor: color('Pivot cap').default('#00B3A4'),
  lampColor: color('Lamp').default('#FFC93C'),
  ballStyle: select(['candy', 'chrome'], 'Ball').default('chrome'),
  ballColor: color('Candy ball').default('#FF6F91'),
  mood: select(['calm', 'lively'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', ballStyle: 'candy', ballColor: '#00B3A4' },
  chrome: { material: 'metal', bodyColor: '#DADDE4', rubberColor: '#1A1A2E', capColor: '#FF6F91' },
  'after-dark': { bodyColor: '#FBEFFF', rubberColor: '#B026FF', capColor: '#FF2E88', lampColor: '#FFD600', mood: 'lively' },
  glass: { material: 'glass', bodyColor: '#E6FFFB', rubberColor: '#00B3A4', capColor: '#FF6F91', ballStyle: 'candy', ballColor: '#FFC93C' },
  citrus: { rubberColor: '#FF8A00', capColor: '#2E7D32', lampColor: '#FFE14D', ballStyle: 'candy', ballColor: '#FF8A00', mood: 'lively' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.6} ior={1.45} iridescence={0.3} attenuationColor={c} attenuationDistance={1.2} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
  }
}

// Flipper outline: a fat round pivot end tapering to a small round tip,
// joined by the two outer tangents of the circles.
const L = 1.7;
function flipperShape(R: number, r: number) {
  const phi = Math.acos((R - r) / L);
  const s = new THREE.Shape();
  s.moveTo(R * Math.cos(phi), R * Math.sin(phi));
  s.absarc(0, 0, R, phi, Math.PI * 2 - phi, false);
  s.lineTo(L + r * Math.cos(-phi), r * Math.sin(-phi));
  s.absarc(L, 0, r, -phi, phi, false);
  s.closePath();
  return s;
}

const REST = -0.42; // flipper angle at rest (tip down-right)
const UP = 0.5; // angle when fired
const BALL_R = 0.2;

/** 0..1 flick envelope over one flick period: snap up, brief hold, ease back. */
function flick(u: number) {
  if (u < 0.06) return 0;
  if (u < 0.1) return (u - 0.06) / 0.04;
  if (u < 0.18) return 1;
  if (u < 0.3) {
    const k = (u - 0.18) / 0.12;
    return 1 - k * k * (3 - 2 * k);
  }
  return 0;
}

export default function Flipper(p: P) {
  const geo = useMemo(() => {
    const ext = { bevelEnabled: true, bevelSegments: 6, curveSegments: 48 };
    const body = new THREE.ExtrudeGeometry(flipperShape(0.34, 0.13), { ...ext, depth: 0.2, bevelSize: 0.06, bevelThickness: 0.06 });
    body.translate(0, 0, -0.1);
    const rubber = new THREE.ExtrudeGeometry(flipperShape(0.43, 0.22), { ...ext, depth: 0.1, bevelSize: 0.04, bevelThickness: 0.04 });
    rubber.translate(0, 0, -0.05);
    return { body, rubber };
  }, []);

  const arm = useRef<THREE.Group>(null);
  const ball = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const cycles = p.mood === 'lively' ? 2 : 1;
  const body = p.material === 'glass' ? 'glass' : p.material;

  // Ball rest spot: sitting on the rubber near the tip, in world space.
  const restBall = (a: number): [number, number] => {
    const x = L - 0.38;
    const y = 0.33 + BALL_R + 0.03;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };
  const [bx0, by0] = restBall(REST);

  useLoop((m) => {
    const u = cycle(m.t, cycles);
    const press = Math.abs(pressBounce(m.pressAge));
    const k = Math.max(flick(u), Math.min(1, press * 2.2));
    const a = REST + (UP - REST) * k + Math.sin((m.t / LOOP_SECONDS) * Math.PI * 2 * 8) * 0.015 * m.hover;
    if (arm.current) arm.current.rotation.z = a;
    // Ball flight: launched as the flipper snaps, a parabola that lands back on the tip.
    if (ball.current) {
      // rides the blade until it snaps up (u = 0.1), then flies from there back to the rest spot
      const t0 = 0.1;
      const f = u < t0 ? 0 : (u - t0) / (1 - t0);
      const air = u >= t0 && f < 0.92 ? f / 0.92 : 0;
      const h = 4 * air * (1 - air) * (cycles === 2 ? 1.05 : 1.45);
      const drift = Math.sin(air * Math.PI) * -0.35;
      const [sx, sy] = u < t0 ? restBall(a) : restBall(UP);
      const bx = air > 0 ? sx + (bx0 - sx) * air : u < t0 ? sx : bx0;
      const by = air > 0 ? sy + (by0 - sy) * air : u < t0 ? sy : by0;
      ball.current.position.set(bx + drift, by + h, 0.06);
      ball.current.rotation.z = -air * Math.PI * 4;
      // tiny squash on landing
      const land = air === 0 && u > 0.5 ? Math.max(0, 1 - (f - 0.92) / 0.05) : 0;
      ball.current.scale.set(1 + land * 0.12, 1 - land * 0.12, 1 + land * 0.12);
    }
    if (lamp.current) lamp.current.emissiveIntensity = 0.25 + k * 1.8 + m.hover * 0.7;
  });

  return (
    <IconMotion seed={47}>
      <group rotation={[-0.28, 0.32, 0]} position={[-0.72, -0.25, 0]} scale={1.0}>
        {/* the flipper arm swings around its pivot */}
        <group ref={arm} rotation={[0, 0, REST]}>
          <mesh geometry={geo.rubber} castShadow>
            <meshPhysicalMaterial color={p.rubberColor} roughness={0.5} sheen={0.6} sheenColor="#ffffff" clearcoat={0.3} />
          </mesh>
          <mesh geometry={geo.body} castShadow>
            <Surface kind={body} c={p.bodyColor} />
          </mesh>
          {/* raised inlay stripe along the blade, ending in a lamp at the tip */}
          <RoundedBox args={[0.95, 0.1, 0.06]} radius={0.03} smoothness={4} position={[0.98, 0.02, 0.17]} rotation={[0, 0, -0.04]}>
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.capColor} />
          </RoundedBox>
          <mesh position={[1.58, 0, 0.17]}>
            <sphereGeometry args={[0.045, 20, 20]} />
            <meshStandardMaterial color={p.lampColor} emissive={p.lampColor} emissiveIntensity={0.6} roughness={0.3} />
          </mesh>
        </group>
        {/* pivot: chrome post, lamp ring and a coloured cap */}
        <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.12, 40]} />
          <meshStandardMaterial color="#D3D7DE" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.28]}>
          <torusGeometry args={[0.2, 0.045, 20, 56]} />
          <meshStandardMaterial ref={lamp} color={p.lampColor} emissive={p.lampColor} emissiveIntensity={0.4} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.17, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.capColor} />
        </mesh>
        {/* the ball */}
        <group ref={ball} position={[bx0, by0, 0.06]}>
          <mesh castShadow>
            <sphereGeometry args={[BALL_R, 48, 48]} />
            {p.ballStyle === 'chrome' ? (
              <meshStandardMaterial color="#E4E7EE" metalness={1} roughness={0.34} />
            ) : (
              <meshPhysicalMaterial color={p.ballColor} roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} />
            )}
          </mesh>
          {/* sunflower glint */}
          <mesh position={[-0.07, 0.08, 0.15]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color={p.lampColor} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
