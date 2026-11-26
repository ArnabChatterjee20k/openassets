import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Horseshoe Magnet',
  description: 'A chunky crayon horseshoe magnet with steel pole caps and field sparks, for the rare-earth Magnet Line.',
  tags: ['magnet', 'rare earth', 'neodymium', 'doodle'],
};

export const schema = stickerSchema({ fill: '#D96C3D', accent: '#E8E2D6', ink: '#5E2410' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  teal: { fill: '#2C7873', accent: '#F4E9D8', ink: '#123A37' },
  brass: { fill: '#E9B44C', accent: '#FFF6E4', ink: '#6B4A12' },
};

const CX = 128, CY = 118, RO = 80, RI = 36, BOT = 206;

// U shape opening downward: outer arc, legs, inner arc. Dense arc points keep it round; corners stay sharp.
function body(): Pt[] {
  const arc = (r: number, from: number, to: number) =>
    Array.from({ length: 19 }, (_, i): Pt => {
      const a = ((from + ((to - from) * i) / 18) * Math.PI) / 180;
      return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
    });
  return [[CX - RO, BOT], ...arc(RO, 180, 360), [CX + RO, BOT], [CX + RI, BOT], ...arc(RI, 360, 180), [CX - RI, BOT]];
}

export default function HorseshoeMagnet(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const legW = RO - RI;
  return (
    <Sticker p={p} label="Horseshoe magnet">
      <Doodle shape={sk.poly(body())} />
      <Doodle shape={sk.rect(CX - RO, BOT - 36, legW, 36, 3)} fill={p.accent} />
      <Doodle shape={sk.rect(CX + RI, BOT - 36, legW, 36, 3)} fill={p.accent} />
      {/* highlight streak along the arch */}
      <Line shape={sk.arc(CX, CY, (RO + RI) / 2 + 8, 205, 255)} ink={p.accent} weight={p.weight * 0.9} />
      {/* field sparks off the poles */}
      <Line
        shape={[
          sk.curve([[CX - RO + 4, BOT + 14], [CX - RO - 10, BOT + 30]]),
          sk.curve([[CX - (RO + RI) / 2, BOT + 18], [CX - (RO + RI) / 2, BOT + 38]]),
          sk.curve([[CX + RO - 4, BOT + 14], [CX + RO + 10, BOT + 30]]),
          sk.curve([[CX + (RO + RI) / 2, BOT + 18], [CX + (RO + RI) / 2, BOT + 38]]),
        ]}
        weight={p.weight * 0.85}
      />
    </Sticker>
  );
}
