import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Rollout Network',
  description:
    'Landing-page hero for a feature-flag platform: a floating console with a giant toggle, cabled to DEV, STAGING and PROD platforms. Flag packets race along the cables, rack LEDs blink, lasers sweep; then the rollout jumps from 25% to 100% and every user on PROD lights up. Loops seamlessly.',
  tags: ['hero', 'isometric', 'saas', 'feature flags', 'network', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Console sign').default('STROBE'),
  rolloutFrom: text('Rollout before').default('25%'),
  rolloutTo: text('Rollout after').default('100%'),
  skyTop: color('Backdrop top').default('#0B0B0B'),
  skyBottom: color('Backdrop bottom').default('#1D0B26'),
  platform: color('Platforms').default('#2A2A31'),
  rack: color('Racks').default('#18181C'),
  accent: color('ON / PROD').default('#C6FF00'),
  dev: color('DEV light').default('#00F0FF'),
  staging: color('STAGING light').default('#FF00E5'),
  userDim: color('Users (idle)').default('#4A4A55'),
  ink: color('Text on lights').default('#0B0B0B'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { skyTop: '#12001F', skyBottom: '#3A0A5E', platform: '#3B1A5C', rack: '#24003D', accent: '#FFD600', dev: '#FF2E88', staging: '#B026FF', userDim: '#5A3A78' },
  lava: { skyTop: '#1A0A06', skyBottom: '#4A1A0C', platform: '#3E1E14', rack: '#2E120B', accent: '#FFB000', dev: '#FF2E63', staging: '#FF4D00', userDim: '#5E3A2E' },
  daylight: { skyTop: '#FFF7D6', skyBottom: '#FFE45C', platform: '#FFFDF2', rack: '#222222', accent: '#FF5C8A', dev: '#5C8AFF', staging: '#00D1A0', userDim: '#C9C2A8', ink: '#111111' },
  deepsea: { skyTop: '#021B26', skyBottom: '#06303F', platform: '#0B4A5E', rack: '#06303F', accent: '#2EF2C4', dev: '#FF7A59', staging: '#1B7FA6', userDim: '#2D5A66' },
};

type P = z.infer<typeof schema>;

const U = 39;
const LOOP = scene.loop;
const OX = 600;
const OY = 40;
const C30 = Math.cos(Math.PI / 6);
const MOMENT = 0.54; // fraction of the loop: the rollout jumps (just before the 0.555 review still)
const INK = 'rgba(0,0,0,0.6)';
const ink = { stroke: INK, strokeWidth: 1.2 };
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

const S = (p: P3): [number, number] => {
  const [x, y] = iso(p, U);
  return [x, y]; // the world group is translated by (OX, OY)
};
const poly = (ps: P3[]) =>
  ps
    .map((p) => S(p))
    .map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`)
    .join(' ');

/** Opacity that is 0 before the moment and 1 after, resetting at the loop end. */
const afterMoment = (fadeOut = true) => ({
  values: fadeOut ? '0;0;1;1;0' : '0;0;1;1',
  keyTimes: fadeOut ? `0;${MOMENT};${MOMENT + 0.01};0.96;1` : `0;${MOMENT};${MOMENT + 0.01};1`,
});

/** Floating slab with a neon trim along the front edges. */
function Platform({ x, y, w, d, p, glow, label, pillW = 0, tagRight = false }: { x: number; y: number; w: number; d: number; p: P; glow: string; label: string; pillW?: number; tagRight?: boolean }) {
  const X = x + w;
  const Y = y + d;
  const [lx, ly] = S([x + w / 2, y + d / 2, 0]);
  const tagW = label.length * 13 + 34 + pillW;
  return (
    <g>
      {/* glow pool under the slab */}
      <ellipse cx={lx} cy={ly + 3.2 * U} rx={w * U * 0.9} ry={w * U * 0.32} fill={glow} opacity="0.18" filter="url(#rn-soft)" />
      {/* underside taper */}
      <polygon points={poly([[x, Y, -0.7], [X, Y, -0.7], [X - 0.6, Y - 0.6, -1.6], [x + 0.6, Y - 0.6, -1.6]])} fill={shade(p.platform, -0.6)} stroke={INK} strokeWidth="1" />
      <polygon points={poly([[X, y, -0.7], [X, Y, -0.7], [X - 0.6, Y - 0.6, -1.6], [X - 0.6, y + 0.6, -1.6]])} fill={shade(p.platform, -0.45)} stroke={INK} strokeWidth="1" />
      <IsoBox x={x} y={y} z={-0.7} w={w} d={d} h={0.7} color={p.platform} u={U} ink={ink} top={false} />
      <g>
        <IsoBox x={x} y={y} z={-0.01} w={w} d={d} h={0.01} color={p.platform} u={U} ink={ink} />
      </g>
      {/* neon trim */}
      <polyline points={poly([[x, Y, -0.22], [X, Y, -0.22], [X, y, -0.22]])} fill="none" stroke={glow} strokeWidth="3" strokeLinejoin="round" filter="url(#rn-glow)">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </polyline>
      {/* floor grid */}
      <g stroke={shade(p.platform, 0.18)} strokeWidth="1" opacity="0.5">
        {Array.from({ length: Math.floor(w) - 1 }, (_, i) => (
          <polyline key={`a${i}`} points={poly([[x + i + 1, y + 0.2, 0], [x + i + 1, Y - 0.2, 0]])} fill="none" />
        ))}
        {Array.from({ length: Math.floor(d) - 1 }, (_, i) => (
          <polyline key={`b${i}`} points={poly([[x + 0.2, y + i + 1, 0], [X - 0.2, y + i + 1, 0]])} fill="none" />
        ))}
      </g>
      {/* floating tag */}
      <g transform={tagRight ? `translate(${S([X, y + d * 0.35, 0])[0] + 10} ${S([X, y + d * 0.35, 0])[1] - 70})` : `translate(${S([x + w * 0.15, y + d * 0.15, 0])[0]} ${S([x, y, 0])[1] - 3.4 * U})`}>
        <animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;0 -5;0 0" dur="4s" repeatCount="indefinite" {...spline} />
        <line x1={tagW / 2} y1={30} x2={tagW / 2} y2={58} stroke={glow} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
        <rect x={0} y={0} width={tagW} height={30} rx={15} fill={glow} />
        <text x={17} y={20.5} fontFamily="'Press Start 2P', monospace" fontSize="11" fill={p.ink} letterSpacing="1">
          {label}
        </text>
      </g>
    </g>
  );
}

/** Server rack with blinking LED rows on its left face. */
function Rack({ x, y, h, p, led, seed }: { x: number; y: number; h: number; p: P; led: string; seed: number }) {
  const rows = Math.floor(h / 0.36);
  return (
    <g>
      <polygon points={poly([[x, y + 0.8, 0.01], [x + 0.9, y + 0.8, 0.01], [x + 1.6, y + 1.9, 0.01], [x + 0.7, y + 1.9, 0.01]])} fill="#000" opacity="0.35" filter="url(#rn-blur)" />
      <IsoBox x={x} y={y} w={0.9} d={0.8} h={h} color={p.rack} u={U} ink={ink} />
      {Array.from({ length: rows }, (_, r) => (
        <g key={r}>
          <polyline points={poly([[x + 0.08, y + 0.8, 0.15 + r * 0.36], [x + 0.82, y + 0.8, 0.15 + r * 0.36]])} stroke={shade(p.rack, 0.25)} strokeWidth="1" fill="none" />
          {[0, 1, 2].map((k) => {
            const [cx, cy] = S([x + 0.2 + k * 0.16, y + 0.8, 0.3 + r * 0.36]);
            return (
              <circle key={k} cx={cx} cy={cy} r="1.8" fill={k === 2 && (r + seed) % 3 === 0 ? p.accent : led}>
                <Flicker dur={k === 1 ? 1 : 2} seed={seed * 10 + r * 3 + k} low={0.15} />
              </circle>
            );
          })}
        </g>
      ))}
      {/* top vent */}
      <polygon points={poly([[x + 0.2, y + 0.2, h + 0.001], [x + 0.7, y + 0.2, h + 0.001], [x + 0.7, y + 0.6, h + 0.001], [x + 0.2, y + 0.6, h + 0.001]])} fill={shade(p.rack, -0.3)} />
    </g>
  );
}

/** A user: a little block body with a round head. */
function User({ x, y, c, p }: { x: number; y: number; c: string; p: P }) {
  const [hx, hy] = S([x + 0.2, y + 0.2, 0.78]);
  return (
    <g>
      <g>
        <IsoBox x={x} y={y} w={0.4} d={0.4} h={0.5} color={c} u={U} ink={{ stroke: INK, strokeWidth: 1 }} />
      </g>
      <circle cx={hx} cy={hy} r={5.4} fill={shade(c, 0.15)} stroke={INK} strokeWidth="1" />
      <circle cx={hx - 1.6} cy={hy - 1.6} r={1.6} fill={shade(c, 0.6)} opacity="0.7" />
      {c === p.accent && <circle cx={hx} cy={hy} r={11} fill={c} opacity="0.18" />}
    </g>
  );
}

/** Capsule outline on the top plane z, along x. */
function capsule(cx: number, cy: number, len: number, r: number, z: number): P3[] {
  const out: P3[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = -Math.PI / 2 + (i / 16) * Math.PI;
    out.push([cx + len / 2 + Math.cos(a) * r, cy + Math.sin(a) * r, z]);
  }
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI / 2 + (i / 16) * Math.PI;
    out.push([cx - len / 2 + Math.cos(a) * r, cy + Math.sin(a) * r, z]);
  }
  return out;
}

function Stars() {
  const out: ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const dur = [2, 4, 8][i % 3];
    out.push(
      <rect key={i} x={rand(i * 3.3) * 1200} y={rand(i * 7.1) * 380} width="2" height="2" fill="#ffffff">
        <animate attributeName="opacity" values="0.1;0.8;0.1" dur={`${dur}s`} begin={`-${(rand(i * 5.1) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </rect>,
    );
  }
  return <g>{out}</g>;
}

