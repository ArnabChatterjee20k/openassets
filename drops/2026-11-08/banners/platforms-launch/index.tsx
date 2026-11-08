import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, gradientText, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: '31 Platforms Launch',
  description:
    'Launch banner for Lanternfish: a couture Bodoni headline beside a sonar "specimen plate" where 31 photophore dots (one per ad platform) light up around the agent, with live platform chips.',
  tags: ['launch', 'hero', 'social', 'ads', 'platforms', 'deep sea'],
};

export const schema = z.object({
  eyebrow: text().default('Lanternfish · Live on 31 platforms'),
  headline: text('Headline line 1').default('One brief.'),
  headline2: text('Headline line 2 (italic)').default('Every channel lit.'),
  body: textarea().default('Write it once. Lanternfish launches, paces and rebalances your spend across Meta, Google, TikTok, LinkedIn, Reddit, CTV and 25 more, around the clock.'),
  cta: text('Button (empty to hide)').default('Start your 14-day trial'),
  chip1: text('Chip 1').default('TikTok · ROAS 4.2×'),
  chip2: text('Chip 2').default('CTV · pacing 98%'),
  chip3: text('Chip 3').default('Meta · 12 ads live'),
  caption: text('Plate caption').default('Fig. 31: one agent, thirty-one lights'),
  lit: text('Platforms lit (0–31)').default('31'),
  font: font('Headline font').default('bodoni'),
  background: color().default('#021B26'),
  surface: color().default('#06303F'),
  accent: color('Photophores').default('#2EF2C4'),
  accent2: color('Sonar').default('#1B7FA6'),
  pop: color('Spark').default('#FF7A59'),
  textColor: color('Text').default('#E6FFFA'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  gold: { background: '#0D0D0F', surface: '#1C1C20', accent: '#E8D9B5', accent2: '#C9A45C', pop: '#C9A45C', textColor: '#F3EDE2', headline2: 'Every channel, tailored.' },
  ultraviolet: { background: '#12001F', surface: '#24003D', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', textColor: '#FBEFFF', font: 'instrument' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', accent: '#2F6F8F', accent2: '#A7C4D4', pop: '#E4572E', textColor: '#17242E', eyebrow: 'Lanternfish · Public beta' },
  rollout: { lit: '19', headline: 'Day three.', headline2: '19 of 31 lit.', chip1: 'Reddit · onboarding', cta: 'Watch it live', caption: 'Fig. 19: rollout in progress' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Rings of the plate and how many photophores sit on each (6 + 10 + 15 = 31). */
const RINGS = [
  { k: 0.42, n: 6, off: 0.3 },
  { k: 0.68, n: 10, off: 0.05 },
  { k: 0.94, n: 15, off: 0.17 },
];

/** Tiny lanternfish silhouette with a flank row of photophores, centred at (0, 0), length ~2 units. */
function Fish({ s, p }: { s: number; p: P }) {
  const dark = isDark(p.background);
  const body = dark ? p.textColor : p.textColor;
  return (
    <g transform={`scale(${s})`}>
      <path d="M-1.05 0 L-1.45 -0.42 Q-1.32 0 -1.45 0.42 Z" fill={body} opacity={0.9} />
      <path d="M-1.1 0 C-0.8 -0.5 0.3 -0.62 0.82 -0.28 C1.06 -0.12 1.06 0.12 0.82 0.28 C0.3 0.62 -0.8 0.5 -1.1 0 Z" fill={body} />
      <path d="M-0.35 -0.47 Q-0.15 -0.8 0.18 -0.52 Z" fill={body} opacity={0.85} />
      <circle cx={0.58} cy={-0.08} r={0.16} fill={p.background} />
      <circle cx={0.62} cy={-0.08} r={0.08} fill={p.accent} />
      {[0.5, 0.25, 0, -0.25, -0.5, -0.72].map((x, i) => (
        <circle key={i} cx={x} cy={0.22 + Math.abs(x) * 0.05 - (x < -0.4 ? 0.06 : 0)} r={0.055} fill={p.accent} />
      ))}
      <circle cx={0.98} cy={-0.18} r={0.06} fill={p.pop} />
    </g>
  );
}

function Plate({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: P }) {
  const dark = isDark(p.background);
  const lit = Math.max(0, Math.min(31, parseInt(p.lit, 10) || 0));
  const ring = hexA(p.accent2, dark ? 0.55 : 0.7);
  let idx = 0;
  const dots = RINGS.flatMap((g) =>
    Array.from({ length: g.n }, (_, i) => {
      const a = (i / g.n + g.off) * Math.PI * 2 - Math.PI / 2;
      const id = idx++;
      return { x: cx + Math.cos(a) * r * g.k, y: cy + Math.sin(a) * r * g.k, on: id < lit, id };
    }),
  );
  const dotR = Math.max(2.2, r * 0.026);
  return (
    <>
      <div style={{ position: 'absolute', left: cx - r * 1.5, top: cy - r * 1.5, width: r * 3, height: r * 3, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent2, dark ? 0.32 : 0.22)} 0%, transparent 62%)` }} />
      {/* the sonar ping: a soft conic sweep */}
      <div
        style={{
          position: 'absolute',
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: `conic-gradient(from 300deg, ${hexA(p.accent, 0)} 0deg, ${hexA(p.accent, dark ? 0.22 : 0.3)} 58deg, transparent 60deg)`,
        }}
      />
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        <defs>
          <radialGradient id="pp-glow">
            <stop offset="0" stopColor={p.accent} stopOpacity="0.85" />
            <stop offset="1" stopColor={p.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* specimen-plate rings: hairlines, one dashed */}
        {[0.42, 0.68, 0.94, 1.08].map((k, i) => (
          <circle key={k} cx={cx} cy={cy} r={r * k} fill="none" stroke={ring} strokeWidth={i === 3 ? 0.8 : 1.1} strokeDasharray={i === 3 ? '1 5' : undefined} />
        ))}
        {/* a ping ring that's just left the fish */}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke={p.accent} strokeWidth={Math.max(1.2, r * 0.008)} opacity={0.5} />
        {/* plate ticks every 30° */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={cx + Math.cos(a) * r * 1.03} y1={cy + Math.sin(a) * r * 1.03} x2={cx + Math.cos(a) * r * 1.13} y2={cy + Math.sin(a) * r * 1.13} stroke={ring} strokeWidth={1} />;
        })}
        {dots.map((d) =>
          d.on ? (
            <g key={d.id}>
              <circle cx={d.x} cy={d.y} r={dotR * (3.2 + rand(d.id * 2.3) * 1.6)} fill="url(#pp-glow)" opacity={0.55} />
              <circle cx={d.x} cy={d.y} r={dotR} fill={d.id === 7 ? p.pop : p.accent} />
              <circle cx={d.x - dotR * 0.3} cy={d.y - dotR * 0.3} r={dotR * 0.35} fill="#ffffff" opacity={0.7} />
            </g>
          ) : (
            <circle key={d.id} cx={d.x} cy={d.y} r={dotR * 0.85} fill="none" stroke={ring} strokeWidth={1} />
          ),
        )}
        <g transform={`translate(${cx} ${cy})`}>
          <Fish s={r * 0.2} p={p} />
        </g>
      </svg>
    </>
  );
}

/** Glass data chip. Pass `right` (distance from the right edge) to anchor it by its right side. */
function Chip({ x, right, y, size, label, p, hot }: { x?: number; right?: number; y: number; size: number; label: string; p: P; hot?: boolean }) {
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
        padding: `${size * 0.6}px ${size * 1.05}px`,
        borderRadius: 999,
        fontFamily: FONTS.familjen,
        fontWeight: 500,
        fontSize: size,
        whiteSpace: 'nowrap',
        color: p.textColor,
        background: dark ? hexA(p.surface, 0.72) : 'rgba(255,255,255,0.72)',
        border: `1px solid ${hexA(p.accent2, dark ? 0.5 : 0.35)}`,
        boxShadow: `0 ${size}px ${size * 3}px rgba(0,0,0,${dark ? 0.35 : 0.08}), inset 0 1px 0 rgba(255,255,255,${dark ? 0.1 : 0.8})`,
        backdropFilter: 'blur(14px)',
      }}
    >
      <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: hot ? p.pop : p.accent, boxShadow: `0 0 ${size * 0.8}px ${hot ? p.pop : p.accent}` }} />
      {label}
    </div>
  );
}

export default function PlatformsLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.52 : 0.5);
  const longest = Math.max(p.headline.length, p.headline2.length, 8);
  // Bodoni is narrow (~0.42em per char), so the width cap can be generous.
  const head = Math.min(stacked ? Math.min(W * 0.088, H * 0.088) : H * (strip ? 0.2 : 0.15), (colW / longest) * 2.25);
  const small = Math.max(head * (strip ? 0.24 : 0.28), 14);

  const r = stacked ? Math.min(W, H) * 0.215 : Math.min(H * (strip ? 0.38 : 0.34), W * 0.2);
  const cx = stacked ? W / 2 : W - pad - r * (strip ? 1.5 : 1.22);
  const cy = stacked ? H * 0.275 : H / 2;
  const isItalicFace = p.font === 'bodoni' || p.font === 'instrument' || p.font === 'dmserif';

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.06 : 0.1, size: Math.round(Math.min(W, H) / 22), color: dark ? '230,255,250' : '23,36,46' }}
        lift={dark ? hexA(p.surface, 0.9) : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: cx, y: cy, size: r * 4.2, color: hexA(p.accent2, dark ? 0.4 : 0.25), opacity: 0.9 },
          { x: stacked ? W * 0.15 : W * 0.12, y: H * 1.05, size: Math.max(W, H) * 0.8, color: hexA(p.accent, dark ? 0.12 : 0.12), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.55 : 0.08}
      />

      <Plate cx={cx} cy={cy} r={r} p={p} />

      {/* chips: right-anchored ones can't overflow the edge */}
      {!strip && <Chip right={Math.max(pad * 0.5, W - (cx + r * 1.12))} y={cy - r * 1.02} size={small * 0.88} label={p.chip1} p={p} />}
      <Chip right={Math.max(pad * 0.4, W - (cx + r * (strip ? 1.35 : 1.25)))} y={cy + r * (strip ? 0.5 : 0.55)} size={small * 0.88} label={p.chip2} p={p} />
      {!strip && <Chip x={Math.max(stacked ? pad * 0.5 : colW + pad * 1.2, cx - r * 1.32)} y={cy + r * 0.05} size={small * 0.88} label={p.chip3} p={p} hot />}
      {!strip && !stacked && (
        <div
          style={{
            position: 'absolute',
            left: cx - r * 1.2,
            width: r * 2.4,
            top: cy + r * 1.2,
            textAlign: 'center',
            fontFamily: FONTS.italiana,
            fontSize: small * 0.78,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            opacity: 0.7,
            whiteSpace: 'nowrap',
          }}
        >
          {p.caption}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.555, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: stacked ? 'center' : 'flex-start',
            gap: small * 0.6,
            fontFamily: FONTS.italiana,
            fontSize: Math.min(small * 1.08, (colW * 0.95) / Math.max(1, p.eyebrow.length * 0.88)),
            letterSpacing: '0.22em',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            color: dark ? p.accent : p.textColor,
          }}
        >
          <span style={{ width: small * 0.42, height: small * 0.42, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${small}px ${p.pop}`, flex: 'none' }} />
          {p.eyebrow}
        </div>
        <div style={{ fontFamily: FONTS[p.font], fontWeight: 400, fontSize: head, lineHeight: 0.98, letterSpacing: '-0.03em', marginTop: small * 0.8 }}>
          <div style={{ whiteSpace: 'nowrap' }}>{p.headline}</div>
          <div
            style={{
              whiteSpace: 'nowrap',
              fontStyle: isItalicFace ? 'italic' : 'normal',
              ...gradientText(`linear-gradient(160deg, ${p.textColor} 10%, ${dark ? p.accent : p.accent} 95%)`, head),
            }}
          >
            {p.headline2}
          </div>
        </div>
        {!strip && <div style={{ fontSize: small * 1.0, lineHeight: 1.5, opacity: 0.8, marginTop: small * 0.1, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.5 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.62}px ${small * 1.3}px`,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: small * 0.92,
                color: dark ? p.background : '#F7FBFC',
                background: dark ? p.accent : p.textColor,
                boxShadow: `0 ${small * 0.5}px ${small * 2}px ${hexA(p.accent, 0.35)}`,
                whiteSpace: 'nowrap',
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
