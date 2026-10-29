import { z } from 'zod';
import { color, font, image, num, select, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Forecast Hero',
  description: 'Bold headline banner over a stormy gradient, with optional photo.',
  tags: ['hero', 'social', 'weather'],
};

export const schema = z.object({
  eyebrow: text().default('TONIGHT'),
  headline: text().default('Electric skies ahead.'),
  body: textarea().default('Storm-season templates, generated fresh every day.'),
  font: font('Headline font').default('grotesk'),
  background: color().default('#0B1026'),
  glow: color().default('#3B3FD8'),
  accent: color().default('#FFD34E'),
  textColor: color('Text').default('#F5F7FF'),
  photo: image('Photo (optional)').default(''),
  layout: select(['left', 'center']).default('left'),
  grain: num(0, 0.4, 0.05).default(0.15),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  centered: { layout: 'center' },
  daylight: { background: '#F5F7FF', glow: '#8B9CFF', textColor: '#0B1026', accent: '#3B3FD8' },
  editorial: { font: 'serif', headline: 'The calm before.', accent: '#8B9CFF' },
  mono: { font: 'mono', eyebrow: 'FORECAST.LOG', grain: 0.3 },
};

export default function ForecastHero(p: z.infer<typeof schema> & BannerSize) {
  const u = Math.min(p.width, p.height * 1.9) / 100; // layout unit that scales across sizes
  const center = p.layout === 'center';
  return (
    <div
      style={{
        width: p.width,
        height: p.height,
        position: 'relative',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at 80% 20%, ${p.glow} 0%, transparent 60%), ${p.background}`,
        color: p.textColor,
        fontFamily: FONTS.inter,
        display: 'flex',
        alignItems: 'center',
        justifyContent: center ? 'center' : 'flex-start',
        textAlign: center ? 'center' : 'left',
      }}
    >
      {p.photo && (
        <img
          src={p.photo}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, mixBlendMode: 'luminosity' }}
        />
      )}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: p.grain }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <div style={{ position: 'relative', padding: `0 ${u * 7}px`, maxWidth: center ? '85%' : '70%' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: u * 1.8, letterSpacing: u * 0.4, color: p.accent, marginBottom: u * 2 }}>
          {p.eyebrow}
        </div>
        <div style={{ fontFamily: FONTS[p.font], fontWeight: 700, fontSize: u * 7, lineHeight: 1.02, letterSpacing: -u * 0.15 }}>
          {p.headline}
        </div>
        <div style={{ fontSize: u * 2.2, lineHeight: 1.4, opacity: 0.8, marginTop: u * 2.5 }}>{p.body}</div>
      </div>
    </div>
  );
}
