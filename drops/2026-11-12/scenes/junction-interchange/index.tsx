import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Junction Interchange',
  description:
    'Landing-page hero for Junction, the AI ad agent: an isometric transit interchange where one brief leaves the central hall on three coloured lines to six platform stations (search, social, video, CTV, audio, retail). Trains shuttle, the departure board flips, the clock turns, a blimp drifts by, and on DISPATCH every train leaves at once and the stations light up in turn. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'network', 'transit', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  hub: text('Hall sign').default('JUNCTION'),
  board1: text('Board line 1').default('L1 SEARCH  ON TIME'),
  board2: text('Board line 2').default('L2 SOCIAL  BOARDING'),
  st1: text('Station: line 1 west').default('SEARCH'),
  st2: text('Station: line 1 east').default('VIDEO'),
  st3: text('Station: line 2 north').default('SOCIAL'),
  st4: text('Station: line 2 south').default('CTV'),
  st5: text('Station: line 3 west').default('AUDIO'),
  st6: text('Station: line 3 east').default('RETAIL'),
  skyTop: color('Sky top').default('#FFE3A3'),
  skyBottom: color('Sky bottom').default('#FFF8E1'),
  plaza: color('Plaza').default('#FFE9A8'),
  slab: color('Slab sides').default('#2E6B34'),
  walls: color('Walls').default('#FFF8E1'),
  ink: color('Ink').default('#1C2B1A'),
  line1: color('Line 1').default('#FF7A00'),
  line2: color('Line 2').default('#2BB24C'),
  line3: color('Line 3').default('#FF3D7F'),
  glow: color('Lamp light').default('#FFD45C'),
  tree: color('Trees').default('#3FA34D'),
  night: toggle('Night').default(false),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#5B2A55', skyBottom: '#FF9E6B', plaza: '#F6D7A7', slab: '#5A2E3E', walls: '#FFEBD6', tree: '#4F7A4A', glow: '#FFC46B' },
  'night line': { night: true, skyTop: '#07110B', skyBottom: '#1E3424', plaza: '#2A3D2C', slab: '#0E1A14', walls: '#D9E4CF', ink: '#0B120B', line1: '#FF9F43', line2: '#B5E550', glow: '#FFD45C', tree: '#2E5A36' },
  swiss: { skyTop: '#E6E6E1', skyBottom: '#F5F5F0', plaza: '#F5F5F0', slab: '#8C8C88', walls: '#FFFFFF', ink: '#0A0A0A', line1: '#E3000F', line2: '#0A0A0A', line3: '#8C8C88', tree: '#5C6B5A', glow: '#FFE07A' },
  blueprint: { night: true, skyTop: '#0A2C6B', skyBottom: '#134AA8', plaza: '#1B56B8', slab: '#0A2C6B', walls: '#EAF2FF', ink: '#061A40', line1: '#FFDD00', line2: '#7FB2FF', line3: '#FF7A9C', tree: '#2F6FCF', glow: '#FFF2A8' },
};

type P = z.infer<typeof schema>;

const U = 38;
const LOOP = scene.loop;
const OX = 600;
const OY = 232;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const sp = { calcMode: 'spline' as const };

// Network layout (world units on a 14 × 14 plaza)
const HUB = { x0: 5.4, y0: 5.4, x1: 9.4, y1: 9.4 };
const HW = HUB.x1 - HUB.x0;
const ST_IN = 1.2; // near-edge station centre
const ST_OUT = 12.8; // far-edge station centre
const L1Y = 6.2; // line 1 runs along x
const L3Y = 8.6; // line 3 runs along x
const L2X = 7.4; // line 2 runs along y

const MOMENT = 0.5; // DISPATCH at half the loop

