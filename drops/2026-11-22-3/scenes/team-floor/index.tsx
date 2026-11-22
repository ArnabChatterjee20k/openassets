import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Team Floor',
  description:
    "Landing-page hero for Ambit: an isometric open-plan office where every desk's AI use lights up the floor tiles around it, so the floor itself becomes the usage heatmap. Screens flicker, sparkles rise, the wall chart draws itself, and one team spikes into a budget alert.",
  tags: ['hero', 'isometric', 'office', 'heatmap', 'dashboard', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Wall sign').default('AMBIT · LIVE'),
  alert: text('Alert chip').default('DESIGN · 80% OF BUDGET'),
  skyTop: color('Backdrop top').default('#E9E3F5'),
  skyBottom: color('Backdrop bottom').default('#D6CCEC'),
  slab: color('Floor slab').default('#F3EFFA'),
  wall: color('Walls').default('#DCD3F0'),
  tileLow: color('Tile: low').default('#E4DDF4'),
  tileHigh: color('Tile: high').default('#5E4AE3'),
  hot: color('Hot / alert').default('#F49CBB'),
  screen: color('Screens').default('#2EC4B6'),
  desk: color('Desks').default('#FFFFFF'),
  ink: color('Ink').default('#231942'),
  plant: color('Plants').default('#3FA27A'),
  window: color('Window sky').default('#BFE6F2'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { skyTop: '#140F2B', skyBottom: '#2A2152', slab: '#3A3166', wall: '#2E2758', tileLow: '#3F3670', tileHigh: '#9C8CFF', desk: '#C9C2E8', window: '#0E0B22', screen: '#5EF2E2' },
  blueprint: { skyTop: '#0F3B8C', skyBottom: '#134AA8', slab: '#2A62C4', wall: '#1E55B5', tileLow: '#2F6BCC', tileHigh: '#EAF2FF', hot: '#FFDD00', screen: '#FFDD00', desk: '#D6E6FF', ink: '#071E4A', plant: '#7FB2FF', window: '#7FB2FF' },
  riso: { skyTop: '#F4EFE6', skyBottom: '#EAE2D3', slab: '#FBF7EF', wall: '#EAE2D3', tileLow: '#E9E1D2', tileHigh: '#0078BF', hot: '#FF48B0', screen: '#FFE800', ink: '#1F2A6B', plant: '#00A95C' },
  frost: { skyTop: '#E9EEF1', skyBottom: '#D3DDE3', slab: '#F6F8FA', wall: '#D9E2E8', tileLow: '#E1E8EC', tileHigh: '#2F6F8F', hot: '#E4572E', screen: '#A7C4D4', ink: '#17242E' },
};

type P = z.infer<typeof schema>;

const U = 52;
const LOOP = scene.loop;
const OX = 600;
const OY = 262;
const N = 10; // floor is N × N units
const C30 = Math.cos(Math.PI / 6);

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);

/** Pods: desk origin (x, y), how busy the team is, and the team label. */
const PODS = [
  { x: 1.6, y: 3.2, act: 0.75, label: 'ENG' },
  { x: 1.6, y: 6.8, act: 0.45, label: 'SALES' },
  { x: 5.8, y: 3.2, act: 0.55, label: 'SUPPORT' },
  { x: 5.8, y: 6.8, act: 1, label: 'DESIGN' }, // the one that spikes
];
const SPIKE = 3;
const center = (k: number) => ({ x: PODS[k].x + 1.1, y: PODS[k].y + 1.2 });

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * t));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

/** Heat at a floor point: the strongest pod's activity, falling off with distance. */
function heat(x: number, y: number) {
  let best = 0;
  let near = 0;
  let nd = 99;
  PODS.forEach((pod, k) => {
    const c = center(k);
    const d = Math.hypot(x - c.x, y - c.y);
    const h = pod.act * Math.exp(-(d * d) / 5);
    if (h > best) best = h;
    if (d < nd) {
      nd = d;
      near = k;
    }
  });
  return { h: best, near, d: nd };
}

