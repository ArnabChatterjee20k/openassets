import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoGrid, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Allocation Desk',
  description:
    'Folio landing-page hero: an isometric paper plinth where the red agent cube sits at the centre of 8 platform pillars. Budget packets run the rails, pillar lamps blink, a ring of rules turns, a news ticker scrolls, and once a loop one platform wins: it flashes red, grows, and a "+$4,120" chip pops.',
  tags: ['hero', 'isometric', 'ad agent', 'network', 'swiss', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  chip: text('Win chip').default('+$4,120 → TikTok'),
  ticker: text('Ticker').default('GGL +2.1%  ·  MTA +0.8%  ·  TTK +4.6%  ·  AMZ +3.0%  ·  LKD +1.2%  ·  PIN +1.9%  ·  SNP +0.6%  ·  RDT −0.4%'),
  caption: text('Caption').default('Fig. 2 — Folio allocation desk · live'),
  paper: color('Background').default('#F5F5F0'),
  paper2: color('Background low').default('#E6E6E1'),
  plinth: color('Plinth').default('#E6E6E1'),
  pillar: color('Pillars').default('#F7F7F3'),
  ink: color('Ink').default('#0A0A0A'),
  accent: color('Agent red').default('#E3000F'),
  graphite: color('Graphite').default('#8C8C88'),
  labels: toggle('Platform labels').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-edition': { paper: '#141418', paper2: '#0B0B0D', plinth: '#2A2A30', pillar: '#3A3A42', ink: '#F3EDE2', accent: '#C9A45C', graphite: '#6E6A62' },
  blueprint: { paper: '#164AA6', paper2: '#0F3B8C', plinth: '#134AA8', pillar: '#2A62C4', ink: '#EAF2FF', accent: '#FFDD00', graphite: '#7FB2FF' },
  bauhaus: { paper: '#F2EBDD', paper2: '#E4D9C4', plinth: '#1D4E9E', pillar: '#F2EBDD', ink: '#111111', accent: '#D9381E', graphite: '#F2B90F' },
  frost: { paper: '#E9EEF1', paper2: '#D3DDE3', plinth: '#D3DDE3', pillar: '#FFFFFF', ink: '#17242E', accent: '#E4572E', graphite: '#A7C4D4', labels: false },
};

type P = z.infer<typeof schema>;

