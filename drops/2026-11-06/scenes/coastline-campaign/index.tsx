import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Coastline Campaign',
  description:
    'Landing-page hero for an AI ad agent: an isometric beach at sunset where six platform billboards (story, feed, search, TV, video, pins) flip to the new creative one by one as a tow plane flies the campaign overhead. Waves lap, gulls flap, palms sway; loops seamlessly.',
  tags: ['hero', 'isometric', 'beach', 'sunset', 'ads', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  towText: text('Tow banner').default('NEW CAMPAIGN · LIVE ON 34'),
  skyTop: color('Sky top').default('#7B2CBF'),
  skyBottom: color('Sky at horizon').default('#FFB627'),
  sun: color('Sun').default('#FFD66B'),
  sea: color('Sea').default('#5B2390'),
  sand: color('Sand').default('#FFD3C2'),
  wood: color('Boardwalk').default('#B9714F'),
  creative: color('New creative').default('#FF4F6D'),
  spark: color('Spark').default('#FFB627'),
  umbrella: color('Umbrellas').default('#FF4F6D'),
  ink: color('Outline').default('#3D0E2A'),
  stars: toggle('Stars').default(false),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  night: { skyTop: '#0E0A24', skyBottom: '#4B2A6B', sun: '#F4EBDD', sea: '#1A1238', sand: '#C9A9B8', wood: '#6E4A55', creative: '#FF4F6D', spark: '#FFD27F', umbrella: '#7B2CBF', ink: '#120A1E', stars: true },
  midday: { skyTop: '#5EC3F2', skyBottom: '#DDF4FF', sun: '#FFF3B0', sea: '#1E88C8', sand: '#F7E3B5', wood: '#C98E5A', creative: '#FF4F6D', spark: '#FFB627', umbrella: '#FF7A00', ink: '#1C2B3A' },
  citrus: { skyTop: '#FF7A00', skyBottom: '#FFE9A8', sun: '#FFF8E1', sea: '#2BB24C', sand: '#FFF1C7', wood: '#C26A2E', creative: '#FF3D7F', spark: '#FFE45C', umbrella: '#2BB24C', ink: '#1C2B1A' },
  'desert-dusk': { skyTop: '#2B1B2E', skyBottom: '#FF8E5E', sun: '#FFD27F', sea: '#45293F', sand: '#E8B9A0', wood: '#7A4A44', creative: '#E5487A', spark: '#FFD27F', umbrella: '#FF8E5E', ink: '#1E1220' },
};

type P = z.infer<typeof schema>;

const U = 48;
const LOOP = scene.loop;
const OX = 424;
const OY = 372;
const HORIZON = 360;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3): [number, number] => {
  const [a, b] = iso(p, U);
  return [a + OX, b + OY];
};
const poly = (ps: P3[]) =>
  pts(ps, U)
    .split(' ')
    .map((xy) => {
      const [a, b] = xy.split(',').map(Number);
      return `${(a + OX).toFixed(1)},${(b + OY).toFixed(1)}`;
    })
    .join(' ');

/** IsoBox placed in the scene's screen offset. */
function Box(props: Parameters<typeof IsoBox>[0]) {
  return (
    <g transform={`translate(${OX} ${OY})`}>
      <IsoBox {...props} />
    </g>
  );
}

// Plane path: screen x of the nose over the loop (right → left), seamless.
const NOSE_T0 = 560;
const X_LEFT = -1600;
const X_RIGHT = 1320;
const SPEED = (X_RIGHT - X_LEFT) / LOOP; // px per second
const JUMP = (NOSE_T0 - X_LEFT) / (X_RIGHT - X_LEFT); // loop fraction when the plane wraps
const PLANE_Y = 150;
/** Loop time (s) when the plane's nose passes screen x. */
const passTime = (x: number) => (x <= NOSE_T0 ? (NOSE_T0 - x) / SPEED : JUMP * LOOP + (X_RIGHT - x) / SPEED);
const REVERT = [JUMP * LOOP - 0.5, JUMP * LOOP - 0.3]; // billboards reset while the plane is offscreen

type Kind = 'story' | 'feed' | 'search' | 'tv' | 'video' | 'pins';
const BOARDS: { kind: Kind; cx: number; w: number; h: number }[] = [
  { kind: 'story', cx: 1.2, w: 1.05, h: 1.9 },
  { kind: 'feed', cx: 3.4, w: 1.6, h: 1.6 },
  { kind: 'search', cx: 5.7, w: 2.0, h: 0.95 },
  { kind: 'tv', cx: 8.0, w: 1.95, h: 1.25 },
  { kind: 'video', cx: 10.3, w: 1.85, h: 1.15 },
  { kind: 'pins', cx: 12.5, w: 1.35, h: 1.8 },
];
const FRONT = 1.05; // billboard face plane (y = const)
const BASE = 0.95; // panel bottom height

