// Icon composition on top of Phosphor (MIT, 1.5k glyphs x 6 weights): the glyph
// geometry is professionally drawn and consistent; our design work is the
// composition — weight, two-tone color, container, badge stacking, shadow.
// Renders one root <svg viewBox="0 0 256 256">, server- and browser-safe.
import type { Icon, IconWeight } from '@phosphor-icons/react';
import { z } from 'zod';
import { color, num, select, toggle } from '@/lib/params';

/** A Phosphor icon component (import from '@phosphor-icons/react/ssr'). */
export type Glyph = Icon;

export const ICON_WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'] as const;
export const ICON_CONTAINERS = ['none', 'circle', 'squircle', 'rounded', 'blob'] as const;
export const ICON_FILLS = ['tint', 'solid', 'gradient', 'outline'] as const;

/** Shared controls for every icon in a set; pass the set's defaults. */
export function iconSchema(d: { primary: string; accent?: string; surface?: string; weight?: (typeof ICON_WEIGHTS)[number]; container?: (typeof ICON_CONTAINERS)[number]; fill?: (typeof ICON_FILLS)[number] }) {
  return z.object({
    weight: select(ICON_WEIGHTS, 'Weight').default(d.weight ?? 'fill'),
    container: select(ICON_CONTAINERS, 'Container').default(d.container ?? 'none'),
    fill: select(ICON_FILLS, 'Container fill').default(d.fill ?? 'tint'),
    primary: color('Glyph').default(d.primary),
    accent: color('Accent').default(d.accent ?? d.primary),
    surface: color('Container').default(d.surface ?? '#FFFFFF'),
    scale: num(0.45, 0.9, 0.05, 'Glyph size').default(0.62),
    badge: toggle('Corner badge').default(false),
    shadow: toggle('Offset shadow').default(false),
  });
}
export type IconParams = z.infer<ReturnType<typeof iconSchema>>;

// Superellipse-ish squircle and a soft blob, both in a 256 box.
const SQUIRCLE = 'M128 8C40 8 8 40 8 128s32 120 120 120 120-32 120-120S216 8 128 8Z';
const BLOB = 'M196 40c32 22 52 62 44 104s-40 84-88 92-104-14-124-58S20 84 52 54 164 18 196 40Z';

function Container({ kind, d, fill }: { kind: string; d: number; fill: Record<string, string> }) {
  const inset = (256 - d) / 2;
  if (kind === 'circle') return <circle cx={128} cy={128} r={d / 2} {...fill} />;
  if (kind === 'rounded') return <rect x={inset} y={inset} width={d} height={d} rx={d * 0.22} {...fill} />;
  const path = kind === 'blob' ? BLOB : SQUIRCLE;
  const s = d / 240;
  return <path d={path} transform={`translate(128 128) scale(${s}) translate(-128 -128)`} {...fill} />;
}

/** Draws a glyph at (x, y, size) inside the 256 box, with real two-tone duotone. */
function GlyphAt({ G, weight, primary, accent, x, y, size }: { G: Glyph; weight: IconWeight; primary: string; accent: string; x: number; y: number; size: number }) {
  if (weight === 'duotone') {
    // Duotone in the accent gives the tinted fill layer; regular in primary overlays the exact same line work.
    return (
      <g transform={`translate(${x} ${y})`}>
        <svg width={size} height={size} viewBox="0 0 256 256" overflow="visible">
          <G weight="duotone" color={accent} size={256} />
          <G weight="regular" color={primary} size={256} />
        </svg>
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <svg width={size} height={size} viewBox="0 0 256 256" overflow="visible">
        <G weight={weight} color={primary} size={256} />
      </svg>
    </g>
  );
}

export function IconArt({ glyph, badgeGlyph, p, id }: { glyph: Glyph; badgeGlyph?: Glyph; p: IconParams; id: string }) {
  const hasBox = p.container !== 'none';
  const boxD = 232;
  const size = hasBox ? 256 * p.scale : 240;
  const off = (256 - size) / 2;
  const gid = `${id}-grad`;
  const boxFill: Record<string, string> =
    p.fill === 'solid'
      ? { fill: p.surface }
      : p.fill === 'gradient'
        ? { fill: `url(#${gid})` }
        : p.fill === 'outline'
          ? { fill: 'none', stroke: p.primary, strokeWidth: '12' }
          : { fill: p.surface, fillOpacity: '0.9' };
  const shadowFill = { fill: p.primary };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.surface} />
          <stop offset="1" stopColor={p.accent} />
        </linearGradient>
      </defs>
      {hasBox && p.shadow && (
        <g transform="translate(10 12)">
          <Container kind={p.container} d={boxD - 16} fill={shadowFill} />
        </g>
      )}
      {hasBox && <Container kind={p.container} d={p.shadow ? boxD - 16 : boxD} fill={boxFill} />}
      {!hasBox && p.shadow && (
        <g opacity={0.9}>
          <GlyphAt G={glyph} weight={p.weight === 'duotone' ? 'fill' : p.weight} primary={p.accent} accent={p.accent} x={off + 10} y={off + 12} size={size} />
        </g>
      )}
      <GlyphAt G={glyph} weight={p.weight} primary={p.primary} accent={p.accent} x={off} y={off} size={size} />
      {p.badge && badgeGlyph && (
        <g>
          <circle cx={200} cy={200} r={50} fill={p.accent} stroke={hasBox ? p.surface : '#ffffff'} strokeWidth={12} />
          <GlyphAt G={badgeGlyph} weight="fill" primary={p.primary} accent={p.primary} x={172} y={172} size={56} />
        </g>
      )}
    </svg>
  );
}
