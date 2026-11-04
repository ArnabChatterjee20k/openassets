import { CheckFatIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Shipping',
  description: 'Order shipped from the factory.',
  tags: ['truck', 'shipping', 'delivery', 'logistics'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Redbrick portal set.
export const schema = iconSchema({ primary: '#000000', accent: '#C8553D', surface: '#E5CDB2' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#3B1F14', accent: '#F2A541' },
  tile: { container: 'squircle', fill: 'solid', surface: '#C8553D', primary: '#F1E4D3', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#F2A541', primary: '#3B1F14', accent: '#C8553D', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={TruckIcon} badgeGlyph={CheckFatIcon} p={p} id="shipping" />;
}
