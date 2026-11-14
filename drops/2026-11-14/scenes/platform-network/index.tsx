import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { IsoBox, IsoCylinder, iso, pts, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Platform Network',
  description:
    'Isometric hero for Plotwell\'s "one plan, every platform" story: a plan hub where a compass arm scribes the campaign, drafting-rail bridges out to six floating ad-platform tiles, ad cards flowing out and budget coins flowing back, and an hourly rebalance pulse that re-levels every budget bar once per loop.',
  tags: ['hero', 'isometric', 'network', 'blueprint', 'platforms', 'animated svg'],
};

// Every SMIL dur divides this loop (6, 3, 2, 1.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  platforms: text('Platforms (comma separated, 6)').default('meta, google, tiktok, youtube, linkedin, pinterest'),
  hub: text('Hub label').default('plotwell plan'),
  more: text('More tag').default('+27 more'),
  sky: color('Background').default('#0F3B8C'),
  tile: color('Tiles').default('#E4ECFA'),
  plate: color('Plan disc').default('#134AA8'),
  line: color('Linework').default('#EAF2FF'),
  accent: color('Secondary').default('#7FB2FF'),
  pop: color('Highlighter').default('#FFDD00'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night shift': { sky: '#06142F', tile: '#B9C8E6', plate: '#0F3B8C', accent: '#4F7FD6' },
  whiteprint: { sky: '#EDE8DA', tile: '#FAF8F2', plate: '#173F9A', line: '#173F9A', accent: '#7A90BF', pop: '#FFD000' },
  bauhaus: { sky: '#F2EBDD', tile: '#FFFFFF', plate: '#1D4E9E', line: '#1D4E9E', accent: '#D9381E', pop: '#F2B90F' },
  'desert dusk': { sky: '#2B1B2E', tile: '#F6E2CF', plate: '#45293F', line: '#FFE9D6', accent: '#FF8E5E', pop: '#FFD27F' },
};

type P = z.infer<typeof schema>;

const U = 47;
const LOOP = scene.loop;
const OX = 600;
const OY = 462;
const GZ = -1.7; // ground plane the pieces float above
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(6,16,48,0.55)';
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 150;
};
const rep = { repeatCount: 'indefinite' } as const;
const xy = (p: P3) => S(p).map((v) => v.toFixed(1)).join(' ');

const R = 6.4; // ring radius of the platform tiles
const TS = 2.8; // tile size
const HUB_R = 2.1;
// Six tiles around the hub. Angles chosen so no tile sits exactly behind the hub.
const ANGLES = [-100, -40, 20, 80, 140, 200].map((d) => (d * Math.PI) / 180);
const TILES = ANGLES.map((a, i) => ({ i, cx: Math.cos(a) * R, cy: Math.sin(a) * R }));
// Budget bar heights (world units) before and after the rebalance moment.
const BARS_A = [
  [0.9, 0.6, 1.1],
  [0.5, 0.9, 0.7],
  [1.2, 0.8, 0.5],
  [0.6, 1.0, 0.8],
  [0.8, 0.5, 0.6],
  [0.7, 0.7, 1.0],
];
const BARS_B = [
  [1.0, 1.2, 1.3],
  [0.7, 0.6, 0.6],
  [1.4, 1.5, 1.6],
  [0.5, 0.6, 0.5],
  [0.9, 1.0, 1.1],
  [0.6, 0.5, 0.6],
];
const TOP_TILE = 2; // the one that wins the rebalance (gets the highlighter flag)
const MOMENT = 0.72; // keyTime of the rebalance pulse (t ≈ 4.3 s, mid-burst at 4.5 s)

/** Simple, brand-neutral platform glyphs drawn on a screen face (local px, ~40 wide). */
function Glyph({ i, c }: { i: number; c: string }) {
  switch (i % 6) {
    case 0: // ring
      return <circle cx="0" cy="0" r="11" fill="none" stroke={c} strokeWidth="4.5" />;
    case 1: // search bar
      return (
        <g fill="none" stroke={c} strokeWidth="4" strokeLinecap="round">
          <circle cx="-4" cy="-2" r="8" />
          <line x1="2" y1="4" x2="10" y2="12" />
        </g>
      );
    case 2: // note
      return <path d="M2 -14 V6 a6 6 0 1 1 -6 -6 M2 -14 q6 6 12 4" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />;
    case 3: // play
      return <path d="M-8 -11 L12 0 L-8 11 Z" fill={c} />;
    case 4: // people
      return (
        <g fill={c}>
          <circle cx="0" cy="-6" r="6" />
          <path d="M-12 12 q12 -16 24 0 Z" />
        </g>
      );
    default: // pin
      return <path d="M0 13 C-14 -2 -10 -14 0 -14 C10 -14 14 -2 0 13 Z M0 -4 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" fill={c} fillRule="evenodd" />;
  }
}

