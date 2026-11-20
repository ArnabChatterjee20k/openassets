import { MegaphoneIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Campaigns',
  description: 'Every campaign Inkrun is running or drafting.',
  tags: ['campaigns', 'megaphone', 'launch', 'ads'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Inkrun set.
export const schema = iconSchema({ primary: '#000000', accent: '#B026FF', surface: '#FBEFFF' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#12001F', accent: '#B026FF' },
  'ink-tile': { container: 'squircle', fill: 'solid', surface: '#24003D', primary: '#FF2E88', scale: 0.56 },
  misprint: { container: 'rounded', fill: 'solid', surface: '#FFD600', primary: '#12001F', accent: '#FF2E88', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={MegaphoneIcon} badgeGlyph={PlusIcon} p={p} id="campaigns" />;
}
