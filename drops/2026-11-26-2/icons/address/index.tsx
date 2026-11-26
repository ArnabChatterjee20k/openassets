import { AtIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Address',
  description: 'At sign for inbox addresses and aliases.',
  tags: ['address', 'email', 'alias', 'at'],
};

// Default: a clean solid black glyph. Same schema + variants across the Postnook set.
export const schema = iconSchema({ primary: '#000000', accent: '#6A8D3A', surface: '#DCE3CC' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#1E2A1A', accent: '#6A8D3A' },
  tile: { container: 'squircle', fill: 'solid', surface: '#6A8D3A', primary: '#EEF1E6', scale: 0.56 },
  letterpress: { container: 'rounded', fill: 'solid', surface: '#DCE3CC', primary: '#1E2A1A', accent: '#C9A227', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={AtIcon} badgeGlyph={PlusIcon} p={p} id="address" />;
}
