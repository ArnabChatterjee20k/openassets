import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Token Coins',
  description: 'A wobbly stack of crayon coins with one rolling off, for spend, savings and "tokens per seat" callouts.',
  tags: ['coins', 'spend', 'tokens', 'money', 'doodle'],
};

export const schema = stickerSchema({ fill: '#B3A6EE', accent: '#2EC4B6', ink: '#2A1D6B' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker' },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  gold: { fill: '#FFC94D', accent: '#F49CBB', ink: '#6B4300' },
  mint: { fill: '#8CE8DD', accent: '#5E4AE3', ink: '#0F4F49' },
};

/** One coin seen slightly from above: rim band + top face. */
function Coin({ cx, cy, rx, ry, h, fill }: { cx: number; cy: number; rx: number; ry: number; h: number; fill: string }) {
  return (
    <>
      <Doodle shape={sk.rect(cx - rx, cy - ry * 0.2, rx * 2, h + ry * 1.2, ry)} fill={tint(fill, -0.18)} />
      <Doodle shape={sk.ellipse(cx, cy, rx, ry)} fill={fill} />
    </>
  );
}

export default function TokenCoins(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Token coins">
      {/* stack, bottom coin first */}
      <Coin cx={104} cy={196} rx={66} ry={22} h={16} fill={p.fill} />
      <Coin cx={110} cy={168} rx={66} ry={22} h={16} fill={p.fill} />
      <Coin cx={100} cy={140} rx={66} ry={22} h={16} fill={p.fill} />
      <Coin cx={108} cy={112} rx={66} ry={22} h={16} fill={p.fill} />
      {/* a coin standing on its edge, rolling off */}
      <Doodle shape={sk.circle(188, 176, 40)} fill={p.accent} />
      <Doodle shape={sk.circle(188, 176, 23)} fill={tint(p.accent, 0.3)} hatch={false} />
      {/* a glint over the stack */}
      <Doodle shape={sk.sparkle(196, 72, 22)} fill={p.accent} />
      <Line shape={[sk.curve([[224, 110], [236, 100]]), sk.curve([[232, 132], [246, 128]])]} weight={p.weight * 0.8} />
    </Sticker>
  );
}
