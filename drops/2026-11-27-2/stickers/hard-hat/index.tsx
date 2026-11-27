import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Hard Hat',
  description: 'A crayon safety helmet with a reflective band, for field-crew pages, site safety and "no truck roll needed" callouts.',
  tags: ['hard hat', 'safety', 'site', 'crew', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFB000', accent: '#FFEDE0', ink: '#4A1A0C' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  orange: { fill: '#FF6A1A', accent: '#FFE3CF', ink: '#4A1A0C' },
  white: { fill: '#F4EFE6', accent: '#FF4D00', ink: '#2E2A24' },
};

// Dome: a half ellipse sitting on the brim line.
function dome(): Pt[] {
  return Array.from({ length: 21 }, (_, i): Pt => {
    const a = Math.PI + (i / 20) * Math.PI;
    return [128 + Math.cos(a) * 80, 162 + Math.sin(a) * 96];
  });
}

export default function HardHat(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Hard hat">
      <Doodle shape={sk.curve(dome(), true)} />
      {/* raised centre rib: two seams running from the crown to the brim */}
      <Line shape={[sk.curve([[118, 70], [114, 110], [112, 154]]), sk.curve([[138, 70], [142, 110], [144, 154]])]} weight={p.weight * 0.75} />
      {/* a small decal on the side */}
      <Doodle shape={sk.circle(178, 130, 12)} fill={p.accent} hatch={false} />
      {/* brim in front, overlapping the dome's base */}
      <Doodle shape={sk.curve([[26, 172], [50, 154], [128, 150], [206, 154], [236, 170], [222, 186], [128, 190], [36, 186]], true)} />
      {/* shine */}
      <Line shape={sk.arc(128, 162, 66, 200, 228)} ink="#FFFFFF" weight={p.weight * 1.1} />
    </Sticker>
  );
}