/** Flip animation for a billboard's new creative, given the time the plane passes it. */
function flipKeys(tf: number) {
  const f = Math.min(0.996, Math.max(0.002, tf / LOOP));
  const f2 = Math.min(0.998, f + 0.02);
  const [r0, r1] = REVERT.map((t) => t / LOOP);
  if (tf > REVERT[1]) return { values: '1;1;0;0;1;1', keyTimes: `0;${r0.toFixed(4)};${r1.toFixed(4)};${f.toFixed(4)};${f2.toFixed(4)};1` };
  return { values: '0;0;1;1;0;0', keyTimes: `0;${f.toFixed(4)};${f2.toFixed(4)};${r0.toFixed(4)};${r1.toFixed(4)};1` };
}

/** Ad layout drawn in the face's local pixels (W×H). `fresh` = the new Towline creative. */
function Ad({ kind, W, H, p, fresh }: { kind: Kind; W: number; H: number; p: P; fresh: boolean }) {
  const bg = fresh ? p.creative : shade(p.sand, 0.55);
  const fg = fresh ? '#FFF6EF' : shade(p.ink, 0.55);
  const block = fresh ? p.spark : shade(p.sand, -0.12);
  const line = { stroke: p.ink, strokeWidth: 1 };
  const sun = (cx: number, cy: number, r: number) =>
    fresh ? (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={p.spark} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={cx - r} y={cy + r * (0.1 + i * 0.3)} width={r * 2} height={r * (0.08 + i * 0.05)} fill={bg} />
        ))}
      </g>
    ) : (
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={3} fill={block} />
    );
  const bars = (x: number, y: number, w: number, n: number, gap: number) =>
    Array.from({ length: n }, (_, i) => <rect key={i} x={x} y={y + i * gap} width={w * (i === n - 1 ? 0.6 : 1)} height={gap * 0.45} rx={gap * 0.2} fill={fg} opacity={0.9} />);
  switch (kind) {
    case 'story':
      return (
        <g>
          <rect x={0} y={0} width={W} height={H} rx={8} fill={bg} {...line} />
          <rect x={W * 0.12} y={4} width={W * 0.76} height={2.5} rx={1} fill={fg} opacity={0.6} />
          {sun(W / 2, H * 0.38, W * 0.26)}
          {bars(W * 0.16, H * 0.62, W * 0.68, 2, 7)}
          <rect x={W * 0.18} y={H * 0.82} width={W * 0.64} height={9} rx={4.5} fill={fresh ? p.ink : fg} />
        </g>
      );
    case 'feed':
      return (
        <g>
          <rect x={0} y={0} width={W} height={H} rx={4} fill={shade(p.sand, 0.7)} {...line} />
          <circle cx={8} cy={8} r={4} fill={fresh ? p.creative : block} />
          <rect x={15} y={6} width={W * 0.35} height={4} rx={2} fill={shade(p.ink, 0.5)} />
          <rect x={4} y={16} width={W - 8} height={H - 32} fill={bg} />
          {sun(W / 2, 16 + (H - 32) * 0.45, (H - 32) * 0.26)}
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={9 + i * 10} cy={H - 8} r={3} fill={i === 0 && fresh ? p.creative : shade(p.ink, 0.5)} />
          ))}
        </g>
      );
    case 'search':
      return (
        <g>
          <rect x={0} y={0} width={W} height={H} rx={4} fill={shade(p.sand, 0.7)} {...line} />
          <rect x={6} y={5} width={W - 12} height={8} rx={4} fill="#FFFFFF" stroke={shade(p.ink, 0.5)} strokeWidth={0.8} />
          <rect x={6} y={17} width={W * 0.42} height={4} rx={2} fill={fresh ? p.creative : shade(p.ink, 0.4)} />
          <rect x={6} y={24} width={W * 0.8} height={3} rx={1.5} fill={shade(p.ink, 0.55)} />
          <rect x={6} y={29} width={W * 0.65} height={3} rx={1.5} fill={shade(p.ink, 0.55)} />
          {fresh && <rect x={W - 26} y={16} width={20} height={7} rx={3.5} fill={p.spark} />}
        </g>
      );
    case 'tv':
      return (
        <g>
          <rect x={0} y={0} width={W} height={H} rx={5} fill={shade(p.ink, 0.15)} {...line} />
          <rect x={4} y={4} width={W - 8} height={H - 8} rx={3} fill={bg} />
          {sun(W * 0.32, H * 0.5, H * 0.26)}
          {bars(W * 0.58, H * 0.32, W * 0.32, 3, 8)}
        </g>
      );
    case 'video':
      return (
        <g>
          <rect x={0} y={0} width={W} height={H} rx={4} fill={bg} {...line} />
          {sun(W * 0.5, H * 0.45, H * 0.28)}
          <path d={`M${W * 0.46},${H * 0.33} L${W * 0.58},${H * 0.45} L${W * 0.46},${H * 0.57} Z`} fill={fresh ? p.ink : fg} opacity={0.9} />
          <rect x={5} y={H - 8} width={W - 10} height={3} rx={1.5} fill={fg} opacity={0.4} />
          <rect x={5} y={H - 8} width={(W - 10) * (fresh ? 0.7 : 0.3)} height={3} rx={1.5} fill={fresh ? p.spark : fg} />
        </g>
      );
    default:
      return (
        <g>
          <rect x={0} y={0} width={W} height={H} rx={4} fill={shade(p.sand, 0.7)} {...line} />
          <rect x={4} y={4} width={W / 2 - 6} height={H * 0.55} rx={3} fill={bg} />
          <rect x={W / 2 + 2} y={4} width={W / 2 - 6} height={H * 0.35} rx={3} fill={block} />
          <rect x={4} y={H * 0.55 + 8} width={W / 2 - 6} height={H * 0.4 - 12} rx={3} fill={block} />
          <rect x={W / 2 + 2} y={H * 0.35 + 8} width={W / 2 - 6} height={H * 0.6 - 12} rx={3} fill={bg} />
          {fresh && sun(W * 0.25, H * 0.28, W * 0.13)}
        </g>
      );
  }
}

