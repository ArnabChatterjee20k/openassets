import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Clam the Laptop',
  description: 'Latch\'s mascot: Clam, a sleepy little laptop with closed eyes and a yellow commit badge, dozing off after saving your work.',
  tags: ['mascot', 'laptop', 'character', 'sleep', 'doodle'],
};

export const schema = stickerSchema({ fill: '#7FB2FF', accent: '#FFDD00', ink: '#0B2A66' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  silver: { fill: '#D3DDE3', accent: '#E4572E', ink: '#17242E' },
  night: { fill: '#134AA8', accent: '#FFDD00', ink: '#EAF2FF' },
};

export default function ClamMascot(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const face = p.ink;
  return (
    <Sticker p={p} label="Clam the laptop">
      {/* lid / screen */}
      <Doodle shape={sk.rect(54, 46, 148, 112, 18)} />
      {/* base deck, a trapezoid wider than the lid */}
      <Doodle shape={sk.poly([[44, 166], [212, 166], [230, 202], [26, 202]])} />
      {/* trackpad notch */}
      <Line shape={sk.curve([[108, 184], [148, 184]])} weight={p.weight * 0.8} />
      {/* sleepy closed eyes and a small smile */}
      <Line shape={[sk.arc(98, 92, 19, 15, 165), sk.arc(158, 92, 19, 15, 165)]} ink={face} weight={p.weight * 1.25} />
      <Line shape={sk.arc(128, 112, 14, 25, 155)} ink={face} weight={p.weight * 1.1} />
      <Doodle shape={sk.ellipse(78, 126, 13, 7)} fill="#FF9DB5" outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(178, 126, 13, 7)} fill="#FF9DB5" outline={false} hatch={false} />
      {/* yellow commit badge on the corner */}
      <Doodle shape={sk.circle(204, 54, 20)} fill={p.accent} />
      <Line shape={sk.poly([[194, 54], [202, 62], [214, 46]], { closed: false })} weight={p.weight * 0.8} />
    </Sticker>
  );
}
