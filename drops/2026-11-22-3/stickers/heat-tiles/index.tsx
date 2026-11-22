import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema, tint } from '@/kit';
import { color } from '@/lib/params';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Heat Tiles',
  description: 'A hand-drawn 3×3 usage heatmap with one hot tile: the Ambit motif as a doodle for slides and feature pages.',
  tags: ['heatmap', 'grid', 'usage', 'chart', 'doodle'],
};

export const schema = stickerSchema({ fill: '#7B68EE', accent: '#F49CBB', ink: '#231942' }).extend({
  low: color('Low tile').default('#E2DAF5'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker' },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  teal: { fill: '#2EC4B6', accent: '#FF7A59', ink: '#0F3B38', low: '#DDF5F2' },
  riso: { fill: '#0078BF', accent: '#FF48B0', ink: '#1F2A6B', low: '#EAE2D3' },
};

// Heat level per tile (0 low … 3 hot); the hot one is the sticker's focal point.
const LEVELS = [
  [1, 0, 2],
  [2, 3, 1],
  [0, 2, 4],
];

export default function HeatTiles(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const ramp = [p.low, tint(p.fill, 0.45), tint(p.fill, 0.15), p.fill, p.accent];
  const s = 62;
  const g = 10;
  const x0 = 128 - (s * 3 + g * 2) / 2;
  const y0 = 128 - (s * 3 + g * 2) / 2;
  return (
    <Sticker p={p} label="Heat tiles">
      {LEVELS.flatMap((row, r) =>
        row.map((lv, c) => (
          <Doodle key={`${r}-${c}`} shape={sk.rect(x0 + c * (s + g), y0 + r * (s + g), s, s, 12)} fill={ramp[lv]} hatch={lv > 0} />
        )),
      )}
      {/* a little spark on the hot tile */}
      <Doodle shape={sk.sparkle(x0 + 2 * (s + g) + s / 2, y0 + 2 * (s + g) + s / 2, 18)} fill={p.low} hatch={false} />
    </Sticker>
  );
}
