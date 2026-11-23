import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { IsoBox, IsoCylinder, IsoWindow, iso, pts, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Crate to Grid',
  description:
    'Landing-page hero for Sparkcrate: on a site pad, an opened crate has unfolded its solar wings into rows of panels; current flows into a battery cabinet and on to a cold-storage container and a water pump. Every loop the site hits POWER ON and the floodlights snap awake.',
  tags: ['hero', 'isometric', 'solar', 'micro-grid', 'animated svg', 'brutalist'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  crateLabel: text('Crate stencil').default('SC-01'),
  containerLabel: text('Container stencil').default('COLD CHAIN 04'),
  powerLabel: text('Moment tag').default('POWER ON'),
  skyTop: color('Sky top').default('#FFFDF2'),
  skyBottom: color('Sky bottom').default('#FFF1B8'),
  sun: color('Sun & lights').default('#FFE45C'),
  pad: color('Site pad').default('#E9E4D2'),
  crate: color('Crate').default('#FFD82E'),
  panel: color('Solar cells').default('#5C8AFF'),
  battery: color('Battery cabinet').default('#F7F5EC'),
  container: color('Container').default('#FF6B4A'),
  accent: color('Stripe & cones').default('#FF6B4A'),
  pop: color('Charge / current').default('#00D1A0'),
  ink: color('Outline').default('#000000'),
  clouds: toggle('Clouds').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#2B1B2E', skyBottom: '#FF8E5E', pad: '#CDB9A8', sun: '#FFD27F', container: '#E5487A', accent: '#FF8E5E', panel: '#5C6CFF' },
  night: { skyTop: '#070B1E', skyBottom: '#23305E', pad: '#8A8FA8', sun: '#FFE45C', crate: '#FFC93C', battery: '#D9DCE8', container: '#5C8AFF', clouds: false },
  blueprint: { skyTop: '#0F3B8C', skyBottom: '#134AA8', pad: '#7FB2FF', crate: '#FFDD00', panel: '#0F3B8C', battery: '#EAF2FF', container: '#FFFFFF', accent: '#FFDD00', pop: '#FFDD00', sun: '#FFDD00', ink: '#06183D' },
  desert: { skyTop: '#FFE9C7', skyBottom: '#FFC78A', pad: '#E6C79C', container: '#2C7873', accent: '#D96C3D', panel: '#2F6FED' },
};

type P = z.infer<typeof schema>;

const U = 50;
const LOOP = scene.loop;
const OX = 548;
const OY = 236;
const K_SCALE = 1.24; // the whole site is drawn at U = 50 and scaled up to fill the frame
const C30 = Math.cos(Math.PI / 6);
const Z0 = 0.4; // top of the pad
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;
const rep = { repeatCount: 'indefinite' } as const;

/** Text painted on a box's left face (plane y = const), baseline at world z. */
function LeftText({ x, plane, z, size, fill, children, weight = 700 }: { x: number; plane: number; z: number; size: number; fill: string; children: ReactNode; weight?: number }) {
  const [sx, sy] = S([x, plane, z]);
  return (
    <text transform={`matrix(${C30},0.5,0,1,${sx.toFixed(1)},${sy.toFixed(1)})`} fontFamily="JetBrains Mono, monospace" fontWeight={weight} fontSize={size} letterSpacing="2" fill={fill}>
      {children}
    </text>
  );
}

/** Soft cast shadow on the pad, thrown toward +y (screen down-left). */
function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.5;
  return (
    <polygon
      points={poly([[x, y + d, Z0 + 0.01], [x + w, y + d, Z0 + 0.01], [x + w - l * 0.25, y + d + l, Z0 + 0.01], [x - l * 0.25, y + d + l, Z0 + 0.01]])}
      fill="#000000"
      opacity={0.16}
      filter="url(#cg-blur)"
    />
  );
}

