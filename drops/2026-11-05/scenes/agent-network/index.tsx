import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Agent Network',
  description:
    'Landing-page hero for an AI ad agent: an isometric moss slab at night with the agent’s CRT console in the centre and six ad-platform kiosks (billboard, CTV, phone feed, search, video, shop) joined by glowing mycelium threads that carry ad packets. Every few seconds the agent launches and every platform lights up at once.',
  tags: ['hero', 'isometric', 'network', 'ai', 'ads', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  prompt: text('Console prompt').default('mycel launch --everywhere'),
  badge: text('Launch badge').default('32 PLATFORMS LIVE'),
  skyTop: color('Sky top').default('#07110C'),
  skyBottom: color('Sky bottom').default('#1C3426'),
  moss: color('Moss').default('#3F6B45'),
  soil: color('Soil').default('#3A2A20'),
  body: color('Console & kiosks').default('#DCE6C6'),
  screen: color('Screens').default('#12241A'),
  glow: color('Threads & glow').default('#B5E550'),
  fern: color('Secondary').default('#4E8A5B'),
  pop: color('Live dot').default('#FF9F43'),
  fireflies: toggle('Fireflies').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dawn: { skyTop: '#2B1B3E', skyBottom: '#FF9A62', moss: '#5C7A3E', soil: '#4A2E22', fern: '#8C6B3E', pop: '#FFD27F' },
  daylight: { skyTop: '#9FD3E8', skyBottom: '#EEF6E4', moss: '#7DB45A', soil: '#7A5235', body: '#FFFFFF', glow: '#5E9E2A', fern: '#3E7A4A', fireflies: false },
  'deep-sea': { skyTop: '#010E14', skyBottom: '#06303F', moss: '#1B5E66', soil: '#0B2430', body: '#CFEFEA', screen: '#021B26', glow: '#2EF2C4', fern: '#1B7FA6', pop: '#FF7A59' },
  acid: { skyTop: '#0B0B0B', skyBottom: '#231030', moss: '#2A2A2A', soil: '#141414', body: '#F0FFE0', screen: '#0B0B0B', glow: '#C6FF00', fern: '#FF00E5', pop: '#00F0FF' },
};

type P = z.infer<typeof schema>;

const U = 44;
const OX = 600;
const OY = 168;
const LOOP = scene.loop;
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(6,14,9,0.6)';
const ink = { stroke: INK };
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

// The launch moment, as a fraction of the loop.
const HIT = 0.5;
const hitTimes = `0;${HIT - 0.001};${HIT};${HIT + 0.04};${HIT + 0.22};1`;
const hitFlash = '0;0;1;0.75;0;0';