function Billboard({ b, p, i }: { b: (typeof BOARDS)[number]; p: P; i: number }) {
  const x0 = b.cx - b.w / 2;
  const top = BASE + b.h;
  const [ox, oy] = S([x0, FRONT, top]);
  const [mx] = S([b.cx, FRONT, top]);
  const tf = passTime(mx);
  const k = flipKeys(tf);
  const Wpx = b.w * U;
  const Hpx = b.h * U;
  const [sx, sy] = S([b.cx, FRONT, top + 0.15]);
  const f = tf / LOOP;
  const ring = `0;${Math.max(0.001, f - 0.001).toFixed(4)};${f.toFixed(4)};${Math.min(0.999, f + 0.06).toFixed(4)};1`;
  const ink = { stroke: p.ink };
  return (
    <g>
      {/* shadow on the boardwalk */}
      <polygon points={poly([[x0, FRONT, 0.13], [x0 + b.w, FRONT, 0.13], [x0 + b.w + 0.3, FRONT + 0.9, 0.13], [x0 + 0.3, FRONT + 0.9, 0.13]])} fill={p.ink} opacity={0.18} filter="url(#cc-blur)" />
      {/* posts */}
      {(b.w > 1.2 ? [x0 + 0.25, x0 + b.w - 0.37] : [b.cx - 0.06]).map((px) => (
        <Box key={px} x={px} y={FRONT - 0.2} z={0.12} w={0.12} d={0.12} h={BASE - 0.1} color={shade(p.wood, -0.25)} u={U} ink={ink} />
      ))}
      {b.kind === 'tv' && <Box x={b.cx - 0.5} y={FRONT - 0.32} z={BASE - 0.12} w={1} d={0.25} h={0.12} color={shade(p.ink, 0.25)} u={U} ink={ink} />}
      {/* panel body */}
      <Box x={x0} y={FRONT - 0.16} z={BASE} w={b.w} d={0.16} h={b.h} color={shade(p.ink, 0.35)} u={U} ink={ink} />
      {/* creative on the front face */}
      <g transform={`translate(${ox} ${oy}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
        <g transform={`scale(1 1)`}>
          <Ad kind={b.kind} W={Wpx} H={Hpx} p={p} fresh={false} />
          <g opacity={k.values[0]}>
            <animate attributeName="opacity" values={k.values} keyTimes={k.keyTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
            <Ad kind={b.kind} W={Wpx} H={Hpx} p={p} fresh />
          </g>
          {/* glass sheen */}
          <path d={`M${Wpx * 0.1},0 L${Wpx * 0.3},0 L${Wpx * 0.05},${Hpx * 0.4} L0,${Hpx * 0.4} L0,${Hpx * 0.15} Z`} fill="#FFFFFF" opacity={0.14} />
        </g>
      </g>
      {/* the moment: a spark pops as the creative flips */}
      <circle cx={sx} cy={sy} r={4} fill="none" stroke={p.spark} strokeWidth={3} opacity={0}>
        <animate attributeName="r" values="4;4;4;34;34" keyTimes={ring} dur={`${LOOP}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={ring} dur={`${LOOP}s`} repeatCount="indefinite" />
      </circle>
      <g transform={`translate(${sx} ${sy})`} opacity={0}>
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={ring} dur={`${LOOP}s`} repeatCount="indefinite" />
        <path d="M0,-14 L3,-3 L14,0 L3,3 L0,14 L-3,3 L-14,0 L-3,-3 Z" fill={p.spark} stroke={p.ink} strokeWidth={1} transform={`rotate(${i * 12})`} />
      </g>
    </g>
  );
}

function Umbrella({ x, y, p, k }: { x: number; y: number; p: P; k: number }) {
  const [gx, gy] = S([x, y, 0]);
  const [tx, ty] = S([x, y, 1.6]);
  const r = 34;
  const segs = 6;
  return (
    <g>
      <ellipse cx={gx - 18} cy={gy + 8} rx={36} ry={14} fill={p.ink} opacity={0.18} filter="url(#cc-blur)" />
      <line x1={gx} y1={gy} x2={tx} y2={ty} stroke={p.ink} strokeWidth={2.4} />
      <g>
        <animateTransform attributeName="transform" type="rotate" values={`-2 ${tx} ${ty};2 ${tx} ${ty};-2 ${tx} ${ty}`} dur="4s" begin={`-${k}s`} repeatCount="indefinite" />
        {Array.from({ length: segs }, (_, i) => {
          const a0 = Math.PI + (i / segs) * Math.PI;
          const a1 = Math.PI + ((i + 1) / segs) * Math.PI;
          return (
            <path
              key={i}
              d={`M${tx},${ty - 14} L${tx + Math.cos(a0) * r},${ty + 4 + Math.sin(a0) * 4} Q${tx + Math.cos((a0 + a1) / 2) * r * 1.02},${ty + 10} ${tx + Math.cos(a1) * r},${ty + 4 + Math.sin(a1) * 4} Z`}
              fill={i % 2 ? '#FFF6EF' : p.umbrella}
              stroke={p.ink}
              strokeWidth={1.1}
              strokeLinejoin="round"
            />
          );
        })}
        <circle cx={tx} cy={ty - 15} r={2.5} fill={p.ink} />
      </g>
    </g>
  );
}

function Palm({ x, y, p, k, s = 1 }: { x: number; y: number; p: P; k: number; s?: number }) {
  const [gx, gy] = S([x, y, 0]);
  const hx = gx + 16 * s;
  const hy = gy - 120 * s;
  const leaf = shade(p.sea, 0.1) === p.sea ? '#2F8C5A' : '#2F8C5A';
  return (
    <g>
      <ellipse cx={gx - 30 * s} cy={gy + 6} rx={46 * s} ry={14 * s} fill={p.ink} opacity={0.16} filter="url(#cc-blur)" />
      <path d={`M${gx - 5 * s},${gy} Q${gx + 2 * s},${gy - 60 * s} ${hx - 3 * s},${hy} L${hx + 4 * s},${hy + 2} Q${gx + 10 * s},${gy - 60 * s} ${gx + 5 * s},${gy} Z`} fill={shade(p.wood, -0.1)} stroke={p.ink} strokeWidth={1.1} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${hx},${hy + 4 + i * 18 * s} l${10 * s},${-3 * s}`} stroke={shade(p.wood, -0.4)} strokeWidth={1.2} transform={`translate(${-i * 2.5 * s} 0)`} />
      ))}
      <g>
        <animateTransform attributeName="transform" type="rotate" values={`-3 ${hx} ${hy};3 ${hx} ${hy};-3 ${hx} ${hy}`} dur="4s" begin={`-${k}s`} repeatCount="indefinite" />
        {[-160, -120, -60, -20, 20, 160].map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const L = (i % 2 ? 62 : 54) * s;
          const ex = hx + Math.cos(rad) * L;
          const ey = hy + Math.sin(rad) * L * 0.6 + 26 * s;
          const cx = hx + Math.cos(rad) * L * 0.5;
          const cy = hy + Math.sin(rad) * L * 0.5 - 16 * s;
          return <path key={a} d={`M${hx},${hy} Q${cx},${cy - 6 * s} ${ex},${ey} Q${cx + 4 * s},${cy + 8 * s} ${hx},${hy + 4 * s} Z`} fill={i % 2 ? leaf : shade(leaf, 0.18)} stroke={p.ink} strokeWidth={1.1} strokeLinejoin="round" />;
        })}
        <circle cx={hx - 4 * s} cy={hy + 5 * s} r={5 * s} fill={shade(p.wood, -0.3)} stroke={p.ink} strokeWidth={1} />
        <circle cx={hx + 5 * s} cy={hy + 6 * s} r={5 * s} fill={shade(p.wood, -0.2)} stroke={p.ink} strokeWidth={1} />
      </g>
    </g>
  );
}

function PlaneShape({ p }: { p: P }) {
  const ink = { stroke: p.ink, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  const body = '#FFF6EF';
  return (
    <g>
      <path d="M2,-4 L-3,-25 C-3,-27 -1,-28 2,-27 L10,-25 L26,-6 Z" fill={p.creative} {...ink} />
      <ellipse cx={11} cy={-2} rx={12} ry={2.6} fill={body} {...ink} />
      <path d="M0,-3 C14,-8 40,-12 70,-12 C86,-12 96,-8 100,-2 L100,4 C96,8 88,10 70,10 L28,9 C14,8 4,5 0,1 Z" fill={body} {...ink} />
      <path d="M6,2.2 L97,2.2" stroke={p.creative} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M62,-11 C67,-20 80,-20 86,-10 Z" fill={shade(p.skyTop, 0.55)} {...ink} />
      {[34, 43, 52].map((x) => (
        <circle key={x} cx={x} cy={-4} r={2.3} fill={p.skyTop} />
      ))}
      <line x1={52} y1={-12} x2={45} y2={7} stroke={p.ink} strokeWidth={1.4} />
      <ellipse cx={58} cy={-14} rx={20} ry={3.4} fill={body} {...ink} />
      <path d="M92,-7 C97,-6 100,-3 101.5,0 C100,3 97,6 92,7 Z" fill={p.creative} {...ink} />
      <line x1={62} y1={9} x2={64} y2={16} stroke={p.ink} strokeWidth={1.6} />
      <circle cx={64} cy={17.5} r={3.6} fill={p.ink} />
      <ellipse cx={104} cy={0} rx={2.4} ry={19} fill={p.ink} opacity={0.14} />
      <line x1={103.5} y1={-17} x2={103.5} y2={17} stroke={p.ink} strokeWidth={2.6} strokeLinecap="round">
        <animateTransform attributeName="transform" type="scale" values="1 1;1 -1;1 1" dur="0.25s" additive="sum" repeatCount="indefinite" />
      </line>
      <circle cx={103.5} cy={0} r={2.6} fill={p.ink} />
    </g>
  );
}

/** Tow banner whose ripple travels along it (the path `d` is animated). */
function TowBanner({ x0, y, BL, BH, label, p }: { x0: number; y: number; BL: number; BH: number; label: string; p: P }) {
  const N = 40;
  const shape = (phase: number) => {
    const A = BH * 0.13;
    const wv = (d: number) => A * Math.sin(d * Math.PI * 2.6 - phase) * (0.2 + 0.8 * d);
    const top: string[] = [];
    const bot: string[] = [];
    const mid: string[] = [];
    for (let i = 0; i <= N; i++) {
      const d = i / N;
      const x = x0 + d * BL;
      const w = wv(d);
      top.push(`${x.toFixed(1)},${(y - BH / 2 + w).toFixed(1)}`);
      bot.push(`${x.toFixed(1)},${(y + BH / 2 + w * 1.1).toFixed(1)}`);
      mid.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${(y + w * 1.05).toFixed(1)}`);
    }
    return {
      outline: `M${top.join(' L')} L${(x0 + BL - BH * 0.32).toFixed(1)},${(y + wv(1)).toFixed(1)} L${bot.reverse().join(' L')} Z`,
      mid: mid.join(' '),
    };
  };
  const phases = [0, 1, 2, 3, 4].map((k) => shape((k / 4) * Math.PI * 2));
  const fs = BH * 0.44;
  return (
    <g>
      <path d={phases[0].outline} transform={`translate(${BH * 0.12} ${BH * 0.14})`} fill={p.ink} opacity={0.85}>
        <animate attributeName="d" values={phases.map((s) => s.outline).join(';')} dur="1s" repeatCount="indefinite" />
      </path>
      <path d={phases[0].outline} fill={p.creative} stroke={p.ink} strokeWidth={1.4} strokeLinejoin="round">
        <animate attributeName="d" values={phases.map((s) => s.outline).join(';')} dur="1s" repeatCount="indefinite" />
      </path>
      <path id="cc-mid" d={phases[0].mid} fill="none">
        <animate attributeName="d" values={phases.map((s) => s.mid).join(';')} dur="1s" repeatCount="indefinite" />
      </path>
      <text fontFamily={FONTS.spacemono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.12} fill="#FFF6EF" dy={fs * 0.36}>
        <textPath href="#cc-mid" startOffset={BH * 0.55}>
          {label}
        </textPath>
      </text>
      <line x1={x0} y1={y - BH * 0.62} x2={x0} y2={y + BH * 0.62} stroke={p.ink} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}