/** A tilted solar panel on legs: back edge high, front (+y) edge low. */
function Panel({ x, y, w, d, p, cells = 4, zBack = 1.1, zFront = 0.55 }: { x: number; y: number; w: number; d: number; p: P; cells?: number; zBack?: number; zFront?: number }) {
  const ink = { stroke: p.ink, strokeWidth: 2.2 };
  const zb = Z0 + zBack;
  const zf = Z0 + zFront;
  const at = (u: number, v: number): P3 => [x + u * w, y + v * d, mix(zb, zf, v)];
  return (
    <g>
      {/* legs */}
      {[0.12, 0.88].map((u) => (
        <g key={u} stroke={p.ink} strokeWidth={3} strokeLinecap="round">
          <polyline points={poly([at(u, 0.1), [x + u * w, y + 0.1 * d, Z0]])} fill="none" />
          <polyline points={poly([at(u, 0.9), [x + u * w, y + 0.9 * d, Z0]])} fill="none" />
        </g>
      ))}
      {/* frame edge (thickness) along the front */}
      <polygon points={poly([at(0, 1), at(1, 1), [x + w, y + d, zf - 0.09], [x, y + d, zf - 0.09]])} fill={shade(p.panel, -0.55)} stroke={ink.stroke} strokeWidth={ink.strokeWidth} strokeLinejoin="round" />
      <polygon points={poly([at(0, 0), at(1, 0), at(1, 1), at(0, 1)])} fill={p.panel} stroke={ink.stroke} strokeWidth={ink.strokeWidth} strokeLinejoin="round" />
      {/* cell grid */}
      <g stroke={shade(p.panel, -0.45)} strokeWidth={1.6}>
        {Array.from({ length: cells - 1 }, (_, i) => (
          <polyline key={i} points={poly([at((i + 1) / cells, 0), at((i + 1) / cells, 1)])} fill="none" />
        ))}
        <polyline points={poly([at(0, 0.5), at(1, 0.5)])} fill="none" />
      </g>
      {/* glare */}
      <polygon points={poly([at(0.06, 0.12), at(0.2, 0.12), at(0.12, 0.88), at(0.0, 0.88)].map(([a, b, c]) => [a + 0.05, b, c + 0.01] as P3))} fill="#FFFFFF" opacity={0.28} />
    </g>
  );
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** A crate wing: hinged at the crate's top edge (x = hx), sloping down to x = ox. */
function Wing({ hx, ox, y, d, zTop, p }: { hx: number; ox: number; y: number; d: number; zTop: number; p: P }) {
  const zo = zTop - 0.5;
  const quad = (u0: number, u1: number, v0: number, v1: number): P3[] => {
    const X = (u: number) => mix(hx, ox, u);
    const Zz = (u: number) => mix(zTop, zo, u) + 0.02;
    return [[X(u0), y + v0 * d, Zz(u0)], [X(u1), y + v0 * d, Zz(u1)], [X(u1), y + v1 * d, Zz(u1)], [X(u0), y + v1 * d, Zz(u0)]];
  };
  return (
    <g>
      <polygon points={poly(quad(0, 1, 0, 1))} fill="#1B1F2E" stroke={p.ink} strokeWidth={2.4} strokeLinejoin="round" />
      {[0, 1, 2].map((i) =>
        [0, 1].map((j) => <polygon key={`${i}${j}`} points={poly(quad(0.06 + i * 0.31, 0.06 + i * 0.31 + 0.27, 0.06 + j * 0.46, 0.06 + j * 0.46 + 0.42))} fill={p.panel} />),
      )}
    </g>
  );
}

export default function CrateToGrid(p: P) {
  const ink = { stroke: p.ink, strokeWidth: 2.4 };
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
  };
  const dark = lum(p.skyTop) < 90;
  const night = dark && lum(p.skyBottom) < 110; // dusk keeps its sun

  // Crate
  const C = { x: 1.6, y: 1.0, w: 2.2, d: 1.8, h: 1.4 };
  const cTop = Z0 + C.h;
  // Battery cabinet
  const B = { x: 1.0, y: 5.6, w: 1.3, d: 1.2, h: 1.9 };
  // Container
  const K = { x: 3.4, y: 5.3, w: 3.7, d: 1.7, h: 1.65 };

  // Current paths (ground, z just above the pad)
  const g = Z0 + 0.03;
  const path = (ps: P3[]) => 'M' + ps.map((q) => S(q).map((v) => v.toFixed(1)).join(',')).join(' L');
  const genPath = path([[9.2, 4.95, g], [2.65, 4.95, g], [1.65, 4.95, g], [1.65, 5.6, g]]);
  const cratePath = path([[2.65, 2.8, g], [2.65, 4.95, g]]);
  const loadPath = path([[2.3, 6.3, g], [3.4, 6.3, g]]);

  const sun: [number, number] = [985, 150];
  const crateCentre = S([C.x + C.w / 2, C.y + C.d / 2, cTop]);
  const tagAt = S([C.x + C.w / 2, C.y + C.d / 2, cTop + 1.55]);
  const lamp = S([9.4, 3.0, Z0 + 3.1]);

  // the moment: power on at half the loop
  const ON = { values: '0;0;1;1;0', keyTimes: '0;0.5;0.52;0.92;1', dur: `${LOOP}s`, ...rep };

  return (
    <svg viewBox={`0 0 ${scene.width} ${scene.height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="cg-flash">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.95" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cg-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </linearGradient>
        <filter id="cg-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <pattern id="cg-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill={dark ? '#FFFFFF' : '#000000'} opacity={dark ? 0.18 : 0.14} />
        </pattern>
      </defs>

      {/* ---------- sky ---------- */}
      <rect width={scene.width} height={scene.height} fill="url(#cg-sky)" />
      <rect width={scene.width} height={scene.height} fill="url(#cg-dots)">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -28" dur={`${LOOP}s`} {...rep} />
      </rect>
      {dark &&
        Array.from({ length: 22 }, (_, i) => {
          const x = (i * 197) % 1180 + 10;
          const y = (i * 83) % 300 + 20;
          return (
            <circle key={i} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} fill="#FFFFFF">
              <animate attributeName="opacity" values="0.9;0.25;0.9" dur={`${[2, 3, 1.5][i % 3]}s`} begin={`${-i * 0.37}s`} {...rep} />
            </circle>
          );
        })}

      {/* sun with turning rays (12 rays, 30° per loop → seamless); a crescent moon at night */}
      {night ? (
        <g transform={`translate(${sun[0]} ${sun[1]})`}>
          <mask id="cg-moon">
            <circle r={66} fill="#FFFFFF" />
            <circle cx={30} cy={-22} r={58} fill="#000000" />
          </mask>
          <circle r={66} fill="#F4F1E6" mask="url(#cg-moon)" />
          <circle r={82} fill={p.sun} opacity={0.12}>
            <animate attributeName="opacity" values="0.12;0.2;0.12" dur={`${LOOP / 2}s`} {...rep} />
          </circle>
        </g>
      ) : (
      <g transform={`translate(${sun[0]} ${sun[1]})`}>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0" to="30" dur={`${LOOP}s`} {...rep} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={Math.cos(a) * 88} y1={Math.sin(a) * 88} x2={Math.cos(a) * 118} y2={Math.sin(a) * 118} stroke={p.ink} strokeWidth={7} strokeLinecap="round" />;
          })}
        </g>
        <circle r={70} fill={p.sun} stroke={p.ink} strokeWidth={5} />
      </g>
      )}

      {/* clouds */}
      {p.clouds &&
        [
          { x: 150, y: 120, s: 1, dx: 26 },
          { x: 760, y: 70, s: 0.75, dx: -20 },
        ].map((c, i) => (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <g>
              <animateTransform attributeName="transform" type="translate" values={`0 0;${c.dx} 0;0 0`} dur={`${LOOP}s`} {...spline} {...rep} />
              <path d="M0 40 a28 28 0 0 1 30 -34 a38 38 0 0 1 70 -4 a30 30 0 0 1 46 26 a20 20 0 0 1 4 40 H6 a20 20 0 0 1 -6 -28Z" transform="translate(8 8)" fill={p.ink} />
              <path d="M0 40 a28 28 0 0 1 30 -34 a38 38 0 0 1 70 -4 a30 30 0 0 1 46 26 a20 20 0 0 1 4 40 H6 a20 20 0 0 1 -6 -28Z" fill="#FFFFFF" stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />
            </g>
          </g>
        ))}

      <g transform={`translate(${OX} ${OY}) scale(${K_SCALE})`}>
        {/* ---------- pad ---------- */}
        <polygon points={poly([[0.4, 8.6, 0], [10.4, 8.6, 0], [10.4, 0.6, 0], [10.6, 0.6, 0]])} fill="#000000" opacity={0.12} filter="url(#cg-blur)" />
        <IsoBox x={0} y={0} w={10} d={8} h={Z0} color={p.pad} u={U} ink={ink} />
        {/* hazard stripes on the pad's front faces */}
        <Face p={[[0, 8, 0], [10, 8, 0], [10, 8, Z0], [0, 8, Z0]]} fill={p.sun} />
        {Array.from({ length: 20 }, (_, i) => {
          const a = i * 0.5;
          return <polygon key={`l${i}`} points={poly([[a, 8, 0], [Math.min(10, a + 0.22), 8, 0], [Math.min(10, a + 0.44), 8, Z0], [Math.min(10, a + 0.22), 8, Z0]])} fill={p.ink} />;
        })}
        <Face p={[[10, 0, 0], [10, 8, 0], [10, 8, Z0], [10, 0, Z0]]} fill={p.sun} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = i * 0.5;
          return <polygon key={`r${i}`} points={poly([[10, a, 0], [10, Math.min(8, a + 0.22), 0], [10, Math.min(8, a + 0.44), Z0], [10, Math.min(8, a + 0.22), Z0]])} fill={p.ink} />;
        })}
        <polygon points={poly([[0, 8, 0], [10, 8, 0], [10, 0, 0], [10, 0, Z0], [10, 8, Z0], [0, 8, Z0]])} fill="none" stroke={p.ink} strokeWidth={2.4} strokeLinejoin="round" />
        {/* pad grid */}
        <g stroke={p.ink} strokeWidth={1} opacity={0.14}>
          {Array.from({ length: 9 }, (_, i) => <polyline key={`gx${i}`} fill="none" points={poly([[i + 1, 0, Z0], [i + 1, 8, Z0]])} />)}
          {Array.from({ length: 7 }, (_, i) => <polyline key={`gy${i}`} fill="none" points={poly([[0, i + 1, Z0], [10, i + 1, Z0]])} />)}
        </g>

        {/* ---------- cables + current ---------- */}
        {[genPath, cratePath, loadPath].map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke={p.ink} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
            <path d={d} fill="none" stroke={shade(p.pad, -0.35)} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
        {[
          { d: genPath, n: 4, dur: 2 },
          { d: cratePath, n: 2, dur: 1 },
          { d: loadPath, n: 2, dur: 1 },
        ].map((c, i) =>
          Array.from({ length: c.n }, (_, k) => (
            <circle key={`${i}${k}`} r={5.5} fill={p.pop} stroke={p.ink} strokeWidth={2}>
              <animateMotion path={c.d} dur={`${c.dur}s`} begin={`${-(k * c.dur) / c.n}s`} {...rep} />
            </circle>
          )),
        )}

        {/* ---------- back row: crate with wings, then the array ---------- */}
        <Shadow x={C.x} y={C.y} w={C.w} d={C.d} h={C.h} />
        <Wing hx={C.x} ox={C.x - 1.45} y={C.y + 0.05} d={C.d - 0.1} zTop={cTop} p={p} />
        <IsoBox x={C.x} y={C.y} w={C.w} d={C.d} h={C.h} z={Z0} color={p.crate} u={U} ink={ink} />
        <IsoBox x={C.x - 0.02} y={C.y - 0.02} w={C.w + 0.04} d={C.d + 0.04} h={0.22} z={Z0 + 0.22} color={p.accent} u={U} ink={ink} top={false} />
        {/* skids peeking out on the left face */}
        <IsoWindow face="left" plane={C.y + C.d + 0.01} a={C.x + 0.2} z={Z0} w={0.5} h={0.14} fill={p.ink} u={U} />
        <IsoWindow face="left" plane={C.y + C.d + 0.01} a={C.x + C.w - 0.7} z={Z0} w={0.5} h={0.14} fill={p.ink} u={U} />
        {/* gauge on the right face */}
        <IsoWindow face="right" plane={C.x + C.w} a={C.y + 0.25} z={Z0 + 0.62} w={1.1} h={0.48} fill={p.ink} u={U} ink={ink} />
        {[0, 1, 2, 3].map((i) => (
          <IsoWindow key={i} face="right" plane={C.x + C.w + 0.005} a={C.y + 0.34 + i * 0.255} z={Z0 + 0.7} w={0.2} h={0.32} fill={p.pop} u={U} ink={{ strokeWidth: 0 }}>
            <animate attributeName="opacity" values="0.3;0.3;1;1;0.3" keyTimes={`0;${(0.1 + i * 0.18).toFixed(2)};${(0.13 + i * 0.18).toFixed(2)};0.92;1`} dur={`${LOOP / 2}s`} {...rep} />
          </IsoWindow>
        ))}
        {(() => {
          const [lx, ly] = S([C.x + C.w + 0.01, C.y + 1.55, Z0 + 0.86]);
          return (
            <circle cx={lx} cy={ly} r={7} fill={p.accent} stroke={p.ink} strokeWidth={2.4}>
              <animate attributeName="fill" values={`${p.accent};${p.pop};${p.accent}`} keyTimes="0;0.5;1" calcMode="discrete" dur="1s" {...rep} />
            </circle>
          );
        })()}
        <LeftText x={C.x + 0.25} plane={C.y + C.d} z={Z0 + 0.95} size={24} fill={p.ink}>
          {p.crateLabel}
        </LeftText>
        <Wing hx={C.x + C.w} ox={C.x + C.w + 1.45} y={C.y + 0.05} d={C.d - 0.1} zTop={cTop} p={p} />

        {/* the array fanning out of the crate */}
        {[5.55, 7.25].map((x) => (
          <Panel key={`a${x}`} x={x} y={C.y + 0.1} w={1.55} d={1.5} p={p} />
        ))}
        {/* floodlight pole (behind the second row) */}
        <IsoCylinder x={9.4} y={3.0} z={Z0} r={0.09} h={3.0} color="#3A3A3A" u={U} ink={ink} />
        {[4.25, 5.95, 7.65].map((x) => (
          <Panel key={`b${x}`} x={x} y={3.15} w={1.55} d={1.45} p={p} />
        ))}

        {/* hazard cone, back corner */}
        <IsoCylinder x={9.5} y={0.5} z={Z0} r={0.22} h={0.08} color={p.ink} u={U} ink={ink} cone={{ h: 0.6, color: p.accent }} />

        {/* ---------- front row ---------- */}
        {/* battery cabinet */}
        <Shadow x={B.x} y={B.y} w={B.w} d={B.d} h={B.h} />
        <IsoBox x={B.x} y={B.y} w={B.w} d={B.d} h={B.h} z={Z0} color={p.battery} u={U} ink={ink} />
        <IsoWindow face="right" plane={B.x + B.w} a={B.y + 0.25} z={Z0 + 0.25} w={0.7} h={1.35} fill={p.ink} u={U} ink={ink} />
        {[0, 1, 2, 3, 4].map((i) => (
          <IsoWindow key={i} face="right" plane={B.x + B.w + 0.005} a={B.y + 0.33} z={Z0 + 0.33 + i * 0.25} w={0.54} h={0.17} fill={p.pop} u={U} ink={{ strokeWidth: 0 }}>
            <animate attributeName="opacity" values="0.2;0.2;1;1;0.2" keyTimes={`0;${(0.08 + i * 0.16).toFixed(2)};${(0.11 + i * 0.16).toFixed(2)};0.9;1`} dur={`${LOOP / 2}s`} {...rep} />
          </IsoWindow>
        ))}
        <LeftText x={B.x + 0.15} plane={B.y + B.d} z={Z0 + 1.45} size={17} fill={p.ink}>
          LFP 480
        </LeftText>
        {/* bolt badge on the battery's left face */}
        {(() => {
          const [bx, by] = S([B.x + 0.65, B.y + B.d, Z0 + 0.8]);
          return (
            <g transform={`matrix(${C30},0.5,0,1,${bx.toFixed(1)},${by.toFixed(1)})`}>
              <path d="M4 -26 L-10 2 L0 2 L-4 24 L12 -6 L2 -6 L8 -26Z" fill={p.sun} stroke={p.ink} strokeWidth={2.4} strokeLinejoin="round" />
            </g>
          );
        })()}

        {/* cold-storage container */}
        <Shadow x={K.x} y={K.y} w={K.w} d={K.d} h={K.h} />
        <IsoBox x={K.x} y={K.y} w={K.w} d={K.d} h={K.h} z={Z0} color={p.container} u={U} ink={ink} />
        {/* corrugation */}
        <g stroke={shade(p.container, -0.5)} strokeWidth={1.5} opacity={0.6}>
          {Array.from({ length: 11 }, (_, i) => {
            const x = K.x + 0.3 + i * 0.3;
            return <polyline key={i} fill="none" points={poly([[x, K.y + K.d, Z0 + 0.1], [x, K.y + K.d, Z0 + K.h - 0.1]])} />;
          })}
        </g>
        {/* doors on the right face */}
        <IsoWindow face="right" plane={K.x + K.w} a={K.y + 0.15} z={Z0 + 0.1} w={1.4} h={1.4} fill={shade(p.container, -0.2)} u={U} ink={ink} />
        <polyline points={poly([[K.x + K.w, K.y + 0.85, Z0 + 0.1], [K.x + K.w, K.y + 0.85, Z0 + 1.5]])} stroke={p.ink} strokeWidth={2.4} fill="none" />
        {[0.55, 1.15].map((a) => (
          <polyline key={a} points={poly([[K.x + K.w, K.y + a, Z0 + 0.3], [K.x + K.w, K.y + a, Z0 + 1.3]])} stroke={p.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        ))}
        {/* door lamp: lights up at the moment */}
        <IsoWindow face="right" plane={K.x + K.w + 0.005} a={K.y + 0.6} z={Z0 + 1.52} w={0.5} h={0.09} fill={p.sun} u={U} ink={ink}>
          <animate attributeName="opacity" values="0.35;0.35;1;1;0.35" keyTimes={ON.keyTimes} dur={ON.dur} {...rep} />
        </IsoWindow>
        {/* stencil label + spinning chiller fan on the left face */}
        <IsoWindow face="left" plane={K.y + K.d + 0.005} a={K.x + 0.15} z={Z0 + 1.0} w={2.6} h={0.42} fill={p.battery} u={U} ink={ink} />
        <LeftText x={K.x + 0.22} plane={K.y + K.d} z={Z0 + 1.11} size={12.5} fill={p.ink}>
          {p.containerLabel}
        </LeftText>
        {(() => {
          const [fx, fy] = S([K.x + 3.22, K.y + K.d, Z0 + 0.62]);
          return (
            <g transform={`matrix(${C30},0.5,0,1,${fx.toFixed(1)},${fy.toFixed(1)}) scale(0.82)`}>
              <circle r={27} fill={p.ink} />
              <circle r={23} fill={shade(p.container, -0.45)} />
              <g>
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" {...rep} />
                {[0, 120, 240].map((a) => (
                  <ellipse key={a} rx={6} ry={18} cy={-10} transform={`rotate(${a})`} fill={p.battery} stroke={p.ink} strokeWidth={1.5} />
                ))}
              </g>
              <circle r={4.5} fill={p.ink} />
            </g>
          );
        })()}

        {/* water pump: nodding arm + drip */}
        <IsoBox x={8.0} y={6.3} w={0.9} d={0.8} h={0.35} z={Z0} color="#9A9A92" u={U} ink={ink} />
        <IsoBox x={8.35} y={6.6} w={0.2} d={0.2} h={0.9} z={Z0 + 0.35} color="#3A3A3A" u={U} ink={ink} />
        {(() => {
          const [px, py] = S([8.45, 6.7, Z0 + 1.3]);
          const [dx, dy] = S([9.25, 7.35, Z0 + 0.35]);
          return (
            <>
              <g transform={`translate(${px.toFixed(1)} ${py.toFixed(1)})`}>
                <g>
                  <animateTransform attributeName="transform" type="rotate" values="-14;12;-14" dur="2s" {...spline} {...rep} />
                  <line x1={-46} y1={-8} x2={50} y2={10} stroke={p.ink} strokeWidth={11} strokeLinecap="round" />
                  <line x1={-46} y1={-8} x2={50} y2={10} stroke={p.accent} strokeWidth={5} strokeLinecap="round" />
                  <rect x={40} y={0} width={22} height={26} rx={4} fill={p.accent} stroke={p.ink} strokeWidth={2.4} />
                </g>
                <circle r={7} fill={p.sun} stroke={p.ink} strokeWidth={2.4} />
              </g>
              {/* trough + drip */}
              <ellipse cx={dx} cy={dy + 6} rx={24} ry={9} fill={p.panel} stroke={p.ink} strokeWidth={2.4} />
              <circle cx={dx} r={4} fill={p.panel} stroke={p.ink} strokeWidth={1.5}>
                <animate attributeName="cy" values={`${dy - 34};${dy + 2}`} dur="1s" {...rep} />
                <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="1s" {...rep} />
              </circle>
            </>
          );
        })()}

        {/* front cone */}
        <IsoCylinder x={0.5} y={7.4} z={Z0} r={0.22} h={0.08} color={p.ink} u={U} ink={ink} cone={{ h: 0.6, color: p.accent }} />

        {/* ---------- floodlight head + beam (the moment) ---------- */}
        <polygon points={`${lamp[0] - 8},${lamp[1] + 6} ${lamp[0] + 8},${lamp[1] + 6} ${lamp[0] - 40},${lamp[1] + 260} ${lamp[0] - 230},${lamp[1] + 210}`} fill="url(#cg-beam)" style={{ mixBlendMode: dark ? 'screen' : 'multiply' }}>
          <animate attributeName="opacity" values="0.12;0.12;0.75;0.75;0.12" keyTimes={ON.keyTimes} dur={ON.dur} {...rep} />
        </polygon>
        <g transform={`translate(${lamp[0].toFixed(1)} ${lamp[1].toFixed(1)}) rotate(18)`}>
          <rect x={-20} y={-10} width={40} height={20} rx={4} fill="#3A3A3A" stroke={p.ink} strokeWidth={2.4} />
          <rect x={-16} y={5} width={32} height={6} rx={2} fill={p.sun}>
            <animate attributeName="opacity" values="0.4;0.4;1;1;0.4" keyTimes={ON.keyTimes} dur={ON.dur} {...rep} />
          </rect>
        </g>

        {/* power-on flash + tag above the crate */}
        <circle cx={crateCentre[0]} cy={crateCentre[1]} r={40} fill="url(#cg-flash)" opacity={0}>
          <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes="0;0.499;0.51;0.62;1" dur={`${LOOP}s`} {...rep} />
          <animate attributeName="r" values="40;40;60;260;260" keyTimes="0;0.499;0.51;0.62;1" dur={`${LOOP}s`} {...rep} />
        </circle>
        <circle cx={crateCentre[0]} cy={crateCentre[1]} r={60} fill="none" stroke={p.ink} strokeWidth={4} opacity={0}>
          <animate attributeName="opacity" values="0;0;0.8;0;0" keyTimes="0;0.499;0.51;0.6;1" dur={`${LOOP}s`} {...rep} />
          <animate attributeName="r" values="60;60;70;190;190" keyTimes="0;0.499;0.51;0.6;1" dur={`${LOOP}s`} {...rep} />
        </circle>
        <g transform={`translate(${tagAt[0].toFixed(1)} ${tagAt[1].toFixed(1)}) rotate(-4)`}>
          <g transform="scale(0)">
            <animateTransform attributeName="transform" type="scale" values="0;0;1.2;1;1;0;0" keyTimes="0;0.5;0.535;0.57;0.9;0.94;1" dur={`${LOOP}s`} {...rep} />
            <rect x={-92 + 7} y={-26 + 7} width={184} height={52} fill={p.ink} />
            <rect x={-92} y={-26} width={184} height={52} fill={p.pop} stroke={p.ink} strokeWidth={4} />
            <text x={0} y={9} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={700} fontSize={24} letterSpacing="3" fill="#000000">
              {p.powerLabel}
            </text>
          </g>
        </g>
      </g>

      {/* site lights warm the whole frame a touch at the moment */}
      <rect width={scene.width} height={scene.height} fill={p.sun} opacity={0} style={{ mixBlendMode: 'multiply' }}>
        <animate attributeName="opacity" values="0;0;0.18;0;0" keyTimes="0;0.499;0.51;0.6;1" dur={`${LOOP}s`} {...rep} />
      </rect>
    </svg>
  );
}

function Face({ p, fill }: { p: P3[]; fill: string }) {
  return <polygon points={poly(p)} fill={fill} />;
}
