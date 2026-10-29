import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'openfeed Reading Room',
  description:
    "Landing-page hero: openfeed's world as a floating tea garden at sunrise — a reading pavilion under 70s sunrise stripes, Scout's lookout with a turning telescope, domdistill's copper still dripping, paper-plane sources landing in the mailbox, a koi pond and today's paper dropping at the door. Loops seamlessly.",
  tags: ['hero', 'isometric', 'landing page', 'reading', 'animated svg', 'openfeed'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Sign').default('openfeed'),
  skyTop: color('Sky top').default('#F7E6BF'),
  skyBottom: color('Sky bottom').default('#E2EBD0'),
  sun: color('Sun').default('#E85D3F'),
  stripe1: color('Outer stripe').default('#E85D3F'),
  stripe2: color('Middle stripe').default('#C9A227'),
  stripe3: color('Inner stripe').default('#6A8D3A'),
  grass: color('Grass').default('#86A651'),
  stone: color('Stone').default('#BDB79D'),
  walls: color('Walls').default('#F4ECD8'),
  roof: color('Roof').default('#3F5B2A'),
  copper: color('Still copper').default('#C47A45'),
  glow: color('Window light').default('#FFD66B'),
  night: toggle('Night (stars, lit windows)').default(false),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#3B2B4A', skyBottom: '#F2A26B', sun: '#FFB35C', stripe1: '#E5487A', stripe2: '#FF8E5E', stripe3: '#FFD27F', roof: '#6B2E3A', grass: '#6E8C45', walls: '#FFE9D6' },
  night: { night: true, skyTop: '#0E1820', skyBottom: '#253A36', sun: '#F3E7C8', stripe1: '#4E8A5B', stripe2: '#2E5A44', stripe3: '#1E3A2E', grass: '#4E7A45', stone: '#7E8274', walls: '#D9D2BC', roof: '#22341C' },
  autumn: { skyTop: '#F6D9B8', skyBottom: '#F1E4D3', sun: '#C8553D', stripe1: '#C8553D', stripe2: '#F2A541', stripe3: '#4F6D58', grass: '#B8873E', roof: '#8C3B2A', walls: '#FBF1E2' },
  riso: { skyTop: '#F4EFE6', skyBottom: '#F4EFE6', sun: '#FF48B0', stripe1: '#FF48B0', stripe2: '#FFE800', stripe3: '#0078BF', grass: '#00A95C', roof: '#1F2A6B', copper: '#FF48B0', stone: '#C9C2B4' },
};

type P = z.infer<typeof schema>;

const U = 38;
const LOOP = scene.loop;
const OX = 600;
const OY = 300;
const INK = 'rgba(30,42,26,0.6)';
const C30 = Math.cos(Math.PI / 6);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const quad = (x: number, y: number, w: number, d: number, z = 0.02) => poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]]);

/** Soft cast shadow toward +y (sun is behind, up-left). */
function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.35;
  return <polygon points={poly([[x, y + d, 0.02], [x + w, y + d, 0.02], [x + w + l * 0.4, y + d + l, 0.02], [x + l * 0.4, y + d + l, 0.02]])} fill="#1E2A1A" opacity="0.2" filter="url(#rr-blur)" />;
}

/** Framed window with a mullion cross and a sill. */
function Win({ face, plane, a, z, w, h, p, seed }: { face: 'left' | 'right'; plane: number; a: number; z: number; w: number; h: number; p: P; seed: number }) {
  const f = 0.08;
  const at = (aa: number, zz: number): P3 => (face === 'left' ? [aa, plane, zz] : [plane, aa, zz]);
  const frame = '#6E4A32';
  const pane = p.night ? p.glow : shade(p.glow, 0.55);
  return (
    <g>
      <IsoWindow face={face} plane={plane} a={a - f} z={z - f} w={w + 2 * f} h={h + 2 * f} fill={frame} u={U} />
      <IsoWindow face={face} plane={plane} a={a} z={z} w={w} h={h} fill={pane} u={U} ink={{ strokeWidth: 0 }}>
        {p.night && <Flicker dur={LOOP} seed={seed} low={0.7} />}
      </IsoWindow>
      <polyline points={poly([at(a + w / 2, z), at(a + w / 2, z + h)])} stroke={frame} strokeWidth="1.4" fill="none" />
      <polyline points={poly([at(a, z + h * 0.5), at(a + w, z + h * 0.5)])} stroke={frame} strokeWidth="1.4" fill="none" />
      <IsoWindow face={face} plane={plane + (face === 'left' ? 0.08 : 0.08)} a={a - f * 1.6} z={z - f * 1.9} w={w + f * 3.2} h={f * 0.8} fill={shade(p.walls, -0.1)} u={U} />
    </g>
  );
}

