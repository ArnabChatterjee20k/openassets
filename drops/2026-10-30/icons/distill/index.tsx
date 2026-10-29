import { FunnelIcon, SparkleIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Distill',
  description: 'Funnel: distill a page to its readable substance (domdistill / FeedX).',
  tags: ['reading', 'distill', 'filter', 'funnel', 'openfeed'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the set.
export const schema = iconSchema({ primary: '#000000', accent: '#6A8D3A', surface: '#EEF1E6' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#1E2A1A', accent: '#C9A227' },
  tile: { container: 'squircle', fill: 'solid', surface: '#6A8D3A', primary: '#EEF1E6', scale: 0.6 },
  sticker: { container: 'rounded', fill: 'solid', surface: '#C9A227', primary: '#1E2A1A', accent: '#E85D3F', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={FunnelIcon} badgeGlyph={SparkleIcon} p={p} id="distill" />;
}
