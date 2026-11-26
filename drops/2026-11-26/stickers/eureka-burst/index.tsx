import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Eureka Burst',
  description: 'A brass starburst with a furnace-orange core and sparks, for "new compound qualified" moments and launch posts.',
  tags: ['burst', 'starburst', 'celebration', 'mid-century', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E9B44C', accent: '#D96C3D', ink: '#7A5418' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  teal: { fill: '#7FB8B2', accent: '#2C7873', ink: '#1C4A47' },
  bauhaus: { fill: '#F2B90F', accent: '#D9381E', ink: '#5A3A00' },
};

export default function EurekaBurst(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Eureka burst">
      <Doodle shape={sk.burst(124, 132, 96, 64, 14)} />
      <Doodle shape={sk.circle(124, 132, 38)} fill={p.accent} />
      <Doodle shape={sk.sparkle(212, 46, 22)} fill={p.accent} />
      <Doodle shape={sk.sparkle(36, 214, 15)} fill={p.fill} />
    </Sticker>
  );
}
