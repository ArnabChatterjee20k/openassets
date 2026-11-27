import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Viewfinder Brackets',
  description: 'Four hand-drawn camera corners with a crosshair and a REC dot: drop it over any photo, stat or structure to say "watched".',
  tags: ['viewfinder', 'frame', 'camera', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF2E63', accent: '#FF2E63', ink: '#FF4D00', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#4A1A0C' },
  amber: { ink: '#FFB000', fill: '#FF4D00' },
  ink: { ink: '#2E2A24', fill: '#E3000F' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function ViewfinderBrackets(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const k = 54; // arm length
  const [a, b] = [34, 222];
  return (
    <Sticker p={p} label="Viewfinder brackets">
      <Line
        shape={[
          sk.poly([[a, a + k], [a, a], [a + k, a]], { closed: false }),
          sk.poly([[b - k, a], [b, a], [b, a + k]], { closed: false }),
          sk.poly([[b, b - k], [b, b], [b - k, b]], { closed: false }),
          sk.poly([[a + k, b], [a, b], [a, b - k]], { closed: false }),
        ]}
        weight={p.weight * 1.3}
      />
      {/* crosshair */}
      <Line shape={[sk.curve([[128, 104], [128, 152]]), sk.curve([[104, 128], [152, 128]])]} weight={p.weight * 0.75} />
      {/* REC dot, top left inside the frame */}
      <Doodle shape={sk.circle(70, 70, 10)} fill={p.fill} ink={p.fill} hatch={false} />
    </Sticker>
  );
}
