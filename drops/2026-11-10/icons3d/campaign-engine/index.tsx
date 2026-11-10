import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, num, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Campaign Engine',
  description:
    'Formwork landing-page hero: a kinetic Bauhaus totem (plinth, cobalt cube, vermilion sphere, yellow prism) with an orbit ring of channel beads that light up in turn. Hover speeds the orbit, a click makes the sphere hop.',
  tags: ['hero', '3d', 'bauhaus', 'ads', 'agent', 'sculpture'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  circle: color('Sphere').default('#D9381E'),
  square: color('Cube').default('#1D4E9E'),
  triangle: color('Prism').default('#F2B90F'),
  plinth: color('Plinth').default('#E4D9C4'),
  ring: color('Orbit ring').default('#111111'),
  beads: num(3, 9, 1, 'Channel beads').default(6),
  mood: select(['calm', 'live'], 'Mood').default('live'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy' },
  metal: { material: 'metal', circle: '#C9A45C', square: '#6E6A62', triangle: '#E8D9B5', plinth: '#1C1C20', ring: '#C9A45C' },
  glass: { material: 'glass', circle: '#FF6B4A', square: '#5C8AFF', triangle: '#FFD25C', beads: 9 },
  swiss: { circle: '#E3000F', square: '#0A0A0A', triangle: '#E6E6E1', plinth: '#F5F5F0', ring: '#E3000F', material: 'glossy' },
  calm: { mood: 'calm', beads: 4 },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={1.1} ior={1.4} attenuationColor={c} attenuationDistance={1.4} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

const BEAD_COLORS = (p: P) => [p.circle, p.square, p.triangle];

export default function CampaignEngine(p: P) {
  // Triangular prism with soft bevels (the "yellow triangle").
  const prism = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.34, 0);
    s.lineTo(0.34, 0);
    s.lineTo(0, 0.6);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 5, curveSegments: 2 });
    g.center();
    return g;
  }, []);

  const orbit = useRef<THREE.Group>(null);
  const sphere = useRef<THREE.Mesh>(null);
  const cube = useRef<THREE.Group>(null);
  const tri = useRef<THREE.Mesh>(null);
  const beadRefs = useRef<(THREE.Mesh | null)[]>([]);
  const live = p.mood === 'live';
  const n = Math.round(p.beads);

  // Idle: the ring orbits once (calm) or twice (live) per loop and its beads
  // light in sequence like channels going live. The sphere breathes on the
  // cube, the prism rocks. Hover brightens the beads, a click makes the sphere hop.
  useLoop((m) => {
    if (orbit.current) orbit.current.rotation.y = cycle(m.t, live ? 2 : 1) * Math.PI * 2;
    const hop = Math.abs(pressBounce(m.pressAge));
    if (sphere.current) {
      sphere.current.position.y = 0.55 + (wave(m.t, 2, 0.75) * 0.5 + 0.5) * 0.03 + hop * 0.35;
      sphere.current.rotation.z = wave(m.t, 1) * 0.15;
    }
    if (cube.current) cube.current.rotation.y = 0.62 + wave(m.t, 1, 0.1) * 0.06;
    if (tri.current) tri.current.rotation.z = -0.16 + wave(m.t, 2, 0.3) * 0.04;
    beadRefs.current.forEach((b, i) => {
      if (!b) return;
      const on = blink(m.t, (i / n + 0.05) % 1, live ? 0.08 : 0.05);
      const mat = b.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.12 + on * (live ? 1.6 : 0.9) + m.hover * 0.6 + hop * 1.5;
      b.scale.setScalar(1 + on * 0.35 + hop * 0.2);
    });
  });

  return (
    <IconMotion seed={23} float={0.05} sway={0.07}>
      <group position={[0, 0.05, 0]} scale={1.05}>
        {/* plinth: always a calm matte base */}
        <RoundedBox args={[1.7, 0.3, 1.7]} radius={0.1} smoothness={5} position={[0, -0.98, 0]}>
          <meshPhysicalMaterial color={p.plinth} roughness={0.8} sheen={0.3} sheenColor="#ffffff" />
        </RoundedBox>
        <mesh position={[0, -0.82, 0]}>
          <cylinderGeometry args={[0.66, 0.7, 0.04, 64]} />
          <meshStandardMaterial color={p.ring} roughness={0.5} />
        </mesh>

        {/* cobalt cube */}
        <group ref={cube} position={[-0.05, -0.36, 0]} rotation={[0, 0.62, 0]}>
          <RoundedBox args={[0.88, 0.88, 0.88]} radius={0.12} smoothness={6}>
            <Surface kind={p.material} c={p.square} />
          </RoundedBox>
        </group>

        {/* vermilion sphere balanced on top */}
        <mesh ref={sphere} position={[-0.05, 0.55, 0]}>
          <sphereGeometry args={[0.44, 64, 48]} />
          <Surface kind={p.material} c={p.circle} />
        </mesh>

        {/* yellow prism leaning on the cube */}
        <mesh ref={tri} geometry={prism} position={[0.52, -0.55, 0.48]} rotation={[0, -0.75, -0.16]} scale={0.85}>
          <Surface kind={p.material} c={p.triangle} />
        </mesh>

        {/* orbit ring with channel beads */}
        <group position={[0, -0.15, 0]} rotation={[0.32, 0, -0.12]}>
          <group ref={orbit}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.22, 0.024, 16, 180]} />
              <meshPhysicalMaterial color={p.ring} roughness={0.22} metalness={p.material === 'metal' ? 1 : 0.55} clearcoat={1} />
            </mesh>
            {Array.from({ length: n }, (_, i) => {
              const a = (i / n) * Math.PI * 2;
              const c = BEAD_COLORS(p)[i % 3];
              return (
                <mesh key={i} ref={(el) => void (beadRefs.current[i] = el)} position={[Math.cos(a) * 1.22, 0, Math.sin(a) * 1.22]}>
                  <sphereGeometry args={[0.065, 24, 16]} />
                  <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.12} roughness={0.3} />
                </mesh>
              );
            })}
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
