import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Arena Live',
  description:
    'Landing-page hero for particles.io: a floating neo-brutalist arena where little arrow ships dogfight around a reactor core. A server pylon pulses sync rings, pickups bob, and once a loop a ship pops into a burst of particles and respawns on the pad.',
  tags: ['hero', 'isometric', 'game', 'landing page', 'animated svg', 'neo-brutalist'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  title: text('Billboard title').default('PARTICLES.IO'),
  status: text('Billboard status').default('LIVE · 64/64 · EU-1'),
  paper: color('Background').default('#FFFDF2'),
  floor: color('Arena floor').default('#FFFDF2'),
  slab: color('Arena sides').default('#FF5C8A'),
  panel: color('Blocks + panels').default('#FFE45C'),
  ink: color('Ink + outlines').default('#000000'),
  player: color('Player ship').default('#FF5C8A'),
  enemy: color('Enemy ships').default('#5C8AFF'),
  pop: color('Pop (core, pickups)').default('#00D1A0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  night: { paper: '#0B0B0B', floor: '#262626', slab: '#C6FF00', panel: '#F0FFE0', ink: '#000000', player: '#C6FF00', enemy: '#FF00E5', pop: '#00F0FF', status: 'NIGHT ARENA · 64/64' },
  ultraviolet: { paper: '#12001F', floor: '#24003D', slab: '#B026FF', panel: '#FFD600', ink: '#0A0012', player: '#FF2E88', enemy: '#FFD600', pop: '#2EF2C4', title: 'RANKED', status: 'SQUADS · SEASON 3' },
  riso: { paper: '#F4EFE6', floor: '#F4EFE6', slab: '#0078BF', panel: '#FFE800', ink: '#1F2A6B', player: '#FF48B0', enemy: '#0078BF', pop: '#FF48B0', title: 'REACTOR', status: 'NEW MAP · SEASON 3' },
  citrus: { paper: '#FFF8E1', floor: '#FFF8E1', slab: '#FF7A00', panel: '#FFE9A8', ink: '#1C2B1A', player: '#FF3D7F', enemy: '#2BB24C', pop: '#2BB24C' },
};

type P = z.infer<typeof schema>;

const U = 44;
const LOOP = scene.loop;
const OX = 600;
const OY = 300;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const ln = (p: P) => ({ stroke: p.ink, strokeWidth: 2.6, strokeLinejoin: 'round' as const });
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

/** A group whose local coordinates are world (x, y) units on the plane z. */
const plane = (z: number) => `translate(0 ${-z * U}) matrix(${C30 * U} ${0.5 * U} ${-C30 * U} ${0.5 * U} 0 0)`;

/** Arrow ship in world units, nose toward +x. */
function ShipShape({ fill, ink, shadow }: { fill: string; ink: string; shadow?: boolean }) {
  const d = 'M0.55 0 L-0.4 0.42 L-0.18 0 L-0.4 -0.42 Z';
  if (shadow) return <path d={d} fill={ink} opacity="0.28" transform="scale(1.7)" />;
  return (
    <g transform="scale(1.7)">
      <path d={d} fill={fill} stroke={ink} strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx="0.02" cy="0" r="0.1" fill="#FFFDF2" stroke={ink} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

/** Orbiting ship (+ its ground shadow) with a stream of shots leading it along its path. */
function Orbiter({ path, fill, p, begin, reverse, z = 1.1, shots = true }: { path: string; fill: string; p: P; begin: number; reverse?: boolean; z?: number; shots?: boolean }) {
  const motion = (extra = 0) => (
    <animateMotion
      dur={`${LOOP}s`}
      begin={`-${(begin + extra).toFixed(2)}s`}
      repeatCount="indefinite"
      rotate="auto"
      path={path}
      {...(reverse ? { keyPoints: '1;0', keyTimes: '0;1', calcMode: 'linear' } : {})}
    />
  );
  return (
    <>
      <g transform={plane(0.02)}>
        <g>
          {motion()}
          <ShipShape fill={fill} ink={p.ink} shadow />
        </g>
      </g>
      <g transform={plane(z)}>
        {shots &&
          [0.36, 0.54, 0.72].map((k, i) => (
            <g key={i}>
              {motion(k)}
              <circle r={0.2 - i * 0.035} fill={fill} stroke={p.ink} strokeWidth="2" vectorEffect="non-scaling-stroke">
                <animate attributeName="opacity" values="1;1;0.2;1" dur="1s" begin={`-${(i * 0.33).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        <g>
          {motion()}
          <ShipShape fill={fill} ink={p.ink} />
        </g>
      </g>
    </>
  );
}

function Block({ x, y, w, d, h, p, id }: { x: number; y: number; w: number; d: number; h: number; p: P; id: string }) {
  return (
    <g>
      {/* hard offset shadow on the floor */}
      <polygon points={poly([[x + 0.25, y + d, 0.01], [x + w + 0.25, y + d, 0.01], [x + w + 0.25, y + d + 0.35, 0.01], [x + 0.25, y + d + 0.35, 0.01]])} fill={p.ink} opacity="0.85" />
      <polygon points={poly([[x + w, y + 0.25, 0.01], [x + w + 0.35, y + 0.25, 0.01], [x + w + 0.35, y + d + 0.35, 0.01], [x + w, y + d + 0.35, 0.01]])} fill={p.ink} opacity="0.85" />
      <IsoBox x={x} y={y} w={w} d={d} h={h} color={p.panel} u={U} ink={{ stroke: p.ink, strokeWidth: 2.6 }} />
      {/* hazard hatch on the top face */}
      <polygon points={poly([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]])} fill={`url(#${id})`} stroke={p.ink} strokeWidth="2.6" strokeLinejoin="round" />
    </g>
  );
}

function Pickup({ x, y, p, k }: { x: number; y: number; p: P; k: number }) {
  const [cx, cy] = S([x, y, 0.75]);
  const [gx, gy] = S([x, y, 0.01]);
  return (
    <g>
      <ellipse cx={gx} cy={gy} rx="16" ry="8" fill={p.ink} opacity="0.25">
        <animate attributeName="rx" values="16;12;16" dur="2s" begin={`-${k}s`} repeatCount="indefinite" {...spline} />
      </ellipse>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -10;0 0" dur="2s" begin={`-${k}s`} repeatCount="indefinite" {...spline} />
        <rect x={cx - 13} y={cy - 13} width="26" height="26" fill={p.pop} stroke={p.ink} strokeWidth="2.6" transform={`rotate(45 ${cx} ${cy}) `} />
        <path d={`M${cx - 6} ${cy} H${cx + 6} M${cx} ${cy - 6} V${cy + 6}`} stroke={p.ink} strokeWidth="3" strokeLinecap="square" />
      </g>
    </g>
  );
}

function SkyDots({ p }: { p: P }) {
  const out: ReactNode[] = [];
  const cols = [p.player, p.enemy, p.pop, p.panel];
  for (let i = 0; i < 26; i++) {
    const x = rand(i * 3.1) * 1200;
    const y = rand(i * 7.7) * 900;
    const r = 3 + rand(i * 1.3) * 7;
    const dur = [6, 3][i % 2];
    out.push(
      <circle key={i} cx={x} cy={y} r={r} fill={cols[i % 4]} stroke={p.ink} strokeWidth="2" opacity="0.55">
        <animateTransform attributeName="transform" type="translate" values={`0 0;${(rand(i * 2.2) - 0.5) * 30} -40;0 0`} dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" {...spline} />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

export default function ArenaLive(p: P) {
  const N = 10;
  const ink = ln(p);
  const dark = parseInt(p.paper.slice(1, 3), 16) < 0x60;
  const [rcx, rcy] = S([5, 5, 0.5]);
  const [pyX, pyY] = S([1.1, 1.1, 4.3]); // pylon antenna tip
  const [padX, padY] = S([8.4, 8.4, 0.02]);
  const [hitX, hitY] = S([6.2, 3.2, 1.1]);
  const signAt = S([3.95, 0.3, 2.05]);
  const subAt = S([3.95, 0.3, 1.45]);

  // The doomed ship: spawns on the pad, flies a dog-leg, gets popped at 55% of the loop.
  const dTimes = '0;0.1;0.28;0.4;0.55;1';
  const dVals = '8.4 8.4;8.4 8.4;1.8 7.2;3.2 3.6;6.2 3.2;6.2 3.2';
  const dRot = '-170;-170;-170;-69;-8;-8';
  const dVis = { values: '1;1;0;0', keyTimes: '0;0.55;0.551;1', calcMode: 'discrete' as const };
  const burst = '0;0;1;0;0';
  const burstT = '0;0.549;0.56;0.78;1';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <pattern id="al-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="1.6" fill={p.ink} opacity={dark ? 0.0 : 0.16} />
          <circle cx="14" cy="14" r="1.6" fill="#ffffff" opacity={dark ? 0.12 : 0} />
        </pattern>
        <pattern id="al-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="9" height="9" fill={shade(p.panel, 0.12)} />
          <line x1="0" y1="0" x2="0" y2="9" stroke={p.ink} strokeWidth="3" />
        </pattern>
        <filter id="al-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Backdrop: paper, dot grid, a big panel disc, drifting particles ── */}
      <rect width="1200" height="900" fill={p.paper} />
      <rect width="1200" height="900" fill="url(#al-dots)" />
      <circle cx="600" cy="470" r="400" fill={p.panel} opacity={dark ? 0.12 : 0.55} stroke={p.ink} strokeWidth="3" strokeOpacity={dark ? 0.6 : 1} />
      <SkyDots p={p} />

      {/* ── Arena (bobs gently) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <g transform={`translate(${OX} ${OY})`}>
          {/* Hard brutalist offset shadow under the slab */}
          <polygon points={poly([[0.6, 0.6, -1.9], [N + 0.6, 0.6, -1.9], [N + 0.6, N + 0.6, -1.9], [0.6, N + 0.6, -1.9]])} fill={p.ink} opacity={dark ? 0.6 : 0.9} />
          {/* Slab */}
          <IsoBox x={0} y={0} z={-1.1} w={N} d={N} h={1.1} color={p.slab} u={U} top={false} ink={{ stroke: p.ink, strokeWidth: 2.8 }} />
          {/* Stripe band on the slab sides */}
          <polygon points={poly([[0, N, -0.7], [N, N, -0.7], [N, N, -0.45], [0, N, -0.45]])} fill={p.ink} />
          <polygon points={poly([[N, 0, -0.7], [N, N, -0.7], [N, N, -0.45], [N, 0, -0.45]])} fill={p.ink} />
          {/* Floor */}
          <polygon points={poly([[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0]])} fill={p.floor} {...ink} strokeWidth={2.8} />
          <g stroke={p.ink} strokeWidth="1" opacity={dark ? 0.35 : 0.18}>
            {Array.from({ length: N - 1 }, (_, i) => (
              <g key={i}>
                <polyline points={poly([[i + 1, 0, 0], [i + 1, N, 0]])} fill="none" />
                <polyline points={poly([[0, i + 1, 0], [N, i + 1, 0]])} fill="none" />
              </g>
            ))}
          </g>
          {/* Arena ring */}
          <g transform={plane(0.01)}>
            <circle cx="5" cy="5" r="3.9" fill="none" stroke={p.ink} strokeWidth="2" strokeDasharray="5 9" vectorEffect="non-scaling-stroke" opacity="0.7">
              <animate attributeName="stroke-dashoffset" values="0;-28" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Respawn pad */}
          <g transform={plane(0.02)}>
            <rect x="7.7" y="7.7" width="1.4" height="1.4" fill={p.panel} stroke={p.ink} strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
            <rect x="7.95" y="7.95" width="0.9" height="0.9" fill="none" stroke={p.ink} strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          </g>
          <ellipse cx={padX} cy={padY} rx="20" ry="10" fill="none" stroke={p.player} strokeWidth="4">
            <animate attributeName="rx" values="20;70;20;20" keyTimes="0;0.12;0.121;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="ry" values="10;35;10;10" keyTimes="0;0.12;0.121;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0;0;1" keyTimes="0;0.12;0.9;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </ellipse>

          {/* ── Back: server pylon with sync rings, billboard ── */}
          <IsoBox x={0.7} y={0.7} w={0.8} d={0.8} h={3.6} color={p.enemy} u={U} ink={{ stroke: p.ink, strokeWidth: 2.6 }} />
          {[0.6, 1.2, 1.8, 2.4, 3.0].map((zz, i) => (
            <polygon key={zz} points={poly([[0.85, 1.5, zz], [1.35, 1.5, zz], [1.35, 1.5, zz + 0.22], [0.85, 1.5, zz + 0.22]])} fill={p.pop} stroke={p.ink} strokeWidth="1.6">
              <Flicker dur={LOOP / 2} seed={i + 2} low={0.25} />
            </polygon>
          ))}
          {[0.6, 1.2, 1.8, 2.4, 3.0].map((zz, i) => (
            <polygon key={`r${zz}`} points={poly([[1.5, 0.85, zz], [1.5, 1.35, zz], [1.5, 1.35, zz + 0.22], [1.5, 0.85, zz + 0.22]])} fill={p.panel} stroke={p.ink} strokeWidth="1.6">
              <Flicker dur={LOOP} seed={i + 9} low={0.3} />
            </polygon>
          ))}
          <line x1={pyX} y1={pyY + 0.7 * U * 0.0 + 30} x2={pyX} y2={pyY - 4} stroke={p.ink} strokeWidth="3.5" />
          <circle cx={pyX} cy={pyY - 8} r="7" fill={p.player} stroke={p.ink} strokeWidth="2.4">
            <animate attributeName="opacity" values="1;1;0.2;1" keyTimes="0;0.4;0.5;1" dur="1s" repeatCount="indefinite" />
          </circle>
          {[0, 1].map((k) => (
            <ellipse key={k} cx={pyX} cy={pyY - 8} rx="10" ry="5" fill="none" stroke={p.ink} strokeWidth="2.4">
              <animate attributeName="rx" values="10;90" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="ry" values="5;45" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
          {/* Sync packets from the pylon to the reactor */}
          <path d={`M${pyX} ${pyY + 40} Q ${(pyX + rcx) / 2} ${Math.min(pyY, rcy) - 10} ${rcx} ${rcy - 18}`} fill="none" stroke={p.ink} strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" values="0;-32" dur="1s" repeatCount="indefinite" />
          </path>

          {/* Billboard on posts, lettering in the board's plane */}
          <IsoBox x={4.3} y={0.15} w={0.22} d={0.22} h={1.1} color={p.ink} u={U} ink={{ stroke: p.ink }} />
          <IsoBox x={8.0} y={0.15} w={0.22} d={0.22} h={1.1} color={p.ink} u={U} ink={{ stroke: p.ink }} />
          <polygon points={poly([[3.8, 0.42, 0.95], [8.8, 0.42, 0.95], [8.8, 0.42, 2.95], [3.8, 0.42, 2.95]])} fill={p.ink} transform="translate(8 8)" />
          <polygon points={poly([[3.7, 0.3, 1.0], [8.7, 0.3, 1.0], [8.7, 0.3, 3.0], [3.7, 0.3, 3.0]])} fill={p.panel} stroke={p.ink} strokeWidth="3" strokeLinejoin="round" />
          <polygon points={poly([[3.7, 0.3, 1.0], [8.7, 0.3, 1.0], [8.7, 0.3, 1.25], [3.7, 0.3, 1.25]])} fill={p.ink} />
          <g transform={`translate(${signAt[0]} ${signAt[1]}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <text x="0" y="0" fontFamily="'Dela Gothic One', system-ui, sans-serif" fontSize={p.title.length > 12 ? 17 : 20} fill={p.ink} letterSpacing="0.5">
              {p.title}
            </text>
          </g>
          <g transform={`translate(${subAt[0]} ${subAt[1]}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <circle cx="5" cy="-4.5" r="4.2" fill={p.pop} stroke={p.ink} strokeWidth="1.6">
              <animate attributeName="opacity" values="1;0.25;1" dur="1s" repeatCount="indefinite" />
            </circle>
            <text x="15" y="0" fontFamily="'Chakra Petch', system-ui, sans-serif" fontWeight="700" fontSize="12" fill={p.ink} letterSpacing="1.4">
              {p.status}
            </text>
          </g>

          {/* ── Cover blocks + reactor ── */}
          <Block x={1.6} y={3.2} w={0.6} d={2.0} h={0.8} p={p} id="al-hatch" />
          <Block x={6.4} y={1.6} w={2.2} d={0.6} h={0.8} p={p} id="al-hatch" />
          <Block x={3.2} y={7.6} w={2.2} d={0.6} h={0.8} p={p} id="al-hatch" />

          <IsoCylinder x={5} y={5} r={1.1} h={0.35} color={p.panel} u={U} ink={{ stroke: p.ink, strokeWidth: 2.6 }} />
          <IsoCylinder x={5} y={5} z={0.35} r={0.55} h={0.25} color={p.pop} u={U} ink={{ stroke: p.ink, strokeWidth: 2.4 }} />
          <ellipse cx={rcx} cy={rcy + 4} rx="16" ry="8" fill="#FFFDF2" opacity="0.8" filter="url(#al-glow)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx={rcx} cy={rcy + 4} rx="30" ry="15" fill="none" stroke={p.ink} strokeWidth="2.6">
            <animate attributeName="rx" values="30;120" dur="2s" repeatCount="indefinite" />
            <animate attributeName="ry" values="15;60" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
          </ellipse>

          <Pickup x={2.6} y={8.6} p={p} k={0} />
          <Pickup x={8.6} y={4.6} p={p} k={1} />

          {/* ── Ships ── */}
          <Orbiter path="M8.6,5 A3.6,3.6 0 1 1 1.4,5 A3.6,3.6 0 1 1 8.6,5" fill={p.player} p={p} begin={0} />
          <Orbiter path="M7.4,5 A2.4,2.4 0 1 1 2.6,5 A2.4,2.4 0 1 1 7.4,5" fill={p.enemy} p={p} begin={2.2} reverse />
          <Orbiter path="M5,1.2 C9,1.2 9,8.8 5,8.8 C1,8.8 1,1.2 5,1.2" fill={p.pop} p={p} begin={4.1} z={1.3} shots={false} />

          {/* The doomed ship + its shadow */}
          {[0.02, 1.1].map((zz, k) => (
            <g key={zz} transform={plane(zz)}>
              <g>
                <animateTransform attributeName="transform" type="translate" values={dVals} keyTimes={dTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="rotate" values={dRot} keyTimes={dTimes} dur={`${LOOP}s`} repeatCount="indefinite" additive="sum" />
                <g>
                  <animate attributeName="opacity" dur={`${LOOP}s`} repeatCount="indefinite" {...dVis} />
                  <ShipShape fill={p.enemy} ink={p.ink} shadow={k === 0} />
                </g>
              </g>
            </g>
          ))}

          {/* ── The moment: hit flash, particle burst, +100 ── */}
          <g opacity="0">
            <animate attributeName="opacity" values={burst} keyTimes={burstT} dur={`${LOOP}s`} repeatCount="indefinite" />
            <circle cx={hitX} cy={hitY} r="40" fill="#FFFDF2" filter="url(#al-glow)" opacity="0.9">
              <animate attributeName="r" values="10;10;60;10;10" keyTimes={burstT} dur={`${LOOP}s`} repeatCount="indefinite" />
            </circle>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2 + rand(i) * 0.4;
              const d = 80 + rand(i * 3.3) * 70;
              const ex = hitX + Math.cos(a) * d;
              const ey = hitY + Math.sin(a) * d * 0.7 + 20;
              const cols = [p.player, p.enemy, p.pop, p.panel];
              return (
                <circle key={i} cx={hitX} cy={hitY} r={8 + rand(i * 5.1) * 8} fill={cols[i % 4]} stroke={p.ink} strokeWidth="2.4">
                  <animate attributeName="cx" values={`${hitX};${hitX};${ex};${ex}`} keyTimes="0;0.55;0.7;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.2 0.9 0.3 1;0 0 1 1" />
                  <animate attributeName="cy" values={`${hitY};${hitY};${ey};${ey}`} keyTimes="0;0.55;0.7;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.2 0.9 0.3 1;0 0 1 1" />
                </circle>
              );
            })}
            <path
              d={`M${hitX} ${hitY - 24} L${hitX + 7} ${hitY - 7} L${hitX + 24} ${hitY} L${hitX + 7} ${hitY + 7} L${hitX} ${hitY + 24} L${hitX - 7} ${hitY + 7} L${hitX - 24} ${hitY} L${hitX - 7} ${hitY - 7} Z`}
              fill="#FFFDF2"
              stroke={p.ink}
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
          </g>
          <g opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.56;0.6;0.8;0.88;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -50;0 -50" keyTimes="0;0.56;0.88;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <text x={hitX - 150} y={hitY - 20} fontFamily="'Dela Gothic One', system-ui, sans-serif" fontSize="40" fill={p.pop} stroke={p.ink} strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">
              +100
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
