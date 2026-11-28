import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Production Parts Launch',
  description:
    'Launch banner for Sprue rapid injection molding: a juicy 70s headline beside a sprue tree of fresh lime parts in front of a triple-stripe sunrise, with a live quote card and lead-time chips.',
  tags: ['hero', 'launch', 'social', 'manufacturing', 'plastics', '70s'],
};

export const schema = z.object({
  eyebrow: text().default('Now molding · Fremont, CA'),
  headline: text().default('Real plastic parts in'),
  highlight: text('Highlighted words').default('5 days.'),
  body: textarea().default('Upload a STEP file, get a price in 60 seconds, and hold end-use ABS, PC, PA12 or TPU parts next week.'),
  cta: text('Button (empty to hide)').default('Get an instant quote'),
  quoteSpec: text('Quote card spec').default('PA12 · 2,500 pcs'),
  quotePrice: text('Quote card price').default('$0.42'),
  quoteUnit: text('Quote card unit').default('/ part · ships Dec 3'),
  chip1: text('Chip 1').default('Quote in 60 sec'),
  chip2: text('Chip 2').default('Tool in 72 h'),
  font: font('Headline font').default('shrikhand'),
  background: color().default('#0E1A14'),
  surface: color().default('#18291F'),
  textColor: color('Text').default('#EAF2DC'),
  accent: color('Part / accent').default('#B5E550'),
  accent2: color('Stripe 2').default('#4E8A5B'),
  pop: color('Stripe 3 / pop').default('#FF9F43'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', textColor: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F' },
  'mid-century': { background: '#F4E9D8', surface: '#E6D3B3', textColor: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', font: 'fraunces' },
  cherry: { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#F7B32B', accent2: '#E3173E', pop: '#F5C6AA', headline: 'Bridge-to-production in', highlight: '10 days.' },
  minimal: { chip1: '', chip2: '', eyebrow: 'Sprue', cta: '' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Glossy molded-plastic fill: light top-left, body colour, darker bottom edge. */
function Plastic({ id, c }: { id: string; c: string }) {
  return (
    <linearGradient id={id} x1="0.2" y1="0" x2="0.7" y2="1">
      <stop offset="0" stopColor={mixHex(c, '#ffffff', 0.45)} />
      <stop offset="0.45" stopColor={c} />
      <stop offset="1" stopColor={mixHex(c, '#000000', 0.28)} />
    </linearGradient>
  );
}

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

function gearPath(cx: number, cy: number, R: number, r: number, n = 8) {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = (Math.PI * 2) / n;
    for (const [da, rad] of [[-0.5, r], [-0.22, r], [-0.14, R], [0.14, R], [0.22, r]] as const) {
      const ang = a + da * s;
      out.push(`${(cx + Math.cos(ang) * rad).toFixed(1)},${(cy + Math.sin(ang) * rad).toFixed(1)}`);
    }
  }
  return `M${out.join(' L')} Z`;
}

/** Hero visual in a 600×600 box: triple-stripe sunrise behind a sprue tree of fresh parts. */
function SprueHero({ p, size, x, y }: { p: P; size: number; x: number; y: number }) {
  const ink = isDark(p.background) ? '#0B140F' : mixHex(p.textColor, p.background, 0.1);
  const runner = mixHex(p.accent, p.background, 0.35);
  const stroke = { stroke: ink, strokeWidth: 4, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 600 600" width={size} height={size} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible' }}>
      <defs>
        <Plastic id="pl-a" c={p.accent} />
        <Plastic id="pl-p" c={p.pop} />
        <Plastic id="pl-r" c={runner} />
        <clipPath id="sun-clip">
          <rect x="-200" y="-200" width="1000" height="770" />
        </clipPath>
        <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* 70s triple-stripe sunrise */}
      <g clipPath="url(#sun-clip)" fill="none" strokeLinecap="butt">
        <circle cx="300" cy="570" r="300" stroke={p.accent} strokeWidth="44" />
        <circle cx="300" cy="570" r="252" stroke={p.accent2} strokeWidth="44" />
        <circle cx="300" cy="570" r="204" stroke={p.pop} strokeWidth="44" />
      </g>
      <g filter="url(#hero-shadow)">
        {/* runner frame + central runners */}
        <rect x="96" y="118" width="408" height="372" rx="44" fill="none" stroke={ink} strokeWidth="26" />
        <rect x="96" y="118" width="408" height="372" rx="44" fill="none" stroke="url(#pl-r)" strokeWidth="18" />
        <rect x="290" y="118" width="20" height="372" fill="url(#pl-r)" {...stroke} />
        <rect x="96" y="294" width="408" height="20" fill="url(#pl-r)" {...stroke} />
        {/* sprue cone at the top where the resin entered */}
        <path d="M282 118 L318 118 L310 70 L290 70 Z" fill="url(#pl-r)" {...stroke} />
        {/* gates */}
        {[[262, 206, 30, 12], [310, 206, 26, 12], [262, 398, 34, 12], [310, 398, 30, 12]].map(([gx, gy, w, h], i) => (
          <rect key={i} x={gx - (gx < 300 ? 0 : 0)} y={gy} width={w} height={h} fill="url(#pl-r)" {...stroke} strokeWidth={3} />
        ))}
        {/* parts: gear, ring, star knob, clip */}
        <path d={gearPath(196, 212, 74, 58)} fill="url(#pl-a)" {...stroke} />
        <circle cx="196" cy="212" r="20" fill={p.background} {...stroke} />
        <circle cx="404" cy="212" r="64" fill="url(#pl-p)" {...stroke} />
        <circle cx="404" cy="212" r="28" fill={p.background} {...stroke} />
        <circle cx="196" cy="404" r="62" fill="url(#pl-a)" {...stroke} />
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <circle key={i} cx={196 + Math.cos(a) * 62} cy={404 + Math.sin(a) * 62} r="9" fill={p.accent} />;
        })}
        <circle cx="196" cy="404" r="30" fill={mixHex(p.accent, '#000000', 0.15)} {...stroke} strokeWidth={3} />
        <rect x="346" y="354" width="122" height="102" rx="22" fill="url(#pl-a)" {...stroke} />
        <rect x="372" y="388" width="70" height="34" rx="17" fill={p.background} {...stroke} strokeWidth={3} />
        {/* gloss highlights */}
        <g fill="#ffffff" opacity="0.55">
          <ellipse cx="166" cy="180" rx="22" ry="9" transform="rotate(-35 166 180)" />
          <ellipse cx="376" cy="174" rx="20" ry="8" transform="rotate(-35 376 174)" />
          <ellipse cx="166" cy="372" rx="20" ry="8" transform="rotate(-35 166 372)" />
          <rect x="360" y="364" width="46" height="9" rx="4.5" />
        </g>
      </g>
      {/* fresh-off-the-line sparkles */}
      {[[540, 96, 22], [66, 520, 16], [520, 520, 12]].map(([sx, sy, s], i) => (
        <path key={i} d={`M${sx} ${sy - s} Q${sx} ${sy} ${sx + s} ${sy} Q${sx} ${sy} ${sx} ${sy + s} Q${sx} ${sy} ${sx - s} ${sy} Q${sx} ${sy} ${sx} ${sy - s} Z`} fill={i === 0 ? p.pop : p.textColor} opacity={i === 0 ? 1 : 0.7} />
      ))}
    </svg>
  );
}

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
        gap: size * 0.55,
        padding: `${size * 0.6}px ${size * 1.05}px`,
        borderRadius: 999,
        fontFamily: FONTS.outfit,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        color: dark ? p.textColor : p.textColor,
        background: dark ? hexA(p.surface, 0.92) : hexA('#FFFFFF', 0.85),
        border: `2px solid ${dark ? hexA(p.accent, 0.35) : hexA(p.textColor, 0.15)}`,
        boxShadow: `0 ${size * 0.4}px 0 ${dark ? '#050B08' : hexA(p.textColor, 0.85)}`,
      }}
    >
      <span style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${size * 0.7}px ${p.pop}` }} />
      {label}
    </div>
  );
}

export default function ProductionPartsLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.56 : 0.5);
  const head = Math.min(stacked ? W * 0.082 : H * (strip ? 0.16 : 0.105), colW * 0.12);
  const small = Math.max(head * 0.3, 13);

  const heroSize = stacked ? Math.min(W, H) * 0.5 : strip ? H * 1.05 : Math.min(H * 0.86, W * 0.42);
  const hx = stacked ? W / 2 : W - pad - heroSize * (strip ? 0.62 : 0.5);
  // Wide layouts sit the sunrise on the bottom edge like a horizon.
  const hy = stacked ? H * 0.28 : H - heroSize * 0.45;

  const quoteScale = small * 0.95;
  const showQuote = !strip && p.quotePrice;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.fraunces }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.06 : 0.1, size: Math.round(H / 24), color: dark ? '234,242,220' : '28,43,26' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: hx, y: hy, size: heroSize * 1.8, color: hexA(p.accent, dark ? 0.3 : 0.2), opacity: 0.9 },
          { x: stacked ? W * 0.1 : W * 0.12, y: H * 1.05, size: Math.max(W, H) * 0.7, color: hexA(p.accent2, dark ? 0.35 : 0.2), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.5 : 0.08}
      />

      <SprueHero p={p} size={heroSize} x={hx} y={hy} />

      {showQuote && (
        <div
          style={{
            position: 'absolute',
            left: stacked ? hx - heroSize * 0.78 : hx - heroSize * 0.6,
            top: hy + heroSize * (stacked ? 0.26 : 0.12),
            padding: `${quoteScale * 0.8}px ${quoteScale * 1.1}px`,
            borderRadius: quoteScale * 1.1,
            background: dark ? p.surface : '#FFFFFF',
            border: `2px solid ${dark ? hexA(p.textColor, 0.12) : hexA(p.textColor, 0.15)}`,
            boxShadow: `${quoteScale * 0.35}px ${quoteScale * 0.45}px 0 ${dark ? '#050B08' : p.textColor}`,
            rotate: '-4deg',
          }}
        >
          <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: quoteScale * 0.72, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>{p.quoteSpec}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: quoteScale * 0.4, marginTop: quoteScale * 0.15 }}>
            <span style={{ ...displayFace('shrikhand'), fontSize: quoteScale * 2.4, lineHeight: 1.05, color: p.pop }}>{p.quotePrice}</span>
            <span style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: quoteScale * 0.8, opacity: 0.8, whiteSpace: 'nowrap' }}>{p.quoteUnit}</span>
          </div>
        </div>
      )}
      {!strip && <Chip right={Math.max(pad * 0.6, W - (hx + heroSize * 0.55))} y={hy - heroSize * 0.48} size={small * 0.82} label={p.chip1} p={p} />}
      {!stacked && !strip && <Chip right={Math.max(pad * 0.6, W - (hx + heroSize * 0.56))} y={hy + heroSize * (strip ? 0.22 : 0.3)} size={small * 0.82} label={p.chip2} p={p} />}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.585, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ display: stacked ? 'flex' : 'block', justifyContent: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              color: dark ? p.accent : p.textColor,
              fontFamily: FONTS.outfit,
              fontWeight: 800,
              fontSize: small * 0.78,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            {/* triple stripe tag */}
            <span style={{ display: 'inline-flex', gap: small * 0.14 }}>
              {[p.accent, p.accent2, p.pop].map((c) => (
                <span key={c} style={{ width: small * 0.22, height: small * 0.9, borderRadius: 99, background: c, rotate: '18deg' }} />
              ))}
            </span>
            {p.eyebrow}
          </span>
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontStyle: p.font === 'fraunces' ? 'italic' : undefined,
            fontSize: head,
            lineHeight: 1.04,
            letterSpacing: '-0.02em',
            marginTop: small * 0.7,
            color: p.textColor,
          }}
        >
          {p.headline}{' '}
          <span style={{ color: dark ? p.accent : p.accent, textShadow: `${head * 0.04}px ${head * 0.05}px 0 ${dark ? '#050B08' : hexA(p.textColor, 0.9)}` }}>{p.highlight}</span>
        </div>
        {!strip && (
          <div style={{ fontSize: small * 1.08, fontWeight: 300, lineHeight: 1.45, opacity: 0.85, marginTop: small * 0.7, maxWidth: colW * 0.88, marginInline: stacked ? 'auto' : undefined }}>
            {p.body}
          </div>
        )}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.3}px`,
                borderRadius: 999,
                fontFamily: FONTS.outfit,
                fontWeight: 800,
                fontSize: small * 0.92,
                color: dark ? p.background : '#FFFDF5',
                background: dark ? p.accent : p.textColor,
                boxShadow: `0 ${small * 0.32}px 0 ${dark ? mixHex(p.accent, '#000000', 0.5) : p.accent}`,
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
