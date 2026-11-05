import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Mycel Agent',
  description: 'The Mycel AI ad agent as a 3D mascot: a rounded CRT-terminal head with pixel eyes and a glowing antenna, with three ad tiles orbiting on a thread ring. Blinks and orbits; hover speeds it up, a click flashes the screen and spins the tiles.',
  tags: ['agent', 'ai', 'robot', 'mascot', 'ads', '3d'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  body: color('Body').default('#DCE6C6'),
  screen: color('Screen').default('#12241A'),
  glow: color('Eyes & thread').default('#B5E550'),
  tile1: color('Ad tile 1').default('#4E8A5B'),
  tile2: color('Ad tile 2').default('#B5E550'),
  live: color('Live dot').default('#FF9F43'),
  mood: select(['calm', 'busy'], 'Mood').default('busy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', body: '#B5E550', screen: '#0E1A14', glow: '#EAF2DC', tile1: '#18291F', tile2: '#FF9F43' },
  metal: { material: 'metal', body: '#E2E6DC', glow: '#B5E550', tile1: '#8F9A88', tile2: '#C9A45C' },
  glass: { material: 'glass', body: '#E4F4DC', mood: 'calm' },
  'deep-sea': { body: '#9FE3D6', screen: '#021B26', glow: '#2EF2C4', tile1: '#1B7FA6', tile2: '#2EF2C4', live: '#FF7A59' },
  calm: { mood: 'calm' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} sheen={0.3} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.42} metalness={1} envMapIntensity={1.5} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={1} thickness={0.6} ior={1.3} iridescence={0.3} attenuationColor={c} attenuationDistance={6} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

// Pixel smile, in screen units.
const SMILE: [number, number][] = [
  [-0.24, -0.14],
  [-0.12, -0.22],
  [0, -0.22],
  [0.12, -0.22],
  [0.24, -0.14],
];
const TILES = 3;

