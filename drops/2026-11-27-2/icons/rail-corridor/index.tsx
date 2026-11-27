import { TrainRegionalIcon, WarningDiamondIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Rail Corridor',
  description: 'A regional train, for rail corridors and track monitoring.',
  tags: ['rail', 'train', 'corridor', 'track', 'infrastructure'],
};

// Default: a clean solid black glyph. Same schema + variants across the set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF4D00', surface: '#FFEDE0' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#1A0A06', accent: '#FF4D00' },
  tile: { container: 'squircle', fill: 'solid', surface: '#1A0A06', primary: '#FF4D00', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#FFB000', primary: '#1A0A06', accent: '#FF2E63', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={TrainRegionalIcon} badgeGlyph={WarningDiamondIcon} p={p} id="rail-corridor" />;
}
