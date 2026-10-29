import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { IsoBox, IsoCylinder, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'openfeed Daily Press',
  description:
    "Landing-page hero: openfeed as a calm little machine — articles flutter in from source towers, Scout's telescope gathers them, FeedX scores and sieves them, the domdistill press stamps today's single page, and a lift files it on a shelf of dated volumes. Loops seamlessly.",
  tags: ['hero', 'isometric', 'landing page', 'process', 'reading', 'animated svg', 'openfeed'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1, 0.5, 0.25 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Press sign').default('openfeed'),
  date: text('Day tab').default('Fri 30 Oct'),
  tally: text('FeedX tally').default('214 read → 9 kept'),
  skyTop: color('Backdrop top').default('#F6EBCB'),
  skyBottom: color('Backdrop bottom').default('#E6ECD8'),
  stripe1: color('Outer stripe').default('#6A8D3A'),
  stripe2: color('Middle stripe').default('#C9A227'),
  stripe3: color('Inner stripe').default('#E85D3F'),
  machine: color('Machine paint').default('#6A8D3A'),
  trim: color('Machine trim').default('#F4ECD8'),
  plinth: color('Floor').default('#DCE3CC'),
  wood: color('Shelf wood').default('#A8744A'),
  brass: color('Brass').default('#C9A227'),
  paper: color('Paper').default('#FFFBF0'),
  pop: color('Today marker').default('#E85D3F'),
  ink: color('Ink').default('#1E2A1A'),
  night: toggle('Night (stars, lamps)').default(false),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  terracotta: { skyTop: '#F6DCC0', skyBottom: '#F1E4D3', stripe1: '#4F6D58', stripe2: '#F2A541', stripe3: '#C8553D', machine: '#C8553D', trim: '#FBF1E2', plinth: '#E5CDB2', wood: '#7A4A2E', brass: '#F2A541', pop: '#4F6D58', ink: '#3B1F14' },
  midcentury: { skyTop: '#F4E9D8', skyBottom: '#EAD9BC', stripe1: '#2C7873', stripe2: '#E9B44C', stripe3: '#D96C3D', machine: '#2C7873', trim: '#F7EEDD', plinth: '#E6D3B3', wood: '#8B5A3C', brass: '#E9B44C', pop: '#D96C3D', ink: '#2E2A24' },
  nordic: { skyTop: '#DCE6EC', skyBottom: '#E9EEF1', stripe1: '#2F6F8F', stripe2: '#A7C4D4', stripe3: '#E4572E', machine: '#2F6F8F', trim: '#F4F7F8', plinth: '#D3DDE3', wood: '#B89B7A', brass: '#A7C4D4', paper: '#FBFCFC', pop: '#E4572E', ink: '#17242E' },
  night: { night: true, skyTop: '#0E1A14', skyBottom: '#1F3326', stripe1: '#4E8A5B', stripe2: '#B5E550', stripe3: '#FF9F43', machine: '#4E8A5B', trim: '#D8E2C6', plinth: '#2A3D2F', wood: '#6E4A32', brass: '#B5E550', paper: '#F3F0DD', pop: '#FF9F43', ink: '#0B140E' },
  riso: { skyTop: '#F4EFE6', skyBottom: '#F4EFE6', stripe1: '#0078BF', stripe2: '#FFE800', stripe3: '#FF48B0', machine: '#FF48B0', trim: '#F4EFE6', plinth: '#EAE2D3', wood: '#0078BF', brass: '#FFE800', pop: '#FFE800', ink: '#1F2A6B' },
};

type P = z.infer<typeof schema>;

const U = 42;
const LOOP = scene.loop;
const OX = 625;
const OY = 242;
const C30 = Math.cos(Math.PI / 6);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;
const rep = { repeatCount: 'indefinite' } as const;

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const quad = (x: number, y: number, w: number, d: number, z = 0.02) => poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]]);
const xy = (p: P3) => S(p).map((v) => v.toFixed(1)).join(' ');
/** Text/shapes laid flat on a left face (plane y = const) or right face (plane x = const). */
const onLeft = (p: P3) => `translate(${xy(p)}) matrix(${C30} 0.5 0 1 0 0)`;
const onRight = (p: P3) => `translate(${xy(p)}) matrix(${C30} -0.5 0 1 0 0)`;

// The moment: the press slams at 55% of the loop (stills samples 55.5%).
const HIT = 0.55;

function Shadow({ ps, o = 0.18 }: { ps: P3[]; o?: number }) {
  return <polygon points={poly(ps)} fill="#1E2A1A" opacity={o} filter="url(#dp-blur)" />;
}

/** A flat sheet of paper lying in the ground plane, centred on the origin. */
function Card({ p, w = 0.72, d = 0.52, chip, id }: { p: P; w?: number; d?: number; chip?: ReactNode; id?: string }) {
  const c = (a: number, b: number): P3 => [a, b, 0];
  return (
    <g id={id}>
      <polygon points={poly([c(-w / 2, -d / 2), c(w / 2, -d / 2), c(w / 2, d / 2), c(-w / 2, d / 2)])} fill={p.paper} stroke={p.ink} strokeOpacity="0.6" strokeWidth="1" strokeLinejoin="round" />
      {[-0.1, 0.06].map((b, i) => (
        <polyline key={b} points={poly([c(-w / 2 + 0.1, b), c(w / 2 - (i ? 0.3 : 0.12), b)])} stroke={p.ink} strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
      ))}
      {chip}
    </g>
  );
}

/** Paper article tumbling through the air (screen space). */
function Sheet({ p, path, dur, begin, k }: { p: P; path: string; dur: number; begin: number; k: number }) {
  const b = `${begin}s`;
  return (
    <g opacity="0">
      <animateMotion dur={`${dur}s`} begin={b} {...rep} path={path} keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="spline" keySplines="0.4 0 0.6 1;0 0 1 1" />
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.08;0.74;0.8;1" dur={`${dur}s`} begin={b} {...rep} />
      <g>
        <animateTransform attributeName="transform" type="rotate" values={`${-20 + k * 7};${18 - k * 5};${-20 + k * 7}`} dur="1s" begin={`${begin * 0.37}s`} {...rep} {...spline} />
        <g>
          <animateTransform attributeName="transform" type="scale" values="1 1;1 0.35;1 1" dur="0.5s" begin={`${begin * 0.21}s`} {...rep} {...spline} />
          <rect x="-13" y="-16" width="26" height="32" rx="2.5" fill={p.paper} stroke={p.ink} strokeOpacity="0.7" strokeWidth="1.2" />
          <rect x="-9" y="-11" width="18" height="5" fill={[p.stripe1, p.stripe2, p.stripe3][k % 3]} />
          <line x1="-9" y1="0" x2="9" y2="0" stroke={p.ink} strokeOpacity="0.4" strokeWidth="2" />
          <line x1="-9" y1="5.5" x2="9" y2="5.5" stroke={p.ink} strokeOpacity="0.4" strokeWidth="2" />
          <line x1="-9" y1="11" x2="3" y2="11" stroke={p.ink} strokeOpacity="0.4" strokeWidth="2" />
        </g>
      </g>
    </g>
  );
}

