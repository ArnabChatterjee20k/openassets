import { WarningDiamondIcon, XIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Defect Flag',
  description: 'A defect was found: a burr, pit or surface mark above tolerance.',
  tags: ['defect', 'reject', 'warning', 'flag'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Loupe set.
export const schema = iconSchema({ primary: '#000000', accent: '#F49CBB', surface: '#E9E3F5' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#231942', accent: '#F49CBB' },
  tile: { container: 'squircle', fill: 'solid', surface: '#5E4AE3', primary: '#E9E3F5', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#F49CBB', primary: '#231942', accent: '#2EC4B6', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={WarningDiamondIcon} badgeGlyph={XIcon} p={p} id="defect-flag" />;
}