/** 2D drawing in a box's left face (plane y = Y, running along +x). Local px: x along the face, y down. */
function LeftFace({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) {
  const [sx, sy] = S([x, y, z]);
  return <g transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>{children}</g>;
}
/** 2D drawing in a box's right face (plane x = X), reading left→right along −y from (X, y, z). */
function RightFace({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) {
  const [sx, sy] = S([x, y, z]);
  return <g transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)}) matrix(${C30}, -0.5, 0, 1, 0, 0)`}>{children}</g>;
}

function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.4;
  return <polygon points={poly([[x, y + d, 0.02], [x + w, y + d, 0.02], [x + w + l * 0.25, y + d + l, 0.02], [x + l * 0.25, y + d + l, 0.02]])} fill="#020604" opacity="0.38" filter="url(#an-blur)" />;
}

/** Flash overlay for a screen at the launch moment. */
const Hit = ({ w, h, p }: { w: number; h: number; p: P }) => (
  <rect width={w} height={h} fill={p.glow} opacity="0">
    <animate attributeName="opacity" values={hitFlash} keyTimes={hitTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
  </rect>
);

/** Screen content per platform, in local px (w × h). */
function Screen({ kind, w, h, p, id }: { kind: string; w: number; h: number; p: P; id: string }) {
  const light = '#EAF2DC';
  const dim = 'rgba(234,242,220,0.45)';
  let content: ReactNode = null;
  if (kind === 'billboard') {
    content = (
      <>
        <rect width={w} height={h} fill={p.fern} />
        <circle cx={w * 0.78} cy={h * 0.38} r={h * 0.26} fill={p.pop} opacity="0.95" />
        <path d={`M0,${h} L${w * 0.32},${h * 0.45} L${w * 0.52},${h * 0.7} L${w * 0.7},${h * 0.5} L${w},${h} Z`} fill={shade(p.fern, -0.4)} />
        <text x={w * 0.06} y={h * 0.3} fontFamily="'VT323',monospace" fontSize={h * 0.3} fill={light}>TRAIL 2</text>
        <text x={w * 0.06} y={h * 0.52} fontFamily="'Silkscreen',monospace" fontSize={h * 0.13} fill={light}>$129</text>
      </>
    );
  } else if (kind === 'tv') {
    content = (
      <>
        <rect width={w} height={h} fill={p.screen} />
        <rect x={w * 0.06} y={h * 0.1} width={w * 0.88} height={h * 0.62} rx="2" fill={shade(p.fern, -0.15)} />
        <circle cx={w * 0.3} cy={h * 0.36} r={h * 0.14} fill={p.pop} />
        <path d={`M${w * 0.06},${h * 0.72} L${w * 0.4},${h * 0.38} L${w * 0.6},${h * 0.58} L${w * 0.76},${h * 0.44} L${w * 0.94},${h * 0.72} Z`} fill={shade(p.fern, -0.45)} />
        <rect x={w * 0.06} y={h * 0.8} width={w * 0.88} height={h * 0.05} fill={dim} />
        <rect x={w * 0.06} y={h * 0.8} width={w * 0.3} height={h * 0.05} fill={p.glow}>
          <animate attributeName="width" values={`${w * 0.05};${w * 0.88}`} dur={`${LOOP}s`} repeatCount="indefinite" />
        </rect>
        <rect x={w * 0.7} y={h * 0.14} width={w * 0.2} height={h * 0.14} rx="1.5" fill={p.glow} />
        <text x={w * 0.8} y={h * 0.245} textAnchor="middle" fontFamily="'Silkscreen',monospace" fontSize={h * 0.09} fill={p.screen}>AD</text>
      </>
    );
  } else if (kind === 'feed') {
    const ch = h * 0.34;
    content = (
      <>
        <rect width={w} height={h} fill={p.screen} />
        <clipPath id={`${id}-clip`}>
          <rect x={0} y={h * 0.1} width={w} height={h * 0.86} />
        </clipPath>
        <g clipPath={`url(#${id}-clip)`}>
          <g>
            <animateTransform attributeName="transform" type="translate" values={`0 0;0 ${-ch}`} dur="2s" repeatCount="indefinite" />
            {Array.from({ length: 4 }, (_, i) => (
              <g key={i} transform={`translate(0 ${h * 0.12 + i * ch})`}>
                <rect x={w * 0.1} y={0} width={w * 0.8} height={ch * 0.62} rx="2" fill={i % 2 ? p.fern : shade(p.glow, -0.2)} />
                <rect x={w * 0.1} y={ch * 0.7} width={w * 0.55} height={ch * 0.08} fill={dim} />
              </g>
            ))}
          </g>
        </g>
        <rect x={w * 0.35} y={h * 0.035} width={w * 0.3} height={h * 0.025} rx="1" fill={dim} />
      </>
    );
  } else if (kind === 'search') {
    content = (
      <>
        <rect width={w} height={h} fill={p.screen} />
        <rect x={w * 0.08} y={h * 0.12} width={w * 0.84} height={h * 0.2} rx={h * 0.1} fill="none" stroke={light} strokeWidth="1.4" />
        <circle cx={w * 0.15} cy={h * 0.22} r={h * 0.05} fill="none" stroke={light} strokeWidth="1.3" />
        <rect x={w * 0.22} y={h * 0.2} width={w * 0.4} height={h * 0.04} fill={light}>
          <animate attributeName="width" values={`0;${w * 0.4};${w * 0.4}`} keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" />
        </rect>
        <rect x={w * 0.08} y={h * 0.44} width={w * 0.12} height={h * 0.1} rx="1" fill={p.glow} />
        <rect x={w * 0.24} y={h * 0.46} width={w * 0.5} height={h * 0.06} fill={light} />
        <rect x={w * 0.08} y={h * 0.62} width={w * 0.72} height={h * 0.05} fill={dim} />
        <rect x={w * 0.08} y={h * 0.76} width={w * 0.6} height={h * 0.05} fill={dim} />
      </>
    );
  } else if (kind === 'video') {
    content = (
      <>
        <rect width={w} height={h} fill={p.screen} />
        <rect x={w * 0.06} y={h * 0.08} width={w * 0.88} height={h * 0.66} rx="2" fill={shade(p.screen, 0.15)} />
        <path d={`M${w * 0.44},${h * 0.26} L${w * 0.6},${h * 0.41} L${w * 0.44},${h * 0.56} Z`} fill={p.glow}>
          <animate attributeName="opacity" values="1;0.55;1" dur="1s" repeatCount="indefinite" />
        </path>
        <rect x={w * 0.06} y={h * 0.82} width={w * 0.88} height={h * 0.05} fill={dim} />
        <circle cx={w * 0.06} cy={h * 0.845} r={h * 0.05} fill={p.pop}>
          <animate attributeName="cx" values={`${w * 0.06};${w * 0.94}`} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
      </>
    );
  } else if (kind === 'shop') {
    content = (
      <>
        <rect width={w} height={h} fill={p.screen} />
        <rect x={w * 0.18} y={h * 0.12} width={w * 0.64} height={h * 0.42} rx="3" fill={shade(p.fern, -0.1)} />
        <path d={`M${w * 0.36},${h * 0.26} h${w * 0.28} l${w * 0.03},${h * 0.2} h${-w * 0.34} Z`} fill={light} />
        <path d={`M${w * 0.42},${h * 0.26} q${w * 0.08},${-h * 0.12} ${w * 0.16},0`} fill="none" stroke={light} strokeWidth="1.4" />
        <text x={w * 0.5} y={h * 0.7} textAnchor="middle" fontFamily="'VT323',monospace" fontSize={h * 0.17} fill={light}>$129</text>
        <rect x={w * 0.2} y={h * 0.77} width={w * 0.6} height={h * 0.14} rx={h * 0.05} fill={p.glow} />
        <text x={w * 0.5} y={h * 0.875} textAnchor="middle" fontFamily="'Silkscreen',monospace" fontSize={h * 0.08} fill={p.screen}>BUY</text>
      </>
    );
  }
  return (
    <g>
      {content}
      {/* scanlines + launch flash */}
      <rect width={w} height={h} fill={`url(#an-scan)`} opacity="0.5" />
      <Hit w={w} h={h} p={p} />
    </g>
  );
}

