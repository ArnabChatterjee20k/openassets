import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Commit Graph',
  description: 'A doodled git graph: main runs down, a latch/wip branch curves off and picks up yellow auto-commits.',
  tags: ['git', 'branch', 'commit', 'doodle'],
};

export const schema = stickerSchema({ fill: '#EAF2FF', accent: '#FFDD00', ink: '#0B2A66' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  mint: { fill: '#E6FFF5', accent: '#2EF2C4', ink: '#06303F' },
};

export default function CommitGraph(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Commit graph">
      {/* main */}
      <Line shape={sk.curve([[84, 34], [84, 120], [84, 222]])} weight={p.weight * 1.3} />
      {/* the wip branch curving away */}
      <Line shape={sk.curve([[84, 92], [104, 120], [160, 128], [176, 160], [176, 206]])} weight={p.weight * 1.3} />
      <Doodle shape={sk.circle(84, 52, 17)} />
      <Doodle shape={sk.circle(84, 196, 17)} />
      <Doodle shape={sk.circle(166, 132, 20)} fill={p.accent} />
      <Doodle shape={sk.circle(176, 198, 20)} fill={p.accent} />
    </Sticker>
  );
}
