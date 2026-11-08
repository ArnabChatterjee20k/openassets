import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Seabed Dispatch',
  description:
    'Landing-page hero for Lanternfish, the AI ad agent: an isometric seabed where a little submersible tours six platform beacons (Meta, TikTok, Search, CTV…), switching each one on as it passes, while the hub sends a sonar ping that lights them all. Kelp sways, bubbles rise, marine snow falls. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'deep sea', 'animated svg', 'ads', 'agent'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Hub sign').default('LANTERNFISH'),
  platforms: text('Beacon labels (comma separated, 6)').default('META, TIKTOK, SEARCH, CTV, REDDIT, RETAIL'),
  waterTop: color('Water top').default('#0A4A5E'),
  waterBottom: color('Water bottom').default('#021B26'),
  sand: color('Seabed').default('#3D6470'),
  rock: color('Rock').default('#1E3F4C'),
  hull: color('Sub & hub').default('#E6FFFA'),
  glow: color('Photophore glow').default('#2EF2C4'),
  sonar: color('Sonar').default('#1B7FA6'),
  pop: color('Coral & lamp').default('#FF7A59'),
  kelp: color('Kelp').default('#0F6B5A'),
  snow: toggle('Marine snow').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  shallows: { waterTop: '#8FE3EE', waterBottom: '#1B8FB0', sand: '#E9D8B4', rock: '#7E9AA0', kelp: '#2F9E6A', glow: '#00C79A', sonar: '#0B6E8F', snow: false },
  dusk: { waterTop: '#4A2C55', waterBottom: '#170D24', sand: '#5B3D5E', rock: '#352238', kelp: '#7A3B5C', glow: '#FF8E5E', sonar: '#E5487A', pop: '#FFD27F', hull: '#FFE9D6' },
  ultraviolet: { waterTop: '#2A0B4A', waterBottom: '#0A0014', sand: '#3A1E5C', rock: '#24103A', kelp: '#5B1A8C', glow: '#FF2E88', sonar: '#B026FF', pop: '#FFD600', hull: '#FBEFFF' },
  gold: { waterTop: '#2A2620', waterBottom: '#0D0D0F', sand: '#4A4234', rock: '#2A2620', kelp: '#6E6A62', glow: '#E8D9B5', sonar: '#C9A45C', pop: '#C9A45C', hull: '#F3EDE2' },
};

type P = z.infer<typeof schema>;

const U = 38;
const LOOP = scene.loop;
const OX = 600;
const OY = 255;
const INK = 'rgba(2,14,20,0.6)';
const W = 14; // seabed size in world units
const HUB: [number, number] = [7, 7];
const ROUTE_R = 4.7;
const ROUTE_Z = 3.4;
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

