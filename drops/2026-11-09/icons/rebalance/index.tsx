import { PhoneTransferIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Rebalance',
  description: 'Budget moved to the winning line overnight.',
  tags: ['rebalance', 'pacing', 'transfer'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Patchwell set.
export const schema = iconSchema({ primary: '#000000', accent: '#D96C3D', surface: '#F4E9D8' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#2E2A24', accent: '#D96C3D' },
  tile: { container: 'squircle', fill: 'solid', surface: '#2C7873', primary: '#F4E9D8', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#E9B44C', primary: '#2E2A24', accent: '#D96C3D', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={PhoneTransferIcon} badgeGlyph={ArrowsClockwiseIcon} p={p} id="rebalance" />;
}
