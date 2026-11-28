import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Injection Mold',
  description:
    'Sprue’s hero object: a two-plate injection mold on guide pins with a glossy lime gear between the halves. On a loop it clamps shut, glows with heat, opens and pops a fresh part. Hover opens it wider; click ejects the gear with a spin.',
  tags: ['3d', 'mold', 'injection molding', 'manufacturing', 'gear', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  moldColor: color('Mold').default('#3F7A4E'),
  partColor: color('Part').default('#B5E550'),
  heatColor: color('Heat glow').default('#FF9F43'),
  pinColor: color('Guide pins').default('#D9DED3'),
  mood: select(['steady', 'rush'], 'Line speed').default('steady'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', moldColor: '#2F5A3B' },
  steel: { material: 'metal', moldColor: '#C9CED6', partColor: '#FF9F43', heatColor: '#FF5A1F' },
  glass: { material: 'glass', moldColor: '#CFE8D4' },
  citrus: { moldColor: '#FFE9A8', partColor: '#FF7A00', heatColor: '#FF3D7F', pinColor: '#2BB24C' },
  rush: { mood: 'rush', material: 'glossy' },
};

type P = z.infer<typeof schema>;

function Body({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.25} clearcoat={1} clearcoatRoughness={0.08} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.08} transmission={1} thickness={1} ior={1.4} attenuationColor={c} attenuationDistance={2} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.7} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

/** Gear outline with flat-topped teeth and a centre bore. */
function gearGeometry() {
  const n = 8;
  const R = 0.42;
  const r = 0.33;
  const s = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const step = (Math.PI * 2) / n;
    const pts: [number, number][] = [
      [a - step * 0.5, r],
      [a - step * 0.22, r],
      [a - step * 0.14, R],
      [a + step * 0.14, R],
      [a + step * 0.22, r],
    ];
    pts.forEach(([ang, rad], k) => {
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      if (i === 0 && k === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
  }
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.11, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.04, bevelSegments: 5, curveSegments: 24 });
  g.center();
  return g;
}

const smooth = (u: number) => u * u * (3 - 2 * u);
const seg = (u: number, a: number, b: number) => smooth(Math.min(1, Math.max(0, (u - a) / (b - a))));
const backOut = (u: number) => {
  const c = 1.9;
  const x = u - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};

const OPEN = 0.95; // top plate lift at rest
const BASE = -0.17; // top face of the fixed plate
const GEAR_Y = 0.36; // gear centre, standing in the cavity
const PIN = (lift: number) => lift + 0.08; // gap between the plates

export default function InjectionMold(p: P) {
  const gear = useMemo(gearGeometry, []);
  const top = useRef<THREE.Group>(null);
  const part = useRef<THREE.Group>(null);
  const pins = useRef<THREE.Group>(null);
  const heat = useRef<THREE.MeshStandardMaterial>(null);
  const seam = useRef<THREE.MeshStandardMaterial>(null);
  const rush = p.mood === 'rush';

  // The cycle: hold open → clamp → heat → open → pop the fresh part.
  useLoop((m) => {
    const u = cycle(m.t, rush ? 2 : 1);
    const close = seg(u, 0.4, 0.5) - seg(u, 0.66, 0.76);
    const sink = seg(u, 0.36, 0.46);
    const pop = u < 0.76 ? 0 : backOut(Math.min(1, (u - 0.76) / 0.16));
    const heatAmt = seg(u, 0.48, 0.56) * (1 - seg(u, 0.7, 0.8));
    const click = pressBounce(m.pressAge);
    const lift = OPEN + m.hover * 0.16 - close * (OPEN - 0.02);
    if (top.current) top.current.position.y = lift;
    // Guide pins always span the gap (they slide into bushings in the top plate).
    if (pins.current) pins.current.scale.y = PIN(lift) / PIN(OPEN);
    if (part.current) {
      const visible = u < 0.46 ? 1 - sink : pop;
      part.current.scale.setScalar(Math.max(0.001, visible));
      part.current.position.y = GEAR_Y - (1 - visible) * 0.5 + Math.abs(click) * 0.3 + m.hover * 0.05;
      // One tooth (1/8 turn) per loop keeps the loop seamless; the pop adds a flick, a click spins it.
      const flick = u >= 0.76 ? (1 - Math.min(1, (u - 0.76) / 0.16)) * 0.9 : 0;
      part.current.rotation.z = -cycle(m.t, 1) * (Math.PI / 4) - flick + click * 1.4;
    }
    const glow = Math.max(heatAmt, blink(m.t, 0.93, 0.04) * 0.6, Math.abs(click));
    if (heat.current) heat.current.emissiveIntensity = 0.3 + glow * 2.6 + m.hover * 0.6;
    if (seam.current) seam.current.emissiveIntensity = heatAmt * 3;
  });

  const pin = (x: number, z: number) => (
    <mesh key={`${x}${z}`} position={[x, PIN(OPEN) / 2, z]}>
      <cylinderGeometry args={[0.055, 0.055, PIN(OPEN), 24]} />
      <meshStandardMaterial color={p.pinColor} metalness={0.9} roughness={0.25} />
    </mesh>
  );

  return (
    <IconMotion seed={28} sway={0.06}>
      <group rotation={[0.16, -0.5, 0]} position={[0, -0.32, 0]} scale={0.96}>
        {/* Fixed (bottom) plate with its cavity and runner channel */}
        <group position={[0, BASE - 0.25, 0]}>
          <RoundedBox args={[1.7, 0.5, 1.2]} radius={0.1} smoothness={5}>
            <Body kind={p.material} c={p.moldColor} />
          </RoundedBox>
          <mesh position={[0, 0.252, 0.05]}>
            <cylinderGeometry args={[0.4, 0.4, 0.01, 48]} />
            <meshStandardMaterial ref={seam} color="#14231A" emissive={p.heatColor} emissiveIntensity={0} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.252, -0.4]}>
            <boxGeometry args={[0.1, 0.012, 0.34]} />
            <meshStandardMaterial color="#14231A" roughness={0.6} />
          </mesh>
        </group>

        <group ref={pins} position={[0, BASE, 0]}>
          {[-0.76, 0.76].flatMap((x) => [-0.5, 0.5].map((z) => pin(x, z)))}
        </group>

        {/* The fresh part, standing in the cavity and turned to face the viewer */}
        <group ref={part} position={[0, GEAR_Y, 0.05]}>
          <group rotation={[0, 0.5, 0]} scale={1.15}>
            <mesh geometry={gear}>
              <meshPhysicalMaterial color={p.partColor} roughness={0.16} clearcoat={1} clearcoatRoughness={0.05} emissive={p.partColor} emissiveIntensity={0.04} />
            </mesh>
          </group>
        </group>

        {/* Moving (top) plate with the sprue bushing and nozzle */}
        <group ref={top} position={[0, OPEN, 0]}>
          <group position={[0, 0.16, 0]}>
            <RoundedBox args={[1.7, 0.5, 1.2]} radius={0.1} smoothness={5}>
              <Body kind={p.material} c={p.moldColor} />
            </RoundedBox>
            <mesh position={[0, 0.33, -0.05]}>
              <cylinderGeometry args={[0.24, 0.28, 0.16, 40]} />
              <meshStandardMaterial color={p.pinColor} metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.43, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.16, 0.045, 16, 48]} />
              <meshStandardMaterial ref={heat} color={p.heatColor} emissive={p.heatColor} emissiveIntensity={0.3} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.5, -0.05]}>
              <coneGeometry args={[0.12, 0.2, 32]} />
              <meshStandardMaterial color={p.pinColor} metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
