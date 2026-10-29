import { ThermometerHotIcon, ArrowUpIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Thermometer',
  description: 'Hot temperature reading.',
  tags: ['weather', 'temperature', 'heat'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the set.
export const schema = iconSchema({ primary: '#000000', accent: '#3FA7A0', surface: '#EAF4EF' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone' },
  tile: { container: 'squircle', fill: 'solid', surface: '#0D1B1E', primary: '#D4FF3A', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#FFE45C', primary: '#000000', accent: '#FF5C8A', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={ThermometerHotIcon} badgeGlyph={ArrowUpIcon} p={p} id="thermometer" />;
}
