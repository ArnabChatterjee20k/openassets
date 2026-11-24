import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Broker Stack',
  description:
    'Halfstream hero object: three rounded Kafka broker blades under a half-red cap, with red message cubes streaming along each faceplate and status LEDs rippling. Blades open up on hover; a click flashes every LED.',
  tags: ['kafka', 'broker', 'server', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  body: color('Body').default('#ECECE6'),
  panel: color('Faceplate').default('#16161A'),
  accent: color('Messages + cap').default('#E3000F'),
  led: color('Status LEDs').default('#7CF29A'),
  mood: select(['steady', 'peak traffic'], 'Mood').default('steady'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy' },
  metal: { material: 'metal', body: '#C9CDD4', panel: '#0E0F12' },
  ink: { body: '#232326', panel: '#0A0A0A', led: '#F5F5F0' },
  blueprint: { body: '#2B5CC0', panel: '#0B2457', accent: '#FFDD00', led: '#EAF2FF', material: 'glossy' },
  peak: { mood: 'peak traffic', led: '#FFB020' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={1} thickness={1} ior={1.4} iridescence={0.3} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

const BLADES = [-0.56, 0, 0.56];
const CUBES = 5;
const LEDS = 4;
const W = 2.1;
const H = 0.44;
const D = 1.25;

export default function BrokerStack(p: P) {
  const blades = useRef<(THREE.Group | null)[]>([]);
  const cubes = useRef<(THREE.Mesh | null)[]>([]);
  const leds = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const cap = useRef<THREE.Group>(null);
  const peak = p.mood === 'peak traffic';

  // Idle: messages stream along each faceplate, LEDs ripple, the stack breathes.
  // Hover opens the blades apart and brightens; a click flashes every LED.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    const spread = m.hover * 0.07 + press * 0.12;
    blades.current.forEach((g, b) => {
      if (!g) return;
      g.position.y = BLADES[b] * (1 + spread) + wave(m.t, 1, b * 0.15) * 0.012;
    });
    if (cap.current) cap.current.position.y = 0.88 * (1 + spread) + wave(m.t, 1, 0.45) * 0.012 + press * 0.06;
    cubes.current.forEach((c, i) => {
      if (!c) return;
      const b = Math.floor(i / CUBES);
      const k = i % CUBES;
      // Each blade's log runs left → right; middle blade offset so they never sync.
      const u = cycle(m.t, peak ? 4 : 2, k / CUBES + b * 0.13);
      c.position.x = -0.92 + u * 1.12;
      const s = Math.sin(Math.PI * u);
      c.scale.setScalar(Math.max(0.001, Math.min(1, s * 1.8)));
    });
    leds.current.forEach((mat, i) => {
      if (!mat) return;
      const b = Math.floor(i / LEDS);
      const k = i % LEDS;
      const ripple = 0.5 + 0.5 * wave(m.t, peak ? 4 : 2, k * 0.12 + b * 0.22);
      const tick = blink(m.t, (0.15 + k * 0.21 + b * 0.09) % 1, 0.03);
      mat.emissiveIntensity = 0.35 + ripple * 0.9 + tick * 1.4 + m.hover * 0.6 + press * 3;
    });
  });

  return (
    <IconMotion seed={29} sway={0.1}>
      <group rotation={[0.08, -0.45, 0]} position={[0, -0.05, 0]} scale={0.92}>
        {BLADES.map((y, b) => (
          <group key={b} ref={(el) => void (blades.current[b] = el)} position={[0, y, 0]}>
            <RoundedBox args={[W, H, D]} radius={0.12} smoothness={6} castShadow>
              <Surface kind={p.material} c={p.body} />
            </RoundedBox>
            {/* faceplate inset */}
            <RoundedBox args={[W - 0.22, H - 0.14, 0.06]} radius={0.04} smoothness={4} position={[0, 0, D / 2 - 0.01]}>
              <meshPhysicalMaterial color={p.panel} roughness={0.35} clearcoat={0.6} />
            </RoundedBox>
            {/* the log groove */}
            <mesh position={[-0.36, 0, D / 2 + 0.025]}>
              <boxGeometry args={[1.26, 0.13, 0.01]} />
              <meshStandardMaterial color="#000000" roughness={0.6} />
            </mesh>
            {Array.from({ length: CUBES }, (_, k) => (
              <mesh key={k} ref={(el) => void (cubes.current[b * CUBES + k] = el)} position={[-0.9 + k * 0.22, 0, D / 2 + 0.07]}>
                <boxGeometry args={[0.14, 0.14, 0.12]} />
                <meshPhysicalMaterial color={p.accent} emissive={p.accent} emissiveIntensity={0.35} roughness={0.25} clearcoat={1} />
              </mesh>
            ))}
            {/* status LEDs on the right */}
            {Array.from({ length: LEDS }, (_, k) => (
              <mesh key={k} position={[0.47 + k * 0.13, 0, D / 2 + 0.04]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.05, 20]} />
                <meshStandardMaterial
                  ref={(el) => void (leds.current[b * LEDS + k] = el)}
                  color={k === 0 ? p.accent : p.led}
                  emissive={k === 0 ? p.accent : p.led}
                  emissiveIntensity={0.8}
                  roughness={0.3}
                />
              </mesh>
            ))}
          </group>
        ))}
        {/* cap: half red, half body, split by a hairline (the bill, halved) */}
        <group ref={cap} position={[0, 0.88, 0]}>
          <RoundedBox args={[W / 2 - 0.02, 0.14, D]} radius={0.06} smoothness={4} position={[-W / 4, 0, 0]}>
            <meshPhysicalMaterial color={p.accent} roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
          </RoundedBox>
          <RoundedBox args={[W / 2 - 0.02, 0.14, D]} radius={0.06} smoothness={4} position={[W / 4, 0, 0]}>
            <Surface kind={p.material} c={p.body} />
          </RoundedBox>
        </group>
        {/* feet */}
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 0.82, -0.86, sz * 0.42]}>
              <cylinderGeometry args={[0.09, 0.11, 0.1, 24]} />
              <meshStandardMaterial color={p.panel} roughness={0.5} />
            </mesh>
          )),
        )}
      </group>
    </IconMotion>
  );
}
