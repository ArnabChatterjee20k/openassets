import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Firebrand Flame',
  description: 'The Firebrand mark as a 3D hero: a puffy glossy flame with a glowing amber core on an ember puck. Tongues lick upward, sparks rise; it leans to your cursor and flares when clicked.',
  tags: ['flame', 'brand', 'hero', '3d', 'ads', 'heat'],
};

export const schema = z.object({
  material: select(['glossy', 'clay', 'metal', 'glass']).default('glossy'),
  flameColor: color('Flame').default('#FF4D00'),
  coreColor: color('Core').default('#FFB000'),
  baseColor: color('Puck').default('#3A1A10'),
  sparkColor: color('Sparks').default('#FFB000'),
  base: toggle('Ember puck').default(true),
  mood: select(['calm', 'blazing'], 'Mood').default('blazing'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', flameColor: '#FF4D00', coreColor: '#FFB000', baseColor: '#F1E4D3' },
  gold: { material: 'metal', flameColor: '#E2B65C', coreColor: '#FF4D00', baseColor: '#1C1C20', sparkColor: '#E8D9B5' },
  glass: { material: 'glass', flameColor: '#FF7A3D', coreColor: '#FFB000', base: false },
  cherry: { flameColor: '#E3173E', coreColor: '#F7B32B', baseColor: '#F5C6AA', sparkColor: '#F7B32B' },
  calm: { mood: 'calm', sparkColor: '#FF2E63' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" emissive={c} emissiveIntensity={0.08} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={1.4} ior={1.4} attenuationColor={c} attenuationDistance={0.9} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} emissive={c} emissiveIntensity={0.12} />;
  }
}

/** Outer flame: a main body with a side tongue on the left, tip curling right. */
function outerShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.bezierCurveTo(0.62, -1, 0.92, -0.62, 0.9, -0.18);
  s.bezierCurveTo(0.88, 0.3, 0.55, 0.62, 0.22, 1.12);
  s.bezierCurveTo(0.2, 0.7, 0.02, 0.5, -0.2, 0.36);
  s.bezierCurveTo(-0.26, 0.5, -0.36, 0.62, -0.5, 0.7);
  s.bezierCurveTo(-0.96, 0.32, -0.94, -0.32, -0.72, -0.66);
  s.bezierCurveTo(-0.56, -0.9, -0.3, -1, 0, -1);
  return s;
}

/** Inner core: a fat teardrop. */
function innerShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.78);
  s.bezierCurveTo(0.42, -0.78, 0.52, -0.4, 0.4, -0.12);
  s.bezierCurveTo(0.3, 0.12, 0.16, 0.24, 0.1, 0.46);
  s.bezierCurveTo(-0.1, 0.24, -0.44, 0.06, -0.44, -0.3);
  s.bezierCurveTo(-0.44, -0.6, -0.22, -0.78, 0, -0.78);
  return s;
}

