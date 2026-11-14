import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Plotter Desk',
  description:
    'Landing-page hero for Plotwell: an isometric drafting studio where a pen plotter draws the media plan from a brief, finished ad cards fly into a cabinet of platform slots, and a yellow LIVE stamp lands once per loop. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'blueprint', 'process', 'animated svg'],
};

// Every SMIL dur divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  stamp: text('Stamp word').default('LIVE'),
  slots: text('Platform slots (comma separated, 6)').default('meta, google, tiktok, youtube, linkedin, reddit'),
  wall: color('Wall').default('#0F3B8C'),
  floor: color('Floor').default('#134AA8'),
  table: color('Table & cabinet').default('#E4ECFA'),
  paper: color('Plan sheet').default('#1C5BCB'),
  line: color('Linework').default('#EAF2FF'),
  accent: color('Secondary').default('#7FB2FF'),
  pop: color('Highlighter').default('#FFDD00'),
  lamp: color('Lamp light').default('#FFF1B8'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night shift': { wall: '#071A42', floor: '#0B2A66', table: '#B9C8E6', paper: '#123F99', accent: '#4F7FD6', lamp: '#FFE08A' },
  whiteprint: { wall: '#EDE8DA', floor: '#DCD5C2', table: '#FAF8F2', paper: '#F4F0E4', line: '#173F9A', accent: '#7A90BF', pop: '#FFD000', lamp: '#FFF6D6' },
  'sepia studio': { wall: '#3B2A22', floor: '#5A4134', table: '#EADBC6', paper: '#6B4A2F', line: '#F6E7CF', accent: '#C9A27A', pop: '#FF9F43', lamp: '#FFD9A0' },
  bauhaus: { wall: '#F2EBDD', floor: '#E4D9C4', table: '#FFFFFF', paper: '#1D4E9E', line: '#F2EBDD', accent: '#D9381E', pop: '#F2B90F', lamp: '#FFF4D0', stamp: 'GO' },
};

type P = z.infer<typeof schema>;

const U = 42;
const LOOP = scene.loop;
const OX = 470;
const OY = 335;
// The main plotting cycle is phase-shifted so t = 0 (the poster) shows the finished,
// stamped plan; the stamp itself slams down at t ≈ 5.8 s.
const MAIN = { dur: `${LOOP}s`, begin: '-4.4s', repeatCount: 'indefinite' } as const;
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(6,16,48,0.6)';
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const quad = (x: number, y: number, w: number, d: number, z: number) => poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]]);
/** Screen offset for a world move (dx, dy, dz). */
const off = (dx: number, dy: number, dz = 0) => {
  const [a, b] = S([dx, dy, dz]);
  return `${a.toFixed(2)} ${b.toFixed(2)}`;
};
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 150;
};

const TOP = 3; // table top height
const SZ = TOP + 0.04; // sheet height

// The plotter route: brief → junction → three platform nodes (retracing through the junction).
const B: [number, number] = [2.2, 3.5];
const J: [number, number] = [5, 3.5];
const NODES: [number, number][] = [
  [8.2, 1.4],
  [8.2, 3.5],
  [8.2, 5.6],
];
const ROUTE: [number, number][] = [B, J, NODES[0], J, NODES[1], J, NODES[2]];
const DRAW_END = 4 / 6; // drawing takes the first 4 s
const HOLD_END = 5.2 / 6;
const routeLens = ROUTE.slice(1).map((pt, i) => Math.hypot(pt[0] - ROUTE[i][0], pt[1] - ROUTE[i][1]));
const total = routeLens.reduce((a, b) => a + b, 0);
const cum = routeLens.reduce<number[]>((acc, l) => [...acc, acc[acc.length - 1] + l], [0]);
const keyT = [...cum.map((c) => (c / total) * DRAW_END), HOLD_END, 1];
const keyTimes = keyT.map((k) => k.toFixed(4)).join(';');
const gantryVals = [...ROUTE.map(([x]) => off(x, 0)), off(ROUTE[ROUTE.length - 1][0], 0), off(B[0], 0)].join(';');
const carriageVals = [...ROUTE.map(([, y]) => off(0, y)), off(0, ROUTE[ROUTE.length - 1][1]), off(0, B[1])].join(';');
const dashVals = [...cum.map((c) => (1 - c / total).toFixed(4)), '0', '0'].join(';');

