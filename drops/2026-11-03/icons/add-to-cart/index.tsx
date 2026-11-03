import { ShoppingCartSimpleIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Add to Cart',
  description: 'Shopping cart for add-to-cart buttons and the cart badge in the store header.',
  tags: ['e-commerce', 'cart', 'checkout', 'shop', 'flash sale'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF7EB6', surface: '#F7DDEB' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#3A1F4A', accent: '#FF3D96' },
  candy: { container: 'squircle', fill: 'gradient', surface: '#FFC2DD', accent: '#B9AEFF', primary: '#3A1F4A', scale: 0.6 },
  sticker: { container: 'rounded', fill: 'solid', surface: '#FF7EB6', primary: '#3A1F4A', accent: '#4FD1C5', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={ShoppingCartSimpleIcon} badgeGlyph={PlusIcon} p={p} id="add-to-cart" />;
}
