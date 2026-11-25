import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Week Streak',
  description: 'A little crayon calendar card: seven day boxes, four ticked and shot day starred, for streak and habit posts.',
  tags: ['calendar', 'streak', 'habit', 'week', 'doodle'],
};

export const schema = stickerSchema({ fill: '#F2F4F8', accent: '#FF3DB4', ink: '#1E2550' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  jelly: { fill: '#DCE3FF', accent: '#3D5AFE', ink: '#141A4A' },
  citrus: { fill: '#FFF8E1', accent: '#FF7A00', ink: '#1C2B1A' },
};

const COLS = [52, 96, 140, 184];
const ROWS = [118, 170];

export default function WeekStreak(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  // 7 days in a 4 + 3 grid; the 8th slot holds the shot-day star.
  const boxes = ROWS.flatMap((y, r) => COLS.map((x, c) => ({ x, y, i: r * 4 + c })));
  return (
    <Sticker p={p} label="Week streak">
      <Doodle shape={sk.rect(28, 46, 200, 180, 22)} />
      <Doodle shape={sk.rect(28, 46, 200, 46, 18)} fill={p.accent} />
      {/* binder rings */}
      <Line shape={[sk.curve([[84, 32], [84, 62]]), sk.curve([[172, 32], [172, 62]])]} weight={p.weight * 1.1} />
      {boxes.slice(0, 7).map((b) => (
        <Doodle key={b.i} shape={sk.rect(b.x, b.y, 32, 32, 7)} fill="#FFFFFF" hatch={false} />
      ))}
      {/* four ticks */}
      <Line
        shape={boxes.slice(0, 4).map((b) => sk.curve([[b.x + 6, b.y + 17], [b.x + 13, b.y + 25], [b.x + 28, b.y + 4]]))}
        weight={p.weight * 0.9}
      />
      <Doodle shape={sk.star(200, 186, 26, 12)} fill={p.accent} />
    </Sticker>
  );
}
