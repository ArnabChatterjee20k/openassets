import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, gradientText, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Forecast Radar',
  description: 'Hero banner with a live-looking weather radar, glowing bolt and glass data chips beside a bold headline.',
  tags: ['hero', 'social', 'weather', 'radar', 'product'],
};

export const schema = z.object({
  eyebrow: text().default('Storm season · Live'),
  headline: text().default('Electric skies ahead.'),
  body: textarea().default('Hyperlocal forecasts that strike before the storm does.'),
  cta: text('Button (empty to hide)').default('Get the app'),
  chip1: text('Chip 1').default('92% chance of lightning'),
  chip2: text('Chip 2').default('Gusts 48 km/h · NE'),
  font: font('Headline font').default('grotesk'),
  background: color().default('#060818'),
  accent: color().default('#FFD34E'),
  accent2: color('Radar').default('#5B5FFF'),
  textColor: color('Text').default('#F5F7FF'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  daylight: { background: '#EEF1FF', textColor: '#0B1026', accent: '#3B3FD8', accent2: '#8B9CFF' },
  ember: { background: '#120706', accent: '#FF8A3D', accent2: '#FF3D6E', textColor: '#FFF2EA', headline: 'Heatwave incoming.' },
  editorial: { font: 'serif', headline: 'The calm before.', accent: '#E8D3A6', accent2: '#7A7FA8', cta: '' },
  minimal: { chip1: '', chip2: '', cta: '', eyebrow: 'Forecast' },
};

type P = z.infer<typeof schema> & BannerSize;

function Radar({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: P }) {
  const dark = isDark(p.background);
  const ring = hexA(p.accent2, dark ? 0.45 : 0.6);
  const blips = Array.from({ length: 9 }, (_, i) => {
    const a = rand(i * 3.1) * Math.PI * 2;
    const d = (0.25 + rand(i * 7.7) * 0.7) * r;
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, s: 0.35 + rand(i * 1.9) * 0.65 };
  });
  return (
    <>
      {/* glow under the radar */}
      <div style={{ position: 'absolute', left: cx - r * 1.6, top: cy - r * 1.6, width: r * 3.2, height: r * 3.2, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent2, 0.35)} 0%, transparent 60%)` }} />
      {/* sweep wedge */}
      <div
        style={{
          position: 'absolute',
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: `conic-gradient(from 20deg, ${hexA(p.accent2, 0.55)} 0deg, ${hexA(p.accent2, 0)} 70deg, transparent 360deg)`,
        }}
      />
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <circle key={k} cx={cx} cy={cy} r={r * k} fill="none" stroke={ring} strokeWidth={k === 1 ? 2 : 1} strokeDasharray={k === 1 ? undefined : '2 6'} />
        ))}
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={ring} strokeWidth={1} opacity={0.6} />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={ring} strokeWidth={1} opacity={0.6} />
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i / 72) * Math.PI * 2;
          const l = i % 6 === 0 ? r * 0.06 : r * 0.025;
          return (
            <line key={i} x1={cx + Math.cos(a) * r} y1={cy + Math.sin(a) * r} x2={cx + Math.cos(a) * (r + l)} y2={cy + Math.sin(a) * (r + l)} stroke={ring} strokeWidth={1} />
          );
        })}
        {blips.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r={r * 0.06 * b.s} fill={hexA(p.accent, 0.18)} />
            <circle cx={b.x} cy={b.y} r={r * 0.018 * b.s + 1.5} fill={p.accent} />
          </g>
        ))}
      </svg>
      {/* bolt in the eye of the storm */}
      <svg
        viewBox="0 0 24 24"
        style={{ position: 'absolute', left: cx - r * 0.3, top: cy - r * 0.32, width: r * 0.6, height: r * 0.6, overflow: 'visible', filter: `drop-shadow(0 0 ${r * 0.06}px ${p.accent}) drop-shadow(0 0 ${r * 0.2}px ${hexA(p.accent, 0.6)})` }}
      >
        <defs>
          <linearGradient id="bolt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor={p.accent} />
            <stop offset="1" stopColor={p.accent} />
          </linearGradient>
        </defs>
        <path d="M13.5 1.5 4.5 13.5h6.2L9.3 22.5l10.2-13h-6.4z" fill="url(#bolt)" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={0.3} strokeLinejoin="round" />
      </svg>
    </>
  );
}

/** Glass data chip. Pass `right` (distance from the right edge) instead of `x` to anchor it to its right side. */
function Chip({ x, right, y, size, label, p }: { x?: number; right?: number; y: number; size: number; label: string; p: P }) {
  if (!label) return null;
  const dark = isDark(p.background);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        right,
        top: y,
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.6,
        padding: `${size * 0.7}px ${size * 1.1}px`,
        borderRadius: size * 0.8,
        fontFamily: FONTS.mono,
        fontSize: size,
        whiteSpace: 'nowrap',
        color: p.textColor,
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(11,16,38,0.1)'}`,
        boxShadow: `0 ${size}px ${size * 3}px rgba(0,0,0,${dark ? 0.35 : 0.08}), inset 0 1px 0 rgba(255,255,255,${dark ? 0.12 : 0.8})`,
        backdropFilter: 'blur(14px)',
      }}
    >
      <span style={{ width: size * 0.55, height: size * 0.55, borderRadius: '50%', background: p.accent, boxShadow: `0 0 ${size * 0.8}px ${p.accent}` }} />
      {label}
    </div>
  );
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

