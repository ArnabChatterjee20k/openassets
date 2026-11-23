import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Solar Panel',
  description: 'A tilted crayon solar panel on a little stand with a sun peeking over it, for generation stats and "runs on sun" callouts.',
  tags: ['solar', 'panel', 'sun', 'energy', 'doodle'],
};

export const schema = stickerSchema({ fill: '#5C8AFF', accent: '#FFE45C', ink: '#1A2A6B' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  coral: { fill: '#FF8A6E', accent: '#FFE45C', ink: '#6B1F12' },
  mint: { fill: '#3FDDB5', accent: '#FFFDF2', ink: '#0B4D3C' },
};

// Panel corners: a parallelogram leaning back, like a tilted module seen from the front.
const TL: Pt = [70, 96], TR: Pt = [214, 96], BR: Pt = [238, 178], BL: Pt = [34, 178];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export default function SolarPanel(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const cols = [1 / 3, 2 / 3].map((t) => sk.poly([lerp(TL, TR, t), lerp(BL, BR, t)], { closed: false }));
  const rows = [0.5].map((t) => sk.poly([lerp(TL, BL, t), lerp(TR, BR, t)], { closed: false }));
  return (
    <Sticker p={p} label="Solar panel">
      {/* sun first, so the panel overlaps it */}
      <Doodle shape={sk.circle(178, 70, 34)} fill={p.accent} />
      <Line
        shape={[-150, -110, -70, -30, 10].map((d) => {
          const a = (d * Math.PI) / 180;
          return sk.poly([[178 + Math.cos(a) * 46, 70 + Math.sin(a) * 46], [178 + Math.cos(a) * 64, 70 + Math.sin(a) * 64]], { closed: false });
        })}
        weight={p.weight * 0.9}
      />
      {/* stand */}
      <Line shape={[sk.poly([[104, 178], [96, 222]], { closed: false }), sk.poly([[170, 178], [178, 222]], { closed: false }), sk.poly([[80, 224], [196, 224]], { closed: false })]} weight={p.weight * 1.1} />
      <Doodle shape={sk.poly([TL, TR, BR, BL])} />
      <Line shape={[...cols, ...rows]} weight={p.weight * 0.7} />
      {/* glare */}
      <Doodle shape={sk.poly([[84, 108], [104, 108], [92, 138], [72, 138]])} fill="#FFFFFF" outline={false} hatch={false} />
    </Sticker>
  );
}
