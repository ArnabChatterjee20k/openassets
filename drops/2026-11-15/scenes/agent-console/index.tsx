import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Agent Console',
  description:
    'Landing-page hero for Firebrand: a giant isometric tablet on a plinth shows the live heat index and a spend dial, while ad cards rise like embers to six floating platform tiles. Mid-loop the agent rebalances: the hot bar surges, a ring flashes and a LIVE tag pops.',
  tags: ['hero', 'isometric', 'dashboard', 'ads', 'animated svg', 'interface'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  tag: text('Pop tag').default('LIVE'),
  brand: text('Screen title').default('FIREBRAND · HEAT INDEX'),
  wallTop: color('Backdrop top').default('#120604'),
  wallBottom: color('Backdrop bottom').default('#3A1408'),
  plinth: color('Plinth').default('#2E120B'),
  bezel: color('Tablet').default('#F3E6DA'),
  screen: color('Screen').default('#1A0A06'),
  accent: color().default('#FF4D00'),
  accent2: color('Heat top').default('#FFB000'),
  pop: color('Pop').default('#FF2E63'),
  ink: color('Screen text').default('#FFEDE0'),
  cards: toggle('Flying ad cards').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { wallTop: '#2B1B2E', wallBottom: '#B5524A', plinth: '#45293F', accent: '#FF8E5E', accent2: '#FFD27F', pop: '#E5487A' },
  daylight: { wallTop: '#FFE9D6', wallBottom: '#FFC9A8', plinth: '#E5CDB2', bezel: '#FFFDF8', screen: '#2E120B', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63' },
  cherry: { wallTop: '#1A0508', wallBottom: '#4A0E18', plinth: '#3F1019', bezel: '#F5C6AA', screen: '#2A0A10', accent: '#E3173E', accent2: '#F7B32B', pop: '#FFE8E0', ink: '#FFE8E0' },
  acid: { wallTop: '#050505', wallBottom: '#1A1A1A', plinth: '#222222', bezel: '#E8E8E8', screen: '#0B0B0B', accent: '#C6FF00', accent2: '#00F0FF', pop: '#FF00E5', ink: '#F0FFE0', tag: 'BOOST' },
};

type P = z.infer<typeof schema>;

const U = 46;
const LOOP = scene.loop;
const OX = 548;
const OY = 318;
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(14,4,2,0.6)';
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const ink = { stroke: INK, strokeWidth: 1.2 };
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

/** Transform into the ground plane at a world point (local units are pixels at scale U). */
const ground = (p: P3) => {
  const [x, y] = S(p);
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) matrix(${C30},0.5,${-C30},0.5,0,0)`;
};
/** Transform into a left-facing wall plane (y = const) at a world point. */
const leftWall = (p: P3) => {
  const [x, y] = S(p);
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) matrix(${C30},0.5,0,1,0,0)`;
};

const Z = 0.37; // screen surface height
const BAR_X = 2.5;
const BAR_MAX = 4.6;
const BARS = [
  { name: 'TIKTOK', v: 0.78, hot: true },
  { name: 'META', v: 0.7 },
  { name: 'YOUTUBE', v: 0.56 },
  { name: 'GOOGLE', v: 0.47 },
  { name: 'REDDIT', v: 0.32 },
];

