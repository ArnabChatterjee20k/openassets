import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Lanternfish Agent',
  description:
    'Hero object for Lanternfish, the AI ad agent: a glossy deep-sea fish whose flank photophores light up one by one like platforms coming online. It swims in place, blinks, chases faster on hover and flashes every light on click.',
  tags: ['hero', 'agent', 'fish', 'deep sea', 'bioluminescence', '3d'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  body: color('Body').default('#1B7FA6'),
  fin: color('Fins').default('#0E5A78'),
  light: color('Photophores').default('#2EF2C4'),
  eye: color('Eye').default('#E6FFFA'),
  lure: color('Lure light').default('#FF7A59'),
  mood: select(['calm', 'hunting'], 'Mood').default('hunting'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', body: '#3FA7C6', fin: '#1B7FA6' },
  gold: { material: 'metal', body: '#C9A45C', fin: '#8C7140', light: '#E8D9B5', lure: '#FFF2CF' },
  glass: { material: 'glass', body: '#BFF6EA', fin: '#7FD8C9', light: '#2EF2C4' },
  ultraviolet: { body: '#5B1A8C', fin: '#3B0F5E', light: '#FF2E88', lure: '#FFD600', eye: '#FBEFFF' },
  calm: { mood: 'calm', material: 'clay', body: '#E6FFFA', fin: '#9FD9E8', light: '#1B7FA6' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={1.4} ior={1.35} iridescence={0.5} attenuationColor={c} attenuationDistance={2} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} sheen={0.3} sheenColor="#ffffff" />;
  }
}

/** Body half-thickness along the spine (tail X0 → nose X1): blunt deep-sea head, tapering tail. */
const X0 = -0.92;
const X1 = 0.95;
const R = (x: number) => {
  const t = Math.min(1, Math.max(0, (x - X0) / (X1 - X0)));
  return 0.52 * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.45)), 0.72) + 0.035 * (1 - t);
};
const FLAT = 0.72; // sideways squash so it reads as a fish, not a torpedo
/** A point on the body surface at spine x and angle a (0 = flank facing camera, π/2 = top). */
const onBody = (x: number, a: number, lift = 1): [number, number, number] => {
  const r = R(x) * lift;
  return [x, Math.sin(a) * r, Math.cos(a) * r * FLAT];
};
const LIGHT_X = [0.62, 0.42, 0.22, 0.02, -0.18, -0.38, -0.56];

