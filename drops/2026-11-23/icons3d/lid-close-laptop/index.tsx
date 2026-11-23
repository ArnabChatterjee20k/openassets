import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Lid-Close Laptop',
  description:
    'Latch\'s landing-page hero: a soft clamshell laptop whose lid dips shut and springs back open while a yellow commit LED pulses and sends out a ring. Hover opens it wider; a click snaps the lid down and flashes the LED.',
  tags: ['laptop', 'hero', '3d', 'commit', 'developer'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  body: color('Body').default('#DCE7FA'),
  screen: color('Screen').default('#134AA8'),
  code: color('Code lines').default('#7FB2FF'),
  led: color('Commit LED').default('#FFDD00'),
  ring: toggle('Commit ring').default(true),
  mood: select(['calm', 'lively'], 'Mood').default('lively'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', body: '#F4F6FA', screen: '#0F3B8C' },
  'space-grey': { material: 'metal', body: '#9AA3B2', screen: '#0B0D14', code: '#C6FF00', led: '#C6FF00' },
  glass: { material: 'glass', body: '#CFE2FF', ring: false },
  terracotta: { body: '#E5CDB2', screen: '#3B1F14', code: '#F2A541', led: '#C8553D' },
  calm: { mood: 'calm' },
};

type P = z.infer<typeof schema>;

function Shell({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.34} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.6} ior={1.4} iridescence={0.3} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

const W = 2.1; // width
const D = 1.4; // base depth
const BT = 0.13; // base thickness
const LH = 1.32; // lid height
const LT = 0.07; // lid thickness
const OPEN = -0.36; // ~110° open (0 = upright, +PI/2 = shut)
const LINES: [number, number, number][] = [
  // x offset, width, row
  [-0.62, 0.5, 0],
  [-0.48, 0.9, 1],
  [-0.48, 0.62, 2],
  [-0.62, 0.34, 3],
  [-0.48, 1.05, 4],
  [-0.34, 0.56, 5],
];

const CODE_Y = LH / 2 + 0.36;
const smooth =(x: number) => x * x * (3 - 2 * x);

export default function LidCloseLaptop(p: P) {
  const lid = useRef<THREE.Group>(null);
  const ledMat = useRef<THREE.MeshStandardMaterial>(null);
  const screenMat = useRef<THREE.MeshStandardMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const code = useRef<THREE.Group>(null);
  const lively = p.mood === 'lively';

  // Idle life: once per loop the lid dips toward shut and springs back (the product's
  // whole idea), the commit LED pulses at the bottom of the dip and a ring rolls out.
  useLoop((m) => {
    const u = cycle(m.t);
    const dip = u > 0.3 && u < 0.7 ? Math.sin(((u - 0.3) / 0.4) * Math.PI) : 0;
    const depth = lively ? 1.0 : 0.55;
    const press = pressBounce(m.pressAge);
    const snap = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 3) : 0;
    const angle = OPEN - m.hover * 0.14 + smooth(dip) * depth * 1.45 + snap * 1.1 + press * 0.15;
    if (lid.current) lid.current.rotation.x = Math.min(angle, Math.PI / 2 - 0.06);
    const hit = blink(m.t, 0.5, 0.06);
    const flash = Math.max(hit, snap);
    if (ledMat.current) ledMat.current.emissiveIntensity = 0.6 + flash * 3.2 + (wave(m.t, 2) * 0.5 + 0.5) * 0.3;
    if (screenMat.current) screenMat.current.emissiveIntensity = 0.35 + m.hover * 0.35 - smooth(dip) * 0.2;
    if (ringRef.current && ringMat.current) {
      const r = u > 0.5 && u < 0.85 ? (u - 0.5) / 0.35 : 0;
      ringRef.current.scale.setScalar(0.2 + r * 2.4);
      ringMat.current.opacity = r > 0 ? (1 - r) * 0.85 : 0;
    }
    // code nudges up a line twice per loop, like a terminal printing
    if (code.current) code.current.position.y = CODE_Y + (lively ? smooth(Math.min(1, cycle(m.t, 2) * 4)) * 0.13 - 0.13 : 0);
  });

  return (
    <IconMotion seed={23} sway={0.06}>
      <group rotation={[0.18, -0.55, 0]} position={[0, -0.05, 0]} scale={0.95}>
        {/* base deck */}
        <RoundedBox args={[W, BT, D]} radius={0.06} smoothness={5} position={[0, -0.55, 0]}>
          <Shell kind={p.material} c={p.body} />
        </RoundedBox>
        {/* keyboard well + trackpad, slightly recessed tone */}
        <RoundedBox args={[W * 0.86, 0.02, D * 0.42]} radius={0.01} smoothness={2} position={[0, -0.48, -0.22]}>
          <meshStandardMaterial color={new THREE.Color(p.body).multiplyScalar(0.8)} roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[W * 0.32, 0.015, D * 0.24]} radius={0.01} smoothness={2} position={[0, -0.482, 0.36]}>
          <meshStandardMaterial color={new THREE.Color(p.body).multiplyScalar(0.9)} roughness={0.5} />
        </RoundedBox>
        {/* commit LED on the front lip */}
        <mesh position={[0.62, -0.55, D / 2 + 0.005]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.036, 0.24, 6, 16]} />
          <meshStandardMaterial ref={ledMat} color={p.led} emissive={p.led} emissiveIntensity={0.8} roughness={0.3} />
        </mesh>
        {p.ring && (
          <mesh ref={ringRef} position={[0.62, -0.62, D / 2 + 0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={0.2}>
            <torusGeometry args={[0.2, 0.012, 8, 64]} />
            <meshBasicMaterial ref={ringMat} color={p.led} transparent opacity={0} depthWrite={false} />
          </mesh>
        )}

        {/* lid, hinged on the back edge of the deck */}
        <group ref={lid} position={[0, -0.5, -D / 2 + 0.04]} rotation={[OPEN, 0, 0]}>
          <RoundedBox args={[W, LH, LT]} radius={0.035} smoothness={5} position={[0, LH / 2, 0]}>
            <Shell kind={p.material} c={p.body} />
          </RoundedBox>
          {/* screen */}
          <mesh position={[0, LH / 2 + 0.02, LT / 2 + 0.002]}>
            <planeGeometry args={[W * 0.9, LH * 0.84]} />
            <meshStandardMaterial ref={screenMat} color={p.screen} emissive={p.screen} emissiveIntensity={0.35} roughness={0.25} />
          </mesh>
          {/* code lines, clipped to the screen area by staying short */}
          <group ref={code} position={[0, CODE_Y, LT / 2 + 0.006]}>
            {LINES.map(([x, w, row], i) => (
              <mesh key={i} position={[x + w / 2, -row * 0.13, 0]}>
                <planeGeometry args={[w, 0.05]} />
                <meshStandardMaterial color={i === 4 ? p.led : p.code} emissive={i === 4 ? p.led : p.code} emissiveIntensity={0.7} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