/** Text set in a left-facing wall plane (y = const), baseline at world point. */
function LeftText({ at, children, size, fill, weight = 700, family = FONTS.mono, spacing = 1.5, anchor = 'middle' }: { at: P3; children: ReactNode; size: number; fill: string; weight?: number; family?: string; spacing?: number; anchor?: 'middle' | 'start' }) {
  const [x, y] = S(at);
  return (
    <g transform={`translate(${x} ${y}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
      <text x="0" y="0" textAnchor={anchor} fontFamily={family} fontWeight={weight} fontSize={size} letterSpacing={spacing} fill={fill}>
        {children}
      </text>
    </g>
  );
}

/** Text in a right-facing wall plane (x = const), reading left → right. */
function RightText({ at, children, size, fill, spacing = 1.2 }: { at: P3; children: ReactNode; size: number; fill: string; spacing?: number }) {
  const [x, y] = S(at);
  return (
    <g transform={`translate(${x} ${y}) matrix(${C30}, -0.5, 0, 1, 0, 0)`}>
      <text x="0" y="0" fontFamily={FONTS.mono} fontWeight={700} fontSize={size} letterSpacing={spacing} fill={fill}>
        {children}
      </text>
    </g>
  );
}

function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  // Sun is up-left: shadows fall toward +x.
  const l = h * 0.5;
  return <polygon points={poly([[x + w, y, 0.02], [x + w + l, y + l * 0.2, 0.02], [x + w + l, y + d + l * 0.2, 0.02], [x + w, y + d, 0.02]])} fill="#1C2B1A" opacity="0.18" filter="url(#jx-blur)" />;
}

function Tree({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: P }) {
  const [cx, cy] = S([x, y, 0]);
  const [tx, ty] = S([x, y, 1.15 * s]);
  return (
    <g>
      <ellipse cx={cx + 14 * s} cy={cy + 2} rx={22 * s} ry={9 * s} fill="#1C2B1A" opacity="0.18" filter="url(#jx-blur)" />
      <IsoCylinder x={x} y={y} r={0.08 * s} h={0.7 * s} color="#7A5A3C" u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      <circle cx={tx} cy={ty} r={17 * s} fill={shade(p.tree, -0.12)} stroke={p.ink} strokeWidth="1.2" />
      <circle cx={tx - 5 * s} cy={ty - 5 * s} r={9 * s} fill={shade(p.tree, 0.18)} />
    </g>
  );
}

function Lamp({ x, y, p, seed }: { x: number; y: number; p: P; seed: number }) {
  const [gx, gy] = S([x, y, 0]);
  const [hx, hy] = S([x, y, 1.5]);
  return (
    <g>
      <ellipse cx={gx} cy={gy} rx={30} ry={15} fill="url(#jx-pool)" opacity={p.night ? 1 : 0.5} />
      <IsoCylinder x={x} y={y} r={0.04} h={1.45} color={p.ink} u={U} ink={{ stroke: p.ink, strokeWidth: 0.8 }} />
      <circle cx={hx} cy={hy} r="9" fill={p.glow} opacity={p.night ? 0.5 : 0.25} filter="url(#jx-glow)" />
      <circle cx={hx} cy={hy} r="4.5" fill={p.glow} stroke={p.ink} strokeWidth="1">
        <Flicker dur={LOOP} seed={seed} low={0.6} />
      </circle>
    </g>
  );
}

/** A platform station: slab, kiosk, canopy in the line colour, name sign, lamp. */
function Station({ cx, cy, line, name, p, idx }: { cx: number; cy: number; line: string; name: string; p: P; idx: number }) {
  const x = cx - 0.9;
  const y = cy - 0.9;
  const lampAt = S([cx + 0.55, cy + 0.55, 1.85]);
  // stations light up in sequence just after DISPATCH
  const t0 = MOMENT + 0.04 + idx * 0.035;
  const kt = `0;${t0.toFixed(3)};${(t0 + 0.02).toFixed(3)};${(t0 + 0.14).toFixed(3)};1`;
  return (
    <g>
      <Shadow x={x} y={y} w={1.8} d={1.8} h={1.6} />
      <IsoBox x={x} y={y} w={1.8} d={1.8} h={0.22} color={shade(p.plaza, -0.08)} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      {/* platform edge strip */}
      <polygon points={poly([[x, y + 1.8, 0.22], [x + 1.8, y + 1.8, 0.22], [x + 1.8, y + 1.62, 0.22], [x, y + 1.62, 0.22]])} fill={p.glow} opacity="0.9" />
      {/* kiosk at the back corner */}
      <IsoBox x={x + 0.15} y={y + 0.15} z={0.22} w={0.75} d={0.75} h={0.95} color={p.walls} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      <IsoWindow face="left" plane={y + 0.9} a={x + 0.27} z={0.45} w={0.5} h={0.45} fill={p.night ? p.glow : shade(p.glow, 0.2)} u={U} ink={{ stroke: p.ink, strokeWidth: 0.8 }}>
        <Flicker dur={LOOP} seed={idx + 30} low={0.7} />
      </IsoWindow>
      {/* canopy posts */}
      {[
        [x + 1.6, y + 0.2],
        [x + 0.2, y + 1.6],
        [x + 1.6, y + 1.6],
      ].map(([px, py], i) => (
        <polyline key={i} points={poly([[px, py, 0.22], [px, py, 1.45]])} stroke={p.ink} strokeWidth="2" fill="none" />
      ))}
      {/* canopy roof in the line colour */}
      <IsoBox x={x - 0.1} y={y - 0.1} z={1.45} w={2} d={2} h={0.16} color={line} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      {/* name sign hanging on the canopy fascia */}
      <IsoWindow face="left" plane={y + 1.9} a={x + 0.05} z={1.62} w={1.8} h={0.42} fill={p.ink} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      <circle cx={S([x + 0.28, y + 1.9, 1.83])[0]} cy={S([x + 0.28, y + 1.9, 1.83])[1]} r="4.2" fill={line} />
      <LeftText at={[x + 1.05, y + 1.9, 1.71]} size={11} fill={shade(p.walls, 0.1)} spacing={0.8}>
        {name}
      </LeftText>
      {/* station lamp: flickers, then flares when the train is dispatched */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;0;1;0.2;0" keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
        <circle cx={lampAt[0]} cy={lampAt[1]} r="34" fill={line} opacity="0.35" filter="url(#jx-glow)" />
        <circle cx={lampAt[0]} cy={lampAt[1]} r="9" fill="#FFFFFF" stroke={line} strokeWidth="4" />
      </g>
    </g>
  );
}

/**
 * A short train shuttling between the hall and a station. It waits at the station
 * at t = 0 (the poster), runs home, waits, then departs on DISPATCH.
 */
function Train({ from, to, alongX, line, p }: { from: [number, number]; to: [number, number]; alongX: boolean; line: string; p: P }) {
  const a = S([from[0], from[1], 0]);
  const b = S([to[0], to[1], 0]);
  const L = 1.2;
  const Wd = 0.56;
  const box = alongX ? { x: -L / 2, y: -Wd / 2, w: L, d: Wd } : { x: -Wd / 2, y: -L / 2, w: Wd, d: L };
  return (
    <g>
      <animateMotion
        dur={`${LOOP}s`}
        repeatCount="indefinite"
        path={`M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}`}
        keyPoints="1;0;0;1;1"
        keyTimes={`0;0.3;${MOMENT};0.78;1`}
        {...sp}
        keySplines="0.45 0 0.55 1;0 0 1 1;0.3 0 0.2 1;0 0 1 1"
      />
      <ellipse cx={0} cy={8} rx={34} ry={10} fill="#1C2B1A" opacity="0.22" />
      <IsoBox x={box.x} y={box.y} z={0.1} w={box.w} d={box.d} h={0.55} color={p.walls} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      {/* line-coloured livery band, window strip and roof */}
      <IsoBox x={box.x} y={box.y} z={0.16} w={box.w} d={box.d} h={0.16} color={line} u={U} top={false} ink={{ stroke: p.ink, strokeWidth: 0.6 }} />
      <IsoBox x={box.x} y={box.y} z={0.4} w={box.w} d={box.d} h={0.12} color={shade(p.ink, 0.25)} u={U} top={false} ink={{ stroke: p.ink, strokeWidth: 0.4 }} />
      <IsoBox x={box.x + 0.05} y={box.y + 0.05} z={0.65} w={box.w - 0.1} d={box.d - 0.1} h={0.06} color={line} u={U} ink={{ stroke: p.ink, strokeWidth: 0.6 }} />
    </g>
  );
}

function Cloud({ x, y, s, dx, p }: { x: number; y: number; s: number; dx: number; p: P }) {
  const c = p.night ? shade(p.skyBottom, 0.12) : '#FFFFFF';
  return (
    <g opacity={p.night ? 0.5 : 0.9}>
      <animateTransform attributeName="transform" type="translate" values={`0 0;${dx} 0;0 0`} dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
      <g fill={c} stroke={p.night ? 'none' : shade(p.skyTop, -0.15)} strokeWidth="1.2">
        <ellipse cx={x} cy={y} rx={60 * s} ry={16 * s} />
        <circle cx={x - 22 * s} cy={y - 12 * s} r={20 * s} />
        <circle cx={x + 10 * s} cy={y - 18 * s} r={26 * s} />
        <circle cx={x + 38 * s} cy={y - 6 * s} r={16 * s} />
      </g>
    </g>
  );
}

export default function JunctionInterchange(p: P) {
  const night = p.night;
  const lines = [p.line1, p.line2, p.line3];
  const flashKT = `0;${MOMENT - 0.005};${MOMENT + 0.01};${MOMENT + 0.06};${MOMENT + 0.1};1`;

  const hubC = S([7.4, 7.4, 0]);
  const beacon = S([7.4, 7.4, 4.25]);
  const clock = S([7.4, 8.6, 2.95]);

  // Painter's order: everything that stands on the plaza, sorted back → front by x + y.
  const items: { k: number; el: ReactNode }[] = [];
  const add = (k: number, el: ReactNode) => items.push({ k, el });

  const stations = [
    { cx: ST_IN, cy: L1Y, line: p.line1, name: p.st1 },
    { cx: ST_OUT, cy: L1Y, line: p.line1, name: p.st2 },
    { cx: L2X, cy: ST_IN, line: p.line2, name: p.st3 },
    { cx: L2X, cy: ST_OUT, line: p.line2, name: p.st4 },
    { cx: ST_IN, cy: L3Y, line: p.line3, name: p.st5 },
    { cx: ST_OUT, cy: L3Y, line: p.line3, name: p.st6 },
  ];
  stations.forEach((s, i) => add(s.cx + s.cy, <Station key={`st${i}`} cx={s.cx} cy={s.cy} line={s.line} name={s.name} p={p} idx={i} />));

  // Trains: one per segment, between the hall wall and the platform.
  const trains = [
    { from: [HUB.x0 - 0.7, L1Y], to: [ST_IN + 1.6, L1Y], x: true, c: p.line1 },
    { from: [HUB.x1 + 0.7, L1Y], to: [ST_OUT - 1.6, L1Y], x: true, c: p.line1 },
    { from: [L2X, HUB.y0 - 0.7], to: [L2X, ST_IN + 1.6], x: false, c: p.line2 },
    { from: [L2X, HUB.y1 + 0.7], to: [L2X, ST_OUT - 1.6], x: false, c: p.line2 },
    { from: [HUB.x0 - 0.7, L3Y], to: [ST_IN + 1.6, L3Y], x: true, c: p.line3 },
    { from: [HUB.x1 + 0.7, L3Y], to: [ST_OUT - 1.6, L3Y], x: true, c: p.line3 },
  ] as const;
  trains.forEach((t, i) => {
    const mx = (t.from[0] + t.to[0]) / 2;
    const my = (t.from[1] + t.to[1]) / 2;
    add(mx + my - 0.3, <Train key={`tr${i}`} from={[t.from[0], t.from[1]]} to={[t.to[0], t.to[1]]} alongX={t.x} line={t.c} p={p} />);
  });

  [
    [2.6, 2.4, 1],
    [3.9, 1.3, 0.8],
    [11.4, 2.3, 1],
    [12.8, 3.6, 0.8],
    [2.3, 11.6, 1],
    [3.8, 12.8, 0.85],
    [11.6, 11.5, 1.05],
    [12.9, 10.4, 0.75],
    [10.3, 12.9, 0.8],
  ].forEach(([x, y, s], i) => add(x + y, <Tree key={`t${i}`} x={x} y={y} s={s} p={p} />));
  [
    [4.4, 4.4],
    [10.4, 4.4],
    [4.4, 10.4],
    [10.4, 10.4],
  ].forEach(([x, y], i) => add(x + y, <Lamp key={`l${i}`} x={x} y={y} p={p} seed={i * 3 + 1} />));
  // benches
  [
    [3.2, 4.4],
    [10.6, 12.1],
  ].forEach(([x, y], i) =>
    add(
      x + y,
      <g key={`b${i}`}>
        <IsoBox x={x} y={y} w={1} d={0.35} h={0.3} color={p.line1} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
        <IsoBox x={x} y={y} z={0.3} w={1} d={0.1} h={0.3} color={p.line1} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      </g>,
    ),
  );

  // ── The hall ──
  const hall = (
    <g key="hall">
      <Shadow x={HUB.x0} y={HUB.y0} w={HW} d={HW} h={4.2} />
      <IsoBox x={HUB.x0} y={HUB.y0} w={HW} d={HW} h={2.0} color={p.walls} u={U} ink={{ stroke: p.ink, strokeWidth: 1.3 }} />
      {/* plinth */}
      <IsoBox x={HUB.x0 - 0.06} y={HUB.y0 - 0.06} w={HW + 0.12} d={HW + 0.12} h={0.22} color={shade(p.walls, -0.25)} u={U} top={false} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      {/* tunnel portals where the lines enter */}
      <IsoWindow face="left" plane={HUB.y1} a={L2X - 0.45} z={0} w={0.9} h={0.95} fill={p.ink} u={U} />
      <IsoWindow face="left" plane={HUB.y1 + 0.01} a={L2X - 0.55} z={0.95} w={1.1} h={0.14} fill={p.line2} u={U} ink={{ stroke: p.ink, strokeWidth: 0.8 }} />
      {[L1Y, L3Y].map((yy, i) => (
        <g key={i}>
          <IsoWindow face="right" plane={HUB.x1} a={yy - 0.45} z={0} w={0.9} h={0.95} fill={p.ink} u={U} />
          <IsoWindow face="right" plane={HUB.x1 + 0.01} a={yy - 0.55} z={0.95} w={1.1} h={0.14} fill={i ? p.line3 : p.line1} u={U} ink={{ stroke: p.ink, strokeWidth: 0.8 }} />
        </g>
      ))}
      {/* tall windows */}
      {[5.65, 6.3, 8.1, 8.75].map((a, i) => (
        <g key={`wl${i}`}>
          <IsoWindow face="left" plane={HUB.y1} a={a} z={0.35} w={0.48} h={0.85} fill={shade(p.ink, 0.15)} u={U} />
          <IsoWindow face="left" plane={HUB.y1} a={a + 0.06} z={0.41} w={0.36} h={0.73} fill={p.glow} u={U} ink={{ strokeWidth: 0 }}>
            <Flicker dur={LOOP} seed={i + 2} low={night ? 0.65 : 0.8} />
          </IsoWindow>
        </g>
      ))}
      {[7.18].map((a, i) => (
        <g key={`wr${i}`}>
          <IsoWindow face="right" plane={HUB.x1} a={a} z={0.35} w={0.42} h={0.85} fill={shade(p.ink, 0.15)} u={U} />
          <IsoWindow face="right" plane={HUB.x1} a={a + 0.05} z={0.41} w={0.32} h={0.73} fill={shade(p.glow, -0.08)} u={U} ink={{ strokeWidth: 0 }}>
            <Flicker dur={LOOP} seed={i + 9} low={night ? 0.65 : 0.8} />
          </IsoWindow>
        </g>
      ))}
      {/* sign band with the hall name, in the wall plane */}
      <IsoWindow face="left" plane={HUB.y1 + 0.02} a={HUB.x0 + 0.15} z={1.32} w={HW - 0.3} h={0.56} fill={p.ink} u={U} />
      {[p.line1, p.line2, p.line3].map((c, i) => {
        const [bx, by] = S([HUB.x0 + 0.5 + i * 0.32, HUB.y1 + 0.02, 1.6]);
        return <circle key={i} cx={bx} cy={by} r="5" fill={c} />;
      })}
      <LeftText at={[HUB.x0 + 2.35, HUB.y1 + 0.02, 1.43]} size={19} fill={shade(p.walls, 0.2)} family={FONTS.shoulders} weight={900} spacing={2.5}>
        {p.hub}
      </LeftText>
      {/* cornice */}
      <IsoBox x={HUB.x0 - 0.12} y={HUB.y0 - 0.12} z={2.0} w={HW + 0.24} d={HW + 0.24} h={0.2} color={p.line1} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      {/* upper tier */}
      <IsoBox x={6.2} y={6.2} z={2.2} w={2.4} d={2.4} h={1.6} color={p.walls} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
      {/* clock on the upper tier, in the left wall plane */}
      <g transform={`translate(${clock[0]} ${clock[1]}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
        <circle r="17" fill={p.walls} stroke={p.ink} strokeWidth="3" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={Math.sin(a) * 12} y1={-Math.cos(a) * 12} x2={Math.sin(a) * 15} y2={-Math.cos(a) * 15} stroke={p.ink} strokeWidth="1.2" />;
        })}
        <line x1="0" y1="0" x2="0" y2="-8" stroke={p.ink} strokeWidth="2.4" strokeLinecap="round" transform="rotate(60)" />
        <line x1="0" y1="0" x2="0" y2="-13" stroke={p.line1} strokeWidth="1.8" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur={`${LOOP}s`} repeatCount="indefinite" />
        </line>
        <circle r="2" fill={p.ink} />
      </g>
      {/* departure board on the upper tier, right wall plane: lines flip each half-loop */}
      <IsoWindow face="right" plane={8.6} a={6.4} z={2.45} w={2.0} h={1.1} fill={p.ink} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      <g>
        <animate attributeName="opacity" values="1;0;1" keyTimes="0;0.5;1" calcMode="discrete" dur={`${LOOP / 2}s`} repeatCount="indefinite" />
        <RightText at={[8.61, 8.25, 3.2]} size={7.5} fill={p.line2}>
          {p.board1}
        </RightText>
        <RightText at={[8.61, 8.25, 2.82]} size={7.5} fill={shade(p.walls, 0.1)}>
          {p.board2}
        </RightText>
      </g>
      <g opacity="0">
        <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.5;1" calcMode="discrete" dur={`${LOOP / 2}s`} repeatCount="indefinite" />
        <RightText at={[8.61, 8.25, 3.2]} size={7.5} fill={p.line1}>
          L3 VIDEO   DEPARTING
        </RightText>
        <RightText at={[8.61, 8.25, 2.82]} size={7.5} fill={shade(p.walls, 0.1)}>
          L5 AUDIO   ON TIME
        </RightText>
      </g>
      {/* roof cap + beacon mast */}
      <IsoBox x={6.1} y={6.1} z={3.8} w={2.6} d={2.6} h={0.14} color={p.line2} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      <IsoCylinder x={7.4} y={7.4} z={3.94} r={0.22} h={0.32} color={p.walls} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      <circle cx={beacon[0]} cy={beacon[1]} r="18" fill={p.line3} opacity="0.25" filter="url(#jx-glow)">
        <animate attributeName="opacity" values="0.15;0.4;0.15" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx={beacon[0]} cy={beacon[1]} r="7" fill={p.line3} stroke={p.ink} strokeWidth="1.2" />
    </g>
  );
  add(14.8, hall);
  items.sort((a, b) => a.k - b.k);

  // Stars for the night variants
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
        <linearGradient id="jx-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="jx-sun">
          <stop offset="0" stopColor={night ? '#FFF6DA' : '#FFFFFF'} stopOpacity="0.7" />
          <stop offset="0.4" stopColor={night ? '#FFF6DA' : p.line1} stopOpacity="0.18" />
          <stop offset="1" stopColor={p.line1} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="jx-flare">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.3" stopColor={p.line3} stopOpacity="0.6" />
          <stop offset="1" stopColor={p.line3} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="jx-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <filter id="jx-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="jx-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height="900" fill="url(#jx-sky)" />
      {stars}
      <circle cx="210" cy="150" r="140" fill="url(#jx-sun)" />
      <circle cx="210" cy="150" r="46" fill={night ? '#FFF3D6' : '#FFC94D'} stroke={night ? 'none' : p.line1} strokeWidth="3" />
      <Cloud x={440} y={120} s={1} dx={40} p={p} />
      <Cloud x={930} y={190} s={0.8} dx={-30} p={p} />
      <Cloud x={1080} y={90} s={0.6} dx={24} p={p} />
      {/* blimp towing a banner across the sky */}
      <g>
        <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path="M-260,70 C200,40 900,60 1460,40" />
        <rect x="-150" y="-4" width="96" height="22" fill={p.walls} stroke={p.ink} strokeWidth="1.4" />
        <text x="-102" y="11" textAnchor="middle" fontFamily={FONTS.shoulders} fontWeight={900} fontSize="13" letterSpacing="1" fill={p.ink}>
          32 LINES
        </text>
        <line x1="-54" y1="7" x2="-30" y2="5" stroke={p.ink} strokeWidth="1.2" />
        <ellipse cx="0" cy="0" rx="34" ry="14" fill={p.line1} stroke={p.ink} strokeWidth="1.4" />
        <ellipse cx="-6" cy="-5" rx="18" ry="4" fill="#FFFFFF" opacity="0.4" />
        <path d="M-34,0 L-44,-10 L-44,10 Z" fill={p.line1} stroke={p.ink} strokeWidth="1.2" />
        <rect x="-8" y="13" width="16" height="6" rx="2" fill={p.ink} />
      </g>

      {/* ── Plaza ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
        <g transform={`translate(${OX} ${OY})`}>
          <ellipse cx={0} cy={14 * U + 64} rx={420} ry={40} fill="#1C2B1A" opacity="0.08" filter="url(#jx-blur)" />
          <IsoBox x={0} y={0} z={-0.9} w={14} d={14} h={0.9} color={p.slab} u={U} ink={{ stroke: p.ink, strokeWidth: 1.3 }} />
          <IsoBox x={-0.05} y={-0.05} z={-0.12} w={14.1} d={14.1} h={0.12} color={p.plaza} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
          {/* paving grid */}
          <g stroke={shade(p.plaza, -0.18)} strokeWidth="1" opacity="0.7">
            {Array.from({ length: 13 }, (_, i) => (
              <g key={i}>
                <polyline points={poly([[i + 1, 0, 0.005], [i + 1, 14, 0.005]])} fill="none" />
                <polyline points={poly([[0, i + 1, 0.005], [14, i + 1, 0.005]])} fill="none" />
              </g>
            ))}
          </g>
          {/* lawns in the four quadrants */}
          {[
            [0.6, 0.6, 3.8, 3.8],
            [9.6, 0.6, 3.8, 3.8],
            [0.6, 9.6, 3.8, 3.8],
            [9.6, 9.6, 3.8, 3.8],
          ].map(([x, y, w, d], i) => (
            <polygon key={i} points={poly([[x, y, 0.01], [x + w, y, 0.01], [x + w, y + d, 0.01], [x, y + d, 0.01]])} fill={shade(p.tree, 0.35)} stroke={shade(p.tree, -0.2)} strokeWidth="1" opacity="0.9" />
          ))}
          {/* tracks: a white casing then the line colour, with sleepers */}
          {[
            { a: [0.4, L1Y], b: [13.6, L1Y], c: p.line1, x: true },
            { a: [0.4, L3Y], b: [13.6, L3Y], c: p.line3, x: true },
            { a: [L2X, 0.4], b: [L2X, 13.6], c: p.line2, x: false },
          ].map((t, i) => {
            const half = 0.36;
            const quad = (h: number): P3[] =>
              t.x
                ? [[t.a[0], t.a[1] - h, 0.02], [t.b[0], t.b[1] - h, 0.02], [t.b[0], t.b[1] + h, 0.02], [t.a[0], t.a[1] + h, 0.02]]
                : [[t.a[0] - h, t.a[1], 0.02], [t.b[0] - h, t.b[1], 0.02], [t.b[0] + h, t.b[1], 0.02], [t.a[0] + h, t.a[1], 0.02]];
            return (
              <g key={i}>
                <polygon points={poly(quad(half + 0.12))} fill={p.walls} stroke={p.ink} strokeWidth="1" />
                <polygon points={poly(quad(half))} fill={t.c} />
                {Array.from({ length: 26 }, (_, k) => {
                  const s = 0.6 + k * 0.5;
                  const p1: P3 = t.x ? [s, t.a[1] - half, 0.03] : [t.a[0] - half, s, 0.03];
                  const p2: P3 = t.x ? [s, t.a[1] + half, 0.03] : [t.a[0] + half, s, 0.03];
                  return <polyline key={k} points={poly([p1, p2])} stroke={shade(t.c, -0.3)} strokeWidth="1.4" fill="none" opacity="0.6" />;
                })}
              </g>
            );
          })}
          {/* DISPATCH ripple across the plaza */}
          <ellipse cx={hubC[0]} cy={hubC[1]} rx="10" ry="5" fill="none" stroke={p.line3} strokeWidth="4" opacity="0">
            <animate attributeName="rx" values="10;10;10;420;420" keyTimes={`0;${MOMENT};${MOMENT + 0.001};${MOMENT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="ry" values="5;5;5;210;210" keyTimes={`0;${MOMENT};${MOMENT + 0.001};${MOMENT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes={`0;${MOMENT};${MOMENT + 0.001};${MOMENT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          </ellipse>

          {items.map((it) => it.el)}

          {/* DISPATCH: beacon flare and a pop tag rising from the roof */}
          <circle cx={beacon[0]} cy={beacon[1]} r="60" fill="url(#jx-flare)" opacity="0">
            <animate attributeName="opacity" values="0;0;0.95;0.3;0;0" keyTimes={flashKT} dur={`${LOOP}s`} repeatCount="indefinite" />
          </circle>
          <g opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${MOMENT};${MOMENT + 0.02};${MOMENT + 0.16};${MOMENT + 0.22};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 10;0 10;0 -6;0 -22;0 -22" keyTimes={`0;${MOMENT};${MOMENT + 0.04};${MOMENT + 0.22};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            <rect x={beacon[0] - 58} y={beacon[1] - 64} width="116" height="34" rx="17" fill={p.line3} stroke={p.ink} strokeWidth="2" />
            <text x={beacon[0]} y={beacon[1] - 41} textAnchor="middle" fontFamily={FONTS.shoulders} fontWeight={900} fontSize="20" letterSpacing="1.5" fill="#FFFFFF">
              DISPATCH!
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