/** Hip roof with overhang, tile rows, ridge cap and finials. Ridge runs along x. */
function HipRoof({ x, y, z, w, d, h, p }: { x: number; y: number; z: number; w: number; d: number; h: number; p: P }) {
  const X = x + w;
  const Y = y + d;
  const ry = y + d / 2;
  const r0 = x + d / 2;
  const r1 = X - d / 2;
  const Z = z + h;
  const lerp = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const front: P3[] = [[x, Y, z], [X, Y, z], [r1, ry, Z], [r0, ry, Z]];
  const side: P3[] = [[X, y, z], [X, Y, z], [r1, ry, Z]];
  const [fx, fy] = S([r0, ry, Z]);
  const [gx, gy] = S([r1, ry, Z]);
  return (
    <g>
      <polygon points={poly(side)} fill={shade(p.roof, 0.08)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={poly(front)} fill={shade(p.roof, -0.12)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <g key={t} stroke={shade(p.roof, -0.38)} strokeWidth="1.1" fill="none">
          <polyline points={poly([lerp(front[0], front[3], t), lerp(front[1], front[2], t)])} />
          <polyline points={poly([lerp(side[0], side[2], t), lerp(side[1], side[2], t)])} />
        </g>
      ))}
      {/* fascia board along the front eave */}
      <polygon points={poly([[x, Y, z], [X, Y, z], [X, Y, z - 0.16], [x, Y, z - 0.16]])} fill={shade(p.roof, -0.4)} stroke={INK} strokeWidth="1" />
      <polygon points={poly([[X, y, z], [X, Y, z], [X, Y, z - 0.16], [X, y, z - 0.16]])} fill={shade(p.roof, -0.25)} stroke={INK} strokeWidth="1" />
      <line x1={fx} y1={fy} x2={gx} y2={gy} stroke={shade(p.roof, 0.4)} strokeWidth="3.5" strokeLinecap="round" />
      {[[fx, fy], [gx, gy]].map(([cx, cy], i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - 12} stroke={INK} strokeWidth="2" />
          <circle cx={cx} cy={cy - 14} r="4" fill={p.stripe2} stroke={INK} strokeWidth="1" />
        </g>
      ))}
    </g>
  );
}

/** Puffy round tree (tea-garden style). */
function Tree({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: P }) {
  const [cx, cy] = S([x, y, 0]);
  const g = p.grass;
  return (
    <g>
      <ellipse cx={cx + 10 * s} cy={cy + 6 * s} rx={30 * s} ry={13 * s} fill="#1E2A1A" opacity="0.2" filter="url(#rr-blur)" />
      <IsoCylinder x={x} y={y} r={0.09 * s} h={0.9 * s} color="#7A5236" u={U} ink={{ stroke: INK }} />
      <g stroke={INK} strokeWidth="1.2">
        <circle cx={cx - 14 * s} cy={cy - 40 * s} r={18 * s} fill={shade(g, -0.2)} />
        <circle cx={cx + 14 * s} cy={cy - 42 * s} r={19 * s} fill={shade(g, -0.1)} />
        <circle cx={cx} cy={cy - 60 * s} r={21 * s} fill={g} />
      </g>
      <circle cx={cx - 6 * s} cy={cy - 66 * s} r={8 * s} fill={shade(g, 0.3)} opacity="0.7" />
    </g>
  );
}

function Bush({ x, y, p, k = 0 }: { x: number; y: number; p: P; k?: number }) {
  const [cx, cy] = S([x, y, 0]);
  return (
    <g stroke={INK} strokeWidth="1.1">
      <circle cx={cx - 8} cy={cy - 6} r="9" fill={shade(p.grass, -0.18)} />
      <circle cx={cx + 6} cy={cy - 8} r="10" fill={shade(p.grass, -0.06)} />
      <circle cx={cx} cy={cy - 15} r="8" fill={shade(p.grass, 0.08)} />
      <circle cx={cx + (k % 2 ? 4 : -3)} cy={cy - 12} r="2.4" fill={[p.stripe1, p.stripe2, '#FFF6E8'][k % 3]} stroke="none" />
    </g>
  );
}