export default function RolloutNetwork(p: P) {
  const light = parseInt(p.skyTop.slice(1, 3), 16) > 0x99;
  // Hub (console) 6..10 × 6..10; DEV back-right; STAGING back-left; PROD front.
  const hub = { x: 6, y: 6, w: 4, d: 4 };
  const dev = { x: 13, y: 1.5, w: 3.6, d: 3.6 };
  const stg = { x: 1.5, y: 13, w: 3.6, d: 3.6 };
  const prod = { x: 13, y: 13, w: 5.2, d: 5.2 };

  // Cables in screen space (bezier between platform edges at deck height).
  const cable = (a: P3, b: P3, sag = 30) => {
    const [x1, y1] = S(a);
    const [x2, y2] = S(b);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 + sag;
    return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  };
  const cables = [
    { d: cable([10, 7.5, -0.3], [13, 3.5, -0.3]), c: p.dev, dur: 2 },
    { d: cable([7.5, 10, -0.3], [3.5, 13, -0.3]), c: p.staging, dur: 2 },
    { d: cable([10, 10, -0.3], [13.4, 13.4, -0.3], 16), c: p.accent, dur: 1 },
  ];

  // Console desk + giant toggle on its top face
  const desk = { x: 6.9, y: 7, w: 2.6, d: 2.1, h: 1.1 };
  const tz = desk.h + 0.001;
  const tcx = desk.x + desk.w / 2 + 0.05;
  const tcy = desk.y + desk.d / 2 + 0.15;
  const knobOn: P3 = [tcx + 0.55, tcy, tz];
  const [kx, ky] = S(knobOn);
  const [px, py] = S([prod.x + prod.w / 2, prod.y + prod.d / 2, 0]);

  // PROD crowd: 4 × 3 users; the first 3 are always on (25%).
  const users: { x: number; y: number; i: number }[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) users.push({ x: prod.x + 1.9 + c * 0.82, y: prod.y + 1.5 + r * 1.1, i: r * 4 + c });
  const alwaysOn = new Set([0, 5, 10]);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="rn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <linearGradient id="rn-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.staging} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.staging} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rn-beam2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.dev} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.dev} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rn-pillar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="rn-flash">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.3" stopColor={p.accent} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <pattern id="rn-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1.1" fill={light ? '#000000' : '#F0FFE0'} opacity={light ? 0.12 : 0.1} />
        </pattern>
        <filter id="rn-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="rn-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="rn-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      {/* ── Backdrop ── */}
      <rect width="1200" height="900" fill="url(#rn-sky)" />
      <rect width="1200" height="900" fill="url(#rn-dots)" />
      {!light && <Stars />}
      {/* Laser fan sweeping from the top */}
      <g style={{ mixBlendMode: light ? 'multiply' : 'screen' }} opacity={light ? 0.35 : 0.5}>
        {[-40, -25, -10, 5, 20, 35].map((a, i) => (
          <g key={i} transform={`rotate(${a} 600 -40)`}>
            <rect x="598" y="-40" width="4" height="1300" fill={`url(#${i % 2 ? 'rn-beam2' : 'rn-beam'})`}>
              <animateTransform attributeName="transform" type="rotate" values={`-6 600 -40;6 600 -40;-6 600 -40`} dur={i % 2 ? '8s' : '4s'} repeatCount="indefinite" {...spline} />
            </rect>
          </g>
        ))}
      </g>
      {/* Haze */}
      <ellipse cx="300" cy="700" rx="340" ry="90" fill={p.staging} opacity="0.12" filter="url(#rn-soft)">
        <animateTransform attributeName="transform" type="translate" values="0 0;60 -10;0 0" dur="8s" repeatCount="indefinite" {...spline} />
      </ellipse>
      <ellipse cx="920" cy="320" rx="300" ry="80" fill={p.dev} opacity="0.1" filter="url(#rn-soft)">
        <animateTransform attributeName="transform" type="translate" values="0 0;-50 8;0 0" dur="8s" repeatCount="indefinite" {...spline} />
      </ellipse>
      {/* Moment: a soft full-frame flash */}
      <rect width="1200" height="900" fill={p.accent} opacity="0">
        <animate attributeName="opacity" values="0;0;0.16;0.02;0.08;0;0" keyTimes={`0;${MOMENT - 0.005};${MOMENT + 0.005};${MOMENT + 0.02};${MOMENT + 0.03};${MOMENT + 0.07};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
      </rect>

      {/* ── World (gentle float) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur={`${LOOP / 2}s`} repeatCount="indefinite" {...spline} />
        <g transform={`translate(${OX} ${OY})`}>

        <Platform {...hub} p={p} glow={p.accent} label="FLAGS" />
        <Platform {...dev} p={p} glow={p.dev} label="DEV" />
        <Platform {...stg} p={p} glow={p.staging} label="STAGING" />

        {/* Cables + travelling flag packets */}
        {cables.map((c, i) => (
          <g key={i}>
            <path d={c.d} fill="none" stroke={shade(p.platform, -0.5)} strokeWidth="7" strokeLinecap="round" />
            <path d={c.d} fill="none" stroke={c.c} strokeWidth="2.5" strokeLinecap="round" filter="url(#rn-glow)" strokeDasharray="10 8">
              <animate attributeName="stroke-dashoffset" values="36;0" dur="1s" repeatCount="indefinite" />
            </path>
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <animateMotion dur={`${c.dur}s`} begin={`-${((k / 3) * c.dur).toFixed(2)}s`} repeatCount="indefinite" path={c.d} />
                <rect x="-6" y="-6" width="12" height="12" rx="2" transform="scale(1 0.6) rotate(45)" fill={c.c} stroke={INK} strokeWidth="1" filter="url(#rn-glow)" />
              </g>
            ))}
          </g>
        ))}

        {/* ── Hub: console desk with the giant toggle ── */}
        <polygon points={poly([[desk.x, desk.y + desk.d, 0.01], [desk.x + desk.w, desk.y + desk.d, 0.01], [desk.x + desk.w + 0.8, desk.y + desk.d + 1.2, 0.01], [desk.x + 0.8, desk.y + desk.d + 1.2, 0.01]])} fill="#000" opacity="0.35" filter="url(#rn-blur)" />
        {/* rollout monitor behind the desk */}
        <g>
          <IsoBox x={desk.x - 0.15} y={desk.y + 0.1} z={desk.h} w={0.18} d={1.9} h={1.5} color={p.rack} u={U} ink={ink} />
        </g>
        {(() => {
          const fx = desk.x + 0.03;
          const pl = (a: number, b: number, z0: number, z1: number) => poly([[fx, a, z0], [fx, b, z0], [fx, b, z1], [fx, a, z1]]);
          const y0 = desk.y + 0.25;
          return (
            <g>
              <polygon points={pl(y0, y0 + 1.6, desk.h + 0.15, desk.h + 1.35)} fill={shade(p.rack, -0.5)} />
              {[0, 1, 2, 3].map((k) => {
                const a = y0 + 1.45 - k * 0.38;
                return (
                  <g key={k}>
                    <polygon points={pl(a - 0.3, a, desk.h + 0.25, desk.h + 0.55)} fill={shade(p.platform, 0.1)} opacity="0.6" />
                    <polygon points={pl(a - 0.3, a, desk.h + 0.25, desk.h + 0.55)} fill={p.accent} opacity={k === 0 ? 1 : 0}>
                      {k > 0 && <animate attributeName="opacity" values={afterMoment().values} keyTimes={afterMoment().keyTimes.replace(`${MOMENT};${MOMENT + 0.01}`, `${MOMENT + k * 0.012};${MOMENT + k * 0.012 + 0.01}`)} dur={`${LOOP}s`} repeatCount="indefinite" />}
                    </polygon>
                  </g>
                );
              })}
              {/* readout: text in the monitor's plane (faces down-right) */}
              {[p.rolloutFrom, p.rolloutTo].map((t, k) => {
                const [tx, ty] = S([fx, y0 + 1.5, desk.h + 0.72]);
                const anim = afterMoment();
                return (
                  <g key={k} transform={`translate(${tx} ${ty}) matrix(${C30}, -0.5, 0, 1, 0, 0)`}>
                    <text x="0" y="0" fontFamily="'Press Start 2P', monospace" fontSize="13" fill={p.accent} opacity={k === 0 ? 1 : 0} filter="url(#rn-glow)">
                      {t}
                      <animate attributeName="opacity" values={k === 0 ? '1;1;0;0;1' : anim.values} keyTimes={anim.keyTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}
        <g>
          <IsoBox x={desk.x} y={desk.y} w={desk.w} d={desk.d} h={desk.h} color={shade(p.platform, -0.15)} u={U} ink={ink} />
        </g>
        {/* sign on the desk's front-left face */}
        {(() => {
          const [sx, sy] = S([desk.x + 0.3, desk.y + desk.d, 0.38]);
          return (
            <g transform={`translate(${sx} ${sy}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
              <rect x={-6} y={-17} width={p.sign.length * 13 + 14} height={24} rx={4} fill={shade(p.platform, -0.55)} />
              <text x="0" y="0" fontFamily="'Press Start 2P', monospace" fontSize="12" fill={p.accent} filter="url(#rn-glow)">
                {p.sign}
                <animate attributeName="opacity" values="1;1;0.3;1;0.4;1;1" keyTimes="0;0.8;0.81;0.83;0.84;0.86;1" dur={`${LOOP}s`} repeatCount="indefinite" />
              </text>
            </g>
          );
        })()}
        {/* toggle housing + glowing track on top */}
        <polygon points={poly(capsule(tcx, tcy, 1.2, 0.52, tz))} fill={shade(p.rack, -0.2)} stroke={INK} strokeWidth="1.2" />
        <polygon points={poly(capsule(tcx, tcy, 1.1, 0.4, tz + 0.02))} fill={p.accent} filter="url(#rn-glow)">
          <animate attributeName="opacity" values="0.85;1;0.85" dur="1s" repeatCount="indefinite" />
        </polygon>
        {/* knob (ON) with a click pulse at the moment */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 0;0 3;0 0;0 0"
            keyTimes={`0;${MOMENT - 0.02};${MOMENT};${MOMENT + 0.02};1`}
            dur={`${LOOP}s`}
            repeatCount="indefinite"
          />
          <IsoCylinder x={knobOn[0]} y={knobOn[1]} z={tz} r={0.34} h={0.22} color={p.ink === '#111111' ? '#FFFFFF' : '#F0FFE0'} u={U} ink={ink} />
        </g>
        <ellipse cx={kx} cy={ky - 0.22 * U} rx="14" ry="8" fill="none" stroke={p.accent} strokeWidth="2.5" opacity="0">
          <animate attributeName="rx" values="14;14;80" keyTimes={`0;${MOMENT};${MOMENT + 0.12}`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values="8;8;46" keyTimes={`0;${MOMENT};${MOMENT + 0.12}`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={`0;${MOMENT - 0.001};${MOMENT};${MOMENT + 0.12};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
        {/* beacon above the hub: spinning ring in the ground plane */}
        {(() => {
          const [bx, by] = S([9.6, 6.4, 0]);
          return (
            <g>
              <IsoCylinder x={9.6} y={6.4} r={0.1} h={2.6} color={shade(p.platform, 0.1)} u={U} ink={ink} />
              <g transform={`translate(${bx} ${by - 2.7 * U}) scale(1 0.5)`}>
                <g>
                  <animateTransform attributeName="transform" type="rotate" values="0;360" dur="2s" repeatCount="indefinite" />
                  <circle r="16" fill="none" stroke={p.dev} strokeWidth="3" strokeDasharray="14 10" />
                  <circle cx="16" r="4" fill={p.dev} filter="url(#rn-glow)" />
                </g>
              </g>
              <circle cx={bx} cy={by - 2.7 * U} r="5" fill={p.accent} filter="url(#rn-glow)">
                <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })()}

        {/* ── DEV + STAGING racks ── */}
        <Rack x={13.6} y={2} h={1.8} p={p} led={p.dev} seed={1} />
        <Rack x={15.1} y={2.2} h={1.3} p={p} led={p.dev} seed={2} />
        <Rack x={2} y={13.6} h={1.3} p={p} led={p.staging} seed={3} />
        <Rack x={3.5} y={13.6} h={1.8} p={p} led={p.staging} seed={4} />
        {/* DEV laptop-ish terminal on a crate */}
        <g>
          <IsoBox x={14} y={3.6} w={1} d={0.7} h={0.4} color={shade(p.platform, 0.12)} u={U} ink={ink} />
          <IsoBox x={2.4} y={15.6} w={1.2} d={0.6} h={0.35} color={shade(p.platform, 0.12)} u={U} ink={ink} />
        </g>

        {/* ── PROD (front) ── */}
        <Platform {...prod} p={p} glow={p.accent} label="PROD" pillW={0} tagRight />
        <Rack x={prod.x + 0.35} y={prod.y + 3.3} h={2.2} p={p} led={p.accent} seed={5} />
        {/* pillar of light that fires at the moment */}
        <rect x={px - 70} y={py - 520} width="140" height="520" fill="url(#rn-pillar)" opacity="0">
          <animate attributeName="opacity" values="0;0;1;0.25;0" keyTimes={`0;${MOMENT};${MOMENT + 0.02};${MOMENT + 0.2};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
        </rect>
        {users.map((u) => (
          <g key={u.i}>
            <g transform={`translate(0 0)`}>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0;0 0;0 -10;0 0;0 0"
                keyTimes={`0;${MOMENT + 0.0012 * u.i};${MOMENT + 0.0012 * u.i + 0.025};${MOMENT + 0.0012 * u.i + 0.05};1`}
                dur={`${LOOP}s`}
                repeatCount="indefinite"
              />
              <User x={u.x} y={u.y} c={alwaysOn.has(u.i) ? p.accent : p.userDim} p={p} />
              {!alwaysOn.has(u.i) && (
                <g opacity="0">
                  <animate attributeName="opacity" values={afterMoment().values} keyTimes={afterMoment().keyTimes.replace(`${MOMENT};${MOMENT + 0.01}`, `${MOMENT + 0.0012 * u.i};${MOMENT + 0.0012 * u.i + 0.005}`)} dur={`${LOOP}s`} repeatCount="indefinite" />
                  <User x={u.x} y={u.y} c={p.accent} p={p} />
                </g>
              )}
            </g>
          </g>
        ))}
        {/* shock ring on PROD's deck */}
        <ellipse cx={px} cy={py} rx="20" ry="11" fill="none" stroke={p.accent} strokeWidth="3" opacity="0">
          <animate attributeName="rx" values="20;20;190" keyTimes={`0;${MOMENT};${MOMENT + 0.14}`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values="11;11;105" keyTimes={`0;${MOMENT};${MOMENT + 0.14}`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes={`0;${MOMENT - 0.001};${MOMENT};${MOMENT + 0.14};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
        <circle cx={px} cy={py - 40} r="160" fill="url(#rn-flash)" opacity="0">
          <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes={`0;${MOMENT - 0.001};${MOMENT + 0.005};${MOMENT + 0.08};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        </g>
      </g>
    </svg>
  );
}
