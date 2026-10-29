import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, num, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, pressBounce, useLoop, wave, blink } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Daily Page Stack',
  description:
    "openfeed's landing hero: today's page on a soft stack of past days, in front of a 70s sunrise-stripe arch. The page peeks like a tear-off calendar, the ribbon sways and the stripes pulse; hover lifts the page, click flips it.",
  tags: ['reading', 'feed', 'archive', 'hero', '3d', 'openfeed'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  paper: color('Paper').default('#F7F4E8'),
  header: color('Page header').default('#6A8D3A'),
  ink: color('Text lines').default('#1E2A1A'),
  stripeOuter: color('Outer stripe').default('#E85D3F'),
  stripeMid: color('Middle stripe').default('#C9A227'),
  stripeInner: color('Inner stripe').default('#6A8D3A'),
  ribbon: color('Ribbon').default('#E85D3F'),
  pages: num(2, 6, 1, 'Pages in stack').default(4),
  mood: select(['calm', 'lively'], 'Mood').default('calm'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', header: '#C8553D', stripeOuter: '#C8553D', stripeMid: '#F2A541', stripeInner: '#4F6D58', ribbon: '#4F6D58', paper: '#F1E4D3' },
  'mid-century': { stripeOuter: '#D96C3D', stripeMid: '#E9B44C', stripeInner: '#2C7873', header: '#2C7873', ribbon: '#D96C3D', paper: '#F4E9D8', ink: '#2E2A24', mood: 'lively' },
  metal: { material: 'metal', stripeOuter: '#D9A86C', stripeMid: '#E8D9B5', stripeInner: '#C9A45C', header: '#1C1C20', ribbon: '#C9A45C', paper: '#ECE7DC' },
  glass: { material: 'glass', paper: '#E3EEF2', header: '#2F6F8F', stripeOuter: '#E4572E', stripeMid: '#A7C4D4', stripeInner: '#2F6F8F', ribbon: '#E4572E', ink: '#17242E' },
  lively: { mood: 'lively', pages: 6 },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c, soft = false }: { kind: string; c: string; soft?: boolean }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />;
    case 'metal':
      // Paper stays matte so the page still reads; the arch goes metallic.
      return soft ? <meshPhysicalMaterial color={c} roughness={0.6} sheen={0.3} sheenColor="#ffffff" /> : <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.15} />;
    case 'glass':
      return soft ? (
        <meshPhysicalMaterial color={c} roughness={0.2} transmission={0.45} thickness={0.2} ior={1.3} clearcoat={1} />
      ) : (
        <meshPhysicalMaterial color={c} roughness={0.1} transmission={0.75} thickness={0.8} ior={1.4} attenuationColor={c} attenuationDistance={0.8} />
      );
    default:
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

const PW = 1.6; // page width
const PH = 2.0; // page height
const PT = 0.06; // page thickness

/** A flat rounded "ink" bar printed on the page face. */
function Bar({ x, y, w, h, c, z = PT / 2 + 0.006 }: { x: number; y: number; w: number; h: number; c: string; z?: number }) {
  return (
    <RoundedBox args={[w, h, 0.016]} radius={Math.min(h, 0.016) / 2.01} smoothness={3} position={[x - (PW - w) / 2 + 0.17, y, z]}>
      <meshStandardMaterial color={c} roughness={0.8} />
    </RoundedBox>
  );
}

