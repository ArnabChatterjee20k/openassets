// Isometric illustration toolkit for animated SVG scenes.
// World axes: x runs down-right, y runs down-left, z is up. One world unit = `u`
// pixels. Draw back-to-front yourself (painter's order): larger x + y is nearer.
// Animate with SMIL (<animate>, <animateTransform>, <animateMotion>) so the
// exported .svg plays anywhere; the pipeline seeks it for stills and video.
import type { ReactNode, SVGProps } from 'react';

export type P3 = [number, number, number];

const C30 = Math.cos(Math.PI / 6);

/** Project a world point to screen space. */
export const iso = ([x, y, z]: P3, u: number): [number, number] => [(x - y) * C30 * u, ((x + y) / 2 - z) * u];

export const pts = (ps: P3[], u: number) =>
  ps
    .map((p) => iso(p, u))
    .map(([a, b]) => `${a.toFixed(2)},${b.toFixed(2)}`)
    .join(' ');

/** Mix a hex color toward white (t > 0) or black (t < 0). */
export function shade(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (to - v) * k).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

/** Shared line style: illustration outlines are dark, thin and round-joined. */
export interface Ink {
  stroke?: string;
  strokeWidth?: number;
}
const line = (ink: Ink = {}) => ({
  stroke: ink.stroke ?? 'rgba(10,10,20,0.55)',
  strokeWidth: ink.strokeWidth ?? 1.2,
  strokeLinejoin: 'round' as const,
});

/** A polygon on any plane, from world points. */
export function Face({ p, u, fill, ink, ...rest }: { p: P3[]; u: number; fill: string; ink?: Ink } & SVGProps<SVGPolygonElement>) {
  return <polygon points={pts(p, u)} fill={fill} {...line(ink)} {...rest} />;
}

/** Shaded box: top lit, right face mid, left face dark. */
export function IsoBox({ x, y, z = 0, w, d, h, color, u, ink, top = true }: { x: number; y: number; z?: number; w: number; d: number; h: number; color: string; u: number; ink?: Ink; top?: boolean }) {
  const X = x + w;
  const Y = y + d;
  const Z = z + h;
  return (
    <g>
      <Face u={u} ink={ink} fill={shade(color, -0.32)} p={[[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]]} />
      <Face u={u} ink={ink} fill={shade(color, -0.15)} p={[[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]]} />
      {top && <Face u={u} ink={ink} fill={shade(color, 0.12)} p={[[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]]} />}
    </g>
  );
}

/** Pyramid / hip roof sitting on a w×d footprint at height z. */
export function IsoRoof({ x, y, z, w, d, h, color, u, ink }: { x: number; y: number; z: number; w: number; d: number; h: number; color: string; u: number; ink?: Ink }) {
  const apex: P3 = [x + w / 2, y + d / 2, z + h];
  return (
    <g>
      <Face u={u} ink={ink} fill={shade(color, -0.3)} p={[[x, y + d, z], [x + w, y + d, z], apex]} />
      <Face u={u} ink={ink} fill={shade(color, -0.08)} p={[[x + w, y, z], [x + w, y + d, z], apex]} />
    </g>
  );
}

/** Gable roof running along x (ridge parallel to x). */
export function IsoGable({ x, y, z, w, d, h, color, u, ink }: { x: number; y: number; z: number; w: number; d: number; h: number; color: string; u: number; ink?: Ink }) {
  const ridgeY = y + d / 2;
  return (
    <g>
      <Face u={u} ink={ink} fill={shade(color, -0.2)} p={[[x + w, y, z], [x + w, y + d, z], [x + w, ridgeY, z + h]]} />
      <Face u={u} ink={ink} fill={shade(color, -0.05)} p={[[x, y + d, z], [x + w, y + d, z], [x + w, ridgeY, z + h], [x, ridgeY, z + h]]} />
    </g>
  );
}

