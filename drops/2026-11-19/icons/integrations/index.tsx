import { LightningIcon, PuzzlePieceIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Integrations',
  description: 'Connect ad accounts, pixels and your CRM.',
  tags: ['integrations', 'puzzle', 'connect', 'accounts', 'ads'],
};

// Default: a clean solid black glyph. Same schema + variants across the set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF8E5E', surface: '#FFE9D6' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#2B1B2E', accent: '#FF8E5E' },
  neon: { container: 'squircle', fill: 'solid', surface: '#2B1B2E', primary: '#FF8E5E', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#FFD27F', primary: '#2B1B2E', accent: '#E5487A', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={PuzzlePieceIcon} badgeGlyph={LightningIcon} p={p} id="integrations" />;
}
