import { RobotIcon, SparkleIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Agent',
  description: 'The Firebrand AI agent: status, chat and activity.',
  tags: ['agent', 'ai', 'robot', 'assistant'],
};

// Default: a clean solid black glyph (recolour it in the editor).
// Every Firebrand icon shares this schema and variants block.
export const schema = iconSchema({ primary: '#000000', accent: '#FF4D00', surface: '#FFEDE0' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#1A0A06', accent: '#FF4D00' },
  'lava-tile': { container: 'squircle', fill: 'gradient', surface: '#FFB000', accent: '#FF4D00', primary: '#1A0A06', scale: 0.56 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#FF4D00', primary: '#1A0A06', accent: '#FFB000', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={RobotIcon} badgeGlyph={SparkleIcon} p={p} id="agent" />;
}
