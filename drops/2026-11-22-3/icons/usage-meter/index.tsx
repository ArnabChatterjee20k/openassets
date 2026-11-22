import { GaugeIcon, ChartLineUpIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Usage Meter',
  description: 'Usage meter for the overview screen: how much of the monthly AI allowance a team has used.',
  tags: ['usage', 'gauge', 'meter', 'quota', 'dashboard'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Ambit set.
export const schema = iconSchema({ primary: '#000000', accent: '#5E4AE3', surface: '#E9E3F5' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#231942', accent: '#5E4AE3' },
  tile: { container: 'rounded', fill: 'solid', surface: '#5E4AE3', primary: '#E9E3F5', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#D6CCEC', primary: '#231942', accent: '#F49CBB', weight: 'bold', shadow: true, badge: true, scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={GaugeIcon} badgeGlyph={ChartLineUpIcon} p={p} id="usage-meter" />;
}
