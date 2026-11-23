import { GitCommitIcon, LaptopIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Lid Commit',
  description: 'A commit written automatically when the lid closes.',
  tags: ['git', 'commit', 'auto commit', 'save'],
};

// Default: a clean solid black glyph. Same schema + variants across the Latch set.
export const schema = iconSchema({ primary: '#000000', accent: '#7FB2FF', surface: '#EAF2FF' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#0F3B8C', accent: '#7FB2FF' },
  blueprint: { container: 'rounded', fill: 'solid', surface: '#0F3B8C', primary: '#EAF2FF', accent: '#FFDD00', weight: 'regular', scale: 0.56 },
  brutal: { container: 'squircle', fill: 'solid', surface: '#FFDD00', primary: '#0A1B3F', accent: '#FFFFFF', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={GitCommitIcon} badgeGlyph={LaptopIcon} p={p} id="lid-commit" />;
}
