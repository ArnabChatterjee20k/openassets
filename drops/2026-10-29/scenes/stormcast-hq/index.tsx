import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Stormcast HQ',
  description:
    'Landing-page hero: Stormcast HQ on a floating stone plaza at night — observation tower with a sweeping radar, glowing windows, neon sign, wind turbine, a drone crossing the moon and a storm rolling in. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'night', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Neon sign').default('STORMCAST'),
  skyTop: color('Sky top').default('#0C0A24'),
  skyBottom: color('Sky bottom').default('#2E2557'),
  stone: color('Plaza stone').default('#6B6F8E'),
  grass: color('Grass').default('#3F6E5E'),
  walls: color('Walls').default('#C7C3DA'),
  roof: color('Roof').default('#3E2F6B'),
  glow: color('Window light').default('#FFC857'),
  glass: color('Tower glass').default('#7FE7FF'),
  neon: color('Neon').default('#FF5C9A'),
  cloud: color('Cloud').default('#3A3560'),
  bolt: color('Lightning').default('#EAF6FF'),
  storm: toggle('Storm (rain + lightning)').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#2B1B3E', skyBottom: '#FF9A62', roof: '#8C2F4C', cloud: '#6B3B5E', neon: '#FFE066', glass: '#FFD7A8' },
  daylight: { skyTop: '#8FCBEF', skyBottom: '#E8F6FB', stone: '#B8B4A6', grass: '#6DBE6A', walls: '#FFFFFF', roof: '#E4572E', cloud: '#FFFFFF', glow: '#FFF4CC', glass: '#BFEFFF', storm: false },
  teal: { skyTop: '#071416', skyBottom: '#17393A', stone: '#4E6A6A', grass: '#2F8C7E', walls: '#D3DEDA', roof: '#16302F', neon: '#D4FF3A', glass: '#D4FF3A', cloud: '#2E4246' },
  calm: { storm: false },
};

type P = z.infer<typeof schema>;

const U = 36; // pixels per world unit
const LOOP = scene.loop;
const OX = 600;
const OY = 250;
const INK = 'rgba(12,10,28,0.6)';
const C30 = Math.cos(Math.PI / 6);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);

/** Ground-plane quad (z slightly above the plaza). */
const groundQuad = (x: number, y: number, w: number, d: number, z = 0.02) => poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]]);

/** Soft cast shadow toward +y (moon is up-right). */
function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.42;
  return <polygon points={poly([[x, y + d, 0.02], [x + w, y + d, 0.02], [x + w + l * 0.3, y + d + l, 0.02], [x + l * 0.3, y + d + l, 0.02]])} fill="#05040f" opacity="0.32" filter="url(#hq-blur)" />;
}

/** Framed window with mullions and a sill on a box face. */
function Win({ face, plane, a, z, w, h, p, seed }: { face: 'left' | 'right'; plane: number; a: number; z: number; w: number; h: number; p: P; seed: number }) {
  const f = 0.09;
  const at = (aa: number, zz: number): P3 => (face === 'left' ? [aa, plane, zz] : [plane, aa, zz]);
  const frame = shade(p.walls, -0.55);
  return (
    <g>
      <IsoWindow face={face} plane={plane} a={a - f} z={z - f} w={w + 2 * f} h={h + 2 * f} fill={frame} u={U} />
      <IsoWindow face={face} plane={plane} a={a} z={z} w={w} h={h} fill={p.glow} u={U} ink={{ strokeWidth: 0 }}>
        <Flicker dur={LOOP} seed={seed} low={0.62} />
      </IsoWindow>
      <polyline points={poly([at(a + w / 2, z), at(a + w / 2, z + h)])} stroke={frame} strokeWidth="1.4" fill="none" />
      <polyline points={poly([at(a, z + h * 0.55), at(a + w, z + h * 0.55)])} stroke={frame} strokeWidth="1.4" fill="none" />
      <IsoWindow face={face} plane={plane + 0.08} a={a - f * 1.6} z={z - f * 1.9} w={w + f * 3.2} h={f * 0.8} fill={shade(p.walls, 0.2)} u={U} />
    </g>
  );
}

