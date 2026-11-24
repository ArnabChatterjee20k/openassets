import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Live Flask',
  description:
    'Benchwire landing-page hero: an Erlenmeyer flask of glowing reagent on a robot stage, with a ring of data cubes orbiting it. Bubbles rise while it idles, it boils brighter on hover and fizzes over when clicked.',
  tags: ['hero', 'lab', 'flask', 'experiment', '3d'],
};

export const schema = z.object({
  material: select(['glass', 'clay', 'glossy', 'metal']).default('glass'),
  flaskColor: color('Flask').default('#CFEDE8'),
  liquidColor: color('Reagent').default('#D4FF3A'),
  stageColor: color('Robot stage').default('#16302F'),
  ledColor: color('Stage LED').default('#3FA7A0'),
  orbit: toggle('Data orbit').default(true),
  mood: select(['running', 'calm'], 'Mood').default('running'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', flaskColor: '#EAF4EF', stageColor: '#3FA7A0', ledColor: '#D4FF3A' },
  glossy: { material: 'glossy', flaskColor: '#F4F6F5', liquidColor: '#FF5A36', stageColor: '#0D1B1E', ledColor: '#FF5A36' },
  metal: { material: 'metal', flaskColor: '#D5DAE0', liquidColor: '#2EF2C4', stageColor: '#1B2A2E', ledColor: '#2EF2C4' },
  'deep-sea': { liquidColor: '#2EF2C4', flaskColor: '#BFE8F2', stageColor: '#06303F', ledColor: '#1B7FA6' },
  calm: { mood: 'calm', orbit: false },
};

type P = z.infer<typeof schema>;

function Shell({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.05} transmission={1} thickness={0.15} ior={1.3} clearcoat={1} side={THREE.FrontSide} transparent opacity={0.55} />;
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.4} metalness={1} side={THREE.DoubleSide} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" side={THREE.DoubleSide} />;
  }
}

// Flask silhouette (radius, height). Cone from the shoulder at y=-0.66 to the neck at y=0.2.
const BASE_Y = -0.86;
const LIQ_Y = -0.22;
const coneR = (y: number) => 0.7 - ((y + 0.66) / 0.86) * 0.48;

const v = (x: number, y: number) => new THREE.Vector2(x, y);

const BUBBLES = [
  { x: -0.2, z: 0.18, s: 0.06, ph: 0 },
  { x: 0.18, z: 0.22, s: 0.075, ph: 0.35 },
  { x: 0.02, z: 0.3, s: 0.05, ph: 0.6 },
  { x: -0.32, z: -0.05, s: 0.055, ph: 0.8 },
  { x: 0.3, z: -0.1, s: 0.045, ph: 0.15 },
];

