import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Inspected Gear',
  description:
    "Loupe's landing-page hero: a precision spur gear with a floating inspection loupe that sweeps its teeth and rests on a tiny blinking defect. Hover speeds up the scan; a click snaps a pulse ring out from the flaw.",
  tags: ['gear', 'inspection', 'loupe', 'hero', '3d', 'manufacturing'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass'], 'Material').default('glossy'),
  gearColor: color('Gear').default('#E4DDF6'),
  loupeColor: color('Loupe ring').default('#5E4AE3'),
  defectColor: color('Defect').default('#F49CBB'),
  passColor: color('Pass light').default('#2EC4B6'),
  mood: select(['calm', 'lively'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', gearColor: '#D6CCEC', loupeColor: '#F49CBB', defectColor: '#5E4AE3' },
  steel: { material: 'metal', gearColor: '#C9CED8', loupeColor: '#231942', defectColor: '#FF4F6D', passColor: '#2EC4B6' },
  brass: { material: 'metal', gearColor: '#D9B26A', loupeColor: '#2C7873', defectColor: '#E4572E' },
  glass: { material: 'glass', gearColor: '#CFC6F2', loupeColor: '#5E4AE3' },
  lively: { mood: 'lively' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.15} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.8} ior={1.4} iridescence={0.35} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.24} clearcoat={1} clearcoatRoughness={0.08} />;
  }
}

const TEETH = 14;
const R_OUT = 0.98;
const R_ROOT = 0.8;
const DEPTH = 0.3;
// Where the flaw sits on the front face (a tooth flank, upper right).
const DEFECT: [number, number] = [0.52, 0.56];
// The loupe floats in front, nudged right so it frames the flaw from the 3/4 view.
const LOUPE_AT: [number, number] = [0.66, 0.56];

function gearShape() {
  const s = new THREE.Shape();
  const step = (Math.PI * 2) / TEETH;
  for (let i = 0; i < TEETH; i++) {
    const a = i * step;
    // root → flank → tip land → flank → root: trapezoid teeth
    const pts: [number, number][] = [
      [R_ROOT, a],
      [R_OUT, a + step * 0.16],
      [R_OUT, a + step * 0.42],
      [R_ROOT, a + step * 0.58],
    ];
    pts.forEach(([r, ang], k) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      if (i === 0 && k === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
  }
  s.closePath();
  // bore
  const bore = new THREE.Path();
  bore.absarc(0, 0, 0.22, 0, Math.PI * 2, true);
  s.holes.push(bore);
  // lightening holes in the web
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const h = new THREE.Path();
    h.absarc(Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0.11, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  return s;
}

export default function InspectedGear(p: P) {
  const gearGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(gearShape(), { depth: DEPTH, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.04, bevelSegments: 5, curveSegments: 24 });
    g.translate(0, 0, -DEPTH / 2);
    return g;
  }, []);

  const gear = useRef<THREE.Group>(null);
  const loupe = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const defectMat = useRef<THREE.MeshStandardMaterial>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const passMat = useRef<THREE.MeshStandardMaterial>(null);
  const lively = p.mood === 'lively';

  useLoop((m) => {
    const hit = Math.abs(pressBounce(m.pressAge));
    const k = (lively ? 1.5 : 1) + m.hover * 0.8;
    // The gear rocks a few degrees, like it's being turned under the lens.
    if (gear.current) gear.current.rotation.z = wave(m.t, 1) * 0.08;
    // The loupe sweeps a small figure-eight and returns to the flaw at loop edges.
    if (loupe.current) {
      loupe.current.position.x = LOUPE_AT[0] + wave(m.t, 1) * 0.32 * k * 0.6;
      loupe.current.position.y = LOUPE_AT[1] + wave(m.t, 2) * 0.12 * k * 0.6;
      loupe.current.scale.setScalar(1 + hit * 0.12);
    }
    if (ringMat.current) ringMat.current.emissiveIntensity = 0.15 + m.hover * 0.5 + hit * 1.2;
    if (defectMat.current) defectMat.current.emissiveIntensity = 0.6 + blink(m.t, 0.5, 0.06) * 2 + blink(m.t, 0.0, 0.06) * 2 + hit * 2;
    if (pulse.current) {
      const u = cycle(m.t, lively ? 2 : 1, 0.5);
      pulse.current.scale.setScalar(0.4 + u * 1.4 + hit * 0.6);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.95;
    }
    if (passMat.current) passMat.current.emissiveIntensity = 0.8 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8;
  });

  return (
    <IconMotion seed={41}>
      <group rotation={[0.28, -0.42, 0]} position={[0, -0.05, 0]} scale={1.08}>
        <group ref={gear}>
          <mesh geometry={gearGeo} castShadow>
            <Surface kind={p.material} c={p.gearColor} />
          </mesh>
          {/* hub collar around the bore, with a pass-light ring inside */}
          <mesh position={[0, 0, DEPTH / 2 + 0.02]}>
            <torusGeometry args={[0.28, 0.07, 24, 64]} />
            <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.gearColor} />
          </mesh>
          <mesh position={[0, 0, DEPTH / 2 + 0.03]}>
            <torusGeometry args={[0.2, 0.025, 16, 64]} />
            <meshStandardMaterial ref={passMat} color={p.passColor} emissive={p.passColor} emissiveIntensity={1} roughness={0.3} />
          </mesh>
          {/* the flaw: a tiny glowing pip on the front face */}
          <mesh position={[DEFECT[0], DEFECT[1], DEPTH / 2 + 0.045]}>
            <sphereGeometry args={[0.075, 24, 24]} />
            <meshStandardMaterial ref={defectMat} color={p.defectColor} emissive={p.defectColor} emissiveIntensity={1} roughness={0.25} />
          </mesh>
          {/* pulse ring radiating from the flaw */}
          <mesh ref={pulse} position={[DEFECT[0], DEFECT[1], DEPTH / 2 + 0.05]}>
            <ringGeometry args={[0.12, 0.17, 48]} />
            <meshBasicMaterial color={p.defectColor} transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* The loupe floats in front of the gear */}
        <group ref={loupe} position={[LOUPE_AT[0], LOUPE_AT[1], 0.42]}>
          <mesh>
            <torusGeometry args={[0.34, 0.075, 32, 72]} />
            <meshPhysicalMaterial ref={ringMat} color={p.loupeColor} roughness={0.22} clearcoat={1} clearcoatRoughness={0.06} emissive={p.loupeColor} emissiveIntensity={0.15} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.31, 0.31, 0.05, 64]} />
            <meshPhysicalMaterial color="#F4F0FF" roughness={0.02} transmission={1} thickness={0.4} ior={1.5} transparent opacity={0.9} />
          </mesh>
          {/* handle, angled down-right */}
          <group rotation={[0, 0, 0.75]}>
            <mesh position={[0, -0.62, 0]}>
              <capsuleGeometry args={[0.075, 0.42, 8, 24]} />
              <meshPhysicalMaterial color={p.loupeColor} roughness={0.3} clearcoat={0.8} />
            </mesh>
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.08, 32]} />
              <meshStandardMaterial color="#D9DCE6" metalness={1} roughness={0.25} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
