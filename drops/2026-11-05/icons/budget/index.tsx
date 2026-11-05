import { CurrencyCircleDollarIcon, CheckIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Budget',
  description: 'Ad budget and spend: a dollar coin.',
  tags: ['budget', 'spend', 'money', 'billing'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Mycel dashboard set.
export const schema = iconSchema({ primary: '#000000', accent: '#B5E550', surface: '#EAF2DC' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#0E1A14', accent: '#B5E550' },
  tile: { container: 'squircle', fill: 'solid', surface: '#18291F', primary: '#B5E550', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#B5E550', primary: '#0E1A14', accent: '#FF9F43', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={CurrencyCircleDollarIcon} badgeGlyph={CheckIcon} p={p} id="budget" />;
}
