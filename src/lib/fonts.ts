// Bundled font families. CSS for these is loaded by src/lib/font-css.ts in
// browser/Remotion contexts; assets reference them by key via font().
export const FONTS = {
  inter: "'Inter', system-ui, sans-serif",
  grotesk: "'Space Grotesk', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  serif: "'Playfair Display', Georgia, serif",
} as const;

export type FontKey = keyof typeof FONTS;
export const FONT_KEYS = Object.keys(FONTS) as [FontKey, ...FontKey[]];
