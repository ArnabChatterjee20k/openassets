import { z } from 'zod';
import { color, num, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Cloud Rain',
  description: 'A cloud with slanted rain streaks.',
  tags: ['weather', 'rain', 'cloud'],
};

// Same grammar as the rest of the Midnight Weather set: 24px grid, shared cloud
// silhouette, round joins, accent reserved for the weather element.
export const schema = z.object({
  style: select(['outline', 'filled', 'duotone']).default('outline'),
  primary: color('Cloud').default('#16302F'),
  accent: color('Rain').default('#FF5A36'),
  stroke: num(1, 3, 0.25, 'Stroke width').default(1.75),
  rounded: toggle('Rounded joins').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  filled: { style: 'filled' },
  duotone: { style: 'duotone' },
  bold: { stroke: 2.75 },
  mono: { primary: '#0D1B1E', accent: '#0D1B1E' },
  riso: { primary: '#0078BF', accent: '#FF48B0' },
  sharp: { rounded: false, stroke: 2 },
};

const CLOUD = 'M7 15a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 6.5a4 4 0 0 1-.5 8.5';
const DROPS = ['M8.5 18 7.5 21', 'M12.5 18l-1 3', 'M16.5 18l-1 3'];

export default function CloudRain(p: z.infer<typeof schema>) {
  const join = p.rounded ? 'round' : 'miter';
  const cap = p.rounded ? 'round' : 'butt';
  const filled = p.style === 'filled';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      {p.style === 'duotone' && <path d={`${CLOUD}z`} fill={p.primary} opacity={0.2} />}
      <path d={filled ? `${CLOUD}z` : CLOUD} fill={filled ? p.primary : 'none'} stroke={p.primary} strokeWidth={p.stroke} strokeLinejoin={join} strokeLinecap={cap} />
      {!filled && <path d="M6.5 15h11" stroke={p.primary} strokeWidth={p.stroke} strokeLinecap={cap} />}
      {DROPS.map((d) => (
        <path key={d} d={d} stroke={p.accent} strokeWidth={p.stroke} strokeLinecap={cap} />
      ))}
    </svg>
  );
}
