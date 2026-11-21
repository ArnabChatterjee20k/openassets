import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Creative Factory',
  description:
    'Feature hero for Multiball’s AI creative engine: an isometric arcade-style machine. Product photos drop into the hopper, the gumball “brain” tumbles, a press stamps blank cards into finished square, story and banner ads, and a conveyor feeds them into a dispatch tower whose ports light up for each platform. Once per loop the press stamps a gold WINNER star and confetti pops.',
  tags: ['hero', 'isometric', 'machine', 'ai', 'creatives', 'memphis', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.25 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  title: text('Machine title').default('MULTIBALL AI'),
  counter: text('Counter label').default('ADS'),
  winner: text('Winner callout').default('WINNER!'),
  neon: text('Wall neon').default('NOW PRINTING'),
  p1: text('Platform 1').default('META'),
  p2: text('Platform 2').default('TIKTOK'),
  p3: text('Platform 3').default('GOOGLE'),
  wall: color('Wall').default('#FFF6E9'),
  floor: color('Floor').default('#FFE3D3'),
  cabinet: color('Machine').default('#FF6F91'),
  accent2: color('Second color').default('#00B3A4'),
  pop: color('Pop').default('#FFC93C'),
  ink: color('Ink').default('#1A1A2E'),
  glow: color('Neon').default('#FF6F91'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'after-hours': { wall: '#1E0B33', floor: '#2C1450', cabinet: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', ink: '#0B0414', glow: '#FF2E88' },
  riso: { wall: '#F4EFE6', floor: '#EAE2D3', cabinet: '#0078BF', accent2: '#FF48B0', pop: '#FFE800', ink: '#1F2A6B', glow: '#FF48B0', neon: 'FRESH ADS' },
  citrus: { wall: '#FFF8E1', floor: '#FFE9A8', cabinet: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', ink: '#1C2B1A', glow: '#2BB24C', p1: 'AMAZON', p2: 'SNAP', p3: 'REDDIT' },
  mint: { wall: '#E9F6F2', floor: '#CDEDE4', cabinet: '#00B3A4', accent2: '#FF6F91', pop: '#FFC93C', glow: '#00B3A4', neon: 'AUTOPILOT ON' },
};

type P = z.infer<typeof schema>;

const U = 52;
const LOOP = scene.loop;
const OX = 500;
const OY = 364;
const K = U / 46; // face art was laid out at 46 px per unit
const WX = -3; // left wall plane
const WY = -1.5; // back wall plane
const C30 = Math.cos(Math.PI / 6);

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const f = (n: number) => n.toFixed(1);
const leftFace = (p: P3) => {
  const [x, y] = S(p);
  return `matrix(${C30} 0.5 0 1 ${f(x)} ${f(y)})`; // local +a → world +x (faces at y = const)
};
const rightFace = (p: P3) => {
  const [x, y] = S(p);
  return `matrix(${-C30} 0.5 0 1 ${f(x)} ${f(y)})`; // local +a → world +y (faces at x = const)
};

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

// Conveyor: cards ride along y = BY on the belt top (z = BZ) from x0 to x1 in CARD_DUR.
const BY = 4.3;
const BZ = 1.6;
const X0 = 3.9;
const X1 = 11.6;
const CARD_DUR = 3; // one card leaves the machine every second (3 slots)
const PRESS_X = 6;
const FP = (PRESS_X - X0) / (X1 - X0); // path fraction at the press
const TOWER_X = 11.2;
const FT = (TOWER_X - X0) / (X1 - X0); // path fraction entering the tower
// The winner: slot 0 reaches the press on its second pass.
const M = (CARD_DUR + FP * CARD_DUR) / LOOP;

/** One-shot pulse (0 → 1 → 0) at loop fraction t. */
function pulse(t: number, w = 0.06) {
  const a = Math.max(0.001, t - 0.002);
  const b = Math.min(0.998, t + w);
  return { keyTimes: `0;${a.toFixed(4)};${Math.min(b - 0.001, t + 0.005).toFixed(4)};${b.toFixed(4)};1`, values: '0;0;1;0;0' };
}

function gearPath(r: number, teeth: number) {
  const out: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.78;
    out.push(`${f(Math.cos(a0) * rr)},${f(Math.sin(a0) * rr)}`, `${f(Math.cos(a1) * rr)},${f(Math.sin(a1) * rr)}`);
  }
  return `M${out.join(' L')} Z`;
}

const SHAPES = [
  { w: 1.0, h: 1.0 }, // square feed post
  { w: 0.62, h: 1.1 }, // story
  { w: 1.4, h: 0.56 }, // banner
];

export default function CreativeFactory(p: P) {
  const night = isDark(p.wall);
  const INK = night ? 'rgba(4,2,10,0.9)' : p.ink;
  const ink = { stroke: night ? 'rgba(4,2,10,0.85)' : p.ink + 'CC', strokeWidth: 1.4 };
  const metal = night ? '#5A4F78' : '#B9BDCB';
  const paper = night ? '#F3E9FF' : '#FFFDF8';

  // Floor tiles (checkerboard laminate).
  const tiles: ReactNode[] = [];
  for (let x = WX; x < 22; x++)
    for (let y = WY; y < 18; y++)
      tiles.push(<polygon key={`${x}:${y}`} points={poly([[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]])} fill={(x + y) % 2 === 0 ? p.floor : shade(p.floor, night ? 0.07 : -0.05)} />);

  const cardColors = [
    { bg: p.cabinet, dot: p.pop, bar: INK, cta: p.accent2 },
    { bg: p.accent2, dot: p.cabinet, bar: paper, cta: p.pop },
    { bg: shade(p.ink, 0.08), dot: p.pop, bar: paper, cta: p.cabinet },
  ];

  const pathD = (() => {
    const a = S([X0, BY, BZ]);
    const b = S([X1, BY, BZ]);
    return `M${f(a[0])},${f(a[1])} L${f(b[0])},${f(b[1])}`;
  })();
  const clipX = S([4, BY, 0])[0];

  // Hopper rim (z = 5.8) and the clip that hides photos once they drop inside.
  const HZ = 4.2;
  const RZ = 5.8;
  const rim = { A: [0.1, 1.9, RZ] as P3, B: [2.5, 1.9, RZ] as P3, C: [2.5, 4.3, RZ] as P3, D: [0.1, 4.3, RZ] as P3 };
  const bot = { A: [0.7, 2.5, HZ] as P3, B: [1.9, 2.5, HZ] as P3, C: [1.9, 3.7, HZ] as P3, D: [0.7, 3.7, HZ] as P3 };
  const [dX, dY] = S(rim.D);
  const [cX, cY] = S(rim.C);
  const [bX, bY] = S(rim.B);

  const pressDrop = 0.42 * U;
  const winnerAt = S([PRESS_X, BY, BZ + 1.15]);
  const dome = S([3.0, 4.9, HZ + 0.35]);
  const domeR = 0.95 * U;
  const domeC: [number, number] = [dome[0], dome[1] - domeR * 0.82];

  // Ads counter: +1 every second as a card leaves the machine.
  const counts = [1284, 1285, 1286, 1287, 1288, 1289];

  // Dispatch: slot k enters the tower at phase FT·3 − k (mod 3) seconds.
  const enterAt = (k: number) => ((((FT * CARD_DUR - k) % CARD_DUR) + CARD_DUR) % CARD_DUR) / CARD_DUR;
  const platforms = [p.p1, p.p2, p.p3];
  const tubeColors = [p.cabinet, p.accent2, p.pop];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <filter id="cf-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="cf-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="cf-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="1.8" fill={night ? 'rgba(255,255,255,0.12)' : p.ink + '1F'} />
        </pattern>
        <pattern id="cf-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={INK} strokeWidth="2" opacity="0.35" />
        </pattern>
        <linearGradient id="cf-wallR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, night ? 0.04 : -0.02)} />
          <stop offset="1" stopColor={shade(p.wall, night ? 0.1 : -0.07)} />
        </linearGradient>
        <radialGradient id="cf-ball" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor={shade(p.cabinet, 0.2)} />
          <stop offset="1" stopColor={shade(p.cabinet, -0.35)} />
        </radialGradient>
        <radialGradient id="cf-glass" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="1" stopColor={p.accent2} stopOpacity="0.3" />
        </radialGradient>
        <clipPath id="cf-out">
          <rect x={clipX} y={-1000} width={2000} height={2000} />
        </clipPath>
        <clipPath id="cf-hopper">
          <polygon points={`${f(dX)},${f(dY)} ${f(cX)},${f(cY)} ${f(bX)},${f(bY)} ${f(bX)},-900 ${f(dX)},-900`} />
        </clipPath>
        <clipPath id="cf-belt">
          <polygon points={poly([[4, 3.6, BZ], [11.2, 3.6, BZ], [11.2, 5.0, BZ], [4, 5.0, BZ]])} />
        </clipPath>
        <clipPath id="cf-dome">
          <circle cx={domeC[0]} cy={domeC[1]} r={domeR - 3} />
        </clipPath>
      </defs>

      <rect width="1200" height="900" fill={p.wall} />
      <g transform={`translate(${OX} ${OY})`}>
        {/* Back walls */}
        <polygon points={poly([[WX, WY, 0], [17, WY, 0], [17, WY, 18], [WX, WY, 18]])} fill="url(#cf-wallR)" />
        <polygon points={poly([[WX, WY, 0], [WX, 18, 0], [WX, 18, 18], [WX, WY, 18]])} fill={shade(p.wall, night ? -0.12 : -0.05)} />
        <polygon points={poly([[WX, WY, 0], [17, WY, 0], [17, WY, 18], [WX, WY, 18]])} fill="url(#cf-dots)" />
        <polygon points={poly([[WX, WY, 0], [17, WY, 0], [17, WY, 0.5], [WX, WY, 0.5]])} fill={p.accent2} />
        <polygon points={poly([[WX, WY, 0], [WX, 18, 0], [WX, 18, 0.5], [WX, WY, 0.5]])} fill={shade(p.accent2, -0.2)} />

        {/* Memphis wall art: left wall (plane x = WX) */}
        {(() => {
          // neon on the left wall, reading toward the back (world −y)
          const [tx, ty] = S([WX, 7.2, 4.4]);
          const fs = p.neon.length > 12 ? 15 : 18;
          return (
            <g transform={`matrix(${C30} -0.5 0 1 ${f(tx)} ${f(ty)})`}>
              <rect x="-14" y={-fs - 16} width={p.neon.length * fs + 28} height={fs + 30} rx="10" fill={night ? '#0B0414' : p.ink} opacity={night ? 0.75 : 0.94} />
              <text x="0" y="0" fontFamily={FONTS.rubikmono} fontSize={fs} fill={shade(p.glow, 0.25)} filter="url(#cf-glow)">
                {p.neon}
                <Flicker dur={LOOP} seed={7} low={0.35} />
              </text>
              <path d={`M${p.neon.length * fs * 0.3},44 q12,-18 24,0 t24,0 t24,0 t24,0`} fill="none" stroke={p.accent2} strokeWidth="7" strokeLinecap="round" />
            </g>
          );
        })()}
        {/* back wall (plane y = WY): Memphis shapes between the machine and the tubes */}
        <g transform={leftFace([2.2, WY, 6.6])}>
          <circle cx="20" cy="20" r="34" fill={p.pop} />
          <circle cx="56" cy="2" r="22" fill="none" stroke={p.cabinet} strokeWidth="8" />
          <path d="M70,70 q14,-20 28,0 t28,0 t28,0" fill="none" stroke={p.accent2} strokeWidth="8" strokeLinecap="round" />
          <rect x="-60" y="40" width="42" height="42" fill="url(#cf-hatch)" stroke={INK} strokeWidth="3" />
        </g>
        <g transform={leftFace([9.4, WY, 6.4])}>
          <path d="M40,60 L80,110 L0,110 Z" fill={p.pop} stroke={INK} strokeWidth="3" strokeLinejoin="round" transform="translate(-30 -60)" />
        </g>
        {/* wall clock-style gauge */}
        <g transform={leftFace([9.6, WY, 7.6])}>
          <circle r="34" fill={paper} stroke={INK} strokeWidth="4" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="0" y1="-27" x2="0" y2="-22" stroke={INK} strokeWidth="2" transform={`rotate(${i * 30})`} />
          ))}
          <line x1="0" y1="0" x2="0" y2="-24" stroke={p.cabinet} strokeWidth="3" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="6s" repeatCount="indefinite" />
          </line>
          <circle r="4" fill={INK} />
        </g>

        {/* Floor */}
        {tiles}
        {/* cast shadows (light from upper left → shadows fall +x +y) */}
        <polygon points={poly([[0.6, 2.6, 0], [5.0, 2.6, 0], [5.6, 7.4, 0], [1.2, 7.4, 0]])} fill="#000" opacity={night ? 0.4 : 0.16} filter="url(#cf-blur)" />
        <polygon points={poly([[4.2, 3.8, 0], [11.8, 3.8, 0], [12.2, 5.8, 0], [4.6, 5.8, 0]])} fill="#000" opacity={night ? 0.32 : 0.12} filter="url(#cf-blur)" />
        <polygon points={poly([[11.6, 3.2, 0], [14.0, 3.2, 0], [14.6, 7.0, 0], [12.0, 7.0, 0]])} fill="#000" opacity={night ? 0.4 : 0.16} filter="url(#cf-blur)" />
        {night && <ellipse cx={S([6, 5, 0])[0]} cy={S([6, 5, 0])[1]} rx="380" ry="190" fill={p.glow} opacity="0.14" filter="url(#cf-blur)" />}

        {/* painted floor: safety line around the line, and a Memphis decal in front */}
        <polygon points={poly([[-0.7, 1.3, 0.01], [13.7, 1.3, 0.01], [13.7, 6.9, 0.01], [-0.7, 6.9, 0.01]])} fill="none" stroke={p.pop} strokeWidth="5" strokeDasharray="18 12" opacity="0.9" />
        {(() => {
          const [tx, ty] = S([6.4, 9.6, 0.01]);
          return (
            <g transform={`matrix(${C30} 0.5 ${-C30} 0.5 ${f(tx)} ${f(ty)})`} opacity={night ? 0.7 : 0.85}>
              <circle r="78" fill="none" stroke={p.accent2} strokeWidth="16" />
              <circle r="44" fill="url(#cf-hatch)" />
              <path d="M-150,120 q20,-30 40,0 t40,0 t40,0 t40,0 t40,0 t40,0" fill="none" stroke={p.cabinet} strokeWidth="12" strokeLinecap="round" />
              <path d="M110,-130 L160,-60 L80,-60 Z" fill={p.pop} />
            </g>
          );
        })()}
        {/* floor cable from machine to tower */}
        <path d={`M${S([3, 6.2, 0]).map(f).join(',')} Q${S([7, 8.2, 0]).map(f).join(',')} ${S([12, 6.2, 0]).map(f).join(',')}`} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" opacity="0.8" />

        {/* Pipes from the machine back into the wall */}
        {[3.0, 3.6].map((zz, i) => {
          const a = S([1.0 + i * 1.2, 2, zz]);
          const b = S([1.0 + i * 1.2, WY, zz]);
          return (
            <g key={i}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={shade(metal, -0.35)} strokeWidth="13" strokeLinecap="round" />
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={metal} strokeWidth="8" strokeLinecap="round" />
              <line x1={a[0]} y1={a[1] - 2} x2={b[0]} y2={b[1] - 2} stroke="#FFFFFF" strokeWidth="1.6" opacity="0.6" />
            </g>
          );
        })}
        {/* pipe gauge on the wall end */}
        {(() => {
          const [gx, gy] = S([2.2, WY + 0.4, 4.6]);
          return (
            <g transform={`translate(${f(gx)} ${f(gy)})`}>
              <circle r="15" fill={paper} stroke={INK} strokeWidth="3" />
              <line x1="0" y1="0" x2="0" y2="-11" stroke={p.cabinet} strokeWidth="2.6" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" values="-50;40;10;60;-50" dur="3s" repeatCount="indefinite" />
              </line>
            </g>
          );
        })()}

        {/* ── Machine ── */}
        <IsoBox x={-0.15} y={1.85} z={0} w={4.3} d={4.3} h={0.45} color={shade(p.ink, night ? 0.2 : 0.25)} u={U} ink={ink} />
        <IsoBox x={0} y={2} z={0.45} w={4} d={4} h={HZ - 0.45} color={p.cabinet} u={U} ink={ink} />
        {/* top trim band */}
        <IsoBox x={-0.1} y={1.9} z={HZ - 0.02} w={4.2} d={4.2} h={0.22} color={p.accent2} u={U} ink={ink} />

        {/* front face (plane y = 6): marquee, counter display, gauges, lamps */}
        <g transform={leftFace([0, 6, HZ - 0.05])}>
          <g transform={`scale(${K})`}>
          <rect x="12" y="10" width="160" height="34" rx="6" fill={p.pop} stroke={INK} strokeWidth="2.5" />
          <text x="92" y="33" textAnchor="middle" fontFamily={FONTS.rubikmono} fontSize={p.title.length > 12 ? 11 : 13} fill={INK}>
            {p.title}
          </text>
          <rect x="18" y="54" width="148" height="34" rx="5" fill="#120A1E" stroke={INK} strokeWidth="2.5" />
          {counts.map((c, i) => {
            const kt = [0];
            const v = [i === 0 ? 1 : 0];
            if (i > 0) {
              kt.push(i / 6);
              v.push(1);
            }
            if (i < 5) {
              kt.push((i + 1) / 6);
              v.push(0);
            }
            return (
              <text key={i} x="92" y="77" textAnchor="middle" fontFamily={FONTS.pressstart} fontSize="11" fill={p.pop} opacity={i === 0 ? 1 : 0}>
                {`${p.counter} ${c.toLocaleString('en-US')}`}
                <animate attributeName="opacity" values={v.join(';')} keyTimes={kt.map((k) => k.toFixed(4)).join(';')} calcMode="discrete" dur={`${LOOP}s`} repeatCount="indefinite" />
              </text>
            );
          })}
          {/* winner override on the display */}
          <rect x="20" y="56" width="144" height="30" rx="4" fill="#120A1E" opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${(M - 0.001).toFixed(4)};${M.toFixed(4)};0.9;0.901;1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          </rect>
          <text x="92" y="77" textAnchor="middle" fontFamily={FONTS.pressstart} fontSize="11" fill={p.accent2} opacity="0">
            {p.winner}
            <animate attributeName="opacity" values="0;0;1;0;1;1;0;0" keyTimes={`0;${(M - 0.001).toFixed(4)};${M.toFixed(4)};${(M + 0.03).toFixed(4)};${(M + 0.06).toFixed(4)};0.9;0.901;1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          </text>
          {/* gauges */}
          {[42, 102].map((gx, i) => (
            <g key={gx} transform={`translate(${gx} 124)`}>
              <circle r="21" fill={paper} stroke={INK} strokeWidth="2.5" />
              <path d="M-15,6 A16,16 0 0 1 15,6" fill="none" stroke={i ? p.accent2 : p.cabinet} strokeWidth="4" opacity="0.5" />
              <line x1="0" y1="2" x2="0" y2="-15" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" values={i ? '-30;45;20;55;-30' : '-55;10;-20;40;-55'} dur={i ? '2s' : '3s'} repeatCount="indefinite" />
              </line>
              <circle r="3" fill={INK} />
            </g>
          ))}
          {/* big start button */}
          <ellipse cx="152" cy="128" rx="16" ry="12" fill={shade(p.accent2, -0.3)} stroke={INK} strokeWidth="2" />
          <ellipse cx="152" cy="123" rx="16" ry="12" fill={p.accent2} stroke={INK} strokeWidth="2" />
          {/* chasing lamps */}
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx={22 + i * 23} cy="162" r="5" fill={p.pop} stroke={INK} strokeWidth="1.2">
              <animate attributeName="opacity" values="1;0.25;0.25;1" dur="1s" begin={`-${((i % 4) * 0.25).toFixed(2)}s`} repeatCount="indefinite" />
            </circle>
          ))}
          </g>
        </g>

        {/* right face (plane x = 4): output slot, gears, vents */}
        <g transform={rightFace([4, 2, HZ - 0.05])}>
          <g transform={`scale(${K})`}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="14" y={18 + i * 11} width="26" height="5" rx="2.5" fill={shade(p.cabinet, -0.45)} />
          ))}
          {[
            { x: 80, y: 25, r: 21, t: 10, dur: 3, dir: 1, c: p.pop },
            { x: 116, y: 16, r: 13, t: 8, dur: 2, dir: -1, c: paper },
            { x: 146, y: 28, r: 17, t: 9, dur: 3, dir: -1, c: p.accent2 },
          ].map((g, i) => (
            <g key={i} transform={`translate(${g.x} ${g.y})`}>
              <path d={gearPath(g.r, g.t)} fill={g.c} stroke={INK} strokeWidth="2" strokeLinejoin="round">
                <animateTransform attributeName="transform" type="rotate" values={`0;${360 * g.dir}`} dur={`${g.dur}s`} repeatCount="indefinite" />
              </path>
              <circle r={g.r * 0.28} fill={INK} />
            </g>
          ))}
          </g>
          {/* slot where cards leave: y 3.6..5.0 → a 73.6..138, z 1.6..3.0 */}
          <rect x={1.55 * U} y={(HZ - 0.05 - 3.05) * U} width={1.5 * U} height={1.45 * U} rx="6" fill={shade(p.ink, 0.05)} stroke={INK} strokeWidth="2.5" />
          <rect x={1.55 * U} y={(HZ - 0.05 - 3.05) * U} width={1.5 * U} height={10} fill="url(#cf-hatch)" />
          <rect x={1.55 * U + 4} y={(HZ - 0.05 - 3.05) * U + 4} width={1.5 * U - 8} height="5" rx="2" fill={p.pop}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* ── Hopper on top (back-left) ── */}
        <polygon points={poly([rim.A, rim.B, rim.C, rim.D])} fill={shade(p.ink, 0.12)} stroke={INK} strokeWidth="1.4" />
        {/* inner back walls visible through the mouth */}
        <polygon points={poly([rim.A, rim.B, bot.B, bot.A])} fill={shade(p.accent2, -0.35)} />
        <polygon points={poly([rim.A, rim.D, bot.D, bot.A])} fill={shade(p.accent2, -0.5)} />
        <polygon points={poly([bot.A, bot.B, bot.C, bot.D])} fill={shade(p.ink, 0.05)} />
        {/* feed pipe from the ceiling */}
        <IsoCylinder x={1.3} y={3.1} z={7.7} r={0.5} h={12} color={metal} u={U} ink={ink} />
        {(() => {
          const [px, py] = S([1.3, 3.1, 7.7]);
          return <ellipse cx={px} cy={py} rx={0.62 * U * 1.2247} ry={0.62 * U * 0.7071} fill={p.accent2} stroke={INK} strokeWidth="1.6" />;
        })()}
        {/* product photos dropping from the pipe into the hopper */}
        <g clipPath="url(#cf-hopper)">
          {[0, 1, 2].map((i) => {
            const a = S([1.3, 3.1, 7.6]);
            const b = S([1.3, 3.1, 4.6]);
            const tilt = [-14, 10, -4][i];
            const c = [p.cabinet, p.accent2, p.pop][i];
            return (
              <g key={i} opacity="0">
                <animate attributeName="opacity" values="0;1;1;1" keyTimes="0;0.08;0.9;1" dur="1.5s" begin={`-${i * 0.5}s`} repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" values={`${f(a[0])} ${f(a[1])};${f(b[0])} ${f(b[1])}`} keySplines="0.55 0 0.85 0.4" calcMode="spline" keyTimes="0;1" dur="1.5s" begin={`-${i * 0.5}s`} repeatCount="indefinite" />
                <g transform={`rotate(${tilt})`}>
                  <rect x="-17" y="-14" width="34" height="28" rx="3" fill={paper} stroke={INK} strokeWidth="1.8" />
                  <rect x="-13" y="-10" width="26" height="17" fill={shade(c, 0.35)} />
                  <circle cx="5" cy="-5" r="3.5" fill={p.pop} stroke={INK} strokeWidth="0.8" />
                  <path d="M-13,7 L-4,-3 L3,4 L7,0 L13,7 Z" fill={c} />
                </g>
              </g>
            );
          })}
        </g>
        {/* hopper outer faces (front + right) */}
        <polygon points={poly([bot.D, bot.C, rim.C, rim.D])} fill={shade(p.accent2, -0.25)} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <polygon points={poly([bot.B, bot.C, rim.C, rim.B])} fill={shade(p.accent2, -0.08)} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <g transform={leftFace([0.4, 4.0, 5.25])}>
          <path d="M8,6 q6,-8 12,0 t12,0 t12,0 t12,0" fill="none" stroke={p.pop} strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* bouncing ball on the machine top */}
        {(() => {
          const [bx, by] = S([0.85, 5.2, HZ + 0.2]);
          return (
            <g transform={`translate(${f(bx)} ${f(by)})`}>
              <ellipse cx="0" cy="0" rx="13" ry="6" fill="#000" opacity="0.22">
                <animate attributeName="rx" values="13;7;13" keyTimes="0;0.5;1" keySplines="0.2 0.6 0.4 1;0.6 0 0.8 0.4" calcMode="spline" dur="1s" repeatCount="indefinite" />
              </ellipse>
              <g>
                <animateTransform attributeName="transform" type="translate" values="0 -12;0 -70;0 -12" keyTimes="0;0.5;1" keySplines="0.2 0.6 0.4 1;0.6 0 0.8 0.4" calcMode="spline" dur="1s" repeatCount="indefinite" />
                <circle r="13" fill="url(#cf-ball)" stroke={INK} strokeWidth="1.6" />
                <circle cx="-4" cy="-4" r="3" fill={p.pop} />
              </g>
            </g>
          );
        })()}

        {/* gumball "brain" dome (front-right of the top) */}
        <IsoCylinder x={3.0} y={4.9} z={HZ + 0.2} r={0.8} h={0.25} color={p.pop} u={U} ink={ink} />
        <circle cx={domeC[0]} cy={domeC[1]} r={domeR} fill={night ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)'} />
        <g clipPath="url(#cf-dome)">
          <g>
            <animateTransform attributeName="transform" type="rotate" values={`0 ${f(domeC[0])} ${f(domeC[1])};360 ${f(domeC[0])} ${f(domeC[1])}`} dur="3s" repeatCount="indefinite" />
            {Array.from({ length: 11 }, (_, i) => {
              const a = (i / 11) * Math.PI * 2 + rand(i) * 0.6;
              const rr = (0.25 + rand(i * 7.3) * 0.55) * domeR;
              const c = [p.cabinet, p.accent2, p.pop, paper][i % 4];
              return <circle key={i} cx={domeC[0] + Math.cos(a) * rr} cy={domeC[1] + Math.sin(a) * rr} r={9 + rand(i * 2.1) * 3} fill={c} stroke={INK} strokeWidth="1.3" />;
            })}
          </g>
        </g>
        <circle cx={domeC[0]} cy={domeC[1]} r={domeR} fill="url(#cf-glass)" stroke={INK} strokeWidth="2" />
        <path d={`M${f(domeC[0] - domeR * 0.62)},${f(domeC[1] - domeR * 0.2)} A${domeR * 0.66},${domeR * 0.66} 0 0 1 ${f(domeC[0] - domeR * 0.1)},${f(domeC[1] - domeR * 0.66)}`} fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
        <circle cx={domeC[0]} cy={domeC[1] - domeR - 4} r="7" fill={p.cabinet} stroke={INK} strokeWidth="1.6">
          <animate attributeName="fill" values={`${p.cabinet};${p.pop};${p.cabinet}`} dur="1s" repeatCount="indefinite" />
        </circle>

        {/* ── Conveyor ── */}
        {/* back press post + belt legs */}
        <IsoBox x={PRESS_X - 0.18} y={3.05} z={0} w={0.36} d={0.36} h={3.9} color={metal} u={U} ink={ink} />
        {[5.0, 8.2, 10.6].map((x) => (
          <IsoBox key={x} x={x} y={3.7} z={0} w={0.3} d={0.3} h={1.2} color={metal} u={U} ink={ink} />
        ))}
        <IsoBox x={4} y={3.6} z={1.15} w={7.2} d={1.4} h={BZ - 1.15} color={shade(p.ink, night ? 0.25 : 0.35)} u={U} ink={ink} />
        {/* belt surface with moving slats */}
        <polygon points={poly([[4, 3.6, BZ], [11.2, 3.6, BZ], [11.2, 5.0, BZ], [4, 5.0, BZ]])} fill={shade(p.ink, night ? 0.1 : 0.18)} stroke={INK} strokeWidth="1.4" />
        <g clipPath="url(#cf-belt)">
          <g>
            <animateTransform attributeName="transform" type="translate" values={`0 0;${f(0.6 * C30 * U)} ${f(0.3 * U)}`} dur="0.25s" repeatCount="indefinite" />
            {Array.from({ length: 14 }, (_, i) => {
              const x = 3.4 + i * 0.6;
              return <polygon key={i} points={poly([[x, 3.6, BZ], [x + 0.12, 3.6, BZ], [x + 0.12, 5.0, BZ], [x, 5.0, BZ]])} fill={shade(p.ink, night ? 0.25 : 0.4)} />;
            })}
          </g>
        </g>
        {/* front rail with rivets */}
        <g transform={leftFace([4, 5.0, BZ - 0.05])}>
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={14 + i * 0.6 * U} cy="10" r="3" fill={metal} stroke={INK} strokeWidth="0.8" />
          ))}
          <rect x="0" y="0" width={7.2 * U} height="5" fill={p.accent2} opacity="0.9" />
        </g>

        {/* creative cards riding the belt */}
        <g clipPath="url(#cf-out)">
          {SHAPES.map((sh, k) => {
            const c = cardColors[k];
            const W = sh.w * U;
            const H = sh.h * U;
            const begin = `-${k}s`;
            const ktSwitch = `0;${FP.toFixed(4)};${(FP + 0.008).toFixed(4)};1`;
            return (
              <g key={k}>
                <animateMotion path={pathD} dur={`${CARD_DUR}s`} begin={begin} repeatCount="indefinite" />
                <g transform={`matrix(${C30} 0.5 0 1 0 0)`}>
                  {/* hard ink offset shadow */}
                  <rect x={-W / 2 + 5} y={-H + 3} width={W} height={H} rx="4" fill={INK} opacity="0.85" />
                  {/* blank card (before the press) */}
                  <g>
                    <animate attributeName="opacity" values="1;1;0;0" keyTimes={ktSwitch} dur={`${CARD_DUR}s`} begin={begin} repeatCount="indefinite" />
                    <rect x={-W / 2} y={-H} width={W} height={H} rx="4" fill={paper} stroke={INK} strokeWidth="1.8" />
                    <rect x={-W / 2 + 5} y={-H + 5} width={W - 10} height={H - 10} rx="2" fill="none" stroke={INK} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.5" />
                  </g>
                  {/* finished ad (after the press) */}
                  <g opacity="0">
                    <animate attributeName="opacity" values="0;0;1;1" keyTimes={ktSwitch} dur={`${CARD_DUR}s`} begin={begin} repeatCount="indefinite" />
                    <rect x={-W / 2} y={-H} width={W} height={H} rx="4" fill={c.bg} stroke={INK} strokeWidth="1.8" />
                    {k === 2 ? (
                      <>
                        <circle cx={-W / 2 + H * 0.5} cy={-H / 2} r={H * 0.3} fill={c.dot} stroke={INK} strokeWidth="1.4" />
                        <rect x={-W / 2 + H * 0.95} y={-H * 0.7} width={W * 0.38} height="6" rx="3" fill={c.bar} />
                        <rect x={-W / 2 + H * 0.95} y={-H * 0.45} width={W * 0.26} height="5" rx="2.5" fill={c.bar} opacity="0.6" />
                        <rect x={W / 2 - W * 0.22} y={-H * 0.66} width={W * 0.17} height={H * 0.32} rx={H * 0.16} fill={c.cta} stroke={INK} strokeWidth="1.2" />
                      </>
                    ) : (
                      <>
                        <circle cx="0" cy={-H * 0.6} r={W * 0.24} fill={c.dot} stroke={INK} strokeWidth="1.4" />
                        <rect x={-W * 0.36} y={-H * 0.3} width={W * 0.72} height="6" rx="3" fill={c.bar} />
                        <rect x={-W * 0.36} y={-H * 0.3 + 10} width={W * 0.46} height="5" rx="2.5" fill={c.bar} opacity="0.6" />
                        <rect x={-W * 0.3} y={-H * 0.16 + 4} width={W * 0.6} height={H * 0.1} rx={H * 0.05} fill={c.cta} stroke={INK} strokeWidth="1.2" />
                      </>
                    )}
                  </g>
                  {/* the winner star (slot 0, once per loop) */}
                  {k === 0 && (
                    <g opacity="0" transform={`translate(${W / 2 - 6} ${-H + 4})`}>
                      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${(M - 0.001).toFixed(4)};${M.toFixed(4)};0.93;0.94;1`} dur={`${LOOP}s`} repeatCount="indefinite" />
                      <path d={starPath(14, 6.5)} fill={p.pop} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>

        {/* front press post, beam, stamping head */}
        <IsoBox x={PRESS_X - 0.18} y={5.15} z={0} w={0.36} d={0.36} h={3.9} color={metal} u={U} ink={ink} />
        <g>
          <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;0 ${pressDrop};0 ${pressDrop};0 0`} keyTimes={`0;${(FP * 3 - 0.12).toFixed(4)};${(FP * 3 - 0.012).toFixed(4)};${(FP * 3 + 0.05).toFixed(4)};1`} keySplines="0 0 1 1;0.7 0 0.9 0.5;0 0 1 1;0.3 0 0.3 1" calcMode="spline" dur="1s" repeatCount="indefinite" />
          <IsoBox x={PRESS_X - 0.08} y={4.12} z={3.25} w={0.16} d={0.16} h={0.8} color={metal} u={U} ink={ink} />
          <IsoBox x={PRESS_X - 0.45} y={3.75} z={2.9} w={0.9} d={1.1} h={0.38} color={p.pop} u={U} ink={ink} />
          <g transform={leftFace([PRESS_X - 0.45, 4.85, 3.22])}>
            <rect x="6" y="4" width={0.9 * U - 12} height="6" fill="url(#cf-hatch)" />
          </g>
        </g>
        <IsoBox x={PRESS_X - 0.3} y={3.0} z={3.9} w={0.6} d={2.6} h={0.45} color={p.cabinet} u={U} ink={ink} />
        {/* stamp spark, every card */}
        {(() => {
          const [sx, sy] = S([PRESS_X, BY, BZ + 1.12]);
          const h = pulse(FP * 3, 0.12);
          return (
            <g transform={`translate(${f(sx)} ${f(sy)})`} opacity="0">
              <animate attributeName="opacity" values={h.values} keyTimes={h.keyTimes} dur="1s" repeatCount="indefinite" />
              {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2 + 0.3;
                return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 16} x2={Math.cos(a) * 44} y2={Math.sin(a) * 24} stroke={p.pop} strokeWidth="3.5" strokeLinecap="round" />;
              })}
            </g>
          );
        })()}

        {/* ── Dispatch tower ── */}
        <IsoBox x={TOWER_X} y={2.8} z={0} w={1.8} d={3.2} h={5.4} color={p.accent2} u={U} ink={ink} />
        <IsoBox x={TOWER_X - 0.1} y={2.7} z={5.4} w={2.0} d={3.4} h={0.25} color={p.pop} u={U} ink={ink} />
        {/* intake mouth on the front corner (where the belt ends) */}
        {/* front face (plane y = 6): platform ports */}
        <g transform={`${leftFace([TOWER_X, 6, 5.2])} scale(${K})`}>
          {platforms.map((name, j) => {
            const h = pulse(enterAt(j), 0.12);
            const y0 = 12 + j * 52;
            return (
              <g key={j}>
                <rect x="6" y={y0} width={1.8 * 46 - 12} height="40" rx="6" fill={night ? '#120A1E' : paper} stroke={INK} strokeWidth="2.2" />
                <circle cx="20" cy={y0 + 20} r="7" fill={shade(tubeColors[j], -0.35)} stroke={INK} strokeWidth="1.4" />
                <circle cx="20" cy={y0 + 20} r="7" fill={tubeColors[j]} opacity="0" filter="url(#cf-glow)">
                  <animate attributeName="opacity" values={h.values} keyTimes={h.keyTimes} dur={`${CARD_DUR}s`} repeatCount="indefinite" />
                </circle>
                <text x="33" y={y0 + 25} fontFamily={FONTS.pressstart} fontSize={name.length > 6 ? 6 : 8} fill={night ? paper : INK}>
                  {name}
                </text>
              </g>
            );
          })}
          <text x={0.9 * 46} y="190" textAnchor="middle" fontFamily={FONTS.pressstart} fontSize="7" fill={night ? paper : INK} opacity="0.85">
            +31 MORE
          </text>
          <rect x="10" y="202" width={1.8 * 46 - 20} height="16" rx="3" fill="url(#cf-hatch)" stroke={INK} strokeWidth="1.6" />
        </g>
        {/* right face (plane x = 13): level meters */}
        <g transform={`${rightFace([TOWER_X + 1.8, 2.8, 5.2])} scale(${K})`}>
          {[0, 1, 2].map((j) => {
            const x = 24 + j * 38;
            return (
              <g key={j}>
                <rect x={x} y="20" width="22" height="120" rx="4" fill={night ? '#120A1E' : paper} stroke={INK} strokeWidth="2" />
                <rect x={x + 4} y="24" width="14" height="112" rx="2" fill={tubeColors[j]}>
                  <animate attributeName="y" values={['80;40;60;80', '60;30;90;60', '100;50;70;100'][j]} dur={['3s', '2s', '6s'][j]} repeatCount="indefinite" />
                  <animate attributeName="height" values={['56;96;76;56', '76;106;46;76', '36;86;66;36'][j]} dur={['3s', '2s', '6s'][j]} repeatCount="indefinite" />
                </rect>
              </g>
            );
          })}
          <path d="M20,175 q10,-14 20,0 t20,0 t20,0 t20,0 t20,0" fill="none" stroke={p.pop} strokeWidth="5" strokeLinecap="round" />
        </g>
        {/* pneumatic tubes up to the platforms */}
        {[0, 1, 2].map((j) => {
          const y = 3.35 + j * 1.05;
          const a = S([TOWER_X + 0.9, y, 5.65]);
          const b = S([TOWER_X + 0.9, y, 15]);
          const t0 = enterAt(j);
          return (
            <g key={j}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth="20" opacity="0.9" />
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={shade(tubeColors[j], 0.55)} strokeWidth="16" opacity="0.95" />
              <line x1={a[0] - 4} y1={a[1]} x2={b[0] - 4} y2={b[1]} stroke="#FFFFFF" strokeWidth="2.5" opacity="0.7" />
              {[0, 1, 2, 3].map((r) => {
                const q = S([TOWER_X + 0.9, y, 6.6 + r * 1.8]);
                return <rect key={r} x={q[0] - 12} y={q[1] - 3} width="24" height="6" rx="2" fill={tubeColors[j]} stroke={INK} strokeWidth="1.2" />;
              })}
              <ellipse cx={a[0]} cy={a[1]} rx="14" ry="7" fill={tubeColors[j]} stroke={INK} strokeWidth="1.6" />
              {/* capsule shooting up */}
              <g opacity="0">
                <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${t0.toFixed(4)};${(t0 + 0.01).toFixed(4)};${Math.min(0.98, t0 + 0.2).toFixed(4)};${Math.min(0.99, t0 + 0.21).toFixed(4)};1`} dur={`${CARD_DUR}s`} repeatCount="indefinite" />
                <animateMotion path={`M${f(a[0])},${f(a[1])} L${f(b[0])},${f(b[1])}`} keyPoints="0;0;1;1" keyTimes={`0;${t0.toFixed(4)};${Math.min(0.98, t0 + 0.2).toFixed(4)};1`} calcMode="linear" dur={`${CARD_DUR}s`} repeatCount="indefinite" />
                <rect x="-6" y="-12" width="12" height="24" rx="6" fill={tubeColors[j]} stroke={INK} strokeWidth="1.6" />
              </g>
            </g>
          );
        })}

        {/* foreground: a crate of product shots waiting to go in */}
        <IsoBox x={0.4} y={7.6} z={0} w={1.8} d={1.5} h={0.9} color={shade(p.pop, -0.1)} u={U} ink={ink} />
        <g transform={leftFace([0.4, 9.1, 0.75])}>
          <text x={0.9 * U} y="22" textAnchor="middle" fontFamily={FONTS.pressstart} fontSize="8" fill={INK}>
            PRODUCT
          </text>
        </g>
        {[0, 1, 2].map((i) => {
          const [cx, cy] = S([0.8 + i * 0.5, 8.3, 0.9]);
          return (
            <g key={i} transform={`translate(${f(cx)} ${f(cy - 14)}) rotate(${[-12, 4, 14][i]})`}>
              <rect x="-15" y="-13" width="30" height="24" rx="3" fill={paper} stroke={INK} strokeWidth="1.6" />
              <rect x="-11" y="-9" width="22" height="14" fill={shade([p.cabinet, p.accent2, p.pop][i], 0.35)} />
              <path d="M-11,5 L-3,-3 L3,3 L6,0 L11,5 Z" fill={[p.cabinet, p.accent2, p.pop][i]} />
            </g>
          );
        })}

        {/* ── The moment: WINNER chip + confetti from the press ── */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${(M - 0.001).toFixed(4)};${M.toFixed(4)};${(M + 0.2).toFixed(4)};${(M + 0.24).toFixed(4)};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <g transform={`translate(${f(winnerAt[0] + 40)} ${f(winnerAt[1] - 112)}) scale(1.2)`}>
            <g>
              <animateTransform attributeName="transform" type="scale" values="0.4;0.4;1.12;1;1" keyTimes={`0;${M.toFixed(4)};${(M + 0.025).toFixed(4)};${(M + 0.045).toFixed(4)};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
              <rect x="-74" y="-22" width="148" height="40" rx="20" fill={INK} transform="translate(5 5)" />
              <rect x="-74" y="-22" width="148" height="40" rx="20" fill={p.pop} stroke={INK} strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fontFamily={FONTS.pressstart} fontSize="12" fill={INK}>
                {p.winner}
              </text>
            </g>
          </g>
        </g>
        {Array.from({ length: 18 }, (_, i) => {
          const a = -Math.PI / 2 + (rand(i * 3.1) - 0.5) * 3.2;
          const dist = 90 + rand(i * 5.7) * 140;
          const [ox, oy] = winnerAt;
          const mid = `${f(ox + Math.cos(a) * dist)} ${f(oy + Math.sin(a) * dist * 0.8)}`;
          const end = `${f(ox + Math.cos(a) * dist * 1.25)} ${f(oy + Math.sin(a) * dist * 0.5 + 150)}`;
          const c = [p.cabinet, p.accent2, p.pop, p.ink][i % 4];
          const kt = `0;${M.toFixed(4)};${(M + 0.07).toFixed(4)};0.98;1`;
          return (
            <g key={i} opacity="0">
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values={`${f(ox)} ${f(oy)};${f(ox)} ${f(oy)};${mid};${end};${f(ox)} ${f(oy)}`} keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
              {i % 3 === 0 ? (
                <path d="M-14,0 q3.5,-6 7,0 t7,0 t7,0 t7,0" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
              ) : i % 3 === 1 ? (
                <path d="M0,-9 L9,7 L-9,7 Z" fill={c} stroke={INK} strokeWidth="1.4" />
              ) : (
                <rect x="-3" y="-9" width="6" height="18" rx="3" fill={c} />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function starPath(R: number, r: number) {
  const out: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r : R;
    out.push(`${f(Math.cos(a) * rr)},${f(Math.sin(a) * rr)}`);
  }
  return `M${out.join(' L')} Z`;
}