/** Lattice source mast broadcasting RSS-style rings. */
function SourceTower({ x, y, h, p, label, seed }: { x: number; y: number; h: number; p: P; label: string; seed: number }) {
  const INK = p.ink;
  const [tx, ty] = S([x, y, h]);
  const [bx, by] = S([x, y, 0]);
  const legs: [number, number][] = [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]];
  return (
    <g>
      <ellipse cx={bx + 16} cy={by + 8} rx="40" ry="16" fill="#1E2A1A" opacity="0.14" filter="url(#dp-blur)" />
      <IsoBox x={x - 0.7} y={y - 0.7} z={-0.5} w={1.4} d={1.4} h={0.5} color={p.plinth} u={U} ink={{ stroke: INK }} />
      <g stroke={shade(p.wood, -0.35)} strokeWidth="2.2" strokeLinecap="round" fill="none">
        {legs.map(([a, b], i) => (
          <polyline key={i} points={poly([[x + a, y + b, 0], [x + a * 0.25, y + b * 0.25, h]])} />
        ))}
        {[0.25, 0.5, 0.75].map((t) => {
          const s = 1 - t * 0.75;
          return <polyline key={t} points={poly([[x - 0.45 * s, y + 0.45 * s, h * t], [x + 0.45 * s, y + 0.45 * s, h * t], [x + 0.45 * s, y - 0.45 * s, h * t]])} strokeWidth="1.4" />;
        })}
        {[0, 0.25, 0.5].map((t) => {
          const s0 = 1 - t * 0.75;
          const s1 = 1 - (t + 0.25) * 0.75;
          return <polyline key={`x${t}`} points={poly([[x - 0.45 * s0, y + 0.45 * s0, h * t], [x + 0.45 * s1, y + 0.45 * s1, h * (t + 0.25)]])} strokeWidth="1.1" opacity="0.8" />;
        })}
      </g>
      {/* broadcast rings */}
      {[0, 1, 2].map((k) => (
        <circle key={k} cx={tx} cy={ty - 6} r="8" fill="none" stroke={p.stripe2} strokeWidth="2.4" opacity="0">
          <animate attributeName="r" values="8;46" dur="2s" begin={`${-k * 0.66 - seed * 0.3}s`} {...rep} />
          <animate attributeName="opacity" values="0.9;0" dur="2s" begin={`${-k * 0.66 - seed * 0.3}s`} {...rep} />
        </circle>
      ))}
      <circle cx={tx} cy={ty - 6} r="8" fill={p.pop} stroke={INK} strokeWidth="1.2" />
      <circle cx={tx - 2.5} cy={ty - 8.5} r="2.5" fill="#FFFFFF" opacity="0.6" />
      <circle cx={tx} cy={ty - 6} r="14" fill={p.pop} opacity="0.3" filter="url(#dp-glow)">
        <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1s" begin={`${-seed * 0.3}s`} {...rep} />
      </circle>
      {/* source chip */}
      <g transform={`translate(${bx} ${by - 24})`}>
        <rect x={-label.length * 4.4 - 10} y="-11" width={label.length * 8.8 + 20} height="22" rx="11" fill={p.paper} stroke={INK} strokeWidth="1.2" />
        <text x="0" y="4.5" textAnchor="middle" fontFamily={FONTS.outfit} fontWeight="800" fontSize="12" letterSpacing="1.6" fill={INK}>
          {label}
        </text>
      </g>
    </g>
  );
}

/** Spinning gear drawn in a box face plane. */
function Gear({ at, face, r, dur, rev, p }: { at: P3; face: 'left' | 'right'; r: number; dur: number; rev?: boolean; p: P }) {
  const teeth = 10;
  const circ = 2 * Math.PI * r;
  return (
    <g transform={face === 'left' ? onLeft(at) : onRight(at)}>
      <g>
        <animateTransform attributeName="transform" type="rotate" values={rev ? '360;0' : '0;360'} dur={`${dur}s`} {...rep} />
        <circle r={r} fill="none" stroke={shade(p.brass, -0.25)} strokeWidth="6" strokeDasharray={`${circ / teeth / 2} ${circ / teeth / 2}`} />
        <circle r={r - 2} fill={p.brass} stroke={p.ink} strokeOpacity="0.6" strokeWidth="1" />
        <circle r={r * 0.35} fill={shade(p.brass, -0.3)} />
        <line x1={-r + 4} y1="0" x2={r - 4} y2="0" stroke={shade(p.brass, -0.35)} strokeWidth="2" />
      </g>
    </g>
  );
}

function Stars() {
  const out: ReactNode[] = [];
  for (let i = 0; i < 50; i++) {
    const dur = [2, 4, 8][i % 3];
    out.push(
      <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 380} r={0.6 + rand(i * 1.3) * 1.4} fill="#FFF6E0">
        <animate attributeName="opacity" values="0.2;1;0.2" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} {...rep} />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

function Cloud({ x, y, s, c, ink }: { x: number; y: number; s: number; c: string; ink: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={c} stroke={ink} strokeOpacity="0.45" strokeWidth={1.2 / s}>
      <rect x="-70" y="-14" width="140" height="28" rx="14" />
      <circle cx="-26" cy="-18" r="24" />
      <circle cx="16" cy="-26" r="30" />
      <rect x="-68" y="-12" width="136" height="24" rx="12" stroke="none" />
    </g>
  );
}

/** Belt surface with dashed treads that scroll in the travel direction. */
function Belt({ from, to, p, speed = 0.25 }: { from: P3; to: P3; p: P; speed?: number }) {
  const [a, b] = [S(from), S(to)];
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={shade(p.ink, 0.3)} strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 12">
        <animate attributeName="stroke-dashoffset" values="16;0" dur={`${speed}s`} {...rep} />
      </line>
    </g>
  );
}

