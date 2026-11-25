import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, iso, pts, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'The Switchboard',
  description:
    'Landing-page hero for Ringside: a clay switchboard machine on a tabletop. Lead cards leave the CRM cabinet on four belts, four desk phones ring at once, one line lights up CONNECTED and its stamped log card flies back into the cabinet. Patch cables sway, lamps flicker, the wall clock ticks. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'dialer', 'animated svg', 'process'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Sign').default('RINGSIDE'),
  wall: color('Wall').default('#F1E4D3'),
  wallShade: color('Wall shade').default('#E5CDB2'),
  table: color('Tabletop').default('#D9B48F'),
  machine: color('Switchboard').default('#C8553D'),
  cabinet: color('CRM cabinet').default('#4F6D58'),
  phone: color('Phones').default('#F4E8D6'),
  belt: color('Belts').default('#8E6A55'),
  paper: color('Lead cards').default('#FBF5EC'),
  glow: color('Connected light').default('#F2A541'),
  ink: color('Ink').default('#3B1F14'),
  sky: color('Window sky').default('#F6C99A'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { wall: '#E9C9B5', wallShade: '#C99A86', sky: '#E8846A', table: '#B98667', machine: '#8C2F4C', glow: '#FFD27F' },
  night: { wall: '#2B1B2E', wallShade: '#45293F', table: '#5A3A44', machine: '#C8553D', cabinet: '#3F5A47', phone: '#E9D8C6', belt: '#2A1B20', paper: '#F3E6D6', glow: '#FFC857', ink: '#160C12', sky: '#1C1436' },
  sage: { wall: '#EEF1E6', wallShade: '#DCE3CC', table: '#C9B98F', machine: '#4F6D58', cabinet: '#C8553D', glow: '#E85D3F', sky: '#CFE3D0' },
  midcentury: { wall: '#F4E9D8', wallShade: '#E6D3B3', table: '#C9A27A', machine: '#2C7873', cabinet: '#D96C3D', glow: '#E9B44C', sky: '#BFE0DC' },
};

type P = z.infer<typeof schema>;

const U = 40;
const C30 = Math.cos(Math.PI / 6);
const LOOP = scene.loop;
const OX = 552;
const OY = 260;
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const dur = `${LOOP}s`;
/** Screen offset for moving `d` units along +x. */
const alongX = (d: number): [number, number] => [d * C30 * U, d * 0.5 * U];

// Lanes: belts running along +x, stacked in y.
const LANES = [3.9, 5.4, 6.9, 8.4];
const HOT = 2;
const BELT_X0 = 0.9;
const BELT_X1 = 8.5;
const CARD_X0 = 1.2;
const CARD_TRAVEL = 6.1;
const PHONE_X = 8.95;
const RING = 0.4; // phones ring 0.4–0.6 of the loop
const MOMENT = 0.6; // L3 connects
const FILED = 0.84; // log card lands in the cabinet

const kt = (...k: number[]) => k.map((v) => +v.toFixed(4)).join(';');

function Ink({ p, children }: { p: P; children: ReactNode }) {
  return (
    <g stroke={p.ink} strokeOpacity={0.55} strokeWidth={1.2} strokeLinejoin="round">
      {children}
    </g>
  );
}

