import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sealed Envelope',
  description: 'A crayon envelope closed with a gold wax seal, with a little letter corner peeking out — for "you’ve got mail" moments and inbox empty states.',
  tags: ['envelope', 'mail', 'email', 'wax seal', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E4EAD2', accent: '#C9A227', ink: '#3E5323' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#C9D6AE', ink: '#33421F' },
  'die-cut': { border: true },
  postbox: { fill: '#F6D9CF', accent: '#E85D3F', ink: '#8A3220' },
  airmail: { fill: '#DCE8F2', accent: '#2F6F8F', ink: '#1F4659' },
};

export default function SealedEnvelope(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sealed envelope">
      {/* A letter peeking out behind the body, then the envelope on top. */}
      <Doodle shape={sk.rect(70, 50, 116, 90, 6)} fill="#FBF8EE" hatch={false} />
      <Line shape={sk.poly([[88, 72], [150, 72]], { closed: false })} weight={p.weight * 0.6} />
      <Line shape={sk.poly([[88, 90], [134, 90]], { closed: false })} weight={p.weight * 0.6} />
      <Doodle shape={sk.rect(34, 96, 188, 122, 12)} />
      {/* Flap folds: two diagonals meeting in the middle. */}
      <Line shape={sk.poly([[40, 104], [128, 166], [216, 104]], { closed: false, sharp: false })} />
      <Line shape={sk.poly([[42, 210], [104, 158]], { closed: false })} weight={p.weight * 0.7} />
      <Line shape={sk.poly([[214, 210], [152, 158]], { closed: false })} weight={p.weight * 0.7} />
      {/* Wax seal with a pressed ring. */}
      <Doodle shape={sk.circle(128, 164, 24)} fill={p.accent} />
      <Line shape={sk.circle(128, 164, 12)} weight={p.weight * 0.55} />
    </Sticker>
  );
}