function Bars({ p }: { p: P }) {
  const [gx1, gy1] = S([BAR_X, 3, Z]);
  const [gx2, gy2] = S([BAR_X + BAR_MAX, 3, Z]);
  return (
    <g>
      <defs>
        <linearGradient id="ac-heat" gradientUnits="userSpaceOnUse" x1={gx1} y1={gy1} x2={gx2} y2={gy2}>
          <stop offset="0" stopColor={p.accent} stopOpacity="0.35" />
          <stop offset="0.5" stopColor={p.accent} />
          <stop offset="0.85" stopColor={p.accent2} />
          <stop offset="1" stopColor="#FFF4DE" />
        </linearGradient>
      </defs>
      {BARS.map((b, i) => {
        const y = 2.45 + i * 0.95;
        const quad = (L: number) => poly([[BAR_X, y, Z], [BAR_X + L, y, Z], [BAR_X + L, y + 0.42, Z], [BAR_X, y + 0.42, Z]]);
        const L = b.v * BAR_MAX;
        return (
          <g key={b.name}>
            {/* track */}
            <polygon points={quad(BAR_MAX)} fill={p.ink} opacity="0.07" />
            {b.hot ? (
              <polygon points={quad(L)} fill="url(#ac-heat)" filter="url(#ac-glow)">
                {/* the rebalance moment: the hot channel surges, holds, then eases back */}
                <animate attributeName="points" values={`${quad(L)};${quad(L)};${quad(BAR_MAX)};${quad(BAR_MAX)};${quad(L)}`} keyTimes="0;0.47;0.53;0.85;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.2 0.9 0.1 1;0 0 1 1;0.45 0 0.55 1" />
              </polygon>
            ) : (
              <polygon points={quad(L)} fill="url(#ac-heat)">
                <animate attributeName="points" values={`${quad(L)};${quad(L * 0.9)};${quad(L)}`} dur="3s" begin={`-${(i * 0.7).toFixed(1)}s`} repeatCount="indefinite" {...spline} />
              </polygon>
            )}
            <g transform={ground([BAR_X - 0.15, y + 0.36, Z])}>
              <text x="0" y="0" textAnchor="end" fontFamily="'JetBrains Mono',monospace" fontSize="11" letterSpacing="1.2" fill={p.ink} opacity={b.hot ? 1 : 0.65}>
                {b.name}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}

/** Spend dial on the screen: ring of ticks and a needle that hunts, then swings hot at the moment. */
function Dial({ p }: { p: P }) {
  const r = 1.15 * U;
  return (
    <g transform={ground([8.75, 3.6, Z])}>
      <circle r={r} fill={shade(p.screen, 0.06)} stroke={p.ink} strokeOpacity="0.15" strokeWidth="1.5" />
      <circle r={r * 0.82} fill="none" stroke="url(#ac-heat)" strokeWidth="5" strokeDasharray={`${r * 0.82 * Math.PI * 1.4} 999`} transform="rotate(144)" strokeLinecap="round" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={0} y1={-r * 0.95} x2={0} y2={-r * 0.88} stroke={p.ink} strokeOpacity="0.4" strokeWidth="1.5" transform={`rotate(${-126 + i * 22.9})`} />
      ))}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-60;-20;-45;75;75;-60" keyTimes="0;0.2;0.4;0.53;0.85;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.2 0.9 0.1 1;0 0 1 1;0.45 0 0.55 1" />
        <path d={`M-3,0 L0,${-r * 0.72} L3,0 Z`} fill={p.accent2} />
      </g>
      <circle r="6" fill={p.ink} />
      <circle r="2.5" fill={p.accent} />
    </g>
  );
}

const MARKS = ['circle', 'play', 'square', 'ring', 'bars', 'spark'] as const;

function Mark({ kind, c }: { kind: (typeof MARKS)[number]; c: string }) {
  switch (kind) {
    case 'circle':
      return <circle r="11" fill={c} />;
    case 'play':
      return <path d="M-8,-11 L12,0 L-8,11 Z" fill={c} />;
    case 'square':
      return <rect x="-10" y="-10" width="20" height="20" rx="4" fill={c} />;
    case 'ring':
      return <circle r="10" fill="none" stroke={c} strokeWidth="5" />;
    case 'bars':
      return (
        <g fill={c}>
          <rect x="-11" y="-4" width="5" height="14" />
          <rect x="-3" y="-10" width="5" height="20" />
          <rect x="5" y="-1" width="5" height="11" />
        </g>
      );
    default:
      return <path d="M0,-13 L3,-3 L13,0 L3,3 L0,13 L-3,3 L-13,0 L-3,-3 Z" fill={c} />;
  }
}

const TILES: { x: number; y: number; z: number; mark: (typeof MARKS)[number] }[] = [
  { x: 0.4, y: -2.2, z: 4.2, mark: 'circle' },
  { x: 5.2, y: -3.0, z: 5.0, mark: 'play' },
  { x: 11.6, y: -1.4, z: 3.8, mark: 'square' },
  { x: 15.2, y: 4.2, z: 5.4, mark: 'ring' },
  { x: -2.8, y: 4.4, z: 3.6, mark: 'bars' },
  { x: 9.0, y: -3.8, z: 6.2, mark: 'spark' },
];

function Tile({ t, i, p }: { t: (typeof TILES)[number]; i: number; p: P }) {
  const w = 1.7;
  const c = [p.accent, p.accent2, p.pop, p.accent2, p.accent, p.pop][i];
  const begin = `-${(i * 0.5).toFixed(1)}s`;
  const [lx, ly] = S([t.x + w, t.y + w * 0.5, t.z + 0.2]);
  return (
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -9;0 0" dur="3s" begin={`-${(i * 0.45).toFixed(2)}s`} repeatCount="indefinite" {...spline} />
      {/* soft shadow/glow below the tile */}
      <ellipse cx={S([t.x + w / 2, t.y + w / 2, t.z])[0]} cy={S([t.x + w / 2, t.y + w / 2, t.z])[1] + 30} rx="40" ry="14" fill={c} opacity="0.18" filter="url(#ac-blur)" />
      <IsoBox x={t.x} y={t.y} z={t.z} w={w} d={w} h={0.38} color={shade(p.bezel, -0.04)} u={U} ink={ink} />
      <g transform={ground([t.x + w / 2, t.y + w / 2, t.z + 0.38])}>
        <rect x={-w * U * 0.38} y={-w * U * 0.38} width={w * U * 0.76} height={w * U * 0.76} rx="8" fill={shade(p.screen, 0.05)} />
        <Mark kind={t.mark} c={c} />
      </g>
      {/* receive pulse: syncs with this tile's incoming card */}
      <g transform={ground([t.x + w / 2, t.y + w / 2, t.z + 0.4])}>
        <circle r="20" fill="none" stroke={c} strokeWidth="3" opacity="0">
          <animate attributeName="r" values="20;20;20;46" keyTimes="0;0.78;0.82;1" dur="3s" begin={begin} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;0.9;0" keyTimes="0;0.78;0.82;1" dur="3s" begin={begin} repeatCount="indefinite" />
        </circle>
      </g>
      <circle cx={lx - 8} cy={ly} r="3" fill={c} filter="url(#ac-glow)">
        <Flicker dur={LOOP} seed={i * 3 + 1} low={0.25} />
      </circle>
    </g>
  );
}

/** An ad card rising from the screen to tile i (same 3 s clock + offset as the tile's pulse). */
function Card({ i, p }: { i: number; p: P }) {
  const t = TILES[i];
  const [sx, sy] = S([4.5 + (i % 3) * 1.6, 3.4 + (i % 2) * 1.6, Z]);
  const [tx, ty] = S([t.x + 0.85, t.y + 0.85, t.z + 0.5]);
  const cx = (sx + tx) / 2 + (i % 2 ? 60 : -60);
  const cy = Math.min(sy, ty) - 120;
  const begin = `-${(i * 0.5).toFixed(1)}s`;
  const c = [p.accent, p.accent2, p.pop, p.accent2, p.accent, p.pop][i];
  return (
    <g opacity="0">
      <animateMotion dur="3s" begin={begin} repeatCount="indefinite" path={`M${sx},${sy} Q${cx},${cy} ${tx},${ty}`} keyPoints="0;0;1;1" keyTimes="0;0.1;0.8;1" calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0 0 1 1" />
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.15;0.7;0.8;1" dur="3s" begin={begin} repeatCount="indefinite" />
      <g transform="matrix(0.866,0.5,0,1,0,0)">
        <animateTransform attributeName="transform" type="scale" values="0.5;1;0.6" keyTimes="0;0.3;1" dur="3s" begin={begin} repeatCount="indefinite" additive="sum" />
        <rect x="-14" y="-34" width="28" height="36" rx="4" fill={p.bezel} stroke={INK} strokeWidth="1" />
        <rect x="-10" y="-30" width="20" height="16" rx="2" fill={c} />
        <rect x="-10" y="-10" width="14" height="3" rx="1.5" fill={shade(p.bezel, -0.4)} />
        <rect x="-10" y="-5" width="9" height="3" rx="1.5" fill={shade(p.bezel, -0.3)} />
      </g>
    </g>
  );
}

function Motes({ p }: { p: P }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const x = rand(i * 3.7) * 1200;
    const y = 300 + rand(i * 9.1) * 600;
    const dur = [3, 6, 2][i % 3];
    const b = `-${(rand(i * 5.3) * dur).toFixed(2)}s`;
    out.push(
      <circle key={i} cx={x} cy={y} r={1 + rand(i * 1.9) * 2.2} fill={i % 4 ? p.accent2 : p.accent}>
        <animate attributeName="cy" values={`${y};${y - 140}`} dur={`${dur}s`} begin={b} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.8;0" dur={`${dur}s`} begin={b} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

export default function AgentConsole(p: P) {
  const dark = parseInt(p.wallTop.slice(1, 3), 16) < 128;
  const [hx, hy] = S([BAR_X + BAR_MAX, 2.66, Z]); // end of the hot bar at full surge
  const [tagX, tagY] = S([BAR_X + BAR_MAX + 0.2, 2.2, Z + 0.9]);
  const [cupX, cupY] = S([11, 7.9, 0.85]);
  const moment = { keyTimes: '0;0.5;0.52;0.6;1', dur: `${LOOP}s`, repeatCount: 'indefinite' } as const;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="ac-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.wallTop} />
          <stop offset="1" stopColor={p.wallBottom} />
        </linearGradient>
        <radialGradient id="ac-orb">
          <stop offset="0" stopColor={p.accent2} stopOpacity={dark ? 0.55 : 0.6} />
          <stop offset="0.4" stopColor={p.accent} stopOpacity={dark ? 0.25 : 0.25} />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ac-screenglow">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <filter id="ac-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ac-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* ── Backdrop: warm wall, molten orb, floor ── */}
      <rect width="1200" height="900" fill="url(#ac-wall)" />
      <circle cx="600" cy="300" r="460" fill="url(#ac-orb)">
        <animate attributeName="r" values="440;480;440" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
      </circle>
      <g transform={`translate(${OX} ${OY})`} opacity={dark ? 0.6 : 0.35}>
        <IsoGrid x={-6} y={-5} w={24} d={20} u={U} color={p.accent} opacity={0.12} />
      </g>
      <Motes p={p} />

      <g transform={`translate(${OX} ${OY})`}>
        {/* soft cast shadow of the plinth */}
        <polygon points={poly([[0, 9, -1], [12, 9, -1], [13.5, 11.5, -1], [1.5, 11.5, -1]])} fill="#000" opacity="0.35" filter="url(#ac-blur)" />

        {/* ── Plinth ── */}
        <IsoBox x={0} y={0} z={-1} w={12} d={9} h={1} color={p.plinth} u={U} ink={ink} />
        {/* glowing heat seam around the plinth top edge */}
        <polyline points={poly([[0, 9, -0.12], [12, 9, -0.12], [12, 0, -0.12]])} fill="none" stroke={p.accent} strokeWidth="2.5" filter="url(#ac-glow)">
          <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </polyline>

        {/* screen light spilling onto the plinth */}
        <ellipse cx={S([6, 4.5, 0])[0]} cy={S([6, 4.5, 0])[1]} rx="330" ry="170" fill="url(#ac-screenglow)">
          <animate attributeName="opacity" values="0.7;0.7;1;0.7" keyTimes="0;0.5;0.55;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>

        {/* ── Tablet ── */}
        <IsoBox x={1.4} y={1.2} z={0} w={9.2} d={6.6} h={0.36} color={p.bezel} u={U} ink={ink} />
        <polygon points={poly([[1.85, 1.65, Z - 0.005], [10.15, 1.65, Z - 0.005], [10.15, 7.35, Z - 0.005], [1.85, 7.35, Z - 0.005]])} fill={p.screen} stroke={INK} strokeWidth="1" />
        {/* camera dot + side button */}
        <circle cx={S([6, 1.42, Z])[0]} cy={S([6, 1.42, Z])[1]} r="2.5" fill={shade(p.bezel, -0.5)} />
        <polygon points={poly([[10.6, 2.4, 0.1], [10.6, 3.2, 0.1], [10.6, 3.2, 0.26], [10.6, 2.4, 0.26]])} fill={shade(p.bezel, -0.35)} />

        {/* screen header */}
        <g transform={ground([2.2, 2.05, Z])}>
          <text x="0" y="0" fontFamily="'JetBrains Mono',monospace" fontSize="11" letterSpacing="2" fill={p.accent2}>
            {p.brand}
          </text>
        </g>
        <g transform={ground([9.95, 2.05, Z])}>
          <circle cx="-4" cy="-4" r="3.5" fill={p.pop}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>
        {/* divider */}
        <polyline points={poly([[2.2, 2.25, Z], [9.8, 2.25, Z]])} stroke={p.ink} strokeOpacity="0.15" strokeWidth="1" />
        {/* column divider between bars and dial */}
        <polyline points={poly([[7.35, 2.45, Z], [7.35, 7, Z]])} stroke={p.ink} strokeOpacity="0.1" strokeWidth="1" />

        <Bars p={p} />
        <Dial p={p} />
        {/* mini stats under the dial */}
        {['ROAS 4.8×', 'CPA $18'].map((s, i) => (
          <g key={s} transform={ground([7.75, 5.55 + i * 0.6, Z])}>
            <text x="0" y="0" fontFamily="'JetBrains Mono',monospace" fontSize="12" letterSpacing="1" fill={p.ink} opacity={i ? 0.6 : 0.9}>
              {s}
            </text>
          </g>
        ))}
        {/* sparkline */}
        <polyline points={poly([[7.8, 6.8, Z], [8.3, 6.6, Z], [8.7, 6.85, Z], [9.2, 6.4, Z], [9.8, 6.2, Z]])} fill="none" stroke={p.accent2} strokeWidth="2" strokeLinejoin="round" />

        {/* ── Moment: ring flash at the hot bar + screen flash ── */}
        <g transform={`translate(${hx} ${hy}) scale(1 0.58)`}>
          <circle r="10" fill="none" stroke={p.accent2} strokeWidth="4" opacity="0">
            <animate attributeName="r" values="10;10;14;90;90" {...moment} />
            <animate attributeName="opacity" values="0;0;1;0;0" {...moment} />
          </circle>
          <circle r="16" fill="#FFF4DE" opacity="0" filter="url(#ac-blur)">
            <animate attributeName="opacity" values="0;0;1;0;0" {...moment} />
          </circle>
        </g>
        <polygon points={poly([[1.85, 1.65, Z], [10.15, 1.65, Z], [10.15, 7.35, Z], [1.85, 7.35, Z]])} fill={p.accent2} opacity="0">
          <animate attributeName="opacity" values="0;0;0.16;0;0" {...moment} />
        </polygon>

        {/* ── Desk props: stylus, notebook, coffee ── */}
        <IsoBox x={2} y={8.15} z={0} w={3.4} d={0.16} h={0.14} color={p.bezel} u={U} ink={ink} />
        <IsoBox x={5.25} y={8.15} z={0} w={0.25} d={0.16} h={0.14} color={p.accent} u={U} ink={ink} />
        <IsoBox x={0.4} y={2.2} z={0} w={0.8} d={1.4} h={0.12} color={p.accent} u={U} ink={ink} />
        <IsoBox x={0.4} y={2.2} z={0.12} w={0.8} d={1.4} h={0.12} color={shade(p.bezel, -0.08)} u={U} ink={ink} />
        <IsoBox x={0.4} y={2.2} z={0.24} w={0.8} d={1.4} h={0.12} color={p.accent2} u={U} ink={ink} />
        <ellipse cx={S([11, 7.9, 0])[0] - 10} cy={S([11, 7.9, 0])[1] + 8} rx="26" ry="10" fill="#000" opacity="0.3" filter="url(#ac-blur)" />
        <IsoCylinder x={11} y={7.9} z={0} r={0.42} h={0.85} color={p.bezel} u={U} ink={ink} />
        <ellipse cx={cupX} cy={cupY} rx={0.32 * U * 1.22} ry={0.32 * U * 0.7} fill="#4A2412" />
        <path d={`M${cupX + 18},${cupY + 8} q14,4 2,20`} fill="none" stroke={p.bezel} strokeWidth="4" strokeLinecap="round" />
        <path d={`M${cupX + 18},${cupY + 8} q14,4 2,20`} fill="none" stroke={INK} strokeWidth="1" />
        <rect x={cupX - 12} y={cupY + 12} width="24" height="6" fill={p.accent} opacity="0.9" />
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${cupX - 4 + k * 4},${cupY - 6} q-8,-14 0,-28 q8,-14 0,-28`} fill="none" stroke={p.ink} strokeWidth="2.2" strokeLinecap="round" opacity="0">
            <animate attributeName="opacity" values="0;0.45;0" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 6;3 -16" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
          </path>
        ))}

        {/* front label on the plinth face */}
        <g transform={leftWall([0.7, 9, -0.32])}>
          <text x="0" y="0" fontFamily="'JetBrains Mono',monospace" fontWeight="700" fontSize="19" letterSpacing="4" fill={p.accent2} opacity="0.85">
            34 PLATFORMS · ONE AGENT
          </text>
        </g>

        {/* ── Flying ad cards, then the floating platform tiles ── */}
        {p.cards && TILES.map((_, i) => <Card key={i} i={i} p={p} />)}
        {TILES.map((t, i) => (
          <Tile key={i} t={t} i={i} p={p} />
        ))}

        {/* ── LIVE tag pops at the moment ── */}
        <g transform={`translate(${tagX} ${tagY})`}>
          <g opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.5;0.53;0.85;0.9" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="scale" values="0.2;0.2;1.2;1;1" keyTimes="0;0.5;0.54;0.58;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <line x1="0" y1="0" x2="-14" y2="30" stroke={p.pop} strokeWidth="2" />
            <rect x="-34" y="-30" width="68" height="28" rx="14" fill={p.pop} filter="url(#ac-glow)" />
            <text x="0" y="-11" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontWeight="700" fontSize="13" letterSpacing="2" fill={dark ? '#1A0A06' : '#FFFFFF'}>
              {p.tag}
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
