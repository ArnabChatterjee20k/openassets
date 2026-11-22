import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Love Letter',
  description: 'A blush envelope sealed with a cherry wax heart, for "new message" moments and Valentine posts.',
  tags: ['letter', 'envelope', 'message', 'valentine', 'doodle'],
};

export const schema = stickerSchema({ fill: '#F5C6AA', accent: '#E3173E', ink: '#5A0E1E' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  candy: { fill: '#F7DDEB', accent: '#FF7EB6', ink: '#3A1F4A' },
  gold: { fill: '#FFE8E0', accent: '#F7B32B', ink: '#3F1019' },
};

export default function LoveLetter(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Love letter">
      {/* Envelope body, slightly tilted like it was tossed on a table */}
      <Doodle shape={sk.poly([[34, 82], [218, 64], [228, 190], [44, 208]])} />
      {/* Flap and the two lower folds */}
      <Line shape={sk.poly([[36, 86], [134, 146], [216, 68]], { closed: false })} />
      <Line shape={[sk.curve([[46, 204], [104, 156]]), sk.curve([[226, 186], [168, 150]])]} weight={p.weight * 0.7} />
      {/* Wax seal: a scalloped blob with a heart pressed in */}
      <Doodle shape={sk.star(134, 146, 34, 30, 12)} fill={p.accent} />
      <Doodle shape={sk.heart(134, 148, 17)} fill={tint(p.accent, 0.45)} outline={false} hatch={false} />
      {/* Little "sent" motion lines */}
      <Line shape={[sk.curve([[196, 34], [210, 22]]), sk.curve([[218, 44], [236, 38]])]} weight={p.weight * 0.8} />
    </Sticker>
  );
}
