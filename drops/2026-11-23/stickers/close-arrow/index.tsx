import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Close Arrow',
  description: 'A laptop in side profile with an arc arrow swinging the lid shut onto a yellow commit dot: the "close the lid" gesture, hand-drawn.',
  tags: ['arrow', 'annotation', 'hinge', 'laptop', 'doodle'],
};

export const schema = stickerSchema({ fill: '#7FB2FF', ink: '#134AA8', accent: '#FFDD00', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon', ink: '#0B2A66' },
  pencil: { style: 'pencil', ink: '#0B2A66' },
  yellow: { ink: '#0B2A66', fill: '#FFDD00', accent: '#7FB2FF' },
  'die-cut': { border: true, style: 'crayon', ink: '#0B2A66' },
};

const HX = 66, HY = 196; // hinge
const at = (deg: number, r: number): Pt => [HX + Math.cos((deg * Math.PI) / 180) * r, HY - Math.sin((deg * Math.PI) / 180) * r];

export default function CloseArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  // the swing, around the hinge from just past the open lid down toward the base
  const swing = Array.from({ length: 9 }, (_, i) => at(92 - i * 9.5, 150));
  return (
    <Sticker p={p} label="Close arrow">
      {/* base deck */}
      <Doodle shape={sk.rect(HX - 18, HY, 178, 18, 7)} />
      {/* open lid at ~100° */}
      <Doodle shape={sk.poly([at(100, 4), at(100, 128), at(94, 130), at(92, 6)])} />
      <Line shape={sk.arrow(swing, 26)} weight={p.weight * 1.3} />
      {/* commit dot where the lid lands */}
      <Doodle shape={sk.circle(214, 166, 15)} fill={p.accent} />
    </Sticker>
  );
}
