import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, clamp, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Spend Vault',
  description:
    'Hero object for Mandate: a chunky bank vault with a combination dial and gold light leaking from the door seam. The dial ticks and the lamp blinks; hover cracks the door open, a click spins the dial and pops a gold coin.',
  tags: ['vault', 'finance', 'budget', '3d', 'hero', 'ads'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  body: color('Body').default('#1C1C20'),
  trim: color('Dial & trim').default('#C9A45C'),
  glow: color('Vault light').default('#E8D9B5'),
  lamp: color('Status lamp').default('#C9A45C'),
  mood: select(['calm', 'active'], 'Mood').default('active'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  bone: { material: 'clay', body: '#E9E2D4', trim: '#B08A45', glow: '#FFD27F' },
  bullion: { material: 'metal', body: '#C9A45C', trim: '#3A3A40', glow: '#FFF1C9', lamp: '#E3000F' },
  glass: { material: 'glass', body: '#F3EDE2', trim: '#C9A45C', glow: '#FFE8A3' },
  swiss: { material: 'clay', body: '#F5F5F0', trim: '#0A0A0A', glow: '#E3000F', lamp: '#E3000F', mood: 'calm' },
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

/** Polished trim: always metal-ish so the gold reads as foil. */
const Trim = ({ c }: { c: string }) => <meshStandardMaterial color={c} metalness={0.9} roughness={0.28} envMapIntensity={1.2} />;

const BODY = { w: 1.7, h: 1.7, d: 1.2 };
const DOOR = { w: 1.3, h: 1.3, d: 0.14 };

export default function SpendVault(p: P) {
  const door = useRef<THREE.Group>(null);
  const dial = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const seam = useRef<THREE.MeshStandardMaterial>(null);
  const coin = useRef<THREE.Group>(null);
  const active = p.mood === 'active';

  // Idle: the dial ticks round in steps, the lamp blinks, light breathes in the
  // seam. Hover cracks the door; a click spins the dial and pops a coin.
  useLoop((m) => {
    const energy = (active ? 1 : 0.4) + m.hover * 0.6;
    const press = Number.isFinite(m.pressAge) ? m.pressAge : Infinity;
    if (dial.current) {
      // Stepped ticks: 8 clicks per loop, eased within each step.
      const u = cycle(m.t, 1) * 8;
      const step = Math.floor(u) + Math.min(1, (u % 1) * 4);
      const spin = press < 1.2 ? (1 - Math.exp(-press * 4)) * Math.PI * 4 : 0;
      dial.current.rotation.z = -(step / 8) * Math.PI * 2 * (active ? 1 : 0.25) - spin;
    }
    if (door.current) {
      // Active vaults "peek": the door eases open a crack and shuts once per loop.
      const peek = active ? Math.pow(wave(m.t, 1, 0.75) * 0.5 + 0.5, 2) * 0.22 : 0;
      const open = Math.max(peek, m.hover * 0.5) + Math.max(0, -pressBounce(press)) * 0.25;
      door.current.rotation.y = -open;
    }
    if (seam.current) seam.current.emissiveIntensity = (0.35 + (wave(m.t, 2) * 0.5 + 0.5) * 0.45) * energy + m.hover * 1.2;
    if (lamp.current) lamp.current.emissiveIntensity = 0.4 + Math.max(blink(m.t, 0.3, 0.04), blink(m.t, 0.8, 0.04) * (active ? 1 : 0)) * 3;
    if (coin.current) {
      const a = press;
      const show = a < 1.1;
      const k = clamp(a / 1.1);
      coin.current.visible = show;
      coin.current.position.set(0.25 + k * 0.5, 1.0 + Math.sin(Math.PI * k) * 0.9, 0.2);
      coin.current.rotation.set(Math.PI / 2, 0, k * Math.PI * 6);
      coin.current.scale.setScalar(show ? Math.sin(Math.PI * Math.min(1, k * 1.15)) * 1 + 0.001 : 0.001);
    }
  });

  const front = BODY.d / 2;
  return (
    <IconMotion seed={41} float={0.05} sway={0.07}>
      <group rotation={[0.08, -0.5, 0]} position={[0, -0.05, 0]} scale={1.02}>
        {/* body */}
        <RoundedBox args={[BODY.w, BODY.h, BODY.d]} radius={0.16} smoothness={6} castShadow>
          <Surface kind={p.material} c={p.body} />
        </RoundedBox>
        {/* plinth feet */}
        {[-0.6, 0.6].map((x) =>
          [-0.38, 0.38].map((z) => (
            <RoundedBox key={`${x}${z}`} args={[0.24, 0.14, 0.24]} radius={0.05} smoothness={3} position={[x, -BODY.h / 2 - 0.05, z]}>
              <Trim c={p.trim} />
            </RoundedBox>
          )),
        )}
        {/* door recess: glowing seam behind the door */}
        <RoundedBox args={[DOOR.w + 0.02, DOOR.h + 0.02, 0.04]} radius={0.06} smoothness={3} position={[0, 0, front - 0.005]}>
          <meshStandardMaterial ref={seam} color={p.trim} emissive={p.glow} emissiveIntensity={0.5} roughness={0.4} />
        </RoundedBox>
        {/* door, hinged on the left edge */}
        <group position={[-DOOR.w / 2, 0, front + 0.02]}>
          <group ref={door}>
            <group position={[DOOR.w / 2, 0, DOOR.d / 2]}>
              <RoundedBox args={[DOOR.w, DOOR.h, DOOR.d]} radius={0.08} smoothness={5} castShadow>
                <Surface kind={p.material} c={p.body} />
              </RoundedBox>
              {/* gold bezel around the dial */}
              <mesh position={[-0.14, 0.08, DOOR.d / 2 + 0.005]}>
                <torusGeometry args={[0.37, 0.03, 16, 96]} />
                <Trim c={p.trim} />
              </mesh>
              {/* dial: knurled disc + index notch + tick ring */}
              <group ref={dial} position={[-0.14, 0.08, DOOR.d / 2 + 0.04]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.3, 0.32, 0.1, 48]} />
                  <Trim c={p.trim} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]}>
                  <cylinderGeometry args={[0.12, 0.14, 0.06, 32]} />
                  <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.body} />
                </mesh>
                {Array.from({ length: 24 }, (_, i) => {
                  const a = (i / 24) * Math.PI * 2;
                  const long = i % 6 === 0;
                  return (
                    <mesh key={i} position={[Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0.055]} rotation={[0, 0, a]}>
                      <boxGeometry args={[long ? 0.07 : 0.04, 0.012, 0.01]} />
                      <meshStandardMaterial color={p.body} roughness={0.5} />
                    </mesh>
                  );
                })}
                <mesh position={[0, 0.2, 0.065]}>
                  <sphereGeometry args={[0.025, 16, 16]} />
                  <meshStandardMaterial color={p.glow} emissive={p.glow} emissiveIntensity={2} toneMapped={false} />
                </mesh>
              </group>
              {/* handle: a three-spoke wheel to the right of the dial */}
              {/* handle: a chunky lever bar on the latch side */}
              <group position={[0.44, -0.36, DOOR.d / 2 + 0.06]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.07, 0.08, 0.08, 32]} />
                  <Trim c={p.trim} />
                </mesh>
                <mesh position={[0, 0.17, 0.04]}>
                  <capsuleGeometry args={[0.04, 0.3, 8, 16]} />
                  <Trim c={p.trim} />
                </mesh>
              </group>
              {/* hinges */}
              {[0.38, -0.38].map((y) => (
                <mesh key={y} position={[-DOOR.w / 2 + 0.02, y, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.22, 24]} />
                  <Trim c={p.trim} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
        {/* status lamp on the top-right corner of the face */}
        <mesh position={[0.66, 0.68, front + 0.03]}>
          <sphereGeometry args={[0.055, 24, 24]} />
          <meshStandardMaterial ref={lamp} color={p.lamp} emissive={p.lamp} emissiveIntensity={0.6} roughness={0.2} toneMapped={false} />
        </mesh>
        {/* coin popped by a click */}
        <group ref={coin} visible={false}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 48]} />
            <meshStandardMaterial color={p.trim} metalness={1} roughness={0.22} emissive={p.trim} emissiveIntensity={0.15} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
