import { ShippingContainerIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Crate Shipping',
  description: 'Crate in transit to site, for delivery tracking.',
  tags: ['shipping', 'crate', 'delivery', 'logistics'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Sparkcrate GridOS set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF6B4A', surface: '#FFE45C' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  duotone: { weight: 'duotone', accent: '#5C8AFF' },
  tile: { container: 'rounded', fill: 'solid', surface: '#000000', primary: '#FFE45C', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#FFE45C', primary: '#000000', accent: '#FF6B4A', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
  stencil: { container: 'squircle', fill: 'outline', primary: '#000000', weight: 'bold', scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={ShippingContainerIcon} badgeGlyph={TruckIcon} p={p} id="crate-shipping" />;
}
