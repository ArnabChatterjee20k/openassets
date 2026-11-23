import type { CSSProperties, ReactNode } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Deploy Day',
  description:
    'Neo-brutalist launch banner for Sparkcrate: a shouting "POWER BY 3PM." headline beside a hard-shadowed card of the unfolded solar crate, stencil spec tags and an install-day timeline.',
  tags: ['hero', 'social', 'launch', 'solar', 'energy', 'brutalist'],
};

export const schema = z.object({
  eyebrow: text().default('Sparkcrate S1 · Now shipping'),
  headline: text('Headline line 1').default('Power by'),
  highlight: text('Headline line 2 (accent)').default('3PM.'),
  body: textarea().default('Solar + a 480 kWh battery in one crate. Two people unfold it in a single shift. No crane, no electrician, no diesel.'),
  cta: text('Button (empty to hide)').default('Book a site survey'),
  spec1: text('Tag 1').default('480 kWh'),
  spec2: text('Tag 2').default('2 crew'),
  spec3: text('Tag 3').default('0 cranes'),
  step1: text('Timeline 1').default('08:00 Crate'),
  step2: text('Timeline 2').default('11:00 Wings'),
  step3: text('Timeline 3').default('15:00 Power on'),
  font: font('Headline font').default('anton'),
  background: color().default('#FFFDF2'),
  surface: color('Crate / tags').default('#FFE45C'),
  ink: color('Ink & shadows').default('#000000'),
  accent: color().default('#FF6B4A'),
  accent2: color('Card').default('#5C8AFF'),
  pop: color('Power-on').default('#00D1A0'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  blueprint: { background: '#0F3B8C', surface: '#FFDD00', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#134AA8', pop: '#7FB2FF', headline: 'Off-grid by', highlight: 'Friday.' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', headline: 'Ditch diesel', highlight: 'today.', cta: 'Get a quote' },
  bauhaus: { background: '#F2EBDD', surface: '#F2B90F', ink: '#111111', accent: '#D9381E', accent2: '#1D4E9E', pop: '#F2B90F', font: 'bebas', eyebrow: 'Field-ready power', spec3: 'IP65' },
  minimal: { spec1: '', spec2: '', spec3: '', cta: '', eyebrow: 'Sparkcrate', body: 'Solar + storage that ships in one crate.' },
};

type P = z.infer<typeof schema> & BannerSize;

/** Stencil tag: hard border, flat fill, offset shadow. */
function Tag({ children, bg, p, size, style }: { children: ReactNode; bg: string; p: P; size: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.5,
        padding: `${size * 0.45}px ${size * 0.8}px`,
        background: bg,
        color: isDark(bg) ? '#FFFDF2' : '#000000',
        border: `${Math.max(2, size * 0.16)}px solid ${p.ink}`,
        boxShadow: `${size * 0.32}px ${size * 0.32}px 0 ${p.ink}`,
        fontFamily: FONTS.mono,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

/** The unfolded crate: sun, two solar wings, crate with charge gauge, skids. viewBox 400×260. */
function CrateArt({ p }: { p: P }) {
  const S = 5; // stroke
  const ink = '#000000';
  const cellFill = '#B9CBFF';
  const Wing = ({ x, rot, ox }: { x: number; rot: number; ox: number }) => (
    <g transform={`rotate(${rot} ${ox} 118)`}>
      <rect x={x} y={92} width={120} height={28} fill="#1B1F2E" stroke={ink} strokeWidth={S} strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 6 + i * 27.5} y={97} width={23} height={18} fill={cellFill} />
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', overflow: 'visible' }}>
      {/* sun + rays */}
      <g stroke={ink} strokeWidth={S} strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          return <line key={i} x1={312 + Math.cos(a) * 52} y1={62 + Math.sin(a) * 52} x2={312 + Math.cos(a) * 66} y2={62 + Math.sin(a) * 66} />;
        })}
      </g>
      <circle cx={312} cy={62} r={40} fill={p.surface} stroke={ink} strokeWidth={S} />
      {/* ground */}
      <line x1={10} y1={232} x2={390} y2={232} stroke={ink} strokeWidth={S} strokeLinecap="round" />
      {/* hard shadow of the crate */}
      <rect x={150} y={128} width={140} height={92} rx={6} fill={ink} />
      {/* wings */}
      <Wing x={20} rot={16} ox={140} />
      <Wing x={260} rot={-16} ox={260} />
      {/* skids */}
      <rect x={156} y={212} width={30} height={18} fill={ink} />
      <rect x={234} y={212} width={30} height={18} fill={ink} />
      {/* crate */}
      <rect x={140} y={118} width={140} height={94} rx={6} fill={p.surface} stroke={ink} strokeWidth={S} />
      <rect x={140} y={186} width={140} height={12} fill={p.accent} stroke={ink} strokeWidth={S * 0.7} />
      <rect x={154} y={132} width={84} height={34} rx={4} fill={ink} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={160 + i * 19.5} y={138} width={14} height={22} rx={2} fill={p.pop} />
      ))}
      <circle cx={259} cy={149} r={9} fill={p.accent} stroke={ink} strokeWidth={S * 0.8} />
      {/* power-on sparks */}
      <g stroke={ink} strokeWidth={S * 0.8} strokeLinecap="round">
        <line x1={210} y1={104} x2={204} y2={88} />
        <line x1={226} y1={106} x2={234} y2={92} />
        <line x1={194} y1={108} x2={180} y2={98} />
      </g>
    </svg>
  );
}