function extrude(shape: THREE.Shape, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel * 1.1, bevelSegments: 10, curveSegments: 48 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Licking flame: bend vertices sideways, more toward the tip. */
function deform(g: THREE.BufferGeometry, orig: Float32Array, t: number, amp: number, y0: number, stretch: number) {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const a = pos.array as Float32Array;
  for (let i = 0; i < a.length; i += 3) {
    const x = orig[i];
    const y = orig[i + 1];
    const h = Math.max(0, (y + y0 + 1) / 2.1); // 0 at the base, 1 at the tip
    const k = h * h;
    a[i] = x + (wave(t, 2, h * 0.35) * 0.14 + wave(t, 4, h * 0.6) * 0.045) * amp * k;
    a[i + 1] = y + (y + y0 + 1) * (stretch - 1) * h;
    a[i + 2] = orig[i + 2];
  }
  pos.needsUpdate = true;
}

export default function FirebrandFlame(p: P) {
  const outer = useMemo(() => extrude(outerShape(), 0.38, 0.12), []);
  const inner = useMemo(() => extrude(innerShape(), 0.2, 0.08), []);
  const outerOrig = useMemo(() => Float32Array.from(outer.attributes.position.array as Float32Array), [outer]);
  const innerOrig = useMemo(() => Float32Array.from(inner.attributes.position.array as Float32Array), [inner]);
  const puck = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, -0.16),
      new THREE.Vector2(0.86, -0.16),
      new THREE.Vector2(0.96, -0.1),
      new THREE.Vector2(0.98, 0.02),
      new THREE.Vector2(0.9, 0.12),
      new THREE.Vector2(0.62, 0.15),
      new THREE.Vector2(0, 0.15),
    ];
    return new THREE.LatheGeometry(pts, 72);
  }, []);

  const coreMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const flame = useRef<THREE.Group>(null);
  const sparks = useRef<(THREE.Mesh | null)[]>([]);
  const blazing = p.mood === 'blazing';

  // Idle: tongues lick upward, the core breathes, sparks rise; a quick flare blinks once per loop.
  // Hover stretches and brightens the flame; a click flares it with a squash bounce.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    const energy = (blazing ? 1 : 0.5) + m.hover * 0.7;
    const flare = blink(m.t, 0.62, 0.05) * (blazing ? 1 : 0.4);
    const stretch = 1 + m.hover * 0.07 + flare * 0.05 + press * 0.12 + (wave(m.t, 2) * 0.5 + 0.5) * 0.025;
    deform(outer, outerOrig, m.t, energy, 0, stretch);
    deform(inner, innerOrig, m.t, energy * 0.8, -0.12, stretch);
    if (coreMat.current) coreMat.current.emissiveIntensity = 0.22 + (wave(m.t, 2) * 0.5 + 0.5) * 0.25 * energy + flare * 0.8 + press * 1.6 + m.hover * 0.4;
    if (ringMat.current) ringMat.current.emissiveIntensity = 1 + (wave(m.t, 1) * 0.5 + 0.5) * 0.8 + press * 2;
    if (flame.current) flame.current.rotation.z = wave(m.t, 1, 0.1) * 0.035 * energy;
    sparks.current.forEach((s, i) => {
      if (!s) return;
      const u = cycle(m.t, blazing ? 2 : 1, i * 0.5);
      s.position.set((i ? 0.62 : -0.7) + Math.sin(u * Math.PI * 2) * 0.08, 0.1 + u * 1.5, 0.2);
      s.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * u) * (0.8 + m.hover * 0.6)));
    });
  });

  return (
    <IconMotion seed={41} float={0.06}>
      <group position={[0, p.base ? 0.05 : -0.05, 0]} scale={0.92}>
        <group ref={flame} position={[0, 0.12, 0]}>
          <mesh geometry={outer} castShadow>
            <Surface kind={p.material} c={p.flameColor} />
          </mesh>
          <mesh geometry={inner} position={[0.02, -0.12, 0.2]}>
            <meshPhysicalMaterial ref={coreMat} color={p.coreColor} roughness={0.25} clearcoat={1} clearcoatRoughness={0.05} emissive={p.coreColor} emissiveIntensity={0.3} />
          </mesh>
        </group>
        {Array.from({ length: 2 }, (_, i) => (
          <mesh key={i} ref={(el) => void (sparks.current[i] = el)} position={[0, -5, 0]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial color={p.sparkColor} emissive={p.sparkColor} emissiveIntensity={2} />
          </mesh>
        ))}
        {p.base && (
          <group position={[0, -1.12, 0]}>
            <mesh geometry={puck} receiveShadow castShadow>
              <meshPhysicalMaterial color={p.baseColor} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.2} />
            </mesh>
            {/* glowing ember ring around the top of the puck */}
            <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.76, 0.035, 16, 96]} />
              <meshStandardMaterial ref={ringMat} color={p.coreColor} emissive={p.coreColor} emissiveIntensity={1.4} />
            </mesh>
          </group>
        )}
      </group>
    </IconMotion>
  );
}