/** Light spilling from a left-face window onto the ground. */
function Spill({ a, w, plane, p }: { a: number; w: number; plane: number; p: P }) {
  return <polygon points={poly([[a, plane, 0.03], [a + w, plane, 0.03], [a + w + 0.5, plane + 1.6, 0.03], [a - 0.3, plane + 1.6, 0.03]])} fill={p.glow} opacity="0.22" filter="url(#hq-blur)" />;
}

/** Gable roof with overhang, tile rows, ridge cap and fascia; ridge runs along x. */
function GableRoof({ x, y, z, w, d, h, p }: { x: number; y: number; z: number; w: number; d: number; h: number; p: P }) {
  const ry = y + d / 2;
  const rows = 5;
  return (
    <g>
      <polygon points={poly([[x + w, y, z], [x + w, y + d, z], [x + w, ry, z + h]])} fill={shade(p.walls, -0.2)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={poly([[x + w - 0.02, y + 0.3, z + 0.1], [x + w - 0.02, ry, z + h - 0.25], [x + w - 0.02, y + d - 0.3, z + 0.1]])} fill="none" stroke={shade(p.walls, -0.45)} strokeWidth="1" />
      <polygon points={poly([[x, y + d, z], [x + w, y + d, z], [x + w, ry, z + h], [x, ry, z + h]])} fill={p.roof} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      {Array.from({ length: rows }, (_, i) => {
        const t = (i + 1) / (rows + 1);
        const yy = y + d + (ry - (y + d)) * t;
        return <polyline key={i} points={poly([[x + 0.05, yy, z + h * t], [x + w - 0.05, yy, z + h * t]])} stroke={shade(p.roof, -0.35)} strokeWidth="1.2" fill="none" />;
      })}
      <polyline points={poly([[x - 0.05, ry, z + h + 0.04], [x + w + 0.05, ry, z + h + 0.04]])} stroke={shade(p.roof, 0.35)} strokeWidth="3" strokeLinecap="round" fill="none" />
      <polygon points={poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z - 0.18], [x, y + d, z - 0.18]])} fill={shade(p.roof, -0.45)} stroke={INK} strokeWidth="1" />
    </g>
  );
}