function Lamp({ x, y, p, seed }: { x: number; y: number; p: P; seed: number }) {
  const [gx, gy] = S([x, y, 0]);
  const [hx, hy] = S([x, y, 1.9]);
  return (
    <g>
      <ellipse cx={gx} cy={gy} rx={1.4 * U} ry={0.8 * U} fill="url(#rr-pool)" opacity={p.night ? 1 : 0.35}>
        <animate attributeName="opacity" values={p.night ? '0.85;1;0.85' : '0.3;0.4;0.3'} dur="4s" begin={`-${seed}s`} repeatCount="indefinite" />
      </ellipse>
      <IsoCylinder x={x} y={y} r={0.05} h={1.8} color="#3A2A20" u={U} ink={{ stroke: INK }} />
      {/* paper lantern */}
      <circle cx={hx} cy={hy} r="12" fill={p.glow} opacity={p.night ? 0.5 : 0.2} filter="url(#rr-glow)" />
      <ellipse cx={hx} cy={hy} rx="7" ry="9" fill={p.night ? p.glow : shade(p.glow, 0.4)} stroke={INK} strokeWidth="1.2" />
      <line x1={hx - 7} y1={hy} x2={hx + 7} y2={hy} stroke={shade(p.glow, -0.35)} strokeWidth="1" />
      <rect x={hx - 4} y={hy - 12} width="8" height="3" fill="#3A2A20" />
    </g>
  );
}

function Flowers({ p }: { p: P }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const zone = i % 3;
    const x = zone === 0 ? 0.9 + rand(i * 2.2) * 3.5 : zone === 1 ? 9.9 + rand(i * 3.1) * 1.4 : 4.2 + rand(i * 5.3) * 2;
    const y = zone === 0 ? 0.9 + rand(i * 6.1) * 2 : zone === 1 ? 1.2 + rand(i * 4.4) * 4 : 9.6 + rand(i * 1.7) * 1.8;
    const [fx, fy] = S([x, y, 0.02]);
    out.push(<circle key={i} cx={fx} cy={fy} r="2.3" fill={[p.stripe1, p.stripe2, '#FFF6E8'][i % 3]} opacity="0.95" />);
  }
  return <g>{out}</g>;
}

function Stars() {
  const out: ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const dur = [2, 4, 8][i % 3];
    out.push(
      <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 420} r={0.6 + rand(i * 1.3) * 1.4} fill="#FFF6E0">
        <animate attributeName="opacity" values="0.2;1;0.2" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

/** 70s puffy cloud. */
function Cloud({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={c} stroke={INK} strokeWidth={1.2 / s}>
      <rect x="-70" y="-14" width="140" height="28" rx="14" />
      <circle cx="-26" cy="-18" r="24" />
      <circle cx="16" cy="-26" r="30" />
      <rect x="-68" y="-12" width="136" height="24" rx="12" stroke="none" />
    </g>
  );
}

/** Paper plane (a source arriving), flying along `path`. */
function Plane({ path, dur, begin, p }: { path: string; dur: number; begin: number; p: P }) {
  return (
    <g opacity="0">
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} rotate="auto" keyPoints="0;1;1" keyTimes="0;0.5;1" calcMode="linear" />
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.06;0.44;0.5;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
      <path d="M12,0 L-10,-8 L-5,0 L-10,8 Z" fill="#FFFDF5" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12,0 L-5,0 L-10,8 Z" fill={shade(p.walls, -0.12)} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    </g>
  );
}

