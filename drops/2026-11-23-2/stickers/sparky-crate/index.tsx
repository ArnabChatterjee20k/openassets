import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sparky the Crate',
  description: 'Sparkcrate\'s original mascot: a cheerful wooden crate wearing a solar-panel cap, waving with a little lightning spark.',
  tags: ['mascot', 'crate', 'character', 'solar', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFB85C', accent: '#5C8AFF', ink: '#6B3A0A' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  sunny: { fill: '#FFE45C', accent: '#FF6B4A', ink: '#6B4E00' },
  mint: { fill: '#7FF0CF', accent: '#5C8AFF', ink: '#0B4D3C' },
};

export default function SparkyCrate(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparky the crate">
      {/* legs */}
      <Line shape={[sk.curve([[96, 206], [92, 228]]), sk.curve([[160, 206], [164, 228]])]} weight={p.weight * 1.3} />
      {/* crate body */}
      <Doodle shape={sk.rect(56, 98, 144, 110, 10)} />
      {/* slats */}
      <Line shape={[sk.curve([[60, 194], [196, 194]]), sk.curve([[74, 112], [74, 192]]), sk.curve([[182, 112], [182, 192]])]} weight={p.weight * 0.6} />
      {/* solar cap, tilted */}
      <Doodle shape={sk.poly([[66, 66], [178, 52], [210, 92], [48, 102]])} fill={p.accent} />
      <Line shape={[sk.poly([[120, 59], [126, 98]], { closed: false }), sk.poly([[58, 84], [194, 72]], { closed: false })]} weight={p.weight * 0.55} />
      {/* waving arm + spark */}
      <Line shape={sk.curve([[200, 150], [222, 136], [230, 112]])} weight={p.weight * 1.2} />
      <Doodle shape={sk.sparkle(228, 88, 24)} fill="#FFE45C" />
      {/* face */}
      <Doodle shape={sk.ellipse(106, 154, 7, 10)} fill={p.ink} outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(150, 154, 7, 10)} fill={p.ink} outline={false} hatch={false} />
      <Line shape={sk.arc(128, 158, 18, 20, 160)} weight={p.weight * 0.8} />
      <Doodle shape={sk.ellipse(86, 172, 11, 6)} fill="#FF6B4A" outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(170, 172, 11, 6)} fill="#FF6B4A" outline={false} hatch={false} />
    </Sticker>
  );
}