export default function LanternfishAgent(p: P) {
  const hunting = p.mood === 'hunting';

  const bodyGeo = useMemo(() => {
    const prof: THREE.Vector2[] = [];
    const N = 56;
    for (let i = 0; i <= N; i++) {
      const x = X0 + ((X1 - X0) * i) / N;
      prof.push(new THREE.Vector2(i === 0 || i === N ? 0 : R(x), x));
    }
    const g = new THREE.LatheGeometry(prof, 72);
    g.rotateZ(-Math.PI / 2); // lathe axis y → spine x, nose at +x
    g.scale(1, 1, FLAT);
    g.computeVertexNormals();
    return g;
  }, []);

  const tailGeo = useMemo(() => {
    // Forked caudal fin, root at the origin, pointing -x.
    const s = new THREE.Shape();
    s.moveTo(0.04, 0.07);
    s.quadraticCurveTo(-0.26, 0.16, -0.54, 0.46);
    s.quadraticCurveTo(-0.42, 0.12, -0.34, 0);
    s.quadraticCurveTo(-0.42, -0.12, -0.54, -0.46);
    s.quadraticCurveTo(-0.26, -0.16, 0.04, -0.07);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 5, curveSegments: 18 });
    g.translate(0, 0, -0.025);
    return g;
  }, []);

  const dorsalGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.32, -0.04);
    s.quadraticCurveTo(-0.22, 0.32, 0.1, 0.3);
    s.quadraticCurveTo(0.08, 0.1, 0.24, -0.04);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 4, curveSegments: 14 });
    g.translate(0, 0, -0.015);
    return g;
  }, []);

  const pectoralGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(-0.18, 0.12, -0.36, 0.02);
    s.quadraticCurveTo(-0.2, -0.1, 0, 0);
    return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 12 });
  }, []);

  const tail = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const pectoral = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Mesh>(null);
  const lure = useRef<THREE.MeshStandardMaterial>(null);
  const lights = useRef<(THREE.Mesh | null)[]>([]);

  // Life: the tail sweeps (swimming in place), the pectoral fin paddles, the
  // photophores light in a chase from head to tail like platforms coming
  // online, and the eye blinks once per loop. Hover speeds the chase and
  // brightens everything; a click flashes every light at once.
  useLoop((m) => {
    const speed = hunting ? 2 : 1;
    const press = Math.abs(pressBounce(m.pressAge));
    const beat = hunting ? 4 : 2;
    if (tail.current) tail.current.rotation.y = wave(m.t, beat) * (0.38 + m.hover * 0.15) + pressBounce(m.pressAge) * 0.6;
    if (body.current) body.current.rotation.y = -wave(m.t, beat) * 0.05;
    if (pectoral.current) pectoral.current.rotation.z = -0.2 + wave(m.t, 4, 0.2) * 0.25;
    if (lid.current) {
      const b = blink(m.t, 0.82, 0.03);
      lid.current.scale.y = Math.max(0.02, b);
      lid.current.visible = b > 0.02;
    }
    const chase = (m.t / 4) * (speed + (m.hover > 0.5 ? speed : 0));
    lights.current.forEach((l, i) => {
      if (!l) return;
      const u = (((chase - i / LIGHT_X.length) % 1) + 1) % 1; // 0 right as the wave reaches this light
      const hit = Math.exp(-u * 7);
      const mat = l.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + hit * 1.5 + m.hover * 0.4 + press * 2;
      l.scale.setScalar(1 + hit * 0.3 + press * 0.3);
    });
    if (lure.current) lure.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 1.2 + press * 3 + m.hover;
  });

  return (
    <IconMotion seed={23} float={0.08}>
      <group rotation={[0, -0.3, 0.05]} position={[0.24, 0.05, 0]} scale={1.1}>
        <group ref={body}>
          {/* One seamless lathed body, squashed sideways */}
          <mesh geometry={bodyGeo}>
            <Surface kind={p.material} c={p.body} />
          </mesh>

          {/* Big deep-sea eye: sclera, pupil, highlight, blink lid */}
          <group position={onBody(0.58, 0.32, 0.86)}>
            <mesh>
              <sphereGeometry args={[0.17, 40, 32]} />
              <meshPhysicalMaterial color={p.eye} roughness={0.15} clearcoat={1} />
            </mesh>
            <mesh position={[0.03, 0, 0.1]}>
              <sphereGeometry args={[0.105, 32, 24]} />
              <meshPhysicalMaterial color="#04121A" roughness={0.1} clearcoat={1} />
            </mesh>
            <mesh position={[0.07, 0.05, 0.19]}>
              <sphereGeometry args={[0.024, 16, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh ref={lid} position={[0, 0, 0.02]} visible={false}>
              <sphereGeometry args={[0.185, 32, 24]} />
              <Surface kind={p.material} c={p.body} />
            </mesh>
          </group>

          {/* Nasal lure light: the one "pop" spark */}
          <mesh position={onBody(0.86, 0.7, 1.0)}>
            <sphereGeometry args={[0.05, 24, 16]} />
            <meshStandardMaterial ref={lure} color={p.lure} emissive={p.lure} emissiveIntensity={2} roughness={0.3} />
          </mesh>

          {/* Flank photophores, one per platform */}
          {LIGHT_X.map((x, i) => (
            <mesh key={i} ref={(el) => void (lights.current[i] = el)} position={onBody(x, -0.6, 0.98)}>
              <sphereGeometry args={[0.052 - i * 0.003, 24, 16]} />
              <meshStandardMaterial color={p.light} emissive={p.light} emissiveIntensity={0.5} roughness={0.25} toneMapped={false} />
            </mesh>
          ))}

          {/* Dorsal fin, rooted in the back */}
          <mesh geometry={dorsalGeo} position={[-0.08, R(-0.08) * 0.92, 0]}>
            <Surface kind={p.material} c={p.fin} />
          </mesh>
          {/* Pectoral fin on the near flank */}
          <group ref={pectoral} position={onBody(0.3, -0.12, 0.97)}>
            <mesh geometry={pectoralGeo}>
              <Surface kind={p.material} c={p.fin} />
            </mesh>
          </group>
        </group>

        {/* Tail sweeps from its root */}
        <group ref={tail} position={[-0.84, 0, 0]}>
          <mesh geometry={tailGeo}>
            <Surface kind={p.material} c={p.fin} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
