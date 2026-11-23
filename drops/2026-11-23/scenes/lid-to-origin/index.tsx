import { z } from 'zod';
import { color, text } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Lid to Origin',
  description:
    'Latch landing-page hero, a process machine: a developer desk at night. The laptop lid swings shut, the commit LED flashes, a yellow commit cube shoots up a pneumatic tube into the "origin" server cabinet, which lights up as it lands. Then the lid reopens. Lamp glow, mug steam, twinkling window and a blueprint poster. Loops seamlessly.',
  tags: ['hero', 'isometric', 'developer', 'night', 'animated svg', 'git'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Server label').default('origin'),
  wall: color('Wall').default('#0F3B8C'),
  floor: color('Floor').default('#0A2A66'),
  sky: color('Window sky').default('#061A45'),
  desk: color('Desk').default('#D9E4F7'),
  laptop: color('Laptop').default('#B9C8E2'),
  screen: color('Screen').default('#7FB2FF'),
  rack: color('Server cabinet').default('#1C2D57'),
  lines: color('Blueprint lines').default('#7FB2FF'),
  lamp: color('Lamp light').default('#FFE9A8'),
  commit: color('Commit').default('#FFDD00'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { wall: '#45293F', floor: '#2B1B2E', sky: '#FF8E5E', desk: '#FFE9D6', laptop: '#E5C3B0', screen: '#FFD27F', rack: '#3A2238', lines: '#E5487A', commit: '#FFD27F' },
  daylight: { wall: '#D3DDE3', floor: '#A7C4D4', sky: '#BFE3FF', desk: '#FFFFFF', laptop: '#C3C8D1', screen: '#3D5AFE', rack: '#17242E', lines: '#2F6F8F', lamp: '#FFF4CC', commit: '#E4572E' },
  'ink-gold': { wall: '#1C1C20', floor: '#0D0D0F', sky: '#050507', desk: '#F3EDE2', laptop: '#6E6A62', screen: '#C9A45C', rack: '#26262B', lines: '#6E6A62', commit: '#E8D9B5' },
  acid: { wall: '#1A1A1A', floor: '#0B0B0B', sky: '#000000', desk: '#F0FFE0', laptop: '#3A3A3A', screen: '#FF00E5', rack: '#141414', lines: '#FF00E5', lamp: '#00F0FF', commit: '#C6FF00' },
};

type P = z.infer<typeof schema>;

// Room spans x -1..11.5, y -1..6, z 0..8.6; centred and filling the canvas.
const U = 48;
const OX = 486;
const OY = 468;
const LOOP = scene.loop;
const INK = 'rgba(6,14,40,0.6)';
const ink = { stroke: INK, strokeWidth: 1.2 };

const S = (p: P3): [number, number] => {
  const [x, y] = iso(p, U);
  return [x, y];
};
const poly = (ps: P3[]) => pts(ps, U);
const path = (ps: P3[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${S(p)[0].toFixed(1)} ${S(p)[1].toFixed(1)}`).join(' ');
const rad = (d: number) => (d * Math.PI) / 180;

// Laptop geometry
const LX0 = 2.5, LX1 = 5.3, LY0 = 1.0, LY1 = 2.9, LZ = 3.14, LL = 1.75;
const lidAt = (deg: number) => {
  const dy = Math.cos(rad(deg)) * LL, dz = Math.sin(rad(deg)) * LL;
  return poly([[LX0, LY0, LZ], [LX1, LY0, LZ], [LX1, LY0 + dy, LZ + dz], [LX0, LY0 + dy, LZ + dz]]);
};
const screenAt = (deg: number) => {
  const u = (t: number): [number, number] => [LY0 + Math.cos(rad(deg)) * LL * t + Math.sin(rad(deg)) * 0.02, LZ + Math.sin(rad(deg)) * LL * t - Math.cos(rad(deg)) * 0.02];
  const [ya, za] = u(0.1), [yb, zb] = u(0.9);
  return poly([[LX0 + 0.14, ya, za], [LX1 - 0.14, ya, za], [LX1 - 0.14, yb, zb], [LX0 + 0.14, yb, zb]]);
};
// lid timeline: open → slam shut at 3.6 s → reopen 6–7 s
const LID_T = [0, 0.375, 0.41, 0.435, 0.45, 0.75, 0.8, 0.84, 0.875, 1];
const LID_A = [110, 110, 75, 35, 0.5, 0.5, 40, 80, 110, 110];
const HIT = 0.45; // 3.6 s
const LAND = 0.625; // 5.0 s

const kt = (ts: number[]) => ts.map((t) => t.toFixed(3)).join(';');

// Tube from the desk hub up and across into the top of the cabinet.
const TUBE: P3[] = [[5.9, 0.7, 3.0], [5.9, 0.7, 6.6], [9.75, 0.7, 6.6], [9.75, 0.7, 6.25]];

function Cube({ s, c }: { s: number; c: string }) {
  const top = `0,${-s} ${s * 0.87},${-s * 0.5} 0,0 ${-s * 0.87},${-s * 0.5}`;
  const left = `${-s * 0.87},${-s * 0.5} 0,0 0,${s} ${-s * 0.87},${s * 0.5}`;
  const right = `${s * 0.87},${-s * 0.5} 0,0 0,${s} ${s * 0.87},${s * 0.5}`;
  return (
    <g>
      <polygon points={top} fill={shade(c, 0.35)} stroke={INK} strokeWidth="1" />
      <polygon points={left} fill={shade(c, -0.1)} stroke={INK} strokeWidth="1" />
      <polygon points={right} fill={shade(c, -0.28)} stroke={INK} strokeWidth="1" />
    </g>
  );
}

export default function LidToOrigin(p: P) {
  const { width: W, height: H } = scene;
  const stars = Array.from({ length: 18 }, (_, i) => ({ a: 1.1 + rand(i * 3.3) * 3.2, z: 5.3 + rand(i * 7.1) * 2.5, r: 0.8 + rand(i * 1.7) * 1.6, d: [1, 2, 4][i % 3], b: -rand(i * 5.5) * 4 }));
  const [mxs, mys] = S([3.6, -1, 7.4]);
  const cubePath = path([[3.9, 1.6, 3.6], [5.9, 0.7, 3.4], ...TUBE.slice(1), [9.75, 0.7, 5.9]]);
  const [ledx, ledy] = S([4.9, LY1, LZ - 0.07]);
  const [rackTopX, rackTopY] = S([9.75, 0.75, 6.2]);
  const lampGlow = S([1.6, 1.6, 3]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lo-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, -0.62)} />
          <stop offset="1" stopColor={shade(p.floor, -0.55)} />
        </linearGradient>
        <radialGradient id="lo-lamp">
          <stop offset="0" stopColor={p.lamp} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.lamp} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lo-commit">
          <stop offset="0" stopColor={p.commit} stopOpacity="0.95" />
          <stop offset="1" stopColor={p.commit} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lo-screen">
          <stop offset="0" stopColor={p.screen} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.screen} stopOpacity="0" />
        </radialGradient>
        <filter id="lo-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="lo-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="lo-win">
          <polygon points={poly([[1, -1, 5], [4.6, -1, 5], [4.6, -1, 8], [1, -1, 8]])} transform={`translate(${OX} ${OY})`} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill="url(#lo-bg)" />

      <g transform={`translate(${OX} ${OY})`}>
        {/* room: two walls and the floor */}
        <polygon points={poly([[-1, -1, 0], [-1, 6, 0], [-1, 6, 8.6], [-1, -1, 8.6]])} fill={shade(p.wall, -0.18)} {...ink} />
        <polygon points={poly([[-1, -1, 0], [11.5, -1, 0], [11.5, -1, 8.6], [-1, -1, 8.6]])} fill={p.wall} {...ink} />
        {/* wall cap: the room is a cut-away diorama */}
        <polygon points={poly([[-1.25, -1.25, 8.6], [11.5, -1.25, 8.6], [11.5, -1, 8.6], [-1, -1, 8.6], [-1, 6, 8.6], [-1.25, 6, 8.6]])} fill={shade(p.wall, 0.25)} {...ink} />
        {/* skirting */}
        <polygon points={poly([[-1, -1, 0], [11.5, -1, 0], [11.5, -1, 0.35], [-1, -1, 0.35]])} fill={shade(p.wall, -0.3)} />
        <polygon points={poly([[-1, -1, 0], [-1, 6, 0], [-1, 6, 0.35], [-1, -1, 0.35]])} fill={shade(p.wall, -0.42)} />
        <polygon points={poly([[-1, -1, 0], [11.5, -1, 0], [11.5, 6, 0], [-1, 6, 0]])} fill={p.floor} {...ink} />
        {/* floor slab edge */}
        <polygon points={poly([[-1, 6, 0], [11.5, 6, 0], [11.5, 6, -0.3], [-1, 6, -0.3]])} fill={shade(p.floor, -0.35)} {...ink} />
        <polygon points={poly([[11.5, -1, 0], [11.5, 6, 0], [11.5, 6, -0.3], [11.5, -1, -0.3]])} fill={shade(p.floor, -0.2)} {...ink} />
        <IsoGrid x={-1} y={-1} w={12} d={7} u={U} color={p.lines} opacity={0.18} />
      </g>

      {/* window with night sky, moon, twinkling stars and a satellite crossing */}
      <g transform={`translate(${OX} ${OY})`}>
        <IsoWindow face="left" plane={-1} a={0.85} z={4.85} w={3.9} h={3.3} fill={shade(p.wall, -0.5)} u={U} />
        <IsoWindow face="left" plane={-1} a={1} z={5} w={3.6} h={3} fill={p.sky} u={U} />
      </g>
      <g clipPath="url(#lo-win)">
        <g transform={`translate(${OX} ${OY})`}>
          <circle cx={mxs} cy={mys} r={40} fill={p.lamp} opacity="0.12" />
          <circle cx={mxs} cy={mys} r={17} fill={shade(p.lamp, 0.4)} />
          <circle cx={mxs + 7} cy={mys - 4} r={14} fill={p.sky} />
          {stars.map((s, i) => {
            const [x, y] = S([s.a, -1, s.z]);
            return (
              <circle key={i} cx={x} cy={y} r={s.r} fill="#FFFFFF">
                <animate attributeName="opacity" values="1;0.25;1" dur={`${s.d}s`} begin={`${s.b}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
          <g>
            <rect x={-5} y={-2} width={10} height={4} fill={p.lines} />
            <rect x={-1.5} y={-1.5} width={3} height={3} fill="#FFFFFF" />
            <animateMotion path={path([[0.4, -1, 6.1], [5.4, -1, 7.6]])} dur={`${LOOP}s`} repeatCount="indefinite" />
          </g>
        </g>
      </g>
      <g transform={`translate(${OX} ${OY})`}>
        {/* mullions */}
        <polyline points={poly([[2.8, -1, 5], [2.8, -1, 8]])} stroke={shade(p.wall, -0.5)} strokeWidth="4" fill="none" />
        <polyline points={poly([[1, -1, 6.5], [4.6, -1, 6.5]])} stroke={shade(p.wall, -0.5)} strokeWidth="4" fill="none" />
        <IsoWindow face="left" plane={-0.85} a={0.7} z={4.65} w={4.2} h={0.18} fill={shade(p.wall, 0.15)} u={U} />

        {/* blueprint poster on the left wall: the hinge arc, the brand's motif */}
        <IsoWindow face="right" plane={-0.98} a={0.6} z={4.2} w={3.4} h={3.6} fill={shade(p.wall, -0.45)} u={U} ink={{ stroke: p.lines, strokeWidth: 1 }} />
        <polyline points={poly([[-0.97, 1.3, 4.9], [-0.97, 3.5, 4.9]])} stroke="#EAF2FF" strokeWidth="2" fill="none" />
        <polyline points={poly([[-0.97, 1.3, 4.9], [-0.97, 0.75, 6.4]])} stroke="#EAF2FF" strokeWidth="2" fill="none" />
        <polyline
          points={poly(Array.from({ length: 23 }, (_, i): P3 => { const a = rad(110 - i * 5); return [-0.97, 1.3 + Math.cos(a) * 1.75, 4.9 + Math.sin(a) * 1.75]; }))}
          stroke="#EAF2FF" strokeWidth="1.2" strokeDasharray="4 3" fill="none"
        />
        <circle cx={S([-0.97, 3.05, 4.9])[0]} cy={S([-0.97, 3.05, 4.9])[1]} r={4} fill={p.commit} />
        <polyline points={poly([[-0.97, 0.8, 4.45], [-0.97, 2.4, 4.45]])} stroke={p.lines} strokeWidth="2" fill="none" />

        {/* soft cast shadows on the floor */}
        <polygon points={poly([[0.2, 0.2, 0.01], [8.1, 0.2, 0.01], [8.8, 5.6, 0.01], [0.9, 5.6, 0.01]])} fill="#020818" opacity="0.4" filter="url(#lo-blur)" />
        <polygon points={poly([[9, 0, 0.01], [10.5, 0, 0.01], [11.2, 2.4, 0.01], [9.7, 2.4, 0.01]])} fill="#020818" opacity="0.4" filter="url(#lo-blur)" />

        {/* desk */}
        {[[0.25, 0.25], [7.5, 0.25], [0.25, 4.0], [7.5, 4.0]].map(([x, y], i) => (
          <IsoBox key={i} x={x} y={y} w={0.25} d={0.25} h={2.7} color={shade(p.desk, -0.35)} u={U} ink={ink} />
        ))}
        <IsoBox x={0} y={0} z={2.7} w={8} d={4.5} h={0.3} color={p.desk} u={U} ink={ink} />
        {/* lamp light pool on the desk */}
        <ellipse cx={lampGlow[0]} cy={lampGlow[1]} rx={170} ry={90} fill="url(#lo-lamp)" />
        {/* screen light spilling forward onto the desk (dims while shut) */}
        <ellipse cx={S([3.9, 3.3, 3])[0]} cy={S([3.9, 3.3, 3])[1]} rx={120} ry={52} fill="url(#lo-screen)">
          <animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes={kt([0, 0.41, 0.45, 0.8, 0.875, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>

        {/* sticky note + pen */}
        <polygon points={poly([[0.6, 3.0, 3.01], [1.7, 3.0, 3.01], [1.7, 4.1, 3.01], [0.6, 4.1, 3.01]])} fill={shade(p.commit, 0.45)} {...ink} />
        {[3.35, 3.6, 3.85].map((y) => (
          <polyline key={y} points={poly([[0.8, y, 3.02], [1.5, y, 3.02]])} stroke={shade(p.commit, -0.45)} strokeWidth="1.4" fill="none" />
        ))}
        <polyline points={poly([[2.0, 3.6, 3.04], [2.2, 4.3, 3.04]])} stroke={shade(p.lines, -0.4)} strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>

      {/* server cabinet "origin" */}
      <g transform={`translate(${OX} ${OY})`}>
        <IsoBox x={9} y={0} w={1.5} d={1.5} h={6.2} color={p.rack} u={U} ink={ink} />
        {[0.7, 1.75, 2.8, 3.85, 4.9].map((z, i) => (
          <g key={z}>
            <IsoWindow face="left" plane={1.5} a={9.12} z={z} w={1.26} h={0.85} fill={shade(p.rack, 0.12)} u={U} ink={{ stroke: shade(p.rack, -0.5), strokeWidth: 1 }} />
            {[0, 1, 2].map((k) => {
              const [x, y] = S([9.3 + k * 0.18, 1.5, z + 0.6]);
              return (
                <circle key={k} cx={x} cy={y} r={2.6} fill={k === 2 ? p.commit : p.lines}>
                  <Flicker dur={k === 0 ? 2 : 4} seed={i * 3 + k} low={0.25} />
                </circle>
              );
            })}
            <polyline points={poly([[9.75, 1.5, z + 0.25], [10.3, 1.5, z + 0.25]])} stroke={shade(p.rack, -0.45)} strokeWidth="2" fill="none" />
          </g>
        ))}
        {/* label plate on the front, in the face plane */}
        <g transform={`matrix(0.866 0.5 0 1 ${S([9.12, 1.5, 6.0])[0]} ${S([9.12, 1.5, 6.0])[1]})`}>
          <rect x={0} y={0} width={58} height={17} rx={2} fill={shade(p.rack, -0.45)} />
          <text x={29} y={12.5} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill={p.lines}>
            {p.sign}
          </text>
        </g>
        {/* landing flash: the whole cabinet front lights up when the commit arrives */}
        <polygon points={poly([[9, 1.5, 0], [10.5, 1.5, 0], [10.5, 1.5, 6.2], [9, 1.5, 6.2]])} fill={p.commit} opacity="0">
          <animate attributeName="opacity" values="0;0;0.45;0;0" keyTimes={kt([0, LAND, LAND + 0.01, LAND + 0.08, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
        </polygon>
        <circle cx={rackTopX} cy={rackTopY} r={30} fill="url(#lo-commit)" opacity="0">
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={kt([0, LAND, LAND + 0.01, LAND + 0.1, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>

        {/* pneumatic tube + intake hub on the desk */}
        <IsoCylinder x={5.9} y={0.7} z={3} r={0.32} h={0.35} color={shade(p.rack, 0.25)} u={U} ink={ink} />
        <path d={path(TUBE)} stroke={shade(p.lines, -0.25)} strokeOpacity="0.55" strokeWidth="16" fill="none" strokeLinejoin="round" />
        <path d={path(TUBE)} stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="3" fill="none" strokeLinejoin="round" transform="translate(-4 0)" />
        {/* a pulse travelling the tube every 2 s keeps it alive between commits */}
        <path d={path(TUBE)} stroke={p.lines} strokeWidth="4" fill="none" strokeLinejoin="round" pathLength={1} strokeDasharray="0.06 0.94">
          <animate attributeName="stroke-dashoffset" values="1;0" dur="2s" repeatCount="indefinite" />
        </path>

        {/* desk lamp */}
        <IsoCylinder x={0.8} y={0.8} z={3} r={0.45} h={0.12} color={shade(p.rack, 0.35)} u={U} ink={ink} />
        <polyline points={poly([[0.8, 0.8, 3.1], [0.9, 0.7, 4.9], [1.9, 1.2, 5.3]])} stroke={shade(p.rack, 0.35)} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <g transform={`translate(${S([1.9, 1.2, 5.3])[0]} ${S([1.9, 1.2, 5.3])[1]})`}>
          <polygon points="-6,-8 26,8 14,30 -26,12" fill={shade(p.rack, 0.35)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <ellipse cx={-6} cy={22} rx={20} ry={7} fill={p.lamp} transform="rotate(25 -6 22)" filter="url(#lo-glow)" />
        </g>
      </g>

      {/* laptop */}
      <g transform={`translate(${OX} ${OY})`}>
        <polygon points={poly([[LX0 + 0.1, LY0 + 0.1, 3.01], [LX1 + 0.4, LY0 + 0.1, 3.01], [LX1 + 0.6, LY1 + 0.3, 3.01], [LX0 + 0.3, LY1 + 0.3, 3.01]])} fill="#020818" opacity="0.25" filter="url(#lo-blur)" />
        <IsoBox x={LX0} y={LY0} z={3} w={LX1 - LX0} d={LY1 - LY0} h={0.14} color={p.laptop} u={U} ink={ink} />
        <polygon points={poly([[LX0 + 0.25, LY0 + 0.25, LZ + 0.005], [LX1 - 0.25, LY0 + 0.25, LZ + 0.005], [LX1 - 0.25, LY0 + 1.0, LZ + 0.005], [LX0 + 0.25, LY0 + 1.0, LZ + 0.005]])} fill={shade(p.laptop, -0.25)} />
        <polygon points={poly([[3.5, 2.15, LZ + 0.005], [4.3, 2.15, LZ + 0.005], [4.3, 2.7, LZ + 0.005], [3.5, 2.7, LZ + 0.005]])} fill={shade(p.laptop, -0.12)} />
        {/* lid */}
        <polygon points={lidAt(110)} fill={shade(p.laptop, -0.08)} {...ink}>
          <animate attributeName="points" values={LID_A.map(lidAt).join(';')} keyTimes={kt(LID_T)} dur={`${LOOP}s`} repeatCount="indefinite" />
        </polygon>
        <polygon points={screenAt(110)} fill={p.screen}>
          <animate attributeName="points" values={LID_A.map(screenAt).join(';')} keyTimes={kt(LID_T)} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes={kt([0, 0.41, 0.44, 0.8, 0.86, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
        </polygon>
        {/* commit LED on the front lip: idle glow, big flash on the slam */}
        <ellipse cx={ledx} cy={ledy} rx={7} ry={3} fill={p.commit} filter="url(#lo-glow)">
          <animate attributeName="opacity" values="0.6;0.6;1;0.6;0.6" keyTimes={kt([0, HIT, HIT + 0.01, HIT + 0.1, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
        {/* the moment: flash + ring on the desk */}
        <circle cx={ledx} cy={ledy} r={60} fill="url(#lo-commit)" opacity="0">
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={kt([0, HIT, HIT + 0.005, HIT + 0.07, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        <ellipse cx={S([3.9, 1.95, LZ])[0]} cy={S([3.9, 1.95, LZ])[1]} rx={20} ry={10} fill="none" stroke={p.commit} strokeWidth="2.5" opacity="0">
          <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes={kt([0, HIT, HIT + 0.005, HIT + 0.09, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="rx" values="20;20;20;180;180" keyTimes={kt([0, HIT, HIT + 0.005, HIT + 0.09, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values="10;10;10;90;90" keyTimes={kt([0, HIT, HIT + 0.005, HIT + 0.09, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
        {/* zZ drifting up from the sleeping laptop */}
        {[0, 1].map((k) => {
          const [zx, zy] = S([3.2 + k * 0.5, 1.6, 3.6]);
          const s0 = HIT + 0.03 + k * 0.05;
          return (
            <text key={k} x={zx} y={zy} fontFamily="DM Serif Display, serif" fontStyle="italic" fontSize={22 - k * 6} fill="#EAF2FF" opacity="0">
              z
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={kt([0, s0, s0 + 0.04, s0 + 0.2, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 0;0 0;-10 -60;-10 -60" keyTimes={kt([0, s0, s0 + 0.2, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
            </text>
          );
        })}

        {/* mug with steam */}
        <IsoCylinder x={6.6} y={3.3} z={3} r={0.32} h={0.55} color={shade(p.lines, 0.2)} u={U} ink={ink} />
        <path d={`M${S([6.95, 3.3, 3.4])[0]} ${S([6.95, 3.3, 3.4])[1]} q 12 2 2 14`} stroke={shade(p.lines, -0.1)} strokeWidth="4" fill="none" />
        {[0, 1].map((k) => {
          const [sx, sy] = S([6.55 + k * 0.15, 3.3, 3.7]);
          return (
            <path key={k} d={`M${sx} ${sy} c -6 -10 6 -16 0 -28 c -6 -10 6 -14 0 -24`} stroke="#EAF2FF" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0">
              <animate attributeName="opacity" values="0;0.6;0" dur="4s" begin={`${-k * 2}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 6;0 -14" dur="4s" begin={`${-k * 2}s`} repeatCount="indefinite" />
            </path>
          );
        })}

        {/* the commit cube: born at the slam, rides the tube, lands at 5 s */}
        <g opacity="0" filter="url(#lo-glow)">
          <Cube s={9} c={p.commit} />
          <animateMotion path={cubePath} keyPoints="0;0;1;1" keyTimes={kt([0, HIT, LAND, 1])} calcMode="linear" dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={kt([0, HIT - 0.001, HIT + 0.01, LAND - 0.01, LAND, 1])} dur={`${LOOP}s`} repeatCount="indefinite" />
        </g>

        {/* cable off the desk edge */}
        <path d={`M${S([LX0, 2.2, 3.05])[0]} ${S([LX0, 2.2, 3.05])[1]} C ${S([1.6, 4.6, 3])[0]} ${S([1.6, 4.6, 3])[1]}, ${S([1.2, 4.7, 2.0])[0]} ${S([1.2, 4.7, 2.0])[1]}, ${S([1.4, 5.2, 0])[0]} ${S([1.4, 5.2, 0])[1]}`} stroke={shade(p.rack, 0.2)} strokeWidth="3" fill="none" />
      </g>
    </svg>
  );
}