function Tiles({ p }: { p: P }) {
  const out = [];
  const g = 0.06;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const { h, near, d } = heat(i + 0.5, j + 0.5);
      const q = Math.round(Math.min(1, h + rand(i * 13 + j) * 0.12) * 4) / 4;
      const fill = mixHex(p.tileLow, p.tileHigh, q * 0.92);
      const quad: P3[] = [[i + g, j + g, 0.02], [i + 1 - g, j + g, 0.02], [i + 1 - g, j + 1 - g, 0.02], [i + g, j + 1 - g, 0.02]];
      const spike = near === SPIKE && d < 2.3;
      out.push(
        <g key={`${i}-${j}`}>
          <polygon points={poly(quad)} fill={fill}>
            {/* Ripples radiate out from each desk: phase by distance to it. */}
            {q > 0 && <animate attributeName="opacity" values="1;0.72;1" dur="3s" begin={`${(-d * 0.45).toFixed(2)}s`} repeatCount="indefinite" />}
          </polygon>
          {spike && (
            <polygon points={poly(quad)} fill={p.hot} opacity="0">
              <animate attributeName="opacity" values="0;0;0.95;0.35;0.95;0.6;0;0" keyTimes="0;0.62;0.645;0.67;0.7;0.85;0.95;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            </polygon>
          )}
        </g>,
      );
    }
  }
  return <g>{out}</g>;
}

/** Soft cast shadow toward +x+y. */
function Shadow({ x, y, w, d, o = 0.18 }: { x: number; y: number; w: number; d: number; o?: number }) {
  return <polygon points={poly([[x + 0.2, y + 0.3, 0.03], [x + w + 0.5, y + 0.3, 0.03], [x + w + 0.5, y + d + 0.6, 0.03], [x + 0.2, y + d + 0.6, 0.03]])} fill="#1a1236" opacity={o} filter="url(#tf-blur)" />;
}

