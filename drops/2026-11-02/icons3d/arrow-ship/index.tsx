import { useMemo, useRef } from 'react';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Arrow Ship',
  description:
    'The particles.io player ship: a chunky arrowhead with a glowing core, twin thrusters and three orbiting particle orbs. Thrusters pulse and it fires on a loop; hover revs it up, click recoils and flashes the core.',
  tags: ['game', 'ship', 'hero', '3d', 'shooter', 'multiplayer'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  body: color('Hull').default('#FF5C8A'),
  trim: color('Cockpit frame').default('#FFE45C'),
  core: color('Core').default('#00D1A0'),
  flame: color('Thruster flame').default('#5C8AFF'),
  orbA: color('Orb 1').default('#FFE45C'),
  orbB: color('Orb 2').default('#5C8AFF'),
  orbC: color('Orb 3').default('#00D1A0'),
  outline: toggle('Ink outline').default(true),
  mood: select(['calm', 'hyped'], 'Mood').default('hyped'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', body: '#5C8AFF', trim: '#FFFDF2', core: '#FF5C8A', flame: '#FF5C8A', orbA: '#FF5C8A' },
  metal: { material: 'metal', body: '#D7DBE2', trim: '#C9A45C', core: '#FF5C8A', flame: '#FFB000', outline: false },
  glass: { material: 'glass', body: '#BFD3FF', trim: '#FFFDF2', core: '#FF5C8A', outline: false },
  acid: { body: '#1E1E1E', trim: '#C6FF00', core: '#C6FF00', flame: '#FF00E5', orbA: '#C6FF00', orbB: '#FF00E5', orbC: '#00F0FF', outline: false },
  calm: { mood: 'calm', material: 'glossy', body: '#00D1A0', core: '#FFE45C', flame: '#FFE45C' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.22} transmission={1} thickness={1.4} ior={1.4} iridescence={0.35} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

const INK = '#000000';
const TAU = Math.PI * 2;
const ORBIT = 1.08;

export default function ArrowShip(p: P) {
  // Notched arrowhead, the same silhouette as the in-game sprite.
  const hull = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1.02);
    s.lineTo(0.78, -0.72);
    s.quadraticCurveTo(0.8, -0.8, 0.7, -0.78);
    s.lineTo(0, -0.36);
    s.lineTo(-0.7, -0.78);
    s.quadraticCurveTo(-0.8, -0.8, -0.78, -0.72);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.09, bevelSegments: 6, curveSegments: 8 });
    g.translate(0, 0, -0.13);
    return g;
  }, []);
  const ship = useRef<THREE.Group>(null);
  const coreMesh = useRef<THREE.Mesh>(null);
  const flames = useRef<(THREE.Group | null)[]>([]);
  const flameMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const navs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const orbs = useRef<(THREE.Group | null)[]>([]);
  const shot = useRef<THREE.Group>(null);
  const hyped = p.mood === 'hyped';
  const orbColors = [p.orbA, p.orbB, p.orbC];

  useLoop((m) => {
    const rev = (hyped ? 1 : 0.45) + m.hover * 0.8;
    const kick = pressBounce(m.pressAge);
    // Recoil: the whole ship kicks back along its nose axis on click.
    if (ship.current) ship.current.position.y = -Math.abs(kick) * 0.16;
    // Thrusters pulse (4 per loop) and grow with hover.
    flames.current.forEach((f, i) => {
      if (!f) return;
      const pulse = 0.5 + 0.5 * wave(m.t, 4, i * 0.25);
      f.scale.set(1, 0.7 + pulse * 0.45 * rev + m.hover * 0.6, 1);
      const mat = flameMats.current[i];
      if (mat) mat.emissiveIntensity = 0.6 + pulse * 0.8 * rev;
    });
    // Wingtip nav lights blink alternately (2 per loop).
    navs.current.forEach((mat, i) => {
      if (mat) mat.emissiveIntensity = 0.2 + 1.6 * Math.max(0, wave(m.t, 2, i * 0.5));
    });
    // Core blinks once per loop, flashes on click and when the idle shot fires.
    if (coreMesh.current) {
      const fire = hyped ? blink(m.t, 0.5, 0.05) : 0;
      const f = Math.max(blink(m.t, 0.88, 0.03), fire, Math.abs(kick) * 2.2);
      (coreMesh.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.35 + f * 2.2;
      coreMesh.current.scale.setScalar(1 + f * 0.12);
    }
    // Three particle orbs orbit on a tilted ring (1 or 2 laps per loop).
    orbs.current.forEach((o, i) => {
      if (!o) return;
      const a = cycle(m.t, hyped ? 2 : 1) * TAU + (i * TAU) / 3 + 0.5;
      o.position.set(Math.cos(a) * ORBIT, Math.sin(a) * 0.3 + 0.06, Math.sin(a) * 0.85);
      const s = 1 + wave(m.t, 4, i / 3) * 0.08;
      o.scale.setScalar(s);
    });
    // Idle shot: a particle bolt leaves the nose mid-loop (hyped mood only).
    if (shot.current) {
      const u = cycle(m.t);
      const idle = hyped && u > 0.5 && u < 0.72 ? (u - 0.5) / 0.22 : -1;
      const click = m.pressAge < 0.45 ? m.pressAge / 0.45 : -1; // a click fires a shot too
      const live = click >= 0 ? click : idle;
      shot.current.visible = live >= 0 && live < 1;
      if (live >= 0) {
        shot.current.position.y = 1.1 + live * 1.1;
        shot.current.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * Math.min(1, live * 1.4)) * 1));
      }
    }
  });

  const thruster = (x: number, i: number) => (
    <group key={i} position={[x, -0.6, 0]}>
      <mesh>
        <cylinderGeometry args={[0.14, 0.17, 0.36, 32]} />
        <meshPhysicalMaterial color="#1A1A1A" roughness={0.5} clearcoat={0.4} />
        {p.outline && <Outlines thickness={0.02} color={INK} />}
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.035, 12, 32]} />
        <meshStandardMaterial color={p.trim} roughness={0.4} />
      </mesh>
      {/* flame: a cone pointing backwards, scaled from the nozzle */}
      <group ref={(el) => void (flames.current[i] = el)} position={[0, -0.18, 0]}>
        <mesh position={[0, -0.24, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.12, 0.48, 24]} />
          <meshStandardMaterial ref={(el) => void (flameMats.current[i] = el)} color={p.flame} emissive={p.flame} emissiveIntensity={1} roughness={0.3} />
          {p.outline && <Outlines thickness={0.018} color={INK} />}
        </mesh>
      </group>
    </group>
  );

  return (
    <IconMotion seed={42} float={0.06}>
      {/* Pointing up and to the right, like the sprite on its way across the arena. */}
      <group rotation={[0.25, 0, -0.62]} scale={0.95}>
        <group ref={ship}>
          <mesh geometry={hull} castShadow>
            <Surface kind={p.material} c={p.body} />
            {p.outline && <Outlines thickness={0.028} color={INK} />}
          </mesh>
          {/* Wingtip nav lights */}
          {[-1, 1].map((sx, k) => (
            <mesh key={sx} position={[sx * 0.56, -0.56, 0.2]}>
              <sphereGeometry args={[0.075, 24, 24]} />
              <meshStandardMaterial ref={(el) => void (navs.current[k] = el)} color={p.trim} emissive={p.trim} emissiveIntensity={0.2} roughness={0.3} />
              {p.outline && <Outlines thickness={0.014} color={INK} />}
            </mesh>
          ))}
          {/* Cockpit: trim ring + glowing core dome */}
          <mesh position={[0, 0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.32, 0.08, 40]} />
            <meshPhysicalMaterial color={p.trim} roughness={0.45} clearcoat={0.5} />
            {p.outline && <Outlines thickness={0.018} color={INK} />}
          </mesh>
          <mesh ref={coreMesh} position={[0, 0.02, 0.24]} scale={[1, 1, 0.62]}>
            <sphereGeometry args={[0.235, 40, 40]} />
            <meshPhysicalMaterial color={p.core} emissive={p.core} emissiveIntensity={0.35} roughness={0.15} clearcoat={1} />
          </mesh>
          {thruster(-0.4, 0)}
          {thruster(0.4, 1)}
          <group ref={shot} visible={false} position={[0, 1.1, 0]}>
            <mesh>
              <sphereGeometry args={[0.1, 24, 24]} />
              <meshStandardMaterial color={p.core} emissive={p.core} emissiveIntensity={1.4} />
              {p.outline && <Outlines thickness={0.02} color={INK} />}
            </mesh>
            <mesh position={[0, -0.18, 0]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color={p.core} emissive={p.core} emissiveIntensity={1} transparent opacity={0.6} />
            </mesh>
          </group>
        </group>
      </group>
      {orbColors.map((c, i) => (
        <group key={i} ref={(el) => void (orbs.current[i] = el)} position={[Math.cos(0.5 + (i * TAU) / 3) * ORBIT, Math.sin(0.5 + (i * TAU) / 3) * 0.3 + 0.06, Math.sin(0.5 + (i * TAU) / 3) * 0.85]}>
          <mesh castShadow>
            <sphereGeometry args={[0.12, 32, 32]} />
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={c} />
            {p.outline && <Outlines thickness={0.022} color={INK} />}
          </mesh>
        </group>
      ))}
    </IconMotion>
  );
}
