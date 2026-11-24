import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, IsoWindow, iso, pts, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Robot Lab Hall',
  description:
    'Landing-page hero for a cloud lab: a cut-away isometric robot lab hall with two rows of glass workcells, a gantry robot gliding on its ceiling rail, a plate shuttle on a floor track, a spinning centrifuge, a live monitor wall and one plate flashing "RUN COMPLETE". Loops seamlessly.',
  tags: ['hero', 'isometric', 'lab', 'robotics', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Wall sign').default('BENCHWIRE · HALL B'),
  done: text('Moment tag').default('RUN COMPLETE'),
  bgTop: color('Background top').default('#08292C'),
  bgBottom: color('Background bottom').default('#0D1B1E'),
  floor: color('Floor').default('#1E3B3A'),
  wall: color('Walls').default('#2A4A48'),
  cabinet: color('Workcells').default('#DCE8E4'),
  glass: color('Glass').default('#7FD3CB'),
  live: color('Live light').default('#D4FF3A'),
  screen: color('Screens').default('#3FA7A0'),
  alert: color('Status / pop').default('#FF5A36'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  day: { bgTop: '#DCEBE7', bgBottom: '#F3F7F5', floor: '#C9D8D4', wall: '#E8F0EE', cabinet: '#FFFFFF', glass: '#9FDCD5', live: '#2BA84A', screen: '#1F6F6A', alert: '#E4572E' },
  'deep-sea': { bgTop: '#021B26', bgBottom: '#06303F', floor: '#0B3A4A', wall: '#0E4557', glass: '#2EF2C4', live: '#2EF2C4', screen: '#1B7FA6', alert: '#FF7A59' },
  blueprint: { bgTop: '#0F3B8C', bgBottom: '#134AA8', floor: '#1D56B8', wall: '#2763C7', cabinet: '#EAF2FF', glass: '#7FB2FF', live: '#FFDD00', screen: '#7FB2FF', alert: '#FFFFFF' },
  ultraviolet: { bgTop: '#12001F', bgBottom: '#24003D', floor: '#2C0B45', wall: '#3A1159', cabinet: '#F3E6FF', glass: '#B026FF', live: '#FF2E88', screen: '#B026FF', alert: '#FFD600', sign: 'BENCHWIRE · NIGHT RUN' },
};

type P = z.infer<typeof schema>;

const U = 37;
const LOOP = scene.loop;
const OX = 536;
const OY = 318;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const INK = { stroke: 'rgba(4,14,16,0.55)', strokeWidth: 1.1 };
const DX = C30 * U; // screen step for +1 world x
const DY = 0.5 * U;
const spline = (n: number) => Array.from({ length: n }, () => '0.45 0 0.55 1').join(';');

/** Text or shapes laid flat on a wall that runs along x (plane y = const). Local units are px along the wall. */
function OnXWall({ at, children }: { at: P3; children: ReactNode }) {
  const [x, y] = S(at);
  return <g transform={`matrix(${C30} 0.5 0 1 ${x} ${y})`}>{children}</g>;
}
/** Same for a wall that runs along y (plane x = const), reading left to right. */
function OnYWall({ at, children }: { at: P3; children: ReactNode }) {
  const [x, y] = S(at);
  return <g transform={`matrix(${C30} -0.5 0 1 ${x} ${y})`}>{children}</g>;
}

function Workcell({ x, y, i, p, moment = false }: { x: number; y: number; i: number; p: P; moment?: boolean }) {
  const w = 2.4;
  const d = 2;
  const zc = 1.1;
  const plate: P3[] = [[x + 0.55, y + 0.5, zc + 0.14], [x + 1.75, y + 0.5, zc + 0.14], [x + 1.75, y + 1.4, zc + 0.14], [x + 0.55, y + 1.4, zc + 0.14]];
  const wells: [number, number][] = [];
  for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) wells.push([x + 0.72 + a * 0.29, y + 0.68 + b * 0.27]);
  const [bx, by] = S([x + 2.05, y + 0.45, zc]);
  const [tx, ty] = S([x + 2.05, y + 0.45, zc + 1.25]);
  const [hx, hy] = S([x + 1.3, y + 0.95, zc + 1.25]);
  const [ex, ey] = S([x + 1.3, y + 0.95, zc + 0.6]);
  return (
    <g>
      {/* soft floor shadow */}
      <polygon points={poly([[x + w, y + 0.2, 0.01], [x + w + 0.8, y + 0.6, 0.01], [x + w + 0.8, y + d + 0.6, 0.01], [x + 0.4, y + d + 0.6, 0.01], [x, y + d, 0.01]])} fill="#000" opacity={0.25} filter="url(#lh-blur)" />
      <IsoBox x={x} y={y} w={w} d={d} h={zc} color={p.cabinet} u={U} ink={INK} />
      {/* front status screen + LED on the cabinet's front face (plane y + d) */}
      <IsoWindow face="left" plane={y + d} a={x + 0.95} z={0.35} w={1.2} h={0.5} fill={shade(p.screen, -0.6)} u={U} ink={INK} />
      <IsoWindow face="left" plane={y + d} a={x + 1.05} z={0.47} w={0.4 + (i % 3) * 0.2} h={0.08} fill={p.screen} u={U} ink={{ strokeWidth: 0 }}>
        <Flicker dur={2} seed={i + 3} low={0.4} />
      </IsoWindow>
      <IsoWindow face="left" plane={y + d} a={x + 0.25} z={0.75} w={0.28} h={0.16} fill={i % 4 === 3 ? p.alert : p.live} u={U} ink={{ strokeWidth: 0 }}>
        <Flicker dur={i % 2 ? 1 : 2} seed={i * 2.7} low={0.2} />
      </IsoWindow>
      {/* plate on the deck */}
      <IsoBox x={x + 0.55} y={y + 0.5} z={zc} w={1.2} d={0.9} h={0.14} color={shade(p.cabinet, 0.1)} u={U} ink={INK} />
      {wells.map(([wx, wy], k) => {
        const [cx, cy] = S([wx, wy, zc + 0.14]);
        const lit = (k + i) % 3 !== 0;
        return <ellipse key={k} cx={cx} cy={cy} rx={3.6} ry={2.1} fill={lit ? p.screen : shade(p.cabinet, -0.4)} />;
      })}
      {moment && (
        <polygon points={poly(plate)} fill={p.live} opacity={0} filter="url(#lh-glow)">
          <animate attributeName="opacity" values="0;0;1;0.75;1;0;0" keyTimes="0;0.6;0.62;0.66;0.7;0.86;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </polygon>
      )}
      {/* mini pipetting arm: post, boom, tip; it dips once per beat pair */}
      <g stroke={shade(p.cabinet, -0.45)} strokeWidth={3.2} strokeLinecap="round" fill="none">
        <line x1={bx} y1={by} x2={tx} y2={ty} />
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 9;0 0" keyTimes="0;0.5;1" dur="2s" begin={`${-i * 0.37}s`} repeatCount="indefinite" calcMode="spline" keySplines={spline(2)} />
          <line x1={tx} y1={ty} x2={hx} y2={hy} />
          <line x1={hx} y1={hy} x2={ex} y2={ey} stroke={shade(p.cabinet, -0.2)} strokeWidth={2.4} />
          <circle cx={ex} cy={ey + 2} r={2.6} fill={p.live} stroke="none" />
        </g>
      </g>
      {/* glass enclosure */}
      <g opacity={0.9}>
        <polygon points={poly([[x, y + d, zc], [x + w, y + d, zc], [x + w, y + d, zc + 1.7], [x, y + d, zc + 1.7]])} fill={p.glass} fillOpacity={0.16} stroke={shade(p.glass, 0.3)} strokeOpacity={0.7} strokeWidth={1.2} />
        <polygon points={poly([[x + w, y, zc], [x + w, y + d, zc], [x + w, y + d, zc + 1.7], [x + w, y, zc + 1.7]])} fill={p.glass} fillOpacity={0.24} stroke={shade(p.glass, 0.3)} strokeOpacity={0.7} strokeWidth={1.2} />
        <polygon points={poly([[x, y, zc + 1.7], [x + w, y, zc + 1.7], [x + w, y + d, zc + 1.7], [x, y + d, zc + 1.7]])} fill={p.glass} fillOpacity={0.3} stroke={shade(p.glass, 0.3)} strokeOpacity={0.8} strokeWidth={1.2} />
        {/* glass glint */}
        <polygon points={poly([[x + 0.3, y + d, zc + 1.5], [x + 0.6, y + d, zc + 1.5], [x + 0.2, y + d, zc + 0.3], [x + 0.05, y + d, zc + 0.3]])} fill="#ffffff" opacity={0.18} />
      </g>
    </g>
  );
}

