import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Stream Line',
  description:
    'Landing-page hero: Halfstream as an isometric process machine. Producer hoppers feed red message cubes onto three partition conveyors that run through broker cabinets with blinking LED racks and spinning fans, out to consumer terminals. A wall bill meter rests at 50%. Once per loop a broker pages red, then heals.',
  tags: ['hero', 'isometric', 'kafka', 'machine', 'animated svg'],
};

// Every SMIL duration divides 6 s (6, 3, 2, 1.5, 1, 0.5).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Blade sign').default('HALFSTREAM'),
  topic: text('Topic label').default('topic: orders · 3 partitions · rf 3'),
  rate: text('Throughput').default('1.2M msg/s'),
  meter: text('Meter label').default('MONTHLY BILL'),
  wall: color('Wall').default('#F5F5F0'),
  floor: color('Floor').default('#E6E6E1'),
  cabinet: color('Cabinets').default('#F2F2EE'),
  panel: color('Faceplates').default('#1A1A1E'),
  accent: color('Messages + signal').default('#E3000F'),
  grey: color('Secondary').default('#8C8C88'),
  led: color('Status LEDs').default('#3DDC84'),
  ink: color('Outline').default('#0A0A0A'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { wall: '#111114', floor: '#1E1E23', cabinet: '#3A3A42', panel: '#0A0A0C', grey: '#6E6E78', ink: '#050506', led: '#5CFF9D' },
  blueprint: { wall: '#0F3B8C', floor: '#134AA8', cabinet: '#EAF2FF', panel: '#0B2457', accent: '#FFDD00', grey: '#7FB2FF', ink: '#061A40', led: '#7FFFD4' },
  'cherry-cola': { wall: '#2A0A10', floor: '#3F1019', cabinet: '#F5C6AA', panel: '#1A0408', accent: '#E3173E', grey: '#B07A6A', ink: '#120205', led: '#F7B32B' },
  bauhaus: { wall: '#F2EBDD', floor: '#E4D9C4', cabinet: '#F7F2E8', panel: '#1D4E9E', accent: '#D9381E', grey: '#B9A98A', ink: '#111111', led: '#F2B90F' },
};

type P = z.infer<typeof schema>;

const U = 43;
const LOOP = scene.loop;
const OX = 552;
const OY = 262;
/** The page: broker-2 alarms with a double flash peaking at ~0.555 of the loop, then heals. */
const KT = '0;0.53;0.545;0.57;0.59;0.68;1';
const C30 = Math.cos(Math.PI / 6);
const LANES = [2.2, 5.5, 8.8];
const BELT_Z = 0.32;
const CAB = { x: 6, w: 2.6, d: 2.3, h: 3.1 };

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Readable text colour on the wall. */
const txt = (p: P) => (isDark(p.wall) ? shade(p.wall, 0.85) : p.ink);

/** Soft cast shadow toward +y (light from the upper left). */
function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.45;
  return <polygon points={poly([[x, y + d, 0.01], [x + w, y + d, 0.01], [x + w + l * 0.35, y + d + l, 0.01], [x + l * 0.35, y + d + l, 0.01]])} fill="#000" opacity="0.18" filter="url(#sl-blur)" />;
}

/** A conveyor segment along x with a moving belt texture. */
function Belt({ x, w, yc, p }: { x: number; w: number; yc: number; p: P }) {
  const y = yc - 0.62;
  const d = 1.24;
  const step = 0.5;
  const n = Math.floor((w - step) / step);
  const [dx, dy] = S([step, 0, 0]);
  return (
    <g>
      <IsoBox x={x} y={y} w={w} d={d} h={BELT_Z} color={p.grey} u={U} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      <polygon points={poly([[x + 0.05, y + 0.12, BELT_Z + 0.005], [x + w - 0.05, y + 0.12, BELT_Z + 0.005], [x + w - 0.05, y + d - 0.12, BELT_Z + 0.005], [x + 0.05, y + d - 0.12, BELT_Z + 0.005]])} fill={shade(p.panel, 0.12)} />
      <g stroke={shade(p.panel, 0.4)} strokeWidth="1.4">
        <animateTransform attributeName="transform" type="translate" values={`0 0;${dx.toFixed(2)} ${dy.toFixed(2)}`} dur="0.5s" repeatCount="indefinite" />
        {Array.from({ length: n }, (_, i) => (
          <polyline key={i} points={poly([[x + 0.1 + i * step, y + 0.14, BELT_Z + 0.01], [x + 0.1 + i * step, y + d - 0.14, BELT_Z + 0.01]])} fill="none" />
        ))}
      </g>
      {/* roller caps on the near side */}
      {Array.from({ length: Math.floor(w / 1.2) }, (_, i) => {
        const [cx, cy] = S([x + 0.5 + i * 1.2, y + d, BELT_Z * 0.5]);
        return <circle key={i} cx={cx} cy={cy} r="3" fill={shade(p.grey, -0.4)} />;
      })}
    </g>
  );
}

