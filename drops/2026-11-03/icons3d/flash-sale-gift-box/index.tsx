import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Flash Sale Gift Box',
  description:
    'Landing-page hero for a flash sale: a chunky candy gift box with a ribbon cross, puffy bow and a notched "%" tag. The lid peeks open and light leaks out, the tag swings; hover lifts the lid, a click pops it off with a spin and a burst of sparkles.',
  tags: ['e-commerce', 'gift', 'sale', 'box', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  boxColor: color('Box').default('#FF8EC0'),
  ribbonColor: color('Ribbon').default('#8A7BFF'),
  tagColor: color('Tag').default('#FDF3F8'),
  markColor: color('Tag mark').default('#3A1F4A'),
  glowColor: color('Light inside').default('#4FD1C5'),
  mood: select(['calm', 'lively'], 'Mood').default('lively'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', boxColor: '#8A7BFF', ribbonColor: '#FF7EB6', tagColor: '#FDF3F8', glowColor: '#FFE16B' },
  chrome: { material: 'metal', boxColor: '#C9CED8', ribbonColor: '#FF3DB4', tagColor: '#3A1F4A', markColor: '#FDF3F8', glowColor: '#3D5AFE' },
  glass: { material: 'glass', boxColor: '#FF9CCB', ribbonColor: '#8A7BFF', glowColor: '#FF7EB6', mood: 'calm' },
  'night drop': { material: 'glossy', boxColor: '#2B0A4A', ribbonColor: '#FF2E88', tagColor: '#FFD600', markColor: '#24003D', glowColor: '#B026FF' },
  sorbet: { boxColor: '#FFB627', ribbonColor: '#FF4F6D', tagColor: '#FFEDE1', markColor: '#3D0E2A', glowColor: '#7B2CBF', mood: 'calm' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.15} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} emissive={c} emissiveIntensity={0.18} roughness={0.06} transparent opacity={0.72} clearcoat={1} clearcoatRoughness={0.04} iridescence={0.6} depthWrite={false} />;
    default:
      // Clay: matte candy with a soft sheen so the edges catch light.
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.45} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

/** Ribbon reads best a touch glossier than the box, whatever the box material. */
function Ribbon({ kind, c }: { kind: string; c: string }) {
  if (kind === 'metal') return <meshStandardMaterial color={c} roughness={0.25} metalness={0.9} />;
  return <meshPhysicalMaterial color={c} roughness={kind === 'clay' ? 0.45 : 0.18} clearcoat={0.8} clearcoatRoughness={0.1} sheen={0.3} sheenColor="#ffffff" />;
}

// Box proportions (world units).
const BW = 1.56; // body width / depth
const BH = 1.06; // body height
const BY = -0.42; // body centre
const LW = 1.72; // lid width / depth
const LH = 0.32; // lid height
const RB = 0.3; // ribbon band width
const TOP = BY + BH / 2; // top of the body

/** Notched price tag with a punched hole, extruded with a soft bevel. */
function tagGeometry() {
  const w = 0.52;
  const h = 0.74;
  const n = 0.2; // notch depth at the top
  const r = 0.06;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - n);
  s.lineTo(0.05, h / 2 - 0.01);
  s.quadraticCurveTo(0, h / 2 + 0.02, -0.05, h / 2 - 0.01);
  s.lineTo(-w / 2, h / 2 - n);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const hole = new THREE.Path();
  hole.absarc(0, h / 2 - 0.13, 0.055, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.022, bevelSegments: 4, curveSegments: 24 });
  g.translate(0, -h / 2 + 0.13, -0.025); // pivot at the hole
  return g;
}

/** One bow loop: a flattened torus tilted outward. */
function Loop({ side, kind, c }: { side: 1 | -1; kind: string; c: string }) {
  return (
    <mesh position={[side * 0.3, 0.13, 0]} rotation={[0.25, side * 0.3, side * -0.78]} scale={[1.35, 0.85, 0.42]} castShadow>
      <torusGeometry args={[0.22, 0.07, 24, 64]} />
      <Ribbon kind={kind} c={c} />
    </mesh>
  );
}

const SPARKS = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2 + 0.4;
  return { x: Math.cos(a) * 0.7, z: Math.sin(a) * 0.45, h: 0.5 + (i % 3) * 0.22, s: 0.06 + (i % 2) * 0.03 };
});

