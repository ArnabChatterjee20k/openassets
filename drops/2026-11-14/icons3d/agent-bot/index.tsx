import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, flicker, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Agent Bot',
  description:
    'The Plotwell agent as a mascot: a rounded drafting robot head with a cyanotype visor, glowing eyes and a compass-needle antenna. It blinks and glances while idle, perks up on hover and gives a happy squint and antenna flash when clicked. For onboarding, chat and empty states.',
  tags: ['3d', 'mascot', 'robot', 'agent', 'ai', 'assistant'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  bodyColor: color('Head').default('#EAF2FF'),
  visorColor: color('Visor').default('#0F3B8C'),
  eyeColor: color('Eyes (glow)').default('#7FB2FF'),
  tipColor: color('Antenna tip').default('#FFDD00'),
  ears: toggle('Dial ears').default(true),
  mood: select(['calm', 'busy'], 'Mood').default('busy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', bodyColor: '#F1EEE4', visorColor: '#173F9A', eyeColor: '#FFDD00' },
  chrome: { material: 'metal', bodyColor: '#F2F5FA', visorColor: '#1B2A4A', eyeColor: '#7FB2FF', tipColor: '#FFDD00' },
  glass: { material: 'glass', bodyColor: '#BFD8FF', visorColor: '#0F3B8C', eyeColor: '#FFFFFF', mood: 'calm' },
  bauhaus: { material: 'clay', bodyColor: '#F2EBDD', visorColor: '#1D4E9E', eyeColor: '#F2C230', tipColor: '#D9381E' },
  'ink & gold': { bodyColor: '#24242A', visorColor: '#0E0E12', eyeColor: '#E8D9B5', tipColor: '#C9A45C', mood: 'calm' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.8} ior={1.4} iridescence={0.3} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} />;
  }
}