function Pod({ k, p }: { k: number; p: P }) {
  const { x, y, label } = PODS[k];
  const ink = { stroke: p.ink, strokeWidth: 1.3 };
  const w = 2.2;
  const d = 1.1;
  const top = 0.78;
  const [sx, sy] = S([x + 1.1, y + 0.12, 1.75]);
  const chairY = y + d + 0.35;
  const [hx, hy] = S([x + 1.1, chairY + 0.25, 1.62]);
  return (
    <g>
      {/* team label painted on the floor behind the desk (drawn first so the desk sits over it) */}
      <text
        transform={`matrix(${C30}, 0.5, -${C30}, 0.5, ${S([x + 0.05, y - 0.25, 0.03])[0]}, ${S([x + 0.05, y - 0.25, 0.03])[1]})`}
        fontFamily={FONTS.spacemono}
        fontWeight={700}
        fontSize="18"
        letterSpacing="2.5"
        fill={p.ink}
        opacity="0.8"
      >
        {label}
      </text>
      <Shadow x={x} y={y} w={w} d={d + 0.9} />
      {/* back legs, then desk top, then front legs */}
      <IsoBox x={x + 0.08} y={y + 0.08} w={0.1} d={0.1} h={top} color={shade(p.desk, -0.25)} u={U} ink={ink} />
      <IsoBox x={x + w - 0.18} y={y + 0.08} w={0.1} d={0.1} h={top} color={shade(p.desk, -0.25)} u={U} ink={ink} />
      <IsoBox x={x} y={y} z={top} w={w} d={d} h={0.12} color={p.desk} u={U} ink={ink} />
      <IsoBox x={x + 0.08} y={y + d - 0.18} w={0.1} d={0.1} h={top} color={shade(p.desk, -0.25)} u={U} ink={ink} />
      <IsoBox x={x + w - 0.18} y={y + d - 0.18} w={0.1} d={0.1} h={top} color={shade(p.desk, -0.25)} u={U} ink={ink} />
      {/* monitor: stand + bezel + glowing screen facing the viewer */}
      <IsoBox x={x + 1.02} y={y + 0.12} z={top + 0.12} w={0.16} d={0.12} h={0.25} color={shade(p.desk, -0.35)} u={U} ink={ink} />
      <IsoBox x={x + 0.45} y={y + 0.1} z={top + 0.35} w={1.3} d={0.1} h={0.78} color={p.ink} u={U} ink={ink} />
      <IsoWindow face="left" plane={y + 0.2} a={x + 0.52} z={top + 0.42} w={1.16} h={0.64} fill={p.screen} u={U} ink={{ strokeWidth: 0 }}>
        <Flicker dur={LOOP} seed={k * 7 + 3} low={0.7} />
      </IsoWindow>
      {/* mini heat bars on the screen */}
      {[0, 1, 2, 3].map((b) => (
        <IsoWindow key={b} face="left" plane={y + 0.21} a={x + 0.64 + b * 0.25} z={top + 0.5} w={0.16} h={0.12 + ((b * 37 + k * 11) % 5) * 0.08} fill={p.ink} u={U} ink={{ strokeWidth: 0 }} />
      ))}
      {/* keyboard + mug */}
      <IsoBox x={x + 0.6} y={y + 0.55} z={top + 0.12} w={0.9} d={0.28} h={0.04} color={shade(p.desk, -0.15)} u={U} ink={{ stroke: p.ink, strokeWidth: 0.8 }} />
      <IsoCylinder x={x + 1.85} y={y + 0.6} z={top + 0.12} r={0.11} h={0.2} color={k % 2 ? p.hot : p.tileHigh} u={U} ink={{ stroke: p.ink, strokeWidth: 0.9 }} />
      {/* chair + person seen from behind */}
      <IsoBox x={x + 0.75} y={chairY} z={0.42} w={0.7} d={0.6} h={0.1} color={shade(p.ink, 0.25)} u={U} ink={ink} />
      <IsoBox x={x + 1.05} y={chairY + 0.25} w={0.1} d={0.1} h={0.42} color={shade(p.ink, 0.1)} u={U} ink={ink} />
      <IsoCylinder x={x + 1.1} y={chairY + 0.25} z={0.52} r={0.3} h={0.8} color={[p.tileHigh, p.hot, p.screen, p.tileHigh][k]} u={U} ink={ink} />
      <circle cx={hx} cy={hy - 6} r={U * 0.24} fill={shade(p.hot, -0.55)} stroke={p.ink} strokeWidth="1.3">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="3s" begin={`${-k * 0.7}s`} repeatCount="indefinite" />
      </circle>
      <IsoBox x={x + 0.75} y={chairY + 0.55} z={0.52} w={0.7} d={0.1} h={0.6} color={shade(p.ink, 0.3)} u={U} ink={ink} />
      {/* sparkles rising off the screen = AI activity */}
      {[0, 1].map((s) => (
        <g key={s} transform={`translate(${sx + (s ? 18 : -14)} ${sy - 4})`}>
          <path d="M0 -8 Q1.3 -1.3 8 0 Q1.3 1.3 0 8 Q-1.3 1.3 -8 0 Q-1.3 -1.3 0 -8Z" fill={s ? p.hot : p.tileHigh} stroke={p.ink} strokeWidth="1" opacity="0">
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -46" dur="3s" begin={`${-(k * 0.8 + s * 1.5)}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.7;1" dur="3s" begin={`${-(k * 0.8 + s * 1.5)}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}
    </g>
  );
}

function Plant({ x, y, s = 1, p, seed }: { x: number; y: number; s?: number; p: P; seed: number }) {
  const [cx, cy] = S([x, y, 0.55 * s]);
  const leaves = [-60, -25, 5, 35, 65, -90];
  return (
    <g>
      <Shadow x={x - 0.4} y={y - 0.4} w={0.6} d={0.4} o={0.14} />
      <IsoCylinder x={x} y={y} r={0.32 * s} h={0.55 * s} color={p.desk} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
      <g transform={`translate(${cx} ${cy})`}>
        <animateTransform attributeName="transform" type="rotate" values="-3;3;-3" dur="6s" begin={`${-seed}s`} additive="sum" repeatCount="indefinite" />
        {leaves.map((a, i) => (
          <ellipse key={i} cx={0} cy={-U * 0.42 * s} rx={U * 0.13 * s} ry={U * 0.42 * s} fill={shade(p.plant, i % 2 ? -0.15 : 0.05)} stroke={p.ink} strokeWidth="1.1" transform={`rotate(${a})`} />
        ))}
      </g>
    </g>
  );
}

export default function TeamFloor(p: P) {
  const ink = { stroke: p.ink, strokeWidth: 1.4 };
  const WH = 3.4; // wall height
  // Wall display on the back-right wall (plane y = 0), facing the viewer.
  const dA = 2.2;
  const dW = 5.6;
  const dZ = 1.35;
  const dH = 1.75;
  const onWall = (a: number, zz: number) => S([a, 0.01, zz]);
  const chart = [0.3, 0.45, 0.4, 0.62, 0.55, 0.7, 0.66, 0.88, 0.8];
  const chartPts = chart.map((v, i) => onWall(dA + 0.35 + (i / (chart.length - 1)) * (dW - 0.7), dZ + 0.25 + v * (dH - 0.75))).map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
  const [ax, ay] = S([dA + dW * 0.62, 0, dZ + dH + 0.85]);
  // window on the left wall (plane x = 0)
  const wY = 5.4;
  const wW = 3;
  const wZ = 1.1;
  const wHt = 1.7;
  const [clx, cly] = S([0.01, 2.6, 2.35]);
  const [sgx, sgy] = S([0.01, 9.4, 2.65]);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${scene.width} ${scene.height}`}>
      <defs>
        <linearGradient id="tf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="tf-bloom">
          <stop offset="0" stopColor={p.hot} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.hot} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tf-bloom2">
          <stop offset="0" stopColor={p.tileHigh} stopOpacity="0.28" />
          <stop offset="1" stopColor={p.tileHigh} stopOpacity="0" />
        </radialGradient>
        <filter id="tf-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="tf-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="tf-window">
          <polygon points={poly([[0.02, wY, wZ], [0.02, wY + wW, wZ], [0.02, wY + wW, wZ + wHt], [0.02, wY, wZ + wHt]])} />
        </clipPath>
        <pattern id="tf-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={p.ink} opacity="0.12" />
        </pattern>
      </defs>

      {/* backdrop */}
      <rect width={scene.width} height={scene.height} fill="url(#tf-sky)" />
      <rect width={scene.width} height={scene.height} fill="url(#tf-dots)" />
      <circle cx={300} cy={700} r={420} fill="url(#tf-bloom)" />
      <circle cx={900} cy={180} r={460} fill="url(#tf-bloom2)" />

      <g transform={`translate(${OX} ${OY})`}>
        {/* ground shadow under the slab */}
        <polygon points={poly([[0.6, 0.6, -0.6], [N + 0.9, 0.6, -0.6], [N + 0.9, N + 0.9, -0.6], [0.6, N + 0.9, -0.6]])} fill="#1a1236" opacity="0.22" filter="url(#tf-blur)" transform="translate(0 18)" />
        {/* floor slab */}
        <IsoBox x={0} y={0} z={-0.6} w={N} d={N} h={0.6} color={p.slab} u={U} ink={ink} />
        {/* slab edge stripe */}
        <polyline points={poly([[0, N, -0.18], [N, N, -0.18], [N, 0, -0.18]])} stroke={p.tileHigh} strokeWidth="3" fill="none" opacity="0.8" />

        {/* back walls (cutaway diorama) */}
        <IsoBox x={-0.3} y={-0.3} w={0.3} d={N + 0.3} h={WH} color={p.wall} u={U} ink={ink} />
        <IsoBox x={0} y={-0.3} w={N} d={0.3} h={WH} color={p.wall} u={U} ink={ink} />
        {/* skirting */}
        <polyline points={poly([[0.01, N, 0.18], [0.01, 0.01, 0.18], [N, 0.01, 0.18]])} stroke={shade(p.wall, -0.3)} strokeWidth="2" fill="none" />

        {/* window frame + mullion on the left wall */}
        <IsoWindow face="right" plane={0.01} a={wY - 0.12} z={wZ - 0.12} w={wW + 0.24} h={wHt + 0.24} fill={shade(p.wall, -0.4)} u={U} ink={ink} />
        {/* the sky through the window, with clouds drifting along the wall plane */}
        <g clipPath="url(#tf-window)">
          <rect x={-OX} y={-OY} width={scene.width} height={scene.height} fill={p.window} />
          {[0, 1].map((c) => {
            const [cx0, cy0] = S([0.02, wY + wW + 0.6, wZ + 1.15 - c * 0.5]);
            const [cx1, cy1] = S([0.02, wY - 0.8, wZ + 1.15 - c * 0.5]);
            return (
              <g key={c} opacity="0.9">
                <animateTransform attributeName="transform" type="translate" values={`${cx0} ${cy0};${cx1} ${cy1}`} dur="6s" begin={`${-c * 3}s`} repeatCount="indefinite" />
                <g transform={`matrix(${C30}, -0.5, 0, 1, 0, 0)`}>
                  <ellipse cx="0" cy="0" rx="26" ry="9" fill="#FFFFFF" opacity="0.9" />
                  <ellipse cx="10" cy="-6" rx="14" ry="9" fill="#FFFFFF" opacity="0.9" />
                </g>
              </g>
            );
          })}
        </g>
        <IsoWindow face="right" plane={0.02} a={wY} z={wZ} w={wW} h={wHt} fill="none" u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
        <polyline points={poly([[0.02, wY + wW / 2, wZ], [0.02, wY + wW / 2, wZ + wHt]])} stroke={shade(p.wall, -0.4)} strokeWidth="5" />
        <IsoWindow face="right" plane={0.12} a={wY - 0.2} z={wZ - 0.24} w={wW + 0.4} h={0.1} fill={shade(p.wall, 0.25)} u={U} ink={ink} />

        {/* wall clock on the left wall: hand sweeps once per loop */}
        <g transform={`matrix(${C30}, -0.5, 0, 1, ${clx}, ${cly})`}>
          <circle r="22" fill={p.desk} stroke={p.ink} strokeWidth="2" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={0} y1={-17} x2={0} y2={-14} stroke={p.ink} strokeWidth="1.5" transform={`rotate(${i * 30})`} />
          ))}
          <line x1="0" y1="0" x2="0" y2="-10" stroke={p.ink} strokeWidth="3" strokeLinecap="round" transform="rotate(300)" />
          <line x1="0" y1="2" x2="0" y2="-16" stroke={p.hot} strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="6s" repeatCount="indefinite" />
          </line>
        </g>

        {/* neon-ish sign on the left wall, near the corner */}
        <g transform={`matrix(${C30}, -0.5, 0, 1, ${sgx}, ${sgy})`}>
          <rect x="-8" y="-30" width={p.sign.length * 15.5 + 16} height="42" rx="6" fill={p.ink} />
          <text x="0" y="0" fontFamily={FONTS.archivo} fontSize="24" letterSpacing="1" fill={p.hot} filter="url(#tf-glow)">
            {p.sign}
            <Flicker dur={LOOP} seed={11} low={0.55} />
          </text>
        </g>

        {/* wall display: bezel, screen, heat strip and a line chart that draws itself */}
        <IsoWindow face="left" plane={0.01} a={dA - 0.12} z={dZ - 0.12} w={dW + 0.24} h={dH + 0.24} fill={p.ink} u={U} ink={ink} />
        <IsoWindow face="left" plane={0.02} a={dA} z={dZ} w={dW} h={dH} fill={shade(p.slab, 0.2)} u={U} ink={{ strokeWidth: 0 }} />
        {Array.from({ length: 14 }, (_, i) => (
          <IsoWindow key={i} face="left" plane={0.03} a={dA + 0.3 + i * 0.36} z={dZ + 0.1} w={0.28} h={0.2} fill={i === 10 ? p.hot : mixHex(p.tileLow, p.tileHigh, ((i * 7) % 5) / 4)} u={U} ink={{ strokeWidth: 0 }}>
            {i === 10 && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />}
          </IsoWindow>
        ))}
        <polyline points={chartPts} fill="none" stroke={p.tileHigh} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="420" strokeDashoffset="420">
          <animate attributeName="stroke-dashoffset" values="420;0;0;420" keyTimes="0;0.45;0.9;1" dur="6s" repeatCount="indefinite" />
        </polyline>
        <text transform={`matrix(${C30}, 0.5, 0, 1, ${onWall(dA + 0.3, dZ + dH - 0.35)[0]}, ${onWall(dA + 0.3, dZ + dH - 0.35)[1]})`} fontFamily={FONTS.spacemono} fontWeight={700} fontSize="13" letterSpacing="1.5" fill={p.ink}>
          AI SPEND · $18,420
        </text>

        {/* back-corner plant */}
        <Plant x={0.8} y={0.9} s={1.3} p={p} seed={0} />

        <Tiles p={p} />

        {/* pods, back to front */}
        <Pod k={0} p={p} />
        <Pod k={2} p={p} />
        <Pod k={1} p={p} />
        <Pod k={3} p={p} />

        {/* front plants */}
        <Plant x={9.2} y={1.2} s={1.1} p={p} seed={2} />
        <Plant x={0.9} y={9.2} s={1} p={p} seed={4} />

        {/* moment: the design pod spikes, an alert chip pops above the wall display */}
        <g transform={`translate(${ax} ${ay})`}>
          <g opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.64;0.66;0.9;0.93;1" dur="6s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="scale" values="0.5;0.5;1.12;1;1;0.9;0.9" keyTimes="0;0.64;0.68;0.71;0.9;0.93;1" dur="6s" repeatCount="indefinite" />
            <rect x={-p.alert.length * 5.4 - 22 + 5} y={-20 + 5} width={p.alert.length * 10.8 + 44} height={40} rx="9" fill={p.ink} />
            <rect x={-p.alert.length * 5.4 - 22} y={-20} width={p.alert.length * 10.8 + 44} height={40} rx="9" fill={p.hot} stroke={p.ink} strokeWidth="2.5" />
            <circle cx={-p.alert.length * 5.4 - 6} cy={0} r="5" fill={p.ink}>
              <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" />
            </circle>
            <text x={-p.alert.length * 5.4 + 6} y={5.5} fontFamily={FONTS.spacemono} fontWeight={700} fontSize="16" fill={p.ink}>
              {p.alert}
            </text>
            <path d="M-8 20 L0 32 L8 20 Z" fill={p.hot} stroke={p.ink} strokeWidth="2.5" strokeLinejoin="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}
