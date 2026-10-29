import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Live Editor Stage',
  description:
    "OpenAssets' landing hero: the editor as a little isometric stage. A giant cursor taps color swatches and drags a slider while the sparkle on the canvas recolors live, code scrolls on the source board, then the cursor presses DOWNLOAD and SVG, PNG, GLB and MP4 files spring into the outbox — rendered on demand. Loops seamlessly.",
  tags: ['hero', 'isometric', 'landing page', 'editor', 'interface', 'animated svg', 'riso', 'openassets'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  tag: text('Slab tag').default('OPENASSETS · KIT 03 · 31 OCT 2026'),
  file: text('Source tab').default('daily-drop/index.tsx'),
  bg: color('Paper').default('#F4EFE6'),
  bg2: color('Paper (bottom)').default('#EAE2D3'),
  slab: color('Editor slab').default('#EAE2D3'),
  panel: color('Panels').default('#FBF8F2'),
  board: color('Source board').default('#1F2A6B'),
  ink: color('Ink').default('#1F2A6B'),
  accent: color('Plate 1 (pink)').default('#FF48B0'),
  accent2: color('Plate 2 (blue)').default('#0078BF'),
  pop: color('Pop').default('#FFE800'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  brutalist: { bg: '#FFFDF2', bg2: '#FFF3B8', slab: '#FFE45C', panel: '#FFFFFF', board: '#111111', ink: '#111111', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#00D1A0' },
  memphis: { bg: '#FFF6E9', bg2: '#FFE3D3', slab: '#FFE3D3', panel: '#FFFFFF', board: '#1A1A2E', ink: '#1A1A2E', accent: '#FF6F91', accent2: '#00B3A4', pop: '#FFC93C' },
  bauhaus: { bg: '#F2EBDD', bg2: '#E4D9C4', slab: '#E4D9C4', panel: '#FAF5EA', board: '#1D4E9E', ink: '#111111', accent: '#D9381E', accent2: '#1D4E9E', pop: '#F2B90F' },
  night: { bg: '#0B0B0B', bg2: '#1A1A1A', slab: '#2A2A2A', panel: '#3A3A3A', board: '#111111', ink: '#050505', accent: '#FF00E5', accent2: '#00F0FF', pop: '#C6FF00' },
};

type P = z.infer<typeof schema>;

const U = 48;
const LOOP = scene.loop;
const L = `${LOOP}s`;
const OX = 517;
const OY = 252;
const C30 = Math.cos(Math.PI / 6);
const rep = { repeatCount: 'indefinite' } as const;
const soft = '0.45 0 0.55 1';

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const xy = (p: P3) => S(p).map((v) => v.toFixed(1)).join(' ');
const pt = (p: P3) => S(p).map((v) => v.toFixed(1)).join(',');
const onLeft = (p: P3) => `translate(${xy(p)}) matrix(${C30} 0.5 0 1 0 0)`;
const onTop = (p: P3) => `translate(${xy(p)}) matrix(${C30} 0.5 ${-C30} 0.5 0 0)`;

// The loop's beats (fractions of the loop).
const TAP = [0.06, 0.2, 0.3]; // swatch taps: blue, yellow, pink
const GRAB = 0.36; // slider drag 0.36 → 0.45
const DRAG_END = 0.45;
const HIT = 0.55; // DOWNLOAD pressed (stills sample the moment at 55.5%)

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

/** A short pulse at each time in `at`: value `hi` for a moment, `lo` otherwise. */
function pulse(at: number[], lo: string, hi: string, w = 0.012) {
  const kt: number[] = [0];
  const v: string[] = [lo];
  at.forEach((t) => {
    kt.push(t - w, t, t + w * 2.5);
    v.push(lo, hi, lo);
  });
  kt.push(1);
  v.push(lo);
  return { values: v.join(';'), keyTimes: kt.map((k) => k.toFixed(4)).join(';') };
}

/** Discrete "on" between [a, b) of the loop. */
const window01 = (a: number, b: number) => ({ values: a === 0 ? '1;0;1' : '0;1;0', keyTimes: a === 0 ? `0;${b};1` : `0;${a};${b}`, calcMode: 'discrete' as const });

function RegMark({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={c} strokeWidth="1.4" fill="none">
      <circle r={s * 0.3} />
      <line x1={-s / 2} y1="0" x2={s / 2} y2="0" />
      <line x1="0" y1={-s / 2} x2="0" y2={s / 2} />
    </g>
  );
}

const SPARKLE = 'M0 -50 Q5 -5 50 0 Q5 5 0 50 Q-5 5 -50 0 Q-5 -5 0 -50Z';
const TWINKLE = 'M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10Z';

export default function LiveEditorStage(p: P) {
  const dark = isDark(p.bg);
  const INK = p.ink;
  const ink = { stroke: INK, strokeWidth: 1.3 };
  const blend = dark ? 'screen' : 'multiply';
  const label = dark ? '#F0FFE0' : INK;
  const swatches = [p.accent, p.accent2, p.pop];
  // Taps in order select blue, yellow, then pink; swatch index for each tap.
  const tapIdx = [1, 2, 0];

  // Key points.
  const sw = (i: number): P3 => [1.4 + i * 1.1, 3.0, 0.5];
  const knobA: P3 = [1.6, 4.8, 0.4];
  const knobB: P3 = [3.3, 4.8, 0.4];
  const keyTop: P3 = [11.5, 7.2, 0.56];
  const spark = S([7.8, 4.3, 0.4]);
  const sparkY = spark[1] - 92;

  // Cursor choreography (tip position), loop fractions.
  const off = (p3: P3, dx = 2, dy = 2) => {
    const [x, y] = S(p3);
    return `${(x + dx).toFixed(1)},${(y + dy).toFixed(1)}`;
  };
  const cursorPts = [
    [0, off(sw(1))],
    [TAP[0], off(sw(1))],
    [0.13, off(sw(2))],
    [TAP[1], off(sw(2))],
    [0.25, off(sw(0))],
    [TAP[2], off(sw(0))],
    [GRAB, off(knobA, 0, -6)],
    [DRAG_END, off(knobB, 0, -6)],
    [0.51, off(keyTop, 0, -8)],
    [HIT, off(keyTop, 0, -2)],
    [0.66, off(keyTop, 6, -16)],
    [0.92, off(sw(1), 10, -10)],
    [1, off(sw(1))],
  ] as const;
  const clicks = pulse([TAP[0], TAP[1], TAP[2], GRAB, HIT], '1 1', '0.78 0.78', 0.014);

  // File tiles that spring out of the key into the outbox.
  const files = [
    { f: 'SVG', c: p.accent },
    { f: 'PNG', c: p.accent2 },
    { f: 'GLB', c: p.pop },
    { f: 'MP4', c: p.board },
  ];

  // Code tokens on the source board (two copies for a seamless scroll).
  const codeRows: ReactNode[] = [];
  const tokenCols = [p.accent, p.accent2, p.pop, dark ? '#F0FFE0' : '#F4EFE6'];
  for (let r = 0; r < 20; r++) {
    let x = 18 + (r % 10 === 0 ? 0 : (Math.floor(rand(r % 10) * 3) + 1) * 14);
    const y = 34 + r * 14;
    for (let t = 0; t < 4 && x < 270; t++) {
      const w = 14 + rand((r % 10) * 7 + t * 3.3) * 52;
      codeRows.push(<rect key={`${r}-${t}`} x={x} y={y} width={Math.min(w, 276 - x)} height="6" rx="3" fill={tokenCols[((r % 10) + t) % 4]} opacity={t === 0 ? 0.95 : 0.75} />);
      x += w + 8;
    }
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="les-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg} />
          <stop offset="1" stopColor={p.bg2} />
        </linearGradient>
        <pattern id="les-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1.3" fill={dark ? '#F0FFE0' : INK} opacity={dark ? 0.16 : 0.12} />
        </pattern>
        {[0, 1].map((j) => (
          <pattern key={j} id={`les-dots-${j}`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform={`rotate(${j ? 15 : 45})`}>
            <circle cx="11" cy="11" r="6" fill={j ? p.accent2 : p.accent} />
          </pattern>
        ))}
        <radialGradient id="les-fade">
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="les-sun" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="900">
          <circle cx="600" cy="190" r="190" fill="url(#les-fade)" />
        </mask>
        <radialGradient id="les-flash">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.45" stopColor={p.pop} stopOpacity="0.6" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
        <filter id="les-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="les-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Backdrop: paper, drifting dot grid, halftone sun printed twice ── */}
      <rect width="1200" height="900" fill="url(#les-bg)" />
      <rect x="-24" y="-24" width="1248" height="948" fill="url(#les-grid)">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 24" dur="4s" {...rep} />
      </rect>
      <g mask="url(#les-sun)" style={{ mixBlendMode: blend }}>
        <rect x="420" y="10" width="380" height="380" fill="url(#les-dots-1)" opacity="0.55" transform="translate(10 7)" />
        <rect x="410" y="0" width="380" height="380" fill="url(#les-dots-0)" opacity="0.7" />
        <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -6;0 0;0 0" keyTimes={`0;${HIT};${HIT + 0.02};${HIT + 0.12};1`} dur={L} {...rep} />
      </g>
      {/* Big misregistered riso circles, slowly breathing */}
      <g style={{ mixBlendMode: blend }} opacity={dark ? 0.5 : 0.85}>
        <circle cx="1050" cy="150" r="70" fill={p.accent2} opacity="0.5">
          <animate attributeName="r" values="70;76;70" dur="4s" {...rep} calcMode="spline" keyTimes="0;0.5;1" keySplines={`${soft};${soft}`} />
        </circle>
        <circle cx="1030" cy="135" r="70" fill={p.pop} opacity="0.75" />
        <circle cx="130" cy="700" r="56" fill={p.accent} opacity="0.35" />
        <circle cx="148" cy="716" r="56" fill={p.accent2} opacity="0.3">
          <animate attributeName="r" values="56;50;56" dur="4s" {...rep} calcMode="spline" keyTimes="0;0.5;1" keySplines={`${soft};${soft}`} />
        </circle>
      </g>
      {/* Twinkling sparkles */}
      {[
        [210, 160, 1.4, 0],
        [990, 360, 1.0, 0.5],
        [1100, 620, 1.2, 1.1],
        [80, 420, 0.9, 1.6],
        [760, 90, 0.8, 0.3],
        [330, 820, 1.1, 0.9],
      ].map(([x, y, s, b], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d={TWINKLE} fill={[p.accent, p.accent2, p.pop][i % 3]} stroke={INK} strokeWidth="0.8" opacity="0">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${-b}s`} {...rep} />
          </path>
        </g>
      ))}
      {/* Proof sheets drifting through */}
      {[0, 1].map((i) => (
        <g key={i} opacity="0.9">
          <animateTransform attributeName="transform" type="translate" values={i ? '1110 400;1130 384;1110 400' : '150 250;120 232;150 250'} dur={L} {...rep} calcMode="spline" keyTimes="0;0.5;1" keySplines={`${soft};${soft}`} />
          <g>
            <animateTransform attributeName="transform" type="rotate" values={i ? '8;-4;8' : '-10;4;-10'} dur="4s" {...rep} calcMode="spline" keyTimes="0;0.5;1" keySplines={`${soft};${soft}`} />
            <rect x="-34" y="-44" width="68" height="88" rx="3" fill={p.panel} stroke={INK} strokeWidth="1.3" />
            <circle cx={i ? 6 : -4} cy="-10" r="18" fill={i ? p.accent : p.accent2} style={{ mixBlendMode: 'multiply' }} />
            <circle cx={i ? -4 : 6} cy="-4" r="18" fill={i ? p.pop : p.accent} style={{ mixBlendMode: 'multiply' }} opacity="0.9" />
            <rect x="-22" y="20" width="44" height="5" rx="2.5" fill={INK} opacity="0.5" />
            <rect x="-22" y="30" width="28" height="5" rx="2.5" fill={INK} opacity="0.3" />
            <g transform="translate(26 -36)">
              <RegMark x={0} y={0} s={10} c={INK} />
            </g>
          </g>
        </g>
      ))}

      {/* ── The editor stage ── */}
      <g transform={`translate(${OX} ${OY})`}>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 3;0 -1.5;0 0;0 0" keyTimes={`0;${HIT};${HIT + 0.008};${HIT + 0.02};${HIT + 0.035};1`} dur={L} {...rep} />

          {/* floor shadow */}
          <polygon points={poly([[0.8, 1, -1.4], [14.2, 1, -1.4], [14.2, 10.4, -1.4], [0.8, 10.4, -1.4]])} fill={dark ? '#000000' : INK} opacity={dark ? 0.5 : 0.16} filter="url(#les-blur)" />

          {/* Slab: thick editor board with misregistered pink/blue trim */}
          <IsoBox x={0} y={0} z={-0.8} w={13} d={9} h={0.8} color={p.slab} u={U} ink={ink} />
          {[
            { c: p.accent, a: -0.3, d: 0 },
            { c: p.accent2, a: -0.36, d: 0.05 },
          ].map((b, i) => (
            <g key={i} style={{ mixBlendMode: blend }} opacity={i ? 0.75 : 0.95}>
              <polygon points={poly([[0, 9, b.a], [13, 9, b.a], [13, 9, b.a - 0.12], [0, 9, b.a - 0.12]])} fill={b.c} transform={`translate(${b.d * U} ${b.d * U * 0.4})`} />
              <polygon points={poly([[13, 0, b.a], [13, 9, b.a], [13, 9, b.a - 0.12], [13, 0, b.a - 0.12]])} fill={shade(b.c, -0.1)} transform={`translate(${b.d * U} ${b.d * U * 0.4})`} />
            </g>
          ))}
          <text transform={onLeft([0.6, 9, -0.52])} fontFamily={FONTS.mono} fontWeight="700" fontSize="12" letterSpacing="2.2" fill={dark ? '#F0FFE0' : INK} y="0">
            {p.tag}
          </text>
          {/* screen inset with a dot grid */}
          <polygon points={poly([[0.3, 0.3, 0.002], [12.7, 0.3, 0.002], [12.7, 8.7, 0.002], [0.3, 8.7, 0.002]])} fill={shade(p.slab, 0.25)} stroke={INK} strokeWidth="1" strokeOpacity="0.5" />

          {/* Source board (back): code scrolls, render bar fills on the hit */}
          <IsoBox x={0.6} y={0.4} w={7} d={0.4} h={3.6} color={p.board} u={U} ink={ink} />
          <g transform={onLeft([0.6, 0.8, 3.6])}>
            <defs>
              <clipPath id="les-code">
                <rect x="10" y="26" width="274" height="96" />
              </clipPath>
            </defs>
            <rect x="10" y="6" width="110" height="16" rx="3" fill={shade(p.board, 0.25)} />
            <text x="18" y="18" fontFamily={FONTS.mono} fontWeight="700" fontSize="9.5" fill={dark ? '#F0FFE0' : '#F4EFE6'}>
              {p.file}
            </text>
            <circle cx="276" cy="14" r="4" fill={p.pop}>
              <animate attributeName="opacity" values="1;0.3;1" dur="1s" {...rep} />
            </circle>
            <g clipPath="url(#les-code)">
              <g>
                <animateTransform attributeName="transform" type="translate" values="0 0;0 -140" dur={L} {...rep} />
                {codeRows}
              </g>
            </g>
            <rect x="10" y="128" width="274" height="9" rx="4.5" fill={shade(p.board, 0.2)} />
            <rect x="10" y="128" width="0" height="9" rx="4.5" fill={p.pop}>
              <animate attributeName="width" values="0;0;274;274;0" keyTimes={`0;${HIT};${HIT + 0.14};0.97;1`} dur={L} {...rep} />
            </rect>
          </g>

          {/* Params rail (left) */}
          <IsoBox x={0.7} y={1.6} w={3.7} d={6.8} h={0.2} color={p.panel} u={U} ink={ink} />
          <text transform={onTop([1.0, 1.95, 0.21])} fontFamily={FONTS.mono} fontWeight="700" fontSize="11" letterSpacing="2.5" fill={INK} y="8">
            PARAMS
          </text>
          {/* swatches */}
          {swatches.map((c, i) => {
            const tapAt = TAP[tapIdx.indexOf(i)];
            const sel = i === 0 ? window01(0, TAP[0]) : i === 1 ? window01(TAP[0], TAP[1]) : window01(TAP[1], TAP[2]);
            const selPink = i === 0 ? { values: '1;0;1', keyTimes: `0;${TAP[0]};${TAP[2]}`, calcMode: 'discrete' as const } : sel;
            const [x] = sw(i);
            return (
              <g key={i}>
                <polygon points={poly([[x - 0.62, 2.38, 0.21], [x + 0.62, 2.38, 0.21], [x + 0.62, 3.62, 0.21], [x - 0.62, 3.62, 0.21]])} fill="none" stroke={INK} strokeWidth="2.2" opacity="0">
                  <animate attributeName="opacity" dur={L} {...rep} {...selPink} />
                </polygon>
                <g>
                  <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -9;0 0;0 0" keyTimes={`0;${tapAt - 0.01};${tapAt};${tapAt + 0.04};1`} dur={L} {...rep} />
                  <IsoBox x={x - 0.4} y={2.6} z={0.2} w={0.8} d={0.8} h={0.32} color={c} u={U} ink={ink} />
                </g>
              </g>
            );
          })}
          {/* sliders */}
          {[4.8, 6.0].map((y, i) => (
            <g key={y}>
              <polyline points={poly([[1.1, y, 0.21], [4.0, y, 0.21]])} stroke={INK} strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
              <polyline points={poly([[1.1, y, 0.21], [i ? 2.6 : 1.6, y, 0.21]])} stroke={i ? p.accent : p.accent2} strokeWidth="5" strokeLinecap="round">
                {i === 0 && <animate attributeName="points" values={`${poly([[1.1, y, 0.21], [1.6, y, 0.21]])};${poly([[1.1, y, 0.21], [1.6, y, 0.21]])};${poly([[1.1, y, 0.21], [3.3, y, 0.21]])};${poly([[1.1, y, 0.21], [3.3, y, 0.21]])};${poly([[1.1, y, 0.21], [1.6, y, 0.21]])}`} keyTimes={`0;${GRAB};${DRAG_END};0.94;1`} dur={L} {...rep} />}
              </polyline>
              <g>
                {i === 0 ? (
                  <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;${(1.7 * C30 * U).toFixed(1)} ${(0.85 * U).toFixed(1)};${(1.7 * C30 * U).toFixed(1)} ${(0.85 * U).toFixed(1)};0 0`} keyTimes={`0;${GRAB};${DRAG_END};0.94;1`} calcMode="spline" keySplines={`0 0 1 1;${soft};0 0 1 1;${soft}`} dur={L} {...rep} />
                ) : (
                  <animateTransform attributeName="transform" type="translate" values={`0 0;${(0.5 * C30 * U).toFixed(1)} ${(0.25 * U).toFixed(1)};0 0;${(-0.4 * C30 * U).toFixed(1)} ${(-0.2 * U).toFixed(1)};0 0`} keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" keySplines={`${soft};${soft};${soft};${soft}`} dur="2s" {...rep} />
                )}
                <IsoCylinder x={i ? 2.6 : 1.6} y={y} z={0.2} r={0.3} h={0.24} color={p.panel} u={U} ink={ink} />
              </g>
            </g>
          ))}
          {/* text field with a blinking caret */}
          <polygon points={poly([[1.1, 7.0, 0.21], [4.0, 7.0, 0.21], [4.0, 7.9, 0.21], [1.1, 7.9, 0.21]])} fill={shade(p.panel, -0.04)} stroke={INK} strokeWidth="1.6" />
          <text transform={onTop([1.3, 7.2, 0.22])} fontFamily={FONTS.familjen} fontWeight="700" fontSize="13" fill={INK} y="14">
            Daily drop
          </text>
          <polyline points={poly([[3.35, 7.15, 0.22], [3.35, 7.75, 0.22]])} stroke={p.accent} strokeWidth="2.4">
            <animate attributeName="opacity" values="1;0;1" dur="1s" calcMode="discrete" keyTimes="0;0.5;1" {...rep} />
          </polyline>

          {/* Canvas plinth (centre) */}
          <IsoBox x={5.4} y={1.8} w={4.8} d={5} h={0.4} color={p.panel} u={U} ink={ink} />
          <polygon points={poly([[5.65, 2.05, 0.41], [9.95, 2.05, 0.41], [9.95, 6.55, 0.41], [5.65, 6.55, 0.41]])} fill="url(#les-grid)" />
          {([[5.8, 2.2], [9.8, 2.2], [9.8, 6.4], [5.8, 6.4]] as [number, number][]).map(([x, y], i) => {
            const [a, b] = S([x, y, 0.41]);
            return <RegMark key={i} x={a} y={b} s={16} c={INK} />;
          })}
          {/* sparkle's soft shadow on the canvas */}
          <ellipse cx={spark[0]} cy={spark[1]} rx="70" ry="32" fill={INK} opacity={dark ? 0.5 : 0.18} filter="url(#les-blur)">
            <animate attributeName="rx" values="70;58;70" dur="4s" {...rep} calcMode="spline" keyTimes="0;0.5;1" keySplines={`${soft};${soft}`} />
          </ellipse>

          {/* Layers: three plates hovering, overprinted */}
          {[p.accent2, p.accent, p.pop].map((c, i) => (
            <g key={i} style={{ mixBlendMode: blend }}>
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="4s" begin={`${-i * 0.5}s`} {...rep} calcMode="spline" keyTimes="0;0.5;1" keySplines={`${soft};${soft}`} />
              <polygon points={poly([[5.7, 5.2, 1.0 + i * 0.45], [6.9, 5.2, 1.0 + i * 0.45], [6.9, 6.4, 1.0 + i * 0.45], [5.7, 6.4, 1.0 + i * 0.45]])} fill={c} stroke={INK} strokeWidth="1.3" opacity={i === 2 ? 0.95 : 0.8} transform={`translate(${i * 4} 0)`} />
            </g>
          ))}

          {/* The sparkle: recolors on each swatch tap, grows with the slider, turns slowly */}
          <g transform={`translate(${spark[0]} ${sparkY})`}>
            <animateTransform attributeName="transform" type="translate" values={`${spark[0]} ${sparkY};${spark[0]} ${sparkY - 10};${spark[0]} ${sparkY}`} dur="4s" {...rep} calcMode="spline" keyTimes="0;0.5;1" keySplines={`${soft};${soft}`} />
            <g>
              <animateTransform attributeName="transform" type="scale" values="1;1;1.16;1.16;1" keyTimes={`0;${GRAB};${DRAG_END};0.94;1`} dur={L} {...rep} />
              <g>
                <animateTransform attributeName="transform" type="scale" {...pulse(TAP, '1 1', '1.14 1.14', 0.012)} dur={L} {...rep} />
                <g>
                  <animateTransform attributeName="transform" type="scale" values="1 1;0.8 1;1 1" dur="4s" {...rep} calcMode="spline" keyTimes="0;0.5;1" keySplines={`${soft};${soft}`} />
                  {[5, 4, 3, 2, 1].map((k) => (
                    <path key={k} d={SPARKLE} transform={`translate(${k * 1.5} ${k * 1.2}) scale(1.45)`} fill={shade(p.accent, -0.35)}>
                      <animate attributeName="fill" values={[p.accent, p.accent2, p.pop, p.accent].map((c) => shade(c, -0.38)).join(';')} keyTimes={`0;${TAP[0]};${TAP[1]};${TAP[2]}`} calcMode="discrete" dur={L} {...rep} />
                    </path>
                  ))}
                  <path d={SPARKLE} transform="scale(1.45)" fill={p.accent} stroke={INK} strokeWidth="0.9" strokeLinejoin="round">
                    <animate attributeName="fill" values={[p.accent, p.accent2, p.pop, p.accent].join(';')} keyTimes={`0;${TAP[0]};${TAP[1]};${TAP[2]}`} calcMode="discrete" dur={L} {...rep} />
                  </path>
                  <path d="M-25 -31 Q-22 -17 -10 -13" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
                </g>
              </g>
            </g>
          </g>

          {/* Outbox tray (back right) */}
          <IsoBox x={10.5} y={1.4} w={2.0} d={3.4} h={0.34} color={p.accent2} u={U} ink={ink} />
          <polygon points={poly([[10.7, 1.6, 0.341], [12.3, 1.6, 0.341], [12.3, 4.6, 0.341], [10.7, 4.6, 0.341]])} fill={shade(p.accent2, -0.35)} stroke={INK} strokeWidth="1" />
          <text transform={onLeft([10.65, 4.8, 0.3])} fontFamily={FONTS.mono} fontWeight="700" fontSize="9.5" letterSpacing="1.8" fill={dark ? '#0B0B0B' : '#F4EFE6'} y="0">
            OUTBOX
          </text>

          {/* Download key (front right): pressed on the hit */}
          <IsoBox x={10.3} y={6.0} w={2.4} d={2.4} h={0.14} color={shade(p.slab, -0.4)} u={U} ink={ink} />
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 8;0 8;0 0;0 0" keyTimes={`0;${HIT - 0.012};${HIT};${HIT + 0.02};${HIT + 0.06};1`} dur={L} {...rep} />
            <IsoBox x={10.4} y={6.1} w={2.2} d={2.2} h={0.56} color={p.accent} u={U} ink={ink} />
            <g transform={onTop([11.5, 7.2, 0.57])}>
              <path d="M-6 -20 L6 -20 L6 -2 L15 -2 L0 16 L-15 -2 L-6 -2Z" fill={p.panel} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" transform="rotate(-45)" />
            </g>
            <text transform={onLeft([10.75, 8.3, 0.24])} fontFamily={FONTS.mono} fontWeight="700" fontSize="10" letterSpacing="1.6" fill={dark ? '#0B0B0B' : '#FFFFFF'} y="0">
              DOWNLOAD
            </text>
          </g>

          {/* The moment: flash, shock ring and sparks at the key */}
          {(() => {
            const [kx, ky] = S(keyTop);
            const kt = `0;${HIT};${HIT + 0.1};1`;
            return (
              <g>
                <circle cx={kx} cy={ky} r="110" fill="url(#les-flash)" opacity="0" style={{ mixBlendMode: dark ? 'screen' : 'normal' }}>
                  <animate attributeName="opacity" values="0;0;0.95;0;0" keyTimes={`0;${HIT - 0.002};${HIT + 0.006};${HIT + 0.08};1`} dur={L} {...rep} />
                </circle>
                <ellipse cx={kx} cy={ky} rx="40" ry="20" fill="none" stroke={p.accent} strokeWidth="3" opacity="0">
                  <animate attributeName="rx" values="40;40;170;170" keyTimes={kt} dur={L} {...rep} />
                  <animate attributeName="ry" values="20;20;85;85" keyTimes={kt} dur={L} {...rep} />
                  <animate attributeName="opacity" values="0;0.95;0;0" keyTimes={kt} dur={L} {...rep} />
                </ellipse>
                {Array.from({ length: 10 }, (_, i) => {
                  const a = (i / 10) * Math.PI * 2;
                  return (
                    <line key={i} x1={kx} y1={ky} x2={kx + Math.cos(a) * 18} y2={ky + Math.sin(a) * 10} stroke={[p.pop, p.accent, p.accent2][i % 3]} strokeWidth="3.5" strokeLinecap="round" opacity="0">
                      <animate attributeName="x2" values={`${kx};${kx};${kx + Math.cos(a) * 80};${kx + Math.cos(a) * 80}`} keyTimes={kt} dur={L} {...rep} />
                      <animate attributeName="y2" values={`${ky};${ky};${ky + Math.sin(a) * 44 - 20};${ky + Math.sin(a) * 44 - 20}`} keyTimes={kt} dur={L} {...rep} />
                      <animate attributeName="x1" values={`${kx};${kx};${kx + Math.cos(a) * 50};${kx + Math.cos(a) * 50}`} keyTimes={kt} dur={L} {...rep} />
                      <animate attributeName="y1" values={`${ky};${ky};${ky + Math.sin(a) * 28 - 12};${ky + Math.sin(a) * 28 - 12}`} keyTimes={kt} dur={L} {...rep} />
                      <animate attributeName="opacity" values="0;1;0;0" keyTimes={kt} dur={L} {...rep} />
                    </line>
                  );
                })}
              </g>
            );
          })()}

          {/* File tiles spring from the key and stack in the outbox */}
          {files.map((f, i) => {
            const t0 = HIT + 0.012 + i * 0.03;
            const t1 = t0 + 0.09;
            const [sx, sy] = S(keyTop);
            const [ex, ey] = S([11.5, 3.1, 0.36 + i * 0.13]);
            const cx = (sx + ex) / 2 + 60;
            const cy = Math.min(sy, ey) - 170 - i * 16;
            const path = `M${sx.toFixed(1)},${sy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
            return (
              <g key={f.f} opacity="0">
                <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${t0 - 0.001};${t0};0.95;0.98;1`} dur={L} {...rep} />
                <animateMotion path={path} keyPoints="0;0;1;1" keyTimes={`0;${t0};${t1};1`} calcMode="spline" keySplines={`0 0 1 1;0.3 0.6 0.5 1;0 0 1 1`} dur={L} {...rep} />
                <g>
                  <animateTransform attributeName="transform" type="scale" values="0.5;0.5;1.15;1;1" keyTimes={`0;${t0};${t0 + 0.05};${t1};1`} dur={L} {...rep} />
                  <g transform={`matrix(${C30} 0.5 ${-C30} 0.5 0 0)`}>
                    <rect x="-30" y="-22" width="60" height="44" rx="5" fill={p.panel} stroke={INK} strokeWidth="1.6" />
                    <rect x="-30" y="-22" width="60" height="12" rx="5" fill={f.c} stroke={INK} strokeWidth="1.6" />
                    <text x="0" y="13" textAnchor="middle" fontFamily={FONTS.anton} fontSize="17" letterSpacing="0.5" fill={INK}>
                      .{f.f}
                    </text>
                  </g>
                </g>
              </g>
            );
          })}

          {/* Giant cursor with a riso offset shadow */}
          <g>
            <animateMotion values={cursorPts.map((c) => c[1]).join(';')} keyTimes={cursorPts.map((c) => c[0]).join(';')} calcMode="spline" keySplines={Array.from({ length: cursorPts.length - 1 }, () => '0.6 0 0.3 1').join(';')} dur={L} {...rep} />
            <g>
              <animateTransform attributeName="transform" type="scale" {...clicks} dur={L} {...rep} />
              <path d="M0 0 L0 46 L12 35 L21 54 L30 50 L21 31 L38 31Z" transform="translate(7 6)" fill={p.accent2} opacity="0.8" style={{ mixBlendMode: blend }} />
              <path d="M0 0 L0 46 L12 35 L21 54 L30 50 L21 31 L38 31Z" fill={dark ? '#F0FFE0' : '#FFFFFF'} stroke={dark ? '#000000' : INK} strokeWidth="2.6" strokeLinejoin="round" />
              <circle r="9" fill="none" stroke={p.accent} strokeWidth="2.5" opacity="0">
                <animate attributeName="opacity" {...pulse([TAP[0], TAP[1], TAP[2], HIT], '0', '1', 0.02)} dur={L} {...rep} />
                <animate attributeName="r" {...pulse([TAP[0], TAP[1], TAP[2], HIT], '6', '22', 0.02)} dur={L} {...rep} />
              </circle>
            </g>
          </g>
        </g>
      </g>

      {/* Corner registration marks + kit label */}
      {[
        [40, 40],
        [1160, 40],
        [40, 860],
        [1160, 860],
      ].map(([x, y], i) => (
        <RegMark key={i} x={x} y={y} s={28} c={label} />
      ))}
      <text x="70" y="45" fontFamily={FONTS.mono} fontWeight="700" fontSize="12" letterSpacing="2.4" fill={label} opacity="0.75">
        LIVE PREVIEW · RENDERED ON DEMAND
      </text>
    </svg>
  );
}