export default function LiveFlask(p: P) {
  const glass = p.material === 'glass';
  const running = p.mood === 'running';

  const flaskGeo = useMemo(() => {
    const prof = glass
      ? [v(0.001, BASE_Y), v(0.62, BASE_Y), v(0.69, BASE_Y + 0.05), v(0.7, -0.66), v(coneR(0.2), 0.2), v(0.22, 0.66), v(0.28, 0.68), v(0.28, 0.76), v(0.21, 0.76)]
      : [v(coneR(LIQ_Y) + 0.004, LIQ_Y), v(coneR(0.2), 0.2), v(0.22, 0.66), v(0.28, 0.68), v(0.28, 0.76), v(0.21, 0.76)];
    return new THREE.LatheGeometry(prof, 64);
  }, [glass]);

  const liquidGeo = useMemo(() => {
    // Inside the glass when transparent; flush with the outer wall when the flask is opaque (two-tone flask).
    const inset = glass ? 0.05 : 0;
    const prof = [v(0.001, BASE_Y + inset), v(0.62 - inset, BASE_Y + inset), v(0.69 - inset, BASE_Y + 0.05 + inset * 0.5), v(0.7 - inset, -0.66), v(coneR(LIQ_Y) - inset, LIQ_Y), v(0.001, LIQ_Y)];
    return new THREE.LatheGeometry(prof, 64);
  }, [glass]);

  const liquidMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const bubbleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const escapeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const statusRef = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: bubbles rise, the reagent glows, cubes orbit, the stage LED breathes and the status light blinks.
  // Hover boils it brighter; a click fizzes it over with a flash on the LED ring.
  useLoop((m) => {
    const kick = Math.abs(pressBounce(m.pressAge));
    const energy = (running ? 1 : 0.45) + m.hover * 0.7;
    if (liquidMat.current) liquidMat.current.emissiveIntensity = 0.12 + energy * 0.16 + wave(m.t, 2) * 0.05 + kick * 1.4;
    if (led.current) led.current.emissiveIntensity = 0.8 + (wave(m.t, 1) * 0.5 + 0.5) * 1.2 * energy + kick * 4;
    if (statusRef.current) statusRef.current.emissiveIntensity = 0.4 + blink(m.t, 0.3, 0.05) * 3 + blink(m.t, 0.8, 0.05) * 3;
    if (orbitRef.current) orbitRef.current.rotation.y = cycle(m.t, 1) * ((Math.PI * 2) / 4) + kick * 0.6;
    bubbleRefs.current.forEach((b, i) => {
      if (!b) return;
      const u = cycle(m.t, running ? 2 : 1, BUBBLES[i].ph);
      const y = BASE_Y + 0.1 + u * (LIQ_Y - BASE_Y - 0.14);
      b.position.y = y;
      const lim = coneR(Math.max(y, -0.66)) - 0.12;
      b.position.x = Math.max(-lim, Math.min(lim, BUBBLES[i].x * (1 - u * 0.5)));
      b.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 + m.hover * 0.3 + kick)));
    });
    escapeRefs.current.forEach((b, i) => {
      if (!b) return;
      const u = cycle(m.t, running ? 2 : 1, 0.25 + i * 0.5);
      b.position.y = 0.8 + u * 0.38;
      b.position.x = (i ? -0.06 : 0.07) + Math.sin(u * 6) * 0.03;
      b.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * u) * (running ? 1 : 0.6) * (1 + kick * 1.5)));
    });
  });

  return (
    <IconMotion seed={41} float={0.05} sway={0.07}>
      <group position={[0, 0.05, 0]} scale={1.08}>
        {/* robot stage puck with an LED ring */}
        <mesh position={[0, BASE_Y - 0.13, 0]}>
          <cylinderGeometry args={[0.98, 1.04, 0.24, 64]} />
          <meshPhysicalMaterial color={p.stageColor} roughness={0.35} clearcoat={0.8} clearcoatRoughness={0.2} />
        </mesh>
        <mesh position={[0, BASE_Y - 0.01, 0]}>
          <cylinderGeometry args={[0.9, 0.98, 0.02, 64]} />
          <meshPhysicalMaterial color={p.stageColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, BASE_Y - 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.015, 0.022, 12, 96]} />
          <meshStandardMaterial ref={led} color={p.ledColor} emissive={p.ledColor} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        {/* status light on the stage front */}
        <mesh position={[0.62, BASE_Y - 0.12, 0.8]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial ref={statusRef} color="#FF5A36" emissive="#FF5A36" emissiveIntensity={0.6} />
        </mesh>

        {/* reagent */}
        <mesh geometry={liquidGeo}>
          <meshPhysicalMaterial ref={liquidMat} color={p.liquidColor} emissive={p.liquidColor} emissiveIntensity={0.7} roughness={glass ? 0.15 : 0.3} clearcoat={1} />
        </mesh>
        {/* glowing meniscus disc */}
        <mesh position={[0, LIQ_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[coneR(LIQ_Y) - (glass ? 0.05 : 0), 48]} />
          <meshStandardMaterial color={p.liquidColor} emissive={p.liquidColor} emissiveIntensity={0.6} />
        </mesh>
        {glass &&
          BUBBLES.map((b, i) => (
            <mesh key={i} ref={(el) => void (bubbleRefs.current[i] = el)} position={[b.x, BASE_Y + 0.1, b.z]}>
              <sphereGeometry args={[b.s, 20, 20]} />
              <meshPhysicalMaterial color="#ffffff" roughness={0.05} transparent opacity={0.75} emissive={p.liquidColor} emissiveIntensity={0.4} />
            </mesh>
          ))}

        {/* flask */}
        <mesh geometry={flaskGeo}>
          <Shell kind={p.material} c={p.flaskColor} />
        </mesh>

        {/* bubbles escaping the neck */}
        {[0, 1].map((i) => (
          <mesh key={i} ref={(el) => void (escapeRefs.current[i] = el)} position={[0, 0.9, 0]}>
            <sphereGeometry args={[i ? 0.05 : 0.07, 20, 20]} />
            <meshPhysicalMaterial color={p.liquidColor} emissive={p.liquidColor} emissiveIntensity={0.6} roughness={0.1} clearcoat={1} />
          </mesh>
        ))}

        {/* orbiting data cubes (the API stream) */}
        {p.orbit && (
          <group position={[0, -0.12, 0]} rotation={[0.16, 0, -0.1]}>
            <group ref={orbitRef}>
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                const hot = i % 2 === 0;
                return (
                  <RoundedBox key={i} args={[0.13, 0.13, 0.13]} radius={0.03} smoothness={3} position={[Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3]} rotation={[0.4, a, 0.3]}>
                    {hot ? (
                      <meshStandardMaterial color={p.liquidColor} emissive={p.liquidColor} emissiveIntensity={0.9} roughness={0.3} />
                    ) : (
                      <meshPhysicalMaterial color={p.ledColor} roughness={0.25} clearcoat={1} />
                    )}
                  </RoundedBox>
                );
              })}
            </group>
          </group>
        )}
      </group>
    </IconMotion>
  );
}
