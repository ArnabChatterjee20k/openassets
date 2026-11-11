import { ChartPieSliceIcon, TrendUpIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Insights',
  description: 'Blended results and channel mix across every platform.',
  tags: ['ads', 'insights', 'analytics', 'roas'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Mimo set.
export const schema = iconSchema({ primary: '#000000', accent: '#3D5AFE', surface: '#DADDE3' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  duotone: { weight: 'duotone', primary: '#101219', accent: '#3D5AFE' },
  aqua: { container: 'squircle', fill: 'gradient', surface: '#7D93FF', accent: '#2340E8', primary: '#F4F6FA', scale: 0.56 },
  chrome: { container: 'circle', fill: 'gradient', surface: '#F4F6FA', accent: '#9AA1AE', primary: '#101219', scale: 0.58 },
  bubblegum: { container: 'rounded', fill: 'solid', surface: '#FF3DB4', primary: '#101219', accent: '#3D5AFE', weight: 'bold', shadow: true, badge: true, scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={ChartPieSliceIcon} badgeGlyph={TrendUpIcon} p={p} id="insights" />;
}
