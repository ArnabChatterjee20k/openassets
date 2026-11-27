import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';
import { color } from '@/lib/params';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Hand Loupe',
  description: "A jeweller's hand loupe with a glinting lens that has just spotted a tiny pink flaw. The kit's signature object.",
  tags: ['loupe', 'magnifier', 'inspect', 'zoom', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E6F7F5', accent: '#5E4AE3', ink: '#231942' }).extend({
  flaw: color('Flaw').default('#F49CBB'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  pink: { accent: '#F49CBB', flaw: '#5E4AE3', fill: '#F4EFFF' },
  brass: { accent: '#D9A441', fill: '#FFF6E0', ink: '#4A3210', flaw: '#E4572E' },
};

export default function HandLoupe(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Hand loupe">
      {/* handle first so the ring overlaps it */}
      <Doodle shape={sk.poly([[150, 156], [168, 138], [226, 196], [210, 214]], { sharp: false })} fill={p.accent} />
      {/* ring, then the lens */}
      <Doodle shape={sk.circle(108, 108, 80)} fill={p.accent} />
      <Doodle shape={sk.circle(108, 108, 60)} hatch={false} />
      {/* the flaw it's found, circled */}
      <Doodle shape={sk.circle(122, 120, 8)} fill={p.flaw} ink={p.flaw} hatch={false} />
      <Line shape={sk.arc(122, 120, 22, -40, 290)} ink={p.flaw} weight={p.weight * 0.7} />
      {/* glint */}
      <Line shape={sk.arc(108, 108, 44, 195, 250)} ink="#FFFFFF" weight={p.weight * 1.1} />
    </Sticker>
  );
}
