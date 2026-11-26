import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Nib the Mail Bot',
  description: 'Nib, Postnook’s original mascot: a cheerful envelope with a bot antenna and a waving arm, for onboarding, docs and “your agent got mail” moments.',
  tags: ['mascot', 'character', 'envelope', 'bot', 'agent', 'doodle'],
};

export const schema = stickerSchema({ fill: '#BFD198', accent: '#E85D3F', ink: '#33461C' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#A9C07A', ink: '#2A3A16' },
  'die-cut': { border: true },
  honey: { fill: '#F2D98A', accent: '#6A8D3A', ink: '#6B5410' },
  sorbet: { fill: '#FFC9BC', accent: '#7B2CBF', ink: '#7A2A3A' },
};

export default function NibMascot(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Nib the mail bot">
      {/* Antenna first so the body overlaps its base. */}
      <Line shape={sk.curve([[114, 86], [110, 64], [118, 46]])} />
      <Doodle shape={sk.circle(120, 40, 13)} fill={p.accent} />
      {/* Body + flap */}
      <Doodle shape={sk.rect(30, 84, 168, 124, 18)} />
      <Line shape={sk.poly([[38, 94], [114, 140], [190, 94]], { closed: false, sharp: false })} />
      {/* Waving arm, raised clear of the body, with a mitten hand; little feet */}
      <Line shape={sk.curve([[196, 156], [220, 146], [232, 116]])} weight={p.weight * 1.1} />
      <Doodle shape={sk.circle(234, 106, 13)} fill={p.fill} hatch={false} />
      <Doodle shape={sk.ellipse(80, 216, 22, 11)} fill={p.ink} hatch={false} />
      <Doodle shape={sk.ellipse(148, 216, 22, 11)} fill={p.ink} hatch={false} />
      {/* Face: outlined eyes survive the pencil style, where fills are dropped. */}
      <Doodle shape={sk.circle(88, 164, 8)} fill={p.ink} hatch={false} weight={p.weight * 0.8} />
      <Doodle shape={sk.circle(140, 164, 8)} fill={p.ink} hatch={false} weight={p.weight * 0.8} />
      <Doodle shape={sk.ellipse(68, 184, 12, 7)} fill="#F3A79A" outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(160, 184, 12, 7)} fill="#F3A79A" outline={false} hatch={false} />
      <Line shape={sk.arc(114, 170, 16, 25, 155)} weight={p.weight * 0.85} />
    </Sticker>
  );
}
