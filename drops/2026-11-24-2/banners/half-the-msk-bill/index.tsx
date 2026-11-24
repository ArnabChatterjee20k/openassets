import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { FilmOverlay, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Half the MSK Bill',
  description: 'Swiss-grid pricing banner: a full grey MSK column beside a red Halfstream column cut to half, a dashed 50% line and a log of message ticks, next to a signage headline.',
  tags: ['pricing', 'hero', 'social', 'kafka', 'comparison'],
};

export const schema = z.object({
  eyebrow: text().default('Halfstream · Managed Kafka'),
  headline: text().default('Kafka at half the MSK bill.'),
  body: textarea().default('We run Apache Kafka in your AWS account and carry the pager. You pay AWS on-demand prices, plus 25% on brokers.'),
  cta: text('Button (empty to hide)').default('Price your cluster'),
  link: text('Secondary link').default('halfstream.dev'),
  theirLabel: text('Their label').default('Amazon MSK'),
  theirPrice: text('Their price').default('$18,420'),
  ourLabel: text('Our label').default('Halfstream'),
  ourPrice: text('Our price').default('$9,210'),
  unit: text('Price unit').default('/mo'),
  chip: text('Chip (empty to hide)').default('AWS on-demand + 25% on brokers'),
  font: font('Headline font').default('bungee'),
  background: color().default('#F5F5F0'),
  surface: color().default('#E6E6E1'),
  ink: color('Text').default('#0A0A0A'),
  accent: color().default('#E3000F'),
  accent2: color('Their bar').default('#8C8C88'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'cherry-night': { background: '#2A0A10', surface: '#3F1019', ink: '#FFE8E0', accent: '#E3173E', accent2: '#F5C6AA' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', headline: 'Same Kafka. Half the invoice.' },
  brutal: { background: '#FFFDF2', surface: '#FFE45C', ink: '#000000', accent: '#FF5C8A', accent2: '#5C8AFF', font: 'archivo', headline: 'Your MSK bill, cut in half.' },
  minimal: { chip: '', body: '', link: '', eyebrow: 'Managed Kafka' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Two-column price comparison with the 50% cut and a message-tick baseline. */
function Chart({ x, y, w, h, p, compact }: { x: number; y: number; w: number; h: number; p: P; compact: boolean }) {
  const base = y + h * 0.82; // baseline
  const full = h * 0.68;
  const bw = w * 0.3;
  const x1 = x + w * 0.1;
  const x2 = x + w * 0.56;
  const priceSize = Math.max(14, Math.min(h * 0.075, bw * 0.2));
  const labelSize = Math.max(13, h * 0.05);
  const tick = Math.max(4, h * 0.022);
  const ticks = Math.floor(w / (tick * 2.2));
  const halfY = base - full / 2;
  const num: CSSProperties = { position: 'absolute', ...displayFace(p.font), fontSize: priceSize, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '-0.01em' };
  const lab: CSSProperties = { position: 'absolute', fontFamily: FONTS.vt323, fontSize: labelSize, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap', color: p.ink };
  return (
    <>
      {/* their bar: full height, flat grey with hairline hatching */}
      <div
        style={{
          position: 'absolute',
          left: x1,
          top: base - full,
          width: bw,
          height: full,
          background: `repeating-linear-gradient(135deg, ${p.accent2} 0 ${tick * 0.5}px, ${hexA(p.accent2, 0.75)} ${tick * 0.5}px ${tick}px)`,
        }}
      />
      {/* our bar: half height, solid accent, with the cut-off half drawn as an outline ghost */}
      <div style={{ position: 'absolute', left: x2, top: base - full, width: bw, height: full / 2, border: `${Math.max(1.5, tick * 0.3)}px dashed ${hexA(p.ink, 0.45)}`, boxSizing: 'border-box' }} />
      <div style={{ position: 'absolute', left: x2, top: halfY, width: bw, height: full / 2, background: p.accent, boxShadow: `${tick}px ${tick}px 0 ${p.ink}` }} />
      {/* 50% line */}
      <div style={{ position: 'absolute', left: x, top: halfY, width: w, height: 0, borderTop: `${Math.max(1, tick * 0.25)}px dashed ${p.ink}` }} />
      <div style={{ ...lab, right: `calc(100% - ${x + w}px)`, top: halfY - labelSize * 1.25, color: p.accent, fontSize: labelSize * 1.2 }}>−50%</div>
      {/* prices */}
      <div style={{ ...num, left: x1, top: base - full - priceSize * 1.35, color: p.ink }}>
        {p.theirPrice}
        <span style={{ fontFamily: FONTS.vt323, fontSize: priceSize * 0.6, marginLeft: priceSize * 0.15 }}>{p.unit}</span>
      </div>
      <div style={{ ...num, left: x2, top: halfY + priceSize * 0.5, color: isDark(p.accent) ? '#F5F5F0' : '#0A0A0A', paddingLeft: priceSize * 0.35 }}>
        {p.ourPrice}
        <span style={{ fontFamily: FONTS.vt323, fontSize: priceSize * 0.6, marginLeft: priceSize * 0.15 }}>{p.unit}</span>
      </div>
      {/* baseline + message ticks (the log) */}
      <div style={{ position: 'absolute', left: x, top: base, width: w, height: Math.max(2, tick * 0.4), background: p.ink }} />
      {Array.from({ length: ticks }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x + i * tick * 2.2,
            top: base + tick * 1.1,
            width: tick,
            height: tick,
            background: i % 5 === 3 ? p.accent : hexA(p.ink, i % 2 ? 0.25 : 0.6),
          }}
        />
      ))}
      {!compact && (
        <>
          <div style={{ ...lab, left: x1, top: base + tick * 3.2 }}>{p.theirLabel}</div>
          <div style={{ ...lab, left: x2, top: base + tick * 3.2, color: p.accent }}>{p.ourLabel}</div>
        </>
      )}
    </>
  );
}

export default function HalfTheMskBill(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.07 : Math.max(W * 0.05, H * 0.09);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.5 : 0.48);
  const len = p.headline.length;
  const fit = len > 30 ? 0.88 : 1;
  const head = Math.min(stacked ? W * 0.072 : H * (strip ? 0.16 : 0.13), colW * (strip ? 0.075 : 0.1)) * fit;
  const small = Math.max(13, head * (strip ? 0.36 : 0.4));

  // Chart region: right of the copy on wide sizes, above it when stacked.
  const chart = stacked
    ? { x: pad, y: H * 0.06, w: W - pad * 2, h: H * 0.44 }
    : strip
      ? { x: W * 0.6, y: H * 0.1, w: W * 0.4 - pad, h: H * 0.82 }
      : { x: W * 0.58, y: H * 0.12, w: W * 0.42 - pad, h: H * 0.78 };

  const cols = 12;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: p.background, color: p.ink, fontFamily: FONTS.outfit }}>
      {/* Swiss column grid */}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: pad + ((W - pad * 2) * i) / cols, top: 0, bottom: 0, width: 1, background: hexA(p.ink, dark ? 0.1 : 0.07) }} />
      ))}
      {/* huge cropped 50% in the surface colour */}
      <div
        style={{
          position: 'absolute',
          right: -W * 0.02,
          bottom: -H * (stacked ? 0.02 : 0.12),
          ...displayFace(p.font),
          fontSize: stacked ? W * 0.42 : H * 0.78,
          lineHeight: 0.8,
          color: p.surface,
          letterSpacing: '-0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        50%
      </div>
      {/* top hairline + red corner block */}
      <div style={{ position: 'absolute', left: pad, right: pad, top: pad * 0.5, height: Math.max(2, H * 0.004), background: p.ink }} />
      <div style={{ position: 'absolute', left: pad, top: pad * 0.5, width: small * 2.2, height: small * 0.9, background: p.accent }} />

      <Chart {...chart} p={p} compact={strip} />

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.56 } : { top: pad * 0.5, bottom: pad * 0.4, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: 'flex-start' }} />}
        <div style={{ fontFamily: FONTS.vt323, fontSize: small * 1.05, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.ink, display: 'flex', alignItems: 'center', gap: small * 0.5 }}>
          <span style={{ width: small * 0.5, height: small * 0.5, background: p.accent }} />
          {p.eyebrow}
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 0.98,
            letterSpacing: p.font === 'bungee' ? '-0.01em' : '-0.03em',
            textTransform: 'uppercase',
            marginTop: small * 0.6,
            color: p.ink,
          }}
        >
          {p.headline}
        </div>
        {!strip && p.body && (
          <div style={{ fontSize: small * 1.05, lineHeight: 1.4, marginTop: small * 0.8, maxWidth: colW * 0.88, opacity: 0.85 }}>{p.body}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 1.1, marginTop: small * (strip ? 0.7 : 1.2), flexWrap: 'wrap' }}>
          {p.cta && (
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.1}px`,
                fontWeight: 800,
                fontSize: small,
                background: p.accent,
                color: isDark(p.accent) ? '#F5F5F0' : '#0A0A0A',
                boxShadow: `${small * 0.25}px ${small * 0.25}px 0 ${p.ink}`,
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta} →
            </span>
          )}
          {p.link && <span style={{ fontFamily: FONTS.vt323, fontSize: small * 1.1, letterSpacing: '0.1em', borderBottom: `2px solid ${p.ink}` }}>{p.link}</span>}
          {!strip && !stacked && p.chip && (
            <span style={{ fontFamily: FONTS.vt323, fontSize: small * 1.0, letterSpacing: '0.08em', textTransform: 'uppercase', padding: `${small * 0.25}px ${small * 0.6}px`, border: `1.5px solid ${p.ink}`, whiteSpace: 'nowrap' }}>
              {p.chip}
            </span>
          )}
        </div>
      </div>
      <FilmOverlay grain={dark ? 0.06 : 0.035} vignette={dark ? 0.4 : 0.06} />
    </div>
  );
}
