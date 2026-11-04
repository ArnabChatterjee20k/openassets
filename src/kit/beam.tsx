// Light-beam project cards: a small glossy 3D object on a dark card, lit by
// coloured volumetric beams from above with a glow pool underneath. The light
// colour and beam layout are seeded by the project's name, so every card is lit
// differently and the same name always looks the same.
import { z } from 'zod';
import { color, num, select, text } from '@/lib/params';
import { CARD3D_SIZE } from '@/lib/types';

/** Stable 32-bit hash of a string (FNV-1a). */
export function hashName(name: string) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

/** Deterministic, well-mixed 0..1 values from a seed (mulberry32). */
function stream(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export interface Beam {
  /** Horizontal origin across the card, 0..1. */
  x: number;
  /** Lean in degrees; beams fan out from above. */
  angle: number;
  /** Width at the bottom, as a fraction of card width. */
  width: number;
  opacity: number;
  /** Uses the secondary hue instead of the main one. */
  alt: boolean;
}

export interface BeamLight {
  color: string;
  alt: string;
  beams: Beam[];
}

/** Light colour and beam layout seeded by a name. */
export function seedLight(name: string): BeamLight {
  const rand = stream(hashName(name.trim().toLowerCase() || 'openassets'));
  const hue = Math.floor(rand() * 360);
  const count = 3 + Math.floor(rand() * 2);
  const beams: Beam[] = Array.from({ length: count }, (_, i) => ({
    x: 0.12 + (0.76 * (i + 0.2 + rand() * 0.6)) / count,
    // Lean toward the centre so beams cross over the object, with some jitter.
    angle: (0.5 - (i + 0.5) / count) * 40 + (rand() - 0.5) * 22,
    width: 0.14 + rand() * 0.16,
    opacity: 0.5 + rand() * 0.45,
    alt: rand() > 0.7,
  }));
  return { color: hslToHex(hue, 0.85, 0.58), alt: hslToHex((hue + 25 + rand() * 30) % 360, 0.8, 0.52), beams };
}

/**
 * Shared controls for every 3D card. Extend it with the object's own fields:
 *   export const schema = beamSchema({ name: 'Auth UI' }).extend({ ... })
 */
export function beamSchema(d: { name: string; light?: string }) {
  return z.object({
    name: text('Project name (seeds the light)').default(d.name),
    lightMode: select(['seeded', 'custom'], 'Light').default('seeded'),
    light: color('Custom light').default(d.light ?? '#8B5CF6'),
    beams: num(0, 1, 0.05, 'Beam strength').default(0.8),
    glow: num(0, 1, 0.05, 'Floor glow').default(0.75),
    background: color('Card background').default('#050507'),
  });
}
export type BeamParams = z.infer<ReturnType<typeof beamSchema>>;

/** The light colour a card is lit with: seeded from the name, or the custom pick. */
export function beamLight(p: Pick<BeamParams, 'name' | 'lightMode' | 'light'>): BeamLight {
  const seeded = seedLight(p.name);
  // A custom light recolours every beam; the seed still decides the layout.
  return p.lightMode === 'custom' ? { ...seeded, color: p.light, alt: p.light } : seeded;
}

/**
 * The card's 2D light: dark field, beams falling from above, a glow pool where
 * the object stands, and a vignette. Pure SVG so it renders the same in the
 * gallery, the editor, CI stills and exported PNG/video frames.
 */
export function BeamBackdrop({ p, width = CARD3D_SIZE.width, height = CARD3D_SIZE.height, id = 'bm' }: { p: BeamParams; width?: number; height?: number; id?: string }) {
  const L = beamLight(p);
  const k = p.beams;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, display: 'block' }}>
      <defs>
        <radialGradient id={`${id}-top`} cx="0.5" cy="0" r="0.9">
          <stop offset="0" stopColor={L.color} stopOpacity={0.32 * k} />
          <stop offset="1" stopColor={L.color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L.color} stopOpacity="0.9" />
          <stop offset="0.75" stopColor={L.color} stopOpacity="0.12" />
          <stop offset="1" stopColor={L.color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-alt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L.alt} stopOpacity="0.85" />
          <stop offset="1" stopColor={L.alt} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-pool`}>
          <stop offset="0" stopColor={L.color} stopOpacity={0.75 * p.glow} />
          <stop offset="0.5" stopColor={L.color} stopOpacity={0.22 * p.glow} />
          <stop offset="1" stopColor={L.color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.75" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={height * 0.05} />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={height * 0.02} />
        </filter>
      </defs>
      <rect width={width} height={height} fill={p.background} />
      <rect width={width} height={height} fill={`url(#${id}-top)`} />
      {L.beams.map((b, i) => {
        const top = b.x * width;
        const half = (b.width * width) / 2;
        const drift = Math.tan((b.angle * Math.PI) / 180) * height;
        const bottom = top + drift;
        const fill = `url(#${id}-${b.alt ? 'alt' : 'beam'})`;
        return (
          <g key={i} style={{ mixBlendMode: 'screen' }}>
            {/* the cone: narrow at the source, wide at the floor */}
            <polygon filter={`url(#${id}-blur)`} points={`${top - 4},-20 ${top + 4},-20 ${bottom + half},${height} ${bottom - half},${height}`} fill={fill} opacity={b.opacity * k} />
            {/* a brighter core gives each beam a defined edge */}
            <polygon filter={`url(#${id}-soft)`} points={`${top - 1.5},-20 ${top + 1.5},-20 ${bottom + half * 0.35},${height} ${bottom - half * 0.35},${height}`} fill={fill} opacity={b.opacity * k * 0.55} />
          </g>
        );
      })}
      <ellipse cx={width / 2} cy={height * 0.8} rx={width * 0.2} ry={height * 0.13} fill={`url(#${id}-pool)`} />
      <rect width={width} height={height} fill={`url(#${id}-vig)`} />
    </svg>
  );
}
