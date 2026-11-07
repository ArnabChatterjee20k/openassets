import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Pacing Dial',
  description:
    'Budget-pacing hero for Mandate: a chunky instrument dial with a bone face, a gold “on pace” band and a heavy needle. The needle hunts around the band and the lamp blinks; hover settles it dead on pace, a click slams it to full burn and it rebounds.',
  tags: ['gauge', 'pacing', 'budget', 'dial', '3d', 'dashboard'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  body: color('Housing').default('#1C1C20'),
  face: color('Dial face').default('#F3EDE2'),
  trim: color('Bezel & band').default('#C9A45C'),
  needle: color('Needle').default('#0D0D0F'),
  lamp: color('Status lamp').default('#E8D9B5'),
  mood: select(['calm', 'active'], 'Mood').default('active'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  bone: { material: 'clay', body: '#E9E2D4', face: '#1C1C20', trim: '#B08A45', needle: '#F3EDE2', lamp: '#FFD27F' },
  bullion: { material: 'metal', body: '#C9A45C', face: '#F3EDE2', trim: '#3A3A40', needle: '#1C1C20', lamp: '#E3000F' },
  glass: { material: 'glass', body: '#F3EDE2', face: '#F3EDE2', trim: '#C9A45C', needle: '#1C1C20', lamp: '#FFE8A3', mood: 'calm' },
  swiss: { material: 'clay', body: '#F5F5F0', face: '#FFFFFF', trim: '#E3000F', needle: '#0A0A0A', lamp: '#E3000F' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={1} thickness={1.4} ior={1.4} attenuationColor={c} attenuationDistance={2.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.25} clearcoat={1} clearcoatRoughness={0.06} />;
  }
}

const Trim = ({ c }: { c: string }) => <meshStandardMaterial color={c} metalness={0.9} roughness={0.28} envMapIntensity={1.2} />;

const R = 0.92; // dial radius
const DEPTH = 0.42;
const SWEEP = (270 * Math.PI) / 180;
const START = (225 * Math.PI) / 180;
/** Angle (radians, CCW from +x) for a dial value 0..1, sweeping clockwise. */
const ang = (v: number) => START - v * SWEEP;
const ZONE: [number, number] = [0.56, 0.8];
const REST = 0.66;

export default function PacingDial(p: P) {
  const needle = useRef<THREE.Group>(null);
  const band = useRef<THREE.MeshStandardMaterial>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const active = p.mood === 'active';

  // Idle: the needle hunts around the gold band (slow swing + fast jitter),
  // the band breathes, the lamp blinks. Hover locks it on pace; a click slams
  // it to full burn and lets it spring back.
  useLoop((m) => {
    const k = active ? 1 : 0.35;
    const hunt = (wave(m.t, 1) * 0.12 + wave(m.t, 4, 0.2) * 0.025) * k * (1 - m.hover * 0.85);
    const press = Number.isFinite(m.pressAge) ? m.pressAge : Infinity;
    const slam = press < 2 ? Math.exp(-press * 2.6) * (0.34 - Math.sin(press * 14) * 0.08) : 0;
    const v = Math.min(1, REST + hunt + slam);
    if (needle.current) needle.current.rotation.z = ang(v) - Math.PI / 2;
    if (band.current) band.current.emissiveIntensity = 0.5 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 * k + m.hover * 1.1 + slam * 3;
    if (lamp.current) lamp.current.emissiveIntensity = 0.5 + Math.max(blink(m.t, 0.25, 0.04), blink(m.t, 0.75, 0.04) * (active ? 1 : 0)) * 3 + slam * 4;
  });

  const [z0, z1] = [ang(ZONE[1]), ang(ZONE[0])];
  const front = DEPTH / 2;
  return (
    <IconMotion seed={57} float={0.05} sway={0.08}>
      <group rotation={[0.12, -0.42, 0]} position={[0, 0.02, 0]} scale={1.05}>
        {/* housing: a deep drum */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[R + 0.1, R + 0.14, DEPTH, 96]} />
          <Surface kind={p.material} c={p.body} />
        </mesh>
        {/* rear cap, a touch smaller, so the drum reads as a turned object */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -front - 0.05]}>
          <cylinderGeometry args={[R - 0.05, R + 0.05, 0.1, 64]} />
          <Surface kind={p.material} c={p.body} />
        </mesh>
        {/* bezel */}
        <mesh position={[0, 0, front]}>
          <torusGeometry args={[R + 0.04, 0.075, 24, 128]} />
          <Trim c={p.trim} />
        </mesh>
        {/* face */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, front - 0.02]}>
          <cylinderGeometry args={[R - 0.02, R - 0.02, 0.04, 96]} />
          <meshPhysicalMaterial color={p.face} roughness={0.45} clearcoat={0.4} />
        </mesh>
        {/* gold "on pace" band: the one glowing accent */}
        <mesh position={[0, 0, front + 0.012]} rotation={[0, 0, z0]}>
          <torusGeometry args={[R * 0.74, 0.055, 16, 64, z1 - z0]} />
          <meshStandardMaterial ref={band} color={p.trim} emissive={p.trim} emissiveIntensity={0.8} metalness={0.4} roughness={0.3} toneMapped={false} />
        </mesh>
        {/* tick ring */}
        {Array.from({ length: 29 }, (_, i) => {
          const v = i / 28;
          const a = ang(v);
          const long = i % 7 === 0;
          const r = R * (long ? 0.82 : 0.85);
          return (
            <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, front + 0.01]} rotation={[0, 0, a]}>
              <boxGeometry args={[long ? 0.17 : 0.09, long ? 0.035 : 0.022, 0.02]} />
              <meshStandardMaterial color={p.needle} roughness={0.5} />
            </mesh>
          );
        })}
        {/* red-line wedge at full burn */}
        <mesh position={[0, 0, front + 0.01]} rotation={[0, 0, ang(1)]}>
          <torusGeometry args={[R * 0.9, 0.03, 12, 32, ang(0.9) - ang(1)]} />
          <meshStandardMaterial color={p.needle} roughness={0.4} />
        </mesh>
        {/* needle: tapered blade + counterweight, pivoting at the centre */}
        <group ref={needle} position={[0, 0, front + 0.06]} rotation={[0, 0, ang(REST) - Math.PI / 2]}>
          <mesh position={[0, R * 0.36, 0]}>
            <cylinderGeometry args={[0.018, 0.05, R * 0.78, 4]} />
            <meshPhysicalMaterial color={p.needle} roughness={0.3} clearcoat={1} />
          </mesh>
          <mesh position={[0, -0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 32]} />
            <meshPhysicalMaterial color={p.needle} roughness={0.3} clearcoat={1} />
          </mesh>
        </group>
        {/* hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, front + 0.09]}>
          <cylinderGeometry args={[0.11, 0.13, 0.08, 32]} />
          <Trim c={p.trim} />
        </mesh>
        {/* plinth */}
        <RoundedBox args={[1.25, 0.26, 0.62]} radius={0.08} smoothness={4} position={[0, -R - 0.17, -0.02]} castShadow>
          <Surface kind={p.material} c={p.body} />
        </RoundedBox>
        <RoundedBox args={[1.38, 0.08, 0.72]} radius={0.03} smoothness={3} position={[0, -R - 0.32, -0.02]}>
          <Trim c={p.trim} />
        </RoundedBox>
        {/* status lamp on a little crown */}
        <mesh position={[0, R + 0.16, 0]}>
          <cylinderGeometry args={[0.1, 0.13, 0.1, 32]} />
          <Trim c={p.trim} />
        </mesh>
        <mesh position={[0, R + 0.25, 0]}>
          <sphereGeometry args={[0.085, 24, 24]} />
          <meshStandardMaterial ref={lamp} color={p.lamp} emissive={p.lamp} emissiveIntensity={0.6} roughness={0.2} toneMapped={false} />
        </mesh>
      </group>
    </IconMotion>
  );
}