function Tree({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: P }) {
  const [cx, cy] = S([x, y, 0]);
  const tier = (base: number, r: number, hh: number, k: number) => {
    const by = S([x, y, base])[1];
    const rx = r * U * 1.22;
    const ry = r * U * 0.7;
    const top = by - hh * U;
    return (
      <g key={k}>
        <path d={`M${cx - rx},${by} A${rx},${ry} 0 0 0 ${cx + rx},${by} L${cx},${top} Z`} fill={shade(p.grass, -0.25)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <path d={`M${cx},${top} L${cx + rx},${by} A${rx},${ry} 0 0 1 ${cx + rx * 0.2},${by + ry * 0.95} Z`} fill={shade(p.grass, -0.05)} opacity="0.85" />
      </g>
    );
  };
  return (
    <g>
      <ellipse cx={cx - 0.5 * U} cy={cy + 0.25 * U} rx={0.9 * U * s} ry={0.4 * U * s} fill="#05040f" opacity="0.3" filter="url(#hq-blur)" />
      <IsoCylinder x={x} y={y} r={0.1 * s} h={0.6 * s} color="#5A3E33" u={U} ink={{ stroke: INK }} />
      {tier(0.45 * s, 0.75 * s, 1.3 * s, 0)}
      {tier(1.15 * s, 0.55 * s, 1.1 * s, 1)}
    </g>
  );
}

function Bush({ x, y, p }: { x: number; y: number; p: P }) {
  const [cx, cy] = S([x, y, 0]);
  return (
    <g stroke={INK} strokeWidth="1.1">
      <circle cx={cx - 8} cy={cy - 6} r="9" fill={shade(p.grass, -0.15)} />
      <circle cx={cx + 6} cy={cy - 8} r="10" fill={shade(p.grass, -0.05)} />
      <circle cx={cx} cy={cy - 15} r="8" fill={shade(p.grass, 0.08)} />
    </g>
  );
}

function Lamp({ x, y, p, seed }: { x: number; y: number; p: P; seed: number }) {
  const [gx, gy] = S([x, y, 0]);
  const [hx, hy] = S([x, y, 2.1]);
  return (
    <g>
      <ellipse cx={gx} cy={gy} rx={1.6 * U} ry={0.9 * U} fill="url(#hq-pool)">
        <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" begin={`-${seed}s`} repeatCount="indefinite" />
      </ellipse>
      <IsoCylinder x={x} y={y} r={0.05} h={2} color="#2A2640" u={U} ink={{ stroke: INK }} />
      <circle cx={hx} cy={hy} r="9" fill={p.glow} opacity="0.35" filter="url(#hq-glow)" />
      <rect x={hx - 5} y={hy - 6} width="10" height="11" rx="2" fill={p.glow} stroke={INK} strokeWidth="1.2" />
      <path d={`M${hx - 8},${hy - 6} L${hx},${hy - 13} L${hx + 8},${hy - 6} Z`} fill="#2A2640" stroke={INK} strokeWidth="1" />
    </g>
  );
}

function Puddle({ x, y, p, k }: { x: number; y: number; p: P; k: number }) {
  const [cx, cy] = S([x, y, 0.02]);
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={0.8 * U} ry={0.4 * U} fill={shade(p.skyBottom, 0.15)} opacity="0.8" stroke={shade(p.stone, -0.35)} strokeWidth="1" />
      <ellipse cx={cx - 6} cy={cy - 2} rx={0.35 * U} ry={0.12 * U} fill={p.glow} opacity="0.35" />
      {p.storm &&
        [0, 1].map((j) => {
          const begin = `-${((k * 0.37 + j * 0.5) % 1).toFixed(2)}s`;
          return (
            <ellipse key={j} cx={cx + (j ? 8 : -6)} cy={cy + (j ? 2 : -1)} rx="2" ry="1" fill="none" stroke="#ffffff" strokeWidth="1">
              <animate attributeName="rx" values="2;16" dur="1s" begin={begin} repeatCount="indefinite" />
              <animate attributeName="ry" values="1;7" dur="1s" begin={begin} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="1s" begin={begin} repeatCount="indefinite" />
            </ellipse>
          );
        })}
    </g>
  );
}

