import { RobotIcon, LightningIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Robot Scientist',
  description: 'Robot head for autonomous workcells and robot scientists.',
  tags: ['robot', 'automation', 'ai', 'lab'],
};

// Default: a clean solid black glyph. Same schema + variants across the Benchwire set.
export const schema = iconSchema({ primary: '#000000', accent: '#3FA7A0', surface: '#EAF4EF' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#0D1B1E', accent: '#0E7A72' },
  tile: { container: 'squircle', fill: 'solid', surface: '#0D1B1E', primary: '#D4FF3A', scale: 0.56 },
  terminal: { container: 'rounded', fill: 'solid', surface: '#16302F', primary: '#EAF4EF', accent: '#FF5A36', weight: 'bold', badge: true, scale: 0.54 },
  riso: { weight: 'duotone', primary: '#1F2A6B', accent: '#FF48B0' },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={RobotIcon} badgeGlyph={LightningIcon} p={p} id="robot" />;
}
