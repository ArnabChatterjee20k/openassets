import { FileCodeIcon, GitBranchIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Source Code',
  description: 'Every asset is parametric source code, open to read and fork.',
  tags: ['code', 'source', 'open source', 'developer', 'openassets'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF48B0', surface: '#F4EFE6' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#1F2A6B', accent: '#FF48B0' },
  riso: { weight: 'fill', primary: '#0078BF', accent: '#FF48B0', shadow: true },
  tile: { container: 'squircle', fill: 'solid', surface: '#FF48B0', primary: '#F4EFE6', scale: 0.6 },
  sticker: { container: 'rounded', fill: 'solid', surface: '#FFE800', primary: '#1F2A6B', accent: '#FF48B0', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={FileCodeIcon} badgeGlyph={GitBranchIcon} p={p} id="source-code" />;
}
