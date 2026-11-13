import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Pike Tip-Up',
  description:
    "Pike's hero object: an ice-fishing tip-up over a drilled hole with its orange flag sprung, the sign that something bit. The flag flutters, the spool spins and the water ripples; hover makes it tug, a click snaps the flag down and springs it back up.",
  tags: ['3d', 'hero', 'ad agent', 'flag', 'conversion', 'ice fishing'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass'], 'Material').default('glossy'),
  body: color('Tip-up body').default('#F2F5F7'),
  flag: color('Flag').default('#E4572E'),
  ice: color('Ice').default('#A7C4D4'),
  water: color('Water').default('#17242E'),
  mood: select(['calm', 'biting'], 'Mood').default('biting'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', body: '#E9EEF1', ice: '#D3DDE3', water: '#2F6F8F' },
  metal: { material: 'metal', body: '#D5DAE3', ice: '#8FB3C7' },
  glass: { material: 'glass', body: '#DDEBF2', ice: '#C9DCE6', water: '#2F6F8F' },
  'polar-night': { body: '#F3EDE2', flag: '#C6FF00', ice: '#4F7F99', water: '#021B26' },
  calm: { mood: 'calm', material: 'clay', flag: '#2F6F8F' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.6} ior={1.4} iridescence={0.3} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
  }
}

const ICE_TOP = -0.62;
const HOLE = 0.42;

