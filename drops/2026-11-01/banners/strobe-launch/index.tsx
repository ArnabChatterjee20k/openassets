import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS, type FontKey } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Strobe 1.0 Launch',
  description:
    'Launch banner for a feature-flag SaaS: chunky arcade headline, pixel eyebrow and a toggle-pill CTA beside a live flag console (rollout bar, segments, conversion sparkline) lit by lasers and strobe bars.',
  tags: ['launch', 'saas', 'social', 'hero', 'feature flags', 'og image'],
};

export const schema = z.object({
  eyebrow: text().default('Strobe 1.0 · Out now'),
  headline: text().default('Ship on Friday'),
  body: textarea().default('Feature flags, gradual rollouts and a one-click kill switch for every release.'),
  cta: text('Button (empty to hide)').default('Start free → strobe.dev'),
  price: text('Price note (empty to hide)').default('Free for 3 environments · Team $29/mo'),
  flagKey: text('Flag name').default('new-checkout'),
  rollout: num(0, 100, 5, 'Rollout %').default(25),
  segments: text('Segments (comma separated)').default('Beta testers, EU, Plan: Team'),
  metricLabel: text('Metric label').default('Checkout conv.'),
  metricValue: text('Metric value').default('+12.4%'),
  headlineFont: font('Headline font').default('nabla'),
  background: color().default('#0B0B0B'),
  surface: color('Card').default('#1A1A1A'),
  textColor: color('Text').default('#F0FFE0'),
  accent: color('Accent (ON)').default('#C6FF00'),
  accent2: color('Laser').default('#FF00E5'),
  pop: color('Live dot').default('#00F0FF'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { background: '#12001F', surface: '#24003D', textColor: '#FBEFFF', accent: '#B026FF', accent2: '#FF2E88', pop: '#FFD600' },
  lava: { background: '#1A0A06', surface: '#2E120B', textColor: '#FFEDE0', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63', headline: 'Roll out, not over', rollout: 50 },
  brutal: { background: '#FFFDF2', surface: '#FFFFFF', textColor: '#111111', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#00D1A0', headlineFont: 'bungee' },
  deepsea: { background: '#021B26', surface: '#06303F', textColor: '#E6FFFA', accent: '#2EF2C4', accent2: '#1B7FA6', pop: '#FF7A59', headline: 'Flip it live', rollout: 100, cta: 'Read the changelog →' },
};

type P = z.infer<typeof schema> & BannerSize;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const shade = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (to - v) * k).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};

/** Nabla's COLR layers are forced to one colour so it renders identically everywhere; depth comes from our own extrusion. */
const NABLA_CSS = `@font-palette-values --strobe-flat { font-family: 'Nabla'; override-colors: ${Array.from({ length: 32 }, (_, i) => `${i} currentColor`).join(', ')}; }`;

/** Arcade block lettering: stacked hard shadows make an isometric extrusion, plus an offset laser shadow. */
function arcade(face: string, side: string, laser: string, size: number, fontKey: FontKey): CSSProperties {
  const depth = Math.max(3, Math.round(size * 0.07));
  const steps = Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`);
  steps.push(`${depth + size * 0.05}px ${depth + size * 0.05}px 0 ${laser}`);
  return {
    fontFamily: FONTS[fontKey],
    fontPalette: fontKey === 'nabla' ? '--strobe-flat' : undefined,
    color: face,
    textShadow: steps.join(', '),
    textTransform: 'uppercase',
    letterSpacing: fontKey === 'nabla' ? '0.01em' : '-0.01em',
  } as CSSProperties;
}

/** The kit motif: a toggle pill in the ON state. */
function Pill({ h, on, knob, label, labelColor, style }: { h: number; on: string; knob: string; label?: string; labelColor?: string; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: h * 0.4,
        height: h,
        padding: label ? `0 ${h * 0.12}px 0 ${h * 0.5}px` : `0 ${h * 0.1}px`,
        width: label ? undefined : h * 1.8,
        justifyContent: 'flex-end',
        borderRadius: h,
        background: on,
        boxShadow: `0 0 ${h * 0.6}px ${hexA(on, 0.45)}, inset 0 -${h * 0.08}px 0 ${hexA('#000000', 0.18)}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label && <span style={{ fontFamily: FONTS.rubikmono, fontSize: h * 0.34, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</span>}
      <span style={{ width: h * 0.78, height: h * 0.78, borderRadius: '50%', background: knob, boxShadow: `0 ${h * 0.06}px ${h * 0.12}px rgba(0,0,0,0.35)`, flex: 'none' }} />
    </span>
  );
}

function Console({ p, x, y, w, compact }: { p: P; x: number; y: number; w: number; compact: boolean }) {
  const u = w / 100;
  const dark = lum(p.background) < 140;
  const muted = hexA(p.textColor, 0.55);
  const blocks = 20;
  const lit = Math.round((p.rollout / 100) * blocks);
  const segs = p.segments.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  // Deterministic, rising sparkline
  const pts = Array.from({ length: 14 }, (_, i) => [i / 13, 0.75 - i * 0.04 - rand(i * 4.2 + 1) * 0.22] as const);
  const sw = 88 * u;
  const sh = 15 * u;
  const line = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${(a * sw).toFixed(1)},${(b * sh).toFixed(1)}`).join(' ');
  const label: CSSProperties = { fontFamily: FONTS.pressstart, fontSize: Math.max(8, Math.round(2.4 * u)), letterSpacing: '0.12em', color: muted, textTransform: 'uppercase' };
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        padding: `${5 * u}px ${6 * u}px ${compact ? 5 * u : 6 * u}px`,
        boxSizing: 'border-box',
        borderRadius: 4 * u,
        background: p.surface,
        border: `${Math.max(1, 0.3 * u)}px solid ${hexA(p.textColor, dark ? 0.14 : 0.9)}`,
        boxShadow: `${2.4 * u}px ${2.4 * u}px 0 ${p.accent2}, 0 ${6 * u}px ${18 * u}px rgba(0,0,0,${dark ? 0.5 : 0.12})`,
        color: p.textColor,
      }}
    >
      {/* Header: flag key + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 * u }}>
        <div style={{ minWidth: 0 }}>
          <div style={label}>Flag</div>
          <div style={{ fontFamily: FONTS.rubikmono, fontSize: 4.6 * u, marginTop: 1.6 * u, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.flagKey}</div>
        </div>
        <Pill h={8 * u} on={p.accent} knob={dark ? p.textColor : '#FFFFFF'} />
      </div>
      {!compact && (
        <div style={{ display: 'flex', gap: 1.6 * u, marginTop: 4 * u }}>
          {['Dev', 'Staging', 'Prod'].map((e, i) => (
            <span
              key={e}
              style={{
                ...label,
                fontSize: Math.max(8, Math.round(2.2 * u)),
                color: i === 2 ? (dark ? p.background : p.textColor) : muted,
                background: i === 2 ? p.accent : 'transparent',
                border: `1px solid ${i === 2 ? p.accent : hexA(p.textColor, 0.2)}`,
                padding: `${1.4 * u}px ${2.2 * u}px`,
                borderRadius: 1.4 * u,
              }}
            >
              {e}
            </span>
          ))}
        </div>
      )}
      {/* Rollout */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: compact ? 3.5 * u : 5 * u }}>
        <div style={label}>Rollout</div>
        <div style={{ ...arcade(p.accent, shade(p.accent, -0.55), p.accent2, 10 * u, 'nabla'), fontSize: 10 * u, lineHeight: 0.9 }}>{p.rollout}%</div>
      </div>
      <div style={{ display: 'flex', gap: 0.8 * u, marginTop: 2.4 * u }}>
        {Array.from({ length: blocks }, (_, i) => (
          <span key={i} style={{ flex: 1, height: 3.6 * u, borderRadius: 0.5 * u, background: i < lit ? p.accent : hexA(p.textColor, 0.1), boxShadow: i < lit ? `0 0 ${2 * u}px ${hexA(p.accent, 0.5)}` : undefined }} />
        ))}
      </div>
      {!compact && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1.6 * u, marginTop: 4.5 * u }}>
            {segs.map((s) => (
              <span key={s} style={{ fontFamily: FONTS.rubikmono, fontSize: 2.5 * u, textTransform: 'uppercase', padding: `${1.4 * u}px ${2.4 * u}px`, borderRadius: 9 * u, border: `1px solid ${hexA(p.accent2, 0.7)}`, color: p.textColor, background: hexA(p.accent2, 0.12), whiteSpace: 'nowrap' }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 5 * u }}>
            <div style={label}>{p.metricLabel}</div>
            <div style={{ fontFamily: FONTS.rubikmono, fontSize: 4.4 * u, color: dark ? p.accent : p.textColor }}>{p.metricValue}</div>
          </div>
          <svg width={sw} height={sh + 2 * u} style={{ display: 'block', marginTop: 2 * u, overflow: 'visible' }}>
            <defs>
              <linearGradient id="strobe-spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={p.accent2} stopOpacity="0.45" />
                <stop offset="1" stopColor={p.accent2} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${line} L${sw},${sh + 2 * u} L0,${sh + 2 * u} Z`} fill="url(#strobe-spark)" />
            <path d={line} fill="none" stroke={p.accent2} strokeWidth={Math.max(1.5, 0.7 * u)} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={sw} cy={pts[13][1] * sh} r={1.3 * u} fill={p.pop} />
            <circle cx={sw} cy={pts[13][1] * sh} r={3 * u} fill={p.pop} opacity={0.25} />
          </svg>
        </>
      )}
    </div>
  );
}

