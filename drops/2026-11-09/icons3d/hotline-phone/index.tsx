import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Hotline Phone',
  description:
    'Patchwell landing-page hero: a chunky mid-century rotary phone whose line lamp blinks, dial spins out and springs back, and handset rings. Tilts to the cursor; rings and flashes when clicked.',
  tags: ['3d', 'phone', 'rotary', 'mid-century', 'agent', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  bodyColor: color('Body').default('#D96C3D'),
  dialColor: color('Dial').default('#F4E9D8'),
  lampColor: color('Line lamp').default('#E9B44C'),
  cordColor: color('Cord').default('#2E2A24'),
  mood: select(['calm', 'ringing'], 'Mood').default('ringing'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  teal: { bodyColor: '#2C7873', dialColor: '#F4E9D8', cordColor: '#1C4A47' },
  cream: { material: 'clay', bodyColor: '#EADBC2', dialColor: '#2C7873', lampColor: '#D96C3D', cordColor: '#8A6A4A', mood: 'calm' },
  brass: { material: 'metal', bodyColor: '#C9A45C', dialColor: '#2E2A24', lampColor: '#E3173E', cordColor: '#3A2A1C' },
  glass: { material: 'glass', bodyColor: '#F2C9A8', dialColor: '#F4E9D8', lampColor: '#E9B44C' },
  cherry: { bodyColor: '#E3173E', dialColor: '#FFE8E0', lampColor: '#F7B32B', cordColor: '#2A0A10' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.15} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.18} transmission={0.92} thickness={0.5} ior={1.3} attenuationColor={c} attenuationDistance={3} />;
    default:
      // Glossy bakelite: deep colour under a hard clear coat.
      return <meshPhysicalMaterial color={c} roughness={0.28} clearcoat={1} clearcoatRoughness={0.06} />;
  }
}

// Side profile (s = depth toward camera, y = up). The front slope carries the dial.
const SLOPE = Math.atan2(0.4, 0.72); // tilt of the slope from vertical
const DIAL_TILT = Math.PI / 2 - SLOPE;

