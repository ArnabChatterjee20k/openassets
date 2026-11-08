import { CrosshairIcon, CheckIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Audiences',
  description: 'Audience targeting and segments.',
  tags: ['audiences', 'targeting', 'crosshair', 'segments'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Lanternfish set.
export const schema = iconSchema({ primary: '#000000', accent: '#2EF2C4', surface: '#E6FFFA' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#021B26', accent: '#2EF2C4' },
  abyss: { container: 'squircle', fill: 'solid', surface: '#021B26', primary: '#2EF2C4', scale: 0.6 },
  coral: { container: 'rounded', fill: 'solid', surface: '#E6FFFA', primary: '#021B26', accent: '#FF7A59', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={CrosshairIcon} badgeGlyph={CheckIcon} p={p} id="audiences" />;
}