interface Pod {
  kind: string;
  x: number;
  y: number;
}

/** One ad-platform kiosk: plinth + device with its screen on the left (front-left) face. */
function Kiosk({ pod, p }: { pod: Pod; p: P }) {
  const { kind, x, y } = pod;
  const body = p.body;
  const out: ReactNode[] = [];
  out.push(<IsoBox key="pl" x={x - 0.15} y={y - 0.15} w={2.3} d={2.3} h={0.28} color={shade(p.moss, -0.25)} u={U} ink={ink} />);
  out.push(<polygon key="plg" points={poly([[x - 0.05, y + 2.1, 0.29], [x + 2.05, y + 2.1, 0.29]])} stroke={p.glow} strokeWidth="2" opacity="0.7" />);
  const z0 = 0.28;
  if (kind === 'billboard') {
    // two posts + a big panel
    [0.4, 1.6].forEach((a, i) => out.push(<IsoBox key={`post${i}`} x={x + a} y={y + 1} z={z0} w={0.14} d={0.14} h={1.6} color="#4A4F45" u={U} ink={ink} />));
    out.push(<IsoBox key="panel" x={x - 0.3} y={y + 0.9} z={z0 + 1.6} w={2.6} d={0.22} h={1.6} color={body} u={U} ink={ink} />);
    out.push(
      <LeftFace key="scr" x={x - 0.2} y={y + 1.12} z={z0 + 3.1}>
        <Screen kind={kind} w={2.4 * U} h={1.4 * U} p={p} id="an-bb" />
      </LeftFace>,
    );
    // lamp bar
    out.push(<IsoBox key="lamp" x={x - 0.2} y={y + 1.1} z={z0 + 3.2} w={2.4} d={0.12} h={0.08} color={p.glow} u={U} ink={{ strokeWidth: 0 }} />);
  } else if (kind === 'tv') {
    out.push(<IsoBox key="leg" x={x + 0.85} y={y + 0.9} z={z0} w={0.3} d={0.3} h={0.6} color="#4A4F45" u={U} ink={ink} />);
    out.push(<IsoBox key="foot" x={x + 0.4} y={y + 0.7} z={z0} w={1.2} d={0.7} h={0.1} color="#4A4F45" u={U} ink={ink} />);
    out.push(<IsoBox key="tv" x={x - 0.2} y={y + 0.9} z={z0 + 0.6} w={2.4} d={0.24} h={1.45} color={shade(body, -0.25)} u={U} ink={ink} />);
    out.push(
      <LeftFace key="scr" x={x - 0.1} y={y + 1.14} z={z0 + 1.97}>
        <Screen kind={kind} w={2.2 * U} h={1.27 * U} p={p} id="an-tv" />
      </LeftFace>,
    );
  } else if (kind === 'feed') {
    out.push(<IsoBox key="ph" x={x + 0.45} y={y + 0.8} z={z0} w={1.1} d={0.22} h={2.1} color={body} u={U} ink={ink} />);
    out.push(
      <LeftFace key="scr" x={x + 0.53} y={y + 1.02} z={z0 + 1.98}>
        <Screen kind={kind} w={0.94 * U} h={1.86 * U} p={p} id="an-feed" />
      </LeftFace>,
    );
  } else if (kind === 'search') {
    out.push(<IsoBox key="desk" x={x + 0.1} y={y + 0.4} z={z0} w={1.8} d={1.2} h={0.55} color={shade(body, -0.1)} u={U} ink={ink} />);
    out.push(<IsoBox key="mon" x={x + 0.1} y={y + 0.8} z={z0 + 0.55} w={1.8} d={0.16} h={1.25} color={body} u={U} ink={ink} />);
    out.push(
      <LeftFace key="scr" x={x + 0.18} y={y + 0.96} z={z0 + 1.72}>
        <Screen kind={kind} w={1.64 * U} h={1.1 * U} p={p} id="an-search" />
      </LeftFace>,
    );
  } else if (kind === 'video') {
    out.push(<IsoBox key="cab" x={x + 0.2} y={y + 0.6} z={z0} w={1.6} d={0.9} h={0.8} color={shade(body, -0.12)} u={U} ink={ink} />);
    out.push(<IsoBox key="scrb" x={x + 0.1} y={y + 0.9} z={z0 + 0.8} w={1.8} d={0.2} h={1.25} color={body} u={U} ink={ink} />);
    out.push(
      <LeftFace key="scr" x={x + 0.18} y={y + 1.1} z={z0 + 1.97}>
        <Screen kind={kind} w={1.64 * U} h={1.1 * U} p={p} id="an-video" />
      </LeftFace>,
    );
  } else if (kind === 'shop') {
    out.push(<IsoBox key="stall" x={x + 0.1} y={y + 0.3} z={z0} w={1.8} d={1.4} h={1.9} color={body} u={U} ink={ink} />);
    // striped awning on the front edge
    out.push(
      <g key="awn">
        {Array.from({ length: 6 }, (_, i) => (
          <polygon key={i} points={poly([[x + 0.05 + i * 0.32, y + 1.7, z0 + 2.1], [x + 0.37 + i * 0.32, y + 1.7, z0 + 2.1], [x + 0.37 + i * 0.32, y + 2.15, z0 + 1.7], [x + 0.05 + i * 0.32, y + 2.15, z0 + 1.7]])} fill={i % 2 ? p.body : p.pop} stroke={INK} strokeWidth="1" />
        ))}
      </g>,
    );
    out.push(
      <LeftFace key="scr" x={x + 0.35} y={y + 1.71} z={z0 + 1.55}>
        <Screen kind={kind} w={1.3 * U} h={1.35 * U} p={p} id="an-shop" />
      </LeftFace>,
    );
  }
  return <g>{out}</g>;
}