export default function FlashSaleGiftBox(p: P) {
  const tagGeo = useMemo(tagGeometry, []);
  const lively = p.mood === 'lively';

  const lid = useRef<THREE.Group>(null);
  const lidSpin = useRef<THREE.Group>(null);
  const bow = useRef<THREE.Group>(null);
  const tag = useRef<THREE.Group>(null);
  const leak = useRef<THREE.Mesh>(null);
  const sparks = useRef<(THREE.Mesh | null)[]>([]);

  // Micro-interactions: the lid peeks open (light leaks out), the bow breathes,
  // the tag swings. Hover lifts the lid; a click pops it off with a spin + sparkles.
  useLoop((m) => {
    const energy = (lively ? 1 : 0.55) + m.hover * 0.5;
    const peek = blink(m.t, 0.55, 0.11) * energy + (lively ? blink(m.t, 0.2, 0.05) * 0.35 : 0);
    const age = m.pressAge;
    const pop = Number.isFinite(age) && age < 1 ? Math.sin(Math.PI * Math.min(1, age / 0.9)) : 0;
    const spinT = Number.isFinite(age) && age < 0.9 ? 1 - Math.pow(1 - age / 0.9, 3) : 0;
    const open = Math.max(peek * 0.26 + m.hover * 0.2, pop * 0.25);
    if (lid.current) {
      lid.current.rotation.x = -open; // hinge at the back edge
      lid.current.position.y = TOP + m.hover * 0.05 + pop * 0.55;
    }
    if (lidSpin.current) lidSpin.current.rotation.y = spinT * Math.PI * 2;
    if (bow.current) {
      const b = 1 + wave(m.t, 2) * 0.04 * energy;
      bow.current.scale.set(b, 1 + wave(m.t, 2, 0.5) * 0.05 * energy, b);
    }
    if (tag.current) {
      tag.current.rotation.z = wave(m.t, 2, 0.1) * 0.16 * energy + pop * 0.5;
      tag.current.rotation.y = wave(m.t, 1, 0.3) * 0.25 * energy;
    }
    const glow = Math.min(1, open * 3.2 + pop);
    if (leak.current) {
      const mat = leak.current.material as THREE.MeshBasicMaterial;
      mat.opacity = glow * 0.45;
      leak.current.scale.set(1, 0.4 + glow * 1.2, 1);
    }
    sparks.current.forEach((s, i) => {
      if (!s) return;
      const sp = SPARKS[i];
      // Idle: a few sparkles drift up out of the gap while it's open. Click: all burst out.
      const u = cycle(m.t, 2, i / SPARKS.length);
      const idle = glow * Math.sin(Math.PI * u) * (lively ? 1 : 0.5);
      const burst = Number.isFinite(age) && age < 1.2 ? Math.sin(Math.PI * (age / 1.2)) : 0;
      const k = Math.max(idle, burst);
      const rise = burst > idle ? age / 1.2 : u;
      s.position.set(sp.x * (0.5 + rise * 0.8), TOP + 0.15 + rise * sp.h * 1.6, sp.z * (0.5 + rise * 0.8));
      s.scale.setScalar(Math.max(0.001, k * sp.s * 10));
      s.rotation.set(m.t * 2 + i, m.t * 3 + i, 0);
    });
  });

  return (
    <IconMotion seed={23}>
      <group position={[0, -0.05, 0]} rotation={[0, -0.18, 0]}>
        {/* Body + ribbon cross */}
        <RoundedBox args={[BW, BH, BW]} radius={0.12} smoothness={6} position={[0, BY, 0]} castShadow receiveShadow>
          <Surface kind={p.material} c={p.boxColor} />
        </RoundedBox>
        <RoundedBox args={[RB, BH + 0.01, BW + 0.04]} radius={0.04} smoothness={4} position={[0, BY, 0]}>
          <Ribbon kind={p.material} c={p.ribbonColor} />
        </RoundedBox>
        <RoundedBox args={[BW + 0.04, BH + 0.01, RB]} radius={0.04} smoothness={4} position={[0, BY, 0]}>
          <Ribbon kind={p.material} c={p.ribbonColor} />
        </RoundedBox>

        {/* Light leaking out of the gap when the lid lifts */}
        <mesh ref={leak} position={[0, TOP + 0.02, 0]}>
          <cylinderGeometry args={[0.7, 0.62, 0.14, 48, 1, true]} />
          <meshBasicMaterial color={p.glowColor} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh position={[0, TOP - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[BW - 0.2, BW - 0.2]} />
          <meshBasicMaterial color={p.glowColor} toneMapped={false} />
        </mesh>

        {/* Lid: hinged at the back edge; the spin group turns it on a click */}
        <group ref={lid} position={[0, TOP, -LW / 2]}>
          <group position={[0, 0, LW / 2]}>
            <group ref={lidSpin}>
              <RoundedBox args={[LW, LH, LW]} radius={0.1} smoothness={6} position={[0, LH / 2 - 0.04, 0]} castShadow>
                <Surface kind={p.material} c={p.boxColor} />
              </RoundedBox>
              <RoundedBox args={[RB, LH + 0.02, LW + 0.03]} radius={0.04} smoothness={4} position={[0, LH / 2 - 0.04, 0]}>
                <Ribbon kind={p.material} c={p.ribbonColor} />
              </RoundedBox>
              <RoundedBox args={[LW + 0.03, LH + 0.02, RB]} radius={0.04} smoothness={4} position={[0, LH / 2 - 0.04, 0]}>
                <Ribbon kind={p.material} c={p.ribbonColor} />
              </RoundedBox>

              {/* Bow: two loops, a knot and two tails */}
              <group ref={bow} position={[0, LH - 0.02, 0]}>
                <Loop side={1} kind={p.material} c={p.ribbonColor} />
                <Loop side={-1} kind={p.material} c={p.ribbonColor} />
                <mesh position={[0, 0.1, 0.02]} scale={[1, 0.85, 0.9]} castShadow>
                  <sphereGeometry args={[0.13, 32, 32]} />
                  <Ribbon kind={p.material} c={p.ribbonColor} />
                </mesh>
                {[1, -1].map((s) => (
                  <mesh key={s} position={[s * 0.16, 0.0, 0.2]} rotation={[0.5, 0, s * 0.5]}>
                    <boxGeometry args={[0.14, 0.03, 0.34]} />
                    <Ribbon kind={p.material} c={p.ribbonColor} />
                  </mesh>
                ))}

              </group>

              {/* Notched "%" tag hanging off the lid's front edge, in front of the body */}
              <mesh position={[0.5, 0.02, LW / 2 + 0.015]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.05, 0.014, 10, 24]} />
                <meshStandardMaterial color={p.markColor} roughness={0.6} />
              </mesh>
              <group ref={tag} position={[0.5, -0.02, LW / 2 + 0.06]}>
                <group rotation={[-0.08, 0, 0.1]} scale={1.08}>
                    <mesh geometry={tagGeo} castShadow>
                      <meshPhysicalMaterial color={p.tagColor} roughness={0.5} clearcoat={0.5} sheen={0.3} sheenColor="#ffffff" />
                    </mesh>
                    {/* "%" mark: two rings and a slash, raised off the face */}
                    <group position={[0, -0.3, 0.05]} scale={0.95}>
                      <mesh position={[-0.09, 0.09, 0]}>
                        <torusGeometry args={[0.045, 0.018, 12, 32]} />
                        <meshStandardMaterial color={p.markColor} roughness={0.5} />
                      </mesh>
                      <mesh position={[0.09, -0.09, 0]}>
                        <torusGeometry args={[0.045, 0.018, 12, 32]} />
                        <meshStandardMaterial color={p.markColor} roughness={0.5} />
                      </mesh>
                      <mesh rotation={[0, 0, -0.78]}>
                        <boxGeometry args={[0.035, 0.32, 0.03]} />
                        <meshStandardMaterial color={p.markColor} roughness={0.5} />
                      </mesh>
                    </group>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* Sparkles (octahedra) that rise out of the box */}
        {SPARKS.map((_, i) => (
          <mesh key={i} ref={(el) => void (sparks.current[i] = el)} scale={0.001}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color={i % 2 ? p.glowColor : '#ffffff'} emissive={i % 2 ? p.glowColor : '#ffffff'} emissiveIntensity={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
