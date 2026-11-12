import { FlaskIcon, LightningIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Experiments',
  description: 'A/B tests: Junction splits a line to try new creatives, audiences and bids.',
  tags: ['ads', 'experiments', 'ab test', 'flask'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Junction set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF7A00', surface: '#FFE9A8' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#1C2B1A', accent: '#2BB24C' },
  sign: { container: 'rounded', fill: 'solid', surface: '#1C2B1A', primary: '#FF7A00', scale: 0.56 },
  enamel: { container: 'circle', fill: 'solid', surface: '#FFE9A8', primary: '#1C2B1A', accent: '#2BB24C', weight: 'bold', shadow: true, badge: true, scale: 0.54 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={FlaskIcon} badgeGlyph={LightningIcon} p={p} id="experiments" />;
}
