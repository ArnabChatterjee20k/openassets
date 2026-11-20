import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, iso, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Ink Exchange',
  description:
    'Landing-page hero for an AI ad agent’s budget engine: an isometric night plaza where a central ink reservoir (the budget) pumps ink through pipes to six platform billboards. The agent’s eye watches the scores, valves spin, and every loop it re-routes a pink surge to the winning billboard with a “+$2.4k” tag.',
  tags: ['hero', 'isometric', 'landing page', 'network', 'budget', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Hub sign').default('INKRUN EXCHANGE'),
  note: text('Handwritten note').default('budget follows the winners'),
  platforms: text('Billboards (comma separated, 6)').default('Meta, YouTube, LinkedIn, Pinterest, Reddit, TikTok'),
  scores: text('ROAS per billboard (comma separated)').default('2.1×, 1.8×, 1.2×, 2.6×, 1.5×, 4.2×'),
  tag: text('Re-route tag').default('+$2.4k'),
  sky: color('Sky').default('#12001F'),
  floor: color('Plaza').default('#24003D'),
  machine: color('Machines').default('#E9DDF5'),
  paper: color('Paper').default('#FBEFFF'),
  ink1: color('Ink 1').default('#B026FF'),
  ink2: color('Ink 2').default('#FF2E88'),
  pop: color('Highlighter').default('#FFD600'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { sky: '#2B1B2E', floor: '#45293F', ink1: '#E5487A', ink2: '#FF8E5E', pop: '#FFD27F', paper: '#FFE9D6', machine: '#FFE9D6' },
  daylight: { sky: '#CFE6F7', floor: '#D6CCEC', machine: '#FFFFFF', ink1: '#5E4AE3', ink2: '#F49CBB', pop: '#2EC4B6', paper: '#FFFFFF' },
  risograph: { sky: '#F4EFE6', floor: '#EAE2D3', machine: '#FFFFFF', paper: '#FFFFFF', ink1: '#0078BF', ink2: '#FF48B0', pop: '#FFE800' },
  lava: { sky: '#1A0A06', floor: '#2E120B', ink1: '#FF4D00', ink2: '#FFB000', pop: '#FF2E63', paper: '#FFEDE0', machine: '#FFEDE0' },
};

type P = z.infer<typeof schema>;

const U = 44;
const LOOP = scene.loop;
const OX = 600;
const OY = 268;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3): [number, number] => iso(p, U);
const INK = 'rgba(10,2,22,0.6)';
const WIN = 5; // the winning billboard (front right)

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

type Plane = 'left' | 'right';
interface Board {
  x: number;
  y: number;
  plane: Plane;
  pipe: [number, number][];
}
// Billboards ring the hub at (6, 6). `left` boards face down-left (plane y = const),
// `right` boards face down-right (plane x = const). Pipes run along the axes from the plinth.
const BOARDS: Board[] = [
  { x: 1.5, y: 6, plane: 'left', pipe: [[4.4, 6], [3, 6]] },
  { x: 6, y: 1.5, plane: 'right', pipe: [[6, 4.4], [6, 3]] },
  { x: 1.5, y: 10.5, plane: 'left', pipe: [[5, 7.6], [5, 8.6], [2.2, 8.6], [2.2, 9.9]] },
  { x: 10.5, y: 1.5, plane: 'right', pipe: [[7.6, 5], [8.6, 5], [8.6, 2.2], [9.9, 2.2]] },
  { x: 6, y: 10.5, plane: 'left', pipe: [[6, 7.6], [6, 9.9]] },
  { x: 10.5, y: 6, plane: 'right', pipe: [[7.6, 6], [9.9, 6]] },
];
const BW = 3.2; // board width (world)
const BH = 2.2; // board height
const BZ = 1.7; // board bottom
const PIPE_Z = 0.16;

const pipeD = (pipe: [number, number][]) =>
  pipe
    .map(([x, y], i) => {
      const [a, b] = S([x, y, PIPE_Z]);
      return `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`;
    })
    .join(' ');

