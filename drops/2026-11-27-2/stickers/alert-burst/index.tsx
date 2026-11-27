import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Alert Burst',
  description: 'A spiky crayon burst with a bold exclamation mark, for "Δ 3.2 mm" alerts, new-feature callouts and urgent stats.',
  tags: ['burst', 'alert', 'exclamation', 'callout', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF4D00', accent: '#FFEDE0', ink: '#4A1A0C' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  pink: { fill: '#FF2E63', accent: '#FFEDE0', ink: '#4A0C1E' },
  amber: { fill: '#FFB000', accent: '#4A1A0C', ink: '#4A1A0C' },
};

export default function AlertBurst(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Alert burst">
      <Doodle shape={sk.burst(128, 128, 100, 74, 13)} />
      {/* the exclamation mark */}
      <Doodle shape={sk.poly([[114, 66], [142, 66], [136, 146], [120, 146]], { sharp: false })} fill={p.accent} hatch={false} />
      <Doodle shape={sk.circle(128, 174, 13)} fill={p.accent} hatch={false} />
      {/* little shock ticks */}
      <Line shape={[sk.curve([[34, 52], [50, 66]]), sk.curve([[222, 52], [206, 66]])]} weight={p.weight * 0.8} />
    </Sticker>
  );
}
