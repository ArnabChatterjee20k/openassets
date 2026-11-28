import { CalculatorIcon, CheckIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Instant Quote',
  description: 'Instant per-part pricing for a molded part.',
  tags: ['quote', 'price', 'calculator', 'cost'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Sprue set.
export const schema = iconSchema({ primary: '#000000', accent: '#B5E550', surface: '#EAF2DC' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#0E1A14', accent: '#B5E550' },
  tile: { container: 'squircle', fill: 'solid', surface: '#0E1A14', primary: '#B5E550', scale: 0.56 },
  molded: { container: 'circle', fill: 'solid', surface: '#B5E550', accent: '#FF9F43', primary: '#0E1A14', weight: 'bold', shadow: true, badge: true, scale: 0.54 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={CalculatorIcon} badgeGlyph={CheckIcon} p={p} id="instant-quote" />;
}
