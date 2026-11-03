import { LightningIcon, ArrowUpIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Boost',
  description: 'Speed boost and overclock power-up.',
  tags: ['game', 'boost', 'power-up', 'energy', 'hud'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the particles.io HUD set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF5C8A', surface: '#FFE45C' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', accent: '#FF5C8A' },
  arcade: { container: 'squircle', fill: 'solid', surface: '#FF5C8A', primary: '#000000', scale: 0.58 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#FFE45C', primary: '#000000', accent: '#FF5C8A', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={LightningIcon} badgeGlyph={ArrowUpIcon} p={p} id="boost" />;
}