function Pine({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: P }) {
  const [cx] = S([x, y, 0]);
  const tier = (base: number, r: number, hh: number, k: number) => {
    const by = S([x, y, base])[1];
    const rx = r * U * 1.22;
    const ry = r * U * 0.7;
    const top = by - hh * U;
    const dark = shade(p.moss, -0.35);
    return (
      <g key={k}>
        <path d={`M${cx - rx},${by} A${rx},${ry} 0 0 0 ${cx + rx},${by} L${cx},${top} Z`} fill={dark} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <path d={`M${cx},${top} L${cx + rx},${by} A${rx},${ry} 0 0 1 ${cx + rx * 0.2},${by + ry * 0.95} Z`} fill={shade(p.moss, -0.12)} opacity="0.9" />
      </g>
    );
  };
  return (
    <g>
      <ellipse cx={cx + 0.5 * U * s} cy={S([x, y, 0])[1] + 0.3 * U} rx={0.9 * U * s} ry={0.4 * U * s} fill="#020604" opacity="0.35" filter="url(#an-blur)" />
      <IsoCylinder x={x} y={y} r={0.1 * s} h={0.6 * s} color="#4A3628" u={U} ink={ink} />
      {tier(0.4 * s, 0.75 * s, 1.4 * s, 0)}
      {tier(1.1 * s, 0.58 * s, 1.2 * s, 1)}
      {tier(1.75 * s, 0.4 * s, 1.0 * s, 2)}
    </g>
  );
}

function Mushroom({ x, y, s = 1, p, seed }: { x: number; y: number; s?: number; p: P; seed: number }) {
  const [cx, cy] = S([x, y, 0]);
  const h = 16 * s;
  const r = 9 * s;
  return (
    <g>
      <ellipse cx={cx} cy={cy - h} rx={r * 2.4} ry={r * 1.6} fill={p.glow} opacity="0.25" filter="url(#an-glow)">
        <animate attributeName="opacity" values="0.15;0.4;0.15" dur="4s" begin={`-${(seed % 4).toFixed(2)}s`} repeatCount="indefinite" />
      </ellipse>
      <rect x={cx - 2 * s} y={cy - h} width={4 * s} height={h} rx={2 * s} fill="#EAF2DC" stroke={INK} strokeWidth="0.8" />
      <path d={`M${cx - r},${cy - h + 1} A${r},${r * 0.8} 0 0 1 ${cx + r},${cy - h + 1} Z`} fill={p.glow} stroke={INK} strokeWidth="0.8" />
      <circle cx={cx - r * 0.35} cy={cy - h - r * 0.35} r={1.3 * s} fill="#ffffff" opacity="0.8" />
    </g>
  );
}