export default function PikeTipUp(p: P) {
  const biting = p.mood === 'biting';

  // Ice slab: a bevelled disc with the drilled hole cut through it.
  const iceGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, 1.0, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, HOLE, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.06, bevelSegments: 5, curveSegments: 64 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  // Pennant: a triangle, extruded thin with a soft bevel.
  const flagGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.24);
    s.lineTo(0.8, 0.02);
    s.lineTo(0, -0.2);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.015, bevelSegments: 3 });
    g.translate(0, 0, -0.015);
    return g;
  }, []);

  const staff = useRef<THREE.Group>(null);
  const flag = useRef<THREE.Group>(null);
  const spool = useRef<THREE.Group>(null);
  const ripples = useRef<(THREE.Mesh | null)[]>([]);
  const lineRef = useRef<THREE.Mesh>(null);
  const flagMat = useRef<THREE.MeshPhysicalMaterial>(null);

  // Rest pose: flag sprung upright. Loop: flutter, spool turns, water ripples,
  // the line twitches like a fish tugging. Click: the staff snaps down and
  // springs back up; hover makes everything tug harder.
  useLoop((m) => {
    const energy = (biting ? 1 : 0.4) + m.hover * 0.8;
    const press = pressBounce(m.pressAge);
    const tug = blink(m.t, 0.3, 0.05) + blink(m.t, 0.72, 0.04) * 0.7;
    if (staff.current) staff.current.rotation.z = wave(m.t, 2) * 0.09 * energy + press * 0.9 - tug * 0.08 * energy;
    if (flag.current) {
      flag.current.rotation.y = wave(m.t, biting ? 4 : 2) * 0.5 * energy;
      flag.current.rotation.x = wave(m.t, 4, 0.3) * 0.1 * energy;
    }
    if (flagMat.current) flagMat.current.emissiveIntensity = 0.15 + tug * 0.5 + Math.abs(press) * 1.2 + m.hover * 0.2;
    if (spool.current) spool.current.rotation.x = -cycle(m.t, biting ? 2 : 1) * Math.PI * 2;
    if (lineRef.current) lineRef.current.position.x = tug * 0.03 * energy;
    ripples.current.forEach((r, i) => {
      if (!r) return;
      const u = cycle(m.t, 2, i * 0.5);
      r.scale.setScalar(0.15 + u * 0.95);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.6 * (0.5 + energy * 0.5);
    });
  });

  return (
    <IconMotion seed={41} float={0.05} sway={0.07}>
      <group rotation={[0.12, -0.5, 0]} position={[0, -0.02, 0]}>
        {/* Ice slab with the drilled hole */}
        <mesh geometry={iceGeo} position={[0, ICE_TOP - 0.18, 0]} receiveShadow castShadow>
          <meshPhysicalMaterial color={p.ice} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} transmission={0.25} thickness={0.6} ior={1.31} />
        </mesh>
        {/* Water in the hole */}
        <mesh position={[0, ICE_TOP - 0.1, 0]}>
          <cylinderGeometry args={[HOLE + 0.01, HOLE + 0.01, 0.04, 48]} />
          <meshPhysicalMaterial color={p.water} roughness={0.05} clearcoat={1} />
        </mesh>
        {[0, 1].map((i) => (
          <mesh key={i} ref={(el) => void (ripples.current[i] = el)} position={[0, ICE_TOP - 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.32, 0.35, 48]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        ))}
        {/* Slush rim pushed up by the auger */}
        <mesh position={[0, ICE_TOP, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.55]}>
          <torusGeometry args={[HOLE + 0.07, 0.07, 16, 64]} />
          <meshPhysicalMaterial color="#F7FAFC" roughness={0.45} sheen={0.5} sheenColor="#ffffff" />
        </mesh>
        {[
          [0.62, 0.36, 0.08],
          [-0.56, 0.5, 0.07],
          [0.3, -0.66, 0.06],
          [-0.72, -0.3, 0.07],
        ].map(([x, zz, s], i) => (
          <mesh key={i} position={[x, ICE_TOP + s * 0.4, zz]} rotation={[i, i * 2, 0]} scale={s}>
            <icosahedronGeometry args={[1, 0]} />
            <meshPhysicalMaterial color="#F7FAFC" roughness={0.35} clearcoat={0.6} />
          </mesh>
        ))}

        {/* Cross frame resting on the ice */}
        <RoundedBox args={[1.7, 0.11, 0.13]} radius={0.04} smoothness={4} position={[0, ICE_TOP + 0.08, 0]} castShadow>
          <Surface kind={p.material} c={p.body} />
        </RoundedBox>
        <RoundedBox args={[0.13, 0.11, 1.7]} radius={0.04} smoothness={4} position={[0, ICE_TOP + 0.19, 0]} castShadow>
          <Surface kind={p.material} c={p.body} />
        </RoundedBox>
        {/* Post */}
        <mesh position={[0, ICE_TOP + 0.47, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.07, 0.5, 24]} />
          <Surface kind={p.material} c={p.body} />
        </mesh>
        {/* Line dropping into the hole */}
        <mesh ref={lineRef} position={[0, ICE_TOP + 0.05, 0.16]}>
          <cylinderGeometry args={[0.008, 0.008, 0.5, 6]} />
          <meshStandardMaterial color={p.water} />
        </mesh>
        {/* Spool on the post */}
        <group ref={spool} position={[0, ICE_TOP + 0.38, 0.12]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.05, 32]} />
            <Surface kind={p.material} c={p.body} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.14, 24]} />
            <meshStandardMaterial color={p.water} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 0.08, 8]} />
            <meshStandardMaterial color="#C9D2D9" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>

        {/* Spring staff + flag, pivoting at the post top */}
        <group ref={staff} position={[0, ICE_TOP + 0.72, 0]}>
          <mesh position={[0, 0.62, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.032, 1.24, 12]} />
            <meshStandardMaterial color="#C9D2D9" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.075, 24, 24]} />
            <Surface kind={p.material} c={p.body} />
          </mesh>
          <group ref={flag} position={[0, 0.98, 0]}>
            <mesh geometry={flagGeo} castShadow>
              <meshPhysicalMaterial ref={flagMat} color={p.flag} roughness={0.35} clearcoat={0.8} emissive={p.flag} emissiveIntensity={0.15} />
            </mesh>
          </group>
          <mesh position={[0, 1.25, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color="#C9D2D9" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
