import { z } from 'zod';
import { color, text } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Inspection Line',
  description:
    'Landing-page hero for Loupe: an isometric inspection line. Machined gears ride a conveyor under a camera gantry, a violet scan fan sweeps each one, a flawed part flashes pink and gets pushed into the reject bin while good parts land in the pass tray. Loops seamlessly.',
  tags: ['hero', 'isometric', 'manufacturing', 'inspection', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Gantry sign').default('LOUPE'),
  stat: text('Monitor stat').default('99.7%'),
  wallTop: color('Wall top').default('#E9E3F5'),
  wallBottom: color('Wall bottom').default('#D6CCEC'),
  floor: color('Floor').default('#C9BEEA'),
  machine: color('Machine body').default('#F6F3FD'),
  frame: color('Frame').default('#4B3F8F'),
  belt: color('Belt').default('#2C2452'),
  part: color('Parts').default('#DCD6EA'),
  scan: color('Scan light').default('#5E4AE3'),
  defect: color('Defect').default('#F49CBB'),
  pass: color('Pass').default('#2EC4B6'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { wallTop: '#12001F', wallBottom: '#2A0F48', floor: '#3A2366', machine: '#D9CFF2', frame: '#1C0B33', belt: '#0E0618', part: '#C8C0E0', scan: '#B026FF', defect: '#FF2E88', pass: '#3BF0D0' },
  frost: { wallTop: '#E9EEF1', wallBottom: '#C9D6DE', floor: '#AFC2CE', machine: '#FFFFFF', frame: '#2F6F8F', belt: '#17242E', part: '#D3DDE3', scan: '#2F6F8F', defect: '#E4572E', pass: '#2EC4B6', sign: 'QC LINE 3' },
  'mid-century': { wallTop: '#F4E9D8', wallBottom: '#E6D3B3', floor: '#D9BE8F', machine: '#FFF8EC', frame: '#2C7873', belt: '#2E2A24', part: '#E9B44C', scan: '#2C7873', defect: '#D96C3D', pass: '#2C7873' },
  candy: { wallTop: '#FDF3F8', wallBottom: '#F7DDEB', floor: '#EFC3DA', machine: '#FFFFFF', frame: '#8A7BFF', belt: '#3A1F4A', part: '#E6E0FF', scan: '#8A7BFF', defect: '#FF7EB6', pass: '#4FD1C5' },
};

type P = z.infer<typeof schema>;

const U = 46;
const LOOP = scene.loop;
const OX = 467;
const OY = 262;
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(26,16,58,0.7)';
const ink = { stroke: INK, strokeWidth: 1.3 };

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);

// Conveyor geometry (world units)
const BX0 = 0.6;
const BX1 = 13.4;
const BY0 = 3;
const BY1 = 5;
const BZ = 1.5; // belt top
const LANE = 4; // parts ride the centre line
const SPEED = (BX1 - BX0 - 0.4) / LOOP; // units per second
const CAM_X = 6;
const PUSH_X = 9.2;

/** Flat spur gear lying on a plane at height z, centred on (x, y). */
function gearPoints(x: number, y: number, z: number, r: number, teeth = 10) {
  const out: P3[] = [];
  const rr = r * 0.8;
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [
      [rr, a],
      [r, a + step * 0.18],
      [r, a + step * 0.42],
      [rr, a + step * 0.6],
    ].forEach(([q, ang]) => out.push([x + Math.cos(ang) * q, y + Math.sin(ang) * q, z]));
  }
  return out;
}

function ellipsePts(x: number, y: number, z: number, r: number, n = 24): P3[] {
  return Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * r, y + Math.sin((i / n) * Math.PI * 2) * r, z] as P3);
}

/** A part drawn at the world origin (0,0,BZ); move it with a screen-space translate. */
function Part({ p, flawed = false }: { p: P; flawed?: boolean }) {
  return (
    <g>
      <polygon points={poly(gearPoints(0, 0, BZ, 0.62))} transform="translate(0 7)" fill={shade(p.part, -0.45)} stroke={INK} strokeWidth="1" />
      <polygon points={poly(gearPoints(0, 0, BZ + 0.17, 0.62))} fill={p.part} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={poly(ellipsePts(0, 0, BZ + 0.17, 0.2))} fill={shade(p.belt, 0.15)} stroke={INK} strokeWidth="1" />
      <polygon points={poly(ellipsePts(0, 0, BZ + 0.17, 0.34))} fill="none" stroke={shade(p.part, -0.25)} strokeWidth="1" />
      {flawed && <circle cx={S([0.3, -0.38, BZ + 0.17])[0]} cy={S([0.3, -0.38, BZ + 0.17])[1]} r="2.6" fill={p.defect} />}
    </g>
  );
}