function Fern({ x, y, p }: { x: number; y: number; p: P }) {
  const [cx, cy] = S([x, y, 0]);
  return (
    <g stroke={shade(p.fern, 0.1)} strokeWidth="2" strokeLinecap="round" fill="none">
      {[-50, -25, 0, 25, 50].map((a, i) => {
        const r = (Math.PI * (a - 90)) / 180;
        const l = 16 - Math.abs(a) * 0.08;
        return <path key={i} d={`M${cx},${cy} q${Math.cos(r) * l * 0.4},${Math.sin(r) * l * 0.9} ${Math.cos(r) * l},${Math.sin(r) * l}`} />;
      })}
    </g>
  );
}

/** A curved ground-level thread between two world points (screen space path). */
function threadPath(a: P3, b: P3, bend: number) {
  const [x1, y1] = S(a);
  const [x2, y2] = S(b);
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
  const my = (y1 + y2) / 2 + (x2 - x1) * bend;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

const PODS: Pod[] = [
  { kind: 'billboard', x: 1.2, y: 0.6 },
  { kind: 'tv', x: 10.8, y: 0.6 },
  { kind: 'search', x: 0.6, y: 10.6 },
  { kind: 'feed', x: 11.4, y: 5.8 },
  { kind: 'video', x: 5.8, y: 11.4 },
  { kind: 'shop', x: 10.8, y: 10.8 },
];
const HUB: P3 = [7.2, 8.4, 0.03];

export default function AgentNetwork(p: P) {
  const night = !/^#[9a-fA-F]/.test(p.skyTop);
  const threads = PODS.map((pod, i) => threadPath(HUB, [pod.x + 1, pod.y + (pod.kind === 'shop' || pod.kind === 'video' ? 0.3 : 1.9), 0.03], i % 2 ? 0.18 : -0.18));
  const [hubX, hubY] = S(HUB);
  const [antX, antY] = S([7.9, 6.4, 3.05]);
  const [badgeX, badgeY] = S([7, 7, 5.1]);
  const badgeW = 44 + (p.badge.length + 2) * 11.5; // Silkscreen 13px ≈ 11.5px per glyph incl. tracking
  const sorted = [...PODS].sort((a, b) => a.x + a.y - (b.x + b.y));
  const back = sorted.filter((q) => q.x + q.y < 12);
  const front = sorted.filter((q) => q.x + q.y >= 12);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="an-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <linearGradient id="an-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.skyBottom, -0.55)} />
          <stop offset="1" stopColor={shade(p.skyTop, -0.4)} />
        </linearGradient>
        <radialGradient id="an-halo">
          <stop offset="0" stopColor="#F4F7E0" stopOpacity="0.5" />
          <stop offset="0.35" stopColor="#F4F7E0" stopOpacity="0.15" />
          <stop offset="1" stopColor="#F4F7E0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="an-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="an-fog">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.14" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <pattern id="an-scan" width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="#000" opacity="0.35" />
        </pattern>
        <filter id="an-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="an-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="an-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height="900" fill="url(#an-sky)" />
      {night &&
        Array.from({ length: 80 }, (_, i) => {
          const dur = [2, 4, 8][i % 3];
          return (
            <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 420} r={0.5 + rand(i * 1.3) * 1.4} fill="#F4F7E0">
              <animate attributeName="opacity" values="0.15;0.9;0.15" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      <circle cx="1010" cy="130" r="150" fill="url(#an-halo)" />
      <circle cx="1010" cy="130" r="46" fill={night ? '#F1F5DC' : '#FFFBEA'} />
      <circle cx="996" cy="118" r="8" fill="#DCE2C2" opacity="0.7" />
      <circle cx="1024" cy="146" r="5" fill="#DCE2C2" opacity="0.7" />
      {/* a satellite (the agent's uplink) crossing the sky */}
      <g>
        <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path="M120,90 C360,40 700,60 1180,40" />
        <rect x="-5" y="-3" width="10" height="6" fill="#C9D1BE" />
        <rect x="-17" y="-2" width="10" height="4" fill={p.fern} />
        <rect x="7" y="-2" width="10" height="4" fill={p.fern} />
        <circle r="2" cy="-5" fill={p.pop}>
          <animate attributeName="opacity" values="1;0.1;1" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>
      {/* distant pine ridge */}
      <g fill={shade(p.skyBottom, -0.35)} opacity="0.85">
        <rect x="0" y="470" width="1200" height="430" />
        {Array.from({ length: 46 }, (_, i) => {
          const x = i * 27 + rand(i * 2.7) * 14;
          const h = 40 + rand(i * 4.3) * 70;
          return <polygon key={i} points={`${x - 16},472 ${x},${472 - h} ${x + 16},472`} />;
        })}
      </g>
      <g fill={shade(p.skyBottom, -0.55)}>
        <rect x="0" y="540" width="1200" height="360" />
        {Array.from({ length: 34 }, (_, i) => {
          const x = i * 37 + rand(i * 9.1) * 18;
          const h = 50 + rand(i * 6.1) * 80;
          return <polygon key={i} points={`${x - 22},542 ${x},${542 - h} ${x + 22},542`} />;
        })}
      </g>
      {/* forest floor falls away into darkness below the ridge */}
      <rect x="0" y="540" width="1200" height="360" fill="url(#an-floor)" />
      <ellipse cx="600" cy="560" rx="620" ry="120" fill="url(#an-fog)">
        <animate attributeName="rx" values="600;660;600" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
      </ellipse>

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── Slab: moss on top, soil cutaway with glowing mycelium ── */}
        <IsoBox x={0} y={0} z={-1.9} w={14} d={14} h={1.6} color={p.soil} u={U} top={false} ink={ink} />
        <IsoBox x={0} y={0} z={-0.3} w={14} d={14} h={0.3} color={p.moss} u={U} ink={ink} />
        {/* soil strata */}
        {[-0.75, -1.25].map((zz) => (
          <g key={zz} stroke={shade(p.soil, -0.35)} strokeWidth="1" fill="none" opacity="0.8">
            <polyline points={poly([[0, 14, zz], [14, 14, zz], [14, 0, zz]])} />
          </g>
        ))}
        {/* hyphae in the soil (left face y = 14, right face x = 14) */}
        <g stroke={p.glow} strokeWidth="1.4" fill="none" strokeLinecap="round">
          {Array.from({ length: 9 }, (_, i) => {
            // organic root: 6 jittered points descending, different per face
            const a0 = 0.8 + i * 1.5 + rand(i * 2.9) * 0.5;
            const steps = Array.from({ length: 6 }, (_, k) => ({ z: -0.32 - k * 0.27 - rand(i * 7 + k) * 0.08, da: (rand(i * 13 + k * 3) - 0.5) * 0.9 }));
            let la = a0;
            let ra = a0 + 0.3;
            const left = poly(steps.map((s) => [(la += s.da), 14, s.z] as P3));
            const right = poly(steps.map((s, k) => [14, (ra -= s.da * (k % 2 ? 1 : -0.6)), s.z] as P3));
            return (
              <g key={i} opacity="0.55">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" begin={`-${(i * 0.45).toFixed(2)}s`} repeatCount="indefinite" />
                <polyline points={left} />
                <polyline points={right} />
              </g>
            );
          })}
        </g>
        <g fill={p.glow}>
          {Array.from({ length: 14 }, (_, i) => {
            const [nx, ny] = i % 2 ? S([0.6 + rand(i) * 13, 14, -0.4 - rand(i + 9) * 1.3]) : S([14, 0.6 + rand(i) * 13, -0.4 - rand(i + 9) * 1.3]);
            return (
              <circle key={i} cx={nx} cy={ny} r="2.2">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin={`-${(rand(i * 3) * 2).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </g>
        {/* moss texture */}
        <g fill={shade(p.moss, 0.12)} opacity="0.6">
          {Array.from({ length: 70 }, (_, i) => {
            const [mx, my] = S([0.4 + rand(i * 1.7) * 13.2, 0.4 + rand(i * 4.9) * 13.2, 0]);
            return <ellipse key={i} cx={mx} cy={my} rx={3 + rand(i) * 5} ry={1.5 + rand(i) * 2} />;
          })}
        </g>
        <g fill={shade(p.moss, -0.2)} opacity="0.5">
          {Array.from({ length: 40 }, (_, i) => {
            const [mx, my] = S([0.4 + rand(i * 2.3 + 50) * 13.2, 0.4 + rand(i * 5.3 + 50) * 13.2, 0]);
            return <ellipse key={i} cx={mx} cy={my} rx={4 + rand(i + 2) * 6} ry={2 + rand(i + 2) * 2} />;
          })}
        </g>

        {/* ── Threads: glowing hyphae from the agent to every platform, carrying ad packets ── */}
        {threads.map((d, i) => (
          <g key={i}>
            <path d={d} stroke={p.glow} strokeOpacity="0.22" strokeWidth="9" fill="none" filter="url(#an-soft)" />
            <path d={d} stroke={p.fern} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d={d} stroke={p.glow} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeDasharray="10 7">
              <animate attributeName="stroke-dashoffset" values="34;0" dur="1s" repeatCount="indefinite" />
            </path>
            <path d={d} stroke="#ffffff" strokeWidth="2.6" fill="none" opacity="0">
              <animate attributeName="opacity" values={hitFlash} keyTimes={hitTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
            </path>
            {[0, 1].map((k) => (
              <circle key={k} r="4" fill={p.glow} stroke="#ffffff" strokeWidth="1">
                <animateMotion dur="2s" begin={`-${((i * 0.37 + k) % 2).toFixed(2)}s`} repeatCount="indefinite" path={d} />
              </circle>
            ))}
            {/* results flowing back to the agent */}
            <rect x="-3" y="-3" width="6" height="6" fill={p.pop}>
              <animateMotion dur="4s" begin={`-${(i * 0.71).toFixed(2)}s`} repeatCount="indefinite" path={d} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
            </rect>
          </g>
        ))}
        {/* side branches off the main threads */}
        <g stroke={p.fern} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.8">
          {Array.from({ length: 22 }, (_, i) => {
            const [bx, by] = S([1 + rand(i * 7.1) * 12, 1 + rand(i * 3.3) * 12, 0.02]);
            const a = rand(i * 1.1) * Math.PI * 2;
            return <path key={i} d={`M${bx},${by} q${Math.cos(a) * 10},${Math.sin(a) * 4} ${Math.cos(a + 0.6) * 20},${Math.sin(a + 0.6) * 9}`} />;
          })}
        </g>

        {/* launch ripple */}
        <ellipse cx={hubX} cy={hubY} rx="20" ry="10" fill="none" stroke={p.glow} strokeWidth="3" opacity="0">
          <animate attributeName="rx" values={`20;20;20;300;300`} keyTimes={`0;${HIT};${HIT + 0.001};${HIT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values={`10;10;10;150;150`} keyTimes={`0;${HIT};${HIT + 0.001};${HIT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={`0;${HIT};${HIT + 0.001};${HIT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>

        {/* ── Back kiosks + scenery ── */}
        <Pine x={6.6} y={0.8} s={1.05} p={p} />
        <Pine x={0.9} y={6.4} s={0.9} p={p} />
        {back.map((pod) => (
          <g key={pod.kind}>
            <Shadow x={pod.x} y={pod.y} w={2} d={2} h={2.4} />
            <Kiosk pod={pod} p={p} />
          </g>
        ))}
        <Mushroom x={4.4} y={2.6} p={p} seed={1} />
        <Mushroom x={4.9} y={2.9} s={0.7} p={p} seed={2} />
        <Fern x={3.2} y={4.4} p={p} />
        <Fern x={9.6} y={3.2} p={p} />

        {/* ── Agent console (centre) ── */}
        <ellipse cx={S([7.2, 8.2, 0])[0]} cy={S([7.2, 8.2, 0])[1]} rx={3.4 * U} ry={1.7 * U} fill="url(#an-pool)">
          <animate attributeName="opacity" values="0.75;1;0.75" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <Shadow x={5.8} y={5.6} w={2.8} d={2.4} h={3} />
        <IsoBox x={5.6} y={5.4} w={3.2} d={2.8} h={0.35} color={shade(p.body, -0.3)} u={U} ink={ink} />
        <IsoBox x={5.9} y={5.6} z={0.35} w={2.6} d={2.2} h={2.3} color={p.body} u={U} ink={ink} />
        {/* bezel + CRT screen on the front-left face */}
        <LeftFace x={6.05} y={7.8} z={2.45}>
          <rect x="0" y="0" width={2.3 * U} height={1.65 * U} rx="6" fill={shade(p.body, -0.45)} />
          <rect x={4} y={4} width={2.3 * U - 8} height={1.65 * U - 8} rx="4" fill={p.screen} />
          <text x="9" y="22" fontFamily="'VT323',monospace" fontSize="15" fill={p.glow}>
            {'> '}
            {p.prompt.length > 12 ? p.prompt.slice(0, 11) + '…' : p.prompt}
          </text>
          <text x="9" y="38" fontFamily="'VT323',monospace" fontSize="13" fill={p.glow} opacity="0.75">✓ meta ✓ google</text>
          <text x="9" y="52" fontFamily="'VT323',monospace" fontSize="13" fill={p.glow} opacity="0.75">✓ tiktok ✓ +29</text>
          <rect x="9" y="57" width="7" height="10" fill={p.glow}>
            <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite" calcMode="discrete" />
          </rect>
          <rect x={4} y={4} width={2.3 * U - 8} height={1.65 * U - 8} rx="4" fill="url(#an-scan)" opacity="0.6" />
          <rect x={4} y={4} width={2.3 * U - 8} height={1.65 * U - 8} rx="4" fill={p.glow} opacity="0">
            <animate attributeName="opacity" values={hitFlash} keyTimes={hitTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
          </rect>
        </LeftFace>
        {/* vents on the right face */}
        <RightFace x={8.5} y={7.6} z={2.2}>
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={10} y={8 + i * 8} width={1.4 * U} height="3" rx="1.5" fill={shade(p.body, -0.4)} />
          ))}
          <circle cx={1.75 * U} cy={62} r="4" fill={p.glow}>
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </RightFace>
        {/* keyboard */}
        <IsoBox x={6.2} y={8.2} z={0.35} w={2.1} d={0.75} h={0.14} color={shade(p.body, -0.12)} u={U} ink={ink} />
        <g fill={shade(p.body, -0.38)}>
          {Array.from({ length: 12 }, (_, i) => (
            <polygon key={i} points={poly([[6.35 + (i % 6) * 0.32, 8.3 + Math.floor(i / 6) * 0.3, 0.5], [6.58 + (i % 6) * 0.32, 8.3 + Math.floor(i / 6) * 0.3, 0.5], [6.58 + (i % 6) * 0.32, 8.5 + Math.floor(i / 6) * 0.3, 0.5], [6.35 + (i % 6) * 0.32, 8.5 + Math.floor(i / 6) * 0.3, 0.5]])} />
          ))}
        </g>
        {/* antenna + live dot */}
        <line x1={antX} y1={antY + 6} x2={antX} y2={antY - 40} stroke="#4A4F45" strokeWidth="3" strokeLinecap="round" />
        <circle cx={antX} cy={antY - 44} r="11" fill={p.pop} opacity="0.35" filter="url(#an-glow)">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx={antX} cy={antY - 44} r="5.5" fill={p.pop} stroke={INK} strokeWidth="1" />
        {/* broadcast rings from the antenna */}
        {[0, 1].map((k) => (
          <circle key={k} cx={antX} cy={antY - 44} r="8" fill="none" stroke={p.pop} strokeWidth="1.5">
            <animate attributeName="r" values="8;46" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* ── Front kiosks + scenery ── */}
        <Pine x={12.9} y={13.0} s={0.8} p={p} />
        {front.map((pod) => (
          <g key={pod.kind}>
            <Shadow x={pod.x} y={pod.y} w={2} d={2} h={2.4} />
            <Kiosk pod={pod} p={p} />
          </g>
        ))}
        <Mushroom x={4.2} y={12.6} p={p} seed={3} />
        <Mushroom x={13.0} y={8.6} s={0.8} p={p} seed={0} />
        <Mushroom x={13.3} y={9.0} s={0.6} p={p} seed={2.5} />
        <Mushroom x={9.4} y={13.2} s={0.75} p={p} seed={1.5} />
        <Fern x={3.6} y={13.2} p={p} />
        <Fern x={13.3} y={4.2} p={p} />

        {/* launch badge pops above the console at the moment */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${HIT};${HIT + 0.02};${HIT + 0.3};${HIT + 0.36};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values={`0 14;0 14;0 0;0 -6;0 -6`} keyTimes={`0;${HIT};${HIT + 0.04};${HIT + 0.36};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <rect x={badgeX - badgeW / 2} y={badgeY - 20} width={badgeW} height="34" rx="5" fill={p.glow} stroke={INK} strokeWidth="1.2" />
          <polygon points={`${badgeX - 7},${badgeY + 14} ${badgeX + 7},${badgeY + 14} ${badgeX},${badgeY + 22}`} fill={p.glow} />
          <text x={badgeX} y={badgeY + 4} textAnchor="middle" fontFamily="'Silkscreen',monospace" fontSize="13" letterSpacing="1.5" fill={p.screen}>
            ✓ {p.badge}
          </text>
        </g>
      </g>

      {/* fireflies */}
      {p.fireflies &&
        Array.from({ length: 16 }, (_, i) => {
          const x = 140 + rand(i * 4.4) * 920;
          const y = 260 + rand(i * 8.2) * 500;
          const dx = (rand(i * 2.2) - 0.5) * 60;
          const dy = (rand(i * 6.6) - 0.5) * 40;
          return (
            <g key={i}>
              <animateTransform attributeName="transform" type="translate" values={`0 0;${dx.toFixed(1)} ${dy.toFixed(1)};0 0`} dur={i % 2 ? '8s' : '4s'} begin={`-${(rand(i) * 4).toFixed(2)}s`} repeatCount="indefinite" {...spline} />
              <circle cx={x} cy={y} r="6" fill={p.glow} opacity="0.3" filter="url(#an-soft)">
                <animate attributeName="opacity" values="0;0.45;0" dur="2s" begin={`-${(rand(i * 9) * 2).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={x} cy={y} r="1.8" fill="#F4FFD6">
                <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`-${(rand(i * 9) * 2).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
    </svg>
  );
}