export default function StrobeLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = lum(p.background) < 140;
  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);

  // Hero console placement; anchored by its right edge in landscape.
  const cardW = stacked ? Math.min(W * 0.62, H * 0.5) : strip ? Math.min(W * 0.26, H * 1.05) : Math.min(W * 0.36, H * 0.66);
  const compact = strip;
  const cardX = stacked ? (W - cardW) / 2 : W - pad - cardW;
  const cardY = stacked ? H * 0.07 : strip ? H * 0.5 - cardW * 0.24 : H * 0.5 - cardW * 0.56;

  const colW = stacked ? W - pad * 2 : cardX - pad - W * 0.05;
  const words = p.headline.split(/\s+/);
  const longest = Math.max(...words.map((w) => w.length), 4);
  const isNabla = p.headlineFont === 'nabla';
  const charW = isNabla ? 0.78 : 0.7;
  const head = Math.min(stacked ? W * 0.11 : H * (strip ? 0.24 : 0.16), colW / (longest * charW), strip ? colW / (p.headline.length * charW) : Infinity);
  const small = Math.max(13, head * (strip ? 0.2 : 0.17));
  const copyTop = stacked ? H * 0.62 : undefined;

  // Lasers fan out from the top corner behind the console.
  const lx = stacked ? W * 0.5 : cardX + cardW * 0.5;
  const beams = [-58, -38, -20, 0, 18, 36, 54];

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.rubikmono }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.09 : 0.14, size: Math.round(Math.min(W, H) / 22), color: dark ? '240,255,224' : '17,17,17' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: lx, y: stacked ? H * 0.3 : H * 0.5, size: Math.max(W, H) * 0.7, color: hexA(p.accent2, dark ? 0.4 : 0.25), opacity: 0.8 },
          { x: stacked ? W * 0.5 : W * 0.12, y: H * 1.05, size: Math.max(W, H) * 0.8, color: hexA(p.accent, dark ? 0.22 : 0.2), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.5 : 0.06}
      />

      {/* Laser fan */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, mixBlendMode: dark ? 'screen' : 'multiply' }}>
        <defs>
          {[p.accent2, p.pop].map((c, i) => (
            <linearGradient key={i} id={`strobe-beam-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c} stopOpacity="0.9" />
              <stop offset="1" stopColor={c} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {beams.map((a, i) => (
          <rect key={i} x={lx - Math.max(1, H * 0.003)} y={-H * 0.05} width={Math.max(2, H * 0.006)} height={Math.hypot(W, H)} fill={`url(#strobe-beam-${i % 3 === 1 ? 1 : 0})`} transform={`rotate(${a} ${lx} ${-H * 0.05})`} opacity={0.55} />
        ))}
      </svg>

      {/* Strobe bars: rave-flyer scanlines thinning towards the bottom */}
      <div
        style={{
          position: 'absolute',
          left: stacked ? 0 : cardX - W * 0.12,
          right: 0,
          top: stacked ? H * 0.42 : H * 0.62,
          bottom: 0,
          overflow: 'hidden',
          maskImage: stacked ? 'linear-gradient(90deg, transparent, black 30%, black 70%, transparent)' : 'linear-gradient(90deg, transparent, black 45%)',
          WebkitMaskImage: stacked ? 'linear-gradient(90deg, transparent, black 30%, black 70%, transparent)' : 'linear-gradient(90deg, transparent, black 45%)',
        }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / 9) * 100}%`, height: Math.max(2, (9 - i) * H * 0.0035), background: p.accent, opacity: 0.1 + i * 0.012 }} />
        ))}
      </div>

      <Console p={p} x={cardX} y={cardY} w={cardW} compact={compact} />

      {/* Floating deploy chip, anchored to the card's right edge */}
      {!strip && (
        <div
          style={{
            position: 'absolute',
            right: W - (cardX + cardW) - cardW * 0.04,
            top: stacked ? cardY + cardW * 0.98 : cardY - cardW * 0.1,
            display: 'flex',
            alignItems: 'center',
            gap: cardW * 0.02,
            padding: `${cardW * 0.018}px ${cardW * 0.035}px`,
            borderRadius: cardW,
            background: dark ? p.background : p.textColor,
            border: `1px solid ${hexA(p.pop, 0.8)}`,
            fontFamily: FONTS.pressstart,
            fontSize: Math.max(8, Math.round(cardW * 0.022)),
            color: dark ? p.textColor : p.background,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 ${cardW * 0.05}px ${hexA(p.pop, 0.35)}`,
          }}
        >
          <span style={{ width: cardW * 0.018, height: cardW * 0.018, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${cardW * 0.03}px ${p.pop}` }} />
          LIVE IN PROD · FRI 17:42
        </div>
      )}

      {/* Copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: copyTop, textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'flex-start' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small, objectFit: 'contain' }} />}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: small * 0.6,
            fontFamily: FONTS.pressstart,
            fontSize: Math.max(10, Math.round(small * 0.62)),
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: dark ? p.accent : p.textColor,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: small * 0.5, height: small * 0.5, background: p.pop, boxShadow: `0 0 ${small * 0.6}px ${p.pop}` }} />
          {p.eyebrow}
        </span>
        <div
          style={{
            ...arcade(dark ? p.accent : p.textColor, dark ? shade(p.accent, -0.6) : p.accent, p.accent2, head, p.headlineFont),
            fontSize: head,
            lineHeight: isNabla ? 1.0 : 0.95,
            marginTop: small * 0.8,
            whiteSpace: strip ? 'nowrap' : undefined,
          }}
        >
          {p.headline}
        </div>
        {!strip && p.body && (
          <div style={{ fontSize: Math.max(12, small * 0.8), lineHeight: 1.5, opacity: 0.82, marginTop: small * 0.9, maxWidth: colW * 0.92, textTransform: 'uppercase' }}>{p.body}</div>
        )}
        {(p.cta || p.price) && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: stacked ? 'center' : 'flex-start', gap: small * 0.9, marginTop: small * (strip ? 0.8 : 1.3) }}>
            {p.cta && <Pill h={small * 2.3} on={p.accent} knob={dark ? p.background : p.textColor} label={p.cta} labelColor={dark ? p.background : p.textColor} />}
            {!strip && p.price && (
              <span style={{ fontFamily: FONTS.pressstart, fontSize: Math.max(10, Math.round(small * 0.56)), lineHeight: 1.8, letterSpacing: '0.04em', color: hexA(p.textColor, 0.75), maxWidth: colW * 0.55 }}>{p.price}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
