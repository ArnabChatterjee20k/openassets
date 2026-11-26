import { AtomIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Candidate Compound',
  description: 'A proposed compound in the discovery queue.',
  tags: ['chemistry', 'atom', 'candidate', 'materials'],
};

// Default: a clean solid black glyph. Same schema + variants across the Ternary set.
export const schema = iconSchema({ primary: '#000000', accent: '#D96C3D', surface: '#F4E9D8' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#2E2A24', accent: '#D96C3D' },
  tile: { container: 'squircle', fill: 'solid', surface: '#2C7873', primary: '#F4E9D8', scale: 0.6 },
  enamel: { container: 'rounded', fill: 'solid', surface: '#E6D3B3', primary: '#2E2A24', accent: '#E9B44C', weight: 'bold', shadow: true, badge: true, scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={AtomIcon} badgeGlyph={PlusIcon} p={p} id="atom" />;
}
