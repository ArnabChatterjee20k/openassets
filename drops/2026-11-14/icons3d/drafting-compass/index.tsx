import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, num, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Drafting Compass',
  description:
    'Plotwell hero: a glossy drafting compass standing on its needle with a glowing lead and a freshly scribed arc. It scribes back and forth while idle, opens wider on hover and spins a full arc when clicked.',
  tags: ['3d', 'hero', 'compass', 'drafting', 'blueprint', 'ai agent'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  bodyColor: color('Body').default('#EAF2FF'),
  jointColor: color('Hinge & clamp').default('#134AA8'),
  leadColor: color('Lead (glows)').default('#FFDD00'),
  spread: num(0.25, 0.5, 0.01, 'Leg spread').default(0.36),
  arc: toggle('Scribed arc').default(true),
  mood: select(['calm', 'drafting'], 'Mood').default('drafting'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', bodyColor: '#F1EEE4', jointColor: '#173F9A' },
  chrome: { material: 'metal', bodyColor: '#D5DAE3', jointColor: '#C9A45C', leadColor: '#FFDD00' },
  glass: { material: 'glass', bodyColor: '#BFD8FF', jointColor: '#EAF2FF', leadColor: '#FFDD00' },
  bauhaus: { material: 'clay', bodyColor: '#F2EBDD', jointColor: '#D9381E', leadColor: '#1D4E9E', spread: 0.42 },
  'ink & gold': { bodyColor: '#24242A', jointColor: '#C9A45C', leadColor: '#E8D9B5', mood: 'calm' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.6} ior={1.4} iridescence={0.3} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} />;
  }
}

const HINGE_Y = 0.86;
const LEG = 2.12;
const TAU = Math.PI * 2;