function Gull({ x, y, s, p, k, path }: { x: number; y: number; s: number; p: P; k: number; path: string }) {
  return (
    <g>
      <animateMotion dur={`${LOOP}s`} begin={`-${k}s`} repeatCount="indefinite" path={path} />
      <path stroke={p.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" d={`M${x - s},${y} Q${x - s / 2},${y - s * 0.8} ${x},${y} Q${x + s / 2},${y - s * 0.8} ${x + s},${y}`}>
        <animate
          attributeName="d"
          values={`M${x - s},${y} Q${x - s / 2},${y - s * 0.8} ${x},${y} Q${x + s / 2},${y - s * 0.8} ${x + s},${y};M${x - s},${y - s * 0.3} Q${x - s / 2},${y + s * 0.3} ${x},${y} Q${x + s / 2},${y + s * 0.3} ${x + s},${y - s * 0.3};M${x - s},${y} Q${x - s / 2},${y - s * 0.8} ${x},${y} Q${x + s / 2},${y - s * 0.8} ${x + s},${y}`}
          dur="0.5s"
          begin={`-${k / 4}s`}
          repeatCount="indefinite"
        />
      </path>
    </g>
  );
}

export default function CoastlineCampaign(p: P) {
  const night = p.stars;
  const sunX = 600;
  const sunY = 262;
  const sunR = 118;
  const n = p.towText.length;
  const BH = 44;
  const Lp = BH * 3.4;
  const BL = (n * 0.335 + 1.4) * BH;
  const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

  // Island outline for the foam ring
  const W0 = 14;
  const D0 = 5.4;
  const rim = poly([[-0.25, -0.25, -0.75], [W0 + 0.25, -0.25, -0.75], [W0 + 0.25, D0 + 0.25, -0.75], [-0.25, D0 + 0.25, -0.75]]);

  const stars: ReactNode[] = [];
  if (night) {
    for (let i = 0; i < 60; i++) {
      const dur = [2, 4, 8][i % 3];
      stars.push(
        <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 380} r={0.6 + rand(i * 1.3) * 1.4} fill="#FFFFFF">
          <animate attributeName="opacity" values="0.2;1;0.2" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
        </circle>,
      );
    }
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="cc-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={HORIZON}>
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="0.6" stopColor={shade(p.creative, 0.05)} stopOpacity={night ? 0.25 : 1} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <linearGradient id="cc-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.sea, 0.12)} />
          <stop offset="1" stopColor={shade(p.sea, -0.35)} />
        </linearGradient>
        <radialGradient id="cc-halo">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.55" />
          <stop offset="0.4" stopColor={p.sun} stopOpacity="0.15" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <clipPath id="cc-above">
          <rect x="0" y="0" width="1200" height={HORIZON} />
        </clipPath>
        <filter id="cc-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="cc-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height={HORIZON} fill="url(#cc-sky)" />
      {stars}
      <circle cx={sunX} cy={sunY} r={sunR * 2.6} fill="url(#cc-halo)">
        <animate attributeName="r" values={`${sunR * 2.5};${sunR * 2.75};${sunR * 2.5}`} dur="4s" repeatCount="indefinite" {...spline} />
      </circle>
      <g clipPath="url(#cc-above)">
        <circle cx={sunX} cy={sunY} r={sunR} fill={p.sun} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={sunX - sunR - 4} y={sunY + sunR * (0.05 + i * 0.19)} width={sunR * 2 + 8} height={sunR * (0.03 + i * 0.025)} fill={p.skyBottom} opacity={0.9}>
            <animate attributeName="y" values={`${sunY + sunR * (0.05 + i * 0.19)};${sunY + sunR * (0.1 + i * 0.19)};${sunY + sunR * (0.05 + i * 0.19)}`} dur="4s" repeatCount="indefinite" {...spline} />
          </rect>
        ))}
      </g>
      {/* clouds drift */}
      {[
        { x: 170, y: 150, s: 1, d: 30 },
        { x: 960, y: 110, s: 0.75, d: -24 },
        { x: 820, y: 300, s: 0.6, d: 18 },
      ].map((c, i) => (
        <g key={i} opacity={night ? 0.35 : 0.95}>
          <animateTransform attributeName="transform" type="translate" values={`0 0;${c.d} 0;0 0`} dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
          <path
            d={`M${c.x - 70 * c.s},${c.y} C${c.x - 70 * c.s},${c.y - 30 * c.s} ${c.x - 40 * c.s},${c.y - 42 * c.s} ${c.x - 20 * c.s},${c.y - 28 * c.s} C${c.x - 12 * c.s},${c.y - 62 * c.s} ${c.x + 30 * c.s},${c.y - 66 * c.s} ${c.x + 36 * c.s},${c.y - 30 * c.s} C${c.x + 56 * c.s},${c.y - 42 * c.s} ${c.x + 78 * c.s},${c.y - 20 * c.s} ${c.x + 70 * c.s},${c.y} Z`}
            fill={shade(p.sand, 0.45)}
          />
          <path d={`M${c.x - 50 * c.s},${c.y - 1} L${c.x + 60 * c.s},${c.y - 1}`} stroke={p.ink} strokeOpacity={0.15} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}

      {/* ── Sea ── */}
      <rect y={HORIZON} width="1200" height={900 - HORIZON} fill="url(#cc-sea)" />
      <line x1="0" y1={HORIZON} x2="1200" y2={HORIZON} stroke={p.ink} strokeOpacity={0.5} strokeWidth={1.5} />
      {/* sun glitter on the water */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={sunX - sunR * (1 - i * 0.16)} y={HORIZON + 8 + i * 12} width={sunR * 2 * (1 - i * 0.16)} height={4} rx={2} fill={p.sun} opacity={0.75 - i * 0.12}>
          <animate attributeName="opacity" values={`${0.75 - i * 0.12};${0.35 - i * 0.05};${0.75 - i * 0.12}`} dur="2s" begin={`-${i * 0.4}s`} repeatCount="indefinite" />
        </rect>
      ))}
      {/* wave dashes */}
      <g stroke={shade(p.sea, 0.45)} strokeWidth={2.2} strokeLinecap="round" opacity={0.7}>
        {Array.from({ length: 26 }, (_, i) => {
          const x = rand(i * 2.7) * 1200;
          const y = HORIZON + 50 + rand(i * 5.3) * 400;
          const l = 12 + rand(i * 1.9) * 26;
          return (
            <line key={i} x1={x} y1={y} x2={x + l} y2={y}>
              <animateTransform attributeName="transform" type="translate" values={`0 0;${10 + (i % 3) * 4} 0;0 0`} dur="4s" begin={`-${(rand(i) * 4).toFixed(2)}s`} repeatCount="indefinite" />
            </line>
          );
        })}
      </g>
      {/* sailboat drifting */}
      <g transform="translate(-30 -70)">
        <animateTransform attributeName="transform" type="translate" values="0 0;46 -3;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <g>
          <animateTransform attributeName="transform" type="rotate" values="-3 140 520;3 140 520;-3 140 520" dur="2s" repeatCount="indefinite" />
          <path d="M104,516 L176,516 L166,530 L114,530 Z" fill={shade(p.wood, -0.1)} stroke={p.ink} strokeWidth={1.2} />
          <line x1={140} y1={516} x2={140} y2={438} stroke={p.ink} strokeWidth={2} />
          <path d="M142,442 L142,510 L180,510 Z" fill="#FFF6EF" stroke={p.ink} strokeWidth={1.2} />
          <path d="M138,450 L138,510 L110,510 Z" fill={p.creative} stroke={p.ink} strokeWidth={1.2} />
        </g>
      </g>
      {/* buoy */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="2s" repeatCount="indefinite" {...spline} />
        <ellipse cx={1060} cy={760} rx={18} ry={6} fill={shade(p.sea, -0.4)} opacity={0.6} />
        <path d="M1048,758 L1052,728 L1068,728 L1072,758 Z" fill={p.creative} stroke={p.ink} strokeWidth={1.2} />
        <rect x={1050} y={738} width={20} height={6} fill="#FFF6EF" />
        <line x1={1060} y1={728} x2={1060} y2={712} stroke={p.ink} strokeWidth={2} />
        <circle cx={1060} cy={710} r={4} fill={p.spark} filter="url(#cc-glow)">
          <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* ── Island ── */}
      {/* foam ring laps the shore */}
      <polygon points={rim} fill="none" stroke="#FFF6EF" strokeWidth={6} strokeLinejoin="round" opacity={0.6}>
        <animate attributeName="stroke-width" values="4;10;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.25;0.7" dur="2s" repeatCount="indefinite" />
      </polygon>
      <Box x={0} y={0} z={-0.75} w={W0} d={D0} h={0.75} color={p.sand} u={U} ink={{ stroke: p.ink }} />
      {/* wet sand band + speckles */}
      <polygon points={poly([[0, D0 - 0.5, 0.005], [W0, D0 - 0.5, 0.005], [W0, D0, 0.005], [0, D0, 0.005]])} fill={shade(p.sand, -0.12)} />
      <polygon points={poly([[W0 - 0.5, 0, 0.005], [W0, 0, 0.005], [W0, D0, 0.005], [W0 - 0.5, D0, 0.005]])} fill={shade(p.sand, -0.12)} />
      {Array.from({ length: 40 }, (_, i) => {
        const [sx, sy] = S([0.3 + rand(i * 4.4) * 13.4, 2 + rand(i * 8.1) * 3, 0.01]);
        return <circle key={i} cx={sx} cy={sy} r={1.2} fill={shade(p.sand, -0.3)} opacity={0.6} />;
      })}
      {/* boardwalk */}
      <Box x={0.2} y={0.15} z={0} w={W0 - 0.4} d={1.4} h={0.12} color={p.wood} u={U} ink={{ stroke: p.ink }} />
      <g stroke={shade(p.wood, -0.35)} strokeWidth={1} opacity={0.8}>
        {Array.from({ length: 27 }, (_, i) => (
          <polyline key={i} fill="none" points={poly([[0.7 + i * 0.5, 0.15, 0.121], [0.7 + i * 0.5, 1.55, 0.121]])} />
        ))}
      </g>

      {BOARDS.map((b, i) => (
        <Billboard key={b.kind} b={b} p={p} i={i} />
      ))}

      {/* lamps along the boardwalk, flickering */}
      {[2.3, 9.15].map((lx, i) => {
        const [bx, by] = S([lx, 1.45, 0.12]);
        const [hx, hy] = S([lx, 1.45, 2.0]);
        return (
          <g key={lx}>
            <line x1={bx} y1={by} x2={hx} y2={hy} stroke={p.ink} strokeWidth={2.4} />
            <circle cx={hx} cy={hy} r={night ? 14 : 8} fill={p.spark} opacity={0.35} filter="url(#cc-glow)">
              <Flicker dur={LOOP} seed={i + 3} low={0.4} />
            </circle>
            <circle cx={hx} cy={hy} r={5} fill={p.spark} stroke={p.ink} strokeWidth={1.2}>
              <Flicker dur={LOOP} seed={i + 3} low={0.5} />
            </circle>
          </g>
        );
      })}

      {/* beach life */}
      <Palm x={0.5} y={2.2} p={p} k={0} s={0.95} />
      <polygon points={poly([[2.4, 2.6, 0.01], [3.6, 2.6, 0.01], [3.6, 3.2, 0.01], [2.4, 3.2, 0.01]])} fill={p.umbrella} stroke={p.ink} strokeWidth={1} />
      <polygon points={poly([[2.4, 2.8, 0.012], [3.6, 2.8, 0.012], [3.6, 2.95, 0.012], [2.4, 2.95, 0.012]])} fill="#FFF6EF" />
      <Umbrella x={3.2} y={2.3} p={p} k={0.5} />
      <polygon points={poly([[6.3, 3.0, 0.01], [7.5, 3.0, 0.01], [7.5, 3.6, 0.01], [6.3, 3.6, 0.01]])} fill={shade(p.skyTop, 0.3)} stroke={p.ink} strokeWidth={1} />
      <Umbrella x={7.1} y={2.7} p={p} k={1.6} />
      {/* beach ball bouncing */}
      {(() => {
        const [bx, by] = S([5.0, 4.0, 0]);
        return (
          <g>
            <ellipse cx={bx} cy={by} rx={12} ry={4} fill={p.ink} opacity={0.2}>
              <animate attributeName="rx" values="12;7;12" dur="1s" repeatCount="indefinite" {...spline} />
            </ellipse>
            <g>
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -38;0 0" dur="1s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.2 0.6 0.4 1;0.6 0 0.8 0.4" />
              <circle cx={bx} cy={by - 11} r={11} fill="#FFF6EF" stroke={p.ink} strokeWidth={1.2} />
              <path d={`M${bx - 11},${by - 11} A11,11 0 0 1 ${bx},${by - 22} L${bx},${by - 11} Z`} fill={p.creative} />
              <path d={`M${bx + 11},${by - 11} A11,11 0 0 1 ${bx},${by} L${bx},${by - 11} Z`} fill={p.spark} />
              <circle cx={bx} cy={by - 11} r={11} fill="none" stroke={p.ink} strokeWidth={1.2} />
            </g>
          </g>
        );
      })()}
      <Umbrella x={10.2} y={3.1} p={p} k={2.4} />
      <polygon points={poly([[9.4, 3.5, 0.01], [10.6, 3.5, 0.01], [10.6, 4.1, 0.01], [9.4, 4.1, 0.01]])} fill={p.spark} stroke={p.ink} strokeWidth={1} />
      {/* lifeguard tower */}
      <g>
        {[
          [12.0, 2.6],
          [12.9, 2.6],
          [12.0, 3.5],
          [12.9, 3.5],
        ].map(([lx, ly]) => (
          <Box key={`${lx}-${ly}`} x={lx} y={ly} w={0.1} d={0.1} h={1.5} color={shade(p.wood, 0.1)} u={U} ink={{ stroke: p.ink }} />
        ))}
        <Box x={11.85} y={2.45} z={1.5} w={1.3} d={1.3} h={0.75} color="#FFF6EF" u={U} ink={{ stroke: p.ink }} />
        <polygon points={poly([[11.95, 3.75, 1.65], [13.05, 3.75, 1.65], [13.05, 3.75, 2.1], [11.95, 3.75, 2.1]])} fill={p.creative} stroke={p.ink} strokeWidth={1} />
        <Box x={11.7} y={2.3} z={2.25} w={1.6} d={1.6} h={0.12} color={p.umbrella} u={U} ink={{ stroke: p.ink }} />
        {(() => {
          const [fx, fy] = S([13.2, 2.4, 2.37]);
          return (
            <g>
              <line x1={fx} y1={fy} x2={fx} y2={fy - 34} stroke={p.ink} strokeWidth={2} />
              <path fill={p.spark} stroke={p.ink} strokeWidth={1}>
                <animate attributeName="d" values={`M${fx},${fy - 34} L${fx + 22},${fy - 30} L${fx},${fy - 24} Z;M${fx},${fy - 34} L${fx + 20},${fy - 27} L${fx},${fy - 24} Z;M${fx},${fy - 34} L${fx + 22},${fy - 30} L${fx},${fy - 24} Z`} dur="1s" repeatCount="indefinite" />
              </path>
            </g>
          );
        })()}
      </g>
      <Palm x={1.1} y={4.9} p={p} k={2} s={1.1} />

      {/* ── The tow: flies the campaign across; billboards flip as it passes ── */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`0 0;${X_LEFT - NOSE_T0} 0;${X_RIGHT - NOSE_T0} 0;0 0`}
          keyTimes={`0;${JUMP.toFixed(4)};${(JUMP + 0.0001).toFixed(4)};1`}
          dur={`${LOOP}s`}
          repeatCount="indefinite"
        />
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="2s" repeatCount="indefinite" {...spline} />
          <path d={`M${NOSE_T0 + Lp},${PLANE_Y - 2} L${NOSE_T0 + Lp + BH * 0.5},${PLANE_Y + 3}`} stroke={p.ink} strokeWidth={1.6} />
          <TowBanner x0={NOSE_T0 + Lp + BH * 0.5} y={PLANE_Y + 3} BL={BL} BH={BH} label={p.towText} p={p} />
          <g transform={`translate(${NOSE_T0 + Lp} ${PLANE_Y}) scale(${-Lp / 100} ${Lp / 100})`}>
            <PlaneShape p={p} />
          </g>
        </g>
      </g>

      <Gull x={0} y={0} s={9} p={p} k={0} path="M300,250 C420,220 560,240 700,200 C840,170 980,190 1100,160 C980,190 840,170 700,200 C560,240 420,220 300,250" />
      <Gull x={0} y={0} s={7} p={p} k={3} path="M880,380 C800,350 700,360 620,330 C540,300 460,320 380,300 C460,320 540,300 620,330 C700,360 800,350 880,380" />
    </svg>
  );
}