function Stars() {
  const out: ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const dur = [2, 3, 6][i % 3];
    out.push(
      <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 460} r={0.6 + rand(i * 1.3) * 1.5} fill="#ffffff">
        <animate attributeName="opacity" values="0.2;1;0.2" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

export default function StormcastHQ(p: P) {
  const night = p.storm || !/^#[89a-fA-F]/.test(p.skyTop);
  const flashTimes = '0;0.54;0.55;0.57;0.59;0.62;1';
  const flash = '0;0;1;0.2;0.9;0;0';

  const [twrX, twrY] = S([3, 3, 7.15]); // radar dome base
  const [antX, antY] = S([3.6, 2.6, 7.2]);
  const [turbX, turbY] = S([11, 1.2, 5.2]); // turbine hub (right corner)
  const signAt = S([5.9, 7, 2.56]); // baseline inside the sign plate
  const [wsX, wsY] = S([1.2, 4.6, 0]); // windsock pole
  const [dX, dY] = S([2.3, 8.6, 2]); // garage dish
  const [smX, smY] = S([6.47, 4.27, 5.4]); // chimney top

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="hq-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="hq-halo">
          <stop offset="0" stopColor="#FFF5DC" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#FFF5DC" stopOpacity="0.18" />
          <stop offset="1" stopColor="#FFF5DC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hq-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hq-fog">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hq-dome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor={shade(p.walls, -0.35)} />
        </linearGradient>
        <filter id="hq-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="hq-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="hq-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height="900" fill="url(#hq-sky)" />
      {night && <Stars />}
      <circle cx="990" cy="140" r="150" fill="url(#hq-halo)" />
      <circle cx="990" cy="140" r="50" fill={night ? '#FFF3D6' : '#FFF9E8'} />
      <circle cx="975" cy="126" r="9" fill="#EADCB8" opacity="0.8" />
      <circle cx="1006" cy="152" r="6" fill="#EADCB8" opacity="0.8" />
      <circle cx="992" cy="168" r="4" fill="#EADCB8" opacity="0.8" />
      {/* Drone crossing the moon, nav lights blinking */}
      <g>
        <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path="M760,120 C880,70 1040,90 1180,150" />
        <rect x="-12" y="-3" width="24" height="6" rx="3" fill="#1B1830" />
        <line x1="-18" y1="-6" x2="-6" y2="-6" stroke="#1B1830" strokeWidth="2" />
        <line x1="6" y1="-6" x2="18" y2="-6" stroke="#1B1830" strokeWidth="2" />
        <circle cx="-13" cy="1" r="2.2" fill="#FF4D4D">
          <animate attributeName="opacity" values="1;0.1;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="13" cy="1" r="2.2" fill="#4DFFA0">
          <animate attributeName="opacity" values="0.1;1;0.1" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>
      {p.storm && (
        <rect width="1200" height="900" fill={p.bolt} opacity="0">
          <animate attributeName="opacity" values="0;0;0.12;0.02;0.09;0;0" keyTimes={flashTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
        </rect>
      )}
      <ellipse cx="600" cy="820" rx="600" ry="90" fill="url(#hq-fog)">
        <animate attributeName="rx" values="600;650;600" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
      </ellipse>

      {/* ── Island (bobs gently) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <g transform={`translate(${OX} ${OY})`}>
          {/* Rock underside */}
          <polygon points={poly([[0, 12, -1.4], [12, 12, -1.4], [7, 7, -6.5]])} fill="#262238" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points={poly([[12, 0, -1.4], [12, 12, -1.4], [7, 7, -6.5]])} fill="#363150" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          {/* rock facets + hanging roots */}
          <polyline points={poly([[4, 12, -1.4], [6, 9.5, -4.2], [7, 7, -6.5]])} stroke={INK} strokeWidth="1" fill="none" />
          <polyline points={poly([[12, 5, -1.4], [9.5, 7, -4], [7, 7, -6.5]])} stroke={INK} strokeWidth="1" fill="none" />
          <polygon points={poly([[3, 12, -1.4], [5, 12, -1.4], [4.6, 11, -2.6]])} fill={shade(p.grass, -0.35)} opacity="0.8" />
          <polygon points={poly([[12, 8, -1.4], [12, 9.6, -1.4], [11.2, 9, -2.4]])} fill={shade(p.grass, -0.35)} opacity="0.8" />
          {/* Plaza slab with rim */}
          <IsoBox x={0} y={0} z={-1.4} w={12} d={12} h={1.2} color={shade(p.stone, -0.25)} u={U} top={false} ink={{ stroke: INK }} />
          <IsoBox x={0} y={0} z={-0.2} w={12} d={12} h={0.2} color={p.stone} u={U} ink={{ stroke: INK }} />
          <polygon points={groundQuad(0.6, 0.6, 10.8, 10.8, 0.01)} fill={p.grass} stroke={shade(p.grass, -0.4)} strokeWidth="1" />
          <g stroke={shade(p.stone, -0.3)} strokeWidth="1" opacity="0.6">
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i}>
                <polyline points={poly([[i, 11.4, 0.01], [i, 12, 0.01]])} fill="none" />
                <polyline points={poly([[11.4, i, 0.01], [12, i, 0.01]])} fill="none" />
              </g>
            ))}
          </g>
          {/* Cobbled path to the door */}
          <polygon points={groundQuad(6.6, 7, 1.3, 5, 0.015)} fill={shade(p.stone, 0.12)} stroke={shade(p.stone, -0.3)} strokeWidth="1" />
          {Array.from({ length: 10 }, (_, i) => (
            <polyline key={i} points={poly([[6.6, 7 + i * 0.5, 0.02], [7.9, 7 + i * 0.5, 0.02]])} stroke={shade(p.stone, -0.25)} strokeWidth="1" fill="none" />
          ))}
          <polyline points={poly([[7.25, 7, 0.02], [7.25, 12, 0.02]])} stroke={shade(p.stone, -0.25)} strokeWidth="1" fill="none" />
          {/* Flowers */}
          {Array.from({ length: 18 }, (_, i) => {
            const [fx, fy] = S([1 + rand(i * 2.2) * 4.5, 1 + rand(i * 6.1) * 3.5 + (i % 2) * 6, 0.02]);
            return <circle key={i} cx={fx} cy={fy} r="2.2" fill={['#FF8FB1', '#FFD36B', '#FFFFFF'][i % 3]} opacity="0.9" />;
          })}
          <Puddle x={5.4} y={10.2} p={p} k={0} />
          <Puddle x={9.6} y={8.6} p={p} k={1} />

          <Shadow x={2} y={2} w={2} d={2} h={7} />
          <Shadow x={5.5} y={3} w={4.5} d={4} h={4.6} />
          <Shadow x={1} y={7.5} w={2.6} d={2.2} h={1.8} />

          {/* ── Observation tower ── */}
          <IsoCylinder x={3} y={3} r={0.75} h={5} color={p.walls} u={U} ink={{ stroke: INK }} />
          {[1.2, 2.6].map((zz, i) => {
            const [wx, wy] = S([3.55, 3.45, zz]);
            return (
              <rect key={i} x={wx - 5} y={wy - 9} width="10" height="14" rx="5" fill={p.glow} stroke={INK} strokeWidth="1.1">
                <Flicker dur={LOOP} seed={20 + i} low={0.6} />
              </rect>
            );
          })}
          <IsoBox x={2} y={2} z={5} w={2} d={2} h={1.6} color={shade(p.walls, -0.1)} u={U} ink={{ stroke: INK }} />
          <IsoWindow face="left" plane={4} a={2.15} z={5.25} w={1.7} h={1.1} fill={p.glass} u={U}>
            <animate attributeName="opacity" values="0.75;0.95;0.75" dur="2s" repeatCount="indefinite" />
          </IsoWindow>
          <IsoWindow face="right" plane={4} a={2.15} z={5.25} w={1.7} h={1.1} fill={shade(p.glass, -0.15)} u={U}>
            <animate attributeName="opacity" values="0.7;0.9;0.7" dur="2s" repeatCount="indefinite" />
          </IsoWindow>
          <IsoBox x={1.8} y={1.8} z={6.6} w={2.4} d={2.4} h={0.25} color={p.roof} u={U} ink={{ stroke: INK }} />
          <g stroke={shade(p.walls, -0.55)} strokeWidth="1.4" fill="none">
            {[0, 0.6, 1.2, 1.8, 2.4].map((t) => (
              <g key={t}>
                <polyline points={poly([[1.8 + t, 4.2, 6.85], [1.8 + t, 4.2, 7.3]])} />
                <polyline points={poly([[4.2, 1.8 + t, 6.85], [4.2, 1.8 + t, 7.3]])} />
              </g>
            ))}
            <polyline points={poly([[1.8, 4.2, 7.3], [4.2, 4.2, 7.3], [4.2, 1.8, 7.3]])} />
          </g>
          <path d={`M${twrX - 26},${twrY} A26,26 0 0 1 ${twrX + 26},${twrY} A26,13 0 0 1 ${twrX - 26},${twrY} Z`} fill="url(#hq-dome)" stroke={INK} strokeWidth="1.2" />
          <g transform={`translate(${twrX} ${twrY - 28}) scale(1 0.5)`}>
            <g>
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="3s" repeatCount="indefinite" />
              <line x1="0" y1="0" x2="20" y2="0" stroke={shade(p.walls, -0.5)} strokeWidth="3" />
              <ellipse cx="22" cy="0" rx="5" ry="12" fill={shade(p.walls, 0.2)} stroke={INK} strokeWidth="1.2" />
            </g>
          </g>
          <ellipse cx={twrX} cy={twrY - 20} rx="20" ry="10" fill="none" stroke={p.glass} strokeWidth="2">
            <animate attributeName="rx" values="20;150" dur="3s" repeatCount="indefinite" />
            <animate attributeName="ry" values="10;75" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="3s" repeatCount="indefinite" />
          </ellipse>
          <line x1={antX} y1={antY} x2={antX} y2={antY - 46} stroke="#2A2640" strokeWidth="2.5" />
          <circle cx={antX} cy={antY - 48} r="4" fill="#FF3B3B" filter="url(#hq-glow)">
            <animate attributeName="opacity" values="1;1;0.15;0.15;1" keyTimes="0;0.4;0.5;0.9;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          {/* Windsock */}
          <line x1={wsX} y1={wsY} x2={wsX} y2={wsY - 92} stroke="#2A2640" strokeWidth="2.5" />
          <path fill={p.neon} stroke={INK} strokeWidth="1">
            <animate
              attributeName="d"
              dur="1.5s"
              repeatCount="indefinite"
              values={`M${wsX},${wsY - 92} L${wsX + 34},${wsY - 88} L${wsX + 34},${wsY - 80} L${wsX},${wsY - 76} Z;M${wsX},${wsY - 92} L${wsX + 33},${wsY - 84} L${wsX + 32},${wsY - 76} L${wsX},${wsY - 76} Z;M${wsX},${wsY - 92} L${wsX + 34},${wsY - 88} L${wsX + 34},${wsY - 80} L${wsX},${wsY - 76} Z`}
            />
          </path>
          <path d={`M${wsX + 12},${wsY - 90} L${wsX + 12},${wsY - 77} M${wsX + 24},${wsY - 89} L${wsX + 24},${wsY - 79}`} stroke="#ffffff" strokeWidth="3" opacity="0.8" />

          <Tree x={1.4} y={5.4} p={p} />

          {/* ── HQ ── */}
          <IsoBox x={5.5} y={3} w={4.5} d={4} h={3.2} color={p.walls} u={U} ink={{ stroke: INK }} />
          <IsoBox x={5.45} y={2.95} w={4.6} d={4.1} h={0.35} color={shade(p.stone, -0.1)} u={U} top={false} ink={{ stroke: INK }} />
          {[6.0, 8.6].map((a, i) => (
            <g key={a}>
              <Spill a={a} w={0.8} plane={7} p={p} />
              <Win face="left" plane={7} a={a} z={1.2} w={0.8} h={1.2} p={p} seed={i + 3} />
            </g>
          ))}
          {[3.6, 5.4].map((a, i) => (
            <Win key={a} face="right" plane={10} a={a} z={1.2} w={0.9} h={1.2} p={p} seed={i + 9} />
          ))}
          <IsoWindow face="left" plane={7} a={7.05} z={0.35} w={0.9} h={1.75} fill={shade(p.roof, -0.2)} u={U} />
          <IsoWindow face="left" plane={7} a={7.15} z={0.45} w={0.7} h={1.5} fill={p.glow} u={U}>
            <animate attributeName="opacity" values="0.5;0.75;0.5" dur="3s" repeatCount="indefinite" />
          </IsoWindow>
          <polygon points={poly([[6.85, 7, 2.35], [8.15, 7, 2.35], [8.15, 7.7, 2.05], [6.85, 7.7, 2.05]])} fill={p.neon} stroke={INK} strokeWidth="1.1" />
          {/* Sign plate on the wall band between window tops and the eave */}
          <IsoWindow face="left" plane={7.01} a={5.7} z={2.46} w={4.1} h={0.58} fill={shade(p.roof, -0.45)} u={U} />
          {/* Neon lettering in the wall's isometric plane */}
          <g transform={`translate(${signAt[0]} ${signAt[1]}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <text x="0" y="0" fontFamily="'Unbounded','Space Grotesk',system-ui,sans-serif" fontWeight="700" fontSize="17" letterSpacing="2.4" fill={p.neon} filter="url(#hq-glow)">
              {p.sign}
              <animate attributeName="opacity" values="1;1;0.35;1;0.4;1;1" keyTimes="0;0.7;0.71;0.73;0.74;0.76;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            </text>
          </g>
          <GableRoof x={5.25} y={2.75} z={3.2} w={5} d={4.5} h={1.9} p={p} />
          <IsoBox x={6.2} y={4} z={4} w={0.55} d={0.55} h={1.3} color={shade(p.walls, -0.15)} u={U} ink={{ stroke: INK }} />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={smX} cy={smY} r="6" fill="#ffffff" opacity="0">
              <animate attributeName="cy" values={`${smY};${smY - 60}`} dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="cx" values={`${smX};${smX + 22}`} dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="r" values="5;14" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* ── Garage with satellite dish + weather balloon launch ── */}
          <IsoBox x={1} y={7.5} w={2.6} d={2.2} h={1.8} color={shade(p.walls, -0.08)} u={U} ink={{ stroke: INK }} />
          <IsoBox x={0.9} y={7.4} z={1.8} w={2.8} d={2.4} h={0.18} color={p.roof} u={U} ink={{ stroke: INK }} />
          <IsoWindow face="left" plane={9.7} a={1.3} z={0} w={1.6} h={1.3} fill={shade(p.walls, -0.35)} u={U} />
          {[0.35, 0.7, 1.05].map((zz) => (
            <polyline key={zz} points={poly([[1.3, 9.7, zz], [2.9, 9.7, zz]])} stroke={shade(p.walls, -0.55)} strokeWidth="1" fill="none" />
          ))}
          <Win face="right" plane={3.6} a={8} z={0.6} w={0.8} h={0.7} p={p} seed={14} />
          <line x1={dX} y1={dY} x2={dX + 4} y2={dY - 16} stroke="#2A2640" strokeWidth="2" />
          <ellipse cx={dX + 8} cy={dY - 22} rx="14" ry="9" transform={`rotate(-30 ${dX + 8} ${dY - 22})`} fill={shade(p.walls, 0.15)} stroke={INK} strokeWidth="1.2" />
          <g opacity="0">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 0;40 -300" dur={`${LOOP}s`} repeatCount="indefinite" />
            <line x1={dX - 30} y1={dY - 6} x2={dX - 30} y2={dY - 30} stroke="#ffffff" strokeWidth="1" opacity="0.7" />
            <rect x={dX - 33} y={dY - 6} width="6" height="5" fill={p.glass} />
            <circle cx={dX - 30} cy={dY - 42} r="13" fill="#F4F1FF" stroke={INK} strokeWidth="1" />
            <ellipse cx={dX - 34} cy={dY - 47} rx="4" ry="6" fill="#ffffff" opacity="0.8" />
          </g>

          {/* ── Front: bushes, lamps, bench, mailbox, tree, turbine ── */}
          <Tree x={10.9} y={4.6} s={0.9} p={p} />
          {[5.9, 8.5, 9.6].map((x) => (
            <Bush key={x} x={x} y={7.6} p={p} />
          ))}
          <Lamp x={6.2} y={9.5} p={p} seed={0} />
          <Lamp x={8.4} y={11} p={p} seed={1.5} />
          <IsoBox x={3.6} y={10.6} w={1.4} d={0.45} h={0.45} color="#7A5A44" u={U} ink={{ stroke: INK }} />
          <IsoBox x={3.6} y={10.9} z={0.45} w={1.4} d={0.12} h={0.45} color="#7A5A44" u={U} ink={{ stroke: INK }} />
          <IsoCylinder x={9.2} y={10.8} r={0.05} h={0.9} color="#2A2640" u={U} ink={{ stroke: INK }} />
          <IsoBox x={9} y={10.6} z={0.9} w={0.45} d={0.4} h={0.35} color={p.neon} u={U} ink={{ stroke: INK }} />
          <Tree x={2} y={11} s={0.8} p={p} />

          {/* Wind turbine: blades spin in the isometric plane x = const */}
          <IsoCylinder x={11} y={1.2} r={0.12} h={5.2} color={shade(p.walls, 0.05)} u={U} ink={{ stroke: INK }} />
          <g transform={`translate(${turbX} ${turbY}) matrix(${-C30}, 0.5, 0, 1, 0, 0)`}>
            <g>
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="2s" repeatCount="indefinite" />
              {[0, 120, 240].map((a) => (
                <path key={a} transform={`rotate(${a})`} d="M0,-3 C18,-7 52,-5 66,0 C52,4 18,6 0,3 Z" fill="#F4F1FF" stroke={INK} strokeWidth="1.1" />
              ))}
              <circle r="5" fill={shade(p.walls, -0.3)} stroke={INK} strokeWidth="1" />
            </g>
          </g>

          {/* Low fence along the two front edges, with a gate at the path */}
          <g stroke={shade(p.stone, 0.35)} strokeWidth="2.2" strokeLinecap="round" fill="none">
            {Array.from({ length: 13 }, (_, i) => i)
              .filter((i) => i < 7 || i > 8)
              .map((i) => (
                <polyline key={`a${i}`} points={poly([[i, 12, 0], [i, 12, 0.7]])} />
              ))}
            {Array.from({ length: 13 }, (_, i) => (
              <polyline key={`b${i}`} points={poly([[12, i, 0], [12, i, 0.7]])} />
            ))}
            <polyline points={poly([[0, 12, 0.55], [6.5, 12, 0.55]])} />
            <polyline points={poly([[8, 12, 0.55], [12, 12, 0.55], [12, 0, 0.55]])} />
          </g>
        </g>
      </g>

      {/* ── Storm cloud ── */}
      {p.storm && (
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;30 -4;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
          <g stroke="#CFC9F2" strokeWidth="1.6" strokeLinecap="round" opacity="0.65">
            <animateTransform attributeName="transform" type="translate" values="0 -40;-14 50" dur="0.5s" repeatCount="indefinite" />
            {Array.from({ length: 30 }, (_, i) => {
              const x = 190 + rand(i * 2.3) * 300;
              const y = 230 + rand(i * 4.1) * 150;
              return <line key={i} x1={x} y1={y} x2={x - 7} y2={y + 24} />;
            })}
          </g>
          <ellipse cx="330" cy="170" rx="190" ry="100" fill={p.bolt} opacity="0" filter="url(#hq-soft)">
            <animate attributeName="opacity" values="0;0;0.6;0.1;0.5;0;0" keyTimes={flashTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
          </ellipse>
          <path d="M340 205 L314 262 L336 262 L306 334 L326 334 L300 396 L368 302 L345 302 L366 252 L347 252 L366 205 Z" fill={p.bolt} filter="url(#hq-glow)" opacity="0">
            <animate attributeName="opacity" values={flash} keyTimes={flashTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
          </path>
          <g stroke={INK} strokeWidth="1.2">
            <ellipse cx="330" cy="200" rx="160" ry="36" fill={shade(p.cloud, -0.25)} />
            <circle cx="250" cy="175" r="52" fill={p.cloud} />
            <circle cx="330" cy="150" r="72" fill={p.cloud} />
            <circle cx="415" cy="172" r="54" fill={p.cloud} />
            <circle cx="470" cy="192" r="30" fill={p.cloud} />
          </g>
          <g fill={shade(p.cloud, 0.22)}>
            <circle cx="318" cy="118" r="34" opacity="0.6" />
            <circle cx="245" cy="156" r="22" opacity="0.5" />
            <circle cx="410" cy="150" r="22" opacity="0.5" />
          </g>
        </g>
      )}
    </svg>
  );
}