/** The "run complete" tag, drawn last so nothing crosses it. */
function DoneTag({ x, y, p }: { x: number; y: number; p: P }) {
  const tag = S([x + 1.2, y + 1, 1.1 + 2.5]);
  const w = Math.max(120, p.done.length * 10 + 40);
  return (
    <g opacity={0}>
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.61;0.64;0.84;0.88;1" dur={`${LOOP}s`} repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="translate" values="0 10;0 10;0 0;0 -4;0 -10;0 10" keyTimes="0;0.61;0.65;0.84;0.88;1" dur={`${LOOP}s`} repeatCount="indefinite" />
      <line x1={tag[0]} y1={tag[1] + 12} x2={tag[0]} y2={tag[1] + 40} stroke={p.live} strokeWidth={1.5} strokeDasharray="3 3" />
      <rect x={tag[0] - w / 2 + 4} y={tag[1] - 14} width={w} height={30} fill="#000" opacity={0.35} />
      <rect x={tag[0] - w / 2} y={tag[1] - 18} width={w} height={30} fill={p.live} stroke="#06120F" strokeWidth={1.5} />
      <text x={tag[0]} y={tag[1] + 3} textAnchor="middle" fontFamily={FONTS.silkscreen} fontSize={13} letterSpacing="1.5" fill="#06120F">
        {`✓ ${p.done}`}
      </text>
    </g>
  );
}