export default function ReadingRoom(p: P) {
  const night = p.night;
  // The moment: the paper lands at 54% of the loop (stills samples 55.5%).
  const moment = '0;0.53;0.55;0.66;1';

  const [twX, twY] = S([2, 4.4, 4.85]); // telescope platform centre
  const [stX, stY] = S([10.2, 7.3, 1.05]); // still top
  const [jarX, jarY] = S([11.2, 8.9, 0.75]); // receiving jar mouth
  const [mbX, mbY] = S([6.1, 9.6, 1.05]); // mailbox slot
  const [bdX, bdY] = S([7.3, 6.5, 0.05]); // bundle drop spot at the door
  const signAt = S([5.72, 5.8, 1.98]);
  const sunX = OX + 20;
  const sunY = 196;
  const archBase = 330; // where the arcs meet their straight legs

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="rr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="rr-halo">
          <stop offset="0" stopColor="#FFF6DC" stopOpacity="0.7" />
          <stop offset="0.4" stopColor="#FFF6DC" stopOpacity="0.2" />
          <stop offset="1" stopColor="#FFF6DC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rr-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rr-mist">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rr-copper" x1="0" x2="1">
          <stop offset="0" stopColor={shade(p.copper, -0.3)} />
          <stop offset="0.55" stopColor={shade(p.copper, 0.25)} />
          <stop offset="1" stopColor={shade(p.copper, -0.15)} />
        </linearGradient>
        <filter id="rr-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="rr-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height="900" fill="url(#rr-sky)" />
      {night && <Stars />}
      {/* Sunrise stripes behind the island (the kit's motif) */}
      <g opacity={night ? 0.55 : 1}>
        {[p.stripe1, p.stripe2, p.stripe3].map((c, i) => {
          const r = 300 - i * 46;
          return (
            <path key={i} d={`M${sunX - r},920 L${sunX - r},${archBase} A${r},${r} 0 0 1 ${sunX + r},${archBase} L${sunX + r},920`} fill="none" stroke={c} strokeWidth="44">
              <animate attributeName="stroke-width" values="44;48;44" dur="4s" begin={`-${i * 0.4}s`} repeatCount="indefinite" {...spline} />
            </path>
          );
        })}
      </g>
      <circle cx={sunX + 70} cy={sunY} r="190" fill="url(#rr-halo)">
        <animate attributeName="opacity" values="0.75;0.75;1;0.75;0.75" keyTimes={moment} dur={`${LOOP}s`} repeatCount="indefinite" />
      </circle>
      <circle cx={sunX + 70} cy={sunY} r="58" fill={p.sun} stroke={INK} strokeWidth="1.2" />
      <circle cx={sunX + 54} cy={sunY - 16} r="18" fill="#FFFFFF" opacity="0.2" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;46 0;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <Cloud x={170} y={150} s={1} c={night ? '#3A4C48' : '#FFFBF0'} />
        <Cloud x={1010} y={300} s={0.75} c={night ? '#3A4C48' : '#FFFBF0'} />
      </g>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;-30 4;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <Cloud x={980} y={110} s={0.55} c={night ? '#2F403C' : '#FFF4DE'} />
      </g>
      <ellipse cx="600" cy="830" rx="560" ry="80" fill="url(#rr-mist)">
        <animate attributeName="rx" values="560;610;560" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
      </ellipse>

      {/* ── Island (bobs gently) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <g transform={`translate(${OX} ${OY})`}>
          {/* Rock underside */}
          <polygon points={poly([[0, 12, -1.3], [12, 12, -1.3], [7, 7, -6]])} fill="#6F6150" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points={poly([[12, 0, -1.3], [12, 12, -1.3], [7, 7, -6]])} fill="#8B7B66" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <polyline points={poly([[4, 12, -1.3], [6, 9.5, -3.8], [7, 7, -6]])} stroke={INK} strokeWidth="1" fill="none" />
          <polyline points={poly([[12, 5, -1.3], [9.5, 7, -3.6], [7, 7, -6]])} stroke={INK} strokeWidth="1" fill="none" />
          <polygon points={poly([[2.6, 12, -1.3], [4.4, 12, -1.3], [3.9, 11, -2.5]])} fill={shade(p.grass, -0.3)} opacity="0.85" />
          <polygon points={poly([[12, 8, -1.3], [12, 9.8, -1.3], [11.2, 9.1, -2.4]])} fill={shade(p.grass, -0.3)} opacity="0.85" />
          {/* waterfall from the pond edge */}
          <polygon points={poly([[12, 9.6, -0.2], [12, 10.4, -0.2], [12, 10.4, -2.6], [12, 9.6, -2.2]])} fill="#BFE3E0" opacity="0.85" />
          <g stroke="#FFFFFF" strokeWidth="1.4" opacity="0.8">
            <animateTransform attributeName="transform" type="translate" values="0 -12;0 12" dur="1s" repeatCount="indefinite" />
            {[0.2, 0.5].map((t) => (
              <polyline key={t} points={poly([[12, 9.6 + t * 0.8, -0.6], [12, 9.6 + t * 0.8, -1.2]])} fill="none" />
            ))}
          </g>
          {/* Slab, rim and lawn */}
          <IsoBox x={0} y={0} z={-1.3} w={12} d={12} h={1.1} color={shade(p.stone, -0.2)} u={U} top={false} ink={{ stroke: INK }} />
          <IsoBox x={0} y={0} z={-0.2} w={12} d={12} h={0.2} color={p.stone} u={U} ink={{ stroke: INK }} />
          <polygon points={quad(0.5, 0.5, 11, 11, 0.01)} fill={p.grass} stroke={shade(p.grass, -0.35)} strokeWidth="1" />
          {/* raked gravel bed in front of the pavilion */}
          <polygon points={quad(4.6, 6.1, 5.4, 2.6, 0.012)} fill={shade(p.stone, 0.35)} stroke={shade(p.stone, -0.2)} strokeWidth="1" />
          {[0.5, 1, 1.5, 2, 2.5].map((t) => (
            <polyline key={t} points={poly([[4.6, 6.1 + t * 0.92, 0.015], [10, 6.1 + t * 0.92, 0.015]])} stroke={shade(p.stone, -0.05)} strokeWidth="1" fill="none" />
          ))}
          {/* stepping-stone path to the door */}
          {Array.from({ length: 7 }, (_, i) => {
            const [sx, sy] = S([7.3 + (i % 2 ? 0.18 : -0.18), 6.4 + i * 0.82, 0.02]);
            return <ellipse key={i} cx={sx} cy={sy} rx="13" ry="7" fill={shade(p.stone, 0.18)} stroke={shade(p.stone, -0.35)} strokeWidth="1" />;
          })}
          <Flowers p={p} />

          {/* Koi pond */}
          <g>
            <path d={(() => { const [a, b] = S([9.6, 10.2, 0.02]); return `M${a - 48},${b} a48,26 0 1 0 96,0 a48,26 0 1 0 -96,0`; })()} fill={night ? '#2E5A5A' : '#9FD3CC'} stroke={shade(p.stone, -0.3)} strokeWidth="3" />
            {(() => {
              const [a, b] = S([9.6, 10.2, 0.02]);
              return (
                <g>
                  {[0, 1].map((k) => (
                    <ellipse key={k} cx={a - 10 + k * 22} cy={b + (k ? 4 : -4)} rx="3" ry="1.5" fill="none" stroke="#FFFFFF" strokeWidth="1.2">
                      <animate attributeName="rx" values="3;20" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
                      <animate attributeName="ry" values="1.5;10" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.9;0" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
                    </ellipse>
                  ))}
                  {/* koi circling */}
                  <g transform={`translate(${a} ${b}) scale(1 0.55)`}>
                    <g>
                      <animateTransform attributeName="transform" type="rotate" values="0;360" dur={`${LOOP}s`} repeatCount="indefinite" />
                      <ellipse cx="26" cy="0" rx="4" ry="9" fill={p.stripe1} />
                      <ellipse cx="-26" cy="0" rx="3.5" ry="8" fill="#FFF6E8" transform="rotate(180)" />
                    </g>
                  </g>
                  <ellipse cx={a + 30} cy={b - 6} rx="9" ry="5" fill={shade(p.grass, 0.1)} stroke={INK} strokeWidth="0.8" />
                </g>
              );
            })()}
          </g>

          <Shadow x={5.2} y={2.2} w={4.2} d={3.6} h={4} />
          <Shadow x={1} y={7} w={2.6} d={2} h={1.8} />

          <Tree x={10.6} y={1.4} s={1.1} p={p} />
          <Tree x={0.9} y={1.2} s={0.8} p={p} />

          {/* ── Scout's lookout tower ── */}
          <IsoCylinder x={2} y={4.4} r={0.62} h={4.4} color={p.walls} u={U} ink={{ stroke: INK }} />
          {[1.3, 2.8].map((zz, i) => {
            const [wx, wy] = S([2.42, 4.86, zz]);
            return (
              <rect key={i} x={wx - 5} y={wy - 9} width="10" height="14" rx="5" fill={night ? p.glow : shade(p.glow, 0.5)} stroke={INK} strokeWidth="1.1">
                {night && <Flicker dur={LOOP} seed={30 + i} low={0.65} />}
              </rect>
            );
          })}
          {/* stripe bands round the tower */}
          {[p.stripe1, p.stripe2, p.stripe3].map((c, i) => {
            const [bx, by] = S([2, 4.4, 3.6 + i * 0.22]);
            const rx = 0.62 * U * 1.2247;
            const ry = 0.62 * U * 0.7071;
            return <path key={i} d={`M${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${bx + rx},${by - 6} A${rx},${ry} 0 0 1 ${bx - rx},${by - 6} Z`} fill={c} />;
          })}
          <IsoBox x={1.1} y={3.5} z={4.4} w={1.8} d={1.8} h={0.22} color={p.roof} u={U} ink={{ stroke: INK }} />
          <g stroke="#6E4A32" strokeWidth="1.6" fill="none">
            {[0, 0.6, 1.2, 1.8].map((t) => (
              <g key={t}>
                <polyline points={poly([[1.1 + t, 5.3, 4.62], [1.1 + t, 5.3, 5.05]])} />
                <polyline points={poly([[2.9, 3.5 + t, 4.62], [2.9, 3.5 + t, 5.05]])} />
              </g>
            ))}
            <polyline points={poly([[1.1, 5.3, 5.05], [2.9, 5.3, 5.05], [2.9, 3.5, 5.05]])} />
          </g>
          {/* telescope sweeping the horizon (horizontal turn faked with a squashed rotation) */}
          <rect x={twX - 3} y={twY - 18} width="6" height="18" fill="#3A2A20" />
          <g transform={`translate(${twX} ${twY - 20}) scale(1 0.5)`}>
            <g>
              <animateTransform attributeName="transform" type="rotate" values="-40;60;-40" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
              <rect x="-10" y="-7" width="44" height="14" rx="5" fill={p.copper} stroke={INK} strokeWidth="2" />
              <rect x="30" y="-9" width="9" height="18" rx="3" fill={shade(p.copper, -0.3)} stroke={INK} strokeWidth="2" />
            </g>
          </g>
          {/* pennant */}
          {(() => {
            const [fx, fy] = S([1.2, 3.6, 5.05]);
            return (
              <g>
                <line x1={fx} y1={fy} x2={fx} y2={fy - 46} stroke="#3A2A20" strokeWidth="2" />
                <path fill={p.stripe1} stroke={INK} strokeWidth="1">
                  <animate attributeName="d" dur="1s" repeatCount="indefinite" values={`M${fx},${fy - 46} L${fx + 28},${fy - 40} L${fx},${fy - 33} Z;M${fx},${fy - 46} L${fx + 26},${fy - 37} L${fx},${fy - 33} Z;M${fx},${fy - 46} L${fx + 28},${fy - 40} L${fx},${fy - 33} Z`} />
                </path>
              </g>
            );
          })()}

          {/* ── Reading pavilion ── */}
          <IsoBox x={5.2} y={2.2} w={4.2} d={3.6} h={2.4} color={p.walls} u={U} ink={{ stroke: INK }} />
          {/* 70s stripe plinth */}
          {[p.stripe3, p.stripe2, p.stripe1].map((c, i) => {
            const z0 = 0.06 + i * 0.12;
            return (
              <g key={i}>
                <polygon points={poly([[5.2, 5.8, z0], [9.4, 5.8, z0], [9.4, 5.8, z0 + 0.09], [5.2, 5.8, z0 + 0.09]])} fill={c} />
                <polygon points={poly([[9.4, 2.2, z0], [9.4, 5.8, z0], [9.4, 5.8, z0 + 0.09], [9.4, 2.2, z0 + 0.09]])} fill={shade(c, -0.12)} />
              </g>
            );
          })}
          {[5.6, 8.35].map((a, i) => (
            <Win key={a} face="left" plane={5.8} a={a} z={0.75} w={0.75} h={0.95} p={p} seed={i + 2} />
          ))}
          {[2.65, 4.45].map((a, i) => (
            <Win key={a} face="right" plane={9.4} a={a} z={0.75} w={0.85} h={0.95} p={p} seed={i + 7} />
          ))}
          {/* door + noren curtain */}
          <IsoWindow face="left" plane={5.8} a={6.85} z={0} w={0.95} h={1.65} fill="#6E4A32" u={U} />
          <IsoWindow face="left" plane={5.8} a={6.95} z={0} w={0.75} h={1.5} fill={night ? p.glow : shade(p.glow, 0.3)} u={U}>
            <animate attributeName="opacity" values="0.75;0.95;0.75" dur="4s" repeatCount="indefinite" />
          </IsoWindow>
          {[0, 1, 2].map((k) => {
            const a = 6.95 + k * 0.25;
            const [nx, ny] = S([a, 5.82, 1.5]);
            return (
              <g key={k} transform={`translate(${nx} ${ny})`}>
                <g>
                  <animateTransform attributeName="transform" type="skewX" values="0;5;0;-3;0" dur="2s" begin={`-${k * 0.3}s`} repeatCount="indefinite" />
                  <polygon points={`0,0 ${0.24 * C30 * U},${0.24 * 0.5 * U} ${0.24 * C30 * U},${0.24 * 0.5 * U + 18} 0,18`} fill={[p.stripe3, p.stripe2, p.stripe1][k]} stroke={INK} strokeWidth="1" />
                </g>
              </g>
            );
          })}
          {/* sign plate in the wall band + lettering in the wall's plane */}
          <IsoWindow face="left" plane={5.81} a={5.5} z={1.84} w={3.6} h={0.46} fill={shade(p.roof, -0.3)} u={U} />
          <g transform={`translate(${signAt[0]} ${signAt[1]}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <text x="0" y="0" fontFamily={FONTS.shrikhand} fontSize="17" letterSpacing="0.6" fill={p.stripe2}>
              {p.sign}
            </text>
          </g>
          <HipRoof x={4.85} y={1.85} z={2.4} w={4.9} d={4.3} h={1.6} p={p} />
          {/* hanging lanterns at the eave */}
          {[6.2, 8.9].map((a, i) => {
            const [lx, ly] = S([a, 6.15, 2.05]);
            return (
              <g key={a}>
                <line x1={lx} y1={ly - 12} x2={lx} y2={ly - 6} stroke={INK} strokeWidth="1" />
                <ellipse cx={lx} cy={ly} rx="5" ry="7" fill={p.stripe1} stroke={INK} strokeWidth="1">
                  <animate attributeName="opacity" values="0.85;1;0.85" dur="2s" begin={`-${i}s`} repeatCount="indefinite" />
                </ellipse>
              </g>
            );
          })}

          {[5.4, 8.7, 9.6].map((x, i) => (
            <Bush key={x} x={x} y={6.3} p={p} k={i} />
          ))}

          {/* ── domdistill still ── */}
          <IsoBox x={9.4} y={6.5} w={1.6} d={1.6} h={0.25} color={p.stone} u={U} ink={{ stroke: INK }} />
          <ellipse cx={stX} cy={stY + 30} rx="40" ry="18" fill="#FF8A3D" opacity="0.35" filter="url(#rr-blur)">
            <animate attributeName="opacity" values="0.25;0.5;0.3;0.45;0.25" dur="2s" repeatCount="indefinite" />
          </ellipse>
          <IsoCylinder x={10.2} y={7.3} z={0.25} r={0.62} h={0.8} color={p.copper} u={U} ink={{ stroke: INK }} />
          <path d={`M${stX - 26},${stY} A26,22 0 0 1 ${stX + 26},${stY} Z`} fill="url(#rr-copper)" stroke={INK} strokeWidth="1.2" />
          {/* swan-neck pipe to the jar */}
          <path d={`M${stX},${stY - 20} C${stX + 4},${stY - 54} ${jarX - 20},${stY - 50} ${jarX},${jarY - 34}`} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <path d={`M${stX},${stY - 20} C${stX + 4},${stY - 54} ${jarX - 20},${stY - 50} ${jarX},${jarY - 34}`} fill="none" stroke={shade(p.copper, 0.2)} strokeWidth="4" strokeLinecap="round" />
          <IsoCylinder x={11.2} y={8.9} r={0.32} h={0.75} color="#CFE7E2" u={U} ink={{ stroke: INK }} />
          <rect x={jarX - 9} y={jarY + 6} width="18" height="12" rx="3" fill={p.stripe2} opacity="0.85" />
          {/* distilled drops */}
          {[0, 0.5].map((b) => (
            <circle key={b} cx={jarX} cy={jarY - 30} r="3" fill={p.stripe2} stroke={INK} strokeWidth="0.8" opacity="0">
              <animate attributeName="cy" values={`${jarY - 30};${jarY - 2}`} dur="1s" begin={`-${b}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.6 0 1 1" keyTimes="0;1" />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="1s" begin={`-${b}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* steam */}
          {[0, 1].map((k) => (
            <circle key={k} cx={stX} cy={stY - 22} r="5" fill="#FFFFFF" opacity="0">
              <animate attributeName="cy" values={`${stY - 22};${stY - 80}`} dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="cx" values={`${stX};${stX - 16}`} dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="r" values="4;12" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* ── Archive shed: a wall of day drawers ── */}
          <IsoBox x={1} y={7} w={2.6} d={2} h={1.8} color={shade(p.walls, -0.05)} u={U} ink={{ stroke: INK }} />
          <IsoBox x={0.85} y={6.85} z={1.8} w={2.9} d={2.3} h={0.2} color={p.roof} u={U} ink={{ stroke: INK }} />
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => (
              <IsoWindow key={`${r}-${c}`} face="left" plane={9.01} a={1.2 + c * 0.58} z={0.3 + r * 0.45} w={0.48} h={0.36} fill={r === 1 && c === 2 ? p.stripe1 : shade(p.walls, -0.2)} u={U} />
            )),
          )}
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => {
              const [hx, hy] = S([1.44 + c * 0.58, 9.02, 0.48 + r * 0.45]);
              return <circle key={`h${r}-${c}`} cx={hx} cy={hy} r="1.6" fill="#3A2A20" />;
            }),
          )}
          <Win face="right" plane={3.6} a={7.6} z={0.6} w={0.75} h={0.7} p={p} seed={12} />

          <Lamp x={5.5} y={8.6} p={p} seed={0} />

          {/* ── Mailbox where sources land ── */}
          <IsoCylinder x={6.1} y={9.6} r={0.05} h={0.85} color="#3A2A20" u={U} ink={{ stroke: INK }} />
          <IsoBox x={5.85} y={9.35} z={0.85} w={0.5} d={0.5} h={0.38} color={p.stripe3} u={U} ink={{ stroke: INK }} />
          <path d={`M${mbX - 15},${mbY - 6} A15,8 0 0 1 ${mbX + 15},${mbY - 6}`} fill={shade(p.stripe3, 0.15)} stroke={INK} strokeWidth="1" />
          <g transform={`translate(${mbX + 15} ${mbY - 2})`}>
            <g>
              <animateTransform attributeName="transform" type="rotate" values="0;0;-80;-80;0" keyTimes="0;0.48;0.53;0.9;1" dur="4s" repeatCount="indefinite" />
              <line x1="0" y1="0" x2="0" y2="-16" stroke="#3A2A20" strokeWidth="2" />
              <rect x="0" y="-16" width="9" height="6" fill={p.stripe1} />
            </g>
          </g>

          {/* bench */}
          <IsoBox x={3.4} y={10.5} w={1.3} d={0.4} h={0.4} color="#9A6A45" u={U} ink={{ stroke: INK }} />
          <IsoBox x={3.4} y={10.8} z={0.4} w={1.3} d={0.1} h={0.4} color="#9A6A45" u={U} ink={{ stroke: INK }} />
          {/* a book left open on the bench */}
          {(() => {
            const [bx, by] = S([3.9, 10.6, 0.42]);
            return <path d={`M${bx - 9},${by} L${bx},${by - 4} L${bx + 9},${by} L${bx},${by + 4} Z`} fill="#FFFDF5" stroke={INK} strokeWidth="0.9" />;
          })()}

          <Lamp x={8.7} y={11.1} p={p} seed={2} />
          <Tree x={1} y={10.7} s={0.75} p={p} />
          <Tree x={11.2} y={6.3} s={0.7} p={p} />
          <Bush x={4.6} y={11.4} p={p} k={1} />
          <Bush x={10.9} y={11.2} p={p} k={2} />

          {/* ── The moment: today's paper drops at the door ── */}
          <g opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.519;0.52;0.95;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 -220;0 -220;0 0;0 0;0 0" keyTimes="0;0.52;0.54;0.95;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.5 0 1 1;0 0 1 1;0 0 1 1" />
            <IsoBox x={6.9} y={6.25} z={0.02} w={0.85} d={0.55} h={0.3} color="#FFFDF5" u={U} ink={{ stroke: INK }} />
            <polyline points={poly([[7.32, 6.25, 0.32], [7.32, 6.8, 0.32], [7.32, 6.8, 0.02]])} stroke={p.stripe1} strokeWidth="3" fill="none" />
          </g>
          <ellipse cx={bdX} cy={bdY} rx="4" ry="2" fill="none" stroke={p.stripe1} strokeWidth="3.5" opacity="0">
            <animate attributeName="rx" values="4;4;14;90;90" keyTimes="0;0.54;0.541;0.64;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="ry" values="2;2;7;45;45" keyTimes="0;0.54;0.541;0.64;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.54;0.541;0.64;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </ellipse>
          {[0, 1, 2, 3, 4].map((k) => {
            const ang = -Math.PI / 2 + (k - 2) * 0.55;
            const dx = Math.cos(ang) * 64;
            const dy = Math.sin(ang) * 56;
            return (
              <path key={k} d="M0,-5 L1.5,-1.5 L5,0 L1.5,1.5 L0,5 L-1.5,1.5 L-5,0 L-1.5,-1.5 Z" fill={[p.stripe2, p.stripe1, '#FFFDF5'][k % 3]} opacity="0">
                <animateTransform attributeName="transform" type="translate" values={`${bdX} ${bdY};${bdX} ${bdY};${bdX + dx} ${bdY + dy - 10};${bdX + dx} ${bdY + dy - 10}`} keyTimes="0;0.54;0.64;1" dur={`${LOOP}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.54;0.55;0.66;1" dur={`${LOOP}s`} repeatCount="indefinite" />
              </path>
            );
          })}

          {/* Paper-plane sources gliding into the mailbox */}
          <Plane path={`M-520,-200 C-300,-260 -60,-120 ${mbX},${mbY - 4}`} dur={4} begin={0} p={p} />
          <Plane path={`M520,-260 C300,-200 120,40 ${mbX},${mbY - 4}`} dur={8} begin={-5} p={p} />
        </g>
      </g>
    </svg>
  );
}
