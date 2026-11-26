import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Agent Envelope',
  description:
    'Postnook’s hero object: a soft envelope with a gold wax seal and a letter rising out of it. The letter breathes, the seal glows and an unread dot blinks; hover opens the flap, a click pops the letter up.',
  tags: ['email', 'envelope', 'inbox', 'agent', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'paper', 'metal', 'glass']).default('clay'),
  envelope: color('Envelope').default('#C5D3A2'),
  letter: color('Letter').default('#F7F5EC'),
  lines: color('Letter lines').default('#6A8D3A'),
  seal: color('Wax seal').default('#C9A227'),
  dot: color('Unread dot').default('#E85D3F'),
  unread: select(['dot', 'none'], 'Unread badge').default('dot'),
  mood: select(['calm', 'busy'], 'Inbox mood').default('busy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', envelope: '#6A8D3A', seal: '#E8C14A', lines: '#1E2A1A' },
  kraft: { material: 'paper', envelope: '#D6B78A', seal: '#B8322A', lines: '#6B4A2A', dot: '#2F6F8F' },
  metal: { material: 'metal', envelope: '#D5DAE3', seal: '#C9A45C', lines: '#6E6A62' },
  calm: { envelope: '#C9DCEA', lines: '#2F6F8F', seal: '#6A8D3A', mood: 'calm', unread: 'none' },
  glass: { material: 'glass', envelope: '#DCE9C8', seal: '#C9A227' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} />;
    case 'paper':
      return <meshPhysicalMaterial color={c} roughness={0.92} sheen={0.6} sheenRoughness={0.8} sheenColor="#fff6e0" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.4} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={0.85} thickness={0.25} ior={1.15} iridescence={0.3} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

const W = 2.2;
const H = 1.42;
const D = 0.22;

/** A rounded-corner triangle in the XY plane, extruded with a soft bevel. */
function triangle(pts: [number, number][], depth: number, bevel: number) {
  const s = new THREE.Shape();
  s.moveTo(...pts[0]);
  pts.slice(1).forEach((p) => s.lineTo(...p));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: 6 });
  return g;
}