export default function RobotLabHall(p: P) {
  const day = /^#[c-fC-F]/.test(p.bgTop);
  const wallDark = shade(p.wall, -0.18);
  const rows = [
    { y: 1.7, cells: [2.2, 5.6, 9] },
    { y: 6.5, cells: [2.2, 5.6, 9] },
  ];
  const [cfx, cfy] = S([12.6, 8.6, 0.85]);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="lh-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bgTop} />
          <stop offset="1" stopColor={p.bgBottom} />
        </linearGradient>
        <radialGradient id="lh-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.screen} stopOpacity={day ? 0.25 : 0.4} />
          <stop offset="1" stopColor={p.screen} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lh-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.live} stopOpacity={day ? 0.18 : 0.22} />
          <stop offset="1" stopColor={p.live} stopOpacity="0" />
        </linearGradient>
        <pattern id="lh-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1.3" fill={day ? '#1F3B3A' : '#EAF4EF'} opacity={day ? 0.12 : 0.08} />
        </pattern>
        <filter id="lh-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="lh-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="1200" height="900" fill="url(#lh-bg)" />
      <rect width="1200" height="900" fill="url(#lh-dots)" />
      <ellipse cx="600" cy="470" rx="560" ry="380" fill="url(#lh-halo)" />

      <g transform={`translate(${OX} ${OY})`}>
        {/* floor slab */}
        <polygon points={poly([[0.6, 11.2, -0.62], [15.2, 11.2, -0.62], [15.2, 0.6, -0.62]])} fill="#000" opacity={0.35} filter="url(#lh-blur)" transform="translate(10 18)" />
        <IsoBox x={0} y={0} z={-0.6} w={14} d={10} h={0.6} color={p.floor} u={U} ink={INK} />
        <IsoGrid x={0} y={0} w={14} d={10} u={U} color={day ? '#0D1B1E' : p.screen} opacity={day ? 0.12 : 0.18} />
        {/* light pools under the hanging bars */}
        {[3.2, 7.9].map((ly, k) => (
          <polygon key={k} points={poly([[1.6, ly - 1.4, 0.01], [12, ly - 1.4, 0.01], [12, ly + 1.6, 0.01], [1.6, ly + 1.6, 0.01]])} fill={p.live} opacity={day ? 0.06 : 0.09} filter="url(#lh-blur)" />
        ))}
        {/* safety walkway markings */}
        <polygon points={poly([[0.4, 4.85, 0.01], [13.6, 4.85, 0.01], [13.6, 5.95, 0.01], [0.4, 5.95, 0.01]])} fill={shade(p.floor, day ? -0.06 : 0.08)} />
        {Array.from({ length: 13 }, (_, k) => (
          <polygon key={k} points={poly([[0.6 + k, 4.9, 0.02], [1.0 + k, 4.9, 0.02], [0.8 + k, 5.0, 0.02], [0.4 + k, 5.0, 0.02]])} fill={p.live} opacity={0.5} />
        ))}

        {/* back walls (cut-away) */}
        <polygon points={poly([[0, 0, 0], [0, 10, 0], [0, 10, 5.2], [0, 0, 5.2]])} fill={wallDark} {...INK} />
        <polygon points={poly([[0, 0, 0], [14, 0, 0], [14, 0, 5.2], [0, 0, 5.2]])} fill={p.wall} {...INK} />
        <polygon points={poly([[0, 0, 5.2], [14, 0, 5.2], [14, -0.3, 5.2], [-0.3, -0.3, 5.2], [-0.3, 10, 5.2], [0, 10, 5.2]])} fill={shade(p.wall, 0.15)} {...INK} />
        {/* wall base trim */}
        <polygon points={poly([[0, 0, 0], [14, 0, 0], [14, 0, 0.25], [0, 0, 0.25]])} fill={shade(p.wall, -0.3)} />
        <polygon points={poly([[0, 0, 0], [0, 10, 0], [0, 10, 0.25], [0, 0, 0.25]])} fill={shade(p.wall, -0.4)} />

        {/* monitor wall on the back wall */}
        {[1.2, 4.2, 7.2, 10.2].map((a, k) => (
          <g key={k}>
            <IsoWindow face="left" plane={0} a={a} z={2.3} w={2.6} h={1.7} fill={shade(p.screen, -0.72)} u={U} ink={{ stroke: shade(p.screen, -0.2), strokeWidth: 2 }} />
            <OnXWall at={[a, 0, 4.0]}>
              {k === 0 &&
                [0, 1, 2, 3, 4, 5, 6].map((b) => (
                  <rect key={b} x={8 + b * 11} y={48} width={7} height={1} fill={b === 4 ? p.live : p.screen}>
                    <animate attributeName="height" values={`${10 + ((b * 7) % 20)};${28 + ((b * 5) % 18)};${10 + ((b * 7) % 20)}`} dur="2s" begin={`${-b * 0.25}s`} repeatCount="indefinite" />
                    <animate attributeName="y" values={`${48 - 10 - ((b * 7) % 20)};${48 - 28 - ((b * 5) % 18)};${48 - 10 - ((b * 7) % 20)}`} dur="2s" begin={`${-b * 0.25}s`} repeatCount="indefinite" />
                  </rect>
                ))}
              {k === 1 && (
                <>
                  <path d="M6 44 L18 36 L28 40 L40 22 L52 28 L64 14 L80 18" fill="none" stroke={p.live} strokeWidth={2} strokeDasharray="110" strokeDashoffset="0">
                    <animate attributeName="stroke-dashoffset" values="0;0;110;0" keyTimes="0;0.4;0.5;1" dur="4s" repeatCount="indefinite" />
                  </path>
                  <text x={6} y={12} fontFamily={FONTS.silkscreen} fontSize={7} fill={p.screen}>
                    OD600
                  </text>
                </>
              )}
              {k === 2 && (
                <>
                  <text x={8} y={20} fontFamily={FONTS.silkscreen} fontSize={7} fill={p.screen}>
                    RUNS TODAY
                  </text>
                  <text x={8} y={46} fontFamily={FONTS.vt323} fontSize={28} fill={p.live}>
                    1,284
                  </text>
                </>
              )}
              {k === 3 &&
                Array.from({ length: 24 }, (_, w) => (
                  <circle key={w} cx={10 + (w % 8) * 9.5} cy={14 + Math.floor(w / 8) * 13} r={3} fill={w < 15 ? p.live : 'none'} stroke={p.screen} strokeWidth={1}>
                    {w === 15 && <animate attributeName="fill" values={`none;${p.alert};none`} dur="1s" repeatCount="indefinite" />}
                  </circle>
                ))}
            </OnXWall>
          </g>
        ))}
        {/* wall sign above the monitors */}
        <OnXWall at={[1.2, 0, 4.75]}>
          <rect x={0} y={-4} width={190} height={20} fill={shade(p.wall, -0.45)} />
          <text x={8} y={11} fontFamily={FONTS.silkscreen} fontSize={11} letterSpacing="2" fill={p.live}>
            {p.sign}
          </text>
        </OnXWall>

        {/* incubator stack against the side wall */}
        <IsoBox x={0} y={1.2} w={1.5} d={3.2} h={3.6} color={p.cabinet} u={U} ink={INK} />
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <IsoWindow face="right" plane={1.5} a={1.45} z={0.35 + k * 1.15} w={2.3} h={0.85} fill={shade(p.cabinet, -0.12)} u={U} ink={INK} />
            <IsoWindow face="right" plane={1.5} a={1.65} z={0.55 + k * 1.15} w={0.9} h={0.45} fill={shade(p.screen, -0.5)} u={U} ink={INK}>
              <Flicker dur={4} seed={k + 11} low={0.6} />
            </IsoWindow>
            <IsoWindow face="right" plane={1.5} a={3.1} z={0.68 + k * 1.15} w={0.35} h={0.16} fill={k === 1 ? p.alert : p.live} u={U} ink={{ strokeWidth: 0 }}>
              <Flicker dur={2} seed={k * 5} low={0.3} />
            </IsoWindow>
          </g>
        ))}
        <OnYWall at={[0, 9.6, 4.55]}>
          <text x={0} y={0} fontFamily={FONTS.vt323} fontSize={28} fill={shade(p.wall, 0.35)} opacity={0.9}>
            37.0°C · 5% CO₂
          </text>
        </OnYWall>

        {/* row A workcells */}
        {rows[0].cells.map((x, k) => (
          <Workcell key={k} x={x} y={rows[0].y} i={k} p={p} />
        ))}

        {/* plate shuttle track + shuttle */}
        <polygon points={poly([[0.8, 5.25, 0.03], [13.2, 5.25, 0.03], [13.2, 5.55, 0.03], [0.8, 5.55, 0.03]])} fill={shade(p.floor, -0.35)} />
        <line x1={S([0.8, 5.3, 0.05])[0]} y1={S([0.8, 5.3, 0.05])[1]} x2={S([13.2, 5.3, 0.05])[0]} y2={S([13.2, 5.3, 0.05])[1]} stroke={p.screen} strokeWidth={1.2} opacity={0.7} />
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0 0;0 0;${DX * 9.5} ${DY * 9.5};${DX * 9.5} ${DY * 9.5};0 0`}
            keyTimes="0;0.12;0.45;0.62;1"
            calcMode="spline"
            keySplines={spline(4)}
            dur={`${LOOP}s`}
            repeatCount="indefinite"
          />
          <IsoBox x={1.4} y={5.05} z={0.03} w={1.3} d={0.7} h={0.32} color={shade(p.cabinet, -0.08)} u={U} ink={INK} />
          <IsoBox x={1.6} y={5.13} z={0.35} w={0.9} d={0.55} h={0.1} color={p.live} u={U} ink={INK} />
          <IsoWindow face="left" plane={5.75} a={1.5} z={0.12} w={0.25} h={0.1} fill={p.alert} u={U} ink={{ strokeWidth: 0 }}>
            <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
          </IsoWindow>
        </g>

        {/* ceiling gantry: rail, carriage and telescoping gripper */}
        <IsoBox x={0.2} y={4.95} z={4.55} w={13.4} d={0.5} h={0.22} color={shade(p.wall, 0.25)} u={U} ink={INK} />
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0 0;${DX * 7} ${DY * 7};${DX * 7} ${DY * 7};${DX * 3} ${DY * 3};0 0`}
            keyTimes="0;0.3;0.5;0.75;1"
            calcMode="spline"
            keySplines={spline(4)}
            dur={`${LOOP}s`}
            repeatCount="indefinite"
          />
          <IsoBox x={2.6} y={4.8} z={4.2} w={1} d={0.8} h={0.35} color={p.cabinet} u={U} ink={INK} />
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;0 22;0 0;0 0" keyTimes="0;0.25;0.5;1" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines={spline(3)} />
            <IsoBox x={3.0} y={5.1} z={2.6} w={0.22} d={0.22} h={1.6} color={shade(p.cabinet, -0.2)} u={U} ink={INK} />
            <IsoBox x={2.85} y={4.95} z={2.35} w={0.52} d={0.52} h={0.25} color={p.cabinet} u={U} ink={INK} />
            <circle cx={S([3.11, 5.21, 2.32])[0]} cy={S([3.11, 5.21, 2.32])[1]} r={4} fill={p.live} filter="url(#lh-glow)">
              <animate attributeName="opacity" values="1;0.35;1" dur="1s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>

        {/* row B workcells (nearer), the middle one has the moment */}
        {rows[1].cells.map((x, k) => (
          <Workcell key={k} x={x} y={rows[1].y} i={k + 3} p={p} moment={k === 1} />
        ))}

        {/* plate stack + cart, front left */}
        {[0, 1, 2, 3, 4].map((k) => (
          <IsoBox key={k} x={0.7} y={8.4} z={k * 0.16} w={1.1} d={0.8} h={0.14} color={k === 4 ? p.screen : shade(p.cabinet, -0.04 * k)} u={U} ink={INK} />
        ))}

        {/* centrifuge, front right, with a spinning rotor marker */}
        <IsoCylinder x={12.6} y={8.6} r={0.75} h={0.85} color={p.cabinet} u={U} ink={INK} />
        <ellipse cx={cfx} cy={cfy} rx={0.55 * U * 1.2247} ry={0.55 * U * 0.7071} fill={shade(p.cabinet, -0.25)} />
        <circle r={4.5} fill={p.live} filter="url(#lh-glow)">
          <animateMotion dur="1s" repeatCount="indefinite" path={`M${cfx + 0.42 * U * 1.2247},${cfy} A${0.42 * U * 1.2247},${0.42 * U * 0.7071} 0 1 1 ${cfx - 0.42 * U * 1.2247},${cfy} A${0.42 * U * 1.2247},${0.42 * U * 0.7071} 0 1 1 ${cfx + 0.42 * U * 1.2247},${cfy} Z`} />
        </circle>

        {/* hanging light bars with soft cones */}
        {[3.2, 7.9].map((ly, k) => (
          <g key={k}>
            <IsoBox x={2.2} y={ly - 0.12} z={4.05} w={9.2} d={0.24} h={0.12} color={shade(p.wall, 0.2)} u={U} ink={INK} />
            <polygon points={poly([[2.3, ly + 0.12, 4.05], [11.3, ly + 0.12, 4.05], [11.3, ly + 0.12, 4.12], [2.3, ly + 0.12, 4.12]])} fill={p.live} filter="url(#lh-glow)">
              {k === 1 && <Flicker dur={8} seed={4} low={0.35} />}
            </polygon>
          </g>
        ))}
        <DoneTag x={rows[1].cells[1]} y={rows[1].y} p={p} />
      </g>

      {/* drifting dust in the light */}
      {Array.from({ length: 14 }, (_, k) => {
        const x = 300 + ((k * 137) % 640);
        const y = 260 + ((k * 89) % 360);
        return (
          <circle key={k} cx={x} cy={y} r={1.6} fill={p.live} opacity={0}>
            <animate attributeName="opacity" values="0;0.6;0" dur="4s" begin={`${-k * 0.55}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 0;6 -18" dur="4s" begin={`${-k * 0.55}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
    </svg>
  );
}