export default function DraftingCompass(p: P) {
  const pivot = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const lead = useRef<THREE.MeshStandardMaterial>(null);
  const arcMat = useRef<THREE.MeshStandardMaterial>(null);
  const dot = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  // Needle tip (left leg) is the pivot the compass scribes around.
  const tipX = -Math.sin(p.spread) * LEG;
  const tipY = HINGE_Y - Math.cos(p.spread) * LEG;
  const radius = 2 * Math.sin(p.spread) * LEG;

  // Thin tapered leg body, built once.
  const legGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.075, 0.05, LEG - 0.34, 32);
    g.translate(0, -(LEG - 0.34) / 2 - 0.08, 0);
    return g;
  }, []);

  const drafting = p.mood === 'drafting';

  useLoop((m) => {
    const energy = (drafting ? 1 : 0.45) + m.hover * 0.5;
    // Click: one full scribing turn, eased out, ending where it started.
    const age = m.pressAge;
    const k = Number.isFinite(age) ? Math.min(1, age / 1.1) : 1;
    const spin = (1 - Math.pow(1 - k, 3)) * TAU;
    if (pivot.current) pivot.current.rotation.y = wave(m.t, 1) * 0.55 * energy + (k < 1 ? spin : 0);
    // Legs breathe; hover opens them a touch wider.
    const open = wave(m.t, 2, 0.5) * 0.015 * energy + m.hover * 0.06 + pressBounce(age) * 0.05;
    if (legL.current) legL.current.rotation.z = -(p.spread + open);
    if (legR.current) legR.current.rotation.z = p.spread + open;
    const flash = Number.isFinite(age) ? Math.exp(-age * 3) * 3 : 0;
    const pulse = 0.5 + 0.5 * wave(m.t, 2);
    if (lead.current) lead.current.emissiveIntensity = 0.9 + pulse * 0.8 * energy + blink(m.t, 0.25, 0.04) * 1.2 + m.hover * 0.8 + flash;
    if (arcMat.current) arcMat.current.emissiveIntensity = 0.7 + pulse * 0.5 + flash * 0.6;
    if (dot.current) dot.current.scale.setScalar(1 + pulse * 0.25 * energy);
    if (halo.current) halo.current.scale.setScalar(0.85 + pulse * 0.35 * energy + m.hover * 0.3 + flash * 0.3);
  });

  return (
    <IconMotion seed={41} float={0.05} sway={0.06}>
      <group position={[-tipX * 0.3, -0.02, 0]} rotation={[0.12, -0.35, 0]} scale={0.9}>
        {/* Scribed arc on the paper, centred on the needle */}
        {p.arc && (
          <group position={[tipX, tipY + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {/* a trail that ends exactly at the lead's rest position */}
            <mesh rotation={[0, 0, -2.1]}>
              <torusGeometry args={[radius, 0.018, 12, 96, 2.1]} />
              <meshStandardMaterial ref={arcMat} color={p.leadColor} emissive={p.leadColor} emissiveIntensity={0.9} roughness={0.4} />
            </mesh>
            {/* construction ring + centre mark */}
            <mesh>
              <torusGeometry args={[radius, 0.005, 6, 128]} />
              <meshStandardMaterial color={p.bodyColor} transparent opacity={0.16} />
            </mesh>
            <mesh ref={dot}>
              <ringGeometry args={[0.05, 0.08, 32]} />
              <meshStandardMaterial color={p.leadColor} emissive={p.leadColor} emissiveIntensity={1} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}

        {/* Everything above rotates around the needle tip */}
        <group position={[tipX, 0, 0]}>
          <group ref={pivot}>
            <group position={[-tipX, 0, 0]}>
              {/* Handle: knurled grip + cap */}
              <mesh position={[0, HINGE_Y + 0.42, 0]}>
                <cylinderGeometry args={[0.07, 0.085, 0.42, 32]} />
                <Surface kind={p.material} c={p.bodyColor} />
              </mesh>
              {[0.3, 0.38, 0.46, 0.54].map((y) => (
                <mesh key={y} position={[0, HINGE_Y + y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.083, 0.012, 8, 32]} />
                  <meshStandardMaterial color={p.jointColor} roughness={0.35} metalness={0.2} />
                </mesh>
              ))}
              <mesh position={[0, HINGE_Y + 0.66, 0]}>
                <sphereGeometry args={[0.085, 32, 16]} />
                <Surface kind={p.material} c={p.bodyColor} />
              </mesh>

              {/* Hinge knuckle */}
              <mesh position={[0, HINGE_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.24, 0.24, 0.2, 48]} />
                <Surface kind={p.material} c={p.bodyColor} />
              </mesh>
              <mesh position={[0, HINGE_Y, 0.1]}>
                <torusGeometry args={[0.17, 0.035, 16, 48]} />
                <meshPhysicalMaterial color={p.jointColor} roughness={0.25} clearcoat={1} />
              </mesh>
              <mesh position={[0, HINGE_Y, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.04, 6]} />
                <meshStandardMaterial color="#C9CED8" metalness={1} roughness={0.25} />
              </mesh>

              {/* Needle leg */}
              <group ref={legL} position={[0, HINGE_Y, 0]} rotation={[0, 0, -p.spread]}>
                <mesh geometry={legGeo}>
                  <Surface kind={p.material} c={p.bodyColor} />
                </mesh>
                <mesh position={[0, -LEG + 0.2, 0]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.1, 24]} />
                  <meshPhysicalMaterial color={p.jointColor} roughness={0.25} clearcoat={1} />
                </mesh>
                <mesh position={[0, -LEG + 0.07, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.03, 0.16, 16]} />
                  <meshStandardMaterial color="#C9CED8" metalness={1} roughness={0.2} />
                </mesh>
              </group>

              {/* Lead leg with clamp and glowing lead */}
              <group ref={legR} position={[0, HINGE_Y, 0]} rotation={[0, 0, p.spread]}>
                <mesh geometry={legGeo}>
                  <Surface kind={p.material} c={p.bodyColor} />
                </mesh>
                <RoundedBox args={[0.2, 0.22, 0.16]} radius={0.04} smoothness={4} position={[0.02, -LEG + 0.32, 0]}>
                  <meshPhysicalMaterial color={p.jointColor} roughness={0.25} clearcoat={1} />
                </RoundedBox>
                <mesh position={[0.13, -LEG + 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.035, 0.035, 0.08, 16]} />
                  <meshStandardMaterial color="#C9CED8" metalness={1} roughness={0.25} />
                </mesh>
                <mesh position={[0, -LEG + 0.11, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.06, 0.22, 24]} />
                  <meshStandardMaterial ref={lead} color={p.leadColor} emissive={p.leadColor} emissiveIntensity={1.2} roughness={0.35} toneMapped={false} />
                </mesh>
                {/* soft halo around the lead */}
                <mesh ref={halo} position={[0, -LEG + 0.04, 0]}>
                  <sphereGeometry args={[0.09, 24, 16]} />
                  <meshBasicMaterial color={p.leadColor} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
