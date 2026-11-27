import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Span Watch',
  description:
    'Landing-page hero for Plumbline: an isometric steel truss bridge over a river at night, watched by CCTV poles whose view cones sweep the span. A freight train crosses, a scan plane rebuilds the twin, and a strain hotspot flashes pink at midspan. Loops seamlessly.',
  tags: ['hero', 'isometric', 'bridge', 'infrastructure', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  pin: text('Anomaly label').default('Δ 3.2 mm · Span 3'),
  skyTop: color('Sky top').default('#12060A'),
  skyBottom: color('Sky bottom').default('#3A140B'),
  steel: color('Steel').default('#4A2418'),
  land: color('Banks').default('#5A3A2C'),
  water: color('River').default('#14070A'),
  heat: color('Heat').default('#FF4D00'),
  core: color('Hot core').default('#FFB000'),
  alarm: color('Anomaly').default('#FF2E63'),
  train: color('Train').default('#E9DCCF'),
  lamp: color('Lamps').default('#FFC46B'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#2B1B2E', skyBottom: '#FF8E5E', steel: '#45293F', land: '#5A3B3E', water: '#3A2335', heat: '#FF8E5E', core: '#FFD27F', alarm: '#E5487A' },
  day: { skyTop: '#9CC9E6', skyBottom: '#F1E4D3', steel: '#C8553D', land: '#8FA37A', water: '#5E9CB8', heat: '#FF7A00', core: '#FFD27F', alarm: '#E3000F', train: '#F5F5F0', lamp: '#FFF4CC' },
  blueprint: { skyTop: '#0A2A66', skyBottom: '#134AA8', steel: '#2A5BB8', land: '#1C4697', water: '#0F3B8C', heat: '#7FB2FF', core: '#EAF2FF', alarm: '#FFDD00', train: '#EAF2FF', lamp: '#FFDD00' },
  'deep-sea': { skyTop: '#010E14', skyBottom: '#06303F', steel: '#18485A', land: '#123A3A', water: '#021B26', heat: '#1B7FA6', core: '#2EF2C4', alarm: '#FF7A59', lamp: '#2EF2C4' },
};

type P = z.infer<typeof schema>;

const U = 40;
const LOOP = scene.loop;
const OX = 565;
const OY = 232;
const INK = 'rgba(14,4,2,0.65)';
const C30 = Math.cos(Math.PI / 6);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const seg = (a: P3, b: P3) => {
  const [x1, y1] = S(a);
  const [x2, y2] = S(b);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`;
};

// Bridge geometry (world units). The span runs along x; the river along y.
const DECK_Z = 2.2;
const RAIL_Z = 2.55;
const TOP_Z = 4.6;
const Y0 = 5; // far truss plane
const Y1 = 7; // near truss plane
const BOT = Array.from({ length: 8 }, (_, i) => 1.5 + i * 1.5);
const TOPX = BOT.slice(0, -1).map((x) => x + 0.75);
const HOT: P3 = [TOPX[3], Y1, TOP_Z];

function trussPath(y: number) {
  const d: string[] = [seg([BOT[0], y, RAIL_Z], [BOT[BOT.length - 1], y, RAIL_Z]), seg([TOPX[0], y, TOP_Z], [TOPX[TOPX.length - 1], y, TOP_Z])];
  BOT.forEach((x, i) => {
    if (i < TOPX.length) {
      d.push(seg([x, y, RAIL_Z], [TOPX[i], y, TOP_Z]));
      d.push(seg([TOPX[i], y, TOP_Z], [BOT[i + 1], y, RAIL_Z]));
    }
  });
  return d.join(' ');
}

function Stars({ night }: { night: boolean }) {
  if (!night) return null;
  const out: ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const dur = [2, 3, 6][i % 3];
    out.push(
      <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 380} r={0.6 + rand(i * 1.3) * 1.4} fill="#FFEDE0">
        <animate attributeName="opacity" values="0.15;0.9;0.15" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

/** Distant skyline across the horizon, with a few lit windows. */
function Skyline({ p }: { p: P }) {
  const blocks: ReactNode[] = [];
  let x = 0;
  let i = 0;
  while (x < 1200) {
    const w = 30 + rand(i * 4.3) * 50;
    const h = 40 + rand(i * 9.1) * 110;
    blocks.push(<rect key={`b${i}`} x={x} y={430 - h} width={w} height={h + 40} fill={shade(p.skyBottom, -0.45)} />);
    for (let k = 0; k < 3; k++) {
      if (rand(i * 13 + k) > 0.55) {
        blocks.push(
          <rect key={`w${i}-${k}`} x={x + 6 + rand(i + k * 7) * (w - 14)} y={430 - h + 10 + rand(i * 3 + k) * (h - 20)} width="3" height="4" fill={p.lamp} opacity="0.55">
            <Flicker dur={LOOP} seed={i * 3 + k} low={0.2} />
          </rect>,
        );
      }
    }
    x += w + 4;
    i++;
  }
  return <g opacity="0.85">{blocks}</g>;
}

/** CCTV pole with a camera head and a sweeping view cone. */
function CameraPole({ x, y, h, aim, p, begin }: { x: number; y: number; h: number; aim: [P3, P3]; p: P; begin: string }) {
  const [hx, hy] = S([x, y, h + 0.25]);
  const [a1, b1] = S(aim[0]);
  const [a2, b2] = S(aim[1]);
  return (
    <g>
      <g style={{ mixBlendMode: 'screen' }}>
        <polygon points={`${hx},${hy} ${a1},${b1} ${a2},${b2}`} fill="url(#sw-cone)" opacity="0.75">
          <animateTransform attributeName="transform" type="rotate" values={`-7 ${hx} ${hy};7 ${hx} ${hy};-7 ${hx} ${hy}`} dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" {...spline} />
        </polygon>
      </g>
      <IsoCylinder x={x} y={y} r={0.09} h={h} color={shade(p.steel, 0.3)} u={U} ink={{ stroke: INK }} />
      <IsoBox x={x - 0.55} y={y - 0.18} z={h} w={0.75} d={0.36} h={0.34} color={p.train} u={U} ink={{ stroke: INK }} />
      <circle cx={hx - 10} cy={hy + 4} r="4" fill={p.heat} />
      <circle cx={hx + 6} cy={hy - 4} r="2.2" fill={p.alarm}>
        <animate attributeName="opacity" values="1;0.15;1" dur="1s" begin={begin} repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function Lamp({ x, y, p, seed }: { x: number; y: number; p: P; seed: number }) {
  const [gx, gy] = S([x, y, 0]);
  const [hx, hy] = S([x, y, 1.9]);
  return (
    <g>
      <ellipse cx={gx} cy={gy} rx={1.4 * U} ry={0.75 * U} fill="url(#sw-pool)">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" begin={`-${seed}s`} repeatCount="indefinite" />
      </ellipse>
      <IsoCylinder x={x} y={y} r={0.05} h={1.8} color={shade(p.steel, 0.2)} u={U} ink={{ stroke: INK }} />
      <circle cx={hx} cy={hy} r="10" fill={p.lamp} opacity="0.35" filter="url(#sw-glow)" />
      <circle cx={hx} cy={hy} r="4.5" fill={p.lamp}>
        <Flicker dur={LOOP} seed={seed + 40} low={0.6} />
      </circle>
    </g>
  );
}

/** One freight car on the deck. */
function Car({ x, p, kind }: { x: number; p: P; kind: number }) {
  const y = 5.45;
  const col = kind === 0 ? p.train : kind === 1 ? shade(p.heat, -0.15) : shade(p.train, -0.15);
  return (
    <g>
      <IsoBox x={x} y={y} z={RAIL_Z + 0.12} w={2.1} d={1.1} h={kind === 0 ? 1.25 : 1.0} color={col} u={U} ink={{ stroke: INK }} />
      {kind === 0 && <polygon points={poly([[x + 1.5, y + 1.1, RAIL_Z + 0.8], [x + 2.0, y + 1.1, RAIL_Z + 0.8], [x + 2.0, y + 1.1, RAIL_Z + 1.15], [x + 1.5, y + 1.1, RAIL_Z + 1.15]])} fill={p.lamp} stroke={INK} strokeWidth="1" />}
      {kind !== 0 && <polyline points={poly([[x + 0.1, y + 1.1, RAIL_Z + 0.6], [x + 2.0, y + 1.1, RAIL_Z + 0.6]])} stroke={shade(col, -0.35)} strokeWidth="1.2" fill="none" />}
    </g>
  );
}

export default function SpanWatch(p: P) {
  const night = !/^#[89a-fA-F]/.test(p.skyTop);
  const [hotX, hotY] = S(HOT);
  const trainDx = C30 * U; // screen shift per world x unit
  const trainDy = 0.5 * U;
  const run = 16; // world units the train travels per loop
  // The anomaly: flashes at 58% of the loop; the pin holds until ~10% of the next loop.
  const momentTimes = '0;0.1;0.14;0.57;0.6;0.64;1';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="sw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="sw-halo">
          <stop offset="0" stopColor="#FFF1E0" stopOpacity="0.5" />
          <stop offset="0.35" stopColor="#FFF1E0" stopOpacity="0.15" />
          <stop offset="1" stopColor="#FFF1E0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sw-pool">
          <stop offset="0" stopColor={p.lamp} stopOpacity="0.4" />
          <stop offset="1" stopColor={p.lamp} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sw-hot">
          <stop offset="0" stopColor={p.core} stopOpacity="0.95" />
          <stop offset="0.4" stopColor={p.heat} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.heat} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sw-flash">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.3" stopColor={p.alarm} stopOpacity="0.8" />
          <stop offset="1" stopColor={p.alarm} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sw-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.core} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.core} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="sw-therm" gradientUnits="userSpaceOnUse" x1={S([1, Y1, 0])[0]} y1="0" x2={S([13, Y1, 0])[0]} y2="0">
          <stop offset="0" stopColor={p.heat} stopOpacity="0" />
          <stop offset="0.25" stopColor={p.heat} stopOpacity="0.8" />
          <stop offset="0.45" stopColor={p.core} />
          <stop offset="0.6" stopColor={p.heat} stopOpacity="0.8" />
          <stop offset="1" stopColor={p.heat} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sw-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.core} stopOpacity="0" />
          <stop offset="0.5" stopColor={p.core} stopOpacity="0.35" />
          <stop offset="1" stopColor={p.core} stopOpacity="0.05" />
        </linearGradient>
        <filter id="sw-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="sw-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="sw-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height="900" fill="url(#sw-sky)" />
      <Stars night={night} />
      <circle cx="1010" cy="130" r="140" fill="url(#sw-halo)" />
      <circle cx="1010" cy="130" r="42" fill={night ? '#FFEBD6' : '#FFF6E0'} />
      <circle cx="998" cy="120" r="7" fill={shade('#FFEBD6', -0.12)} opacity="0.8" />
      <circle cx="1022" cy="142" r="5" fill={shade('#FFEBD6', -0.12)} opacity="0.8" />
      {/* inspection drone crossing the moon */}
      <g>
        <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path="M820,110 C900,70 1060,80 1220,140" />
        <rect x="-11" y="-3" width="22" height="6" rx="3" fill={shade(p.skyTop, -0.4)} />
        <line x1="-17" y1="-6" x2="-5" y2="-6" stroke={shade(p.skyTop, -0.4)} strokeWidth="2" />
        <line x1="5" y1="-6" x2="17" y2="-6" stroke={shade(p.skyTop, -0.4)} strokeWidth="2" />
        <circle cx="0" cy="4" r="2.2" fill={p.alarm}>
          <animate attributeName="opacity" values="1;0.1;1" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>
      <Skyline p={p} />
      <rect x="0" y="420" width="1200" height="480" fill={shade(p.skyBottom, -0.55)} opacity="0.55" />

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── Banks and river ── */}
        <IsoBox x={-1} y={-1} z={-1.6} w={4} d={14} h={1.6} color={p.land} u={U} ink={{ stroke: INK }} />
        <IsoBox x={11} y={-1} z={-1.6} w={4} d={14} h={1.6} color={p.land} u={U} ink={{ stroke: INK }} />
        <IsoBox x={3} y={-1} z={-1.6} w={8} d={14} h={0.8} color={p.water} u={U} ink={{ stroke: INK }} />
        {/* river surface reflections: the heat smears across the water */}
        <ellipse cx={S([7, 9.5, -0.8])[0]} cy={S([7, 9.5, -0.8])[1]} rx="150" ry="40" fill="url(#sw-hot)" opacity="0.35" filter="url(#sw-soft)">
          <animate attributeName="opacity" values="0.25;0.45;0.25" dur="3s" repeatCount="indefinite" {...spline} />
        </ellipse>
        {Array.from({ length: 14 }, (_, i) => {
          const wx = 3.4 + rand(i * 2.7) * 7.2;
          const wy = rand(i * 5.3) * 12;
          const d = seg([wx, wy, -0.79], [wx + 0.9, wy, -0.79]);
          return (
            <path key={i} d={d} stroke={i % 3 ? shade(p.water, 0.35) : p.core} strokeOpacity={i % 3 ? 0.5 : 0.4} strokeWidth="1.5" strokeLinecap="round">
              <animateTransform attributeName="transform" type="translate" values={`0 0;${-0.9 * C30 * U} ${0.45 * U}`} dur="3s" begin={`-${(rand(i) * 3).toFixed(2)}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="3s" begin={`-${(rand(i) * 3).toFixed(2)}s`} repeatCount="indefinite" />
            </path>
          );
        })}
        {/* buoy bobbing downstream of the bridge */}
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="2s" repeatCount="indefinite" {...spline} />
          <IsoCylinder x={6} y={11} z={-0.8} r={0.22} h={0.5} color={p.heat} u={U} ink={{ stroke: INK }} />
          <circle cx={S([6, 11, -0.1])[0]} cy={S([6, 11, -0.1])[1]} r="3" fill={p.lamp}>
            <animate attributeName="opacity" values="1;0.1;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* bank paths + track bed on land */}
        <polygon points={poly([[-1, Y0 + 0.2, 0.01], [3, Y0 + 0.2, 0.01], [3, Y1 - 0.2, 0.01], [-1, Y1 - 0.2, 0.01]])} fill={shade(p.land, -0.2)} />
        <polygon points={poly([[11, Y0 + 0.2, 0.01], [15, Y0 + 0.2, 0.01], [15, Y1 - 0.2, 0.01], [11, Y1 - 0.2, 0.01]])} fill={shade(p.land, -0.2)} />

        {/* ── Edge box (Plumbline appliance) with uplink pulses ── */}
        <IsoBox x={12.2} y={1.2} w={1.4} d={1.0} h={1.1} color={shade(p.train, -0.1)} u={U} ink={{ stroke: INK }} />
        <circle cx={S([13.6, 1.5, 0.8])[0]} cy={S([13.6, 1.5, 0.8])[1]} r="3" fill={p.core}>
          <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" />
        </circle>
        {[0, 1, 2].map((k) => {
          const [ux, uy] = S([12.9, 1.7, 1.4]);
          return (
            <path key={k} d={`M${ux - 14},${uy - 6} Q${ux},${uy - 20} ${ux + 14},${uy - 6}`} stroke={p.core} strokeWidth="2" fill="none" strokeLinecap="round">
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -36" dur="1.5s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
            </path>
          );
        })}

        {/* ── Camera poles (back one first) ── */}
        <CameraPole x={1.6} y={3.6} h={4.4} aim={[[5, 6, RAIL_Z], [8.5, 9, 0]]} p={p} begin="0s" />

        {/* ── Piers ── */}
        {[5.25, 9.75].map((px) => (
          <IsoBox key={px} x={px - 0.35} y={Y0 + 0.1} z={-0.8} w={0.7} d={1.8} h={DECK_Z + 0.8} color={shade(p.steel, 0.25)} u={U} ink={{ stroke: INK }} />
        ))}
        {/* abutments */}
        <IsoBox x={0.6} y={Y0} z={0} w={1.4} d={2} h={DECK_Z} color={shade(p.land, 0.1)} u={U} ink={{ stroke: INK }} />
        <IsoBox x={12} y={Y0} z={0} w={1.4} d={2} h={DECK_Z} color={shade(p.land, 0.1)} u={U} ink={{ stroke: INK }} />

        {/* ── Far truss ── */}
        <path d={trussPath(Y0)} stroke={shade(p.steel, 0.15)} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* ── Deck ── */}
        <IsoBox x={0.6} y={Y0} z={DECK_Z} w={12.8} d={2} h={RAIL_Z - DECK_Z} color={p.steel} u={U} ink={{ stroke: INK }} />
        {[5.5, 6.5].map((ry) => (
          <path key={ry} d={seg([-1, ry, RAIL_Z + 0.01], [15, ry, RAIL_Z + 0.01])} stroke={shade(p.steel, 0.45)} strokeWidth="1.4" />
        ))}
        {/* rails continue over the banks */}
        {[5.5, 6.5].map((ry) => (
          <g key={`l${ry}`}>
            <path d={seg([-1, ry, 0.02], [0.6, ry, 0.02])} stroke={shade(p.land, 0.3)} strokeWidth="1.4" />
            <path d={seg([13.4, ry, 0.02], [15, ry, 0.02])} stroke={shade(p.land, 0.3)} strokeWidth="1.4" />
          </g>
        ))}

        {/* ── Freight train crossing: fades in and out while still over the banks ── */}
        <g>
          <animateTransform attributeName="transform" type="translate" values={`${(-run / 2) * trainDx} ${(-run / 2) * trainDy};${(run / 2) * trainDx} ${(run / 2) * trainDy}`} dur={`${LOOP}s`} begin={`-${LOOP / 2}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.2;0.32;0.68;0.8;1" dur={`${LOOP}s`} begin={`-${LOOP / 2}s`} repeatCount="indefinite" />
          {[2.2, 4.5, 6.8, 9.1].map((cx, k) => (
            <Car key={k} x={cx} p={p} kind={k === 3 ? 0 : k % 2 ? 1 : 2} />
          ))}
        </g>

        {/* ── Top bracing between the trusses ── */}
        {TOPX.map((x) => (
          <path key={x} d={seg([x, Y0, TOP_Z], [x, Y1, TOP_Z])} stroke={shade(p.steel, 0.1)} strokeWidth="2.5" />
        ))}
        {TOPX.slice(0, -1).map((x, i) => (
          <path key={`x${x}`} d={seg([x, Y0, TOP_Z], [TOPX[i + 1], Y1, TOP_Z])} stroke={shade(p.steel, 0.05)} strokeWidth="1.5" />
        ))}

        {/* ── Near truss, with the thermal glow riding its members ── */}
        <path d={trussPath(Y1)} stroke={INK} strokeWidth="7.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={trussPath(Y1)} stroke={shade(p.steel, 0.35)} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={trussPath(Y1)} stroke="url(#sw-therm)" strokeWidth="10" fill="none" filter="url(#sw-glow)" opacity="0.7">
          <animate attributeName="opacity" values="0.45;0.85;0.45" dur="2s" repeatCount="indefinite" {...spline} />
        </path>
        <path d={trussPath(Y1)} stroke="url(#sw-therm)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* deck lamps on the near rail */}
        {[2.5, 7, 11.5].map((lx, i) => {
          const [hx, hy] = S([lx, Y1 + 0.05, RAIL_Z + 0.5]);
          return (
            <g key={lx}>
              <circle cx={hx} cy={hy} r="9" fill={p.lamp} opacity="0.3" filter="url(#sw-glow)" />
              <circle cx={hx} cy={hy} r="3" fill={p.lamp}>
                <Flicker dur={LOOP} seed={i + 7} low={0.55} />
              </circle>
            </g>
          );
        })}

        {/* ── Scan plane rebuilding the twin, sweeping along the span ── */}
        <g style={{ mixBlendMode: 'screen' }}>
          <polygon points={poly([[0.6, Y0 - 0.3, DECK_Z - 0.2], [0.6, Y1 + 0.3, DECK_Z - 0.2], [0.6, Y1 + 0.3, TOP_Z + 0.5], [0.6, Y0 - 0.3, TOP_Z + 0.5]])} fill="url(#sw-scan)" stroke={p.core} strokeWidth="1.2" strokeOpacity="0.7">
            <animateTransform attributeName="transform" type="translate" values={`0 0;${12.8 * C30 * U} ${12.8 * 0.5 * U}`} dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="3s" repeatCount="indefinite" />
          </polygon>
        </g>

        {/* ── Hotspot + the moment ── */}
        <circle cx={hotX} cy={hotY} r="46" fill="url(#sw-hot)" filter="url(#sw-blur)">
          <animate attributeName="r" values="40;54;40" dur="2s" repeatCount="indefinite" {...spline} />
        </circle>
        <circle cx={hotX} cy={hotY} r="90" fill="url(#sw-flash)" opacity="0" style={{ mixBlendMode: 'screen' }}>
          <animate attributeName="opacity" values="0;0;0;0;1;0.15;0" keyTimes={momentTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        <circle cx={hotX} cy={hotY} r="14" fill="none" stroke={p.alarm} strokeWidth="3">
          <animate attributeName="r" values="14;14;14;14;14;70;70" keyTimes={momentTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;0;0;1;0;0" keyTimes={momentTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        <g>
          <animate attributeName="opacity" values="1;1;0;0;1;1;1" keyTimes={momentTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
          <circle cx={hotX} cy={hotY} r="11" fill="none" stroke={p.alarm} strokeWidth="2.5" />
          <circle cx={hotX} cy={hotY} r="4.5" fill={p.alarm} />
          <path d={`M${hotX + 10},${hotY - 10} L${hotX + 46},${hotY - 70} L${hotX + 58},${hotY - 70}`} stroke={p.alarm} strokeWidth="1.8" fill="none" />
          <rect x={hotX + 60} y={hotY - 90} width={p.pin.length * 11.5 + 26} height="40" rx="20" fill={p.alarm} stroke={INK} strokeWidth="1" />
          <text x={hotX + 73} y={hotY - 63} fontFamily="'Familjen Grotesk', system-ui, sans-serif" fontSize="21" fontWeight="700" fill="#FFFFFF">
            {p.pin}
          </text>
        </g>

        {/* ── Front camera pole + lamps ── */}
        <Lamp x={0.2} y={9.5} p={p} seed={1} />
        <Lamp x={13.6} y={9.8} p={p} seed={2} />
        <CameraPole x={12.6} y={8.6} h={4.2} aim={[[9, 6.8, RAIL_Z], [6.5, 10, -0.8]]} p={p} begin="-3s" />
        {/* guard rail along the near bank edges */}
        {[0, 1].map((side) => {
          const x0 = side ? 11.2 : -0.8;
          return (
            <g key={side}>
              <path d={seg([x0, 12.8, 0.5], [x0 + 3.6, 12.8, 0.5])} stroke={shade(p.land, 0.45)} strokeWidth="2" />
              {[0, 1, 2, 3].map((k) => (
                <path key={k} d={seg([x0 + k * 1.2, 12.8, 0], [x0 + k * 1.2, 12.8, 0.5])} stroke={shade(p.land, 0.45)} strokeWidth="2" />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
