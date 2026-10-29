import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Title Reveal',
  category: 'intro',
  description: 'Lightning-flash intro: title slams in, subtitle fades up. Drop in your own logo or photo.',
  tags: ['intro', 'title', 'youtube'],
};

export const video: VideoConfig = { width: 1920, height: 1080, fps: 30, durationInFrames: 120 };

export const schema = z.object({
  title: text().default('MIDNIGHT WEATHER'),
  subtitle: text().default('Episode 01 — The Storm'),
  font: font().default('grotesk'),
  background: color().default('#0B1026'),
  flash: color('Flash').default('#FFD34E'),
  textColor: color('Text').default('#F5F7FF'),
  logo: image('Logo / image (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  editorial: { font: 'serif', title: 'Midnight Weather', flash: '#8B9CFF' },
  light: { background: '#F5F7FF', textColor: '#0B1026', flash: '#3B3FD8' },
  terminal: { font: 'mono', title: 'midnight_weather', flash: '#7CFFB2' },
};

export default function TitleReveal(p: z.infer<typeof schema>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [8, 11, 18], [0, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pop = spring({ frame: frame - 10, fps, config: { damping: 12, mass: 0.6 } });
  const sub = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [100, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: p.background, color: p.textColor, alignItems: 'center', justifyContent: 'center', opacity: out }}>
      <AbsoluteFill style={{ background: p.flash, opacity: flash }} />
      <div style={{ textAlign: 'center', transform: `scale(${0.6 + pop * 0.4})`, opacity: pop }}>
        {p.logo && <Img src={p.logo} style={{ height: 160, marginBottom: 40, objectFit: 'contain' }} />}
        <div style={{ fontFamily: FONTS[p.font], fontWeight: 700, fontSize: 140, letterSpacing: -2, lineHeight: 1 }}>{p.title}</div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 44,
            marginTop: 32,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 30}px)`,
          }}
        >
          {p.subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
}
