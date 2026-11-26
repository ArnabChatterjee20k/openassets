import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Crystal Cluster',
  description: 'Three pointed crystals growing from a rock, for "new structure found" and materials-discovery posts.',
  tags: ['crystal', 'mineral', 'gallium', 'discovery', 'doodle'],
};

export const schema = stickerSchema({ fill: '#8CC3BC', accent: '#E9B44C', ink: '#1E4744' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  amber: { fill: '#F0B266', accent: '#D96C3D', ink: '#6B3410' },
  lilac: { fill: '#B9A8F0', accent: '#2EC4B6', ink: '#3A2A6B' },
};

/** A crystal: hex prism with a pointed tip, leaning `deg` from upright, base centred at (x, y). */
function crystal(x: number, y: number, w: number, h: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const rot = (px: number, py: number): Pt => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)];
  const tip = w * 0.9;
  return {
    outline: [rot(-w, 0), rot(-w, -h), rot(0, -h - tip), rot(w, -h), rot(w, 0)],
    ridge: [rot(w * 0.15, 0), rot(w * 0.15, -h), rot(0, -h - tip)],
    face: [rot(w * 0.15, 0), rot(w * 0.15, -h), rot(0, -h - tip), rot(w, -h), rot(w, 0)],
  };
}

export default function CrystalCluster(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const back = crystal(84, 190, 24, 74, -24);
  const main = crystal(130, 194, 32, 110, 4);
  const side = crystal(182, 196, 22, 60, 28);
  return (
    <Sticker p={p} label="Crystal cluster">
      <Doodle shape={sk.poly(back.outline)} />
      <Doodle shape={sk.poly(side.outline)} fill={p.accent} />
      <Doodle shape={sk.poly(main.outline)} />
      {/* shaded right facet on the main crystal */}
      <Doodle shape={sk.poly(main.face)} fill={tint(p.fill, -0.18)} outline={false} hatch={false} />
      <Line shape={[sk.poly(main.ridge, { closed: false }), sk.poly(back.ridge, { closed: false }), sk.poly(side.ridge, { closed: false })]} weight={p.weight * 0.7} />
      {/* rock base */}
      <Doodle shape={sk.curve([[40, 214], [58, 190], [92, 184], [118, 174], [160, 180], [196, 178], [220, 200], [212, 226], [166, 234], [110, 236], [56, 232]], true)} fill="#C9A77A" />
      <Doodle shape={sk.sparkle(210, 70, 20)} fill={p.accent} />
      <Doodle shape={sk.sparkle(30, 160, 11)} fill={p.accent} />
    </Sticker>
  );
}