function Shadow({ ps, blur = true }: { ps: P3[]; blur?: boolean }) {
  return <polygon points={poly(ps)} fill="#020a22" opacity="0.32" filter={blur ? 'url(#pd-blur)' : undefined} />;
}

/** Text lying on the table top, running along +x. */
function TopText({ at, size, fill, children, weight = 400, family = "'Major Mono Display', monospace" }: { at: P3; size: number; fill: string; children: ReactNode; weight?: number; family?: string }) {
  const [x, y] = S(at);
  return (
    <g transform={`translate(${x} ${y}) matrix(${C30} 0.5 ${-C30} 0.5 0 0)`}>
      <text fontFamily={family} fontSize={size} fontWeight={weight} fill={fill} textAnchor="middle">
        {children}
      </text>
    </g>
  );
}

/** Text on a left-type face (plane y = const), running along +x. */
function FaceText({ at, size, fill, children }: { at: P3; size: number; fill: string; children: ReactNode }) {
  const [x, y] = S(at);
  return (
    <g transform={`translate(${x} ${y}) matrix(${C30} 0.5 0 1 0 0)`}>
      <text fontFamily="'Major Mono Display', monospace" fontSize={size} fill={fill} textAnchor="middle">
        {children}
      </text>
    </g>
  );
}