/** World → screen inside the world group (which is translated by OX, OY, like the kit primitives). */
const S = (p: P3): [number, number] => iso(p, U);
const poly = (ps: P3[]) => ps.map((q) => S(q).map((v) => v.toFixed(1)).join(',')).join(' ');
const D = (deg: number) => (deg * Math.PI) / 180;
/** Route angle at loop fraction t: front half (moving screen-right) first, then the back half. */
const routeAngle = (t: number) => D(135 - 360 * t);
const routePt = (t: number, z: number): P3 => [HUB[0] + ROUTE_R * Math.cos(routeAngle(t)), HUB[1] + ROUTE_R * Math.sin(routeAngle(t)), z];
const routePath = (z: number) => {
  const n = 72;
  return Array.from({ length: n + 1 }, (_, i) => {
    const [x, y] = S(routePt(i / n, z));
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
};
/** Pods sit under the route; each is visited at fraction FRACS[i] of the loop. */
const FRACS = Array.from({ length: 6 }, (_, i) => i / 6 + 1 / 12);

function Pod({ i, label, p }: { i: number; label: string; p: P }) {
  const f = FRACS[i];
  const [x, y] = routePt(f, 0).slice(0, 2) as [number, number];
  const [lx, ly] = S([x, y, 1.05]);
  const [sx, sy] = S([x + 0.9, y - 0.4, 0]);
  const rx = 0.5 * U * 1.2247;
  const ry = 0.5 * U * 0.7071;
  const k = (v: number) => Math.min(0.999, Math.max(0.001, v)).toFixed(3);
  return (
    <g>
      {/* glow pool on the sand */}
      <ellipse cx={S([x, y, 0])[0]} cy={S([x, y, 0])[1]} rx={rx * 2.6} ry={ry * 2.6} fill="url(#sd-pool)" opacity="0.7">
        <animate attributeName="opacity" values="0.55;0.55;1;0.55;0.55" keyTimes={`0;${k(f - 0.03)};${k(f)};${k(f + 0.12)};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
      </ellipse>
      <IsoCylinder x={x} y={y} r={0.62} h={0.32} color={shade(p.rock, 0.25)} u={U} ink={{ stroke: INK }} />
      <IsoCylinder x={x} y={y} z={0.32} r={0.38} h={0.5} color={p.hull} u={U} ink={{ stroke: INK }} />
      {/* lamp: steady glow + flare as the sub passes + flash on the ping */}
      <circle cx={lx} cy={ly} r="15" fill={p.glow} opacity="0.35" filter="url(#sd-glow)" />
      <circle cx={lx} cy={ly} r="7.5" fill={p.glow} stroke={INK} strokeWidth="1" />
      <circle cx={lx - 2} cy={ly - 2} r="2.4" fill="#ffffff" opacity="0.8" />
      <circle cx={lx} cy={ly} r="26" fill={p.glow} opacity="0" filter="url(#sd-glow)">
        <animate attributeName="opacity" values="0;0;0.9;0.15;0" keyTimes={`0;${k(f - 0.02)};${k(f + 0.01)};${k(f + 0.1)};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
      </circle>
      <circle cx={lx} cy={ly} r="34" fill="#ffffff" opacity="0" filter="url(#sd-glow)">
        <animate attributeName="opacity" values="0;0;0.7;0;0" keyTimes="0;0.5;0.52;0.62;1" dur={`${LOOP}s`} repeatCount="indefinite" />
      </circle>
      {/* label flag on a little post */}
      <line x1={sx} y1={sy} x2={sx} y2={sy - 46} stroke={shade(p.hull, -0.4)} strokeWidth="1.6" />
      <g transform={`translate(${sx} ${sy - 46})`}>
        <rect x={0} y={-12} width={label.length * 10.2 + 18} height={24} rx={5} fill={shade(p.rock, -0.35)} stroke={p.glow} strokeOpacity="0.7" strokeWidth="1.2" />
        <text x={9} y={5} fontFamily={FONTS.familjen} fontWeight={700} fontSize="13.5" letterSpacing="1.4" fill={p.hull}>
          {label}
        </text>
      </g>
    </g>
  );
}

function Hub({ p }: { p: P }) {
  const [x, y] = HUB;
  const [dx, dy] = S([x, y, 1.3]);
  const domeRx = 1.15 * U * 1.2247;
  const domeRy = 1.15 * U * 0.7071;
  const [ax, ay] = S([x, y, 3.0]);
  const [sx, sy] = S([x + 1.55, y + 0.2, 0.55]);
  return (
    <g>
      <IsoBox x={x - 1.7} y={y - 1.7} w={3.4} d={3.4} h={0.3} color={shade(p.rock, 0.2)} u={U} ink={{ stroke: INK }} />
      <IsoCylinder x={x} y={y} z={0.3} r={1.25} h={1.0} color={shade(p.hull, -0.08)} u={U} ink={{ stroke: INK }} />
      {/* ring of portholes (flicker) */}
      {[-0.95, -0.45, 0.05, 0.55, 0.95].map((o, i) => {
        const [wx, wy] = S([x + 1.25 * Math.cos(D(45 + o * 50)), y + 1.25 * Math.sin(D(45 + o * 50)), 0.78]);
        return (
          <circle key={i} cx={wx} cy={wy} r="5" fill={p.glow} stroke={shade(p.hull, -0.5)} strokeWidth="1.5">
            <Flicker dur={LOOP} seed={i + 3} low={0.55} />
          </circle>
        );
      })}
      {/* glass dome */}
      <path d={`M${dx - domeRx},${dy} A${domeRx},${domeRy * 2.3} 0 0 1 ${dx + domeRx},${dy} A${domeRx},${domeRy} 0 0 1 ${dx - domeRx},${dy} Z`} fill="url(#sd-dome)" stroke={INK} strokeWidth="1.2" />
      <path d={`M${dx - domeRx * 0.6},${dy - domeRy * 1.2} A${domeRx * 0.6},${domeRy * 1.4} 0 0 1 ${dx + domeRx * 0.1},${dy - domeRy * 2.1}`} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
      {/* the agent inside: a tiny lanternfish silhouette */}
      <g transform={`translate(${dx} ${dy - domeRy * 0.9})`}>
        <animateTransform attributeName="transform" type="translate" values={`${dx} ${dy - domeRy * 0.9};${dx + 3} ${dy - domeRy * 1.05};${dx} ${dy - domeRy * 0.9}`} dur="4s" repeatCount="indefinite" {...spline} />
        <g transform="scale(9)">
          <path d="M-1.05 0 L-1.45 -0.42 Q-1.32 0 -1.45 0.42 Z" fill={p.sonar} />
          <path d="M-1.1 0 C-0.8 -0.5 0.3 -0.62 0.82 -0.28 C1.06 -0.12 1.06 0.12 0.82 0.28 C0.3 0.62 -0.8 0.5 -1.1 0 Z" fill={p.sonar} />
          <circle cx={0.58} cy={-0.08} r={0.13} fill="#ffffff" />
          {[0.4, 0.1, -0.2, -0.5].map((cx, i) => (
            <circle key={i} cx={cx} cy={0.22} r={0.07} fill={p.glow} />
          ))}
        </g>
      </g>
      {/* antenna mast + blinking tip */}
      <line x1={dx} y1={dy - domeRy * 2.3} x2={ax} y2={ay} stroke={shade(p.hull, -0.45)} strokeWidth="2.4" />
      <circle cx={ax} cy={ay} r="4" fill={p.pop}>
        <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx={ax} cy={ay} r="10" fill={p.pop} opacity="0.3" filter="url(#sd-glow)">
        <animate attributeName="r" values="6;14;6" dur="1s" repeatCount="indefinite" />
      </circle>
      {/* sign plate on the plinth, in the right-face plane */}
      <g transform={`matrix(0.866 -0.5 0 1 ${sx} ${sy})`}>
        <rect x={-6} y={-19} width={p.sign.length * 11.5 + 16} height={26} rx={3} fill={shade(p.rock, -0.4)} stroke={p.glow} strokeOpacity="0.8" />
        <text x={2} y={0} fontFamily={FONTS.bodoni} fontStyle="italic" fontSize="18" letterSpacing="1.5" fill={p.glow}>
          {p.sign}
        </text>
      </g>
    </g>
  );
}

function Kelp({ x, y, h, p, seed }: { x: number; y: number; h: number; p: P; seed: number }) {
  const [bx, by] = S([x, y, 0]);
  const top = by - h * U;
  const sway = 3 + (seed % 3);
  const d = `M${bx},${by} C${bx - 14},${by - h * U * 0.3} ${bx + 14},${by - h * U * 0.6} ${bx - 4},${top}`;
  return (
    <g>
      <animateTransform attributeName="transform" type="rotate" values={`${-sway} ${bx} ${by};${sway} ${bx} ${by};${-sway} ${bx} ${by}`} dur="4s" begin={`-${(seed * 0.7) % 4}s`} repeatCount="indefinite" {...spline} />
      <path d={d} fill="none" stroke={shade(p.kelp, -0.35)} strokeWidth="7" strokeLinecap="round" />
      <path d={d} fill="none" stroke={p.kelp} strokeWidth="4" strokeLinecap="round" />
      {[0.25, 0.45, 0.65, 0.85].map((t, i) => {
        const yy = by - h * U * t;
        const side = i % 2 ? 1 : -1;
        return <ellipse key={i} cx={bx + side * 9 + (t - 0.5) * 6} cy={yy} rx="10" ry="4" fill={shade(p.kelp, 0.12)} stroke={shade(p.kelp, -0.4)} strokeWidth="0.8" transform={`rotate(${side * -30} ${bx + side * 9} ${yy})`} />;
      })}
    </g>
  );
}

/** Branching sea-fan coral on a rock mound: a trunk that forks twice, with bulb tips. */
function Coral({ x, y, p, s = 1 }: { x: number; y: number; p: P; s?: number }) {
  const [bx, by] = S([x, y, 0]);
  const segs: ReactNode[] = [];
  const tips: [number, number][] = [];
  const grow = (x0: number, y0: number, ang: number, len: number, w: number, depth: number, k: number) => {
    const x1 = x0 + Math.sin(ang) * len;
    const y1 = y0 - Math.cos(ang) * len;
    segs.push(<line key={`${depth}-${k}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke={p.pop} strokeWidth={w} strokeLinecap="round" />);
    if (depth === 0) {
      tips.push([x1, y1]);
      return;
    }
    grow(x1, y1, ang - 0.42, len * 0.72, w * 0.72, depth - 1, k * 2);
    grow(x1, y1, ang + 0.42, len * 0.72, w * 0.72, depth - 1, k * 2 + 1);
  };
  grow(0, 0, -0.12, 16, 6, 2, 1);
  grow(0, 0, 0.5, 12, 5, 1, 9);
  return (
    <g transform={`translate(${bx} ${by}) scale(${s})`}>
      <ellipse cx={4} cy={3} rx="20" ry="7" fill="#000" opacity="0.28" />
      <path d="M-14,2 C-12,-8 12,-8 15,2 Z" fill={p.rock} stroke={INK} strokeWidth="1" />
      {segs}
      {tips.map(([tx, ty], i) => (
        <circle key={i} cx={tx} cy={ty} r="3.4" fill={shade(p.pop, 0.3)} />
      ))}
    </g>
  );
}

function Urchin({ x, y, p }: { x: number; y: number; p: P }) {
  const [bx, by] = S([x, y, 0]);
  return (
    <g>
      <ellipse cx={bx} cy={by + 2} rx="10" ry="4" fill="#000" opacity="0.3" />
      {Array.from({ length: 14 }, (_, i) => {
        const a = Math.PI + (i / 13) * Math.PI;
        return <line key={i} x1={bx} y1={by - 4} x2={bx + Math.cos(a) * 13} y2={by - 4 + Math.sin(a) * 11} stroke={shade(p.sonar, -0.5)} strokeWidth="1.4" strokeLinecap="round" />;
      })}
      <ellipse cx={bx} cy={by - 3} rx="7" ry="5" fill={shade(p.sonar, -0.35)} stroke={INK} strokeWidth="1" />
    </g>
  );
}

function Star({ x, y, p, r = 0 }: { x: number; y: number; p: P; r?: number }) {
  const [bx, by] = S([x, y, 0.02]);
  const pts5 = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + r;
    const rr = i % 2 ? 3.5 : 10;
    return `${(bx + Math.cos(a) * rr).toFixed(1)},${(by + Math.sin(a) * rr * 0.58).toFixed(1)}`;
  }).join(' ');
  return <polygon points={pts5} fill={shade(p.pop, 0.15)} stroke={shade(p.pop, -0.4)} strokeWidth="1" strokeLinejoin="round" />;
}

function Boulder({ x, y, r, p }: { x: number; y: number; r: number; p: P }) {
  const [bx, by] = S([x, y, 0]);
  const w = r * U * 1.2;
  return (
    <g>
      <ellipse cx={bx + w * 0.3} cy={by + 3} rx={w * 1.1} ry={w * 0.4} fill="#000" opacity="0.28" filter="url(#sd-blur)" />
      <path d={`M${bx - w},${by} C${bx - w},${by - w * 0.9} ${bx - w * 0.2},${by - w * 1.1} ${bx + w * 0.3},${by - w * 0.85} C${bx + w},${by - w * 0.6} ${bx + w},${by - w * 0.1} ${bx + w * 0.8},${by + w * 0.1} C${bx + w * 0.2},${by + w * 0.35} ${bx - w * 0.6},${by + w * 0.3} ${bx - w},${by} Z`} fill={p.rock} stroke={INK} strokeWidth="1.2" />
      <path d={`M${bx - w * 0.7},${by - w * 0.5} C${bx - w * 0.4},${by - w * 0.95} ${bx + w * 0.1},${by - w * 0.95} ${bx + w * 0.35},${by - w * 0.7}`} fill="none" stroke={shade(p.rock, 0.3)} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Sub({ p }: { p: P }) {
  // Drawn facing +x (screen right), centred on (0, 0).
  return (
    <g>
      {/* headlamp beam */}
      <polygon points="30,-2 190,-46 190,52" fill="url(#sd-beam)">
        <animate attributeName="opacity" values="0.9;0.7;0.9" dur="2s" repeatCount="indefinite" />
      </polygon>
      <ellipse cx="0" cy="0" rx="40" ry="17" fill="url(#sd-hull)" stroke={INK} strokeWidth="1.4" />
      <path d="M-30,6 C-10,14 18,14 34,6" fill="none" stroke={shade(p.hull, -0.3)} strokeWidth="1.5" />
      <rect x="-10" y="-28" width="24" height="14" rx="6" fill={shade(p.hull, -0.06)} stroke={INK} strokeWidth="1.2" />
      <line x1="6" y1="-28" x2="6" y2="-38" stroke={shade(p.hull, -0.5)} strokeWidth="2" />
      <line x1="6" y1="-38" x2="13" y2="-38" stroke={shade(p.hull, -0.5)} strokeWidth="2" strokeLinecap="round" />
      {[16, 2, -12].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy="-1" r="5.5" fill={shade(p.hull, -0.45)} />
          <circle cx={cx} cy="-1" r="3.8" fill={p.glow}>
            <animate attributeName="opacity" values="1;0.55;1" dur="1s" begin={`-${i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {/* stern fin + spinning prop (fake rotation by squashing) */}
      <path d="M-34,-4 L-46,-16 L-44,-2 Z" fill={shade(p.hull, -0.15)} stroke={INK} strokeWidth="1" />
      <path d="M-34,4 L-46,16 L-44,2 Z" fill={shade(p.hull, -0.15)} stroke={INK} strokeWidth="1" />
      <g transform="translate(-47 0)">
        <ellipse cx="0" cy="0" rx="3" ry="11" fill={shade(p.hull, -0.3)} stroke={INK} strokeWidth="1">
          <animate attributeName="ry" values="11;2;11" dur="0.5s" repeatCount="indefinite" />
        </ellipse>
      </g>
      {/* nose lamp: the coral spark */}
      <circle cx="38" cy="-2" r="4" fill={p.pop} />
      <circle cx="38" cy="-2" r="9" fill={p.pop} opacity="0.4" filter="url(#sd-glow)" />
    </g>
  );
}

function Jelly({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <g>
      <animateTransform attributeName="transform" type="translate" values={`${x} ${y};${x + 10} ${y - 34};${x} ${y}`} dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
      <g transform={`scale(${s})`}>
        {[-6, -2, 2, 6].map((tx, i) => (
          <path key={i} d={`M${tx},0 q${3 - i},8 0,16 t0,16`} fill="none" stroke={c} strokeOpacity="0.55" strokeWidth="1.2">
            <animate attributeName="d" values={`M${tx},0 q${3 - i},8 0,16 t0,16;M${tx},0 q${-3 + i},8 0,16 t0,16;M${tx},0 q${3 - i},8 0,16 t0,16`} dur="2s" repeatCount="indefinite" />
          </path>
        ))}
        <path d="M-10,0 C-10,-14 10,-14 10,0 Q5,3 0,0 Q-5,3 -10,0 Z" fill={c} fillOpacity="0.45" stroke={c} strokeWidth="1">
          <animateTransform attributeName="transform" type="scale" values="1 1;1.08 0.86;1 1" dur="2s" repeatCount="indefinite" />
        </path>
      </g>
    </g>
  );
}

function School({ p }: { p: P }) {
  const fish: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const ox = (i % 3) * 18 + rand(i * 3.3) * 8;
    const oy = Math.floor(i / 3) * 11 + rand(i * 7.1) * 5;
    fish.push(
      <g key={i} transform={`translate(${ox} ${oy})`}>
        <path d="M0,0 C4,-4 10,-4 13,0 C10,4 4,4 0,0 Z M0,0 L-5,-4 L-5,4 Z" fill={shade(p.hull, -0.25)} opacity="0.75" />
        <circle cx="9" cy="1" r="1.1" fill={p.glow} />
      </g>,
    );
  }
  return (
    <g>
      <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path="M-120,170 C200,120 520,210 820,150 S1150,120 1320,150" />
      {fish}
    </g>
  );
}

function Snow() {
  const out: ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const x = rand(i * 4.1) * 1200;
    const dur = [8, 4][i % 2];
    const fall = dur === 8 ? 260 : 150;
    const y0 = rand(i * 9.7) * 900;
    out.push(
      <circle key={i} cx={x} cy={y0} r={0.7 + rand(i * 1.9) * 1.6} fill="#ffffff" opacity={0.25 + rand(i * 2.7) * 0.4}>
        <animate attributeName="cy" values={`${y0 - fall / 2};${y0 + fall / 2}`} dur={`${dur}s`} begin={`-${(rand(i * 5.3) * dur).toFixed(2)}s`} repeatCount="indefinite" />
        <animate attributeName="cx" values={`${x};${x + 8};${x}`} dur="4s" begin={`-${(rand(i * 6.1) * 4).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

function Bubbles({ x, y, n, seed }: { x: number; y: number; n: number; seed: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const dur = i % 2 ? 4 : 2;
        const dx = (rand(seed + i * 3.1) - 0.5) * 16;
        const r = 2 + rand(seed + i * 1.7) * 3;
        return (
          <circle key={i} cx={x + dx} cy={y} r={r} fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2">
            <animate attributeName="cy" values={`${y};${y - 220}`} dur={`${dur}s`} begin={`-${((i / n) * dur).toFixed(2)}s`} repeatCount="indefinite" />
            <animate attributeName="cx" values={`${x + dx};${x + dx + 8};${x + dx - 6};${x + dx}`} dur={`${dur}s`} begin={`-${((i / n) * dur).toFixed(2)}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.75;1" dur={`${dur}s`} begin={`-${((i / n) * dur).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
    </g>
  );
}

export default function SeabedDispatch(p: P) {
  const labels = p.platforms.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  while (labels.length < 6) labels.push(`CH ${labels.length + 1}`);

  const [hx, hy] = S([HUB[0], HUB[1], 0.3]);
  const subPath = routePath(ROUTE_Z);
  const shadowPath = routePath(0.02);
  const cablePath = routePath(0.03) + ' Z';

  // Painter's order for seabed objects (smaller x + y drawn first).
  type Item = { k: number; node: ReactNode };
  const items: Item[] = [];
  FRACS.forEach((f, i) => {
    const [x, y] = routePt(f, 0);
    items.push({ k: x + y, node: <Pod key={`pod${i}`} i={i} label={labels[i]} p={p} /> });
  });
  items.push({ k: HUB[0] + HUB[1] + 1.5, node: <Hub key="hub" p={p} /> });
  ([[1.2, 3.2, 3.2, 1], [2.0, 2.2, 2.4, 2], [11.8, 2.4, 3.6, 3], [12.6, 3.4, 2.6, 4], [3.2, 12.4, 2.8, 5], [12.4, 11.0, 2.2, 6], [1.6, 9.6, 3.0, 7]] as const).forEach(([x, y, h, s]) =>
    items.push({ k: x + y, node: <Kelp key={`k${s}`} x={x} y={y} h={h} p={p} seed={s} /> }),
  );
  ([[10.6, 12.6, 1.1], [5.6, 1.4, 0.9], [12.8, 6.6, 1]] as const).forEach(([x, y, s], i) => items.push({ k: x + y, node: <Coral key={`c${i}`} x={x} y={y} p={p} s={s} /> }));
  ([[2.4, 5.6, 0.55], [9.8, 1.6, 0.45], [6.4, 12.8, 0.6], [12.8, 9.2, 0.4], [4.2, 1.4, 0.35]] as const).forEach(([x, y, r], i) => items.push({ k: x + y - 0.2, node: <Boulder key={`b${i}`} x={x} y={y} r={r} p={p} /> }));
  ([[8.6, 12.2], [1.4, 6.8], [11.2, 4.6]] as const).forEach(([x, y], i) => items.push({ k: x + y, node: <Urchin key={`u${i}`} x={x} y={y} p={p} /> }));
  ([[4.6, 11.4, 0.3], [12.2, 7.8, 1.1], [3.0, 4.2, 2]] as const).forEach(([x, y, r], i) => items.push({ k: x + y - 0.5, node: <Star key={`s${i}`} x={x} y={y} p={p} r={r} /> }));
  items.sort((a, b) => a.k - b.k);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="sd-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.waterTop} />
          <stop offset="0.75" stopColor={p.waterBottom} />
          <stop offset="1" stopColor={shade(p.waterBottom, -0.3)} />
        </linearGradient>
        <linearGradient id="sd-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sd-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sd-halo">
          <stop offset="0" stopColor={p.sonar} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.sonar} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sd-dome" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="0.5" stopColor={p.glow} stopOpacity="0.35" />
          <stop offset="1" stopColor={p.sonar} stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id="sd-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor={p.hull} />
          <stop offset="1" stopColor={shade(p.hull, -0.35)} />
        </linearGradient>
        <linearGradient id="sd-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </linearGradient>
        <filter id="sd-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="sd-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="sd-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* ── Water column ── */}
      <rect width="1200" height="900" fill="url(#sd-water)" />
      {[[180, 70], [420, 110], [690, 80], [930, 120]].map(([x, w], i) => (
        <polygon key={i} points={`${x},-10 ${x + w},-10 ${x + w * 2.6 + 120},760 ${x + 60},760`} fill="url(#sd-ray)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur={`${LOOP}s`} begin={`-${i * 2}s`} repeatCount="indefinite" {...spline} />
        </polygon>
      ))}
      <circle cx={hx + OX} cy={hy + OY - 40} r="460" fill="url(#sd-halo)" />
      {/* distant ridge silhouettes: a far range, then a nearer one */}
      <path d="M0,470 C110,430 190,455 290,420 C380,390 450,440 560,415 C660,392 720,430 820,405 C930,378 1020,420 1110,395 C1150,385 1180,392 1200,388 L1200,900 L0,900 Z" fill={shade(p.waterBottom, 0.12)} opacity="0.6" />
      <path d="M0,560 C140,520 230,545 340,515 C470,480 560,530 690,510 C820,490 900,525 1030,500 C1110,485 1160,495 1200,490 L1200,900 L0,900 Z" fill={shade(p.waterBottom, 0.05)} opacity="0.95" />
      <School p={p} />
      <Jelly x={1060} y={230} s={2.2} c={p.glow} />
      <Jelly x={130} y={300} s={1.4} c={p.sonar} />

      <g transform={`translate(${OX} ${OY})`}>
      {/* ── Seabed plateau ── */}
      <IsoBox x={0} y={0} z={-1.4} w={W} d={W} h={1.4} color={shade(p.rock, -0.1)} u={U} top={false} ink={{ stroke: INK }} />
      {/* rock strata on the slab sides */}
      {[-0.5, -1.0].map((z) => (
        <g key={z} stroke={shade(p.rock, -0.45)} strokeWidth="1" fill="none" opacity="0.7">
          <polyline points={poly([[0, W, z], [W, W, z]])} />
          <polyline points={poly([[W, 0, z], [W, W, z]])} />
        </g>
      ))}
      <polygon points={poly([[0, 0, 0], [W, 0, 0], [W, W, 0], [0, W, 0]])} fill={p.sand} stroke={INK} strokeWidth="1.2" />
      {/* sand ripples */}
      <g stroke={shade(p.sand, 0.14)} strokeWidth="1.2" fill="none" opacity="0.7">
        {Array.from({ length: 16 }, (_, i) => {
          const a = 0.8 + rand(i * 2.9) * 11;
          const b = 0.6 + rand(i * 5.3) * 12;
          return <path key={i} d={`M${S([a, b, 0]).join(',')} q10,-4 20,0 t20,0`} />;
        })}
      </g>
      {/* cable between beacons + data pulses running along it */}
      <path d={cablePath} fill="none" stroke={shade(p.sand, -0.4)} strokeWidth="3" />
      <path d={cablePath} fill="none" stroke={p.glow} strokeWidth="1.2" strokeDasharray="3 9" opacity="0.6" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} r="3.5" fill={p.glow} filter="url(#sd-glow)">
          <animateMotion dur="4s" begin={`-${i}s`} repeatCount="indefinite" path={cablePath} />
        </circle>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <circle key={`c${i}`} r="2" fill="#ffffff">
          <animateMotion dur="4s" begin={`-${i}s`} repeatCount="indefinite" path={cablePath} />
        </circle>
      ))}
      {/* sonar ping (the moment): a ring sweeping across the seabed at half-loop */}
      <ellipse cx={hx} cy={S([HUB[0], HUB[1], 0])[1]} rx="0" ry="0" fill="none" stroke={p.glow} strokeWidth="3" opacity="0">
        <animate attributeName="rx" values="0;0;48;560;560" keyTimes="0;0.499;0.5;0.68;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        <animate attributeName="ry" values="0;0;28;323;323" keyTimes="0;0.499;0.5;0.68;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.499;0.5;0.68;1" dur={`${LOOP}s`} repeatCount="indefinite" />
      </ellipse>
      {/* steady small pings from the hub every 2 s */}
      <ellipse cx={hx} cy={S([HUB[0], HUB[1], 0])[1]} rx="60" ry="35" fill="none" stroke={p.sonar} strokeWidth="1.5">
        <animate attributeName="rx" values="60;180" dur="2s" repeatCount="indefinite" />
        <animate attributeName="ry" values="35;104" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
      </ellipse>
      {/* sub's shadow on the sand */}
      <ellipse rx="34" ry="11" fill="#000" opacity="0.3" filter="url(#sd-blur)">
        <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path={shadowPath} />
      </ellipse>

      {items.map((it) => it.node)}

      <Bubbles x={hx + 30} y={hy - 120} n={6} seed={1} />
      <Bubbles x={S([11.8, 2.4, 0])[0]} y={S([11.8, 2.4, 0])[1] - 20} n={4} seed={7} />

      {/* ── The agent: a submersible on its route ── */}
      <g>
        <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path={subPath} />
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="2s" repeatCount="indefinite" {...spline} />
          <g>
            <animateTransform attributeName="transform" type="scale" values="1 1;-1 1" keyTimes="0;0.5" calcMode="discrete" dur={`${LOOP}s`} repeatCount="indefinite" />
            <g transform="scale(1.35)">
              <Sub p={p} />
            </g>
          </g>
        </g>
      </g>
      </g>

      {p.snow && <Snow />}

      {/* ping flash */}
      <rect width="1200" height="900" fill={p.glow} opacity="0">
        <animate attributeName="opacity" values="0;0;0.14;0;0" keyTimes="0;0.499;0.5;0.58;1" dur={`${LOOP}s`} repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
