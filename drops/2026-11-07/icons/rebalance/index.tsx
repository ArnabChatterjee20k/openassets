import { ScalesIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Rebalance',
  description: 'Budget rebalanced toward the platforms that earn.',
  tags: ['rebalance', 'allocation', 'scales', 'budget'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Mandate set.
export const schema = iconSchema({ primary: '#000000', accent: '#C9A45C', surface: '#F3EDE2' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#0D0D0F', accent: '#C9A45C' },
  tile: { container: 'rounded', fill: 'solid', surface: '#0D0D0F', primary: '#C9A45C', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#E8D9B5', primary: '#0D0D0F', accent: '#C9A45C', weight: 'bold', shadow: true, badge: true, scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={ScalesIcon} badgeGlyph={ArrowsClockwiseIcon} p={p} id="rebalance" />;
}
