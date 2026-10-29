import { z } from 'zod';
import { color, num, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Wind',
  description: 'Three flowing gust lines with curled ends.',
  tags: ['weather', 'wind', 'gust'],
};

// Same grammar as the rest of the Midnight Weather set: 24px grid, shared cloud
// silhouette, round joins, accent reserved for the weather element.
export const schema = z.object({
  style: select(['outline', 'filled', 'duotone']).default('outline'),
  primary: color('Gusts').default('#3B3FD8'),
  accent: color('Lead gust').default('#FFD34E'),
  stroke: num(1, 3, 0.25, 'Stroke width').default(1.75),
  rounded: toggle('Rounded joins').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  filled: { style: 'filled' },
  duotone: { style: 'duotone' },
  bold: { stroke: 2.75 },
  mono: { primary: '#0B1026', accent: '#0B1026' },
  sharp: { rounded: false, stroke: 2 },
};

// Gust lines curl back on themselves like the cloud's lobes.
const GUSTS = ['M3 8.5h9.5a2.5 2.5 0 1 0-2.5-2.5', 'M3 12.5h15a3 3 0 1 1-3 3', 'M3 16.5h6.5a2 2 0 1 1-2 2'];

export default function Wind(p: z.infer<typeof schema>) {
  const join = p.rounded ? 'round' : 'miter';
  const cap = p.rounded ? 'round' : 'butt';
  // Filled = heavier strokes, duotone = soft halo behind each gust; no container shape, matching the cloud icons.
  const w = p.style === 'filled' ? p.stroke * 1.35 : p.stroke;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      {p.style === 'duotone' &&
        GUSTS.map((d) => <path key={`h${d}`} d={d} stroke={p.primary} strokeWidth={p.stroke * 3} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} />)}
      {GUSTS.map((d, i) => (
        <path key={d} d={d} stroke={i === 1 ? p.accent : p.primary} strokeWidth={w} strokeLinejoin={join} strokeLinecap={cap} />
      ))}
    </svg>
  );
}