export default function DeployDay(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const k = stacked ? W / 1080 : strip ? H / 396 : Math.min(H / 630, W / 1200);
  const band = Math.round(18 * k); // hazard tape at the bottom
  const pad = stacked ? W * 0.075 : strip ? H * 0.14 : Math.max(W * 0.05, H * 0.09);
  const shadow = Math.round(10 * k);
  const bw = Math.max(3, Math.round(4 * k)); // brutalist border width

  // Card (hero visual) box
  const card = stacked
    ? { x: pad, y: pad, w: W - pad * 2 - shadow, h: H * 0.37 }
    : strip
      ? { w: H * 1.45, h: H - pad * 2 - band - shadow, x: W - pad - H * 1.45 - shadow, y: pad }
      : { x: W * 0.54, y: pad, w: W * 0.46 - pad - shadow, h: H - pad * 2 - band - shadow };
  const timelineH = strip ? 0 : card.h * 0.17;

  // Copy column
  const col = stacked
    ? { x: pad, y: card.y + card.h + shadow + pad * 0.7, w: W - pad * 2 }
    : { x: pad, y: 0, w: strip ? card.x - pad * 2 : W * 0.54 - pad * 1.6 };
  // Anton caps run ~0.46em per character; size so the longest line fits on one row.
  const lineChars = Math.max(p.headline.length, p.highlight.length, 6);
  const fit = col.w / (lineChars * 0.47 + 0.3);
  const head = strip
    ? Math.min(H * 0.27, col.w / ((p.headline.length + p.highlight.length + 1) * 0.47 + 0.3))
    : stacked
      ? Math.min(W * 0.115, fit)
      : Math.min(H * 0.21, fit);
  const small = Math.max(15, (stacked ? 20 : 18) * k);
  const tag = Math.max(13, (stacked ? 17 : 15) * k);
  const steps = [p.step1, p.step2, p.step3];
  const stepChars = steps.join('').length;

  const textColor = p.ink;
  const tags = [
    { t: p.spec1, bg: p.surface },
    { t: p.spec2, bg: dark ? p.background : '#FFFFFF' },
    { t: p.spec3, bg: p.pop },
  ].filter((x) => x.t);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', fontFamily: FONTS.familjen, color: textColor }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.16 : 0.22, size: Math.round(26 * k), color: dark ? '234,242,255' : '0,0,0', fade: 1.2 }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)'}
        glows={[]}
        grain={0.03}
        vignette={dark ? 0.35 : 0}
      />

      {/* big ghost numeral behind the copy */}
      {!strip && (
        <div
          style={{
            position: 'absolute',
            left: stacked ? W * 0.45 : -W * 0.02,
            bottom: band - head * 0.5,
            ...displayFace('anton'),
            fontSize: head * 3.2,
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: `${Math.max(1.5, 2 * k)}px ${dark ? 'rgba(234,242,255,0.18)' : 'rgba(0,0,0,0.1)'}`,
            whiteSpace: 'nowrap',
          }}
        >
          6 HRS
        </div>
      )}

      {/* hero card */}
      <div style={{ position: 'absolute', left: card.x + shadow, top: card.y + shadow, width: card.w, height: card.h, background: p.ink }} />
      <div
        style={{
          position: 'absolute',
          left: card.x,
          top: card.y,
          width: card.w,
          height: card.h,
          background: p.accent2,
          border: `${bw}px solid ${p.ink}`,
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* sky stripes */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent 0 ${18 * k}px, rgba(255,255,255,0.08) ${18 * k}px ${20 * k}px)` }} />
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', left: card.w * 0.05, right: card.w * 0.05, top: card.h * 0.07, bottom: card.h * 0.03 }}>
            <CrateArt p={p} />
          </div>
        </div>
        {timelineH > 0 && (
          <div
            style={{
              height: timelineH,
              borderTop: `${bw}px solid ${p.ink}`,
              background: p.ink,
              color: dark ? p.background : '#FFFDF2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `0 ${card.w * 0.05}px`,
              fontFamily: FONTS.mono,
              fontWeight: 700,
              // mono is ~0.6em per char (+tracking); leave room for dots and gaps
              fontSize: Math.min(timelineH * 0.3, (card.w * 0.8) / (stepChars * 0.66 + 4)),
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              gap: card.w * 0.02,
              position: 'relative',
            }}
          >
            {steps.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: card.w * 0.012 }}>
                <span style={{ width: timelineH * 0.2, height: timelineH * 0.2, borderRadius: '50%', background: i === 2 ? p.pop : 'transparent', border: `2px solid ${i === 2 ? p.pop : dark ? p.background : '#FFFDF2'}`, flexShrink: 0 }} />
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* spec tags pinned over the card's corners */}
      {tags.slice(0, strip ? 2 : 3).map((x, i) => {
        const pos: CSSProperties = stacked
          ? [
              { left: card.x - tag * 0.6, top: card.y + card.h * 0.08, rotate: '-4deg' },
              { right: W - card.x - card.w - tag * 0.4, top: card.y + card.h * 0.06, rotate: '3deg' },
              { right: W - card.x - card.w + tag * 0.6, top: card.y + card.h * 0.52, rotate: '-2deg' },
            ][i]
          : strip
            ? [
                { left: card.x - tag * 2.5, top: card.y + card.h * 0.12, rotate: '-4deg' },
                { left: card.x - tag * 1.5, top: card.y + card.h * 0.58, rotate: '3deg' },
              ][i]
            : [
                { left: card.x - tag * 2.2, top: card.y + card.h * 0.1, rotate: '-4deg' },
                { right: pad - tag * 0.4, top: card.y - tag * 0.9, rotate: '3deg' },
                { left: card.x - tag * 1.2, top: card.y + card.h * 0.5, rotate: '2deg' },
              ][i];
        return (
          <div key={i} style={{ position: 'absolute', ...pos }}>
            <Tag p={p} bg={x.bg} size={tag}>
              {x.t}
            </Tag>
          </div>
        );
      })}

      {/* copy */}
      <div
        style={{
          position: 'absolute',
          left: col.x,
          width: col.w,
          ...(stacked
            ? { top: col.y }
            : { top: 0, bottom: band, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.8, flexWrap: 'wrap' }}>
          {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, objectFit: 'contain' }} />}
          <Tag p={p} bg={p.surface} size={tag * (strip ? 0.95 : 1)}>
            <span style={{ width: tag * 0.6, height: tag * 0.6, borderRadius: '50%', background: p.pop, border: `2px solid #000000` }} />
            {p.eyebrow}
          </Tag>
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 0.9,
            letterSpacing: '0.005em',
            textTransform: 'uppercase',
            marginTop: head * (strip ? 0.12 : 0.22),
            color: textColor,
            whiteSpace: strip ? 'nowrap' : undefined,
          }}
        >
          {p.headline}
          {strip ? ' ' : <br />}
          <span style={{ color: p.accent, WebkitTextStroke: `${Math.max(2, head * 0.025)}px ${p.ink}`, textShadow: `${head * 0.05}px ${head * 0.05}px 0 ${p.ink}` }}>{p.highlight}</span>
        </div>
        {!strip && p.body && (
          <div style={{ fontSize: small * 1.3, lineHeight: 1.35, fontWeight: 500, marginTop: head * 0.2, maxWidth: col.w * 0.94 }}>{p.body}</div>
        )}
        {p.cta && (
          <div style={{ marginTop: strip ? head * 0.2 : head * 0.26 }}>
            <span
              style={{
                display: 'inline-block',
                padding: `${small * 0.7}px ${small * 1.3}px`,
                background: p.accent,
                color: '#000000',
                border: `${bw}px solid ${p.ink}`,
                boxShadow: `${shadow * 0.7}px ${shadow * 0.7}px 0 ${p.ink}`,
                fontWeight: 700,
                fontSize: small * 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta} →
            </span>
          </div>
        )}
      </div>

      {/* hazard tape */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: band,
          borderTop: `${bw}px solid ${p.ink}`,
          backgroundImage: `repeating-linear-gradient(135deg, ${p.ink} 0 ${band * 0.7}px, ${p.surface} ${band * 0.7}px ${band * 1.4}px)`,
        }}
      />
    </div>
  );
}
