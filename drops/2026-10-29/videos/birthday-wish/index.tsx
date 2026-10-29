import { AbsoluteFill, Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Birthday Wish',
  category: 'greeting',
  description: 'Vertical story-format birthday greeting with confetti, a photo and a personal message.',
  tags: ['birthday', 'wish', 'greeting', 'story', 'vertical'],
};

export const video: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 180 };

export const schema = z.object({
  greeting: text().default('Happy Birthday'),
  name: text('Their name').default('Maya'),
  message: textarea().default('Wishing you a year full of electric moments ⚡'),
  from: text('Signed').default('— from all of us'),
  photo: image('Photo (optional)').default(''),
  font: font().default('serif'),
  background: color().default('#0B1026'),
  accent: color().default('#FFD34E'),
  confettiA: color('Confetti 1').default('#8B9CFF'),
  confettiB: color('Confetti 2').default('#FF7AB6'),
  textColor: color('Text').default('#F5F7FF'),
  confetti: num(0, 120, 10, 'Confetti amount').default(70),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  pastel: { background: '#FFF4E8', textColor: '#2B2340', accent: '#FF7AB6', confettiA: '#7CC6FF', confettiB: '#FFD34E' },
  bold: { font: 'grotesk', greeting: 'HAPPY BIRTHDAY', accent: '#7CFFB2' },
  calm: { confetti: 0, font: 'serif', message: 'Here’s to another trip around the sun.' },
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function Confetti({ count, colors }: { count: number; colors: string[] }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: count }, (_, i) => {
        // Deterministic per-piece randomness so every render is identical.
        const x = random(`x${i}`) * width;
        const speed = 6 + random(`s${i}`) * 10;
        const delay = random(`d${i}`) * 40;
        const y = -60 + (frame - delay) * speed;
        const rot = (frame * (2 + random(`r${i}`) * 8)) % 360;
        const w = 14 + random(`w${i}`) * 18;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.sin((frame + i * 13) / 12) * 30,
              top: y % (height + 120),
              width: w,
              height: w * 0.45,
              background: colors[i % colors.length],
              borderRadius: 3,
              transform: `rotate(${rot}deg)`,
              opacity: frame < delay ? 0 : 1,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export default function BirthdayWish(p: z.infer<typeof schema>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const photo = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const greet = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const name = spring({ frame: frame - 28, fps, config: { damping: 9, mass: 0.7 } });
  const msg = interpolate(frame, [50, 70], [0, 1], clamp);
  const sign = interpolate(frame, [75, 95], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: p.background, color: p.textColor, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${p.accent}33 0%, transparent 55%)` }} />
      <Confetti count={p.confetti} colors={[p.accent, p.confettiA, p.confettiB]} />
      <div style={{ padding: '0 90px', position: 'relative' }}>
        {p.photo && (
          <Img
            src={p.photo}
            style={{
              width: 420,
              height: 420,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `10px solid ${p.accent}`,
              marginBottom: 60,
              transform: `scale(${photo})`,
            }}
          />
        )}
        <div style={{ fontFamily: FONTS.inter, fontSize: 64, letterSpacing: 4, color: p.accent, opacity: greet, transform: `translateY(${(1 - greet) * 40}px)` }}>
          {p.greeting}
        </div>
        <div style={{ fontFamily: FONTS[p.font], fontWeight: 700, fontSize: 200, lineHeight: 1.05, marginTop: 10, transform: `scale(${name})` }}>
          {p.name}
        </div>
        <div style={{ fontFamily: FONTS.inter, fontSize: 52, lineHeight: 1.35, marginTop: 50, opacity: msg }}>{p.message}</div>
        <div style={{ fontFamily: FONTS[p.font], fontSize: 44, marginTop: 50, opacity: sign * 0.8 }}>{p.from}</div>
      </div>
    </AbsoluteFill>
  );
}
