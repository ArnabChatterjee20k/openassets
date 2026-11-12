import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Brief Ticket',
  description:
    'App-store and onboarding hero for Junction: one brief is one ticket for every line. A chunky transit ticket with notched edges, three line bullets and a barcode stub. Bullets light in sequence while a scan bar sweeps the stub; hover tears the stub open a little, click punches the ticket.',
  tags: ['3d', 'hero', 'ticket', 'transit', 'brief', 'ads'],
};

export const schema = z.object({
  material: select(['enamel', 'glossy', 'clay', 'chrome'], 'Material').default('enamel'),
  ticket: color('Ticket').default('#FFF8E1'),
  stub: color('Stub').default('#FFE9A8'),
  ink: color('Ink / barcode').default('#1C2B1A'),
  line1: color('Line 1').default('#FF7A00'),
  line2: color('Line 2').default('#2BB24C'),
  line3: color('Line 3').default('#FF3D7F'),
  mood: select(['calm', 'busy'], 'Mood').default('busy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', ticket: '#FF7A00', stub: '#FFE9A8', line1: '#FFF8E1' },
  clay: { material: 'clay', ticket: '#FFE9A8', stub: '#2BB24C', ink: '#1C2B1A' },
  chrome: { material: 'chrome', ticket: '#D6DAE0', stub: '#FF7A00', ink: '#0E1A14' },
  'night line': { ticket: '#18291F', stub: '#2BB24C', ink: '#EAF2DC', line1: '#FF9F43', line2: '#B5E550' },
  calm: { mood: 'calm', material: 'glossy', ticket: '#F5F5F0', stub: '#E3000F', ink: '#0A0A0A', line1: '#E3000F', line2: '#0A0A0A', line3: '#8C8C88' },
};

type P = z.infer<typeof schema>;

function Shell({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} />;
    case 'chrome':
      return <meshStandardMaterial color={c} metalness={1} roughness={0.28} />;
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.42} metalness={0.05} clearcoat={0.8} clearcoatRoughness={0.25} />;
  }
}

// Ticket outline: rounded rect with semicircle bites at the perforation line.
const MAIN_W = 1.7;
const STUB_W = 0.72;
const TH = 1.2; // ticket height
const R = 0.14; // corner radius
const BITE = 0.13;
const DEPTH = 0.12;

function ticketShape(x0: number, x1: number, biteLeft: boolean, biteRight: boolean) {
  const s = new THREE.Shape();
  const y0 = -TH / 2;
  const y1 = TH / 2;
  s.moveTo(x0 + (biteLeft ? 0 : R), y0);
  if (biteRight) {
    s.lineTo(x1 - BITE, y0);
    s.absarc(x1, y0, BITE, Math.PI, Math.PI / 2, true);
    s.lineTo(x1, y1 - BITE);
    s.absarc(x1, y1, BITE, -Math.PI / 2, -Math.PI, true);
  } else {
    s.lineTo(x1 - R, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + R);
    s.lineTo(x1, y1 - R);
    s.quadraticCurveTo(x1, y1, x1 - R, y1);
  }
  if (biteLeft) {
    s.lineTo(x0 + BITE, y1);
    s.absarc(x0, y1, BITE, 0, -Math.PI / 2, true);
    s.lineTo(x0, y0 + BITE);
    s.absarc(x0, y0, BITE, Math.PI / 2, 0, true);
  } else {
    s.lineTo(x0 + R, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - R);
    s.lineTo(x0, y0 + R);
    s.quadraticCurveTo(x0, y0, x0 + R, y0);
  }
  return s;
}

const EXTRUDE = { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 5, curveSegments: 24 };

// Barcode bar widths (deterministic)
const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1];

