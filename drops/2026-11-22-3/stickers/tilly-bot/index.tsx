import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Tilly the Block Bot',
  description: "Ambit's original mascot: a chunky square bot with a sparkle antenna and a heat-tile chest, waving hello.",
  tags: ['mascot', 'robot', 'character', 'ai', 'doodle'],
};

export const schema = stickerSchema({ fill: '#B3A6EE', accent: '#F49CBB', ink: '#2A1D6B' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker' },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  mint: { fill: '#8CE8DD', accent: '#5E4AE3', ink: '#0F4F49' },
  peach: { fill: '#FFC2A8', accent: '#5E4AE3', ink: '#5A2316' },
};

export default function TillyBot(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const dark = tint(p.fill, -0.35);
  return (
    <Sticker p={p} label="Tilly the block bot">
      {/* antenna behind the head */}
      <Line shape={sk.curve([[128, 62], [126, 44], [132, 30]])} weight={p.weight * 0.9} />
      {/* waving arm (behind body): a raised stub with a round mitten hand */}
      <Doodle shape={sk.curve([[190, 160], [212, 140], [222, 112], [236, 116], [230, 148], [196, 182]], true)} fill={p.fill} />
      <Doodle shape={sk.circle(228, 96, 18)} fill={p.fill} />
      {/* resting arm on the other side */}
      <Doodle shape={sk.rect(34, 150, 30, 56, 14)} fill={dark} />
      {/* little feet */}
      <Doodle shape={sk.rect(82, 216, 34, 22, 9)} fill={dark} />
      <Doodle shape={sk.rect(142, 216, 34, 22, 9)} fill={dark} />
      {/* head + body: one chunky block */}
      <Doodle shape={sk.rect(54, 56, 148, 168, 30)} />
      {/* face screen */}
      <Doodle shape={sk.rect(74, 76, 108, 72, 18)} fill={p.ink} hatch={false} />
      <Doodle shape={sk.circle(106, 108, 9)} fill={tint(p.fill, 0.7)} outline={false} hatch={false} />
      <Doodle shape={sk.circle(150, 108, 9)} fill={tint(p.fill, 0.7)} outline={false} hatch={false} />
      <Line shape={sk.arc(128, 118, 14, 25, 155)} ink={tint(p.fill, 0.7)} weight={p.weight * 0.8} />
      <Doodle shape={sk.ellipse(90, 128, 8, 5)} fill={p.accent} outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(166, 128, 8, 5)} fill={p.accent} outline={false} hatch={false} />
      {/* heat-tile chest: low, mid, hot */}
      <Doodle shape={sk.rect(80, 166, 28, 28, 6)} fill={tint(p.fill, 0.55)} />
      <Doodle shape={sk.rect(114, 166, 28, 28, 6)} fill={tint(p.fill, -0.2)} />
      <Doodle shape={sk.rect(148, 166, 28, 28, 6)} fill={p.accent} />
      {/* sparkle antenna tip, drawn last so it pops in */}
      <Doodle shape={sk.sparkle(134, 26, 20)} fill={p.accent} />
    </Sticker>
  );
}