const U = 34;
const LOOP = scene.loop;
const OX = 600;
const OY = 268;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3): [number, number] => {
  const [a, b] = iso(p, U);
  return [a + OX, b + OY];
};
const poly = (ps: P3[]) =>
  ps
    .map((q) => S(q))
    .map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`)
    .join(' ');

/** IsoBox placed in page space (the kit draws around the world origin). */
function Box(props: Parameters<typeof IsoBox>[0]) {
  return (
    <g transform={`translate(${OX} ${OY})`}>
      <IsoBox {...props} />
    </g>
  );
}

interface Pillar {
  x: number;
  y: number;
  h: number;
  tk: string;
  win?: boolean;
}
const D = 1.6;
const PILLARS: Pillar[] = [
  { x: 1, y: 1, h: 3.4, tk: 'GGL' },
  { x: 5.2, y: 0.8, h: 2.4, tk: 'MTA' },
  { x: 0.8, y: 5.2, h: 2.8, tk: 'AMZ' },
  { x: 9.4, y: 1, h: 1.7, tk: 'LKD' },
  { x: 9.4, y: 5.2, h: 1.9, tk: 'TTK', win: true },
  { x: 1, y: 9.4, h: 1.5, tk: 'PIN' },
  { x: 5.2, y: 9.4, h: 1.05, tk: 'SNP' },
  { x: 9.4, y: 9.4, h: 1.25, tk: 'RDT' },
];
const HUB: P3 = [6, 6, 0.02];
const MOMENT = 0.6; // fraction of the loop when the winning platform fires

/** A budget packet: a small red tile sliding along a rail from the hub. */
function Packet({ from, to, begin, p }: { from: [number, number]; to: [number, number]; begin: number; p: P }) {
  const r = 0.3;
  const tile = pts([[-r, -r, 0], [r, -r, 0], [r, r, 0], [-r, r, 0]], U);
  return (
    <g opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="2s" begin={`-${begin}s`} repeatCount="indefinite" />
      <animateMotion dur="2s" begin={`-${begin}s`} repeatCount="indefinite" path={`M${from[0]},${from[1]} L${to[0]},${to[1]}`} />
      <polygon points={tile} fill={p.accent} stroke={p.ink} strokeWidth="0.8" />
    </g>
  );
}

function PillarView({ q, p }: { q: Pillar; p: P }) {
  const { x, y, h } = q;
  const X = x + D;
  const Y = y + D;
  const [lx, ly] = S([x + 0.18, Y, h - 0.42]);
  const [tx, ty] = S([x + D / 2, y + D / 2, h]);
  const lamp = S([x + D / 2, y + D / 2, h + 0.02]);
  const ink = { stroke: p.ink, strokeWidth: 1.1 };
  const kt = `0;${MOMENT - 0.01};${MOMENT};${MOMENT + 0.03};${MOMENT + 0.06};${MOMENT + 0.3};1`;
  return (
    <g>
      {/* cast shadow away from the light (light from upper-left) */}
      <polygon points={poly([[X, y, 0.01], [X + h * 0.32, y + h * 0.1, 0.01], [X + h * 0.32, Y + h * 0.1, 0.01], [X, Y, 0.01]])} fill={p.ink} opacity="0.12" filter="url(#ad-blur)" />
      <Box x={x} y={y} w={D} d={D} h={h} color={p.pillar} u={U} ink={ink} />
      {/* bar ticks on the right face: a mini chart scale */}
      {Array.from({ length: Math.floor(h / 0.5) }, (_, i) => (
        <polyline key={i} points={poly([[X, y + 0.15, 0.5 * (i + 1)], [X, y + 0.45, 0.5 * (i + 1)]])} stroke={shade(p.pillar, -0.45)} strokeWidth="1" fill="none" />
      ))}
      {p.labels && (
        <g transform={`translate(${lx} ${ly}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
          <text x="0" y="0" fontFamily="'Space Mono', ui-monospace, monospace" fontWeight="700" fontSize="15" letterSpacing="1" fill={p.ink}>
            {q.tk}
          </text>
        </g>
      )}
      {/* status lamp on top */}
      <polygon points={pts([[-0.18, -0.18, 0], [0.18, -0.18, 0], [0.18, 0.18, 0], [-0.18, 0.18, 0]], U)} transform={`translate(${lamp[0]} ${lamp[1]})`} fill={q.win ? p.accent : p.ink}>
        <Flicker dur={q.win ? 2 : 3} seed={x * 3 + y} low={0.25} />
      </polygon>
      {q.win && (
        <g>
          {/* the win: top face flashes red */}
          <polygon points={poly([[x, y, h], [X, y, h], [X, Y, h], [x, Y, h]])} fill={p.accent} opacity="0">
            <animate attributeName="opacity" values="0;0;1;0.4;1;0;0" keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
          </polygon>
          {/* and grows a red extension that rises out of the top */}
          <g transform={`translate(${tx} ${ty})`}>
            <g>
              <animateTransform attributeName="transform" type="scale" values="1 0.001;1 0.001;1 1.15;1 1;1 1;1 0.001" keyTimes={`0;${MOMENT};${MOMENT + 0.06};${MOMENT + 0.1};0.95;1`} dur={`${LOOP}s`} repeatCount="indefinite" />
              <g transform={`translate(${-tx} ${-ty})`}>
                <Box x={x + 0.15} y={y + 0.15} z={h} w={D - 0.3} d={D - 0.3} h={1.1} color={p.accent} u={U} ink={ink} />
              </g>
            </g>
          </g>
          {/* shockwave on the floor */}
          <ellipse cx={S([x + D / 2, y + D / 2, 0])[0]} cy={S([x + D / 2, y + D / 2, 0])[1]} rx="10" ry="6" fill="none" stroke={p.accent} strokeWidth="2" opacity="0">
            <animate attributeName="rx" values="10;10;140;140" keyTimes={`0;${MOMENT};${MOMENT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="ry" values="6;6;80;80" keyTimes={`0;${MOMENT};${MOMENT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes={`0;${MOMENT};${MOMENT + 0.01};${MOMENT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          </ellipse>
        </g>
      )}
    </g>
  );
}

function WinChip({ p }: { p: P }) {
  const w = PILLARS.find((q) => q.win)!;
  const [cx, cy] = S([w.x + D / 2, w.y + D / 2, w.h + 2.6]);
  const width = Math.max(150, p.chip.length * 9.6 + 44);
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g>
        <animateTransform attributeName="transform" type="scale" values="0;0;1.12;1;1;0;0" keyTimes={`0;${MOMENT + 0.03};${MOMENT + 0.08};${MOMENT + 0.11};0.93;0.97;1`} dur={`${LOOP}s`} repeatCount="indefinite" />
        <rect x={-width / 2 + 5} y={-17 + 5} width={width} height="34" fill={p.ink} />
        <rect x={-width / 2} y={-17} width={width} height="34" fill={p.paper} stroke={p.ink} strokeWidth="1.4" />
        <rect x={-width / 2 + 12} y={-5} width="10" height="10" fill={p.accent} />
        <text x={-width / 2 + 32} y="5" fontFamily="'Space Mono', ui-monospace, monospace" fontSize="15" fontWeight="700" fill={p.ink}>
          {p.chip}
        </text>
        <line x1="0" y1="17" x2="0" y2="46" stroke={p.ink} strokeWidth="1.2" />
      </g>
    </g>
  );
}

export default function AllocationDesk(p: P) {
  const sorted = [...PILLARS].sort((a, b) => a.x + a.y - (b.x + b.y));
  const back = sorted.filter((q) => q.x + q.y < 11.6);
  const front = sorted.filter((q) => q.x + q.y >= 11.6);
  const hub = S(HUB);
  const [cubeX, cubeY] = S([6, 6, 1.0]);
  const ringR = 2.3;
  const rx = ringR * U * 1.2247;
  const ry = ringR * U * 0.7071;
  const kt = `0;${MOMENT - 0.02};${MOMENT};${MOMENT + 0.04};1`;

  // Drifting paper squares in the air: quiet ambient motion.
  const motes: ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const x = 60 + rand(i * 4.7) * 1080;
    const y = 120 + rand(i * 9.3) * 640;
    const s = 3 + rand(i * 2.1) * 6;
    const dur = [6, 3, 2][i % 3];
    motes.push(
      <rect key={i} x={x} y={y} width={s} height={s} fill={i % 7 === 0 ? p.accent : p.graphite} opacity="0">
        <animate attributeName="opacity" values="0;0.55;0" dur={`${dur}s`} begin={`-${(rand(i * 5.5) * dur).toFixed(2)}s`} repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -40" dur={`${dur}s`} begin={`-${(rand(i * 5.5) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </rect>,
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="ad-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.paper} />
          <stop offset="1" stopColor={p.paper2} />
        </linearGradient>
        <radialGradient id="ad-lift" cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ad-hubglow">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <filter id="ad-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="ad-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <clipPath id="ad-tickclip">
          <rect x="0" y="842" width="1200" height="58" />
        </clipPath>
      </defs>

      {/* ── Page ── */}
      <rect width="1200" height="900" fill="url(#ad-bg)" />
      <rect width="1200" height="900" fill="url(#ad-lift)" />
      <g stroke={p.ink} strokeOpacity="0.06" strokeWidth="1">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1={60 + i * 90} y1="96" x2={60 + i * 90} y2="842" />
        ))}
      </g>
      {/* masthead rule + caption */}
      <line x1="60" y1="72" x2="1140" y2="72" stroke={p.ink} strokeWidth="3" />
      <text x="60" y="56" fontFamily="'Space Mono', ui-monospace, monospace" fontSize="15" letterSpacing="3.6" fill={p.ink}>
        {p.caption.toUpperCase()}
      </text>
      <rect x="1124" y="44" width="16" height="16" fill={p.accent}>
        <animate attributeName="opacity" values="1;1;0.2;0.2;1" keyTimes="0;0.45;0.5;0.95;1" dur="1s" repeatCount="indefinite" />
      </rect>
      {motes}

      {/* ── Plinth ── */}
      <polygon points={poly([[0, 12.4, -0.9], [12.4, 12.4, -0.9], [12.4, 0, -0.9], [13.6, 1.2, -0.9], [13.6, 13.6, -0.9], [1.2, 13.6, -0.9]])} fill={p.ink} opacity="0.12" filter="url(#ad-soft)" />
      <Box x={-0.2} y={-0.2} z={-0.8} w={12.4} d={12.4} h={0.8} color={p.plinth} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
      <g transform={`translate(${OX} ${OY})`}>
        <IsoGrid x={0} y={0} w={12} d={12} u={U} color={p.ink} opacity={0.14} />
      </g>
      {/* index numbers engraved along the front edges */}
      {Array.from({ length: 12 }, (_, i) => {
        const [ax, ay] = S([i + 0.35, 12.12, -0.45]);
        return (
          <g key={i} transform={`translate(${ax} ${ay}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <text fontFamily="'Space Mono', ui-monospace, monospace" fontSize="9" fill={p.ink} opacity="0.55">
              {String(i + 1).padStart(2, '0')}
            </text>
          </g>
        );
      })}

      {/* ── Rails + packets ── */}
      <g stroke={p.ink} strokeWidth="1.3" strokeDasharray="5 5" opacity="0.5">
        {PILLARS.map((q, i) => {
          const [bx, by] = S([q.x + D / 2, q.y + D / 2, 0.02]);
          return <line key={i} x1={hub[0]} y1={hub[1]} x2={bx} y2={by} />;
        })}
      </g>
      <ellipse cx={hub[0]} cy={hub[1]} rx="160" ry="92" fill="url(#ad-hubglow)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </ellipse>
      {PILLARS.map((q, i) => {
        const to = S([q.x + D / 2, q.y + D / 2, 0.02]);
        return [0, 1].map((k) => <Packet key={`${i}-${k}`} from={hub} to={to} begin={(i * 0.27 + k) % 2} p={p} />);
      })}

      {/* rotating ring of rules around the hub, in the ground plane */}
      <g transform={`translate(${hub[0]} ${hub[1]}) scale(1 ${(ry / rx).toFixed(3)})`}>
        <g>
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur={`${LOOP}s`} repeatCount="indefinite" />
          <circle r={rx} fill="none" stroke={p.ink} strokeWidth="1.6" strokeDasharray="2 14" />
          <circle r={rx * 0.86} fill="none" stroke={p.accent} strokeWidth="2.4" strokeDasharray={`${rx * 0.6} ${rx * 4.8}`} />
        </g>
      </g>

      {back.map((q) => (
        <PillarView key={q.tk} q={q} p={p} />
      ))}

      {/* ── The agent: ink pedestal + red cube ── */}
      <Box x={5.2} y={5.2} w={1.6} d={1.6} h={1} color={p.ink} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      <ellipse cx={cubeX} cy={cubeY + 4} rx="30" ry="14" fill={p.ink} opacity="0.3" filter="url(#ad-blur)">
        <animate attributeName="rx" values="30;24;30" dur="2s" repeatCount="indefinite" />
      </ellipse>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -12;0 0" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" keyTimes="0;0.5;1" />
        <Box x={5.45} y={5.45} z={1.35} w={1.1} d={1.1} h={1.1} color={p.accent} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
        {/* cube flashes as it sends the winning move */}
        <polygon points={poly([[5.45, 5.45, 2.45], [6.55, 5.45, 2.45], [6.55, 6.55, 2.45], [5.45, 6.55, 2.45]])} fill="#ffffff" opacity="0">
          <animate attributeName="opacity" values="0;0;0.85;0;0" keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
        </polygon>
      </g>

      {front.map((q) => (
        <PillarView key={q.tk} q={q} p={p} />
      ))}

      <WinChip p={p} />

      {/* ── News ticker band ── */}
      <rect x="0" y="842" width="1200" height="58" fill={p.ink} />
      <rect x="0" y="842" width="148" height="58" fill={p.accent} />
      <text x="24" y="878" fontFamily="'Space Mono', ui-monospace, monospace" fontSize="17" fontWeight="700" letterSpacing="2" fill={p.paper}>
        LIVE
      </text>
      <g clipPath="url(#ad-tickclip)">
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;-1200 0" dur={`${LOOP}s`} repeatCount="indefinite" />
          {[0, 1].map((k) => (
            <text key={k} x={170 + k * 1200} y="878" fontFamily="'Space Mono', ui-monospace, monospace" fontSize="17" letterSpacing="1.5" fill={p.paper} textLength="1160" lengthAdjust="spacingAndGlyphs">
              {p.ticker}
            </text>
          ))}
        </g>
      </g>
      <rect x="0" y="842" width="148" height="58" fill={p.accent} />
      <text x="24" y="878" fontFamily="'Space Mono', ui-monospace, monospace" fontSize="17" fontWeight="700" letterSpacing="2" fill={p.paper}>
        LIVE ●
      </text>
    </svg>
  );
}