/** keyTimes/values helper for a part's journey (screen-space translate). */
const at = (x: number, y = LANE): string => {
  const [a, b] = S([x, y, 0]);
  return `${(a - S([0, 0, 0])[0]).toFixed(1)} ${(b - S([0, 0, 0])[1]).toFixed(1)}`;
};

export default function InspectionLine(p: P) {
  const xs = BX0 + 0.2;
  const xe = BX1 - 0.2;
  // Fraction of the loop at which a part starting at `xs` reaches world x.
  const when = (x: number) => (x - xs) / SPEED / LOOP;
  const camT = when(CAM_X); // ~0.40
  const pushT = when(PUSH_X); // ~0.66
  const r3 = (n: number) => n.toFixed(3);
  // The flawed part's moment, in loop fractions.
  const flash = `0;0;1;0.2;1;0;0`;
  const flashTimes = `0;${r3(camT - 0.005)};${r3(camT + 0.01)};${r3(camT + 0.025)};${r3(camT + 0.04)};${r3(camT + 0.12)};1`;

  const [gx, gy] = S([CAM_X, LANE, 4.9]); // camera lens point
  const [signX, signY] = S([CAM_X + 0.37, 3.25, 5.63]);
  const [monX, monY] = S([2.2, 1.2, 3.9]);

  return (
    <svg viewBox={`0 0 ${scene.width} ${scene.height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="il-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.wallTop} />
          <stop offset="1" stopColor={p.wallBottom} />
        </linearGradient>
        <radialGradient id="il-halo">
          <stop offset="0" stopColor={p.defect} stopOpacity="0.55" />
          <stop offset="0.55" stopColor={p.defect} stopOpacity="0.15" />
          <stop offset="1" stopColor={p.defect} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="il-halo2">
          <stop offset="0" stopColor={p.scan} stopOpacity="0.35" />
          <stop offset="1" stopColor={p.scan} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="il-fan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.scan} stopOpacity="0.85" />
          <stop offset="1" stopColor={p.scan} stopOpacity="0.15" />
        </linearGradient>
        <filter id="il-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="il-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="il-belt">
          <polygon points={poly([[BX0, BY0, BZ], [BX1, BY0, BZ], [BX1, BY1, BZ], [BX0, BY1, BZ]])} transform={`translate(${OX} ${OY})`} />
        </clipPath>
      </defs>

      {/* Wall, halos, drifting motes */}
      <rect width={scene.width} height={scene.height} fill="url(#il-wall)" />
      <circle cx="660" cy="260" r="400" fill="url(#il-halo)" />
      <circle cx="260" cy="560" r="380" fill="url(#il-halo2)" />
      <circle cx="980" cy="720" r="300" fill="url(#il-halo2)" />
      {Array.from({ length: 22 }, (_, i) => {
        const x = 60 + rand(i * 3.3) * 1080;
        const y = 80 + rand(i * 7.1) * 700;
        const dur = [6, 3, 2][i % 3];
        return (
          <circle key={i} cx={x} cy={y} r={1.5 + rand(i * 1.7) * 2.5} fill={i % 4 === 0 ? p.pass : '#FFFFFF'} opacity="0.7">
            <animate attributeName="cy" values={`${y};${y - 40};${y}`} dur={`${dur}s`} begin={`-${(rand(i * 9.1) * dur).toFixed(2)}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.8;0.15" dur={`${dur}s`} begin={`-${(rand(i * 2.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── Floor slab ── */}
        <polygon points={poly([[-0.3, 8.6, -0.6], [15.3, 8.6, -0.6], [15.3, -0.3, -0.6]])} fill="none" />
        <IsoBox x={-0.3} y={-0.3} z={-0.6} w={15.6} d={8.9} h={0.6} color={p.floor} u={U} ink={ink} />
        <IsoGrid x={0} y={0} w={15} d={8} u={U} color={shade(p.floor, -0.4)} opacity={0.35} />
        {/* soft machine shadow on the floor */}
        <polygon points={poly([[BX0, BY1, 0.01], [BX1, BY1, 0.01], [BX1 + 0.6, BY1 + 1.4, 0.01], [BX0 + 0.6, BY1 + 1.4, 0.01]])} fill="#1A103A" opacity="0.18" filter="url(#il-blur)" />

        {/* ── Monitor on a stand (back left) ── */}
        <IsoCylinder x={2.6} y={1.2} r={0.12} h={2.6} color={p.frame} u={U} ink={ink} />
        <IsoBox x={1.8} y={0.9} z={2.5} w={2.2} d={0.25} h={1.9} color={p.frame} u={U} ink={ink} />
        <polygon points={poly([[1.9, 1.16, 2.6], [3.9, 1.16, 2.6], [3.9, 1.16, 4.3], [1.9, 1.16, 4.3]])} fill={shade(p.belt, 0.1)} stroke={INK} strokeWidth="1" />
        {/* screen content in the wall plane */}
        <g transform={`translate(${monX} ${monY}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
          <circle cx="16" cy="18" r="13" fill="none" stroke={p.part} strokeWidth="2" />
          <circle cx="21" cy="13" r="5" fill="none" stroke={p.defect} strokeWidth="2">
            <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" />
          </circle>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={36 + i * 9} y={10} width="6" height="22" fill={i === 2 ? p.defect : p.pass} opacity="0.9">
              <animate attributeName="height" values={`${10 + i * 3};${22 - i * 2};${10 + i * 3}`} dur="2s" begin={`-${i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${32 - 10 - i * 3};${32 - 22 + i * 2};${32 - 10 - i * 3}`} dur="2s" begin={`-${i * 0.4}s`} repeatCount="indefinite" />
            </rect>
          ))}
          <text x="2" y="50" fontFamily="'Fredoka','Outfit',system-ui,sans-serif" fontWeight="600" fontSize="15" fill={p.pass}>
            {p.stat}
          </text>
        </g>

        {/* ── Crates of raw blanks, back right ── */}
        <IsoBox x={11.2} y={0.3} w={1.5} d={1.5} h={1.1} color={shade(p.floor, 0.35)} u={U} ink={ink} />
        <IsoBox x={12.9} y={0.4} w={1.3} d={1.3} h={0.9} color={shade(p.floor, 0.25)} u={U} ink={ink} />
        <IsoBox x={11.45} y={0.5} z={1.1} w={1.1} d={1.1} h={0.8} color={shade(p.floor, 0.45)} u={U} ink={ink} />
        <polygon points={poly([[11.46, 1.61, 1.4], [12.54, 1.61, 1.4], [12.54, 1.61, 1.55], [11.46, 1.61, 1.55]])} fill={p.scan} opacity="0.8" />

        {/* ── Reject pusher (behind the belt) ── */}
        <IsoBox x={PUSH_X - 0.5} y={1.2} w={1} d={1.2} h={2.1} color={p.machine} u={U} ink={ink} />
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0 0;0 0;${at(0, 1.6)};0 0;0 0`}
            keyTimes={`0;${r3(pushT - 0.02)};${r3(pushT + 0.03)};${r3(pushT + 0.09)};1`}
            dur={`${LOOP}s`}
            repeatCount="indefinite"
          />
          <IsoBox x={PUSH_X - 0.12} y={2.4} z={1.55} w={0.24} d={0.5} h={0.24} color={shade(p.machine, -0.2)} u={U} ink={ink} />
          <IsoBox x={PUSH_X - 0.5} y={2.9} z={1.45} w={1} d={0.14} h={0.5} color={p.defect} u={U} ink={ink} />
        </g>

        {/* ── Gantry back post ── */}
        <IsoBox x={CAM_X - 0.25} y={1.9} w={0.5} d={0.5} h={5.4} color={p.frame} u={U} ink={ink} />

        {/* ── Conveyor ── */}
        {[1.4, 4.2, 7.6, 10.8, 12.8].map((x) => (
          <IsoBox key={x} x={x - 0.15} y={BY1 - 0.4} w={0.3} d={0.3} h={BZ - 0.4} color={shade(p.frame, -0.1)} u={U} ink={ink} />
        ))}
        <IsoBox x={BX0} y={BY0} z={BZ - 0.45} w={BX1 - BX0} d={BY1 - BY0} h={0.45} color={p.machine} u={U} ink={ink} />
        <polygon points={poly([[BX0, BY0, BZ], [BX1, BY0, BZ], [BX1, BY1, BZ], [BX0, BY1, BZ]])} fill={p.belt} stroke={INK} strokeWidth="1.2" />
        {/* belt slats, moving at the parts' speed */}
        <g clipPath="url(#il-belt)" transform={`translate(${-OX} ${-OY})`}>
          <g transform={`translate(${OX} ${OY})`}>
            <g>
              <animateTransform attributeName="transform" type="translate" values={`0 0;${at(SPEED * 0.5, 0)}`} dur="0.5s" repeatCount="indefinite" />
              {Array.from({ length: 16 }, (_, i) => {
                const x = BX0 - SPEED * 0.5 + i * SPEED * 0.5 * 1;
                return <polyline key={i} points={poly([[x, BY0, BZ], [x, BY1, BZ]])} stroke={shade(p.belt, 0.25)} strokeWidth="2" fill="none" />;
              })}
            </g>
          </g>
        </g>
        {/* side rails */}
        <polygon points={poly([[BX0, BY0 - 0.12, BZ], [BX1, BY0 - 0.12, BZ], [BX1, BY0 - 0.12, BZ + 0.3], [BX0, BY0 - 0.12, BZ + 0.3]])} fill={shade(p.machine, -0.1)} stroke={INK} strokeWidth="1" />

        {/* ── Parts riding the belt (three, a third of a loop apart) ── */}
        {[0, 1, 2].map((k) => {
          const flawed = k === 0;
          const begin = `-${(k * LOOP) / 3}s`;
          const values = flawed ? `${at(xs)};${at(PUSH_X)};${at(PUSH_X)};${at(PUSH_X, 6.7)};${at(PUSH_X, 6.7)}` : `${at(xs)};${at(xe)}`;
          const keyTimes = flawed ? `0;${r3(pushT)};${r3(pushT + 0.02)};${r3(pushT + 0.08)};1` : '0;1';
          const op = flawed ? `0;1;1;1;0;0` : `0;1;1;0`;
          const opT = flawed ? `0;0.04;${r3(pushT + 0.06)};${r3(pushT + 0.11)};${r3(pushT + 0.12)};1` : `0;0.04;0.95;1`;
          return (
            <g key={k} opacity="0">
              <animateTransform attributeName="transform" type="translate" values={values} keyTimes={keyTimes} dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" />
              <animate attributeName="opacity" values={op} keyTimes={opT} dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" />
              <Part p={p} flawed={flawed} />
              {flawed && (
                <g>
                  {/* the flag: a pink ring pops round the part as it's scanned */}
                  <polygon points={poly(ellipsePts(0, 0, BZ + 0.18, 0.85, 36))} fill="none" stroke={p.defect} strokeWidth="3" opacity="0" filter="url(#il-glow)">
                    <animate attributeName="opacity" values="0;0;1;1;0" keyTimes={`0;${r3(camT)};${r3(camT + 0.02)};${r3(pushT + 0.06)};1`} dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" />
                  </polygon>
                </g>
              )}
              {!flawed && (
                <g opacity="0">
                  <animate attributeName="opacity" values="0;0;1;1" keyTimes={`0;${r3(camT + 0.02)};${r3(camT + 0.05)};1`} dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" />
                  <circle cx={S([0, 0, BZ + 0.9])[0]} cy={S([0, 0, BZ + 0.9])[1]} r="9" fill={p.pass} stroke={INK} strokeWidth="1.2" />
                  <path d={`M${S([0, 0, BZ + 0.9])[0] - 4},${S([0, 0, BZ + 0.9])[1]} l3,3.5 l5.5,-6.5`} fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </g>
          );
        })}

        {/* ── Gantry front post, beam and camera ── */}
        {/* ── Infeed hopper over the start of the belt ── */}
        <IsoBox x={BX0 + 0.2} y={2.7} z={BZ + 0.9} w={1.6} d={2.6} h={0.25} color={shade(p.frame, 0.1)} u={U} ink={ink} />
        <IsoBox x={BX0} y={2.5} z={BZ + 1.15} w={2} d={3} h={1.3} color={p.machine} u={U} ink={ink} />
        <polygon points={poly([[BX0 + 0.15, 2.65, BZ + 2.46], [BX0 + 1.85, 2.65, BZ + 2.46], [BX0 + 1.85, 5.35, BZ + 2.46], [BX0 + 0.15, 5.35, BZ + 2.46]])} fill={shade(p.belt, 0.05)} />
        {[[1.2, 3.3], [1.9, 4.3], [1.1, 4.7]].map(([x, y], i) => (
          <polygon key={i} points={poly(gearPoints(x, y, BZ + 2.5, 0.42, 9))} fill={p.part} stroke={INK} strokeWidth="1" />
        ))}
        <IsoBox x={BX0 - 0.05} y={5.35} z={BZ + 1.4} w={2.1} d={0.15} h={0.12} color={p.scan} u={U} ink={ink} />
        {/* camera head (drawn first so the beam and its sign sit over its top) */}
        <IsoBox x={CAM_X - 0.45} y={LANE - 0.45} z={4.6} w={0.9} d={0.9} h={0.8} color={p.machine} u={U} ink={ink} />
        <IsoCylinder x={CAM_X} y={LANE} z={4.35} r={0.28} h={0.25} color={p.belt} u={U} ink={ink} />
        {/* cantilevered beam from the back post; the camera hangs at its tip */}
        <IsoBox x={CAM_X - 0.35} y={1.8} z={5.4} w={0.7} d={2.9} h={0.8} color={p.machine} u={U} ink={ink} />
        {/* sign plate + lettering on the beam's right face (plane x = CAM_X + 0.35) */}
        <polygon points={poly([[CAM_X + 0.36, 1.95, 5.5], [CAM_X + 0.36, 4.55, 5.5], [CAM_X + 0.36, 4.55, 6.1], [CAM_X + 0.36, 1.95, 6.1]])} fill={p.scan} stroke={INK} strokeWidth="1" />
        <g transform={`translate(${signX} ${signY}) matrix(${C30}, -0.5, 0, 1, 0, 0)`}>
          <text x="0" y="0" textAnchor="middle" fontFamily="'Fredoka','Outfit',system-ui,sans-serif" fontWeight="600" fontSize="19" letterSpacing="2" fill="#FFFFFF">
            {p.sign}
          </text>
        </g>
        {/* scan fan (the light cone) pulses as each part passes */}
        <polygon points={`${gx},${gy + 10} ${S([CAM_X - 0.9, LANE + 0.9, BZ + 0.1]).join(',')} ${S([CAM_X + 0.9, LANE + 0.9, BZ + 0.1]).join(',')} ${S([CAM_X + 0.9, LANE - 0.9, BZ + 0.1]).join(',')}`} fill="url(#il-fan)" opacity="0.25" style={{ mixBlendMode: 'multiply' }}>
          <animate attributeName="opacity" values="0.2;0.2;0.75;0.2;0.2" keyTimes={`0;${r3((camT * 3) % 1 - 0.06)};${r3((camT * 3) % 1)};${r3((camT * 3) % 1 + 0.12)};1`} dur="2s" repeatCount="indefinite" />
        </polygon>
        <polygon points={poly(ellipsePts(CAM_X, LANE, BZ + 0.02, 0.95, 32))} fill={p.scan} opacity="0.25">
          <animate attributeName="opacity" values="0.15;0.15;0.55;0.15;0.15" keyTimes={`0;${r3((camT * 3) % 1 - 0.06)};${r3((camT * 3) % 1)};${r3((camT * 3) % 1 + 0.12)};1`} dur="2s" repeatCount="indefinite" />
        </polygon>
        {/* the moment: lens flashes pink when it catches the flaw */}
        <circle cx={gx} cy={gy + 8} r="26" fill={p.defect} opacity="0" filter="url(#il-glow)">
          <animate attributeName="opacity" values={flash} keyTimes={flashTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        {/* andon light stack on the front post */}
        {[
          [6.45, p.pass],
          [6.75, p.defect],
        ].map(([z, c], i) => {
          const [ax, ay] = S([CAM_X, 2.1, z as number]);
          return (
            <g key={i}>
              <rect x={ax - 7} y={ay - 11} width="14" height="12" rx="3" fill={c as string} stroke={INK} strokeWidth="1" opacity={i === 0 ? 1 : 0.35} filter="url(#il-glow)">
                {i === 0 ? (
                  <Flicker dur={LOOP} seed={3} low={0.75} />
                ) : (
                  <animate attributeName="opacity" values="0.35;0.35;1;0.35;1;0.35;0.35" keyTimes={flashTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
                )}
              </rect>
            </g>
          );
        })}

        {/* rollers on the belt's front face (plane y = BY1), spinning */}
        {[BX0 + 0.35, BX1 - 0.35].map((x, i) => {
          const [rx, ry] = S([x, BY1, BZ - 0.22]);
          return (
            <g key={i} transform={`translate(${rx} ${ry}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
              <circle r="7" fill={shade(p.machine, -0.25)} stroke={INK} strokeWidth="1" />
              <g>
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="1s" repeatCount="indefinite" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke={INK} strokeWidth="1.5" />
                <line x1="0" y1="-6" x2="0" y2="6" stroke={INK} strokeWidth="1.5" />
              </g>
            </g>
          );
        })}

        {/* ── Reject bin (front of the belt) ── */}
        <polygon points={poly([[PUSH_X - 0.9, 6.2, 0.05], [PUSH_X + 0.9, 6.2, 0.05], [PUSH_X + 0.9, 7.8, 0.05], [PUSH_X - 0.9, 7.8, 0.05]])} fill={shade(p.defect, -0.35)} />
        <IsoBox x={PUSH_X - 0.9} y={7.7} w={1.8} d={0.1} h={1} color={p.defect} u={U} ink={ink} />
        <IsoBox x={PUSH_X + 0.8} y={6.2} w={0.1} d={1.6} h={1} color={p.defect} u={U} ink={ink} />
        <g transform={`translate(${S([PUSH_X - 0.75, 7.81, 0.3])[0]} ${S([PUSH_X - 0.75, 7.81, 0.3])[1]}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
          <text x="0" y="0" fontFamily="'Outfit',system-ui,sans-serif" fontWeight="800" fontSize="11" letterSpacing="1.2" fill={shade(p.defect, -0.6)}>
            REJECT
          </text>
        </g>

        {/* ── Pass tray at the end of the line ── */}
        <IsoBox x={13.5} y={2.7} w={1.6} d={2.6} h={0.9} color={p.pass} u={U} ink={ink} />
        <polygon points={poly([[13.62, 2.82, 0.91], [14.98, 2.82, 0.91], [14.98, 5.18, 0.91], [13.62, 5.18, 0.91]])} fill={shade(p.pass, -0.3)} />
        {[3.4, 4.6].map((y) => (
          <g key={y}>
            <polygon points={poly(gearPoints(14.3, y, 0.95, 0.42))} fill={p.part} stroke={INK} strokeWidth="1" />
            <polygon points={poly(ellipsePts(14.3, y, 0.95, 0.13))} fill={shade(p.belt, 0.1)} />
          </g>
        ))}
        {(() => {
          const [tx, ty] = S([14.3, 5.31, 0.45]);
          return (
            <g transform={`translate(${tx} ${ty}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
              <path d="M-10,0 l5,5 l10,-11" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })()}
        {/* a pass sparkle that blinks over the tray */}
        {(() => {
          const [sx, sy] = S([14.6, 3.4, 2.4]);
          return (
            <path d={`M${sx},${sy - 12} Q${sx + 2},${sy - 2} ${sx + 12},${sy} Q${sx + 2},${sy + 2} ${sx},${sy + 12} Q${sx - 2},${sy + 2} ${sx - 12},${sy} Q${sx - 2},${sy - 2} ${sx},${sy - 12}Z`} fill={p.pass} stroke={INK} strokeWidth="1">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
            </path>
          );
        })()}
      </g>
    </svg>
  );
}
