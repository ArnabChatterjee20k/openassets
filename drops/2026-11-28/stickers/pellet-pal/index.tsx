import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Pellet Pal',
  description: 'Sprue’s original mascot: a cheerful resin pellet waving hello, with a fresh-off-the-line sparkle.',
  tags: ['mascot', 'pellet', 'resin', 'character', 'doodle'],
};

export const schema = stickerSchema({ fill: '#C6EE6A', accent: '#FF9F43', ink: '#2F4A1E' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  orange: { fill: '#FFB36B', accent: '#C6EE6A', ink: '#7A3A10' },
  cherry: { fill: '#F58CA0', accent: '#F7B32B', ink: '#5E0A18' },
};

export default function PelletPal(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Pellet Pal">
      {/* Feet first, the body overlaps them */}
      <Doodle shape={sk.ellipse(100, 214, 20, 10)} fill={tint(p.fill, -0.3)} hatch={false} />
      <Doodle shape={sk.ellipse(156, 214, 20, 10)} fill={tint(p.fill, -0.3)} hatch={false} />
      {/* Pellet body: a short cylinder, side + lighter top */}
      <Doodle shape={sk.rect(56, 70, 144, 140, 56)} />
      <Doodle shape={sk.ellipse(128, 96, 64, 22)} fill={tint(p.fill, 0.45)} hatch={false} weight={p.weight * 0.7} />
      {/* Waving arm */}
      <Line shape={sk.curve([[196, 150], [214, 132], [220, 112]])} weight={p.weight * 1.1} />
      <Doodle shape={sk.circle(222, 100, 14)} fill={tint(p.fill, -0.12)} hatch={false} />
      <Line shape={[sk.arc(222, 100, 30, 230, 290), sk.arc(222, 100, 42, 235, 285)]} ink={p.accent} weight={p.weight * 0.7} />
      {/* Face */}
      <Doodle shape={sk.circle(104, 146, 7)} fill={p.ink} outline={false} hatch={false} />
      <Doodle shape={sk.circle(152, 146, 7)} fill={p.ink} outline={false} hatch={false} />
      <Line shape={sk.arc(128, 160, 16, 20, 160)} weight={p.weight * 0.8} />
      <Doodle shape={sk.ellipse(84, 168, 11, 7)} fill={p.accent} outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(172, 168, 11, 7)} fill={p.accent} outline={false} hatch={false} />
      {/* Fresh-off-the-line sparkle */}
      <Doodle shape={sk.sparkle(44, 52, 20, 0.3)} fill={p.accent} />
    </Sticker>
  );
}