export default function MycelAgent(p: P) {
  const busy = p.mood === 'busy';
  const eyes = useRef<(THREE.Mesh | null)[]>([]);
  const eyeMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const screenMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const tip = useRef<THREE.MeshStandardMaterial>(null);
  const tipMesh = useRef<THREE.Mesh>(null);
  const orbit = useRef<THREE.Group>(null);
  const tiles = useRef<(THREE.Group | null)[]>([]);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: eyes blink twice per loop, the antenna's live dot pulses, ad tiles
  // orbit on the thread ring. Hover widens the eyes and speeds the orbit;
  // a click flashes the screen and whips the tiles round.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const kick = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 3) : 0;
    const b = Math.max(blink(m.t, 0.42, 0.03), blink(m.t, 0.9, 0.03));
    eyes.current.forEach((e) => {
      if (!e) return;
      e.scale.y = Math.max(0.08, (1 - b) * (1 + m.hover * 0.25));
      e.scale.x = 1 + m.hover * 0.1;
    });
    eyeMats.current.forEach((mt) => {
      if (mt) mt.emissiveIntensity = 0.7 + m.hover * 0.5 + kick * 1.5;
    });
    if (screenMat.current) screenMat.current.emissiveIntensity = 0.05 + kick * 0.9;
    const pulse = wave(m.t, busy ? 4 : 2) * 0.5 + 0.5;
    if (tip.current) tip.current.emissiveIntensity = 0.12 + pulse * 0.45;
    if (tipMesh.current) tipMesh.current.scale.setScalar(1 + pulse * 0.12 + Math.abs(press) * 0.4);
    if (ringMat.current) ringMat.current.emissiveIntensity = 0.5 + pulse * 0.4 + m.hover * 0.6;
    if (orbit.current) {
      // Busy: one full revolution per loop (seamless). Calm: a gentle back-and-forth.
      const base = busy ? cycle(m.t, 1) * Math.PI * 2 : wave(m.t, 1) * 0.5;
      orbit.current.rotation.y = base + m.hover * wave(m.t, 2) * 0.25 + kick * Math.PI * 2;
    }
    tiles.current.forEach((g, i) => {
      if (!g) return;
      g.position.y = wave(m.t, 2, i / TILES) * 0.06;
      // keep tiles facing the camera as the ring turns
      g.rotation.y = -(orbit.current?.rotation.y ?? 0);
    });
  });

  const R = 1.22;

  return (
    <IconMotion seed={29}>
      <group position={[0, -0.02, 0]} scale={1.06}>
        {/* Head */}
        <RoundedBox args={[1.7, 1.32, 1.1]} radius={0.3} smoothness={6} castShadow>
          <Surface kind={p.material} c={p.body} />
        </RoundedBox>
        {/* Screen bezel + glass */}
        <RoundedBox args={[1.36, 0.98, 0.1]} radius={0.12} smoothness={5} position={[0, 0.02, 0.53]}>
          <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={new THREE.Color(p.body).multiplyScalar(0.82).getStyle()} />
        </RoundedBox>
        <RoundedBox args={[1.2, 0.84, 0.08]} radius={0.1} smoothness={5} position={[0, 0.02, 0.58]}>
          <meshPhysicalMaterial ref={screenMat} color={p.screen} roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} emissive={p.glow} emissiveIntensity={0.05} />
        </RoundedBox>
        {/* Pixel eyes */}
        {[-0.27, 0.27].map((x, i) => (
          <mesh key={x} ref={(el) => void (eyes.current[i] = el)} position={[x, 0.12, 0.63]}>
            <boxGeometry args={[0.16, 0.24, 0.03]} />
            <meshStandardMaterial ref={(el) => void (eyeMats.current[i] = el)} color={p.glow} emissive={p.glow} emissiveIntensity={0.7} />
          </mesh>
        ))}
        {/* Pixel smile */}
        {SMILE.map(([x, y]) => (
          <mesh key={x} position={[x, y - 0.02, 0.63]}>
            <boxGeometry args={[0.1, 0.08, 0.03]} />
            <meshStandardMaterial color={p.glow} emissive={p.glow} emissiveIntensity={0.55} />
          </mesh>
        ))}
        {/* Ear knobs */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.22, 0.14, 40]} />
              <Surface kind={p.material} c={new THREE.Color(p.body).multiplyScalar(0.85).getStyle()} />
            </mesh>
            <mesh position={[0, s * 0.08, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.06, 32]} />
              <meshStandardMaterial color={p.glow} emissive={p.glow} emissiveIntensity={0.7} />
            </mesh>
          </group>
        ))}
        {/* Antenna with live dot */}
        <mesh position={[0.32, 0.86, 0]} rotation={[0, 0, -0.18]}>
          <cylinderGeometry args={[0.035, 0.045, 0.42, 16]} />
          <meshStandardMaterial color="#6E7A68" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.32, 0.68, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 0.08, 32]} />
          <Surface kind={p.material} c={p.body} />
        </mesh>
        <mesh ref={tipMesh} position={[0.37, 1.1, 0]}>
          <sphereGeometry args={[0.11, 32, 24]} />
          <meshStandardMaterial ref={tip} color={p.live} emissive={p.live} emissiveIntensity={0.12} roughness={0.25} />
        </mesh>

        {/* Thread ring with orbiting ad tiles, tilted toward the viewer */}
        <group rotation={[0.32, 0, -0.12]} position={[0, -0.12, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[R, 0.018, 12, 128]} />
            <meshStandardMaterial ref={ringMat} color={p.glow} emissive={p.glow} emissiveIntensity={0.7} transparent opacity={0.85} />
          </mesh>
          <group ref={orbit}>
            {Array.from({ length: TILES }, (_, i) => {
              const a = (i / TILES) * Math.PI * 2 + 0.5;
              const c = [p.tile1, p.tile2, p.live][i];
              return (
                <group key={i} position={[Math.cos(a) * R, 0, Math.sin(a) * R]}>
                  <group ref={(el) => void (tiles.current[i] = el)}>
                    <RoundedBox args={[0.42, 0.32, 0.08]} radius={0.05} smoothness={4}>
                      <meshPhysicalMaterial color={c} roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
                    </RoundedBox>
                    {/* little "ad": image block + two text lines */}
                    <mesh position={[-0.1, 0.03, 0.045]}>
                      <planeGeometry args={[0.13, 0.16]} />
                      <meshStandardMaterial color="#F4F7EC" />
                    </mesh>
                    <mesh position={[0.08, 0.07, 0.045]}>
                      <planeGeometry args={[0.15, 0.035]} />
                      <meshStandardMaterial color="#F4F7EC" />
                    </mesh>
                    <mesh position={[0.06, 0.0, 0.045]}>
                      <planeGeometry args={[0.11, 0.035]} />
                      <meshStandardMaterial color="#F4F7EC" opacity={0.7} transparent />
                    </mesh>
                  </group>
                </group>
              );
            })}
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