export default function AgentEnvelope(p: P) {
  // Top flap: a triangle that stands up behind the letter, hinged on the top edge.
  const flapGeo = useMemo(() => triangle([[-W / 2 + 0.06, 0], [W / 2 - 0.06, 0], [0, 0.62]], 0.04, 0.03), []);
  // Front pocket: the V-fold that forms the envelope's face.
  const pocketGeo = useMemo(() => triangle([[-W / 2 + 0.07, -H / 2 + 0.07], [W / 2 - 0.07, -H / 2 + 0.07], [0, 0.12]], 0.03, 0.025), []);
  const sideGeo = useMemo(() => triangle([[-W / 2 + 0.07, -H / 2 + 0.07], [-W / 2 + 0.07, H / 2 - 0.08], [-0.08, 0.02]], 0.02, 0.02), []);

  const letter = useRef<THREE.Group>(null);
  const flap = useRef<THREE.Group>(null);
  const sealMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const dot = useRef<THREE.Mesh>(null);
  const busy = p.mood === 'busy';

  // Idle: the letter breathes up and down, the seal glows, the unread dot pings.
  // Hover opens the flap and lifts the letter; a click pops it up with a bounce.
  useLoop((m) => {
    const pop = pressBounce(m.pressAge);
    const lift = (0.5 + 0.5 * wave(m.t, busy ? 2 : 1, -0.25)) * (busy ? 0.2 : 0.12);
    if (letter.current) letter.current.position.y = 0.48 + lift + m.hover * 0.22 + Math.abs(pop) * 0.35;
    if (flap.current) flap.current.rotation.x = -0.55 - m.hover * 0.4 - (0.5 + 0.5 * wave(m.t, 1, -0.25)) * 0.12 - Math.abs(pop) * 0.3;
    if (sealMat.current) sealMat.current.emissiveIntensity = 0.06 + (0.5 + 0.5 * wave(m.t, 1, -0.25)) * 0.22 + m.hover * 0.25 + Math.abs(pop) * 0.8;
    if (dot.current) {
      const b = busy ? Math.max(blink(m.t, 0.35, 0.05), blink(m.t, 0.85, 0.05)) : blink(m.t, 0.6, 0.06);
      dot.current.scale.setScalar(1 + b * 0.35 + m.hover * 0.1);
    }
  });

  return (
    <IconMotion seed={41}>
      <group rotation={[0.16, -0.38, 0.04]} position={[0, -0.12, 0]}>
        {/* Back flap, standing open behind everything */}
        <group ref={flap} position={[0, H / 2 - 0.04, -D / 2 + 0.02]} rotation={[-0.55, 0, 0]}>
          <mesh geometry={flapGeo} position={[0, 0, -0.02]}>
            <Surface kind={p.material} c={p.envelope} />
          </mesh>
        </group>

        {/* The letter, half inside the envelope */}
        <group ref={letter} position={[0, 0.48, -0.01]}>
          <RoundedBox args={[W - 0.3, H - 0.2, 0.035]} radius={0.015} smoothness={3}>
            <meshPhysicalMaterial color={p.letter} roughness={0.55} sheen={0.3} sheenColor="#ffffff" />
          </RoundedBox>
          {[0.42, 0.26, 0.1].map((y, i) => (
            <mesh key={y} position={[i === 0 ? -0.38 : -0.12 + i * -0.08, y, 0.02]}>
              <boxGeometry args={[i === 0 ? 0.9 : 1.36 - i * 0.2, i === 0 ? 0.09 : 0.055, 0.008]} />
              <meshStandardMaterial color={p.lines} roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* Envelope body */}
        <RoundedBox args={[W, H, D]} radius={0.09} smoothness={5}>
          <Surface kind={p.material} c={p.envelope} />
        </RoundedBox>
        {/* Folds on the face: two side flaps and the bottom pocket, slightly proud of the body */}
        <mesh geometry={sideGeo} position={[0, 0, D / 2 - 0.005]}>
          <Surface kind={p.material} c={p.envelope} />
        </mesh>
        <mesh geometry={sideGeo} position={[0, 0, D / 2 - 0.005]} scale={[-1, 1, 1]}>
          <Surface kind={p.material} c={p.envelope} />
        </mesh>
        <mesh geometry={pocketGeo} position={[0, 0, D / 2 + 0.015]}>
          <Surface kind={p.material} c={p.envelope} />
        </mesh>

        {/* Wax seal where the folds meet */}
        <group position={[0, 0.05, D / 2 + 0.09]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.26, 0.07, 48]} />
            <meshPhysicalMaterial ref={sealMat} color={p.seal} emissive={p.seal} emissiveIntensity={0.06} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.036]}>
            <torusGeometry args={[0.15, 0.025, 16, 48]} />
            <meshPhysicalMaterial color={p.seal} roughness={0.3} clearcoat={1} />
          </mesh>
          {/* a tiny leaf pressed into the wax */}
          <mesh position={[0, 0, 0.04]} rotation={[0, 0, 0.6]} scale={[0.5, 1, 0.4]}>
            <sphereGeometry args={[0.09, 24, 16]} />
            <meshPhysicalMaterial color={p.seal} roughness={0.25} clearcoat={1} />
          </mesh>
        </group>

        {/* Unread badge */}
        {p.unread === 'dot' && (
          <mesh ref={dot} position={[W / 2 - 0.08, H / 2 - 0.06, D / 2 + 0.06]}>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshPhysicalMaterial color={p.dot} roughness={0.2} clearcoat={1} emissive={p.dot} emissiveIntensity={0.15} />
          </mesh>
        )}
      </group>
    </IconMotion>
  );
}