/** A stream of message cubes sliding from x0 to x1 along a lane. */
function Cubes({ x0, x1, yc, p, seed, count = 4 }: { x0: number; x1: number; yc: number; p: P; seed: number; count?: number }) {
  const s = 0.5;
  const [dx, dy] = S([x1 - x0, 0, 0]);
  const dur = 2;
  return (
    <g>
      {Array.from({ length: count }, (_, k) => {
        const begin = `-${((k / count) * dur + seed * 0.13).toFixed(2)}s`;
        const dark = (k + seed) % 4 === 0;
        return (
          <g key={k} opacity="0">
            <animateTransform attributeName="transform" type="translate" values={`0 0;${dx.toFixed(2)} ${dy.toFixed(2)}`} dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.9;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
            <IsoBox x={x0} y={yc - s / 2} z={BELT_Z} w={s} d={s} h={s} color={dark ? shade(p.panel, 0.25) : p.accent} u={U} ink={{ stroke: p.ink, strokeWidth: 1 }} />
          </g>
        );
      })}
    </g>
  );
}

/** Producer: a hopper on a plinth that feeds the belt. */
function Producer({ yc, p, i }: { yc: number; p: P; i: number }) {
  const x = 0.2;
  const y = yc - 0.85;
  const [lx, ly] = S([x + 0.2, y + 1.7, 0.9]);
  return (
    <g>
      <Shadow x={x} y={y} w={1.5} d={1.7} h={2.6} />
      <IsoBox x={x} y={y} w={1.5} d={1.7} h={1.8} color={p.cabinet} u={U} ink={{ stroke: p.ink }} />
      {/* hopper funnel: an inverted frustum on top */}
      <polygon points={poly([[x - 0.2, y + 1.9, 2.7], [x + 1.7, y + 1.9, 2.7], [x + 1.25, y + 1.45, 1.8], [x + 0.25, y + 1.45, 1.8]])} fill={shade(p.accent, -0.25)} stroke={p.ink} strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={poly([[x + 1.7, y - 0.2, 2.7], [x + 1.7, y + 1.9, 2.7], [x + 1.25, y + 1.45, 1.8], [x + 1.25, y + 0.25, 1.8]])} fill={shade(p.accent, -0.05)} stroke={p.ink} strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={poly([[x - 0.2, y - 0.2, 2.7], [x + 1.7, y - 0.2, 2.7], [x + 1.7, y + 1.9, 2.7], [x - 0.2, y + 1.9, 2.7]])} fill={shade(p.accent, 0.15)} stroke={p.ink} strokeWidth="1.1" />
      {/* cubes heaped inside the hopper */}
      {[0, 1, 2].map((k) => {
        const [cx, cy] = S([x + 0.45 + k * 0.4, y + 0.6 + (k % 2) * 0.4, 2.72]);
        return <rect key={k} x={cx - 5} y={cy - 5} width="10" height="8" fill={k === 1 ? p.panel : shade(p.accent, -0.35)} />;
      })}
      {/* label plate on the left face */}
      <g transform={`translate(${lx.toFixed(1)} ${ly.toFixed(1)}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
        <rect x="-2" y="-20" width="48" height="24" fill={p.panel} />
        <text x="4" y="-1" fontFamily={FONTS.vt323} fontSize="22" fill={p.led}>
          P-{i}
        </text>
      </g>
    </g>
  );
}

/** Broker cabinet straddling a lane: LED rack, fan, beacon. */
function Broker({ yc, p, i }: { yc: number; p: P; i: number }) {
  const { x, w, d, h } = CAB;
  const y = yc - d / 2;
  const face = y + d;
  const [fx, fy] = S([x + w / 2, y + d / 2, h]);
  const [bx, by] = S([x + 0.45, y + 0.45, h]);
  const [tx, ty] = S([x + 0.15, face, 2.75]);
  const hurt = i === 1;
  const kt = KT;
  return (
    <g>
      <Shadow x={x} y={y} w={w} d={d} h={h} />
      <IsoBox x={x} y={y} w={w} d={d} h={h} color={p.cabinet} u={U} ink={{ stroke: p.ink }} />
      {/* tunnel mouth where the belt enters / leaves */}
      <IsoWindow face="left" plane={face} a={x + 0.25} z={0} w={w - 0.5} h={0.95} fill={shade(p.panel, 0.05)} u={U} ink={{ stroke: p.ink }} />
      {/* faceplate + LED rack */}
      <IsoWindow face="left" plane={face} a={x + 0.15} z={1.2} w={w - 0.3} h={1.55} fill={p.panel} u={U} ink={{ stroke: p.ink }} />
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => {
          const seed = i * 31 + r * 7 + c;
          const red = c === 6;
          return (
            <IsoWindow key={`${r}-${c}`} face="left" plane={face + 0.01} a={x + 0.35 + c * 0.3} z={1.42 + r * 0.42} w={0.16} h={0.16} fill={red ? p.accent : p.led} u={U} ink={{ strokeWidth: 0 }}>
              {hurt && !red ? (
                <animate attributeName="fill" values={`${p.led};${p.led};${p.accent};${p.led};${p.accent};${p.led};${p.led}`} keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
              ) : null}
              <Flicker dur={[1, 1.5, 2, 3][seed % 4]} seed={seed} low={0.3} />
            </IsoWindow>
          );
        }),
      )}
      {/* stencil label */}
      <g transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
        <text x="4" y="-6" fontFamily={FONTS.vt323} fontSize="20" fill={shade(p.cabinet, -0.6)} letterSpacing="1">
          BROKER-{i + 1}
        </text>
      </g>
      {/* vents on the right face */}
      {[0.6, 1.0, 1.4, 1.8].map((zz) => (
        <polyline key={zz} points={poly([[x + w, y + 0.35, zz + 0.6], [x + w, y + d - 0.35, zz + 0.6]])} stroke={shade(p.cabinet, -0.45)} strokeWidth="2" fill="none" />
      ))}
      {/* top fan */}
      <ellipse cx={fx} cy={fy} rx={0.95 * U * 1.22 * 0.6} ry={0.95 * U * 0.7 * 0.6} fill={shade(p.panel, 0.1)} stroke={p.ink} strokeWidth="1.1" />
      <g transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(1 0.577)`}>
        <g>
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur={i === 1 ? '0.5s' : '1s'} repeatCount="indefinite" />
          {[0, 90, 180, 270].map((a) => (
            <path key={a} transform={`rotate(${a})`} d="M0,0 C6,-6 20,-6 26,-2 C20,2 8,4 0,0 Z" fill={shade(p.cabinet, -0.1)} />
          ))}
          <circle r="4" fill={p.grey} />
        </g>
      </g>
      {/* beacon: ink when calm, red double-flash on the page */}
      <IsoCylinder x={x + 0.45} y={y + 0.45} z={h} r={0.16} h={0.28} color={shade(p.grey, -0.2)} u={U} ink={{ stroke: p.ink }} />
      <circle cx={bx} cy={by - 0.36 * U} r="6" fill={hurt ? p.led : p.led} stroke={p.ink} strokeWidth="1">
        {hurt && <animate attributeName="fill" values={`${p.led};${p.led};${p.accent};${p.accent};${p.accent};${p.led};${p.led}`} keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />}
      </circle>
      {hurt && (
        <ellipse cx={bx + 30} cy={by + 40} rx="120" ry="90" fill={p.accent} opacity="0" filter="url(#sl-blur)" style={{ mixBlendMode: 'multiply' }}>
          <animate attributeName="opacity" values="0;0;0.45;0.1;0.4;0;0" keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
      )}
      {hurt && (
        <circle cx={bx} cy={by - 0.36 * U} r="10" fill="none" stroke={p.accent} strokeWidth="3" opacity="0">
          <animate attributeName="r" values="8;8;8;40;8;60;60" keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;0.9;0;0.9;0;0" keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

/** Consumer terminal at the end of a lane, with a screen that ticks. */
function Consumer({ yc, p, i }: { yc: number; p: P; i: number }) {
  const x = 13.1;
  const y = yc - 0.85;
  const face = y + 1.7;
  return (
    <g>
      <Shadow x={x} y={y} w={1.5} d={1.7} h={2.2} />
      <IsoBox x={x} y={y} w={1.5} d={1.7} h={1.9} color={p.cabinet} u={U} ink={{ stroke: p.ink }} />
      <IsoWindow face="left" plane={face} a={x + 0.18} z={0.8} w={1.14} h={0.85} fill={p.panel} u={U} ink={{ stroke: p.ink }} />
      {[0, 1, 2].map((r) => (
        <IsoWindow key={r} face="left" plane={face + 0.01} a={x + 0.3} z={1.0 + r * 0.2} w={0.4 + ((r + i) % 3) * 0.2} h={0.08} fill={p.led} u={U} ink={{ strokeWidth: 0 }}>
          <animate attributeName="opacity" values="1;0.2;1" dur={['1s', '1.5s', '2s'][(r + i) % 3]} repeatCount="indefinite" />
        </IsoWindow>
      ))}
      {/* intake slot on the back face where cubes arrive */}
      <IsoWindow face="right" plane={x} a={y + 0.5} z={BELT_Z} w={0.7} h={0.6} fill={shade(p.panel, 0.05)} u={U} ink={{ stroke: p.ink }} />
      {/* ack lamp */}
      <IsoCylinder x={x + 1.1} y={y + 0.4} z={1.9} r={0.12} h={0.18} color={p.grey} u={U} ink={{ stroke: p.ink }} />
    </g>
  );
}

/** Hanging cable from the ceiling down to a cabinet, swaying slightly. */
function Cable({ from, to, p, k }: { from: [number, number]; to: [number, number]; p: P; k: number }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const a = `M${x1},${y1} C${mx - 30},${y1 + 60} ${x2 - 20},${y2 - 90} ${x2},${y2}`;
  const b = `M${x1},${y1} C${mx - 22},${y1 + 66} ${x2 - 12},${y2 - 84} ${x2},${y2}`;
  return (
    <path d={a} fill="none" stroke={p.ink} strokeWidth="3" opacity="0.75">
      <animate attributeName="d" values={`${a};${b};${a}`} dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
    </path>
  );
}

function BillMeter({ p }: { p: P }) {
  const cx = 1000;
  const cy = 210;
  const r = 104;
  const arc = (from: number, to: number, rr: number) => {
    const a0 = Math.PI + from * Math.PI;
    const a1 = Math.PI + to * Math.PI;
    return `M${cx + Math.cos(a0) * rr},${cy + Math.sin(a0) * rr} A${rr},${rr} 0 0 1 ${cx + Math.cos(a1) * rr},${cy + Math.sin(a1) * rr}`;
  };
  return (
    <g>
      {/* bracket + plate */}
      <rect x={cx - r - 26} y={cy - r - 58} width={2 * r + 52} height={r + 112} fill={p.cabinet} stroke={p.ink} strokeWidth="2" />
      <rect x={cx - r - 26} y={cy - r - 58} width={2 * r + 52} height="30" fill={p.ink} />
      <text x={cx - r - 14} y={cy - r - 36} fontFamily={FONTS.vt323} fontSize="24" letterSpacing="2" fill={p.cabinet}>
        {p.meter}
      </text>
      <circle cx={cx + r + 10} cy={cy - r - 43} r="5" fill={p.accent}>
        <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
      </circle>
      <path d={arc(0, 1, r)} fill="none" stroke={p.grey} strokeWidth="22" opacity="0.45" />
      <path d={arc(0, 0.5, r)} fill="none" stroke={p.accent} strokeWidth="22" />
      {Array.from({ length: 11 }, (_, i) => {
        const a = Math.PI + (i / 10) * Math.PI;
        const l = i % 5 === 0 ? 22 : 10;
        return <line key={i} x1={cx + Math.cos(a) * (r - 18)} y1={cy + Math.sin(a) * (r - 18)} x2={cx + Math.cos(a) * (r - 18 - l)} y2={cy + Math.sin(a) * (r - 18 - l)} stroke={p.ink} strokeWidth={i % 5 === 0 ? 3 : 1.5} />;
      })}
      <text x={cx - r} y={cy + 30} fontFamily={FONTS.vt323} fontSize="22" fill={p.ink}>
        $0
      </text>
      <text x={cx + r - 34} y={cy + 30} fontFamily={FONTS.vt323} fontSize="22" fill={p.ink}>
        MSK
      </text>
      {/* needle resting at 50% with a nervous little settle */}
      <g transform={`translate(${cx} ${cy})`}>
        <g>
          <animateTransform attributeName="transform" type="rotate" values="0;3;-2;1;0;0" keyTimes="0;0.1;0.2;0.3;0.4;1" dur="3s" repeatCount="indefinite" />
          <path d={`M-5,0 L0,${-(r - 30)} L5,0 Z`} fill={p.ink} />
          <circle r="9" fill={p.ink} />
          <circle r="3.5" fill={p.accent} />
        </g>
      </g>
      <text x={cx} y={cy + 76} textAnchor="middle" fontFamily={FONTS.bungee} fontSize="40" fill={p.accent}>
        −50%
      </text>
    </g>
  );
}

function BladeSign({ p }: { p: P }) {
  const letters = p.sign.slice(0, 12).split('');
  const x = 84;
  const y = 70;
  const lh = 31;
  const h = letters.length * lh + 30;
  return (
    <g>
      <line x1={x - 30} y1={y + 10} x2={x + 6} y2={y + 10} stroke={p.ink} strokeWidth="4" />
      <line x1={x - 30} y1={y + h - 20} x2={x + 6} y2={y + h - 20} stroke={p.ink} strokeWidth="4" />
      <rect x={x} y={y} width="58" height={h} fill={p.accent} stroke={p.ink} strokeWidth="2.5" />
      <g filter="url(#sl-glow)">
        {letters.map((c, i) => (
          <text key={i} x={x + 29} y={y + 40 + i * lh} textAnchor="middle" fontFamily={FONTS.bungee} fontSize="28" fill={isDark(p.accent) ? '#F5F5F0' : '#0A0A0A'}>
            {c}
            {i === 6 && <animate attributeName="opacity" values="1;1;0.2;1;0.3;1;1" keyTimes="0;0.4;0.41;0.43;0.44;0.46;1" dur={`${LOOP}s`} repeatCount="indefinite" />}
          </text>
        ))}
      </g>
      {/* topic + live rate */}
      <text x={x + 84} y={y + 26} fontFamily={FONTS.vt323} fontSize="26" letterSpacing="1.5" fill={txt(p)}>
        {p.topic.toUpperCase()}
      </text>
      <text x={x + 84} y={y + 72} fontFamily={FONTS.bungee} fontSize="40" fill={txt(p)}>
        {p.rate}
      </text>
      <rect x={x + 84} y={y + 86} width="14" height="14" fill={p.accent}>
        <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
      </rect>
      <text x={x + 106} y={y + 99} fontFamily={FONTS.vt323} fontSize="22" letterSpacing="1.5" fill={txt(p)}>
        LIVE · 0 LAG
      </text>
    </g>
  );
}

/** Pager on a floor stand that buzzes during the page. */
function PagerPost({ p }: { p: P }) {
  const [gx, gy] = S([9.6, 10.6, 0]);
  const [hx, hy] = S([9.6, 10.6, 1.9]);
  const kt = KT;
  return (
    <g>
      <ellipse cx={gx + 10} cy={gy + 4} rx="26" ry="9" fill="#000" opacity="0.15" filter="url(#sl-blur)" />
      <IsoCylinder x={9.6} y={10.6} r={0.06} h={1.7} color={p.grey} u={U} ink={{ stroke: p.ink }} />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 0;-3 0;3 0;-3 0;3 0;0 0;0 0" keyTimes="0;0.535;0.55;0.565;0.58;0.595;0.61;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        <rect x={hx - 26} y={hy - 22} width="52" height="38" rx="9" fill={p.cabinet} stroke={p.ink} strokeWidth="2" />
        <rect x={hx - 18} y={hy - 15} width="36" height="14" rx="2" fill={p.panel} />
        <rect x={hx - 15} y={hy - 12} width="30" height="8" fill={p.led}>
          <animate attributeName="fill" values={`${p.led};${p.led};${p.accent};${p.accent};${p.accent};${p.led};${p.led}`} keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
        </rect>
        <circle cx={hx + 14} cy={hy + 7} r="4" fill={p.accent} />
      </g>
      {/* the heal: a check pops above the pager */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.68;0.71;0.88;0.92" dur={`${LOOP}s`} repeatCount="indefinite" />
        <circle cx={hx} cy={hy - 52} r="17" fill={p.led} stroke={p.ink} strokeWidth="2" />
        <path d={`M${hx - 8},${hy - 52} l5,6 l10,-12`} fill="none" stroke={p.ink} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}

export default function StreamLine(p: P) {
  const dark = isDark(p.wall);
  const lanes: ReactNode[] = LANES.map((yc, i) => (
    <g key={i}>
      <Producer yc={yc} p={p} i={i} />
      <Belt x={1.7} w={CAB.x - 1.7 + 0.2} yc={yc} p={p} />
      <Cubes x0={1.75} x1={CAB.x - 0.2} yc={yc} p={p} seed={i * 3} />
      <Broker yc={yc} p={p} i={i} />
      <Belt x={CAB.x + CAB.w - 0.2} w={13.1 - (CAB.x + CAB.w - 0.2)} yc={yc} p={p} />
      <Cubes x0={CAB.x + CAB.w} x1={12.7} yc={yc} p={p} seed={i * 3 + 1} />
      <Consumer yc={yc} p={p} i={i} />
    </g>
  ));
  const cableTargets = LANES.map((yc) => {
    const [x, y] = S([CAB.x + CAB.w - 0.4, yc - CAB.d / 2 + 0.3, CAB.h]);
    return [x + OX, y + OY] as [number, number];
  });

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="sl-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, dark ? 0.04 : 0.3)} />
          <stop offset="1" stopColor={shade(p.wall, dark ? -0.2 : -0.06)} />
        </linearGradient>
        <radialGradient id="sl-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.accent} stopOpacity={dark ? 0.22 : 0.1} />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <filter id="sl-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="sl-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Wall: Swiss hairline grid ── */}
      <rect width="1200" height="900" fill="url(#sl-wall)" />
      <g stroke={p.ink} strokeWidth="1" opacity={dark ? 0.12 : 0.07}>
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1={60 + i * 90} y1="0" x2={60 + i * 90} y2="900" />
        ))}
      </g>
      <rect x="0" y="0" width="1200" height="6" fill={p.ink} />
      <BladeSign p={p} />
      <BillMeter p={p} />
      {cableTargets.map((t, k) => (
        <Cable key={k} from={[t[0] - 60 + k * 30, -10]} to={t} p={p} k={k} />
      ))}

      {/* ── Floor ── */}
      <g transform={`translate(${OX} ${OY})`}>
        <ellipse cx={S([7, 5.5, 0])[0]} cy={S([7, 5.5, 0])[1]} rx="560" ry="260" fill="url(#sl-pool)" />
        <IsoBox x={-0.4} y={-0.4} z={-0.45} w={15.4} d={11.8} h={0.45} color={p.floor} u={U} ink={{ stroke: p.ink, strokeWidth: 1.4 }} />
        <IsoGrid x={-0.4} y={-0.4} w={15} d={11} u={U} color={p.ink} opacity={dark ? 0.16 : 0.1} />
        {/* floor lane markings */}
        {LANES.map((yc, i) => {
          const [mx, my] = S([2.2, yc + 0.95, 0.01]);
          return (
            <g key={i} transform={`translate(${mx.toFixed(1)} ${my.toFixed(1)}) matrix(${C30}, 0.5, ${-C30}, 0.5, 0, 0)`}>
              <text x="0" y="0" fontFamily={FONTS.vt323} fontSize="22" fill={isDark(p.floor) ? shade(p.floor, 0.7) : p.ink} opacity="0.6" letterSpacing="1">
                PARTITION {i} →
              </text>
            </g>
          );
        })}
        {lanes}
        <PagerPost p={p} />
        {/* stray floor ticks: the log, painted on the front edge */}
        {Array.from({ length: 22 }, (_, i) => {
          const [a, b] = S([0.2 + i * 0.68, 11.2, 0.01]);
          return <rect key={i} x={a - 4} y={b - 3} width="8" height="6" fill={i % 5 === 2 ? p.accent : p.ink} opacity={i % 5 === 2 ? 0.9 : 0.4} transform={`rotate(30 ${a} ${b})`} />;
        })}
      </g>

      {/* drifting dust motes for air */}
      <g fill={p.ink} opacity={dark ? 0.35 : 0.18}>
        {Array.from({ length: 14 }, (_, i) => {
          const x = 120 + rand(i * 2.7) * 960;
          const y = 220 + rand(i * 5.3) * 560;
          return (
            <circle key={i} cx={x} cy={y} r={1 + rand(i) * 1.6}>
              <animate attributeName="cy" values={`${y};${y - 30};${y}`} dur={`${[3, 6][i % 2]}s`} begin={`-${(rand(i * 9) * 3).toFixed(2)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </g>
    </svg>
  );
}