/** Content on a left-type face (plane y = const): local x runs along +x, y down. */
function OnLeftFace({ at, children }: { at: P3; children: ReactNode }) {
  const [x, y] = S(at);
  return <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) matrix(${C30} 0.5 0 1 0 0)`}>{children}</g>;
}
/** Content lying on a horizontal plane (z = const), in world units × U. */
function OnTop({ at, children }: { at: P3; children: ReactNode }) {
  const [x, y] = S(at);
  return <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) matrix(${C30} 0.5 ${-C30} 0.5 0 0)`}>{children}</g>;
}

function Tile({ t, p, name }: { t: (typeof TILES)[number]; p: P; name: string }) {
  const x0 = t.cx - TS / 2;
  const y0 = t.cy - TS / 2;
  const H = 0.6;
  const bob = `${(t.i % 3) * -0.5}s`;
  const bars = BARS_A[t.i].map((a, k) => ({ a, b: BARS_B[t.i][k], k }));
  const screen = { x: x0 + 0.35, y: y0 + 0.35, w: 1.7, d: 0.22, h: 1.35 };
  const flagOn = t.i === TOP_TILE;
  return (
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="3s" begin={bob} {...rep} />
      {/* slab with a lip */}
      <IsoBox x={x0} y={y0} z={0} w={TS} d={TS} h={H} color={p.tile} u={U} ink={{ stroke: INK, strokeWidth: 1.2 }} />
      <polygon points={poly([[x0 + 0.15, y0 + 0.15, H], [x0 + TS - 0.15, y0 + 0.15, H], [x0 + TS - 0.15, y0 + TS - 0.15, H], [x0 + 0.15, y0 + TS - 0.15, H]])} fill="none" stroke={shade(p.tile, -0.25)} strokeWidth="1" />
      {/* tile-top grid */}
      <g stroke={p.accent} strokeOpacity="0.45" strokeWidth="0.8">
        {[0.7, 1.4, 2.1].map((k) => (
          <g key={k}>
            <polyline points={poly([[x0 + k, y0 + 0.15, H], [x0 + k, y0 + TS - 0.15, H]])} fill="none" />
            <polyline points={poly([[x0 + 0.15, y0 + k, H], [x0 + TS - 0.15, y0 + k, H]])} fill="none" />
          </g>
        ))}
      </g>
      {/* arrival ring on the tile top: flashes when each ad card lands (2 s cycle) */}
      <OnTop at={[t.cx + 0.25, t.cy + 0.35, H + 0.01]}>
        <circle r={0.75 * U} fill="none" stroke={p.pop} strokeWidth="3" opacity="0">
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.68;0.74;0.95;1" dur="2s" begin={`${-t.i * 0.33}s`} {...rep} />
          <animate attributeName="r" values={`${0.4 * U};${0.4 * U};${0.5 * U};${1.05 * U};${1.05 * U}`} keyTimes="0;0.68;0.74;0.95;1" dur="2s" begin={`${-t.i * 0.33}s`} {...rep} />
        </circle>
      </OnTop>
      {/* the platform's screen (back of the tile) */}
      <IsoBox x={screen.x} y={screen.y} z={H} w={screen.w} d={screen.d} h={screen.h} color={shade(p.tile, -0.05)} u={U} ink={{ stroke: INK, strokeWidth: 1.1 }} />
      <polygon points={poly([[screen.x + 0.12, screen.y + screen.d, H + 0.15], [screen.x + screen.w - 0.12, screen.y + screen.d, H + 0.15], [screen.x + screen.w - 0.12, screen.y + screen.d, H + screen.h - 0.12], [screen.x + 0.12, screen.y + screen.d, H + screen.h - 0.12]])} fill={p.plate} stroke={INK} strokeWidth="1">
        <animate attributeName="fill-opacity" values="0.85;1;0.85" dur="3s" begin={`${-t.i * 0.5}s`} {...rep} />
      </polygon>
      <OnLeftFace at={[screen.x + screen.w / 2, screen.y + screen.d, H + screen.h / 2 + 0.02]}>
        <Glyph i={t.i} c={shade(p.tile, 0.4)} />
      </OnLeftFace>
      {/* budget bars at the front-right: re-level at the rebalance moment */}
      {bars.map(({ a, b, k }) => {
        const bx = x0 + 2.05 + k * 0.0;
        const by = y0 + 0.75 + k * 0.6;
        const [sx, sy] = S([bx, by, H]);
        const top = (h: number) => (sy - h * U).toFixed(1);
        return (
          <g key={k}>
            <line x1={sx} y1={sy} x2={sx} y2={top(a)} stroke={shade(p.plate, -0.25)} strokeWidth="13" />
            <line x1={sx} y1={sy} x2={sx} y2={top(a)} stroke={flagOn && k === 2 ? p.pop : p.plate} strokeWidth="10">
              <animate attributeName="y2" values={`${top(a)};${top(a)};${top(b)};${top(b)};${top(a)}`} keyTimes={`0;${MOMENT};${MOMENT + 0.05};0.92;1`} calcMode="spline" keySplines="0 0 1 1;0.2 0.9 0.1 1;0 0 1 1;0.45 0 0.55 1" dur={`${LOOP}s`} {...rep} />
            </line>
          </g>
        );
      })}
      {/* name on the slab's front-left face */}
      <OnLeftFace at={[x0 + TS / 2, y0 + TS, 0.16]}>
        <text x="0" y="0" textAnchor="middle" fontFamily={FONTS.majormono} fontSize="20" fill={shade(p.tile, -0.78)}>
          {name.toLowerCase()}
        </text>
      </OnLeftFace>
      {/* the winner gets a highlighter flag that rises at the moment */}
      {flagOn && (
        <g>
          {(() => {
            const [fx, fy] = S([x0 + 2.45, y0 + 2.4, H]);
            return (
              <g transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)})`}>
                <line x1="0" y1="0" x2="0" y2="-62" stroke={INK} strokeWidth="2.5" />
                <g>
                  <animateTransform attributeName="transform" type="translate" values="0 40;0 40;0 0;0 0;0 40" keyTimes={`0;${MOMENT};${MOMENT + 0.06};0.94;1`} dur={`${LOOP}s`} {...rep} />
                  <path d="M0 -62 L30 -54 L0 -46 Z" fill={p.pop} stroke={INK} strokeWidth="1" />
                </g>
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
}

export default function PlatformNetwork(p: P) {
  const light = isLight(p.sky);
  const names = p.platforms
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  while (names.length < 6) names.push('');
  const HZ = 0.9; // hub plinth height
  const disc = shade(p.tile, 0.4); // linework on the dark plan disc (contrasts in every variant)
  const [hx, hy] = S([0, 0, 0]);
  const order = [...TILES].sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
  const back = order.filter((t) => t.cx + t.cy < 0);
  const front = order.filter((t) => t.cx + t.cy >= 0);
  // Rail endpoints: from the hub rim to the tile edge.
  const rail = (t: (typeof TILES)[number], z = 0.32) => {
    const d = Math.hypot(t.cx, t.cy);
    const ux = t.cx / d;
    const uy = t.cy / d;
    return { a: [ux * (HUB_R + 0.1), uy * (HUB_R + 0.1), z] as P3, b: [t.cx - ux * (TS / 2 - 0.2), t.cy - uy * (TS / 2 - 0.2), z] as P3 };
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <radialGradient id="pn-sky" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor={shade(p.sky, light ? 0.25 : 0.16)} />
          <stop offset="1" stopColor={shade(p.sky, light ? -0.06 : -0.35)} />
        </radialGradient>
        <radialGradient id="pn-pop">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.85" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pn-lift">
          <stop offset="0" stopColor={p.accent} stopOpacity={light ? 0.25 : 0.35} />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <pattern id="pn-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={p.accent} strokeOpacity={light ? 0.22 : 0.16} strokeWidth="1" />
        </pattern>
        <filter id="pn-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="pn-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Atmosphere: blueprint void with a grid and a soft lift behind the hub ── */}
      <rect width="1200" height="900" fill="url(#pn-sky)" />
      <rect width="1200" height="900" fill="url(#pn-grid)" />
      <ellipse cx={OX} cy={OY + 20} rx="560" ry="380" fill="url(#pn-lift)" />

      {/* registration marks + sheet border */}
      <rect x="24" y="24" width="1152" height="852" fill="none" stroke={p.line} strokeOpacity="0.35" strokeWidth="1.2" />
      {[
        [24, 24],
        [1176, 24],
        [24, 876],
        [1176, 876],
      ].map(([x, y], i) => (
        <g key={i} stroke={p.line} strokeOpacity="0.6" strokeWidth="1.3" fill="none">
          <circle cx={x} cy={y} r="9" />
          <line x1={x - 16} y1={y} x2={x + 16} y2={y} />
          <line x1={x} y1={y - 16} x2={x} y2={y + 16} />
        </g>
      ))}

      {/* a paper plane crosses the sheet once per loop */}
      <g>
        <animateMotion path="M-60 150 C 260 60, 520 210, 820 110 S 1160 90, 1280 60" dur={`${LOOP}s`} rotate="auto" {...rep} />
        <path d="M0 0 L-26 -9 L-20 0 L-26 9 Z" fill={p.line} stroke={INK} strokeWidth="1" />
        <path d="M-20 0 L-26 9 L-14 3 Z" fill={shade(p.line, -0.25)} />
      </g>

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── Ground plane far below: construction circles (compass arcs) slowly turning ── */}
        <OnTop at={[0, 0, GZ]}>
          {[9.6, 11.4].map((r, i) => {
            const c = 2 * Math.PI * r * U;
            const dash = c / 48;
            return (
              <circle key={i} r={r * U} fill="none" stroke={p.accent} strokeOpacity={0.4 - i * 0.12} strokeWidth="1.6" strokeDasharray={`${(dash * 0.35).toFixed(2)} ${(dash * 0.65).toFixed(2)}`}>
                <animateTransform attributeName="transform" type="rotate" values={i ? '0;-7.5' : '0;7.5'} dur={`${LOOP}s`} {...rep} />
              </circle>
            );
          })}
          <circle r={8 * U} fill="none" stroke={p.line} strokeOpacity="0.18" strokeWidth="1" />
          {/* rebalance shockwave on the ground plane */}
          <circle r={2.5 * U} fill="none" stroke={p.pop} strokeWidth="4" opacity="0">
            <animate attributeName="r" values={`${2.5 * U};${2.5 * U};${2.5 * U};${11 * U};${11 * U}`} keyTimes={`0;${MOMENT};${MOMENT + 0.005};${MOMENT + 0.2};1`} dur={`${LOOP}s`} {...rep} />
            <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes={`0;${MOMENT};${MOMENT + 0.005};${MOMENT + 0.2};1`} dur={`${LOOP}s`} {...rep} />
          </circle>
        </OnTop>

        {/* ── Shadows of the floating pieces on the ground plane ── */}
        {TILES.map((t) => (
          <polygon key={`s${t.i}`} points={poly([[t.cx - 1.2 + 0.9, t.cy - 1.2 + 0.9, GZ], [t.cx + 1.6 + 0.9, t.cy - 1.2 + 0.9, GZ], [t.cx + 1.6 + 0.9, t.cy + 1.6 + 0.9, GZ], [t.cx - 1.2 + 0.9, t.cy + 1.6 + 0.9, GZ]])} fill="#020a22" opacity={light ? 0.14 : 0.3} filter="url(#pn-blur)" />
        ))}
        <ellipse cx={S([0.9, 0.9, GZ])[0]} cy={S([0.9, 0.9, GZ])[1]} rx={HUB_R * U * 1.35} ry={HUB_R * U * 0.75} fill="#020a22" opacity={light ? 0.16 : 0.32} filter="url(#pn-blur)" />

        {/* ── Rails: dashed drafting lines from hub to every tile, a dimension tick at each end ── */}
        {TILES.map((t) => {
          const { a, b } = rail(t);
          const hot = t.i === TOP_TILE;
          return (
            <g key={`r${t.i}`}>
              <polyline points={poly([a, b])} fill="none" stroke={shade(p.sky, -0.4)} strokeWidth="7" strokeOpacity="0.45" />
              <polyline points={poly([a, b])} fill="none" stroke={hot ? p.pop : p.line} strokeWidth={hot ? 3 : 2} strokeDasharray="10 7">
                <animate attributeName="stroke-dashoffset" values="0;-34" dur="1.5s" {...rep} />
              </polyline>
            </g>
          );
        })}

        {/* ── Ad cards flying out (2 s), budget coins flying back (3 s) ── */}
        {TILES.map((t) => {
          const { a, b } = rail(t, 0.75);
          const begin = `${-t.i * 0.33}s`;
          return (
            <g key={`c${t.i}`}>
              <animateMotion path={`M${xy(a)} L${xy(b)}`} dur="2s" begin={begin} keyPoints="0;0;1;1" keyTimes="0;0.05;0.72;1" calcMode="linear" {...rep} />
              <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.08;0.66;0.74;1" dur="2s" begin={begin} {...rep} />
              <polygon points={pts([[-0.36, -0.26, 0], [0.36, -0.26, 0], [0.36, 0.26, 0], [-0.36, 0.26, 0]], U)} fill={p.line} stroke={INK} strokeWidth="1" />
              <polygon points={pts([[-0.26, -0.18, 0], [0.06, -0.18, 0], [0.06, 0.16, 0], [-0.26, 0.16, 0]], U)} fill={p.plate} />
              <circle cx={S([0.22, 0, 0])[0]} cy={S([0.22, 0, 0])[1]} r="3" fill={p.pop} />
            </g>
          );
        })}
        {TILES.filter((t) => t.i % 2 === 0).map((t) => {
          const { a, b } = rail(t, 0.55);
          const begin = `${-t.i * 0.5 - 0.7}s`;
          return (
            <g key={`m${t.i}`}>
              <animateMotion path={`M${xy(b)} L${xy(a)}`} dur="3s" begin={begin} keyPoints="0;0;1;1" keyTimes="0;0.1;0.8;1" calcMode="linear" {...rep} />
              <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.14;0.74;0.82;1" dur="3s" begin={begin} {...rep} />
              <ellipse rx="9" ry="5" fill={shade(p.pop, -0.3)} cy="3" />
              <ellipse rx="9" ry="5" fill={p.pop} stroke={INK} strokeWidth="0.8" />
            </g>
          );
        })}

        {/* ── Rebalance moment: a highlighter pulse races out along the rail plane ── */}
        <OnTop at={[0, 0, 0.32]}>
          {[0, 0.035].map((d, i) => {
            const kt = `0;${MOMENT + d};${MOMENT + d + 0.004};${MOMENT + d + 0.16};1`;
            return (
              <circle key={i} r={HUB_R * U} fill="none" stroke={i ? p.line : p.pop} strokeWidth={i ? 2 : 6} opacity="0">
                <animate attributeName="r" values={`${HUB_R * U};${HUB_R * U};${HUB_R * U * 1.05};${R * U * 1.35};${R * U * 1.35}`} keyTimes={kt} dur={`${LOOP}s`} {...rep} />
                <animate attributeName="opacity" values={`0;0;${i ? 0.6 : 1};0;0`} keyTimes={kt} dur={`${LOOP}s`} {...rep} />
              </circle>
            );
          })}
        </OnTop>

        {/* ── Tiles behind the hub ── */}
        {back.map((t) => (
          <Tile key={t.i} t={t} p={p} name={names[t.i]} />
        ))}

        {/* ── The hub: plinth, plan disc with a scribing compass arm, mast + beacon ── */}
        <g>
          <IsoCylinder x={0} y={0} z={-0.4} r={HUB_R} h={HZ + 0.4} color={p.tile} u={U} ink={{ stroke: INK, strokeWidth: 1.3 }} />
          <OnTop at={[0, 0, HZ + 0.005]}>
            <circle r={HUB_R * U * 0.98} fill={p.plate} stroke={INK} strokeWidth="1.2" />
            <circle r={HUB_R * U * 0.82} fill="none" stroke={disc} strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3 6" />
            {Array.from({ length: 24 }, (_, i) => (
              <line key={i} x1="0" y1={-HUB_R * U * 0.9} x2="0" y2={-HUB_R * U * (i % 6 ? 0.84 : 0.78)} stroke={disc} strokeWidth={i % 6 ? 1 : 2} transform={`rotate(${i * 15})`} />
            ))}
            {/* spokes toward each tile */}
            {ANGLES.map((a, i) => (
              <line key={`sp${i}`} x1="0" y1="0" x2={Math.cos(a) * HUB_R * U * 0.62} y2={Math.sin(a) * HUB_R * U * 0.62} stroke={i === TOP_TILE ? p.pop : disc} strokeOpacity={i === TOP_TILE ? 1 : 0.6} strokeWidth={i === TOP_TILE ? 2.5 : 1.2} />
            ))}
            {/* scribed arc trail + compass arm, one turn per 3 s */}
            <g>
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="3s" {...rep} />
              <circle r={HUB_R * U * 0.62} fill="none" stroke={p.pop} strokeWidth="3" strokeDasharray={`${(HUB_R * U * 0.62 * Math.PI * 0.6).toFixed(1)} 999`} transform="rotate(-108)" opacity="0.85" />
              <line x1="0" y1="0" x2={HUB_R * U * 0.62} y2="0" stroke={disc} strokeWidth="3" />
              <circle cx={HUB_R * U * 0.62} cy="0" r="6" fill={p.pop} stroke={INK} strokeWidth="1" />
            </g>
          </OnTop>
          {/* mast (the compass needle) and beacon */}
          <IsoCylinder x={0} y={0} z={HZ} r={0.22} h={1.9} color={shade(p.tile, -0.05)} u={U} ink={{ stroke: INK, strokeWidth: 1.1 }} />
          {(() => {
            const [bx, by] = S([0, 0, HZ + 2.25]);
            return (
              <g>
                <circle cx={bx} cy={by} r="34" fill="url(#pn-pop)" opacity="0.5">
                  <animate attributeName="opacity" values="0.4;0.65;0.4" dur="1.5s" {...rep} />
                  <animate attributeName="r" values="30;30;30;80;30" keyTimes={`0;${MOMENT};${MOMENT + 0.005};${MOMENT + 0.08};1`} dur={`${LOOP}s`} {...rep} />
                </circle>
                <circle cx={bx} cy={by} r="11" fill={p.pop} stroke={INK} strokeWidth="1.2" filter="url(#pn-glow)" />
                <circle cx={bx - 3} cy={by - 3} r="3" fill="#FFFDF2" opacity="0.9" />
              </g>
            );
          })()}
          {/* hub label on the plinth's front-left face */}
          <OnLeftFace at={[-0.2, HUB_R * 0.72, 0.3]}>
            <text x="0" y="0" textAnchor="middle" fontFamily={FONTS.majormono} fontSize="18" fill={shade(p.tile, -0.65)}>
              {p.hub.toLowerCase()}
            </text>
          </OnLeftFace>
        </g>

        {/* ── Tiles in front of the hub ── */}
        {front.map((t) => (
          <Tile key={t.i} t={t} p={p} name={names[t.i]} />
        ))}

        {/* "+27 more" tag floating off the back-right */}
        {p.more && (
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="3s" begin="-1s" {...rep} />
            {(() => {
              const [mx, my] = S([3.2, -9.2, 1.6]);
              const w = p.more.length * 13 + 30;
              return (
                <g transform={`translate(${mx.toFixed(1)} ${my.toFixed(1)})`}>
                  <line x1="0" y1="18" x2="0" y2="58" stroke={p.line} strokeOpacity="0.6" strokeDasharray="3 4" strokeWidth="1.5" />
                  <rect x={-w / 2} y="-18" width={w} height="36" rx="18" fill={p.line} stroke={INK} strokeWidth="1.2" />
                  <text x="0" y="6" textAnchor="middle" fontFamily={FONTS.majormono} fontSize="17" fill={p.sky}>
                    {p.more.toLowerCase()}
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </g>

      {/* title block bottom-right */}
      <g transform="translate(846 806)" fontFamily={FONTS.majormono} fill={p.line}>
        <rect width="306" height="48" fill={shade(p.sky, light ? 0.1 : -0.15)} stroke={p.line} strokeOpacity="0.7" strokeWidth="1.2" />
        <text x="14" y="30" fontSize="14">
          one plan · every platform
        </text>
      </g>
      {/* hub-centre helper so the lift stays aligned if OX/OY change */}
      <circle cx={OX + hx} cy={OY + hy} r="0" />
    </svg>
  );
}
