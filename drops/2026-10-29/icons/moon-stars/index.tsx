import { MoonStarsIcon, StarIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Moon & Stars',
  description: 'Crescent moon with stars.',
  tags: ['night', 'sleep', 'dark mode'],
};

// Default: a clean solid glyph in one color (pick any color in the editor).
// Same schema + variants across the set.
export const schema = iconSchema({ primary: '#0D1B1E', accent: '#3FA7A0', surface: '#EAF4EF' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone' },
  tile: { container: 'squircle', fill: 'solid', surface: '#0D1B1E', primary: '#D4FF3A', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#FFE45C', primary: '#000000', accent: '#FF5C8A', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={MoonStarsIcon} badgeGlyph={StarIcon} p={p} id="moon-stars" />;
}