/** A lead card sliding along its belt, then dropping (or handing off, on the hot lane). */
function LeadCard({ i, y, p }: { i: number; y: number; p: P }) {
  const [dx, dy] = alongX(CARD_TRAVEL);
  // Visible at the start of the belt at t = 0 (the poster frame); reset invisibly at the end of the loop.
  const start = 0.03 + i * 0.025;
  const arrive = 0.33 + i * 0.02;
  const out = i === HOT ? MOMENT : MOMENT + 0.02 + i * 0.015;
  const back = 0.93;
  const z = 0.32;
  const x = CARD_X0;
  const yy = y + 0.12;
  const [dotX, dotY] = S([x + 0.85, yy + 0.55, z]);
  return (
    <g>
      <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;${dx} ${dy};${dx} ${dy};0 0;0 0`} keyTimes={kt(0, start, arrive, back, back + 0.001, 1)} calcMode="spline" keySplines="0 0 1 1;0.45 0 0.3 1;0 0 1 1;0 0 1 1;0 0 1 1" dur={dur} repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;1;0;0;1" keyTimes={kt(0, out, out + 0.06, back + 0.002, 1)} dur={dur} repeatCount="indefinite" />
      <polygon points={poly([[x, yy, z], [x + 1.1, yy, z], [x + 1.1, yy + 0.76, z], [x, yy + 0.76, z]])} fill={p.paper} stroke={p.ink} strokeOpacity={0.6} strokeWidth={1.1} />
      <polygon points={poly([[x, yy + 0.76, z], [x + 1.1, yy + 0.76, z], [x + 1.1, yy + 0.76, z - 0.07], [x, yy + 0.76, z - 0.07]])} fill={shade(p.paper, -0.25)} />
      <polyline points={poly([[x + 0.18, yy + 0.2, z], [x + 0.8, yy + 0.2, z]])} stroke={p.ink} strokeOpacity={0.7} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <polyline points={poly([[x + 0.18, yy + 0.42, z], [x + 0.62, yy + 0.42, z]])} stroke={p.ink} strokeOpacity={0.35} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <circle cx={dotX} cy={dotY} r={3} fill={i === HOT ? p.glow : p.machine} />
    </g>
  );
}

/** Belt with moving slats, clipped to the belt top. */
function Belt({ y, p, id }: { y: number; p: P; id: string }) {
  const h = 0.3;
  const top: P3[] = [[BELT_X0, y, h], [BELT_X1, y, h], [BELT_X1, y + 1, h], [BELT_X0, y + 1, h]];
  const [sx, sy] = alongX(0.7);
  return (
    <g>
      <IsoBox x={BELT_X0} y={y} w={BELT_X1 - BELT_X0} d={1} h={h} color={p.belt} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      <clipPath id={id}>
        <polygon points={poly(top)} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <g>
          <animateTransform attributeName="transform" type="translate" values={`0 0;${sx} ${sy}`} dur="1.5s" repeatCount="indefinite" />
          {Array.from({ length: 15 }, (_, k) => {
            const x = BELT_X0 - 0.7 + k * 0.7;
            return <polyline key={k} points={poly([[x, y, h], [x, y + 1, h]])} stroke={shade(p.belt, 0.3)} strokeWidth={1.6} fill="none" />;
          })}
        </g>
      </g>
      <IsoCylinder x={BELT_X1 + 0.05} y={y + 0.5} z={0} r={0.16} h={0.3} color={shade(p.belt, 0.2)} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
    </g>
  );
}

/** Desk phone at the end of a lane: base, handset with cups, ring ripples. */
function DeskPhone({ y, i, p }: { y: number; i: number; p: P }) {
  const x = PHONE_X;
  const [cx, cy] = S([x + 0.8, y + 0.6, 0.05]);
  const hot = i === HOT;
  const ring1 = kt(0, RING, RING + 0.09, RING + 0.0901, RING + 0.18, RING + 0.1801, 1);
  return (
    <g>
      {[0, 1].map((k) => (
        <ellipse key={k} cx={cx} cy={cy} rx="10" ry="6" fill="none" stroke={p.machine} strokeWidth="4" opacity="0">
          <animate attributeName="rx" values={k ? '20;20;20;20;95;20;20' : '20;20;95;20;20;20;20'} keyTimes={ring1} dur={dur} repeatCount="indefinite" />
          <animate attributeName="ry" values={k ? '12;12;12;12;55;12;12' : '12;12;55;12;12;12;12'} keyTimes={ring1} dur={dur} repeatCount="indefinite" />
          <animate attributeName="opacity" values={k ? '0;0;0;1;0;0;0' : '0;1;0;0;0;0;0'} keyTimes={ring1} dur={dur} repeatCount="indefinite" />
        </ellipse>
      ))}
      <polygon points={poly([[x + 1.6, y + 0.1, 0.01], [x + 2.1, y + 0.3, 0.01], [x + 2.1, y + 1.4, 0.01], [x + 0.3, y + 1.4, 0.01]])} fill={p.ink} opacity="0.16" filter="url(#sw-blur)" />
      <IsoBox x={x} y={y} w={1.6} d={1.15} h={0.5} color={p.phone} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      {[0, 1, 2, 3].map((k) => (
        <polygon key={k} points={poly([[x + 0.16 + k * 0.34, y + 1.15, 0.14], [x + 0.42 + k * 0.34, y + 1.15, 0.14], [x + 0.42 + k * 0.34, y + 1.15, 0.34], [x + 0.16 + k * 0.34, y + 1.15, 0.34]])} fill={k === i ? (hot ? p.glow : p.machine) : shade(p.phone, -0.3)} stroke={p.ink} strokeOpacity={0.4} strokeWidth={0.8} />
      ))}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={hot ? '0 0;0 0;0 -3;0 0;0 -3;0 0;0 -14;0 -14;0 0' : '0 0;0 0;0 -3;0 0;0 -3;0 0;0 0'}
          keyTimes={hot ? kt(0, RING, RING + 0.05, RING + 0.1, RING + 0.15, MOMENT - 0.01, MOMENT + 0.04, 0.9, 0.96) : kt(0, RING, RING + 0.05, RING + 0.1, RING + 0.15, RING + 0.2, 1)}
          dur={dur}
          repeatCount="indefinite"
        />
        <IsoBox x={x + 0.14} y={y + 0.08} z={0.5} w={0.56} d={0.3} h={0.3} color={p.phone} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
        <IsoBox x={x + 0.24} y={y + 0.2} z={0.62} w={0.36} d={0.76} h={0.2} color={p.phone} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
        <IsoBox x={x + 0.14} y={y + 0.82} z={0.5} w={0.56} d={0.3} h={0.3} color={p.phone} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
        {/* dial pad on the base top */}
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => {
            const [kx, ky] = S([x + 0.95 + c * 0.28, y + 0.25 + r * 0.28, 0.5]);
            return <ellipse key={`${r}${c}`} cx={kx} cy={ky} rx="4" ry="2.4" fill={shade(p.phone, -0.35)} />;
          }),
        )}
      </g>
    </g>
  );
}

/** Status lamp on a post beside each phone. Hot lane goes saffron at the moment; the rest blink while ringing then dim. */
function Lamp({ y, i, p }: { y: number; i: number; p: P }) {
  const x = 11.1;
  const yy = y + 0.45;
  const [bx, by] = S([x, yy, 1.35]);
  const hot = i === HOT;
  const dim = shade(p.ink, 0.25);
  const times = kt(0, RING, RING + 0.05, RING + 0.1, RING + 0.15, MOMENT, MOMENT + 0.01, 0.9, 0.95, 1);
  const vals = hot ? [dim, dim, p.machine, dim, p.machine, dim, p.glow, p.glow, dim, dim] : [dim, dim, p.machine, dim, p.machine, dim, dim, dim, dim, dim];
  return (
    <g>
      <IsoCylinder x={x} y={yy} r={0.05} h={1.2} color={shade(p.ink, 0.2)} u={U} ink={{ stroke: p.ink, strokeWidth: 0.8 }} />
      {hot && (
        <circle cx={bx} cy={by} r="22" fill={p.glow} opacity="0" filter="url(#sw-glow)">
          <animate attributeName="opacity" values="0;0;0.75;0.5;0;0" keyTimes={kt(0, MOMENT, MOMENT + 0.01, 0.88, 0.94, 1)} dur={dur} repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={bx} cy={by} r="8" fill={dim} stroke={p.ink} strokeWidth="1.2">
        <animate attributeName="fill" values={vals.join(';')} keyTimes={times} dur={dur} repeatCount="indefinite" calcMode="discrete" />
      </circle>
    </g>
  );
}

function Switchboard({ p }: { p: P }) {
  const x = 3.6;
  const y = 0.3;
  const w = 8.6;
  const d = 1.3;
  const h = 3.5;
  const face = y + d;
  const cols = 11;
  const rows = 3;
  const jack = (c: number, r: number) => S([x + 0.6 + c * 0.72, face, 0.7 + r * 0.62]);
  const cables: [number, number, number, number, string][] = [
    [0, 2, 3, 0, p.glow],
    [2, 1, 5, 2, p.cabinet],
    [4, 0, 8, 1, p.paper],
    [6, 2, 9, 0, p.glow],
    [7, 1, 10, 2, p.cabinet],
  ];
  const signAt = S([x + 0.55, face, 2.85]);
  return (
    <g>
      <polygon points={poly([[x, face, 0.01], [x + w, face, 0.01], [x + w + 0.8, face + 1.2, 0.01], [x + 0.8, face + 1.2, 0.01]])} fill={p.ink} opacity="0.2" filter="url(#sw-blur)" />
      <IsoBox x={x} y={y} w={w} d={d} h={h} color={p.machine} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
      <IsoBox x={x - 0.1} y={y - 0.1} z={h} w={w + 0.2} d={d + 0.2} h={0.16} color={shade(p.machine, -0.25)} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      <polygon points={poly([[x, face, 0.5], [x + w, face, 0.5], [x + w, face + 0.5, 0.36], [x, face + 0.5, 0.36]])} fill={shade(p.machine, 0.15)} stroke={p.ink} strokeOpacity={0.55} strokeWidth={1.1} />
      {/* sign band */}
      <polygon points={poly([[x + 0.3, face + 0.005, 2.72], [x + 4.4, face + 0.005, 2.72], [x + 4.4, face + 0.005, 3.32], [x + 0.3, face + 0.005, 3.32]])} fill={p.paper} stroke={p.ink} strokeOpacity={0.6} strokeWidth={1.2} />
      <text transform={`matrix(${C30}, 0.5, 0, 1, ${signAt[0]}, ${signAt[1]})`} fontFamily={FONTS.dela} fontSize="17" fill={p.ink} letterSpacing="2">
        {p.sign}
      </text>
      {/* lamp row */}
      {Array.from({ length: cols }, (_, c) => {
        const [lx, ly] = S([x + 0.6 + c * 0.72, face, 2.45]);
        return (
          <circle key={c} cx={lx} cy={ly} r="4.2" fill={c % 3 === 1 ? p.glow : shade(p.paper, -0.1)} stroke={p.ink} strokeWidth="0.8">
            <Flicker dur={c % 2 ? 3 : 2} seed={c * 3 + 1} low={0.25} />
          </circle>
        );
      })}
      {/* jack field */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const [jx, jy] = jack(c, r);
          return <ellipse key={`${r}-${c}`} cx={jx} cy={jy} rx="4.5" ry="5" fill={shade(p.machine, -0.6)} />;
        }),
      )}
      {/* patch cables sag and sway */}
      {cables.map(([c1, r1, c2, r2, col], k) => {
        const [ax, ay] = jack(c1, r1);
        const [bx, by] = jack(c2, r2);
        const sag = 34 + k * 6;
        const mx = (ax + bx) / 2;
        const my = Math.max(ay, by) + sag;
        const d1 = `M${ax},${ay} Q${mx - 8},${my} ${bx},${by}`;
        const d2 = `M${ax},${ay} Q${mx + 8},${my - 6} ${bx},${by}`;
        return (
          <g key={k}>
            <path d={d1} fill="none" stroke={p.ink} strokeWidth="6" strokeLinecap="round" opacity="0.6">
              <animate attributeName="d" values={`${d1};${d2};${d1}`} dur="3s" begin={`-${k * 0.6}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
            </path>
            <path d={d1} fill="none" stroke={col} strokeWidth="3.6" strokeLinecap="round">
              <animate attributeName="d" values={`${d1};${d2};${d1}`} dur="3s" begin={`-${k * 0.6}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
            </path>
            <circle cx={ax} cy={ay} r="4" fill={p.ink} />
            <circle cx={bx} cy={by} r="4" fill={p.ink} />
          </g>
        );
      })}
      {/* right-face vent slots */}
      {[0, 1, 2, 3, 4].map((k) => (
        <polyline key={k} points={poly([[x + w, y + 0.25, 1 + k * 0.4], [x + w, y + d - 0.25, 1 + k * 0.4]])} stroke={shade(p.machine, -0.5)} strokeWidth="2" fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Cabinet({ p }: { p: P }) {
  const x = 0.5;
  const y = 0.6;
  const w = 2.4;
  const d = 2.4;
  const h = 4.3;
  const face = y + d;
  const drawers = [0.25, 1.6, 2.95];
  const [ox, oy] = [-C30 * U * 0.4, 0.5 * U * 0.4]; // a drawer sliding out 0.4 units toward +y
  const labelAt = S([x + 0.5, face, 4.18]);
  return (
    <g>
      <polygon points={poly([[x, face, 0.01], [x + w, face, 0.01], [x + w + 0.7, face + 1.1, 0.01], [x + 0.7, face + 1.1, 0.01]])} fill={p.ink} opacity="0.2" filter="url(#sw-blur)" />
      <IsoBox x={x} y={y} w={w} d={d} h={h} color={p.cabinet} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
      {drawers.map((z0, k) => (
        <g key={k}>
          {k === 0 && (
            <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;${ox} ${oy};${ox} ${oy};0 0;0 0`} keyTimes={kt(0, FILED - 0.06, FILED - 0.02, FILED + 0.04, FILED + 0.09, 1)} dur={dur} repeatCount="indefinite" />
          )}
          <polygon points={poly([[x + 0.18, face, z0], [x + w - 0.18, face, z0], [x + w - 0.18, face, z0 + 1.15], [x + 0.18, face, z0 + 1.15]])} fill={shade(p.cabinet, -0.15)} stroke={p.ink} strokeOpacity={0.6} strokeWidth={1.1} />
          <polygon points={poly([[x + 0.8, face, z0 + 0.7], [x + w - 0.8, face, z0 + 0.7], [x + w - 0.8, face, z0 + 0.9], [x + 0.8, face, z0 + 0.9]])} fill={p.paper} stroke={p.ink} strokeOpacity={0.5} strokeWidth={0.8} />
          <polyline points={poly([[x + 0.9, face + 0.06, z0 + 0.45], [x + w - 0.9, face + 0.06, z0 + 0.45]])} stroke={shade(p.cabinet, 0.5)} strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      ))}
      <text transform={`matrix(${C30}, 0.5, 0, 1, ${labelAt[0]}, ${labelAt[1]})`} fontFamily={FONTS.chakra} fontWeight={700} fontSize="10" fill={p.paper} letterSpacing="2.5">
        CRM · LEADS
      </text>
      {[0, 1, 2].map((k) => (
        <polygon key={k} points={poly([[x + 0.5 + k * 0.08, y + 0.6 - k * 0.05, h + 0.02 + k * 0.05], [x + 1.6 + k * 0.08, y + 0.6 - k * 0.05, h + 0.02 + k * 0.05], [x + 1.6 + k * 0.08, y + 1.4 - k * 0.05, h + 0.02 + k * 0.05], [x + 0.5 + k * 0.08, y + 1.4 - k * 0.05, h + 0.02 + k * 0.05]])} fill={p.paper} stroke={p.ink} strokeOpacity={0.5} strokeWidth={1} />
      ))}
    </g>
  );
}

