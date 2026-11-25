import { FootprintsIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Daily Steps',
  description: 'Steps and movement for the day.',
  tags: ['steps', 'walk', 'activity', 'habit'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Satiate set.
export const schema = iconSchema({ primary: '#000000', accent: '#3D5AFE', surface: '#DADDE3' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#101219', accent: '#3D5AFE' },
  chrome: { container: 'squircle', fill: 'gradient', surface: '#F6F7FA', primary: '#3D5AFE', accent: '#8C95A6', scale: 0.56 },
  jelly: { container: 'circle', fill: 'solid', surface: '#3D5AFE', primary: '#F2F4F8', accent: '#FF3DB4', scale: 0.54 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#DADDE3', primary: '#101219', accent: '#FF3DB4', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={FootprintsIcon} badgeGlyph={PlusIcon} p={p} id="daily-steps" />;
}
