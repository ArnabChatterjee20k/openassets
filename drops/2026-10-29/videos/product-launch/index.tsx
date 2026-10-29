import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, select, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Product Launch',
  category: 'launch',
  description: '3-2-1 countdown, then your product name strikes in with a tagline and call to action.',
  tags: ['launch', 'product', 'countdown', 'saas'],
};

export const video: VideoConfig = { width: 1920, height: 1080, fps: 30, durationInFrames: 210 };

export const schema = z.object({
  product: text('Product name').default('Stormcast'),
  tagline: text().default('Forecasts that strike first.'),
  cta: text('Call to action').default('Live now → stormcast.app'),
  font: font().default('grotesk'),
  background: color().default('#0B1026'),
  accent: color().default('#FFD34E'),
  textColor: color('Text').default('#F5F7FF'),
  productImage: image('Product shot (optional)').default(''),
  countdown: select(['on', 'off']).default('on'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'no-countdown': { countdown: 'off' },
  daylight: { background: '#F5F7FF', textColor: '#0B1026', accent: '#3B3FD8' },
  dev: { font: 'mono', product: 'stormcast v2.0', tagline: 'npm i stormcast', accent: '#7CFFB2' },
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function Count({ n, p }: { n: number; p: z.infer<typeof schema> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  const fade = interpolate(frame, [18, 25], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: FONTS[p.font], fontWeight: 700, fontSize: 420, color: p.accent, opacity: fade, transform: `scale(${1.6 - s * 0.6})` }}>
        {n}
      </div>
    </AbsoluteFill>
  );
}

function Reveal({ p }: { p: z.infer<typeof schema> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hit = spring({ frame, fps, config: { damping: 10, mass: 0.5 } });
  const flash = interpolate(frame, [0, 2, 10], [0.8, 0.8, 0], clamp);
  const tag = interpolate(frame, [18, 34], [0, 1], clamp);
  const cta = spring({ frame: frame - 40, fps, config: { damping: 14 } });
  const image = interpolate(frame, [6, 30], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
      <AbsoluteFill style={{ background: p.accent, opacity: flash }} />
      {p.productImage && (
        <Img
          src={p.productImage}
          style={{ height: 300, objectFit: 'contain', marginBottom: 40, opacity: image, transform: `translateY(${(1 - image) * 40}px)` }}
        />
      )}
      <div style={{ fontFamily: FONTS[p.font], fontWeight: 700, fontSize: 180, letterSpacing: -4, lineHeight: 1, transform: `scale(${0.5 + hit * 0.5})` }}>
        {p.product}
      </div>
      <div style={{ fontFamily: FONTS.inter, fontSize: 52, marginTop: 28, opacity: tag * 0.85 }}>{p.tagline}</div>
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 36,
          marginTop: 56,
          padding: '18px 36px',
          borderRadius: 999,
          background: p.accent,
          color: p.background,
          transform: `scale(${cta})`,
        }}
      >
        {p.cta}
      </div>
    </AbsoluteFill>
  );
}

export default function ProductLaunch(p: z.infer<typeof schema>) {
  const start = p.countdown === 'on' ? 90 : 0;
  return (
    <AbsoluteFill style={{ background: p.background, color: p.textColor }}>
      {p.countdown === 'on' &&
        [3, 2, 1].map((n, i) => (
          <Sequence key={n} from={i * 30} durationInFrames={30}>
            <Count n={n} p={p} />
          </Sequence>
        ))}
      <Sequence from={start}>
        <Reveal p={p} />
      </Sequence>
    </AbsoluteFill>
  );
}
