import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Daily Kit Box',
  description:
    "OpenAssets' landing hero: today's kit box, flaps open, with the day's assets riding out of it — an icon tile with a sparkle, a 3D cube and a video tile. Assets bob out in a stagger and the sparkle turns; hover lifts and fans them, click pops them out with a spin.",
  tags: ['kit', 'box', 'package', 'hero', '3d', 'launch', 'openassets'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  box: color('Box').default('#FF48B0'),
  tape: color('Label').default('#FFE800'),
  ink: color('Ink (marks, video tile)').default('#1F2A6B'),
  tile: color('Icon tile').default('#0078BF'),
  cube: color('Cube').default('#FFE800'),
  paper: color('Sparkle / paper').default('#F4EFE6'),
  mood: select(['calm', 'lively'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', box: '#0078BF', tile: '#FF48B0', cube: '#FFE800', tape: '#F4EFE6' },
  brutalist: { box: '#5C8AFF', tape: '#FFE45C', ink: '#111111', tile: '#FF5C8A', cube: '#00D1A0', paper: '#FFFDF2', mood: 'lively' },
  metal: { material: 'metal', box: '#C3C8D1', tape: '#FF3DB4', ink: '#101219', tile: '#3D5AFE', cube: '#B8C0CC' },
  glass: { material: 'glass', box: '#8A7BFF', tape: '#FDF3F8', ink: '#3A1F4A', tile: '#FF7EB6', cube: '#4FD1C5', paper: '#FFFFFF' },
  acid: { box: '#1A1A1A', tape: '#C6FF00', ink: '#FF00E5', tile: '#00F0FF', cube: '#C6FF00', paper: '#F0FFE0', mood: 'lively' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.15} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={0.75} thickness={0.8} ior={1.4} attenuationColor={c} attenuationDistance={0.9} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

/** Flat print (labels, marks): always matte so it reads on any material. */
const Print = ({ c }: { c: string }) => <meshStandardMaterial color={c} roughness={0.75} />;

const BW = 1.8; // box width
const BH = 1.2; // box height
const BD = 1.4; // box depth
const TOP = 0; // box top sits at y = 0
const FT = 0.06; // flap thickness

const bevel = { bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 4, curveSegments: 24 };

export default function DailyKitBox(p: P) {
  const lively = p.mood === 'lively';
  const icon = useRef<THREE.Group>(null);
  const cube = useRef<THREE.Group>(null);
  const film = useRef<THREE.Group>(null);
  const sparkle = useRef<THREE.Group>(null);
  const flaps = useRef<(THREE.Group | null)[]>([]);
  const mark = useRef<THREE.Group>(null);

  // Four-point sparkle with concave sides.
  const sparkleGeo = useMemo(() => {
    const r = 0.26;
    const k = 0.045;
    const s = new THREE.Shape();
    s.moveTo(0, r);
    s.quadraticCurveTo(k, k, r, 0);
    s.quadraticCurveTo(k, -k, 0, -r);
    s.quadraticCurveTo(-k, -k, -r, 0);
    s.quadraticCurveTo(-k, k, 0, r);
    return new THREE.ExtrudeGeometry(s, { depth: 0.05, ...bevel, bevelSize: 0.015, bevelThickness: 0.015 });
  }, []);

  const playGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.09, 0.12);
    s.lineTo(0.13, 0);
    s.lineTo(-0.09, -0.12);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, ...bevel, bevelSize: 0.02, bevelThickness: 0.015 });
  }, []);

  // Rest pose: the three assets sit just above the rim, flaps open.
  const rest = {
    icon: { x: -0.56, y: 0.66, z: 0.18, rz: 0.16 },
    cube: { x: 0.64, y: 0.5, z: 0.22 },
    film: { x: 0.06, y: 1.2, z: -0.38, rz: -0.08 },
  };
  const flapRest = [0.95, 0.95, 0.95, -0.35]; // back, left, right, front

  useLoop((m) => {
    const energy = (lively ? 1 : 0.6) + m.hover * 0.5;
    const age = m.pressAge;
    const pop = Number.isFinite(age) && age < 1.2 ? Math.sin(Math.PI * Math.min(1, age / 1.2)) : 0;
    const spin = Number.isFinite(age) && age < 1.2 ? (1 - Math.pow(1 - Math.min(1, age / 1.2), 3)) * Math.PI * 2 : 0;
    const pb = pressBounce(age);
    // Each asset rides out of the box on its own phase (staggered bob).
    const ride = (ph: number) => (0.5 - 0.5 * Math.cos(2 * Math.PI * cycle(m.t, lively ? 2 : 1, ph))) * 0.16 * energy;
    if (icon.current) {
      icon.current.position.set(rest.icon.x - m.hover * 0.18, rest.icon.y + ride(0) + m.hover * 0.22 + pop * 0.55, rest.icon.z);
      icon.current.rotation.set(0, wave(m.t, 1, 0.1) * 0.12 + spin, rest.icon.rz + m.hover * 0.12);
    }
    if (cube.current) {
      cube.current.position.set(rest.cube.x + m.hover * 0.16, rest.cube.y + ride(0.33) + m.hover * 0.18 + pop * 0.45, rest.cube.z);
      cube.current.rotation.set(0.42 + wave(m.t, 1, 0.3) * 0.08, 0.62 + cycle(m.t, 1) * Math.PI * 0.5 * (lively ? 1 : 0) + spin * 0.5, 0);
    }
    if (film.current) {
      film.current.position.set(rest.film.x, rest.film.y + ride(0.66) + m.hover * 0.3 + pop * 0.7, rest.film.z);
      film.current.rotation.set(0, wave(m.t, 1, 0.6) * 0.1 - spin * 0.5, rest.film.rz);
    }
    // Sparkle turns a quarter per loop (4-fold symmetric, so it loops seamlessly) and twinkles.
    if (sparkle.current) {
      sparkle.current.rotation.z = -cycle(m.t, lively ? 2 : 1) * (Math.PI / 2);
      const tw = 1 + blink(m.t, 0.5, 0.06) * 0.25 + blink(m.t, 0.0, 0.06) * 0.25 + Math.abs(pb) * 0.3;
      sparkle.current.scale.set(tw, tw, 1);
    }
    // Flaps breathe; hover opens them wider, a click flings them.
    flaps.current.forEach((g, i) => {
      if (!g) return;
      const sign = i === 3 ? -1 : 1;
      const a = flapRest[i] + sign * (wave(m.t, 2, i * 0.15) * 0.05 * energy + m.hover * 0.18 + pop * 0.3);
      if (i === 0) g.rotation.x = a;
      else if (i === 1) g.rotation.z = -a;
      else if (i === 2) g.rotation.z = a;
      else g.rotation.x = -a;
    });
    // Registration mark on the label pulses like a press hitting register.
    if (mark.current) {
      const s = 1 + blink(m.t, 0.25, 0.05) * 0.18 + Math.abs(pb) * 0.2;
      mark.current.scale.set(s, s, 1);
    }
  });

  const inner = new THREE.Color(p.box).multiplyScalar(0.45).getStyle();

  return (
    <IconMotion seed={31} sway={0.07}>
      <group scale={0.78} position={[0, -0.12, 0]} rotation={[0.1, -0.32, 0]}>
        {/* Box body */}
        <RoundedBox args={[BW, BH, BD]} radius={0.09} smoothness={4} position={[0, TOP - BH / 2, 0]}>
          <Surface kind={p.material} c={p.box} />
        </RoundedBox>
        {/* Dark interior so the box reads as open */}
        <mesh position={[0, TOP + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[BW - 0.14, BD - 0.14]} />
          <meshStandardMaterial color={inner} roughness={0.9} />
        </mesh>

        {/* Flaps, hinged on the rim */}
        <group position={[0, TOP, -BD / 2 + 0.02]} ref={(g) => void (flaps.current[0] = g)}>
          <RoundedBox args={[BW - 0.06, FT, 0.62]} radius={0.025} smoothness={3} position={[0, 0, -0.31]}>
            <Surface kind={p.material} c={p.box} />
          </RoundedBox>
        </group>
        <group position={[-BW / 2 + 0.02, TOP, 0]} ref={(g) => void (flaps.current[1] = g)}>
          <RoundedBox args={[0.62, FT, BD - 0.06]} radius={0.025} smoothness={3} position={[-0.31, 0, 0]}>
            <Surface kind={p.material} c={p.box} />
          </RoundedBox>
        </group>
        <group position={[BW / 2 - 0.02, TOP, 0]} ref={(g) => void (flaps.current[2] = g)}>
          <RoundedBox args={[0.62, FT, BD - 0.06]} radius={0.025} smoothness={3} position={[0.31, 0, 0]}>
            <Surface kind={p.material} c={p.box} />
          </RoundedBox>
        </group>
        <group position={[0, TOP, BD / 2 - 0.02]} ref={(g) => void (flaps.current[3] = g)}>
          <RoundedBox args={[BW - 0.06, FT, 0.5]} radius={0.025} smoothness={3} position={[0, 0, 0.25]}>
            <Surface kind={p.material} c={p.box} />
          </RoundedBox>
        </group>

        {/* Front label: kit tag with a registration mark (the kit's motif) */}
        <group position={[0, TOP - BH * 0.55, BD / 2 + 0.005]}>
          <RoundedBox args={[1.1, 0.5, 0.04]} radius={0.04} smoothness={3}>
            <meshPhysicalMaterial color={p.tape} roughness={0.55} clearcoat={0.3} />
          </RoundedBox>
          <group position={[-0.32, 0, 0.03]} ref={mark}>
            <mesh>
              <torusGeometry args={[0.14, 0.022, 12, 48]} />
              <Print c={p.ink} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.42, 0.03, 0.02]} />
              <Print c={p.ink} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.03, 0.42, 0.02]} />
              <Print c={p.ink} />
            </mesh>
          </group>
          {/* "KIT 03" type lines */}
          <RoundedBox args={[0.46, 0.09, 0.02]} radius={0.01} smoothness={2} position={[0.17, 0.08, 0.025]}>
            <Print c={p.ink} />
          </RoundedBox>
          <RoundedBox args={[0.3, 0.06, 0.02]} radius={0.01} smoothness={2} position={[0.09, -0.08, 0.025]}>
            <Print c={p.ink} />
          </RoundedBox>
        </group>

        {/* Video tile (behind): ink tile with a play triangle and sprocket dots */}
        <group ref={film} position={[rest.film.x, rest.film.y, rest.film.z]}>
          <RoundedBox args={[0.82, 0.6, 0.12]} radius={0.06} smoothness={4}>
            <Surface kind={p.material} c={p.ink} />
          </RoundedBox>
          <mesh geometry={playGeo} position={[0, 0, 0.06]}>
            <meshPhysicalMaterial color={p.box} roughness={0.4} clearcoat={0.5} />
          </mesh>
          {[-0.3, -0.15, 0, 0.15, 0.3].map((x) =>
            [0.23, -0.23].map((y) => (
              <mesh key={`${x}${y}`} position={[x, y, 0.065]}>
                <boxGeometry args={[0.07, 0.04, 0.01]} />
                <Print c={p.paper} />
              </mesh>
            )),
          )}
        </group>

        {/* 3D cube asset */}
        <group ref={cube} position={[rest.cube.x, rest.cube.y, rest.cube.z]}>
          <RoundedBox args={[0.56, 0.56, 0.56]} radius={0.08} smoothness={4}>
            <Surface kind={p.material} c={p.cube} />
          </RoundedBox>
        </group>

        {/* Icon tile with sparkle (front) */}
        <group ref={icon} position={[rest.icon.x, rest.icon.y, rest.icon.z]}>
          <RoundedBox args={[0.82, 0.82, 0.16]} radius={0.14} smoothness={5}>
            <Surface kind={p.material} c={p.tile} />
          </RoundedBox>
          <group position={[0, 0, 0.08]} ref={sparkle}>
            <mesh geometry={sparkleGeo}>
              <meshPhysicalMaterial color={p.paper} roughness={0.35} clearcoat={0.6} />
            </mesh>
          </group>
          <mesh position={[0.22, 0.22, 0.1]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.07, 0.07, 0.04]} />
            <Print c={p.paper} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
