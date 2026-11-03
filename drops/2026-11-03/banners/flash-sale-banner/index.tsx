import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { FilmOverlay, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Flash Sale Banner',
  description:
    'Sale banner for a 48-hour flash sale: a giant tilted "-60%" price tag locked in HUD target brackets, a live countdown readout and a was/now product chip beside a bold headline and promo-code CTA.',
  tags: ['e-commerce', 'flash sale', 'discount', 'social', 'hero', 'countdown'],
};

export const schema = z.object({
  eyebrow: text().default('11.11 flash sale · 48h only'),
  headline: text().default('Up to 60% off'),
  highlight: text('Highlighted word').default('60%'),
  body: textarea().default('Keycaps, mice and desk mats from Mochi Mode. Free shipping over $35, ends Wed 12 Nov at midnight.'),
  cta: text('Button (empty to hide)').default('Shop the drop'),
  code: text('Promo code (empty to hide)').default('FLASH11'),
  discount: text('Tag text').default('-60%'),
  tagLabel: text('Tag label').default('mochi mode 11.11'),
  countdown: text('Countdown (hh:mm:ss, empty to hide)').default('47:59:12'),
  product: text('Product (empty to hide)').default('Mochi Keycap Set'),
  was: text('Was price').default('$89'),
  now: text('Now price').default('$35.60'),
  font: font('Headline font').default('chakra'),
  background: color().default('#FDF3F8'),
  surface: color().default('#F7DDEB'),
  textColor: color('Text').default('#3A1F4A'),
  accent: color('Tag / highlight').default('#FF7EB6'),
  accent2: color('HUD lines').default('#8A7BFF'),
  pop: color('Live dot').default('#4FD1C5'),
  shadow: color('Hard shadow').default('#3A1F4A'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lilac: { background: '#E9E3F5', surface: '#D6CCEC', textColor: '#231942', accent: '#F49CBB', accent2: '#5E4AE3', pop: '#2EC4B6', shadow: '#231942' },
  sorbet: { background: '#FFEDE1', surface: '#FFD3C2', textColor: '#3D0E2A', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', shadow: '#3D0E2A', discount: '-50%', headline: 'Half off everything', highlight: 'Half', countdown: '11:42:05' },
  brutal: { font: 'archivo', background: '#FFFDF2', surface: '#FFE45C', textColor: '#000000', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#00D1A0', shadow: '#000000', headline: 'FLASH SALE. 60% OFF.', highlight: '60%' },
  'night drop': { background: '#12001F', surface: '#24003D', textColor: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', shadow: '#05000A', eyebrow: 'midnight drop · 2h only', headline: 'After-hours: 70% off', highlight: '70%', discount: '-70%', countdown: '01:59:30' },
  minimal: { body: '', product: '', countdown: '', eyebrow: '11.11 flash sale' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** HUD target brackets: four corner ticks around a box, with a tiny readout label. */
function Brackets({ x, y, w, h, s, p, label }: { x: number; y: number; w: number; h: number; s: number; p: P; label: string }) {
  const k = Math.min(w, h) * 0.16;
  const sw = Math.max(2, s * 0.14);
  const c = p.textColor;
  const d = [
    `M${x},${y + k} V${y} H${x + k}`,
    `M${x + w - k},${y} H${x + w} V${y + k}`,
    `M${x + w},${y + h - k} V${y + h} H${x + w - k}`,
    `M${x + k},${y + h} H${x} V${y + h - k}`,
  ];
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        {d.map((dd, i) => (
          <path key={i} d={dd} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="square" />
        ))}
        {/* crosshair ticks on the mid-edges */}
        <g stroke={p.accent2} strokeWidth={sw * 0.7}>
          <line x1={x + w / 2} y1={y - k * 0.5} x2={x + w / 2} y2={y + k * 0.25} />
          <line x1={x + w / 2} y1={y + h - k * 0.25} x2={x + w / 2} y2={y + h + k * 0.5} />
          <line x1={x - k * 0.5} y1={y + h / 2} x2={x + k * 0.25} y2={y + h / 2} />
          <line x1={x + w - k * 0.25} y1={y + h / 2} x2={x + w + k * 0.5} y2={y + h / 2} />
        </g>
      </svg>
      <div style={{ position: 'absolute', left: x + k * 0.2, top: y - s * 1.55, fontFamily: FONTS.majormono, fontSize: s * 0.78, letterSpacing: '0.12em', color: p.accent2, whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </>
  );
}

/** The hero: a notched price tag with a punched hole and a hard offset shadow. */
function PriceTag({ cx, cy, tw, p }: { cx: number; cy: number; tw: number; p: P }) {
  const th = tw * 0.56;
  const notch = th * 0.5;
  const shape = `M${notch},0 H${tw} V${th} H${notch} L0,${th / 2} Z`;
  const off = tw * 0.035;
  const size = (p.discount.length > 4 ? 0.4 : 0.48) * th;
  return (
    <div style={{ position: 'absolute', left: cx - tw / 2, top: cy - th / 2, width: tw, height: th, rotate: '-9deg' }}>
      <svg width={tw + off * 2} height={th + off * 2} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <path d={shape} transform={`translate(${off} ${off})`} fill={p.shadow} stroke={p.shadow} strokeWidth={tw * 0.04} strokeLinejoin="round" />
        <path d={shape} fill={p.accent} stroke={p.accent} strokeWidth={tw * 0.04} strokeLinejoin="round" />
        {/* inner stitched border */}
        <path
          d={`M${notch + th * 0.06},${th * 0.09} H${tw - th * 0.09} V${th * 0.91} H${notch + th * 0.06} L${th * 0.1},${th / 2} Z`}
          fill="none"
          stroke={p.shadow}
          strokeOpacity={0.35}
          strokeWidth={Math.max(1.5, tw * 0.006)}
          strokeDasharray={`${tw * 0.018} ${tw * 0.014}`}
          strokeLinejoin="round"
        />
        <circle cx={notch * 0.62} cy={th / 2} r={th * 0.075} fill={p.background} stroke={p.shadow} strokeWidth={Math.max(2, tw * 0.008)} />
        {/* barcode in the corner */}
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={tw - th * 0.5 + i * th * 0.026} y={th * 0.74} width={th * (i % 3 === 0 ? 0.014 : 0.007)} height={th * 0.1} fill={p.shadow} opacity={0.7} />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: notch + th * 0.1,
          top: th * 0.16,
          fontFamily: FONTS.majormono,
          fontSize: th * 0.068,
          letterSpacing: '0.06em',
          color: p.shadow,
          whiteSpace: 'nowrap',
        }}
      >
        {p.tagLabel}
      </div>
      <div
        style={{
          position: 'absolute',
          left: notch,
          right: th * 0.06,
          top: th * 0.24,
          textAlign: 'center',
          ...displayFace(p.font),
          fontStyle: p.font === 'chakra' ? 'italic' : 'normal',
          fontSize: size,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: p.shadow,
          whiteSpace: 'nowrap',
        }}
      >
        {p.discount}
      </div>
    </div>
  );
}

/** Countdown readout: hh / mm / ss cells. */
function Countdown({ s, p, style }: { s: number; p: P; style: CSSProperties }) {
  const parts = p.countdown.split(':');
  const labels = ['hrs', 'min', 'sec'];
  const dark = isDark(p.background);
  return (
    <div style={{ position: 'absolute', display: 'flex', alignItems: 'flex-start', gap: s * 0.35, ...style }}>
      {parts.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: s * 0.35 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${s * 0.3}px ${s * 0.45}px ${s * 0.25}px`,
              background: dark ? hexA('#ffffff', 0.06) : p.background,
              border: `${Math.max(1.5, s * 0.08)}px solid ${p.textColor}`,
              borderRadius: s * 0.25,
              boxShadow: `${s * 0.18}px ${s * 0.18}px 0 ${p.shadow}`,
            }}
          >
            <span style={{ ...displayFace('chakra'), fontSize: s * 1.7, lineHeight: 1, color: p.textColor, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
            <span style={{ fontFamily: FONTS.majormono, fontSize: s * 0.5, letterSpacing: '0.14em', color: p.textColor, opacity: 0.75, marginTop: s * 0.1 }}>{labels[i] ?? ''}</span>
          </div>
          {i < parts.length - 1 && <span style={{ ...displayFace('chakra'), fontSize: s * 1.5, lineHeight: 1.3, color: p.accent2 }}>:</span>}
        </div>
      ))}
    </div>
  );
}

function ProductChip({ s, p, style }: { s: number; p: P; style: CSSProperties }) {
  if (!p.product) return null;
  const dark = isDark(p.background);
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: s * 0.6,
        padding: `${s * 0.5}px ${s * 0.8}px ${s * 0.5}px ${s * 0.5}px`,
        borderRadius: s * 0.5,
        background: dark ? p.surface : '#FFFFFF',
        border: `${Math.max(1.5, s * 0.07)}px solid ${p.textColor}`,
        boxShadow: `${s * 0.2}px ${s * 0.2}px 0 ${p.shadow}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {/* keycap thumbnail */}
      <div style={{ width: s * 1.9, height: s * 1.9, borderRadius: s * 0.35, background: p.surface, display: 'grid', placeItems: 'center' }}>
        <div style={{ width: s * 1.15, height: s * 1.0, borderRadius: s * 0.22, background: p.accent, boxShadow: `inset 0 ${-s * 0.18}px 0 ${hexA(p.shadow, 0.35)}` }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: s * 0.1 }}>
        <span style={{ fontFamily: FONTS.sora, fontWeight: 600, fontSize: s * 0.78, color: p.textColor }}>{p.product}</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: s * 0.45 }}>
          <span style={{ fontFamily: FONTS.sora, fontSize: s * 0.72, color: p.textColor, opacity: 0.6, textDecoration: 'line-through' }}>{p.was}</span>
          <span style={{ ...displayFace('chakra'), fontSize: s * 1.05, color: dark ? p.accent : p.textColor }}>{p.now}</span>
        </span>
      </div>
    </div>
  );
}

export default function FlashSaleBanner(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.44 : 0.47);
  const head = Math.min(stacked ? W * 0.095 : H * (strip ? 0.2 : 0.13), colW * (p.headline.length > 16 ? 0.105 : 0.135));
  const small = Math.max(head * 0.27, 13);

  // Hero geometry
  const tw = stacked ? Math.min(W * 0.46, H * 0.42) : strip ? Math.min(H * 1.05, W * 0.24) : Math.min(H * 0.62, W * 0.34);
  const th = tw * 0.56;
  const hx = stacked ? W / 2 : strip ? W * 0.665 : W - pad - tw * 0.62;
  const hy = stacked ? H * 0.3 : H * (strip ? 0.5 : 0.47);
  const s = stacked ? Math.min(W, H) * 0.024 : strip ? H * 0.06 : Math.min(H * 0.034, W * 0.02); // HUD unit
  const bx = hx - tw * 0.66;
  const by = hy - th * (stacked ? 0.8 : 0.95);
  const bw = tw * 1.32;
  const bh = th * (stacked ? 1.6 : 1.9);

  // Headline with the highlighted word in the accent, hard-shadowed.
  const idx = p.highlight ? p.headline.indexOf(p.highlight) : -1;
  const hl: CSSProperties = { color: p.accent, textShadow: `${head * 0.045}px ${head * 0.045}px 0 ${p.shadow}` };
  const headline =
    idx >= 0 ? (
      <>
        {p.headline.slice(0, idx)}
        <span style={hl}>{p.highlight}</span>
        {p.headline.slice(idx + p.highlight.length)}
      </>
    ) : (
      p.headline
    );

  const stripes = `repeating-linear-gradient(135deg, ${hexA(p.accent2, dark ? 0.55 : 0.4)} 0 ${s * 0.5}px, transparent ${s * 0.5}px ${s * 1.1}px)`;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: p.background, color: p.textColor, fontFamily: FONTS.sora }}>
      {/* Depth: soft colour fields, a dot grid and HUD scan lines */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 55% 75% at ${(hx / W) * 100}% ${(hy / H) * 100}%, ${hexA(p.accent, dark ? 0.3 : 0.32)} 0%, transparent 70%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 60% at ${stacked ? 20 : 8}% 100%, ${hexA(p.accent2, dark ? 0.35 : 0.22)} 0%, transparent 70%)` }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${hexA(p.textColor, dark ? 0.14 : 0.13)} 1.1px, transparent 1.7px)`,
          backgroundSize: `${Math.round(s * 1.3)}px ${Math.round(s * 1.3)}px`,
          maskImage: 'linear-gradient(90deg, transparent 0%, black 45%, black 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 45%, black 100%)',
        }}
      />
      {/* chevron hazard band running behind the tag */}
      <div style={{ position: 'absolute', left: hx - W, top: hy + th * 0.15, width: W * 2, height: th * 0.32, background: stripes, rotate: '-9deg', opacity: 0.9 }} />
      <div style={{ position: 'absolute', left: hx - W, top: hy + th * 0.15, width: W * 2, height: th * 0.32, rotate: '-9deg', borderTop: `${Math.max(1, s * 0.06)}px solid ${hexA(p.accent2, 0.6)}`, borderBottom: `${Math.max(1, s * 0.06)}px solid ${hexA(p.accent2, 0.6)}` }} />
      {/* HUD scan ring */}
      <div style={{ position: 'absolute', left: hx - tw * 0.85, top: hy - tw * 0.85, width: tw * 1.7, height: tw * 1.7, borderRadius: '50%', border: `${Math.max(1, s * 0.06)}px dashed ${hexA(p.accent2, 0.5)}` }} />

      <Brackets x={bx} y={by} w={bw} h={bh} s={s} p={p} label={stacked ? '' : 'target: deal_01 · lock'} />
      <PriceTag cx={hx} cy={hy} tw={tw} p={p} />

      {p.countdown && (
        <Countdown
          s={s}
          p={p}
          style={stacked ? { left: bx + bw - s * 12, top: by + bh - s * 1.4 } : strip ? { right: pad * 0.6, top: H / 2 - s * 1.6 } : { left: bx - s * 1.2, top: by + bh - s * 1.6 }}
        />
      )}
      {!strip && <ProductChip s={s} p={p} style={stacked ? { left: bx - s * 0.6, top: by - s * 1.2 } : { right: W - (bx + bw) - s * 1.4, top: by - s * 0.6 }} />}

      {/* Copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.6, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ display: stacked ? 'flex' : 'block', justifyContent: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              padding: `${small * 0.35}px ${small * 0.8}px`,
              borderRadius: small * 0.25,
              background: p.surface,
              border: `1px solid ${hexA(p.textColor, 0.2)}`,
              fontFamily: FONTS.majormono,
              fontSize: small * 0.9,
              letterSpacing: '0.08em',
              color: p.textColor,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop, boxShadow: `0 0 0 ${small * 0.18}px ${hexA(p.pop, 0.3)}` }} />
            {p.eyebrow}
          </span>
        </div>
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 0.98, letterSpacing: p.font === 'archivo' ? '-0.02em' : '-0.03em', marginTop: small * 0.75, textTransform: p.font === 'chakra' ? 'uppercase' : undefined }}>{headline}</div>
        {!strip && p.body && (
          <div style={{ fontSize: small * 1.0, lineHeight: 1.5, opacity: 0.85, marginTop: small * 0.7, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>
        )}
        {(p.cta || p.code) && (
          <div style={{ display: 'flex', gap: small * 0.6, alignItems: 'center', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.3) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.62}px ${small * 1.2}px`,
                  borderRadius: small * 0.3,
                  fontWeight: 700,
                  fontSize: small * 0.92,
                  color: dark ? p.background : p.background,
                  background: dark ? p.accent : p.textColor,
                  boxShadow: `${small * 0.22}px ${small * 0.22}px 0 ${dark ? p.accent2 : p.accent}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.code && (
              <span
                style={{
                  padding: `${small * 0.5}px ${small * 0.8}px`,
                  borderRadius: small * 0.3,
                  border: `${Math.max(1.5, small * 0.08)}px dashed ${p.textColor}`,
                  fontSize: small * 0.82,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontFamily: FONTS.majormono, letterSpacing: '0.08em', opacity: 0.75 }}>code </span>
                <span style={{ ...displayFace('chakra'), letterSpacing: '0.06em', fontSize: small * 0.95 }}>{p.code}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <FilmOverlay grain={dark ? 0.06 : 0.04} vignette={dark ? 0.45 : 0.06} />
    </div>
  );
}
