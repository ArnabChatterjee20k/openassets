import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Sentinel Camera',
  description:
    'Plumbline hero object: a glossy CCTV camera on a wall arm with a molten lens. It pans slowly while the REC light blinks; hover heats the lens, a click fires a shutter flash.',
  tags: ['camera', 'cctv', 'infrastructure', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  body: color('Body').default('#F3E6DC'),
  trim: color('Arm & bezel').default('#2E120B'),
  lens: color('Lens glow').default('#FF4D00'),
  rec: color('REC light').default('#FF2E63'),
  mood: select(['calm', 'alert'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', body: '#FF8A4C', trim: '#4A1A0C', lens: '#FFB000' },
  metal: { material: 'metal', body: '#D9DCE2', trim: '#1C1C20', lens: '#FFB000' },
  glass: { material: 'glass', body: '#FFB48A', trim: '#4A1A0C', lens: '#FF2E63' },
  alert: { mood: 'alert', lens: '#FF2E63', rec: '#FFB000' },
  blueprint: { body: '#EAF2FF', trim: '#0F3B8C', lens: '#7FB2FF', rec: '#FFDD00' },
};

type P = z.infer<typeof schema>;

function Shell({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.1} transmission={1} thickness={0.8} ior={1.4} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
  }
}

const Trim = ({ c }: { c: string }) => <meshPhysicalMaterial color={c} roughness={0.35} metalness={0.4} clearcoat={0.6} />;
const X_AXIS: [number, number, number] = [0, 0, Math.PI / 2];

export default function SentinelCamera(p: P) {
  const pan = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const iris = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const alert = p.mood === 'alert';

  // Idle: a slow surveillance pan with a small nod, the REC light blinks,
  // the lens breathes. Hover heats the lens and widens the sweep; a click flashes it.
  useLoop((m) => {
    const amp = (alert ? 0.4 : 0.3) * (1 + m.hover * 0.5);
    if (pan.current) pan.current.rotation.y = wave(m.t, alert ? 2 : 1) * amp;
    if (tilt.current) tilt.current.rotation.z = -0.22 + wave(m.t, 2, 0.25) * 0.04;
    const flash = Math.abs(pressBounce(m.pressAge));
    const breathe = 0.5 + 0.5 * wave(m.t, alert ? 4 : 2);
    if (iris.current) iris.current.emissiveIntensity = 0.7 + breathe * 0.5 + m.hover * 1.4 + flash * 5;
    if (ring.current) ring.current.emissiveIntensity = 0.6 + breathe * 0.4 + m.hover * 0.8 + flash * 2;
    const on = alert ? Math.max(blink(m.t, 0.2, 0.06), blink(m.t, 0.45, 0.06), blink(m.t, 0.7, 0.06), blink(m.t, 0.95, 0.04)) : Math.max(blink(m.t, 0.3, 0.08), blink(m.t, 0.8, 0.08));
    if (led.current) led.current.emissiveIntensity = 0.3 + on * 4;
  });

  return (
    <IconMotion seed={41} float={0.05} sway={0.06}>
      <group position={[0.05, -0.62, 0]} rotation={[0.1, 1.0, 0]} scale={1.22}>
        {/* wall plate */}
        <RoundedBox args={[0.12, 1.0, 0.62]} radius={0.05} smoothness={5} position={[0.98, 0.02, 0]}>
          <Trim c={p.trim} />
        </RoundedBox>
        {[0.32, -0.28].map((y) => (
          <mesh key={y} position={[0.92, y, 0]} rotation={X_AXIS}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 20]} />
            <meshStandardMaterial color="#9A8F88" metalness={1} roughness={0.3} />
          </mesh>
        ))}
        {/* arm out from the wall, then a knuckle joint */}
        <mesh position={[0.72, 0.02, 0]} rotation={X_AXIS}>
          <cylinderGeometry args={[0.075, 0.09, 0.46, 32]} />
          <Trim c={p.trim} />
        </mesh>
        <mesh position={[0.46, 0.02, 0]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <Trim c={p.trim} />
        </mesh>
        <mesh position={[0.46, 0.17, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.24, 24]} />
          <Trim c={p.trim} />
        </mesh>

        {/* the camera pans around the knuckle */}
        <group ref={pan} position={[0.46, 0.34, 0]}>
          <group ref={tilt}>
            {/* body */}
            <RoundedBox args={[1.5, 0.5, 0.58]} radius={0.2} smoothness={6} position={[-0.55, 0.05, 0]}>
              <Shell kind={p.material} c={p.body} />
            </RoundedBox>
            {/* sun hood, slightly longer than the body */}
            <RoundedBox args={[1.72, 0.08, 0.72]} radius={0.035} smoothness={4} position={[-0.66, 0.34, 0]}>
              <Shell kind={p.material === 'glass' ? 'glossy' : p.material} c={p.body} />
            </RoundedBox>
            {/* rear cap */}
            <mesh position={[0.22, 0.05, 0]} rotation={X_AXIS}>
              <cylinderGeometry args={[0.2, 0.2, 0.06, 40]} />
              <Trim c={p.trim} />
            </mesh>
            {/* lens bezel, glowing ring and iris at the front */}
            <mesh position={[-1.32, 0.05, 0]} rotation={X_AXIS}>
              <cylinderGeometry args={[0.24, 0.24, 0.12, 48]} />
              <Trim c={p.trim} />
            </mesh>
            <mesh position={[-1.385, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.18, 0.025, 20, 64]} />
              <meshStandardMaterial ref={ring} color={p.lens} emissive={p.lens} emissiveIntensity={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-1.37, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.35, 1]}>
              <sphereGeometry args={[0.14, 40, 24]} />
              <meshStandardMaterial ref={iris} color={p.lens} emissive={p.lens} emissiveIntensity={1.0} roughness={0.15} />
            </mesh>
            {/* glass highlight over the iris */}
            <mesh position={[-1.41, 0.1, 0.05]} rotation={[0, -Math.PI / 2, 0]}>
              <circleGeometry args={[0.035, 20]} />
              <meshBasicMaterial color="#FFF4EA" transparent opacity={0.85} />
            </mesh>
            {/* REC light on the flank */}
            <mesh position={[-0.05, 0.16, 0.29]}>
              <sphereGeometry args={[0.045, 24, 24]} />
              <meshStandardMaterial ref={led} color={p.rec} emissive={p.rec} emissiveIntensity={1} roughness={0.2} />
            </mesh>
            {/* a thin seam line along the body */}
            <mesh position={[-0.55, -0.08, 0.292]}>
              <boxGeometry args={[1.1, 0.012, 0.004]} />
              <meshStandardMaterial color={p.trim} roughness={0.6} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
