import { FlaskIcon, LightningIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Experiments',
  description: 'Experiments: A/B tests that split traffic between flag variations and measure the result.',
  tags: ['saas', 'experiment', 'a/b test', 'flask', 'analytics'],
};

// Default: a clean solid black glyph. Same schema + variants across the set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF00E5', surface: '#0B0B0B' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone' },
  tile: { container: 'squircle', fill: 'solid', surface: '#0B0B0B', primary: '#C6FF00', scale: 0.56 },
  sticker: { container: 'rounded', fill: 'solid', surface: '#C6FF00', primary: '#0B0B0B', accent: '#FF00E5', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={FlaskIcon} badgeGlyph={LightningIcon} p={p} id="experiments" />;
}