export default function BriefTicket(p: P) {
  const left = -(MAIN_W + STUB_W) / 2;
  const split = left + MAIN_W;
  const mainGeo = useMemo(() => new THREE.ExtrudeGeometry(ticketShape(left, split, false, true), EXTRUDE), [left, split]);
  const stubGeo = useMemo(() => new THREE.ExtrudeGeometry(ticketShape(split, split + STUB_W, true, false), EXTRUDE), [split]);

  const bulletMats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const bullets = useRef<(THREE.Group | null)[]>([]);
  const stub = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const scanMat = useRef<THREE.MeshStandardMaterial>(null);
  const punch = useRef<THREE.Mesh>(null);
  const busy = p.mood === 'busy';
  const lines = [p.line1, p.line2, p.line3];

  // Rest (t = 0): all bullets softly lit, stub closed, scan bar parked at the left.
  useLoop((m) => {
    const press = Math.min(1, Math.abs(pressBounce(m.pressAge)) * 2.5);
    bulletMats.current.forEach((mat, i) => {
      if (!mat) return;
      const step = busy ? blink(m.t, 0.2 + i * 0.12, 0.06) : blink(m.t, 0.3 + i * 0.2, 0.08) * 0.6;
      mat.emissiveIntensity = 0.3 + step * 0.9 + m.hover * 0.4 + press * 0.8;
      const g = bullets.current[i];
      if (g) g.scale.setScalar(1 + step * 0.28 + press * 0.15);
    });
    // The scanner passes over the barcode twice per loop (busy) or once (calm).
    const u = cycle(m.t, busy ? 2 : 1);
    const sweep = u < 0.5 ? Math.sin(u * Math.PI * 2) : 0;
    if (scan.current) scan.current.position.y = -TH * 0.36 + (u < 0.5 ? u * 2 : 0) * TH * 0.72;
    if (scanMat.current) scanMat.current.opacity = sweep;
    // Hover tears the stub open along the perforation; the tear also breathes a touch.
    if (stub.current) stub.current.rotation.y = -(m.hover * 0.38 + Math.max(0, wave(m.t, 1, 0.75)) * 0.04 * (busy ? 1 : 0));
    if (punch.current) punch.current.scale.setScalar(1 + press * 0.6);
  });

  return (
    <IconMotion seed={23} sway={0.07}>
      <group rotation={[0.18, -0.38, 0.12]} scale={1.34} position={[0, 0.05, 0]}>
        {/* Main ticket */}
        <mesh geometry={mainGeo} position={[0, 0, -DEPTH / 2]}>
          <Shell kind={p.material} c={p.ticket} />
        </mesh>
        {/* Ink sign band across the top of the main ticket */}
        <RoundedBox args={[MAIN_W - 0.22, 0.3, 0.03]} radius={0.012} smoothness={3} position={[left + MAIN_W / 2 + 0.01, TH / 2 - 0.27, DEPTH / 2 + 0.06]}>
          <meshPhysicalMaterial color={p.ink} roughness={0.35} clearcoat={0.6} />
        </RoundedBox>
        {/* Three line stripes inside the band */}
        {lines.map((c, i) => (
          <RoundedBox key={`s${i}`} args={[0.32, 0.07, 0.02]} radius={0.01} smoothness={2} position={[left + 0.33 + i * 0.36, TH / 2 - 0.27, DEPTH / 2 + 0.085]}>
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.25} />
          </RoundedBox>
        ))}
        {/* Route: a thick line joining three line bullets */}
        <RoundedBox args={[1.08, 0.075, 0.03]} radius={0.015} smoothness={2} position={[left + MAIN_W / 2 + 0.02, -0.1, DEPTH / 2 + 0.06]}>
          <meshPhysicalMaterial color={p.ink} roughness={0.4} />
        </RoundedBox>
        {lines.map((c, i) => (
          <group key={`b${i}`} ref={(el) => void (bullets.current[i] = el)} position={[left + 0.36 + i * 0.52, -0.1, DEPTH / 2 + 0.07]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.17, 0.17, 0.07, 40]} />
              <meshPhysicalMaterial ref={(el) => void (bulletMats.current[i] = el)} color={c} emissive={c} emissiveIntensity={0.3} roughness={0.2} clearcoat={1} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.03]}>
              <cylinderGeometry args={[0.07, 0.07, 0.03, 28]} />
              <meshPhysicalMaterial color="#FFF8E1" roughness={0.3} clearcoat={1} />
            </mesh>
          </group>
        ))}
        {/* Punched hole marker (a pop dot in the bottom corner) */}
        <mesh ref={punch} position={[left + 0.24, -TH / 2 + 0.2, DEPTH / 2 + 0.06]}>
          <torusGeometry args={[0.06, 0.022, 12, 32]} />
          <meshStandardMaterial color={p.line3} emissive={p.line3} emissiveIntensity={0.5} roughness={0.4} />
        </mesh>
        {/* Perforation dots */}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={`pf${i}`} position={[split, -TH / 2 + 0.24 + i * 0.12, DEPTH / 2 + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.02, 12]} />
            <meshStandardMaterial color={p.ink} roughness={0.6} />
          </mesh>
        ))}
        {/* Stub: hinged at the perforation so it can tear open */}
        <group ref={stub} position={[split, 0, 0]}>
          <mesh geometry={stubGeo} position={[-split, 0, -DEPTH / 2]}>
            <Shell kind={p.material} c={p.stub} />
          </mesh>
          {/* Vertical barcode */}
          {(() => {
            let y = -TH * 0.36;
            return BARS.map((w, i) => {
              const h = w * 0.016;
              const el = (
                <mesh key={`bar${i}`} position={[STUB_W / 2 + 0.03, y + h / 2, DEPTH / 2 + 0.055]}>
                  <boxGeometry args={[STUB_W * 0.5, h, 0.012]} />
                  <meshStandardMaterial color={p.ink} roughness={0.6} />
                </mesh>
              );
              y += h + 0.03;
              return el;
            });
          })()}
          {/* Scan bar */}
          <mesh ref={scan} position={[STUB_W / 2 + 0.03, -TH * 0.36, DEPTH / 2 + 0.075]}>
            <boxGeometry args={[STUB_W * 0.78, 0.06, 0.02]} />
            <meshStandardMaterial ref={scanMat} color={p.line3} emissive={p.line3} emissiveIntensity={3} transparent opacity={0} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