export default function ForecastRadar(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3; // square/portrait: radar on top, copy below
  const strip = W / H > 3; // LinkedIn-style ultra-wide
  // Type scale: driven by the short side, capped by available column width.
  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.5 : 0.52);
  const head = Math.min(stacked ? W * 0.085 : H * (strip ? 0.15 : 0.115), colW * 0.13);
  const small = Math.max(head * 0.3, 13);

  const r = stacked ? Math.min(W, H) * 0.24 : Math.min(H * (strip ? 0.36 : 0.32), W * 0.2);
  const cx = stacked ? W / 2 : W - pad - r * (strip ? 1.6 : 1.25);
  const cy = stacked ? H * 0.31 : H / 2;
  const dark = isDark(p.background);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.inter }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.07 : 0.12, size: Math.round(H / 22), color: dark ? '255,255,255' : '11,16,38' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: cx, y: cy, size: r * 4, color: hexA(p.accent2, dark ? 0.35 : 0.25), opacity: 0.9 },
          { x: stacked ? W * 0.2 : W * 0.15, y: H, size: Math.max(W, H) * 0.8, color: hexA(p.accent, dark ? 0.12 : 0.15), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.55 : 0.08}
      />

      <Radar cx={cx} cy={cy} r={r} p={p} />
      {!strip && <Chip right={W - (cx + r * 1.05)} y={cy - r * 0.95} size={small * 0.95} label={p.chip1} p={p} />}
      <Chip x={stacked ? cx - r * 1.25 : cx - r * 1.05} y={cy + r * (strip ? 0.3 : 0.62)} size={small * 0.95} label={p.chip2} p={p} />

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.6, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ display: stacked ? 'flex' : 'block', justifyContent: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              padding: `${small * 0.35}px ${small * 0.8}px`,
              borderRadius: 999,
              border: `1px solid ${hexA(p.accent, 0.45)}`,
              background: hexA(p.accent, 0.08),
              color: p.accent,
              fontFamily: FONTS.mono,
              fontSize: small * 0.85,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: small * 0.45, height: small * 0.45, borderRadius: '50%', background: p.accent, boxShadow: `0 0 ${small}px ${p.accent}` }} />
            {p.eyebrow}
          </span>
        </div>
        <div
          style={{
            fontFamily: FONTS[p.font],
            fontWeight: 700,
            fontSize: head,
            lineHeight: 1.02,
            letterSpacing: p.font === 'serif' ? '-0.01em' : '-0.035em',
            marginTop: small * 0.9,
            ...gradientText(`linear-gradient(170deg, ${p.textColor} 40%, ${hexA(p.accent2, 1)} 140%)`, head),
          }}
        >
          {p.headline}
        </div>
        {!strip && <div style={{ fontSize: small * 1.15, lineHeight: 1.45, opacity: 0.78, marginTop: small * 0.6, maxWidth: colW * 0.9, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.8 : 1.4) }}>
            <span
              style={{
                padding: `${small * 0.65}px ${small * 1.3}px`,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: small * 0.95,
                color: dark ? p.background : '#ffffff',
                background: dark ? p.accent : p.textColor,
                boxShadow: `0 ${small * 0.5}px ${small * 2}px ${hexA(p.accent, 0.35)}`,
              }}
            >
              {p.cta} →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