/** Local 2D frame for a board's face. Local x runs along the face, local y runs down. */
function faceTransform(b: Board) {
  if (b.plane === 'left') {
    const [a, c] = S([b.x - BW / 2, b.y + 0.15, BZ + BH]);
    return `translate(${a} ${c}) matrix(${C30} 0.5 0 1 0 0)`;
  }
  const [a, c] = S([b.x + 0.15, b.y + BW / 2, BZ + BH]);
  return `translate(${a} ${c}) matrix(${C30} -0.5 0 1 0 0)`;
}

function Poster({ p, label, score, win, i }: { p: P; label: string; score: string; win: boolean; i: number }) {
  const w = BW * U;
  const h = BH * U;
  const ink = lum(p.paper) > 140 ? '#1A0830' : p.paper;
  const share = win ? 0.32 : 0.12 + rand(i * 3.1) * 0.16;
  return (
    <g>
      <rect width={w} height={h} rx={3} fill={p.paper} stroke={INK} strokeWidth={1.2} />
      {/* two-ink sun, out of register */}
      <circle cx={w - 26} cy={30} r={17} fill={p.ink2} opacity={0.9} />
      <circle cx={w - 23} cy={32} r={17} fill={p.ink1} opacity={0.85} style={{ mixBlendMode: 'multiply' }} />
      {/* halftone in the lower right */}
      {Array.from({ length: 18 }, (_, k) => (
        <circle key={k} cx={w - 50 + (k % 6) * 8} cy={h - 32 + Math.floor(k / 6) * 7} r={1.2 + (k % 6) * 0.25} fill={p.ink1} opacity={0.5} />
      ))}
      <text x={9} y={18} fontFamily={FONTS.outfit} fontWeight={800} fontSize={12} letterSpacing="0.08em" fill={ink}>
        {label.toUpperCase()}
      </text>
      <text x={8} y={52} fontFamily={FONTS.fraunces} fontWeight={900} fontSize={30} letterSpacing="-0.03em" fill={win ? p.ink2 : ink}>
        {score}
      </text>
      <text x={9} y={65} fontFamily={FONTS.outfit} fontWeight={500} fontSize={8.5} fill={ink} opacity={0.7}>
        ROAS · 7 days
      </text>
      {/* spend share bar */}
      <rect x={8} y={h - 13} width={w * 0.62} height={6} rx={3} fill={ink} opacity={0.12} />
      <rect x={8} y={h - 13} width={w * 0.62 * share} height={6} rx={3} fill={win ? p.ink2 : p.ink1}>
        {win && (
          <animate attributeName="width" dur={`${LOOP}s`} repeatCount="indefinite" values={`${w * 0.62 * share};${w * 0.62 * share};${w * 0.62 * 0.78};${w * 0.62 * 0.78};${w * 0.62 * share}`} keyTimes="0;0.5;0.6;0.9;1" calcMode="spline" keySplines="0 0 1 1;0.2 0.9 0.1 1;0 0 1 1;0.45 0 0.55 1" />
        )}
      </rect>
      {win && (
        <g>
          <circle cx={w - 10} cy={h - 10} r={4} fill={p.pop}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </g>
  );
}

function BoardArt({ b, i, p, label, score }: { b: Board; i: number; p: P; label: string; score: string }) {
  const win = i === WIN;
  const left = b.plane === 'left';
  // Footprint: long side along the face.
  const fx = left ? b.x - BW / 2 - 0.2 : b.x - 0.6;
  const fy = left ? b.y - 0.6 : b.y - BW / 2 - 0.2;
  const fw = left ? BW + 0.4 : 1.2;
  const fd = left ? 1.2 : BW + 0.4;
  const post = (o: number) => (left ? { x: b.x + o - 0.1, y: b.y - 0.1 } : { x: b.x - 0.1, y: b.y + o - 0.1 });
  const panel = left ? { x: b.x - BW / 2, y: b.y - 0.15, w: BW, d: 0.3 } : { x: b.x - 0.15, y: b.y - BW / 2, w: 0.3, d: BW };
  // Uplight from the pad onto the poster.
  const lampA = S(left ? [b.x - 0.8, b.y + 0.6, 0.3] : [b.x + 0.6, b.y + 0.8, 0.3]);
  const lampB = S(left ? [b.x + 0.8, b.y + 0.6, 0.3] : [b.x + 0.6, b.y - 0.8, 0.3]);
  const topA = S(left ? [b.x - BW / 2, b.y + 0.2, BZ + BH] : [b.x + 0.2, b.y + BW / 2, BZ + BH]);
  const topB = S(left ? [b.x + BW / 2, b.y + 0.2, BZ + BH] : [b.x + 0.2, b.y - BW / 2, BZ + BH]);
  return (
    <g>
      <IsoBox x={fx} y={fy} w={fw} d={fd} h={0.3} color={shade(p.floor, 0.18)} u={U} ink={{ stroke: INK }} />
      {[-BW / 2 + 0.4, BW / 2 - 0.4].map((o) => {
        const q = post(o);
        return <IsoBox key={o} x={q.x} y={q.y} z={0.3} w={0.2} d={0.2} h={BZ - 0.3} color={shade(p.machine, -0.35)} u={U} ink={{ stroke: INK, strokeWidth: 0.8 }} />;
      })}
      <IsoBox x={panel.x} y={panel.y} z={BZ - 0.1} w={panel.w} d={panel.d} h={BH + 0.2} color={win ? p.ink2 : shade(p.machine, -0.15)} u={U} ink={{ stroke: INK }} />
      <g transform={faceTransform(b)}>
        <Poster p={p} label={label} score={score} win={win} i={i} />
      </g>
      {/* uplight wash */}
      <polygon points={`${lampA[0]},${lampA[1]} ${lampB[0]},${lampB[1]} ${topB[0]},${topB[1]} ${topA[0]},${topA[1]}`} fill={`url(#uplight-${win ? 'win' : 'n'})`} style={{ mixBlendMode: 'screen' }} opacity={0.5}>
        {win && <animate attributeName="opacity" values="0.5;0.5;1;0.6;0.5" keyTimes="0;0.5;0.55;0.75;1" dur={`${LOOP}s`} repeatCount="indefinite" />}
      </polygon>
      {/* lamp on the pad */}
      <circle cx={(lampA[0] + lampB[0]) / 2} cy={(lampA[1] + lampB[1]) / 2} r={3.5} fill={p.pop} filter="url(#glow)">
        <Flicker dur={3} seed={i + 2} low={0.6} />
      </circle>
    </g>
  );
}

function Pipe({ b, i, p }: { b: Board; i: number; p: P }) {
  const d = pipeD(b.pipe);
  const win = i === WIN;
  const c = win ? p.ink2 : p.ink1;
  const drops = win ? 3 : 1;
  const dur = win ? 1.5 : [3, 2, 3, 2, 3][i % 5];
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={win ? 13 : 10} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={shade(c, -0.25)} strokeWidth={win ? 9 : 6.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={shade(c, 0.35)} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} transform="translate(0 -2)" />
      {win && (
        <path d={d} fill="none" stroke={p.ink2} strokeWidth={18} strokeLinecap="round" opacity={0.0} filter="url(#glow)">
          <animate attributeName="opacity" values="0;0;0.85;0.25;0" keyTimes="0;0.48;0.53;0.75;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </path>
      )}
      {Array.from({ length: drops }, (_, k) => (
        <circle key={k} r={win ? 5 : 4} fill={win ? p.pop : p.paper} filter="url(#glow)">
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} begin={`${-(k * dur) / drops - rand(i * 7.7) * dur}s`} />
        </circle>
      ))}
    </g>
  );
}

