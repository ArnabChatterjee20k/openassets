import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';
import { color } from '@/lib/params';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Pip the Inspector',
  description: "Pip, Loupe's original mascot: a round little camera-eye bot with a lens for a face, an antenna bulb and a happy squint. For empty states, onboarding and stickers on the booth.",
  tags: ['mascot', 'robot', 'camera', 'character', 'doodle'],
};

export const schema = stickerSchema({ fill: '#D6CCEC', accent: '#5E4AE3', ink: '#231942' }).extend({
  bulb: color('Antenna bulb').default('#2EC4B6'),
  cheeks: color('Cheeks').default('#F49CBB'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  mint: { fill: '#BFEDE7', accent: '#1E9C90', ink: '#173F4A', bulb: '#F49CBB' },
  peach: { fill: '#FFD7C2', accent: '#E4572E', ink: '#5A2618', bulb: '#5E4AE3', cheeks: '#FF8FA3' },
};

export default function PipInspector(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Pip the inspector bot">
      {/* antenna behind the head */}
      <Line shape={sk.curve([[128, 62], [132, 46], [140, 36]])} weight={p.weight * 0.9} />
      <Doodle shape={sk.circle(142, 32, 13)} fill={p.bulb} hatch={false} />
      {/* little feet */}
      <Doodle shape={sk.ellipse(96, 214, 22, 12)} fill={tint(p.accent, 0.35)} hatch={false} />
      <Doodle shape={sk.ellipse(160, 214, 22, 12)} fill={tint(p.accent, 0.35)} hatch={false} />
      {/* round body-head */}
      <Doodle shape={sk.rect(42, 62, 172, 150, 64)} />
      {/* lens face: barrel, glass, iris */}
      <Doodle shape={sk.circle(128, 128, 52)} fill={p.accent} />
      <Doodle shape={sk.circle(128, 128, 36)} fill={tint(p.accent, -0.45)} hatch={false} />
      <Doodle shape={sk.circle(116, 116, 10)} fill="#F7F4FF" outline={false} hatch={false} />
      <Doodle shape={sk.circle(140, 140, 4.5)} fill="#F7F4FF" outline={false} hatch={false} />
      {/* cheeks and a smile under the lens */}
      <Doodle shape={sk.ellipse(66, 162, 11, 7)} fill={p.cheeks} outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(190, 162, 11, 7)} fill={p.cheeks} outline={false} hatch={false} />
      <Line shape={sk.arc(128, 178, 14, 30, 150)} weight={p.weight * 0.75} />
    </Sticker>
  );
}
