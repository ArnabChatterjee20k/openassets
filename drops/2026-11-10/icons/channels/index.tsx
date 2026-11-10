import { SquaresFourIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Channels',
  description: 'All 34 connected ad platforms.',
  tags: ['channels', 'platforms', 'grid', 'ads'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Formwork set.
export const schema = iconSchema({ primary: '#000000', accent: '#D9381E', surface: '#F2EBDD' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#111111', accent: '#1D4E9E' },
  tile: { container: 'squircle', fill: 'solid', surface: '#1D4E9E', primary: '#F2EBDD', scale: 0.56 },
  poster: { container: 'circle', fill: 'solid', surface: '#D9381E', primary: '#111111', accent: '#F2B90F', weight: 'bold', shadow: true, badge: true, scale: 0.6 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={SquaresFourIcon} badgeGlyph={PlusIcon} p={p} id="channels" />;
}