/** Vertical cylinder (towers, tanks, trunks) with an optional cone cap. */
export function IsoCylinder({ x, y, z = 0, r, h, color, u, ink, cone }: { x: number; y: number; z?: number; r: number; h: number; color: string; u: number; ink?: Ink; cone?: { h: number; color: string } }) {
  const [cx, cyBottom] = iso([x, y, z], u);
  const cyTop = iso([x, y, z + h], u)[1];
  const rx = r * u * 1.2247; // circle in the ground plane → ellipse on screen
  const ry = r * u * 0.7071;
  const l = line(ink);
  const gid = `cyl-${color.slice(1)}`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" x2="1">
          <stop offset="0" stopColor={shade(color, -0.35)} />
          <stop offset="0.6" stopColor={shade(color, -0.05)} />
          <stop offset="1" stopColor={shade(color, -0.2)} />
        </linearGradient>
      </defs>
      <path
        d={`M${cx - rx},${cyTop} L${cx - rx},${cyBottom} A${rx},${ry} 0 0 0 ${cx + rx},${cyBottom} L${cx + rx},${cyTop} Z`}
        fill={`url(#${gid})`}
        {...l}
      />
      {cone ? (
        <path d={`M${cx - rx * 1.15},${cyTop} A${rx * 1.15},${ry * 1.15} 0 0 0 ${cx + rx * 1.15},${cyTop} L${cx},${cyTop - cone.h * u} Z`} fill={shade(cone.color, -0.1)} {...l} />
      ) : (
        <ellipse cx={cx} cy={cyTop} rx={rx} ry={ry} fill={shade(color, 0.12)} {...l} />
      )}
    </g>
  );
}

/**
 * A window (or door/sign) on a box's right face (plane x = const) or left face
 * (plane y = const). `a` runs along the face, `b` is height above `z`.
 */
export function IsoWindow({
  face,
  plane,
  a,
  z,
  w,
  h,
  fill,
  u,
  ink,
  children,
}: {
  face: 'right' | 'left';
  plane: number;
  a: number;
  z: number;
  w: number;
  h: number;
  fill: string;
  u: number;
  ink?: Ink;
  children?: ReactNode;
}) {
  const p: P3[] =
    face === 'right'
      ? [[plane, a, z], [plane, a + w, z], [plane, a + w, z + h], [plane, a, z + h]]
      : [[a, plane, z], [a + w, plane, z], [a + w, plane, z + h], [a, plane, z + h]];
  return (
    <polygon points={pts(p, u)} fill={fill} {...line(ink)}>
      {children}
    </polygon>
  );
}

/** Flat diamond tile grid on the ground plane (z = 0). */
export function IsoGrid({ x, y, w, d, u, color, opacity = 0.25 }: { x: number; y: number; w: number; d: number; u: number; color: string; opacity?: number }) {
  const lines: ReactNode[] = [];
  for (let i = 0; i <= w; i++) {
    const [a1, b1] = iso([x + i, y, 0], u);
    const [a2, b2] = iso([x + i, y + d, 0], u);
    lines.push(<line key={`x${i}`} x1={a1} y1={b1} x2={a2} y2={b2} />);
  }
  for (let j = 0; j <= d; j++) {
    const [a1, b1] = iso([x, y + j, 0], u);
    const [a2, b2] = iso([x + w, y + j, 0], u);
    lines.push(<line key={`y${j}`} x1={a1} y1={b1} x2={a2} y2={b2} />);
  }
  return (
    <g stroke={color} strokeWidth={1} opacity={opacity}>
      {lines}
    </g>
  );
}

/** SMIL flicker for glowing windows/lamps: deterministic irregular opacity. */
export function Flicker({ dur, seed = 0, low = 0.55 }: { dur: number; seed?: number; low?: number }) {
  const vals = Array.from({ length: 9 }, (_, i) => {
    const r = Math.abs(Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453) % 1;
    return r > 0.75 ? low : 1;
  });
  vals[vals.length - 1] = vals[0]; // seamless loop
  return <animate attributeName="opacity" values={vals.join(';')} dur={`${dur}s`} repeatCount="indefinite" />;
}
