import { MaskHappyIcon, HeartIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Persona',
  description: 'Your character and roleplay persona: be anyone.',
  tags: ['persona', 'roleplay', 'character', 'profile'],
};

// Default: a clean solid black glyph (pick any colour in the editor).
// Same schema + variants across the Ardor set.
export const schema = iconSchema({ primary: '#000000', accent: '#E3173E', surface: '#FFE8E0' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  blush: { weight: 'duotone', primary: '#2A0A10', accent: '#E3173E' },
  cherry: { container: 'squircle', fill: 'solid', surface: '#E3173E', primary: '#FFE8E0', scale: 0.56 },
  velvet: { container: 'circle', fill: 'solid', surface: '#3F1019', primary: '#F5C6AA', accent: '#E3173E', scale: 0.54, badge: true },
  pulp: { container: 'rounded', fill: 'solid', surface: '#FFE8E0', primary: '#E3173E', accent: '#2A0A10', shadow: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={MaskHappyIcon} badgeGlyph={HeartIcon} p={p} id="persona" />;
}