function Hub({ p, sign }: { p: P; sign: string }) {
  const [cx] = S([6, 6, 0]);
  const tankBot = S([6, 6, 0.9])[1];
  const winTop = S([6, 6, 2.9])[1];
  // Front of the cylinder in screen space sits r·0.707·U below its centre line.
  const r = 1.25;
  const front = r * U * 0.7071;
  const levelLo = winTop + 60;
  const levelHi = winTop + 14;
  const top = S([6, 6, 3.2]);
  const signT = (() => {
    const [a, c] = S([4.6, 7.6, 0.52]);
    return `translate(${a} ${c}) matrix(${C30} 0.5 0 1 0 0)`;
  })();
  return (
    <g>
      {/* plinth */}
      <IsoBox x={4.4} y={4.4} w={3.2} d={3.2} h={0.6} color={shade(p.machine, -0.25)} u={U} ink={{ stroke: INK }} />
      <g transform={signT}>
        <rect width={2.8 * U} height={14} y={0} fill={shade(p.floor, -0.3)} rx={2} />
        <text x={1.4 * U} y={10.5} textAnchor="middle" fontFamily={FONTS.outfit} fontWeight={800} fontSize={9.5} letterSpacing="0.16em" fill={p.pop}>
          {sign}
        </text>
      </g>
      {/* reservoir */}
      <IsoCylinder x={6} y={6} z={0.6} r={r} h={2.4} color={p.machine} u={U} ink={{ stroke: INK }} />
      {/* ink window with a level that drains as ink is pumped, then tops up */}
      <rect x={cx - 11} y={winTop + front} width={22} height={tankBot - winTop - 8} rx={6} fill={shade(p.floor, -0.4)} stroke={INK} />
      <rect x={cx - 8} width={16} rx={4} fill={p.ink1} filter="url(#glow)" y={levelHi + front} height={tankBot - 8 - levelHi - 3}>
        <animate attributeName="y" values={`${levelHi + front};${levelLo + front};${levelLo + front};${levelHi + front}`} keyTimes="0;0.5;0.56;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1" />
        <animate attributeName="height" values={`${tankBot - 8 - levelHi - 3};${tankBot - 8 - levelLo - 3};${tankBot - 8 - levelLo - 3};${tankBot - 8 - levelHi - 3}`} keyTimes="0;0.5;0.56;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1" />
      </rect>
      {[0, 1, 2, 3].map((k) => (
        <line key={k} x1={cx + 11} x2={cx + 17} y1={winTop + front + 8 + k * 16} y2={winTop + front + 8 + k * 16} stroke={INK} strokeWidth={1.5} />
      ))}
      {/* tank bands */}
      {[1.4, 2.4].map((z) => {
        const [, y] = S([6, 6, z]);
        return <path key={z} d={`M${cx - r * U * 1.2247},${y} A${r * U * 1.2247},${front} 0 0 0 ${cx + r * U * 1.2247},${y}`} fill="none" stroke={shade(p.machine, -0.4)} strokeWidth={3} />;
      })}
      {/* the agent: a dome eye on top */}
      <ellipse cx={top[0]} cy={top[1] + 12} rx={40} ry={22} fill={shade(p.machine, -0.1)} stroke={INK} />
      <path d={`M${top[0] - 30},${top[1] + 10} A30,30 0 0 1 ${top[0] + 30},${top[1] + 10} Z`} fill={shade(p.floor, -0.35)} stroke={INK} />
      <g transform={`translate(${top[0]} ${top[1] - 3})`}>
        <ellipse rx={13} ry={9} fill={p.ink2} filter="url(#glow)">
          {/* blink */}
          <animate attributeName="ry" values="9;9;1;9;9" keyTimes="0;0.3;0.32;0.34;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
        <circle r={4} fill={p.paper}>
          {/* glance toward the winner just before the re-route */}
          <animateTransform attributeName="transform" type="translate" values="-4 0;-4 0;6 3;6 3;-4 0" keyTimes="0;0.38;0.45;0.8;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
      </g>
      <line x1={top[0] + 18} y1={top[1] - 18} x2={top[0] + 26} y2={top[1] - 44} stroke={INK} strokeWidth={2.5} />
      <circle cx={top[0] + 26} cy={top[1] - 46} r={4.5} fill={p.pop} filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.25;1" dur="1s" repeatCount="indefinite" />
      </circle>
      {/* valve wheels on the plinth, spinning in the ground plane */}
      {[
        [7.2, 5.0],
        [5.0, 7.2],
      ].map(([x, y], k) => {
        const [a, c] = S([x, y, 0.62]);
        return (
          <g key={k} transform={`translate(${a} ${c}) scale(1 0.5)`}>
            <g>
              <animateTransform attributeName="transform" type="rotate" values="0;0;360;360" keyTimes="0;0.45;0.6;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0 0 1 1" />
              <circle r={13} fill="none" stroke={k ? p.ink1 : p.ink2} strokeWidth={4} />
              {[0, 60, 120].map((d) => (
                <line key={d} x1={-13} x2={13} transform={`rotate(${d})`} stroke={k ? p.ink1 : p.ink2} strokeWidth={2.5} />
              ))}
              <circle r={3} fill={p.paper} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

function Sky({ p }: { p: P }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const x = rand(i * 2.3) * 1200;
    const y = rand(i * 5.9) * 330;
    const r = 0.8 + rand(i * 8.1) * 1.6;
    const dur = [2, 3, 1.5, 6][i % 4];
    out.push(
      <circle key={i} cx={x} cy={y} r={r} fill={i % 7 === 0 ? p.pop : p.paper} opacity={0.6}>
        <animate attributeName="opacity" values="0.15;0.85;0.15" dur={`${dur}s`} begin={`${-rand(i * 3.3) * dur}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

export default function InkExchange(p: P) {
  const labels = p.platforms.split(',').map((s) => s.trim());
  const scores = p.scores.split(',').map((s) => s.trim());
  const dark = lum(p.sky) < 140;
  const win = BOARDS[WIN];
  const tagAt = S([win.x + 0.2, win.y, BZ + BH + 0.9]);
  const winCentre = S([win.x + 0.15, win.y, BZ + BH / 2]);

  // Painter's order: pads and the hub by depth (x + y).
  const items = [
    ...BOARDS.map((b, i) => ({ depth: b.x + b.y, node: <BoardArt key={`b${i}`} b={b} i={i} p={p} label={labels[i] ?? ''} score={scores[i] ?? ''} /> })),
    { depth: 12.01, node: <Hub key="hub" p={p} sign={p.sign} /> },
  ].sort((a, b) => a.depth - b.depth);

  return (
    <svg viewBox={`0 0 ${scene.width} ${scene.height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ix-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.sky, dark ? -0.3 : 0.2)} />
          <stop offset="0.7" stopColor={p.sky} />
          <stop offset="1" stopColor={shade(p.floor, dark ? -0.1 : 0.1)} />
        </linearGradient>
        <radialGradient id="ix-pool">
          <stop offset="0" stopColor={p.ink1} stopOpacity={dark ? 0.55 : 0.3} />
          <stop offset="1" stopColor={p.ink1} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ix-halo">
          <stop offset="0" stopColor={p.ink2} stopOpacity={0.5} />
          <stop offset="1" stopColor={p.ink2} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="uplight-n" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={p.pop} stopOpacity={0.35} />
          <stop offset="1" stopColor={p.pop} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="uplight-win" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={p.ink2} stopOpacity={0.6} />
          <stop offset="1" stopColor={p.ink2} stopOpacity={0} />
        </linearGradient>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <pattern id="ix-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.6" fill={p.ink2} opacity={dark ? 0.35 : 0.3} />
        </pattern>
      </defs>

      {/* sky + atmosphere */}
      <rect width={1200} height={900} fill="url(#ix-sky)" />
      {dark && <Sky p={p} />}
      <circle cx={960} cy={150} r={170} fill="url(#ix-dots)" opacity={0.8} />
      <circle cx={960} cy={150} r={64} fill={p.ink1} opacity={dark ? 0.85 : 0.55} />
      <circle cx={972} cy={158} r={64} fill={p.ink2} opacity={0.6} style={{ mixBlendMode: dark ? 'screen' : 'multiply' }} />
      {/* distant skyline of other billboards */}
      <g opacity={dark ? 0.55 : 0.35} fill={shade(p.sky, dark ? 0.12 : -0.15)}>
        {Array.from({ length: 14 }, (_, i) => {
          const x = i * 90 - 10 + rand(i) * 30;
          const h = 70 + rand(i * 4.2) * 110;
          return <rect key={i} x={x} y={430 - h} width={58 + rand(i * 9) * 30} height={h + 200} />;
        })}
      </g>

      {/* the plaza slab */}
      <g transform={`translate(${OX} ${OY})`}>
        <IsoBox x={-0.4} y={-0.4} z={-0.6} w={12.8} d={12.8} h={0.6} color={p.floor} u={U} ink={{ stroke: INK }} />
        <IsoGrid x={0} y={0} w={12} d={12} u={U} color={dark ? p.ink1 : shade(p.floor, -0.3)} opacity={dark ? 0.3 : 0.4} />
        <ellipse cx={0} cy={S([6, 6, 0])[1]} rx={330} ry={170} fill="url(#ix-pool)" />
        {/* winner halo pulses at the moment */}
        <ellipse cx={S([win.x, win.y, 0])[0]} cy={S([win.x, win.y, 0])[1]} rx={130} ry={70} fill="url(#ix-halo)" opacity={0.5}>
          <animate attributeName="opacity" values="0.4;0.4;1;0.5;0.4" keyTimes="0;0.5;0.55;0.8;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>

        {/* pipes run on the ground, under everything */}
        {BOARDS.map((b, i) => (
          <Pipe key={i} b={b} i={i} p={p} />
        ))}

        {items.map((it) => it.node)}

        {/* the moment: re-route surge + tag */}
        <circle cx={winCentre[0]} cy={winCentre[1]} r={20} fill="none" stroke={p.pop} strokeWidth={4} opacity={0}>
          <animate attributeName="r" values="20;20;20;120;120" keyTimes="0;0.5;0.53;0.68;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.5;0.53;0.68;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        <g opacity={0}>
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.52;0.56;0.84;0.9;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values={`${tagAt[0]} ${tagAt[1] + 20};${tagAt[0]} ${tagAt[1] + 20};${tagAt[0]} ${tagAt[1]};${tagAt[0]} ${tagAt[1] - 8};${tagAt[0]} ${tagAt[1] - 8}`} keyTimes="0;0.52;0.58;0.9;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.2 0.9 0.1 1;0.45 0 0.55 1;0 0 1 1" />
          <g transform="rotate(-8)">
            <rect x={-48} y={-22} width={96} height={40} rx={4} fill={p.pop} stroke={INK} />
            <rect x={-44} y={-18} width={96} height={40} rx={4} fill="none" stroke={p.ink2} strokeWidth={2} opacity={0.8} />
            <text x={0} y={7} textAnchor="middle" fontFamily={FONTS.caveat} fontWeight={700} fontSize={28} fill="#12001F">
              {p.tag}
            </text>
          </g>
        </g>
      </g>

      {/* handwritten note, top left */}
      <g transform="translate(70 92) rotate(-4)">
        <text fontFamily={FONTS.caveat} fontWeight={700} fontSize={40} fill={dark ? p.pop : p.ink2}>
          {p.note}
        </text>
        <path d="M6,16 C120,26 260,10 380,18" fill="none" stroke={p.ink2} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      </g>

      {/* vignette */}
      <rect width={1200} height={900} fill="url(#ix-vig)" />
      <defs>
        <radialGradient id="ix-vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={dark ? 0.5 : 0.12} />
        </radialGradient>
      </defs>
    </svg>
  );
}
