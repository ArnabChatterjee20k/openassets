import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sparkle Trio',
  description: 'Three chunky sparkles, one big and two small, for "dose logged" moments and new-feature callouts.',
  tags: ['sparkle', 'shine', 'new', 'doodle'],
};

export const schema = stickerSchema({ fill: '#C7D0FF', accent: '#FF3DB4', ink: '#1E2550' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  jelly: { fill: '#3D5AFE', accent: '#FFD84D', ink: '#141A4A' },
  bubblegum: { fill: '#FFB8E2', accent: '#7C5CFF', ink: '#4A1238' },
};

export default function SparkleTrio(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(108, 138, 84)} />
      <Doodle shape={sk.sparkle(196, 66, 38)} fill={p.accent} />
      <Doodle shape={sk.sparkle(200, 196, 26)} fill={p.accent} />
      <Doodle shape={sk.ellipse(84, 108, 12, 7, -40)} fill="#FFFFFF" outline={false} hatch={false} />
    </Sticker>
  );
}
