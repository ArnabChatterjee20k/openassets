import { QueueIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Topic',
  description: 'A Kafka topic: an ordered, append-only log of messages.',
  tags: ['kafka', 'topic', 'log', 'queue'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Halfstream console set.
export const schema = iconSchema({ primary: '#000000', accent: '#E3000F', surface: '#F5F5F0' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#0A0A0A', accent: '#E3000F' },
  swiss: { container: 'rounded', fill: 'solid', surface: '#E3000F', primary: '#F5F5F0', scale: 0.6 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#E6E6E1', primary: '#0A0A0A', accent: '#E3000F', weight: 'bold', shadow: true, badge: true, scale: 0.56 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={QueueIcon} badgeGlyph={PlusIcon} p={p} id="topic" />;
}