export default function PlotterDesk(p: P) {
  const light = isLight(p.wall);
  const slotNames = p.slots
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  while (slotNames.length < 6) slotNames.push('');
  const lineOp = 0.95;

  // Cabinet of platform slots, front-right on the floor.
  const cab = { x: 11.6, y: 2.2, w: 5.4, d: 1.6, h: 4.4 };
  const slot = (i: number) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const a = cab.x + 0.35 + col * 1.6;
    const z = cab.h - 0.55 - row * 1.9 - 1.15;
    return { a, z, w: 1.35, h: 1.15 };
  };
  const front = cab.y + cab.d;
  const [stX, stY] = S([3.7, 5.3, SZ]);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="pd-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, -0.25)} />
          <stop offset="1" stopColor={shade(p.wall, 0.06)} />
        </linearGradient>
        <radialGradient id="pd-cone" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor={p.lamp} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.lamp} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pd-pool">
          <stop offset="0" stopColor={p.lamp} stopOpacity="0.4" />
          <stop offset="1" stopColor={p.lamp} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pd-pop">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
        <pattern id="pd-grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M80 0H0V80" fill="none" stroke={p.accent} strokeOpacity={light ? 0.25 : 0.18} strokeWidth="1" />
        </pattern>
        <filter id="pd-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="pd-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Room ── */}
      <rect width="1200" height="900" fill="url(#pd-wall)" />
      <g transform={`translate(${OX} ${OY})`}>
        {/* back walls: plane y = -3 (right) and x = -5 (left) */}
        <polygon points={poly([[-5, -3, 0], [22, -3, 0], [22, -3, 16], [-5, -3, 16]])} fill={p.wall} />
        <polygon points={poly([[-5, -3, 0], [-5, 12, 0], [-5, 12, 16], [-5, -3, 16]])} fill={shade(p.wall, -0.12)} />
        <polygon points={poly([[-5, -3, 0], [22, -3, 0], [22, -3, 16], [-5, -3, 16]])} fill="url(#pd-grid)" />
        {/* skirting */}
        <polygon points={poly([[-5, -3, 0], [22, -3, 0], [22, -3, 0.35], [-5, -3, 0.35]])} fill={shade(p.wall, -0.3)} />
        <polygon points={poly([[-5, -3, 0], [-5, 12, 0], [-5, 12, 0.35], [-5, -3, 0.35]])} fill={shade(p.wall, -0.38)} />
        {/* floor */}
        <polygon points={quad(-5, -3, 27, 15, 0)} fill={p.floor} />
        <g stroke={shade(p.floor, -0.2)} strokeWidth="1" opacity="0.6">
          {Array.from({ length: 14 }, (_, i) => (
            <polyline key={`f${i}`} points={poly([[-5 + i * 2, -3, 0], [-5 + i * 2, 12, 0]])} fill="none" />
          ))}
          {Array.from({ length: 8 }, (_, j) => (
            <polyline key={`g${j}`} points={poly([[-5, -3 + j * 2, 0], [22, -3 + j * 2, 0]])} fill="none" />
          ))}
        </g>

        {/* pinned plan on the right wall */}
        <g transform={`translate(0 ${1.8 * U})`}>
          <polygon points={poly([[8, -3, 6.2], [14, -3, 6.2], [14, -3, 10.2], [8, -3, 10.2]])} fill={shade(p.paper, 0.05)} stroke={INK} strokeWidth="1.2" />
          <polygon points={poly([[8.3, -3, 6.5], [13.7, -3, 6.5], [13.7, -3, 9.9], [8.3, -3, 9.9]])} fill="none" stroke={p.line} strokeOpacity="0.6" strokeWidth="1" />
          <polyline points={poly([[9, -3, 7.2], [10.4, -3, 8.9], [11.6, -3, 7.8], [13, -3, 9.3]])} fill="none" stroke={p.line} strokeWidth="1.8" />
          <polyline points={poly([[9, -3, 7.2], [13, -3, 7.2]])} fill="none" stroke={p.line} strokeOpacity="0.5" strokeWidth="1" />
          <polygon points={poly([[11.9, -3, 6.5], [13.7, -3, 6.5], [13.7, -3, 7.2], [11.9, -3, 7.2]])} fill="none" stroke={p.line} strokeOpacity="0.7" strokeWidth="1" />
          {[
            [8.3, 9.9],
            [13.7, 9.9],
          ].map(([x, z], i) => {
            const [px, py] = S([x, -3, z]);
            return <circle key={i} cx={px} cy={py} r="4" fill={p.pop} stroke={INK} strokeWidth="1" />;
          })}
        </g>

        {/* wall clock on the left wall: the minute hand sweeps once per loop */}
        {(() => {
          const [cx, cy] = S([-5, 4.5, 5.6]);
          return (
            <g transform={`translate(${cx} ${cy}) matrix(${C30} -0.5 0 1 0 0)`}>
              <circle r="34" fill={shade(p.table, -0.05)} stroke={INK} strokeWidth="1.5" />
              <circle r="28" fill="none" stroke={shade(p.table, -0.3)} strokeWidth="1" />
              {Array.from({ length: 12 }, (_, i) => (
                <line key={i} x1="0" y1="-24" x2="0" y2={i % 3 ? -21 : -18} stroke={INK} strokeWidth={i % 3 ? 1 : 2} transform={`rotate(${i * 30})`} />
              ))}
              <line x1="0" y1="0" x2="0" y2="-14" stroke={INK} strokeWidth="3" strokeLinecap="round" transform="rotate(300)" />
              <line x1="0" y1="4" x2="0" y2="-22" stroke={p.pop} strokeWidth="2" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur={`${LOOP}s`} repeatCount="indefinite" />
              </line>
              <circle r="2.5" fill={INK} />
            </g>
          );
        })()}

        {/* ── Shadows on the floor ── */}
        <Shadow ps={[[0, 7, 0], [10, 7, 0], [11.5, 9, 0], [1.5, 9, 0]]} />
        <Shadow ps={[[cab.x, front, 0], [cab.x + cab.w, front, 0], [cab.x + cab.w + 0.8, front + 1.8, 0], [cab.x + 0.8, front + 1.8, 0]]} />

        {/* ── Drafting table: legs, crossbar, top ── */}
        {[
          [0.3, 0.3],
          [9.4, 0.3],
          [0.3, 6.4],
        ].map(([x, y], i) => (
          <IsoBox key={i} x={x} y={y} w={0.3} d={0.3} h={TOP - 0.3} color={shade(p.table, -0.35)} u={U} ink={{ stroke: INK }} />
        ))}
        <IsoBox x={0.45} y={3.3} z={0.9} w={9.1} d={0.2} h={0.2} color={shade(p.table, -0.4)} u={U} ink={{ stroke: INK }} />
        <IsoBox x={9.4} y={6.4} w={0.3} d={0.3} h={TOP - 0.3} color={shade(p.table, -0.35)} u={U} ink={{ stroke: INK }} />

        {/* brief feeder ledge on the left */}
        <IsoBox x={-3.4} y={2.6} z={TOP - 0.35} w={3.4} d={1.8} h={0.25} color={shade(p.table, -0.15)} u={U} ink={{ stroke: INK }} />
        <IsoBox x={-3.2} y={3.3} z={0} w={0.25} d={0.25} h={TOP - 0.35} color={shade(p.table, -0.35)} u={U} ink={{ stroke: INK }} />

        <IsoBox x={0} y={0} z={TOP - 0.3} w={10} d={7} h={0.3} color={p.table} u={U} ink={{ stroke: INK }} />
        {/* the sheet */}
        <polygon points={quad(0.5, 0.45, 9, 6.1, SZ - 0.02)} fill={p.paper} stroke={INK} strokeWidth="1" />
        <g stroke={p.line} strokeOpacity="0.16" strokeWidth="1">
          {Array.from({ length: 10 }, (_, i) => (
            <polyline key={`sx${i}`} points={poly([[0.5 + i * 1, 0.45, SZ], [0.5 + i * 1, 6.55, SZ]])} fill="none" />
          ))}
          {Array.from({ length: 7 }, (_, j) => (
            <polyline key={`sy${j}`} points={poly([[0.5, 0.45 + j * 1, SZ], [9.5, 0.45 + j * 1, SZ]])} fill="none" />
          ))}
        </g>
        <polygon points={quad(0.75, 0.7, 8.5, 5.6, SZ)} fill="none" stroke={p.line} strokeOpacity="0.55" strokeWidth="1" />
        {/* title block in the sheet corner */}
        <polygon points={quad(7.4, 5.4, 1.85, 0.9, SZ)} fill="none" stroke={p.line} strokeOpacity="0.8" strokeWidth="1.2" />
        <polyline points={poly([[7.4, 5.85, SZ], [9.25, 5.85, SZ]])} stroke={p.line} strokeOpacity="0.6" strokeWidth="1" fill="none" />
        <TopText at={[8.32, 5.72, SZ]} size={9} fill={p.line}>
          plotwell
        </TopText>
        {/* construction marks: nodes the plotter will join */}
        {[B, ...NODES].map(([x, y], i) => {
          const [nx, ny] = S([x, y, SZ]);
          return (
            <g key={i}>
              <ellipse cx={nx} cy={ny} rx={i === 0 ? 20 : 12} ry={i === 0 ? 11.5 : 7} fill="none" stroke={p.line} strokeOpacity="0.85" strokeWidth="1.6" />
              <ellipse cx={nx} cy={ny} rx="3" ry="1.8" fill={p.line} />
            </g>
          );
        })}
        <ellipse cx={S([B[0], B[1], SZ])[0]} cy={S([B[0], B[1], SZ])[1]} rx="48" ry="28" fill="none" stroke={p.accent} strokeOpacity="0.6" strokeDasharray="3 5" strokeWidth="1" />

        {/* the drawn route, plotted in sync with the pen */}
        <path
          d={`M${ROUTE.map(([x, y]) => S([x, y, SZ]).map((v) => v.toFixed(2)).join(',')).join(' L')}`}
          fill="none"
          stroke={p.line}
          strokeOpacity={lineOp}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
        >
          <animate attributeName="stroke-dashoffset" values={dashVals} keyTimes={keyTimes} {...MAIN} />
          <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.88;0.95;0.999;1" {...MAIN} />
        </path>
        {/* node lights as the pen reaches each platform */}
        {NODES.map(([x, y], i) => {
          const at = keyT[2 + i * 2];
          const [nx, ny] = S([x, y, SZ]);
          return (
            <ellipse key={i} cx={nx} cy={ny} rx="7" ry="4" fill={p.pop} opacity="0" filter="url(#pd-glow)">
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${(at - 0.005).toFixed(4)};${at.toFixed(4)};0.88;0.95;1`} {...MAIN} />
            </ellipse>
          );
        })}

        {/* brief card slides in from the feeder at the start of each loop */}
        <g>
          <animateTransform attributeName="transform" type="translate" values={`${off(-3.6, 0)};${off(0, 0)};${off(0, 0)};${off(0, 0)}`} keyTimes="0;0.08;0.9;1" {...MAIN} calcMode="spline" keySplines="0.2 0.9 0.1 1;0 0 1 1;0 0 1 1" />
          <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.9;0.97;1" {...MAIN} />
          <polygon points={quad(0.7, 2.8, 1.25, 1.4, SZ + 0.02)} fill="#F7F9FF" stroke={INK} strokeWidth="1" />
          <polyline points={poly([[0.85, 3.05, SZ + 0.03], [1.8, 3.05, SZ + 0.03]])} stroke={p.paper} strokeWidth="2" fill="none" />
          <polyline points={poly([[0.85, 3.45, SZ + 0.03], [1.6, 3.45, SZ + 0.03]])} stroke={shade(p.paper, 0.4)} strokeWidth="1.4" fill="none" />
          <polyline points={poly([[0.85, 3.8, SZ + 0.03], [1.7, 3.8, SZ + 0.03]])} stroke={shade(p.paper, 0.4)} strokeWidth="1.4" fill="none" />
          <polygon points={quad(1.45, 3.75, 0.35, 0.3, SZ + 0.035)} fill={p.pop} />
        </g>

        {/* lamp light pool on the sheet */}
        <ellipse cx={S([4.2, 3, SZ])[0]} cy={S([4.2, 3, SZ])[1]} rx="250" ry="140" fill="url(#pd-pool)">
          <animate attributeName="opacity" values="0.9;1;0.85;1;0.9" dur="3s" repeatCount="indefinite" />
        </ellipse>

        {/* ── Plotter gantry: rails, moving bridge, moving carriage ── */}
        <IsoBox x={0} y={-0.4} z={TOP} w={10} d={0.3} h={0.22} color={shade(p.table, -0.25)} u={U} ink={{ stroke: INK }} />
        <g>
          <animateTransform attributeName="transform" type="translate" values={gantryVals} keyTimes={keyTimes} {...MAIN} />
          <IsoBox x={-0.3} y={-0.45} z={TOP + 0.22} w={0.6} d={0.4} h={0.9} color={shade(p.table, -0.1)} u={U} ink={{ stroke: INK }} />
          <IsoBox x={-0.22} y={-0.4} z={TOP + 1.12} w={0.44} d={7.8} h={0.32} color={p.table} u={U} ink={{ stroke: INK }} />
          <polyline points={poly([[0.22, -0.3, TOP + 1.3], [0.22, 7.3, TOP + 1.3]])} stroke={p.accent} strokeWidth="2" fill="none" />
          {/* carriage + pen */}
          <g>
            <animateTransform attributeName="transform" type="translate" values={carriageVals} keyTimes={keyTimes} {...MAIN} />
            <polygon points={poly([[0, 0, SZ], [0, 0, TOP + 0.95]])} stroke={INK} strokeWidth="1" />
            <ellipse cx={S([0, 0, SZ])[0]} cy={S([0, 0, SZ])[1]} rx="12" ry="7" fill="url(#pd-pop)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
            </ellipse>
            <IsoCylinder x={0} y={0} z={SZ + 0.05} r={0.08} h={0.9} color={p.pop} u={U} ink={{ stroke: INK }} />
            <IsoBox x={-0.42} y={-0.42} z={TOP + 0.9} w={0.84} d={0.84} h={0.8} color={shade(p.table, 0.05)} u={U} ink={{ stroke: INK }} />
            <polygon points={poly([[0.42, -0.25, TOP + 1.45], [0.42, 0.25, TOP + 1.45], [0.42, 0.25, TOP + 1.6], [0.42, -0.25, TOP + 1.6]])} fill={p.pop}>
              <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
            </polygon>
          </g>
          <IsoBox x={-0.3} y={7.05} z={TOP + 0.22} w={0.6} d={0.4} h={0.9} color={shade(p.table, -0.1)} u={U} ink={{ stroke: INK }} />
        </g>
        <IsoBox x={0} y={7.1} z={TOP} w={10} d={0.3} h={0.22} color={shade(p.table, -0.25)} u={U} ink={{ stroke: INK }} />

        {/* ── Moment: the LIVE stamp slams down at 4.2 s ── */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.68;0.69;0.9;0.95;1" {...MAIN} />
          <animateTransform attributeName="transform" type="translate" values="0 -90;0 -90;0 0;0 0" keyTimes="0;0.68;0.705;1" {...MAIN} calcMode="spline" keySplines="0 0 1 1;0.7 0 0.84 0;0 0 1 1" />
          <polygon points={quad(2.55, 4.75, 2.3, 1.05, SZ + 0.02)} fill={p.pop} stroke={shade(p.pop, -0.4)} strokeWidth="1.4" transform={`rotate(-3 ${stX} ${stY})`} />
          <TopText at={[3.7, 5.55, SZ + 0.03]} size={30} fill={isLight(p.pop) ? '#0B1F4D' : '#FFFFFF'} weight={800} family="Syne, 'Bricolage Grotesque', sans-serif">
            {p.stamp}
          </TopText>
        </g>
        <ellipse cx={stX} cy={stY} rx="20" ry="11" fill="none" stroke={p.pop} strokeWidth="3" opacity="0">
          <animate attributeName="rx" values="20;20;150;150" keyTimes="0;0.705;0.8;1" {...MAIN} />
          <animate attributeName="ry" values="11;11;86;86" keyTimes="0;0.705;0.8;1" {...MAIN} />
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.704;0.706;0.8;1" {...MAIN} />
        </ellipse>
        <circle cx={stX} cy={stY} r="120" fill="url(#pd-pop)" opacity="0">
          <animate attributeName="opacity" values="0;0;0.8;0;0" keyTimes="0;0.704;0.708;0.78;1" {...MAIN} />
        </circle>

        {/* ── Pen carousel at the front-left corner: spins ── */}
        {(() => {
          const [cx, cy] = S([1.1, 6.2, TOP + 0.35]);
          return (
            <g>
              <IsoCylinder x={1.1} y={6.2} z={TOP} r={0.55} h={0.35} color={shade(p.table, -0.15)} u={U} ink={{ stroke: INK }} />
              <g transform={`translate(${cx} ${cy}) scale(1 0.5)`}>
                <g>
                  <animateTransform attributeName="transform" type="rotate" values="0;360" dur="3s" repeatCount="indefinite" />
                  {Array.from({ length: 6 }, (_, i) => (
                    <circle key={i} cx={Math.cos((i / 6) * Math.PI * 2) * 13} cy={Math.sin((i / 6) * Math.PI * 2) * 13} r="4.5" fill={[p.pop, p.line, p.accent, p.line, p.accent, p.line][i]} stroke={INK} strokeWidth="1" />
                  ))}
                </g>
              </g>
            </g>
          );
        })()}

        {/* ── Coffee cup at the front-right ── */}
        {(() => {
          const [sx, sy] = S([8.9, 6.3, TOP + 0.75]);
          return (
            <g>
              <IsoCylinder x={8.9} y={6.3} z={TOP} r={0.32} h={0.75} color={shade(p.table, 0.05)} u={U} ink={{ stroke: INK }} />
              <ellipse cx={sx} cy={sy} rx="9" ry="5" fill="#4A2E22" />
              <path d={`M${sx + 11},${sy + 6} q9,3 0,12`} fill="none" stroke={INK} strokeWidth="2" />
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M${sx - 3 + k * 3},${sy - 4} q-5,-10 0,-20 q5,-10 0,-20`} fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0">
                  <animate attributeName="opacity" values="0;0.5;0" dur="2s" begin={`-${(k * 0.66).toFixed(2)}s`} repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0 6;0 -14" dur="2s" begin={`-${(k * 0.66).toFixed(2)}s`} repeatCount="indefinite" />
                </path>
              ))}
            </g>
          );
        })()}

        {/* ── Architect lamp clamped at the back-left ── */}
        {(() => {
          const [bx, by] = S([0.4, 0.5, TOP]);
          const [ex, ey] = S([0.4, 0.5, TOP + 3.4]);
          const [hx, hy] = S([3.2, 1.6, TOP + 4.1]);
          return (
            <g>
              <polygon points={`${hx - 10},${hy + 8} ${hx + 16},${hy + 8} ${S([5.8, 4, SZ])[0]},${S([5.8, 4, SZ])[1]} ${S([2.2, 3.4, SZ])[0]},${S([2.2, 3.4, SZ])[1]}`} fill="url(#pd-cone)" style={{ mixBlendMode: 'screen' }}>
                <Flicker dur={LOOP} seed={3} low={0.7} />
              </polygon>
              <IsoCylinder x={0.4} y={0.5} z={TOP} r={0.3} h={0.25} color={shade(p.table, -0.3)} u={U} ink={{ stroke: INK }} />
              <line x1={bx} y1={by - 8} x2={ex} y2={ey} stroke={shade(p.table, -0.45)} strokeWidth="5" strokeLinecap="round" />
              <line x1={ex} y1={ey} x2={hx} y2={hy} stroke={shade(p.table, -0.45)} strokeWidth="5" strokeLinecap="round" />
              <circle cx={ex} cy={ey} r="6" fill={p.pop} stroke={INK} strokeWidth="1.2" />
              <path d={`M${hx - 14},${hy + 8} L${hx - 4},${hy - 14} L${hx + 14},${hy - 10} L${hx + 20},${hy + 8} Z`} fill={shade(p.table, -0.2)} stroke={INK} strokeWidth="1.3" />
              <ellipse cx={hx + 3} cy={hy + 8} rx="17" ry="5" fill={p.lamp} filter="url(#pd-glow)">
                <Flicker dur={LOOP} seed={3} low={0.7} />
              </ellipse>
            </g>
          );
        })()}

        {/* ── Platform cabinet ── */}
        <IsoBox x={cab.x} y={cab.y} w={cab.w} d={cab.d} h={cab.h} color={p.table} u={U} ink={{ stroke: INK }} />
        <IsoBox x={cab.x - 0.1} y={cab.y - 0.1} z={cab.h} w={cab.w + 0.2} d={cab.d + 0.2} h={0.18} color={shade(p.table, -0.2)} u={U} ink={{ stroke: INK }} />
        {slotNames.map((name, i) => {
          const s = slot(i);
          const arrive = i / 6 + 0.2; // each slot receives a card once per loop
          return (
            <g key={i}>
              <polygon points={poly([[s.a, front, s.z], [s.a + s.w, front, s.z], [s.a + s.w, front, s.z + s.h], [s.a, front, s.z + s.h]])} fill={shade(p.table, -0.55)} stroke={INK} strokeWidth="1" />
              <polygon points={poly([[s.a, front, s.z], [s.a + s.w, front, s.z], [s.a + s.w, front, s.z + 0.3], [s.a, front, s.z + 0.3]])} fill={shade(p.table, -0.3)} />
              {/* stack of delivered cards */}
              {[0, 1].map((k) => (
                <polygon key={k} points={poly([[s.a + 0.15, front, s.z + 0.32 + k * 0.12], [s.a + s.w - 0.15, front, s.z + 0.32 + k * 0.12], [s.a + s.w - 0.15, front, s.z + 0.42 + k * 0.12], [s.a + 0.15, front, s.z + 0.42 + k * 0.12]])} fill={k ? p.line : p.accent} opacity="0.9" />
              ))}
              {/* arrival light */}
              {(() => {
                const [lx, ly] = S([s.a + s.w - 0.18, front, s.z + s.h - 0.2]);
                const a = arrive % 1;
                return (
                  <circle cx={lx} cy={ly} r="3.5" fill={p.pop} opacity="0.25">
                    <animate attributeName="opacity" values="0.25;0.25;1;0.25;0.25" keyTimes={`0;${Math.max(0.001, a - 0.001).toFixed(3)};${a.toFixed(3)};${Math.min(0.999, a + 0.1).toFixed(3)};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
                  </circle>
                );
              })()}
              <FaceText at={[s.a + s.w / 2, front, s.z - 0.32]} size={10} fill={shade(p.table, -0.65)}>
                {name}
              </FaceText>
            </g>
          );
        })}

        {/* ad cards fly from the table edge into their slots */}
        {slotNames.map((_, i) => {
          const s = slot(i);
          const [x0, y0] = S([10, 3.5, TOP + 0.4]);
          const [x1, y1] = S([s.a + s.w / 2, front, s.z + 0.6]);
          const mx = (x0 + x1) / 2 + 10;
          const my = Math.min(y0, y1) - 70 - rand(i) * 30;
          const begin = `${((i / 6) * LOOP - LOOP).toFixed(2)}s`;
          return (
            <g key={`c${i}`} opacity="0">
              <animateMotion path={`M${x0},${y0} Q${mx},${my} ${x1},${y1}`} keyPoints="0;1;1" keyTimes="0;0.2;1" calcMode="spline" keySplines="0.3 0 0.4 1;0 0 1 1" dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.02;0.19;0.2;1" dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" />
              <g transform="rotate(-8)">
                <rect x="-13" y="-9" width="26" height="18" rx="2" fill="#F7F9FF" stroke={INK} strokeWidth="1" />
                <rect x="-13" y="-9" width="26" height="6" rx="2" fill={i % 2 ? p.accent : p.paper} />
                <rect x="-9" y="1" width="12" height="2.5" fill={shade(p.paper, 0.3)} />
                <circle cx="8" cy="4" r="2.6" fill={p.pop} />
              </g>
            </g>
          );
        })}
      </g>

      {/* dust motes in the lamp light */}
      {Array.from({ length: 18 }, (_, i) => {
        const x = 420 + rand(i * 3.3) * 260;
        const y = 220 + rand(i * 5.1) * 220;
        const dur = [3, 6, 2][i % 3];
        return (
          <circle key={i} cx={x} cy={y} r={1 + rand(i * 7.7) * 1.4} fill={p.lamp} opacity="0">
            <animate attributeName="opacity" values="0;0.7;0" dur={`${dur}s`} begin={`-${(rand(i * 2.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 0;6 -18" dur={`${dur}s`} begin={`-${(rand(i * 2.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
    </svg>
  );
}
