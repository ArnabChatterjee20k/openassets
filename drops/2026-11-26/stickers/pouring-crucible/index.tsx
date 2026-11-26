import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Pouring Crucible',
  description: 'A tipped steel crucible pouring a molten stream into an ingot mould, for first-pour and production posts.',
  tags: ['crucible', 'molten', 'foundry', 'ingot', 'doodle'],
};

export const schema = stickerSchema({ fill: '#6FA8A2', accent: '#F08A3C', ink: '#1E4744' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  kraft: { fill: '#C9A77A', accent: '#D96C3D', ink: '#4A3418' },
  blueprint: { fill: '#7FB2FF', accent: '#FFDD00', ink: '#0F3B8C' },
};

/** Rotate local points about (ox, oy) by `deg`, then move to (tx, ty). */
const place = (ps: Pt[], deg: number, tx: number, ty: number): Pt[] => {
  const a = (deg * Math.PI) / 180;
  return ps.map(([x, y]): Pt => [tx + x * Math.cos(a) - y * Math.sin(a), ty + x * Math.sin(a) + y * Math.cos(a)]);
};

export default function PouringCrucible(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const TILT = 38;
  // Crucible in local space: rim at y = -50, tapered to a rounded foot.
  const OX = 88, OY = 106;
  const cup = place([[-52, -46], [52, -46], [42, 30], [28, 42], [-28, 42], [-42, 30]], TILT, OX, OY);
  const rim = place([[-58, -58], [58, -58], [58, -44], [-58, -44]], TILT, OX, OY);
  const lip = place([[58, -52]], TILT, OX, OY)[0];
  // Molten stream: a fat ribbon arcing from the lip into the mould.
  const stream: Pt[] = [[lip[0] - 8, lip[1] - 10], [lip[0] + 18, lip[1] + 2], [lip[0] + 34, lip[1] + 40], [lip[0] + 36, 194], [lip[0] + 10, 194], [lip[0] + 8, lip[1] + 48], [lip[0] - 4, lip[1] + 16]];
  return (
    <Sticker p={p} label="Pouring crucible">
      {/* ingot mould */}
      <Doodle shape={sk.poly([[116, 188], [236, 188], [224, 230], [128, 230]])} fill={p.fill} />
      <Doodle shape={sk.poly([[124, 192], [228, 192], [222, 210], [130, 210]])} fill={p.accent} outline={false} />
      <Doodle shape={sk.curve(stream, true)} fill={p.accent} />
      <Doodle shape={sk.poly(cup)} />
      <Doodle shape={sk.poly(rim)} fill={p.fill} />
      {/* handle bar */}
      <Line shape={sk.curve(place([[-42, -4], [-82, -14]], TILT, OX, OY))} weight={p.weight * 1.2} />
      {/* heat sparks */}
      <Doodle shape={sk.sparkle(226, 150, 14)} fill={p.accent} />
      <Doodle shape={sk.sparkle(112, 166, 9)} fill={p.accent} />
    </Sticker>
  );
}
