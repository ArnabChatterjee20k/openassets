import { ChartBarIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Reports',
  description: 'Cross-platform performance reports.',
  tags: ['reports', 'analytics', 'chart', 'performance'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Folio set.
export const schema = iconSchema({ primary: '#000000', accent: '#E3000F', surface: '#F5F5F0' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#0A0A0A', accent: '#E3000F' },
  'red-tile': { container: 'rounded', fill: 'solid', surface: '#E3000F', primary: '#F5F5F0', scale: 0.56 },
  'ink-brutal': { container: 'rounded', fill: 'solid', surface: '#F5F5F0', primary: '#0A0A0A', accent: '#E3000F', weight: 'bold', shadow: true, scale: 0.6 },
  night: { container: 'squircle', fill: 'solid', surface: '#0D0D0F', primary: '#C9A45C', scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={ChartBarIcon} badgeGlyph={PlusIcon} p={p} id="reports" />;
}