export default function DailyPress(p: P) {
  const INK = p.ink;
  const ink = { stroke: INK, strokeWidth: 1.2 };
  const night = p.night;
  const L = `${LOOP}s`;

  // Key points (world → screen, relative to the machine origin).
  const hopper = S([1.9, 10, 2.5]);
  const towers = [
    { x: 1.8, y: 4.6, h: 5.6, label: 'RSS' },
    { x: -2.6, y: 8.4, h: 4.4, label: 'BLOGS' },
    { x: -1.2, y: 12.6, h: 3.4, label: 'PAPERS' },
  ];
  const bed = S([10, 10, 1.42]);
  // The sun and stripes rise right behind the press's marquee.
  const sunX = OX;
  const sunY = 300;
  const archBase = 380;

  // Belt paths (screen translate keyframes).
  const keptPath = `${xy([1.9, 10, 0.74])};${xy([8.8, 10, 0.74])}`;
  const rejPath = `${xy([1.9, 10, 0.74])};${xy([5.5, 10, 0.74])};${xy([5.6, 11.5, 0.3])};${xy([5.6, 11.5, 0.3])}`;

  // Today's page: bed → belt → lift → shelf slot. Times as loop fractions.
  const pageOnBelt = [
    [0, xy([10, 8.2, 0.76])],
    [0.66, xy([10, 8.2, 0.76])],
    [0.84, xy([10, 2.1, 0.76])],
    [0.9, xy([10, 2.1, 3.12])],
    [0.94, xy([10, 1.4, 3.12])],
    [1, xy([10, 1.4, 3.12])],
  ];

  const spines = [p.machine, p.brass, shade(p.plinth, -0.25), shade(p.machine, -0.35), p.trim, shade(p.brass, -0.3), shade(p.wood, 0.25)];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="dp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="dp-halo">
          <stop offset="0" stopColor="#FFF6DC" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#FFF6DC" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FFF6DC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dp-flash">
          <stop offset="0" stopColor="#FFF8E0" stopOpacity="1" />
          <stop offset="0.5" stopColor={p.stripe2} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.stripe2} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dp-pool">
          <stop offset="0" stopColor="#FFD66B" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFD66B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dp-legfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#fff" />
          <stop offset="0.72" stopColor="#000" />
        </linearGradient>
        <mask id="dp-legs" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="900">
          <rect width="1200" height="900" fill="url(#dp-legfade)" />
        </mask>
        <pattern id="dp-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="1.2" fill={INK} opacity={night ? 0.18 : 0.08} />
        </pattern>
        <filter id="dp-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="dp-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* ── Backdrop: paper wall, dot grid, sunrise stripes ── */}
      <rect width="1200" height="900" fill="url(#dp-sky)" />
      <rect width="1200" height="900" fill="url(#dp-dots)">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -22" dur={L} {...rep} />
      </rect>
      {night && <Stars />}
      <g opacity={night ? 0.6 : 0.92} mask="url(#dp-legs)">
        {[p.stripe1, p.stripe2, p.stripe3].map((c, i) => {
          const r = 290 - i * 44;
          return (
            <path key={i} d={`M${sunX - r},760 L${sunX - r},${archBase} A${r},${r} 0 0 1 ${sunX + r},${archBase} L${sunX + r},760`} fill="none" stroke={c} strokeWidth="40">
              <animate attributeName="stroke-width" values="40;40;50;40;40" keyTimes={`0;${HIT};${HIT + 0.03};${HIT + 0.2};1`} dur={L} begin={`${i * 0.08}s`} {...rep} />
            </path>
          );
        })}
      </g>
      <circle cx={sunX} cy={sunY} r="200" fill="url(#dp-halo)" opacity="0.7">
        <animate attributeName="opacity" values="0.6;0.6;1;0.6;0.6" keyTimes={`0;${HIT};${HIT + 0.02};${HIT + 0.2};1`} dur={L} {...rep} />
      </circle>
      <circle cx={sunX} cy={sunY} r="64" fill={night ? '#F3E7C8' : shade(p.stripe2, 0.55)} stroke={INK} strokeOpacity="0.4" strokeWidth="1.2">
        <animate attributeName="r" values="64;68;64" dur="4s" {...rep} {...spline} />
      </circle>
      {/* 70s horizon cuts across the sun's lower half */}
      {[18, 32, 44].map((dy, i) => (
        <rect key={dy} x={sunX - 80} y={sunY + dy} width="160" height={3 + i * 1.5} fill={p.skyTop} />
      ))}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;40 0;0 0" dur={L} {...rep} {...spline} />
        <Cloud x={160} y={140} s={0.9} c={night ? '#2C4034' : '#FFFBF0'} ink={INK} />
        <Cloud x={1050} y={250} s={0.7} c={night ? '#2C4034' : '#FFFBF0'} ink={INK} />
      </g>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;-28 3;0 0" dur={L} {...rep} {...spline} />
        <Cloud x={960} y={110} s={0.5} c={night ? '#24362B' : '#FFF4DE'} ink={INK} />
      </g>
      {/* a paper bird crossing the sun once per loop */}
      <g opacity="0">
        <animateMotion dur={L} {...rep} path="M-60,210 C300,150 700,170 1260,120" keyPoints="0;0;1;1" keyTimes="0;0.1;0.5;1" calcMode="linear" />
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.1;0.12;0.48;0.5;1" dur={L} {...rep} />
        <path fill={p.paper} stroke={INK} strokeOpacity="0.6" strokeWidth="1">
          <animate attributeName="d" values="M-10,0 L0,-8 L10,0 L0,-3 Z;M-10,0 L0,4 L10,0 L0,-3 Z;M-10,0 L0,-8 L10,0 L0,-3 Z" dur="0.5s" {...rep} />
        </path>
      </g>

      {/* ── The machine ── */}
      <g transform={`translate(${OX} ${OY})`}>
        <g>
          {/* impact shake */}
          <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 3;0 -1.5;0 0;0 0" keyTimes={`0;${HIT};${HIT + 0.008};${HIT + 0.02};${HIT + 0.035};1`} dur={L} {...rep} />

          {/* floor shadow */}
          <polygon points={poly([[0, 12.6, -0.7], [12.8, 12.6, -0.7], [12.8, -0.6, -0.7], [14.2, -0.6, -1.2], [14.2, 14, -1.2], [1, 14, -1.2]])} fill="#1E2A1A" opacity="0.13" filter="url(#dp-blur)" />

          {/* Source towers (behind, far left) */}
          {towers.map((t, i) => (
            <SourceTower key={t.label} {...t} p={p} seed={i} />
          ))}

          {/* L-shaped plinth with sunrise-stripe trim */}
          {(() => {
            const z0 = -0.6;
            const top: P3[] = [[0, 8.3, 0], [8.3, 8.3, 0], [8.3, -0.8, 0], [12.6, -0.8, 0], [12.6, 12.4, 0], [0, 12.4, 0]];
            return (
              <g>
                <polygon points={poly([[0, 12.4, 0], [12.6, 12.4, 0], [12.6, 12.4, z0], [0, 12.4, z0]])} fill={shade(p.plinth, -0.3)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
                <polygon points={poly([[12.6, -0.8, 0], [12.6, 12.4, 0], [12.6, 12.4, z0], [12.6, -0.8, z0]])} fill={shade(p.plinth, -0.16)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
                {[p.stripe1, p.stripe2, p.stripe3].map((c, i) => {
                  const a = -0.14 - i * 0.12;
                  const b = a - 0.07;
                  return (
                    <g key={i}>
                      <polygon points={poly([[0, 12.4, a], [12.6, 12.4, a], [12.6, 12.4, b], [0, 12.4, b]])} fill={c} />
                      <polygon points={poly([[12.6, -0.8, a], [12.6, 12.4, a], [12.6, 12.4, b], [12.6, -0.8, b]])} fill={shade(c, -0.1)} />
                    </g>
                  );
                })}
                <polygon points={poly(top)} fill={p.plinth} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
                {/* tatami seams */}
                <g stroke={shade(p.plinth, -0.18)} strokeWidth="1.2" fill="none">
                  {[2.1, 4.2, 6.3].map((x) => (
                    <polyline key={x} points={poly([[x, 8.3, 0.01], [x, 12.4, 0.01]])} />
                  ))}
                  {[1.5, 3.8, 6.1].map((y) => (
                    <polyline key={y} points={poly([[8.3, y, 0.01], [12.6, y, 0.01]])} />
                  ))}
                  <polyline points={poly([[0, 10.35, 0.01], [8.3, 10.35, 0.01]])} opacity="0.6" />
                </g>
              </g>
            );
          })()}

          {/* cast shadows on the floor (light from up-left) */}
          <Shadow ps={[[8.3, 1.2, 0.01], [12.4, 1.2, 0.01], [12.6, 3.0, 0.01], [8.6, 3.0, 0.01]]} o={0.2} />
          <Shadow ps={[[8.6, 11.4, 0.01], [11.6, 11.4, 0.01], [12.2, 12.4, 0.01], [9.2, 12.4, 0.01]]} o={0.2} />
          <Shadow ps={[[11.4, 8.6, 0.01], [12.4, 8.6, 0.01], [12.6, 11.4, 0.01], [11.6, 11.4, 0.01]]} o={0.16} />

          {/* ── Archive shelf of dated volumes ── */}
          {(() => {
            const x0 = 8.4;
            const x1 = 12.2;
            const y0 = -0.5;
            const y1 = 1.2;
            const H = 4.6;
            const rows = [0.25, 1.75, 3.25];
            const out: ReactNode[] = [];
            // carcass
            out.push(<IsoBox key="body" x={x0} y={y0} w={x1 - x0} d={y1 - y0} h={H} color={p.wood} u={U} ink={ink} />);
            // shelf cavities on the front (left) face
            rows.forEach((z, r) => {
              out.push(<IsoWindow key={`cav${r}`} face="left" plane={y1} a={x0 + 0.18} z={z} w={x1 - x0 - 0.36} h={1.25} fill={shade(p.wood, -0.55)} u={U} ink={ink} />);
            });
            // volumes standing on each shelf
            rows.forEach((z, r) => {
              let x = x0 + 0.22;
              let i = 0;
              while (x < x1 - 0.4) {
                const w = 0.17 + rand(r * 31 + i * 7.3) * 0.1;
                const h = 0.85 + rand(r * 11 + i * 3.7) * 0.3;
                const isSlot = r === 2 && Math.abs(x + w / 2 - 10) < 0.2;
                if (isSlot) {
                  // today's empty slot, waiting
                  out.push(
                    <IsoWindow key={`slot`} face="left" plane={y1 + 0.001} a={x} z={z} w={0.3} h={1.05} fill={p.pop} u={U} ink={{ strokeWidth: 0 }}>
                      <animate attributeName="opacity" values="0.25;0.6;0.25" dur="1s" {...rep} />
                    </IsoWindow>,
                  );
                  x += 0.34;
                  i++;
                  continue;
                }
                const lean = r === 1 && i === 9;
                const c = spines[Math.floor(rand(r * 17 + i * 5.1) * spines.length)];
                const zz = z;
                out.push(
                  <g key={`v${r}-${i}`}>
                    <IsoBox x={x} y={y1 - 0.95} z={zz} w={w} d={0.9} h={lean ? h * 0.9 : h} color={c} u={U} ink={{ stroke: INK, strokeWidth: 0.8 }} />
                    <polyline points={poly([[x + 0.01, y1 - 0.05, zz + h * 0.72], [x + w - 0.01, y1 - 0.05, zz + h * 0.72]])} stroke={shade(c, 0.45)} strokeWidth="1.6" />
                    <polyline points={poly([[x + 0.01, y1 - 0.05, zz + h * 0.22], [x + w - 0.01, y1 - 0.05, zz + h * 0.22]])} stroke={shade(c, -0.35)} strokeWidth="1.2" />
                  </g>,
                );
                x += w + 0.03;
                i++;
              }
            });
            // shelf lips
            rows.forEach((z, r) => {
              out.push(<IsoBox key={`lip${r}`} x={x0 + 0.05} y={y1 - 0.02} z={z - 0.12} w={x1 - x0 - 0.1} d={0.12} h={0.12} color={shade(p.wood, 0.15)} u={U} ink={{ stroke: INK, strokeWidth: 0.8 }} />);
            });
            // crown moulding
            out.push(<IsoBox key="crown" x={x0 - 0.15} y={y0 - 0.15} z={H} w={x1 - x0 + 0.3} d={y1 - y0 + 0.3} h={0.22} color={shade(p.wood, -0.15)} u={U} ink={ink} />);
            // month plaque on the crown front
            out.push(
              <g key="month" transform={onLeft([9.25, y1 + 0.15, H + 0.2])}>
                <text x="0" y="0" fontFamily={FONTS.outfit} fontWeight="800" fontSize="12" letterSpacing="3" fill={p.trim}>
                  ARCHIVE · OCT 2026
                </text>
              </g>,
            );
            // day tab hung on the right side panel
            out.push(
              <g key="tab" transform={onRight([x1, 0.95, 3.7])}>
                <rect x="0" y="-34" width="56" height="44" rx="9" fill={p.paper} stroke={INK} strokeWidth="1.2" />
                <path d="M0,-25 a9,9 0 0 1 9,-9 h38 a9,9 0 0 1 9,9 v1 h-56 Z" fill={p.pop} />
                <text x="28" y="-12" textAnchor="middle" fontFamily={FONTS.outfit} fontWeight="800" fontSize="9" letterSpacing="1.4" fill={INK}>
                  {(p.date.split(' ')[0] ?? '').toUpperCase()}
                </text>
                <text x="28" y="5" textAnchor="middle" fontFamily={FONTS.fraunces} fontWeight="900" fontSize="15" fill={INK}>
                  {p.date.split(' ').slice(1).join(' ')}
                </text>
              </g>,
            );
            return <g>{out}</g>;
          })()}

          {/* lift rails in front of the shelf */}
          {[9.55, 10.45].map((x) => (
            <IsoBox key={x} x={x - 0.06} y={1.3} w={0.12} d={0.12} h={3.6} color={shade(p.brass, -0.2)} u={U} ink={{ stroke: INK, strokeWidth: 0.8 }} />
          ))}
          <IsoBox x={9.4} y={1.25} z={3.6} w={1.2} d={0.22} h={0.16} color={p.machine} u={U} ink={ink} />
          {/* lift carriage rides with the page */}
          <g>
            <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;0 0;0 ${-2.36 * U};0 ${-2.36 * U};0 0`} keyTimes="0;0.84;0.845;0.9;0.95;1" dur={L} {...rep} calcMode="spline" keySplines="0 0 1 1;0 0 1 1;0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1" />
            <IsoBox x={9.45} y={1.3} z={0.72} w={1.1} d={0.75} h={0.06} color={p.brass} u={U} ink={{ stroke: INK, strokeWidth: 0.8 }} />
          </g>

          {/* ── Out-feed belt (to the shelf) ── */}
          <IsoBox x={9.5} y={2} w={1} d={6.6} h={0.72} color={p.machine} u={U} ink={ink} />
          <polygon points={quad(9.58, 2.05, 0.84, 6.5, 0.725)} fill={shade(p.ink, 0.25)} opacity="0.85" />
          <Belt from={[10, 8.55, 0.73]} to={[10, 2.05, 0.73]} p={p} />
          {[3, 4.6, 6.2].map((y) => (
            <circle key={y} cx={S([10.5, y, 0.36])[0]} cy={S([10.5, y, 0.36])[1]} r="5" fill={p.brass} stroke={INK} strokeWidth="1">
              <animate attributeName="r" values="5;4;5" dur="0.5s" begin={`-${y * 0.1}s`} {...rep} />
            </circle>
          ))}
          {/* today's page riding out to the shelf */}
          <g opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.66;0.665;0.94;0.95;1" dur={L} {...rep} />
            <animateTransform attributeName="transform" type="translate" values={pageOnBelt.map((k) => k[1]).join(';')} keyTimes={pageOnBelt.map((k) => k[0]).join(';')} dur={L} {...rep} calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0 0 1 1" />
            <TodayPage p={p} />
          </g>
          {/* filed volume appears in the slot */}
          <g opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.935;0.95;0.985;1" dur={L} {...rep} />
            <IsoBox x={9.86} y={0.25} z={3.25} w={0.28} d={0.95} h={1.05} color={p.pop} u={U} ink={{ stroke: INK, strokeWidth: 0.8 }} />
            <polyline points={poly([[9.87, 1.19, 3.98], [10.13, 1.19, 3.98]])} stroke={p.paper} strokeWidth="2" />
          </g>

          {/* side kit on the right plinth: pipe run + valve + pressure gauge */}
          <g>
            {/* placed forward of the belt's sightline so it never hides today's page */}
            <IsoCylinder x={11.9} y={7.4} r={0.38} h={1.3} color={p.brass} u={U} ink={ink} />
            <polyline points={poly([[11.9, 7.4, 1.0], [11.9, 8.4, 1.0], [11.9, 8.4, 0]])} stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
            <polyline points={poly([[11.9, 7.4, 1.0], [11.9, 8.4, 1.0], [11.9, 8.4, 0]])} stroke={shade(p.brass, 0.2)} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {(() => {
              const [vx, vy] = S([11.9, 8.0, 1.0]);
              return <ellipse cx={vx} cy={vy} rx="7" ry="4" fill="none" stroke={p.pop} strokeWidth="2.5" />;
            })()}
            {(() => {
              const [gx, gy] = S([11.9, 7.4, 1.65]);
              return (
                <g transform={`translate(${gx} ${gy - 8})`}>
                  <circle r="13" fill={p.paper} stroke={INK} strokeWidth="1.6" />
                  <path d="M-8,4 A9,9 0 1 1 8,4" fill="none" stroke={p.stripe1} strokeWidth="2.5" />
                  <g>
                    <animateTransform attributeName="transform" type="rotate" values="-60;-60;70;10;-60" keyTimes={`0;${HIT - 0.02};${HIT + 0.02};${HIT + 0.2};1`} dur={L} {...rep} />
                    <line x1="0" y1="0" x2="0" y2="-9" stroke={p.pop} strokeWidth="2" strokeLinecap="round" />
                  </g>
                  <circle r="2" fill={INK} />
                </g>
              );
            })()}
            {/* yesterday's volumes waiting to be shelved */}
            <IsoBox x={11.3} y={3.2} w={0.9} d={0.65} h={0.22} color={p.machine} u={U} ink={ink} />
            <IsoBox x={11.35} y={3.25} z={0.22} w={0.82} d={0.6} h={0.2} color={p.brass} u={U} ink={ink} />
            <IsoBox x={11.3} y={3.2} z={0.42} w={0.9} d={0.65} h={0.2} color={p.trim} u={U} ink={ink} />
          </g>

          {/* ── Scout's observatory ── */}
          <g>
            <IsoBox x={0.2} y={8.45} w={1.4} d={1.0} h={0.3} color={p.trim} u={U} ink={ink} />
            <IsoCylinder x={0.9} y={8.95} z={0.3} r={0.55} h={1.9} color={p.trim} u={U} ink={ink} />
            {[p.stripe1, p.stripe2, p.stripe3].map((c, i) => {
              const [bx, by] = S([0.9, 8.95, 1.15 + i * 0.2]);
              const rx = 0.55 * U * 1.2247;
              const ry = 0.55 * U * 0.7071;
              return <path key={i} d={`M${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${bx + rx},${by - 6} A${rx},${ry} 0 0 1 ${bx - rx},${by - 6} Z`} fill={c} />;
            })}
            {(() => {
              const [dx, dy] = S([0.9, 8.95, 2.2]);
              const rx = 0.55 * U * 1.2247;
              return (
                <g>
                  <path d={`M${dx - rx},${dy} A${rx},${rx * 0.95} 0 0 1 ${dx + rx},${dy} Z`} fill={shade(p.machine, 0.05)} stroke={INK} strokeWidth="1.2" />
                  <path d={`M${dx - 4},${dy - rx * 0.93} L${dx + 4},${dy - rx * 0.93} L${dx + 5},${dy} L${dx - 5},${dy} Z`} fill={shade(p.machine, -0.35)} />
                  {/* telescope sweeping toward the sources */}
                  <g transform={`translate(${dx} ${dy - 18})`}>
                    <g>
                      <animateTransform attributeName="transform" type="rotate" values="-160;-205;-160" dur="4s" {...rep} {...spline} />
                      <rect x="-14" y="-6" width="16" height="12" rx="4" fill={shade(p.brass, -0.2)} stroke={INK} strokeWidth="1.6" />
                      <rect x="-2" y="-9" width="56" height="18" rx="6" fill={p.brass} stroke={INK} strokeWidth="1.8" />
                      <rect x="48" y="-13" width="14" height="26" rx="4" fill={shade(p.brass, -0.3)} stroke={INK} strokeWidth="1.8" />
                      <rect x="10" y="-9" width="5" height="18" fill={shade(p.brass, -0.35)} />
                      <rect x="2" y="-6" width="40" height="4" rx="2" fill="#FFFFFF" opacity="0.35" />
                    </g>
                    <circle r="5" fill={INK} />
                  </g>
                  <circle cx={dx} cy={dy - 18} r="20" fill={p.stripe2} opacity="0">
                    <animate attributeName="opacity" values="0;0.25;0" dur="2s" {...rep} />
                  </circle>
                </g>
              );
            })()}
            <g transform={onLeft([0.3, 9.45, 0.08])}>
              <text x="0" y="0" fontFamily={FONTS.outfit} fontWeight="800" fontSize="9.5" letterSpacing="1.8" fill={INK}>
                SCOUT
              </text>
            </g>
          </g>

          {/* back post of the FeedX gantry */}
          <IsoBox x={4.5} y={9.1} w={0.22} d={0.22} h={2.3} color={p.machine} u={U} ink={ink} />

          {/* ── In-feed belt ── */}
          <IsoBox x={1.3} y={9.5} w={7.4} d={1} h={0.72} color={p.machine} u={U} ink={ink} />
          <polygon points={quad(1.35, 9.58, 7.3, 0.84, 0.725)} fill={shade(p.ink, 0.25)} opacity="0.85" />
          <Belt from={[1.4, 10, 0.73]} to={[8.7, 10, 0.73]} p={p} />
          {[2.4, 3.8, 6.8, 7.9].map((x) => {
            const [rx, ry] = S([x, 10.5, 0.36]);
            return (
              <g key={x}>
                <circle cx={rx} cy={ry} r="5" fill={p.brass} stroke={INK} strokeWidth="1" />
                <line x1={rx - 3.5} y1={ry} x2={rx + 3.5} y2={ry} stroke={INK} strokeWidth="1.2">
                  <animateTransform attributeName="transform" type="rotate" values={`0 ${rx} ${ry};360 ${rx} ${ry}`} dur="0.5s" {...rep} />
                </line>
              </g>
            );
          })}
          <g transform={onLeft([2.6, 10.5, 0.2])}>
            <text x="0" y="0" fontFamily={FONTS.outfit} fontWeight="800" fontSize="10" letterSpacing="2" fill={p.trim}>
              GATHER
            </text>
          </g>

          {/* reject chute + sieve bin (interior first) */}
          <polygon points={poly([[5.15, 10.5, 0.66], [5.95, 10.5, 0.66], [5.95, 11.05, 0.42], [5.15, 11.05, 0.42]])} fill={shade(p.trim, -0.2)} stroke={INK} strokeWidth="1" />
          <polygon points={quad(4.95, 11.05, 1.25, 1.05, 0.6)} fill={shade(p.ink, 0.15)} stroke={INK} strokeWidth="1" />

          {/* cards on the belt: kept (chip turns matcha at the scanner) and rejected (dims, slides to the bin) */}
          {[0, -2.67].map((b) => (
            <g key={`k${b}`} opacity="0">
              <animateTransform attributeName="transform" type="translate" values={keptPath} dur="4s" begin={`${b}s`} {...rep} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.94;1" dur="4s" begin={`${b}s`} {...rep} />
              <Card
                p={p}
                chip={
                  <polygon points={poly([[0.12, 0.1, 0], [0.3, 0.1, 0], [0.3, 0.22, 0], [0.12, 0.22, 0]])} fill={shade(p.ink, 0.6)}>
                    <animate attributeName="fill" values={`${shade(p.ink, 0.6)};${shade(p.ink, 0.6)};${p.stripe1};${p.stripe1}`} keyTimes="0;0.43;0.44;1" dur="4s" begin={`${b}s`} {...rep} />
                  </polygon>
                }
              />
            </g>
          ))}
          {[-1.33].map((b) => (
            <g key={`r${b}`} opacity="0">
              <animateTransform attributeName="transform" type="translate" values={rejPath} keyTimes="0;0.53;0.66;1" dur="4s" begin={`${b}s`} {...rep} />
              <animate attributeName="opacity" values="0;1;1;0.55;0;0" keyTimes="0;0.06;0.44;0.5;0.68;1" dur="4s" begin={`${b}s`} {...rep} />
              <Card p={p} chip={<polygon points={poly([[0.12, 0.1, 0], [0.3, 0.1, 0], [0.3, 0.22, 0], [0.12, 0.22, 0]])} fill={shade(p.ink, 0.6)} />} />
            </g>
          ))}

          {/* bin front walls + sieve mesh */}
          <polygon points={poly([[4.95, 12.1, 0], [6.2, 12.1, 0], [6.2, 12.1, 0.6], [4.95, 12.1, 0.6]])} fill={shade(p.trim, -0.3)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points={poly([[6.2, 11.05, 0], [6.2, 12.1, 0], [6.2, 12.1, 0.6], [6.2, 11.05, 0.6]])} fill={shade(p.trim, -0.15)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <g stroke={shade(p.trim, -0.5)} strokeWidth="0.9">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((t) => (
              <polyline key={t} points={poly([[4.95 + t * 1.25, 12.1, 0.08], [4.95 + t * 1.25, 12.1, 0.52]])} fill="none" />
            ))}
          </g>
          <g transform={onLeft([5.05, 12.1, 0.18])}>
            <text x="0" y="0" fontFamily={FONTS.outfit} fontWeight="800" fontSize="9" letterSpacing="1.4" fill={INK}>
              SKIP
            </text>
          </g>

          {/* hopper where gathered articles fall onto the belt */}
          {(() => {
            const [hx, hy] = hopper;
            const [ox, oy] = S([1.9, 10, 1.25]);
            return (
              <g>
                <line x1={ox - 16} y1={oy} x2={ox - 16} y2={oy + 18} stroke={INK} strokeWidth="2" />
                <line x1={ox + 16} y1={oy} x2={ox + 16} y2={oy + 18} stroke={INK} strokeWidth="2" />
                <path d={`M${hx - 34},${hy} L${hx + 34},${hy} L${ox + 12},${oy} L${ox - 12},${oy} Z`} fill={p.trim} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
                <ellipse cx={hx} cy={hy} rx="34" ry="11" fill={shade(p.ink, 0.2)} stroke={INK} strokeWidth="1.2" />
                <path d={`M${hx - 34},${hy + 9} L${hx + 34},${hy + 9}`} stroke={p.stripe2} strokeWidth="4" />
              </g>
            );
          })()}

          {/* ── FeedX scorer gantry (front post, beam, dial, scan curtain) ── */}
          <polygon points={poly([[4.62, 9.25, 0.74], [4.62, 10.8, 0.74], [4.62, 10.8, 2.2], [4.62, 9.25, 2.2]])} fill={p.stripe2} opacity="0.16">
            <animate attributeName="opacity" values="0.08;0.28;0.08" dur="1s" {...rep} />
          </polygon>
          <polyline points={poly([[4.62, 9.3, 0.8], [4.62, 10.75, 0.8]])} stroke={p.stripe2} strokeWidth="2.5" opacity="0.9">
            <animateTransform attributeName="transform" type="translate" values={`0 0;0 ${-1.3 * U};0 0`} dur="1s" {...rep} {...spline} />
          </polyline>
          <IsoBox x={4.5} y={10.75} w={0.22} d={0.22} h={2.3} color={p.machine} u={U} ink={ink} />
          <IsoBox x={4.4} y={9.0} z={2.3} w={0.42} d={2.07} h={0.42} color={p.machine} u={U} ink={ink} />
          <g transform={onLeft([4.25, 11.08, 2.37])}>
            <text x="0" y="0" fontFamily={FONTS.outfit} fontWeight="800" fontSize="10" letterSpacing="1.5" fill={p.trim}>
              FEEDX
            </text>
          </g>
          {/* score dial on the front post */}
          {(() => {
            const [cx, cy] = S([4.61, 10.98, 3.25]);
            return (
              <g>
                <line x1={cx} y1={cy} x2={cx} y2={cy + 22} stroke={INK} strokeWidth="2" />
                <circle cx={cx} cy={cy} r="24" fill={p.paper} stroke={INK} strokeWidth="1.8" />
                <path d={`M${cx - 17},${cy + 6} A18,18 0 0 1 ${cx - 6},${cy - 17}`} fill="none" stroke={shade(p.ink, 0.6)} strokeWidth="4" />
                <path d={`M${cx - 6},${cy - 17} A18,18 0 0 1 ${cx + 9},${cy - 15.6}`} fill="none" stroke={p.stripe2} strokeWidth="4" />
                <path d={`M${cx + 9},${cy - 15.6} A18,18 0 0 1 ${cx + 17},${cy + 6}`} fill="none" stroke={p.stripe1} strokeWidth="4" />
                <g>
                  <animateTransform attributeName="transform" type="rotate" values={`50 ${cx} ${cy};50 ${cx} ${cy};-55 ${cx} ${cy};-55 ${cx} ${cy};60 ${cx} ${cy};50 ${cx} ${cy}`} keyTimes="0;0.2;0.35;0.55;0.7;1" dur="1.333s" {...rep} />
                </g>
                <g>
                  <animateTransform attributeName="transform" type="rotate" values={`45 ${cx} ${cy};62 ${cx} ${cy};45 ${cx} ${cy};-60 ${cx} ${cy};-48 ${cx} ${cy};55 ${cx} ${cy};45 ${cx} ${cy}`} keyTimes="0;0.12;0.33;0.4;0.6;0.7;1" dur="4s" begin="-0.4s" {...rep} />
                  <line x1={cx} y1={cy} x2={cx} y2={cy - 17} stroke={p.pop} strokeWidth="2.5" strokeLinecap="round" />
                </g>
                <circle cx={cx} cy={cy} r="3" fill={INK} />
                <text x={cx} y={cy + 15} textAnchor="middle" fontFamily={FONTS.outfit} fontWeight="800" fontSize="7.5" letterSpacing="1" fill={INK}>
                  SCORE
                </text>
              </g>
            );
          })()}
          {/* tally tag hanging from the beam */}
          <g transform={onLeft([5.0, 11.07, 2.25])}>
            <line x1="8" y1="0" x2="8" y2="12" stroke={INK} strokeWidth="1" />
            <rect x="0" y="12" width={p.tally.length * 6.1 + 16} height="20" rx="10" fill={p.paper} stroke={INK} strokeWidth="1.1" />
            <text x="8" y="26" fontFamily={FONTS.outfit} fontWeight="800" fontSize="10.5" letterSpacing="0.4" fill={INK}>
              {p.tally}
            </text>
          </g>

          {/* paper bundles + bonsai on the front plinth */}
          <g>
            {[0, 1, 2].map((k) => (
              <IsoBox key={k} x={2.2 + (k % 2) * 0.06} y={11.1} z={k * 0.22} w={1.0} d={0.75} h={0.22} color={k === 1 ? shade(p.paper, -0.08) : p.paper} u={U} ink={{ stroke: INK, strokeWidth: 0.9 }} />
            ))}
            <polyline points={poly([[2.75, 11.85, 0], [2.75, 11.85, 0.66], [2.75, 11.1, 0.66]])} stroke={p.pop} strokeWidth="2" fill="none" />
            <IsoBox x={0.5} y={11.2} w={0.7} d={0.7} h={0.35} color={p.wood} u={U} ink={ink} />
            {(() => {
              const [tx, ty] = S([0.85, 11.55, 0.35]);
              return (
                <g stroke={INK} strokeWidth="1.1">
                  <path d={`M${tx},${ty} C${tx - 2},${ty - 14} ${tx + 10},${ty - 18} ${tx + 6},${ty - 30}`} fill="none" stroke="#6E4A32" strokeWidth="3.5" />
                  <ellipse cx={tx - 8} cy={ty - 26} rx="15" ry="8" fill={shade(p.stripe1, -0.15)} />
                  <ellipse cx={tx + 10} cy={ty - 34} rx="14" ry="7" fill={p.stripe1} />
                  <ellipse cx={tx + 2} cy={ty - 44} rx="11" ry="6" fill={shade(p.stripe1, 0.15)} />
                </g>
              );
            })()}
            {/* reading lamp */}
            {(() => {
              const [lx, ly] = S([3.9, 11.9, 0]);
              const [hx, hy] = S([3.9, 11.9, 1.9]);
              return (
                <g>
                  <ellipse cx={lx} cy={ly} rx="46" ry="24" fill="url(#dp-pool)" opacity={night ? 1 : 0.5}>
                    <animate attributeName="opacity" values={night ? '0.85;1;0.85' : '0.4;0.55;0.4'} dur="2s" {...rep} />
                  </ellipse>
                  <IsoCylinder x={3.9} y={11.9} r={0.22} h={0.08} color={INK} u={U} ink={ink} />
                  <line x1={lx} y1={ly - 3} x2={hx} y2={hy} stroke={INK} strokeWidth="2.5" />
                  <circle cx={hx} cy={hy + 6} r="12" fill="#FFD66B" opacity={night ? 0.6 : 0.3} filter="url(#dp-glow)" />
                  <path d={`M${hx - 12},${hy + 6} L${hx - 6},${hy - 6} L${hx + 6},${hy - 6} L${hx + 12},${hy + 6} Z`} fill={p.stripe2} stroke={INK} strokeWidth="1.2" />
                </g>
              );
            })()}
          </g>

          {/* ── domdistill press (focal) ── */}
          <g>
            {/* base */}
            <IsoBox x={8.6} y={8.6} w={2.8} d={2.8} h={1.4} color={p.machine} u={U} ink={ink} />
            {[p.stripe1, p.stripe2, p.stripe3].map((c, i) => {
              const a = 0.32 + i * 0.16;
              const b = a + 0.1;
              return (
                <g key={i}>
                  <polygon points={poly([[8.6, 11.4, a], [11.4, 11.4, a], [11.4, 11.4, b], [8.6, 11.4, b]])} fill={shade(c, 0.05)} stroke={INK} strokeOpacity="0.3" strokeWidth="0.6" />
                  <polygon points={poly([[11.4, 8.6, a], [11.4, 11.4, a], [11.4, 11.4, b], [11.4, 8.6, b]])} fill={shade(c, -0.1)} stroke={INK} strokeOpacity="0.3" strokeWidth="0.6" />
                </g>
              );
            })}
            <IsoBox x={8.5} y={8.5} z={1.4} w={3} d={3} h={0.12} color={p.trim} u={U} ink={ink} />
            <g transform={onLeft([8.85, 11.4, 1.12])}>
              <text x="0" y="0" fontFamily={FONTS.outfit} fontWeight="800" fontSize="11" letterSpacing="2.6" fill={p.trim}>
                DOMDISTILL
              </text>
            </g>
            <Gear at={[11.4, 9.35, 0.95]} face="right" r={13} dur={2} p={p} />
            <Gear at={[11.4, 10.15, 0.68]} face="right" r={9} dur={1} rev p={p} />
            {/* rivets */}
            {[8.75, 11.25].map((a) => (
              <circle key={a} cx={S([a, 11.4, 1.25])[0]} cy={S([a, 11.4, 1.25])[1]} r="2" fill={p.trim} />
            ))}

            {/* back columns */}
            <IsoBox x={8.6} y={8.6} z={1.52} w={0.4} d={0.4} h={2.4} color={shade(p.machine, -0.1)} u={U} ink={ink} />

            {/* bed: the gathered pile, then today's clean page */}
            <g transform={`translate(${bed[0]} ${bed[1] + 0.12 * U * -1})`}>
              <g>
                <animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes={`0;${HIT};${HIT + 0.001};0.78;0.95;1`} dur={L} {...rep} />
                {[0, 1, 2, 3].map((k) => (
                  <g key={k} transform={`translate(${(rand(k * 3.3) - 0.5) * 18} ${-k * 3 + (rand(k * 9.1) - 0.5) * 8}) rotate(${(rand(k * 4.7) - 0.5) * 40})`}>
                    <Card p={p} w={0.8} d={0.6} />
                  </g>
                ))}
              </g>
              <g opacity="0">
                <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${HIT};${HIT + 0.001};0.64;0.66;1`} dur={L} {...rep} />
                <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;0 0;${(-0.9 * C30 * U).toFixed(1)} ${(-0.45 * U).toFixed(1)};${(-0.9 * C30 * U).toFixed(1)} ${(-0.45 * U).toFixed(1)}`} keyTimes={`0;${HIT};0.6;0.66;1`} dur={L} {...rep} />
                <TodayPage p={p} big />
              </g>
            </g>

            {/* ram + piston rod */}
            <g>
              <animateTransform attributeName="transform" type="translate" values={`0 ${-1.5 * U};0 ${-1.5 * U};0 ${-1.7 * U};0 0;0 0;0 ${-1.5 * U};0 ${-1.5 * U}`} keyTimes={`0;0.44;0.5;${HIT};0.585;0.7;1`} dur={L} {...rep} calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0.7 0 1 1;0 0 1 1;0.3 0 0.3 1;0 0 1 1" />
              {(() => {
                const [rx, ry] = S([10, 10, 1.9]);
                return <rect x={rx - 9} y={ry - 2.2 * U} width="18" height={2.2 * U} fill={shade(p.trim, -0.25)} stroke={INK} strokeWidth="1.2" />;
              })()}
              <IsoBox x={9.15} y={9.15} z={1.56} w={1.7} d={1.7} h={0.42} color={p.brass} u={U} ink={ink} />
              <polygon points={poly([[9.15, 10.85, 1.68], [10.85, 10.85, 1.68], [10.85, 10.85, 1.76], [9.15, 10.85, 1.76]])} fill={shade(p.brass, 0.35)} />
            </g>

            {/* front columns */}
            <IsoBox x={8.6} y={11.0} z={1.52} w={0.4} d={0.4} h={2.4} color={p.machine} u={U} ink={ink} />
            <IsoBox x={11.0} y={8.6} z={1.52} w={0.4} d={0.4} h={2.4} color={p.machine} u={U} ink={ink} />
            {/* crown */}
            <IsoBox x={8.45} y={8.45} z={3.9} w={3.1} d={3.1} h={0.75} color={p.machine} u={U} ink={ink} />
            <IsoBox x={8.35} y={8.35} z={4.65} w={3.3} d={3.3} h={0.14} color={p.trim} u={U} ink={ink} />
            {/* window lamp on the crown face */}
            {(() => {
              const [wx, wy] = S([11.55, 10.0, 4.27]);
              return (
                <circle cx={wx} cy={wy} r="7" fill={p.pop} stroke={INK} strokeWidth="1.1">
                  <animate attributeName="opacity" values="0.55;0.55;1;1;0.55;0.55" keyTimes={`0;0.44;0.46;${HIT + 0.05};${HIT + 0.15};1`} dur={L} {...rep} />
                </circle>
              );
            })()}
            {/* steam vent puffs after each stamp */}
            {[0, 1, 2].map((k) => {
              const [vx, vy] = S([9.0, 9.0, 4.8]);
              const b = `${k * 0.08}s`;
              return (
                <circle key={k} cx={vx} cy={vy} r="5" fill="#FFFFFF" opacity="0">
                  <animate attributeName="cy" values={`${vy};${vy};${vy - 70}`} keyTimes={`0;${HIT};1`} dur={L} begin={b} {...rep} />
                  <animate attributeName="cx" values={`${vx};${vx};${vx - 30 + k * 12}`} keyTimes={`0;${HIT};1`} dur={L} begin={b} {...rep} />
                  <animate attributeName="r" values="4;4;18" keyTimes={`0;${HIT};1`} dur={L} begin={b} {...rep} />
                  <animate attributeName="opacity" values="0;0;0.75;0" keyTimes={`0;${HIT};${HIT + 0.05};1`} dur={L} begin={b} {...rep} />
                </circle>
              );
            })}
            <IsoCylinder x={9.0} y={9.0} z={4.79} r={0.16} h={0.4} color={p.brass} u={U} ink={ink} />
            {/* marquee sign on the crown */}
            <g>
              <polygon points={poly([[7.9, 11.55, 4.8], [12.1, 11.55, 4.8], [12.1, 11.55, 5.95], [7.9, 11.55, 5.95]])} fill={p.paper} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
              <polygon points={poly([[7.9, 11.55, 4.8], [12.1, 11.55, 4.8], [12.1, 11.55, 4.92], [7.9, 11.55, 4.92]])} fill={p.stripe2} />
              <g transform={onLeft([10.0, 11.55, 5.13])}>
                <text x="-6" y="0" textAnchor="middle" fontFamily={FONTS.shrikhand} fontSize={p.sign.length > 9 ? 22 : 28} fill={p.machine} stroke={INK} strokeWidth="0.6" paintOrder="stroke">
                  {p.sign}
                </text>
              </g>
              <circle cx={S([11.8, 11.55, 5.62])[0]} cy={S([11.8, 11.55, 5.62])[1]} r="5" fill={p.pop}>
                <animate attributeName="r" values="5;5;8;5;5" keyTimes={`0;${HIT};${HIT + 0.03};${HIT + 0.15};1`} dur={L} {...rep} />
              </circle>
            </g>
          </g>

          {/* ── The moment: stamp flash, shock ring, sparks ── */}
          <g transform={`translate(${bed[0]} ${bed[1] - 6})`}>
            <circle r="90" fill="url(#dp-flash)" opacity="0">
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={`0;${HIT};${HIT + 0.006};${HIT + 0.1};1`} dur={L} {...rep} />
            </circle>
            <ellipse rx="70" ry="35" fill="none" stroke={p.stripe2} strokeWidth="4" opacity="0">
              <animate attributeName="rx" values="70;70;70;170;170" keyTimes={`0;${HIT};${HIT + 0.001};${HIT + 0.11};1`} dur={L} {...rep} />
              <animate attributeName="ry" values="35;35;35;85;85" keyTimes={`0;${HIT};${HIT + 0.001};${HIT + 0.11};1`} dur={L} {...rep} />
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={`0;${HIT};${HIT + 0.001};${HIT + 0.11};1`} dur={L} {...rep} />
            </ellipse>
            {Array.from({ length: 7 }, (_, k) => {
              const ang = Math.PI + (k / 6) * Math.PI;
              const dx = Math.cos(ang) * (90 + (k % 2) * 30);
              const dy = Math.sin(ang) * (60 + (k % 2) * 20);
              return (
                <path key={k} d="M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z" fill={[p.stripe2, p.pop, p.paper][k % 3]} stroke={INK} strokeOpacity="0.4" strokeWidth="0.6" opacity="0">
                  <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;${dx} ${dy};${dx} ${dy}`} keyTimes={`0;${HIT};${HIT + 0.1};1`} dur={L} {...rep} calcMode="spline" keySplines="0 0 1 1;0.16 1 0.3 1;0 0 1 1" />
                  <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${HIT};${HIT + 0.005};${HIT + 0.07};${HIT + 0.12};1`} dur={L} {...rep} />
                </path>
              );
            })}
          </g>

          {/* articles fluttering from the source towers into Scout's hopper */}
          {towers.flatMap((t, i) => {
            const [sx, sy] = S([t.x, t.y, t.h]);
            const [hx, hy] = hopper;
            const midX = (sx + hx) / 2;
            const midY = Math.min(sy, hy) - 70 - i * 10;
            const path = `M${sx.toFixed(1)},${(sy - 6).toFixed(1)} Q${midX.toFixed(1)},${midY.toFixed(1)} ${hx.toFixed(1)},${(hy - 4).toFixed(1)}`;
            return [0, 1].map((k) => <Sheet key={`${i}-${k}`} p={p} path={path} dur={4} begin={-(i * 1.3 + k * 2)} k={i * 2 + k} />);
          })}
        </g>
      </g>
    </svg>
  );
}

/** Today's distilled page: sunrise-stripe header, clean text lines, persimmon "today" dot. */
function TodayPage({ p, big }: { p: P; big?: boolean }) {
  const w = big ? 1.25 : 0.82;
  const d = big ? 0.95 : 0.62;
  const c = (a: number, b: number): P3 => [a, b, 0];
  const sw = big ? 2.2 : 1.6;
  return (
    <g>
      <polygon points={poly([c(-w / 2, -d / 2), c(w / 2, -d / 2), c(w / 2, d / 2), c(-w / 2, d / 2)])} fill={p.paper} stroke={p.ink} strokeWidth="1.2" strokeLinejoin="round" />
      {[p.stripe1, p.stripe2, p.stripe3].map((col, i) => (
        <polyline key={i} points={poly([c(-w / 2 + 0.08, -d / 2 + 0.1 + i * (big ? 0.08 : 0.055)), c(w / 2 - 0.08, -d / 2 + 0.1 + i * (big ? 0.08 : 0.055))])} stroke={col} strokeWidth={sw * 1.3} />
      ))}
      {[0.05, 0.17, 0.29].map((b, i) => (
        <polyline key={b} points={poly([c(-w / 2 + 0.1, b * (big ? 1 : 0.7)), c(w / 2 - (i === 2 ? 0.45 : 0.12), b * (big ? 1 : 0.7))])} stroke={p.ink} strokeOpacity="0.45" strokeWidth={sw} strokeLinecap="round" />
      ))}
      {(() => {
        const [dx, dy] = S([w / 2 - 0.15, d / 2 - 0.13, 0]);
        return <circle cx={dx} cy={dy} r={big ? 4.5 : 3} fill={p.pop} />;
      })()}
    </g>
  );
}
