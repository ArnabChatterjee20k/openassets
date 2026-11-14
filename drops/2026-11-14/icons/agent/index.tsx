import { CompassToolIcon, SparkleIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Agent',
  description: 'The Plotwell agent at work, drafting.',
  tags: ['agent', 'ai', 'compass', 'automation'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Plotwell set.
export const schema = iconSchema({ primary: '#000000', accent: '#7FB2FF', surface: '#EAF2FF' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#0F3B8C', accent: '#7FB2FF' },
  cyanotype: { container: 'squircle', fill: 'solid', surface: '#0F3B8C', primary: '#EAF2FF', accent: '#7FB2FF', scale: 0.6 },
  whiteprint: { container: 'rounded', fill: 'solid', surface: '#F1EEE4', primary: '#173F9A', accent: '#FFDD00', weight: 'bold', shadow: true, badge: true, scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={CompassToolIcon} badgeGlyph={SparkleIcon} p={p} id="agent" />;
}
