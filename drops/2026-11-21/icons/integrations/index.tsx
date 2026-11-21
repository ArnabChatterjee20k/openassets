import { PlugIcon, SparkleIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Integrations',
  description: 'Connected ad accounts, stores and analytics.',
  tags: ['integrations', 'connect', 'plug', 'accounts'],
};

// Default: a clean solid black glyph. Same schema + variants across the Multiball set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF6F91', surface: '#FFE3D3' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#1A1A2E', accent: '#FF6F91' },
  laminate: { container: 'squircle', fill: 'solid', surface: '#00B3A4', primary: '#FFF6E9', scale: 0.56 },
  memphis: { container: 'rounded', fill: 'solid', surface: '#FF6F91', primary: '#1A1A2E', accent: '#FFC93C', shadow: true, scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={PlugIcon} badgeGlyph={SparkleIcon} p={p} id="integrations" />;
}