export default function HotlinePhone(p: P) {
  const body = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.62, 0);
    s.lineTo(0.62, 0);
    s.quadraticCurveTo(0.74, 0, 0.7, 0.1);
    s.lineTo(0.34, 0.74);
    s.quadraticCurveTo(0.3, 0.82, 0.2, 0.83);
    s.lineTo(-0.5, 0.86);
    s.quadraticCurveTo(-0.62, 0.86, -0.63, 0.74);
    s.lineTo(-0.7, 0.1);
    s.quadraticCurveTo(-0.72, 0, -0.62, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.62, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.12, bevelSegments: 6, curveSegments: 12 });
    g.translate(0, 0, -0.81);
    g.rotateY(-Math.PI / 2); // profile s → +z (front), extrusion → x (width)
    return g;
  }, []);

  const grip = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.86, 0.02, 0),
      new THREE.Vector3(-0.55, 0.16, 0),
      new THREE.Vector3(0, 0.22, 0),
      new THREE.Vector3(0.55, 0.16, 0),
      new THREE.Vector3(0.86, 0.02, 0),
    ]);
    return new THREE.TubeGeometry(c, 64, 0.12, 20, false);
  }, []);

  // Coiled cord: a helix wound around a curve from the handset to the body's side.
  const cord = useMemo(() => {
    const path = new THREE.CubicBezierCurve3(new THREE.Vector3(-1.02, 0.98, 0.05), new THREE.Vector3(-1.45, 0.75, 0.25), new THREE.Vector3(-1.35, 0.15, 0.5), new THREE.Vector3(-0.98, 0.22, 0.35));
    const ptsArr: THREE.Vector3[] = [];
    const N = 420;
    const turns = 15;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const c = path.getPoint(t);
      const tan = path.getTangent(t);
      const n1 = new THREE.Vector3(0, 0, 1).cross(tan).normalize();
      if (n1.lengthSq() < 0.01) n1.set(1, 0, 0);
      const n2 = tan.clone().cross(n1).normalize();
      const a = t * turns * Math.PI * 2;
      ptsArr.push(c.add(n1.multiplyScalar(Math.cos(a) * 0.06)).add(n2.multiplyScalar(Math.sin(a) * 0.06)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsArr), 900, 0.022, 8, false);
  }, []);

  const wheel = useRef<THREE.Group>(null);
  const handset = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const ringing = p.mood === 'ringing';

  useLoop((m) => {
    const kick = pressBounce(m.pressAge);
    // Dial: once per loop it's "dialled" out to a digit and springs back.
    if (wheel.current) {
      const u = cycle(m.t, 1);
      const out = u < 0.12 ? 0 : u < 0.32 ? (u - 0.12) / 0.2 : u < 0.4 ? 1 : u < 0.62 ? 1 - (u - 0.4) / 0.22 : 0;
      const e = out * out * (3 - 2 * out);
      wheel.current.rotation.y = -e * (1.9 + m.hover * 1.2) - kick * 0.4;
    }
    // Handset: a two-burst "brring" when ringing, plus a hop on click.
    if (handset.current) {
      const burst = ringing ? Math.max(blink(m.t, 0.72, 0.06), blink(m.t, 0.88, 0.06)) : 0;
      const buzz = wave(m.t, 48) * 0.035 * (burst + m.hover * 0.4);
      handset.current.rotation.z = buzz + kick * 0.18;
      handset.current.position.y = 1.08 + Math.abs(buzz) * 0.8 + Math.max(0, kick) * 0.18;
    }
    // Line lamp: steady glow that blinks with each ring; hover and click flare it.
    const flare = (ringing ? Math.max(blink(m.t, 0.72, 0.07), blink(m.t, 0.88, 0.07)) : blink(m.t, 0.5, 0.08) * 0.6) + m.hover * 0.6 + Math.abs(kick) * 2;
    if (lamp.current) lamp.current.emissiveIntensity = 0.9 + flare * 2.2;
    if (halo.current) halo.current.scale.setScalar(1 + flare * 0.35);
  });

  const holes = Array.from({ length: 10 }, (_, i) => {
    const a = (-0.35 + (i / 10) * 1.55) * Math.PI; // a gap at the finger stop, like a real dial
    return [Math.cos(a) * 0.255, Math.sin(a) * 0.255] as const;
  });

  return (
    <IconMotion seed={41} sway={0.1}>
      <group position={[0, -0.78, 0]} rotation={[0.12, -0.32, 0]} scale={1.08}>
        {/* body */}
        <mesh geometry={body}>
          <Surface kind={p.material} c={p.bodyColor} />
        </mesh>
        {/* feet */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, -0.1, 0.05]}>
            <cylinderGeometry args={[0.12, 0.14, 0.08, 24]} />
            <meshPhysicalMaterial color="#2E2A24" roughness={0.6} />
          </mesh>
        ))}

        {/* dial on the front slope: number plate, rotating finger wheel, finger stop */}
        <group position={[0, 0.4, 0.66]} rotation={[DIAL_TILT, 0, 0]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.39, 0.4, 0.05, 64]} />
            <meshPhysicalMaterial color={p.dialColor} roughness={0.35} clearcoat={0.6} />
          </mesh>
          <group ref={wheel} position={[0, 0.06, 0]}>
            {/* finger wheel in the body colour, holes showing the cream number plate */}
            <mesh>
              <cylinderGeometry args={[0.37, 0.37, 0.045, 64]} />
              <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.bodyColor} />
            </mesh>
            {holes.map(([x, z], i) => (
              <group key={i} position={[x, 0.004, z]}>
                <mesh>
                  <cylinderGeometry args={[0.062, 0.062, 0.05, 28]} />
                  <meshPhysicalMaterial color={p.dialColor} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.026, 0]}>
                  <torusGeometry args={[0.062, 0.01, 8, 28]} />
                  <meshStandardMaterial color="#C9A45C" metalness={1} roughness={0.3} />
                </mesh>
                <mesh position={[x * 0.08, 0.027, z * 0.08]}>
                  <cylinderGeometry args={[0.014, 0.014, 0.004, 12]} />
                  <meshStandardMaterial color="#2E2A24" />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.04, 40]} />
              <meshPhysicalMaterial color={p.dialColor} roughness={0.3} clearcoat={1} />
            </mesh>
            {/* a little Patchwell label strip on the centre card */}
            <mesh position={[0, 0.042, 0]}>
              <boxGeometry args={[0.16, 0.004, 0.035]} />
              <meshStandardMaterial color={p.lampColor} />
            </mesh>
          </group>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.05, 20, 20]} />
            <meshStandardMaterial color="#C9A45C" metalness={1} roughness={0.25} />
          </mesh>
          {/* finger stop at about four o'clock */}
          <mesh position={[0.3, 0.1, 0.28]} rotation={[0, -0.8, 0]}>
            <boxGeometry args={[0.04, 0.06, 0.16]} />
            <meshStandardMaterial color="#C9A45C" metalness={1} roughness={0.25} />
          </mesh>
        </group>

        {/* line lamp, bottom-right of the slope */}
        <group position={[0.66, 0.16, 0.86]}>
          <mesh>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial ref={lamp} color={p.lampColor} emissive={p.lampColor} emissiveIntensity={1} roughness={0.25} />
          </mesh>
          <mesh ref={halo}>
            <sphereGeometry args={[0.15, 24, 24]} />
            <meshBasicMaterial color={p.lampColor} transparent opacity={0.22} depthWrite={false} />
          </mesh>
          <mesh position={[0, -0.02, -0.03]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
            <torusGeometry args={[0.12, 0.025, 12, 32]} />
            <meshStandardMaterial color="#C9A45C" metalness={1} roughness={0.25} />
          </mesh>
        </group>

        {/* cradle prongs */}
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 0.98, -0.05]}>
            <capsuleGeometry args={[0.07, 0.14, 8, 16]} />
            <Surface kind={p.material} c={p.bodyColor} />
          </mesh>
        ))}

        {/* handset */}
        <group ref={handset} position={[0, 1.08, -0.05]}>
          <mesh geometry={grip}>
            <Surface kind={p.material} c={p.bodyColor} />
          </mesh>
          {[-0.86, 0.86].map((x) => (
            <group key={x} position={[x, -0.02, 0]}>
              <mesh>
                <cylinderGeometry args={[0.2, 0.24, 0.24, 40]} />
                <Surface kind={p.material} c={p.bodyColor} />
              </mesh>
              <mesh position={[0, 0.13, 0]}>
                <sphereGeometry args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Surface kind={p.material} c={p.bodyColor} />
              </mesh>
            </group>
          ))}
        </group>

        {/* coiled cord */}
        <mesh geometry={cord}>
          <meshPhysicalMaterial color={p.cordColor} roughness={0.4} clearcoat={0.5} />
        </mesh>
      </group>
    </IconMotion>
  );
}