export default function AgentBot(p: P) {
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const eyeMat = useRef<THREE.MeshStandardMaterial>(null);
  const tip = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const antenna = useRef<THREE.Group>(null);
  const dialL = useRef<THREE.Group>(null);
  const dialR = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);

  const busy = p.mood === 'busy';

  useLoop((m) => {
    const energy = (busy ? 1 : 0.5) + m.hover * 0.5;
    const age = m.pressAge;
    const flash = Number.isFinite(age) ? Math.exp(-age * 3) : 0;
    const b = pressBounce(age);

    // Head glances left and right once per loop; rests facing forward at t = 0.
    if (head.current) {
      head.current.rotation.y = wave(m.t, 1, 0.5) * 0.18 * energy;
      head.current.rotation.z = wave(m.t, 2, 0.25) * 0.04 * energy;
    }
    // Eyes lead the glance; two blinks per loop (one double).
    if (eyes.current) eyes.current.position.x = wave(m.t, 1, 0.05) * 0.07 * energy;
    const bl = Math.max(blink(m.t, 0.3, 0.03), blink(m.t, 0.78, 0.025), blink(m.t, 0.86, 0.025));
    // Click: happy squint (eyes flatten for ~0.8 s). Hover: eyes grow a touch.
    const squint = flash > 0.08 ? Math.min(1, flash * 1.6) : 0;
    const ey = Math.max(0.12, (1 - bl * 0.9) * (1 - squint * 0.75)) * (1 + m.hover * 0.12);
    const ex = 1 + m.hover * 0.12 + squint * 0.15;
    eyeL.current?.scale.set(ex, ey, 1);
    eyeR.current?.scale.set(ex, ey, 1);
    if (eyeMat.current) eyeMat.current.emissiveIntensity = 1.6 + 0.4 * wave(m.t, 2) + m.hover * 0.9 + flash * 2;
    // Antenna: needle wobble, tip pulses and double-flickers like a status light.
    if (antenna.current) antenna.current.rotation.z = wave(m.t, 2) * 0.08 * energy + b * 0.5;
    if (tip.current) tip.current.emissiveIntensity = 1 + 0.6 * (0.5 + 0.5 * wave(m.t, 4)) * energy + flicker(m.t, 0.55) * 2 + m.hover + flash * 4;
    if (halo.current) halo.current.scale.setScalar(1 + 0.3 * (0.5 + 0.5 * wave(m.t, 4)) * energy + flash * 1.4 + m.hover * 0.4);
    // Dial ears tick round (one full turn per loop when busy).
    const turn = cycle(m.t, busy ? 1 : 0) * Math.PI * 2;
    if (dialL.current) dialL.current.rotation.x = turn + m.hover * 0.6;
    if (dialR.current) dialR.current.rotation.x = -turn - m.hover * 0.6;
    // A thin scan line sweeps down the visor twice per loop.
    if (scan.current) {
      const k = cycle(m.t, 2);
      scan.current.position.y = 0.3 - k * 0.6;
      (scan.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * (0.25 + m.hover * 0.2) * energy;
    }
  });

  return (
    <IconMotion seed={64} float={0.06} sway={0.06}>
      <group rotation={[0.08, -0.2, 0]} position={[0, -0.18, 0]} scale={1.05}>
        <group ref={head}>
          {/* head shell */}
          <RoundedBox args={[2.0, 1.6, 1.5]} radius={0.42} smoothness={6}>
            <Surface kind={p.material} c={p.bodyColor} />
          </RoundedBox>
          {/* visor: a dark rounded plate set into the face */}
          <RoundedBox args={[1.58, 0.94, 0.3]} radius={0.14} smoothness={5} position={[0, 0.04, 0.66]}>
            <meshPhysicalMaterial color={p.visorColor} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
          </RoundedBox>
          {/* faint grid hairlines on the visor, cyanotype style */}
          {[-0.5, -0.25, 0, 0.25, 0.5].map((x) => (
            <mesh key={`v${x}`} position={[x, 0.04, 0.812]}>
              <planeGeometry args={[0.006, 0.78]} />
              <meshBasicMaterial color={p.eyeColor} transparent opacity={0.16} />
            </mesh>
          ))}
          {[-0.2, 0.04, 0.28].map((y) => (
            <mesh key={`h${y}`} position={[0, y, 0.812]}>
              <planeGeometry args={[1.38, 0.006]} />
              <meshBasicMaterial color={p.eyeColor} transparent opacity={0.16} />
            </mesh>
          ))}
          <mesh ref={scan} position={[0, 0.04, 0.815]}>
            <planeGeometry args={[1.38, 0.03]} />
            <meshBasicMaterial color={p.eyeColor} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* eyes: rounded pills that blink */}
          <group ref={eyes} position={[0, 0.06, 0.82]}>
            {[-0.36, 0.36].map((x, i) => (
              <mesh key={x} ref={i ? eyeR : eyeL} position={[x, 0, 0]}>
                <capsuleGeometry args={[0.11, 0.16, 8, 24]} />
                <meshStandardMaterial ref={i ? undefined : eyeMat} color={p.eyeColor} emissive={p.eyeColor} emissiveIntensity={1.8} roughness={0.2} toneMapped={false} />
              </mesh>
            ))}
          </group>
          {/* little mouth tick */}
          <mesh position={[0, -0.3, 0.815]}>
            <planeGeometry args={[0.18, 0.03]} />
            <meshBasicMaterial color={p.eyeColor} transparent opacity={0.7} />
          </mesh>

          {/* dial ears */}
          {p.ears &&
            [-1, 1].map((s) => (
              <group key={s} position={[s * 1.02, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.3, 0.3, 0.14, 48]} />
                  <meshPhysicalMaterial color={p.visorColor} roughness={0.25} clearcoat={1} />
                </mesh>
                <group ref={s < 0 ? dialL : dialR} position={[s * 0.09, 0, 0]}>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.08, 40]} />
                    <Surface kind={p.material} c={p.bodyColor} />
                  </mesh>
                  {/* pointer notch so the turn is visible */}
                  <mesh position={[s * 0.045, 0.12, 0]}>
                    <boxGeometry args={[0.02, 0.1, 0.04]} />
                    <meshStandardMaterial color={p.tipColor} emissive={p.tipColor} emissiveIntensity={0.8} />
                  </mesh>
                </group>
              </group>
            ))}

          {/* antenna: a compass needle on a hinge knuckle */}
          <group ref={antenna} position={[0.18, 0.8, 0]}>
            <mesh position={[0, 0.04, 0]}>
              <sphereGeometry args={[0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial color={p.visorColor} roughness={0.25} clearcoat={1} />
            </mesh>
            <mesh position={[0, 0.34, 0]}>
              <cylinderGeometry args={[0.025, 0.04, 0.52, 16]} />
              <meshStandardMaterial color="#C9CED8" metalness={1} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.66, 0]}>
              <sphereGeometry args={[0.1, 32, 16]} />
              <meshStandardMaterial ref={tip} color={p.tipColor} emissive={p.tipColor} emissiveIntensity={1.4} roughness={0.3} toneMapped={false} />
            </mesh>
            <mesh ref={halo} position={[0, 0.66, 0]}>
              <sphereGeometry args={[0.16, 24, 16]} />
              <meshBasicMaterial color={p.tipColor} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