/** Stamped log card: leaves the hot lane at the moment and flies back into the cabinet's bottom drawer. */
function FlyingLog({ p }: { p: P }) {
  const [sx, sy] = S([PHONE_X + 0.8, LANES[HOT] + 0.6, 1.2]);
  const [ex, ey] = S([1.7, 3.2, 0.9]);
  const path = `M${sx},${sy} C${sx - 60},${sy - 220} ${ex + 120},${ey - 240} ${ex},${ey}`;
  return (
    <g opacity="0">
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={kt(0, MOMENT + 0.03, MOMENT + 0.05, FILED - 0.02, FILED, 1)} dur={dur} repeatCount="indefinite" />
      <animateMotion dur={dur} repeatCount="indefinite" path={path} keyPoints="0;0;1;1" keyTimes={kt(0, MOMENT + 0.04, FILED, 1)} calcMode="spline" keySplines="0 0 1 1;0.45 0 0.3 1;0 0 1 1" />
      <g transform="rotate(-8)">
        <rect x="-26" y="-18" width="52" height="36" rx="4" fill={p.paper} stroke={p.ink} strokeWidth="1.6" />
        <line x1="-17" y1="-7" x2="10" y2="-7" stroke={p.ink} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
        <line x1="-17" y1="2" x2="4" y2="2" stroke={p.ink} strokeWidth="1.8" strokeLinecap="round" opacity="0.35" />
        <circle cx="13" cy="7" r="8" fill="none" stroke={p.cabinet} strokeWidth="2.4" />
        <path d="M9,7 l3,3 l5,-6" fill="none" stroke={p.cabinet} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}

function Mug({ p }: { p: P }) {
  const [mx, my] = S([12.4, 9.3, 0.7]);
  return (
    <g>
      <IsoCylinder x={12.4} y={9.3} r={0.32} h={0.7} color={p.machine} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      <path d={`M${mx + 13},${my + 8} q12,2 10,14 q-2,8 -11,6`} fill="none" stroke={shade(p.machine, -0.3)} strokeWidth="3.5" />
      {[0, 1].map((k) => (
        <path key={k} d={`M${mx - 3 + k * 7},${my - 4} q-6,-10 0,-20 q6,-10 0,-20`} fill="none" stroke={p.paper} strokeWidth="3" strokeLinecap="round" opacity="0">
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -18" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
        </path>
      ))}
    </g>
  );
}

function Plant({ p }: { p: P }) {
  const [px, py] = S([12.9, 2.6, 0.9]);
  const leaf = (a: number, l: number, k: number) => (
    <g key={k} transform={`translate(${px} ${py})`}>
      <g transform={`rotate(${a})`}>
        <animateTransform attributeName="transform" type="rotate" values={`${a};${a + (k % 2 ? 4 : -4)};${a}`} dur="3s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
        <path d={`M0,0 Q${l * 0.35},${-l * 0.5} 0,${-l} Q${-l * 0.35},${-l * 0.5} 0,0`} fill={shade(p.cabinet, k % 2 ? 0.1 : -0.1)} stroke={p.ink} strokeOpacity="0.5" strokeWidth="1" />
      </g>
    </g>
  );
  return (
    <g>
      <IsoCylinder x={12.9} y={2.6} r={0.45} h={0.9} color={p.machine} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      {[-50, -25, 0, 22, 48].map((a, k) => leaf(a, 46 + (k % 2) * 14, k))}
    </g>
  );
}

export default function TheSwitchboard(p: P) {
  const dark = parseInt(p.wall.slice(1, 3), 16) < 0x70;
  const hotY = LANES[HOT];
  const [hx, hy] = S([PHONE_X + 0.8, hotY + 0.6, 0.6]);
  const tagAt = S([PHONE_X + 0.7, hotY + 0.3, 2.1]);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="sw-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.wall} />
          <stop offset="1" stopColor={p.wallShade} />
        </linearGradient>
        <linearGradient id="sw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.sky, 0.25)} />
          <stop offset="1" stopColor={p.sky} />
        </linearGradient>
        <radialGradient id="sw-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sw-lampcone" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#FFF3D6" stopOpacity={dark ? 0.35 : 0.5} />
          <stop offset="1" stopColor="#FFF3D6" stopOpacity="0" />
        </radialGradient>
        <filter id="sw-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="sw-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="sw-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <pattern id="sw-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={p.ink} opacity={dark ? 0.25 : 0.12} />
        </pattern>
      </defs>

      {/* ── Wall ── */}
      <rect width="1200" height="900" fill="url(#sw-wall)" />
      <rect width="1200" height="900" fill="url(#sw-dots)" />
      {/* arched window with a low sun and a drifting cloud */}
      <g>
        <path d="M90,470 L90,210 A110,110 0 0 1 310,210 L310,470 Z" fill={shade(p.wallShade, -0.12)} />
        <path d="M108,462 L108,214 A92,92 0 0 1 292,214 L292,462 Z" fill="url(#sw-sky)" />
        <circle cx="236" cy="300" r="44" fill={dark ? '#F3E6D6' : p.glow} opacity={dark ? 0.85 : 0.9} />
        <g fill={dark ? '#3A2F55' : '#FFFFFF'} opacity={dark ? 0.6 : 0.75}>
          <animateTransform attributeName="transform" type="translate" values="-40 0;50 0;-40 0" dur="6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
          <ellipse cx="170" cy="250" rx="34" ry="10" />
          <ellipse cx="196" cy="242" rx="20" ry="9" />
        </g>
        <line x1="200" y1="118" x2="200" y2="462" stroke={shade(p.wallShade, -0.12)} strokeWidth="7" />
        <line x1="108" y1="320" x2="292" y2="320" stroke={shade(p.wallShade, -0.12)} strokeWidth="7" />
        <rect x="80" y="462" width="240" height="14" rx="3" fill={shade(p.wallShade, -0.2)} />
      </g>
      {/* wall clock: second hand 1 rev per loop */}
      <g transform="translate(1040 170)">
        <circle r="62" fill={p.paper} stroke={p.ink} strokeWidth="5" />
        {Array.from({ length: 12 }, (_, k) => (
          <line key={k} x1="0" y1="-50" x2="0" y2={k % 3 ? -45 : -40} stroke={p.ink} strokeWidth={k % 3 ? 2 : 4} transform={`rotate(${k * 30})`} />
        ))}
        <line x1="0" y1="4" x2="0" y2="-30" stroke={p.ink} strokeWidth="5" strokeLinecap="round" transform="rotate(-45)" />
        <line x1="0" y1="4" x2="0" y2="-44" stroke={p.ink} strokeWidth="3.5" strokeLinecap="round" transform="rotate(180)" />
        <line x1="0" y1="10" x2="0" y2="-48" stroke={p.machine} strokeWidth="2" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="6s" repeatCount="indefinite" />
        </line>
        <circle r="5" fill={p.machine} />
      </g>
      {/* pendant lamp swaying over the switchboard */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-2.5 760 0;2.5 760 0;-2.5 760 0" dur="6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
        <polygon points="712,152 808,152 930,560 590,560" fill="url(#sw-lampcone)" />
        <line x1="760" y1="0" x2="760" y2="112" stroke={p.ink} strokeWidth="3" />
        <path d="M712,152 Q712,112 760,108 Q808,112 808,152 Z" fill={p.machine} stroke={p.ink} strokeWidth="2" />
        <ellipse cx="760" cy="152" rx="48" ry="8" fill={shade(p.machine, -0.3)} stroke={p.ink} strokeWidth="2" />
        <ellipse cx="760" cy="156" rx="16" ry="6" fill="#FFF3D6" />
      </g>

      {/* ── Tabletop diorama ── */}
      <ellipse cx="600" cy="800" rx="470" ry="60" fill={p.ink} opacity="0.18" filter="url(#sw-soft)" />
      <g transform={`translate(${OX} ${OY})`}>
        <Ink p={p}>
          <IsoBox x={-0.5} y={-0.5} z={-0.7} w={14.2} d={10.9} h={0.7} color={p.table} u={U} ink={{ stroke: p.ink, strokeWidth: 1.3 }} />
        </Ink>
        <IsoGrid x={-0.5} y={-0.5} w={14} d={10} u={U} color={p.ink} opacity={0.08} />
        <polyline points={poly([[-0.5, 10.4, -0.25], [13.7, 10.4, -0.25]])} stroke={shade(p.table, -0.35)} strokeWidth="2" fill="none" />
        <polyline points={poly([[13.7, -0.5, -0.25], [13.7, 10.4, -0.25]])} stroke={shade(p.table, -0.3)} strokeWidth="2" fill="none" />

        <Switchboard p={p} />
        <Cabinet p={p} />
        <Plant p={p} />

        {/* the four lanes, back to front */}
        {LANES.map((y, i) => {
          const [nx, ny] = S([0.15, y + 0.85, 0]);
          return (
            <g key={i}>
              <Belt y={y} p={p} id={`sw-belt-${i}`} />
              <LeadCard i={i} y={y} p={p} />
              <DeskPhone y={y} i={i} p={p} />
              <Lamp y={y} i={i} p={p} />
              <text transform={`matrix(${C30}, 0.5, ${-C30}, 0.5, ${nx}, ${ny})`} fontFamily={FONTS.chakra} fontWeight={700} fontSize="22" fill={p.ink} opacity="0.55">
                L{i + 1}
              </text>
            </g>
          );
        })}

        {/* the moment: L3 connects — warm bloom, a shock ring and a CONNECTED tag */}
        <ellipse cx={hx} cy={hy} rx="10" ry="6" fill="url(#sw-pool)" opacity="0">
          <animate attributeName="opacity" values="0;0;1;0.6;0;0" keyTimes={kt(0, MOMENT, MOMENT + 0.02, 0.85, 0.92, 1)} dur={dur} repeatCount="indefinite" />
          <animate attributeName="rx" values="10;10;150;120;120;10" keyTimes={kt(0, MOMENT, MOMENT + 0.08, 0.85, 0.92, 1)} dur={dur} repeatCount="indefinite" />
          <animate attributeName="ry" values="6;6;87;70;70;6" keyTimes={kt(0, MOMENT, MOMENT + 0.08, 0.85, 0.92, 1)} dur={dur} repeatCount="indefinite" />
        </ellipse>
        <ellipse cx={hx} cy={hy} rx="20" ry="12" fill="none" stroke={p.glow} strokeWidth="5" opacity="0">
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={kt(0, MOMENT, MOMENT + 0.005, MOMENT + 0.12, 1)} dur={dur} repeatCount="indefinite" />
          <animate attributeName="rx" values="20;20;20;230;230" keyTimes={kt(0, MOMENT, MOMENT + 0.005, MOMENT + 0.12, 1)} dur={dur} repeatCount="indefinite" />
          <animate attributeName="ry" values="12;12;12;133;133" keyTimes={kt(0, MOMENT, MOMENT + 0.005, MOMENT + 0.12, 1)} dur={dur} repeatCount="indefinite" />
        </ellipse>
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={kt(0, MOMENT + 0.01, MOMENT + 0.04, 0.86, 0.9, 1)} dur={dur} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 14;0 14;0 0;0 0;0 -8;0 14" keyTimes={kt(0, MOMENT + 0.01, MOMENT + 0.05, 0.86, 0.9, 1)} dur={dur} repeatCount="indefinite" />
          <rect x={tagAt[0] - 70} y={tagAt[1] - 64} width="140" height="34" rx="17" fill={p.glow} stroke={p.ink} strokeWidth="2.5" />
          <text x={tagAt[0]} y={tagAt[1] - 41} textAnchor="middle" fontFamily={FONTS.chakra} fontWeight={700} fontSize="15" letterSpacing="2" fill={p.ink}>
            CONNECTED
          </text>
          <path d={`M${tagAt[0] - 6},${tagAt[1] - 31} l6,8 l6,-8 Z`} fill={p.ink} />
        </g>

        <FlyingLog p={p} />
        <Mug p={p} />
      </g>
    </svg>
  );
}
