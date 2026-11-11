import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Mimo Pod',
  description:
    'The Mimo hero: a pearly Y2K pocket-pet egg with an LCD face, gel buttons and a pink ping bubble. It blinks and bobs; hover makes it look up and glow, a click pops the bubble.',
  tags: ['ai agent', 'mascot', 'y2k', 'hero', '3d', 'ads'],
};

export const schema = z.object({
  material: select(['pearl', 'chrome', 'translucent', 'glossy'], 'Material').default('pearl'),
  body: color('Shell').default('#EEF0F5'),
  screen: color('LCD glow').default('#3D5AFE'),
  buttons: color('Buttons').default('#3D5AFE'),
  bubble: color('Ping bubble').default('#FF3DB4'),
  mood: select(['lively', 'calm'], 'Mood').default('lively'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  chrome: { material: 'chrome', body: '#EEF1F7', screen: '#3D5AFE', buttons: '#FF3DB4' },
  bondi: { material: 'translucent', body: '#4FC3D9', screen: '#2B3BFF', buttons: '#EEF0F5', bubble: '#FFE14D' },
  candy: { material: 'glossy', body: '#FF7EB6', screen: '#8A7BFF', buttons: '#4FD1C5', bubble: '#8A7BFF' },
  lilac: { material: 'glossy', body: '#D6CCEC', screen: '#5E4AE3', buttons: '#F49CBB', bubble: '#2EC4B6' },
  calm: { mood: 'calm' },
};

type P = z.infer<typeof schema>;

function Shell({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'chrome':
      return <meshStandardMaterial color={c} metalness={0.9} roughness={0.34} envMapIntensity={1.6} />;
    case 'translucent':
      return <meshPhysicalMaterial color={c} roughness={0.12} transmission={0.85} thickness={1.4} ior={1.4} clearcoat={1} attenuationColor={c} attenuationDistance={1.6} />;
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.25} clearcoat={1} clearcoatRoughness={0.06} />;
    default:
      // Pearl: soft white plastic with an iridescent sheen, like a 2001 handheld.
      return <meshPhysicalMaterial color={c} roughness={0.28} clearcoat={1} clearcoatRoughness={0.1} iridescence={0.7} iridescenceIOR={1.4} sheen={0.5} sheenColor="#ffffff" />;
  }
}

const DEPTH = 0.62; // the egg is flattened front-to-back like a handheld

/** Egg profile: wider at the bottom, revolved around y. */
function eggProfile() {
  const pts: THREE.Vector2[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI;
    const r = Math.max(0.0001, Math.sin(t) * 0.95 * (1 + 0.1 * Math.cos(t)));
    pts.push(new THREE.Vector2(r, -Math.cos(t) * 1.2));
  }
  return pts;
}

export default function MimoPod(p: P) {
  const egg = useMemo(() => new THREE.LatheGeometry(eggProfile(), 96), []);
  const lively = p.mood === 'lively';

  const eyes = useRef<(THREE.Mesh | null)[]>([]);
  const face = useRef<THREE.Group>(null);
  const lcd = useRef<THREE.MeshStandardMaterial>(null);
  const bubble = useRef<THREE.Group>(null);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const btns = useRef<(THREE.Mesh | null)[]>([]);

  // Idle: blink, LCD breathes, ping bubble bobs and its typing dots wave.
  // Hover: the face looks up at you and the LCD brightens. Click: the bubble pops.
  useLoop((m) => {
    const b = Math.max(blink(m.t, 0.42, 0.03), lively ? blink(m.t, 0.9, 0.03) : 0);
    const open = lively ? 1 : 0.32 + m.hover * 0.68; // calm = sleepy eyes that wake on hover
    eyes.current.forEach((e) => e && e.scale.set(1, Math.max(0.12, open - b), 1));
    if (face.current) face.current.position.y = m.hover * 0.05 + wave(m.t, 1, 0.1) * 0.012;
    if (lcd.current) lcd.current.emissiveIntensity = 0.55 + (wave(m.t, 2) * 0.5 + 0.5) * 0.15 + m.hover * 0.45;
    const pop = pressBounce(m.pressAge);
    if (bubble.current) {
      // Calm hides the ping until you hover or click.
      const s = (lively ? 1 : Math.max(0.001, Math.min(1, m.hover + Math.abs(pop) * 2))) *(1 + Math.abs(pop) * 0.5 + m.hover * 0.08);
      bubble.current.scale.setScalar(s);
      bubble.current.position.y = 1.0 + wave(m.t, lively ? 2 : 1, 0.3) * 0.05;
      bubble.current.rotation.z = -0.18 + wave(m.t, 1, 0.6) * 0.06 + pop * 0.4;
    }
    dots.current.forEach((d, i) => {
      if (d) d.position.y = Math.max(0, wave(m.t, 4, -i * 0.12)) * 0.035;
    });
    btns.current.forEach((d, i) => {
      if (!d) return;
      const press = blink(m.t, 0.15 + i * 0.07, 0.02) * (lively ? 1 : 0);
      d.position.z = d.userData.z0 - press * 0.03;
    });
  });

  const surfZ = (x: number, y: number) => {
    const c = Math.min(1, Math.max(-1, -y / 1.2));
    const t = Math.acos(c);
    const r = Math.sin(t) * 0.95 * (1 + 0.1 * Math.cos(t));
    return DEPTH * Math.sqrt(Math.max(0, r * r - x * x));
  };

  const lcdBg = new THREE.Color(p.screen).lerp(new THREE.Color('#ffffff'), 0.55);
  const pixel = new THREE.Color(p.screen).multiplyScalar(0.22);

  return (
    <IconMotion seed={41}>
      <group position={[0, -0.05, 0]} rotation={[0, -0.18, 0]} scale={0.95}>
        {/* shell */}
        <mesh geometry={egg} scale={[1, 1, DEPTH]} castShadow>
          <Shell kind={p.material} c={p.body} />
        </mesh>

        {/* screen bezel + LCD */}
        <group position={[0, 0.22, 0]}>
          {/* slim steel rim pressed into the shell, then a dark glass well */}
          <RoundedBox args={[0.96, 0.8, 0.3]} radius={0.15} smoothness={6} position={[0, 0, 0.43]}>
            <meshStandardMaterial color="#C3C8D1" metalness={0.9} roughness={0.28} />
          </RoundedBox>
          <RoundedBox args={[0.86, 0.7, 0.04]} radius={0.13} smoothness={5} position={[0, 0, 0.575]}>
            <meshPhysicalMaterial color="#1B1F2B" roughness={0.3} clearcoat={1} />
          </RoundedBox>
          <RoundedBox args={[0.76, 0.6, 0.04]} radius={0.11} smoothness={5} position={[0, 0, 0.59]}>
            <meshStandardMaterial ref={lcd} color={lcdBg} emissive={lcdBg} emissiveIntensity={0.6} roughness={0.5} />
          </RoundedBox>
          {/* pixel face */}
          <group ref={face} position={[0, 0, 0.613]}>
            {[-0.15, 0.15].map((x, i) => (
              <mesh key={i} ref={(el) => void (eyes.current[i] = el)} position={[x, 0.06, 0]}>
                <boxGeometry args={[0.1, 0.18, 0.015]} />
                <meshStandardMaterial color={pixel} roughness={0.6} />
              </mesh>
            ))}
            {/* smile: three pixel steps */}
            {[
              [-0.11, -0.1],
              [0, -0.14],
              [0.11, -0.1],
            ].map(([x, y], i) => (
              <mesh key={i} position={[x, y, 0]}>
                <boxGeometry args={[i === 1 ? 0.13 : 0.08, 0.05, 0.015]} />
                <meshStandardMaterial color={pixel} roughness={0.6} />
              </mesh>
            ))}
            {/* cheeks */}
            {[-0.27, 0.27].map((x, i) => (
              <mesh key={i} position={[x, -0.06, 0]}>
                <boxGeometry args={[0.06, 0.035, 0.012]} />
                <meshStandardMaterial color={p.bubble} emissive={p.bubble} emissiveIntensity={0.4} />
              </mesh>
            ))}
          </group>
        </group>

        {/* three gel buttons */}
        {[-0.3, 0, 0.3].map((x, i) => {
          const y = -0.58 + Math.abs(x) * 0.18;
          const z0 = surfZ(x, y) - 0.02;
          return (
            <mesh key={i} ref={(el) => void (btns.current[i] = el)} position={[x, y, z0]} scale={[1, 1, 0.55]} userData={{ z0 }}>
              <sphereGeometry args={[i === 1 ? 0.12 : 0.1, 32, 32]} />
              <meshPhysicalMaterial color={p.buttons} roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} emissive={p.buttons} emissiveIntensity={0.08} />
            </mesh>
          );
        })}

        {/* keyring loop on top */}
        <mesh position={[0, 1.27, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.13, 0.035, 16, 48]} />
          <meshStandardMaterial color="#C9CDD6" metalness={1} roughness={0.22} />
        </mesh>

        {/* ping bubble: the kit's motif */}
        <group ref={bubble} position={[0.92, 1.0, 0.25]}>
          <RoundedBox args={[0.62, 0.36, 0.2]} radius={0.1} smoothness={6}>
            <meshPhysicalMaterial color={p.bubble} roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} emissive={p.bubble} emissiveIntensity={0.12} />
          </RoundedBox>
          <mesh position={[-0.2, -0.2, 0]} rotation={[0, 0, 0.6]}>
            <coneGeometry args={[0.07, 0.16, 24]} />
            <meshPhysicalMaterial color={p.bubble} roughness={0.18} clearcoat={1} />
          </mesh>
          {[-0.14, 0, 0.14].map((x, i) => (
            <mesh key={i} ref={(el) => void (dots.current[i] = el)} position={[x, 0, 0.1]}>
              <sphereGeometry args={[0.045, 20, 20]} />
              <meshPhysicalMaterial color="#F7F8FB" roughness={0.2} clearcoat={1} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
