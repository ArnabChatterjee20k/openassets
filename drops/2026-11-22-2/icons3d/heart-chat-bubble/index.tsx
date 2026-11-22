import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Heart Chat Bubble',
  description:
    'Ardor’s landing-page hero: a glossy heart-shaped speech bubble with three typing dots. It breathes and types on a loop, blushes and types faster on hover, and does a heartbeat double-pump when clicked.',
  tags: ['romance', 'chat', 'heart', 'hero', '3d', 'typing'],
};

export const schema = z.object({
  material: select(['glossy', 'clay', 'metal', 'glass']).default('glossy'),
  bubbleColor: color('Bubble').default('#E3173E'),
  dotColor: color('Typing dots').default('#FFE8E0'),
  sparkColor: color('Spark').default('#F7B32B'),
  mood: select(['calm', 'smitten'], 'Mood').default('smitten'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', bubbleColor: '#F5C6AA', dotColor: '#3F1019', sparkColor: '#E3173E' },
  gold: { material: 'metal', bubbleColor: '#E8C27A', dotColor: '#3F1019', sparkColor: '#E3173E' },
  glass: { material: 'glass', bubbleColor: '#FF9FB3', dotColor: '#FFFFFF' },
  candy: { bubbleColor: '#FF7EB6', dotColor: '#3A1F4A', sparkColor: '#4FD1C5' },
  calm: { mood: 'calm', material: 'clay' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.5} sheenRoughness={0.45} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={1.4} ior={1.4} iridescence={0.35} attenuationColor={c} attenuationDistance={1.6} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} sheen={0.3} sheenColor="#ffb3c1" />;
  }
}

/** Heart whose bottom tip sweeps off to the lower left, so it reads as a speech-bubble tail. */
function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.62);
  s.bezierCurveTo(0.18, 1.02, 0.98, 1.08, 1.02, 0.42);
  s.bezierCurveTo(1.05, -0.12, 0.45, -0.5, -0.05, -0.82);
  // tail: swings out to the lower left and comes back
  s.bezierCurveTo(-0.2, -0.95, -0.42, -1.1, -0.62, -1.12);
  s.bezierCurveTo(-0.5, -0.96, -0.46, -0.82, -0.5, -0.62);
  s.bezierCurveTo(-0.92, -0.32, -1.04, 0.02, -1.02, 0.42);
  s.bezierCurveTo(-0.98, 1.08, -0.18, 1.02, 0, 0.62);
  return s;
}

export default function HeartChatBubble(p: P) {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(heartShape(), {
      depth: 0.38,
      bevelEnabled: true,
      bevelSize: 0.16,
      bevelThickness: 0.22,
      bevelSegments: 10,
      curveSegments: 48,
    });
    g.center();
    return g;
  }, []);
  // Four-point sparkle with pinched sides, extruded and bevelled.
  const spark = useMemo(() => {
    const s = new THREE.Shape();
    const R = 0.2;
    const r = 0.05;
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 2 + (i / 8) * Math.PI * 2;
      const k = i % 2 ? r : R;
      if (i === 0) s.moveTo(Math.cos(a) * k, Math.sin(a) * k);
      else s.lineTo(Math.cos(a) * k, Math.sin(a) * k);
    }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.03, bevelSegments: 3 });
    g.center();
    return g;
  }, []);

  const body = useRef<THREE.Group>(null);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const sparks = useRef<THREE.Group>(null);
  const smitten = p.mood === 'smitten';

  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    // A heartbeat (lub-dub) once per loop; smitten hearts beat twice.
    const beat = Math.max(blink(m.t, 0.3, 0.04), blink(m.t, 0.4, 0.035) * 0.7) + (smitten ? Math.max(blink(m.t, 0.8, 0.04), blink(m.t, 0.9, 0.035) * 0.7) : 0);
    const pump = beat * (smitten ? 0.07 : 0.04) + Math.abs(press) * 0.12;
    if (body.current) {
      const breathe = 1 + wave(m.t, 2) * 0.012;
      body.current.scale.set(breathe + pump, breathe + pump, breathe + pump * 0.6);
    }
    // Typing dots bounce in a wave; hover types faster (more cycles per loop).
    const cycles = (smitten ? 4 : 2) * (m.hover > 0.5 ? 2 : 1);
    dots.current.forEach((d, i) => {
      if (!d) return;
      const u = wave(m.t, cycles, -i * 0.14);
      const hop = Math.max(0, u);
      d.position.y = 0.14 + hop * (0.12 + m.hover * 0.05);
      d.scale.setScalar(0.88 + hop * 0.2);
    });
    if (glow.current) glow.current.emissiveIntensity = 0.12 + beat * 0.55 + m.hover * 0.35 + Math.abs(press) * 1.2;
    if (sparks.current) {
      sparks.current.rotation.z = wave(m.t, 1) * 0.15;
      const s = 0.85 + beat * 0.35 + m.hover * 0.2;
      sparks.current.children.forEach((c, i) => c.scale.setScalar(Math.max(0.001, s * (i ? 0.6 : 1))));
    }
  });

  return (
    <IconMotion seed={214}>
      <group rotation={[0.04, -0.28, 0.06]} position={[0, -0.02, 0]} scale={1.05}>
        <group ref={body}>
          <mesh geometry={geo} castShadow>
            <Surface kind={p.material} c={p.bubbleColor} />
          </mesh>
          {/* soft inner blush that lights up on the heartbeat */}
          <mesh position={[0, 0.06, 0.42]} scale={[1, 0.62, 1]}>
            <circleGeometry args={[0.58, 48]} />
            <meshStandardMaterial ref={glow} color={p.bubbleColor} emissive={p.bubbleColor} emissiveIntensity={0.12} transparent opacity={0.0} />
          </mesh>
          {/* typing dots */}
          {[-0.42, 0, 0.42].map((x, i) => (
            <mesh key={i} ref={(el) => void (dots.current[i] = el)} position={[x, 0.14, 0.43]} scale={[1, 1, 0.55]}>
              <sphereGeometry args={[0.145, 32, 24]} />
              <meshPhysicalMaterial color={p.dotColor} roughness={0.25} clearcoat={1} />
            </mesh>
          ))}
        </group>
        {/* gold four-point sparks at the upper right */}
        <group ref={sparks} position={[1.16, 1.0, 0.5]}>
          <mesh geometry={spark}>
            <meshPhysicalMaterial color={p.sparkColor} roughness={0.2} metalness={0.4} clearcoat={1} emissive={p.sparkColor} emissiveIntensity={0.25} />
          </mesh>
          <mesh geometry={spark} position={[0.3, -0.34, -0.05]}>
            <meshPhysicalMaterial color={p.sparkColor} roughness={0.2} metalness={0.4} clearcoat={1} emissive={p.sparkColor} emissiveIntensity={0.25} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