/** One 70s stripe: a half-torus arch with straight legs down to the base. */
function Stripe({ r, tube, legTo, c, kind, refCb }: { r: number; tube: number; legTo: number; c: string; kind: string; refCb: (g: THREE.Group | null) => void }) {
  return (
    <group ref={refCb}>
      <mesh>
        <torusGeometry args={[r, tube, 32, 96, Math.PI]} />
        <Surface kind={kind} c={c} />
      </mesh>
      {[-r, r].map((x) => (
        <group key={x}>
          <mesh position={[x, legTo / 2, 0]}>
            <cylinderGeometry args={[tube, tube, Math.abs(legTo), 32]} />
            <Surface kind={kind} c={c} />
          </mesh>
          <mesh position={[x, legTo, 0]}>
            <sphereGeometry args={[tube, 32, 16]} />
            <Surface kind={kind} c={c} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function DailyPageStack(p: P) {
  const lively = p.mood === 'lively';
  const top = useRef<THREE.Group>(null);
  const ribbon = useRef<THREE.Group>(null);
  const stripes = useRef<(THREE.Group | null)[]>([]);

  const ribbonGeo = useMemo(() => {
    const w = 0.24;
    const l = 0.78;
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(w / 2, -l);
    s.lineTo(0, -l + 0.1);
    s.lineTo(-w / 2, -l);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 3 });
  }, []);

  // Micro-interactions: today's page peeks like a tear-off calendar, the
  // ribbon sways, the stripes swell in sequence like a sunrise. Hover lifts
  // the page; a click flips it up and pops the arch.
  useLoop((m) => {
    const energy = (lively ? 1 : 0.55) + m.hover * 0.6;
    const age = m.pressAge;
    const flip = Number.isFinite(age) && age < 1.6 ? Math.pow(Math.sin(Math.PI * Math.min(1, age / 1.6)), 0.7) : 0;
    const pb = Math.abs(pressBounce(age));
    if (top.current) {
      const peek = (0.5 - 0.5 * wave(m.t, lively ? 2 : 1, 0.25)) * 0.42 * energy;
      top.current.rotation.x = -(0.05 + peek + m.hover * 0.22 + flip * 1.25);
    }
    if (ribbon.current) ribbon.current.rotation.z = wave(m.t, 2) * 0.28 * energy + pb * 0.3;
    stripes.current.forEach((g, i) => {
      if (!g) return;
      const swell = Math.max(0, wave(m.t, lively ? 2 : 1, -i * 0.1)) * 0.035 * energy + blink(m.t, 0.5 + i * 0.04, 0.05) * 0.03;
      const s = 1 + swell + pb * 0.12;
      g.scale.set(s, s, 1);
    });
  });

  const back = Math.max(1, p.pages - 1);
  const lines = '#9DAA8C';

  return (
    <IconMotion seed={30} sway={0.06}>
      <group scale={0.74} position={[0, 0.05, 0]}>
        {/* Sunrise-stripe arch behind the stack */}
        <group position={[0, -0.25, -0.62]}>
          {[p.stripeInner, p.stripeMid, p.stripeOuter].map((c, i) => (
            <Stripe key={i} r={1.16 + i * 0.3} tube={0.14} legTo={-1.05} c={c} kind={p.material} refCb={(g) => void (stripes.current[i] = g)} />
          ))}
        </group>

        {/* Past days: fanned slightly behind today's page */}
        {Array.from({ length: back }, (_, k) => {
          const i = back - k; // draw farthest first
          const tone = new THREE.Color(p.paper).lerp(new THREE.Color(p.header), 0.06 * i).getStyle();
          return (
            <RoundedBox
              key={i}
              args={[PW, PH, PT]}
              radius={0.05}
              smoothness={4}
              position={[i * 0.035 * (i % 2 ? 1 : -1), -i * 0.03, -i * 0.1]}
              rotation={[0, 0, (i % 2 ? -1 : 1) * 0.035 * i]}
            >
              <Surface kind={p.material} c={tone} soft />
            </RoundedBox>
          );
        })}

        {/* Ribbon bookmark hanging out of the stack */}
        <group ref={ribbon} position={[0.46, -PH / 2 + 0.1, -0.055]}>
          <mesh geometry={ribbonGeo}>
            <meshPhysicalMaterial color={p.ribbon} roughness={0.45} sheen={0.6} sheenColor="#ffffff" clearcoat={0.3} />
          </mesh>
        </group>

        {/* Today's page, hinged at its top edge */}
        <group position={[0, PH / 2, 0.02]}>
          <group ref={top}>
            <group position={[0, -PH / 2, 0]}>
              <RoundedBox args={[PW, PH, PT]} radius={0.05} smoothness={4}>
                <Surface kind={p.material} c={p.paper} soft />
              </RoundedBox>
              {/* Day tab on the top edge */}
              <RoundedBox args={[0.5, 0.34, PT * 1.2]} radius={0.08} smoothness={4} position={[-0.46, PH / 2 + 0.1, 0.01]}>
                <meshPhysicalMaterial color={p.header} roughness={0.5} clearcoat={0.4} />
              </RoundedBox>
              {/* Header band + persimmon "today" dot */}
              <Bar x={0} y={0.7} w={PW - 0.34} h={0.3} c={p.header} />
              <mesh position={[PW / 2 - 0.36, 0.7, PT / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.065, 0.065, 0.02, 32]} />
                <meshStandardMaterial color={p.ribbon} roughness={0.5} />
              </mesh>
              {/* Headline + body copy */}
              <Bar x={0} y={0.36} w={1.12} h={0.09} c={p.ink} />
              <Bar x={0} y={0.21} w={0.78} h={0.09} c={p.ink} />
              {[0.02, -0.1, -0.22, -0.34].map((y, i) => (
                <Bar key={y} x={0} y={y} w={[1.26, 1.18, 1.26, 0.86][i]} h={0.045} c={lines} />
              ))}
              {/* A kept article: thumbnail + two lines */}
              <Bar x={0} y={-0.64} w={0.42} h={0.34} c={p.stripeMid} />
              <Bar x={0.54} y={-0.56} w={0.66} h={0.06} c={p.ink} />
              <Bar x={0.54} y={-0.7} w={0.5} h={0.045} c={lines} />
            </group>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
