import { TargetIcon, UsersThreeIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Audiences',
  description: 'Audiences: targeting and lookalike segments.',
  tags: ['audiences', 'targeting', 'segments', 'marketing'],
};

// Default: a clean solid black glyph. Same schema + variants across the Pike set;
// the accent is the tip-up orange used for badges and the flag variant.
export const schema = iconSchema({ primary: '#000000', accent: '#E4572E', surface: '#E9EEF1' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  duotone: { weight: 'duotone', primary: '#17242E', accent: '#2F6F8F' },
  frost: { container: 'squircle', fill: 'solid', surface: '#D3DDE3', primary: '#2F6F8F', scale: 0.56 },
  fjord: { container: 'circle', fill: 'gradient', surface: '#2F6F8F', accent: '#17242E', primary: '#E9EEF1', scale: 0.54 },
  flag: { container: 'rounded', fill: 'solid', surface: '#E9EEF1', primary: '#17242E', accent: '#E4572E', weight: 'bold', shadow: true, badge: true, scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={TargetIcon} badgeGlyph={UsersThreeIcon} p={p} id="audiences" />;
}
