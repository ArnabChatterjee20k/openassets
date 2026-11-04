import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Robot Cell Arm',
  description:
    'Landing-page hero for Redbrick Works: a chunky six-axis robot arm on a plinth, holding a freshly machined hex part. It pans and lifts on a loop, the status ring breathes; hover lifts it higher, a click snaps the gripper and spins the part.',
  tags: ['robot', 'factory', 'automation', '3d', 'cnc', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  armColor: color('Arm').default('#C8553D'),
  jointColor: color('Joints').default('#3B1F14'),
  baseColor: color('Plinth').default('#4F6D58'),
  partColor: color('Machined part').default('#D9D6CF'),
  ledColor: color('Status light').default('#F2A541'),
  mood: select(['calm', 'busy'], 'Mood').default('busy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', armColor: '#D96C3D', baseColor: '#2C7873', ledColor: '#E9B44C' },
  metal: { material: 'metal', armColor: '#D8D2C8', jointColor: '#2E2A24', baseColor: '#C8553D', partColor: '#F2A541' },
  glass: { material: 'glass', armColor: '#F2C9B8', baseColor: '#E5CDB2', ledColor: '#C8553D' },
  'night-shift': { material: 'glossy', armColor: '#EAF2FF', jointColor: '#0F3B8C', baseColor: '#134AA8', partColor: '#FFDD00', ledColor: '#7FB2FF' },
  calm: { mood: 'calm', armColor: '#4F6D58', baseColor: '#C8553D' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.32} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={1} thickness={1} ior={1.4} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

/** Satin enamel for joints and plinth: always solid so the silhouette holds in every material. */
const Enamel = ({ c, rough = 0.45 }: { c: string; rough?: number }) => <meshPhysicalMaterial color={c} roughness={rough} clearcoat={0.4} clearcoatRoughness={0.4} />;

/** A horizontal joint drum (axis along z). */
function Joint({ r, len, c }: { r: number; len: number; c: string }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[r, r, len, 40]} />
        <Enamel c={c} />
      </mesh>
      {/* bright cap rings on both faces */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, (s * len) / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 0.62, r * 0.09, 12, 40]} />
          <meshStandardMaterial color="#C9C3B8" metalness={1} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export default function RobotCellArm(p: P) {
  // A machined hex part with a bored hole: extruded and bevelled.
  const hex = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * 0.26;
      const y = Math.sin(a) * 0.26;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.11, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.03, bevelSegments: 4, curveSegments: 24 });
    g.center();
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  const turret = useRef<THREE.Group>(null);
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const part = useRef<THREE.Mesh>(null);
  const fingerL = useRef<THREE.Mesh>(null);
  const fingerR = useRef<THREE.Mesh>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const tip = useRef<THREE.MeshStandardMaterial>(null);
  const busy = p.mood === 'busy';

  // Rest pose (t = 0): shoulder leaning forward, forearm reaching right, part
  // hanging level. Every motion is a whole-number wave so it returns here.
  const S0 = -0.28;
  const E0 = -1.55;
  useLoop((m) => {
    const k = busy ? 1 : 0.45;
    const lift = m.hover * 0.22;
    const press = pressBounce(m.pressAge);
    const s = S0 + wave(m.t, 1) * 0.12 * k + lift;
    const e = E0 + wave(m.t, 2) * 0.14 * k + lift * 0.5;
    if (turret.current) turret.current.rotation.y = wave(m.t, 1) * 0.42 * k + m.px * 0.2 * m.hover;
    if (shoulder.current) shoulder.current.rotation.z = s;
    if (elbow.current) elbow.current.rotation.z = e;
    // keep the gripper pointing straight down whatever the arm does
    if (wrist.current) wrist.current.rotation.z = -(s + e);
    if (part.current) part.current.rotation.y = cycle(m.t, busy ? 1 : 0) * Math.PI * 2 + press * 3;
    const grip = 0.13 - Math.abs(press) * 0.05;
    if (fingerL.current) fingerL.current.position.x = -grip;
    if (fingerR.current) fingerR.current.position.x = grip;
    const pulse = wave(m.t, 2) * 0.5 + 0.5;
    if (led.current) led.current.emissiveIntensity = 0.7 + pulse * 0.9 * k + m.hover * 0.9 + blink(m.t, 0.85, 0.04) * 1.5 + Math.abs(press) * 2;
    if (tip.current) tip.current.emissiveIntensity = 0.5 + blink(m.t, 0.35, 0.05) * 2.5 + m.hover;
  });

  return (
    <IconMotion seed={29} float={0.04} sway={0.06}>
      <group position={[-0.42, 0.05, 0]} rotation={[0, -0.35, 0]} scale={0.95}>
        {/* Plinth with status ring */}
        <mesh position={[0, -1.08, 0]}>
          <cylinderGeometry args={[0.78, 0.86, 0.22, 64]} />
          <Enamel c={p.baseColor} rough={0.55} />
        </mesh>
        <mesh position={[0, -0.96, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.035, 16, 80]} />
          <meshStandardMaterial ref={led} color={p.ledColor} emissive={p.ledColor} emissiveIntensity={1} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.93, 0]}>
          <cylinderGeometry args={[0.62, 0.66, 0.08, 64]} />
          <Enamel c={p.jointColor} />
        </mesh>

        <group ref={turret}>
          {/* Turret */}
          <mesh position={[0, -0.72, 0]}>
            <cylinderGeometry args={[0.44, 0.52, 0.36, 48]} />
            <Surface kind={p.material} c={p.armColor} />
          </mesh>
          <group position={[0, -0.42, 0]}>
            <Joint r={0.26} len={0.62} c={p.jointColor} />
            <group ref={shoulder} rotation={[0, 0, S0]}>
              {/* Upper arm */}
              <RoundedBox args={[0.36, 1.05, 0.4]} radius={0.14} smoothness={5} position={[0, 0.55, 0]}>
                <Surface kind={p.material} c={p.armColor} />
              </RoundedBox>
              {/* Cable loom down the back */}
              <mesh position={[-0.2, 0.55, 0]}>
                <capsuleGeometry args={[0.045, 0.8, 8, 16]} />
                <Enamel c={p.jointColor} rough={0.7} />
              </mesh>
              <group position={[0, 1.1, 0]}>
                <Joint r={0.21} len={0.5} c={p.jointColor} />
                <group ref={elbow} rotation={[0, 0, E0]}>
                  {/* Forearm (built along +y, rotated by the elbow) */}
                  <RoundedBox args={[0.28, 0.95, 0.32]} radius={0.12} smoothness={5} position={[0, 0.5, 0]}>
                    <Surface kind={p.material} c={p.armColor} />
                  </RoundedBox>
                  <group position={[0, 1.0, 0]}>
                    <Joint r={0.15} len={0.36} c={p.jointColor} />
                    <group ref={wrist} rotation={[0, 0, -(S0 + E0)]}>
                      {/* Flange + gripper, hanging along -y (world down) */}
                      <group>
                        <mesh position={[0, -0.16, 0]}>
                          <cylinderGeometry args={[0.12, 0.14, 0.14, 32]} />
                          <Enamel c={p.jointColor} />
                        </mesh>
                        <mesh position={[0, -0.24, 0]}>
                          <cylinderGeometry args={[0.07, 0.07, 0.02, 24]} />
                          <meshStandardMaterial ref={tip} color={p.ledColor} emissive={p.ledColor} emissiveIntensity={0.5} />
                        </mesh>
                        <RoundedBox args={[0.38, 0.08, 0.2]} radius={0.03} smoothness={3} position={[0, -0.27, 0]}>
                          <Enamel c={p.jointColor} />
                        </RoundedBox>
                        <mesh ref={fingerL} position={[-0.13, -0.42, 0]}>
                          <boxGeometry args={[0.05, 0.24, 0.12]} />
                          <meshStandardMaterial color="#B9B3A8" metalness={1} roughness={0.3} />
                        </mesh>
                        <mesh ref={fingerR} position={[0.13, -0.42, 0]}>
                          <boxGeometry args={[0.05, 0.24, 0.12]} />
                          <meshStandardMaterial color="#B9B3A8" metalness={1} roughness={0.3} />
                        </mesh>
                        {/* The freshly machined part */}
                        <group position={[0, -0.5, 0]} rotation={[0.55, 0, 0]}>
                          <mesh ref={part} geometry={hex} scale={1.35}>
                            <meshStandardMaterial color={p.partColor} metalness={0.9} roughness={0.28} />
                          </mesh>
                        </group>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
