import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Eureka Burst',
  description: 'A jagged crayon burst with a big exclamation mark, for a hit result, a record run or a "results are in" post.',
  tags: ['burst', 'exclamation', 'result', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF7A5C', accent: '#D4FF3A', ink: '#8A2A14' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#FF9478', ink: '#6E2412' },
  'die-cut': { border: true },
  chartreuse: { fill: '#D4FF3A', accent: '#FF5A36', ink: '#4A6410' },
  teal: { fill: '#5DBDB4', accent: '#EAF4EF', ink: '#173F3B' },
};

export default function EurekaBurst(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Burst">
      <Doodle shape={sk.burst(128, 128, 104, 76, 13)} />
      <Doodle shape={sk.circle(128, 128, 54)} fill={p.accent} hatch={false} />
      {/* exclamation mark */}
      <Line shape={sk.curve([[130, 94], [128, 120], [127, 138]])} weight={p.weight * 2.2} />
      <Doodle shape={sk.circle(127, 160, 8)} fill={p.ink} hatch={false} />
    </Sticker>
  );
}
