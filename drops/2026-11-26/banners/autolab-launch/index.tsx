import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Autolab Launch',
  description: 'Launch banner for Ternary Autolab-1: a giant enamel element tile with atomic orbits, a live run ticker with an XRD trace, and a condensed civic-signage headline.',
  tags: ['hero', 'launch', 'materials', 'defense', 'social'],
};

export const schema = z.object({
  eyebrow: text().default('Autolab-1 · Now running'),
  headline: text().default('Critical materials, discovered by machine.'),
  highlight: text('Highlighted word').default('discovered'),
  body: textarea().default('Ternary’s autonomous lab runs 1,200 experiments a day to make gallium, germanium and magnet alloys at home.'),
  cta: text('Button (empty to hide)').default('Partner with Ternary'),
  number: text('Atomic number').default('31'),
  symbol: text('Element symbol').default('Ga'),
  element: text('Element name').default('Gallium'),
  mass: text('Atomic mass').default('69.723'),
  ticker: text('Run ticker').default('RUN 4,812 · Ga₂O₃'),
  status: text('Run status').default('PASS'),
  chip1: text('Chip 1').default('1,200 experiments / day'),
  chip2: text('Chip 2').default('Made in Youngstown, OH'),
  font: font('Headline font').default('shoulders'),
  background: color().default('#F4E9D8'),
  surface: color('Panel').default('#E6D3B3'),
  ink: color('Ink').default('#2E2A24'),
  accent: color('Accent').default('#D96C3D'),
  tile: color('Element tile').default('#2C7873'),
  pop: color('Spark').default('#E9B44C'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  germanium: { number: '32', symbol: 'Ge', element: 'Germanium', mass: '72.630', ticker: 'RUN 5,104 · GeO₂', highlight: 'machine', tile: '#D96C3D', accent: '#2C7873' },
  bauhaus: { background: '#F2EBDD', surface: '#E4D9C4', ink: '#111111', accent: '#D9381E', tile: '#1D4E9E', pop: '#F2B90F', number: '60', symbol: 'Nd', element: 'Neodymium', mass: '144.24', ticker: 'RUN 7,330 · Nd₂Fe₁₄B', headline: 'Magnets for every motor we field.', highlight: 'magnets' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', tile: '#EAF2FF', pop: '#FFDD00' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', accent: '#C9A45C', tile: '#C9A45C', pop: '#E8D9B5', number: '74', symbol: 'W', element: 'Tungsten', mass: '183.84', ticker: 'RUN 2,961 · WC-Co', cta: 'Read the Series A note' },
  minimal: { chip1: '', chip2: '', body: '', eyebrow: 'Ternary Materials' },
};

type P = z.infer<typeof schema> & BannerSize;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255;
};

/** Four-point mid-century star. */
function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const k = r * 0.22;
  return <path d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r}Z`} fill={fill} />;
}

/** The hero: enamel element tile, orbits, sparks, run ticker. All sizes from the tile size S. */
function Hero({ cx, cy, S, p, compact }: { cx: number; cy: number; S: number; p: P; compact: boolean }) {
  // Pick whichever of ink / background contrasts best with the tile.
  const tileText = Math.abs(lum(p.tile) - lum(p.ink)) > Math.abs(lum(p.tile) - lum(p.background)) ? p.ink : p.background;
  const sh = S * 0.045;
  const orbit = { fill: 'none', stroke: p.accent, strokeWidth: Math.max(2, S * 0.012) };
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        {/* sunburst rays behind the tile */}
        <g opacity={0.5}>
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const a2 = a + Math.PI / 48;
            const R = S * 1.15;
            return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R} L${cx + Math.cos(a2) * R} ${cy + Math.sin(a2) * R}Z`} fill={hexA(p.surface, 1)} />;
          })}
        </g>
        <circle cx={cx} cy={cy} r={S * 0.82} fill={p.background} opacity={0.55} />
        {/* back halves of the orbits */}
        <ellipse cx={cx} cy={cy} rx={S * 1.02} ry={S * 0.34} transform={`rotate(-22 ${cx} ${cy})`} {...orbit} />
        <ellipse cx={cx} cy={cy} rx={S * 1.02} ry={S * 0.34} transform={`rotate(38 ${cx} ${cy})`} {...orbit} stroke={p.ink} strokeOpacity={0.55} strokeDasharray={`${S * 0.02} ${S * 0.03}`} />
      </svg>

      {/* tile: hard offset shadow + enamel face */}
      <div style={{ position: 'absolute', left: cx - S / 2 + sh, top: cy - S / 2 + sh, width: S, height: S, borderRadius: S * 0.08, background: p.ink, rotate: '-4deg' }} />
      <div
        style={{
          position: 'absolute',
          left: cx - S / 2,
          top: cy - S / 2,
          width: S,
          height: S,
          borderRadius: S * 0.08,
          background: `linear-gradient(160deg, ${hexA('#ffffff', 0.16)} 0%, transparent 40%), ${p.tile}`,
          boxShadow: `inset 0 0 0 ${S * 0.018}px ${hexA(tileText, 0.9)}, inset 0 0 0 ${S * 0.03}px ${p.tile}, inset 0 0 0 ${S * 0.036}px ${hexA(tileText, 0.5)}`,
          rotate: '-4deg',
          color: tileText,
        }}
      >
        <div style={{ position: 'absolute', left: S * 0.1, top: S * 0.08, ...displayFace('shoulders'), fontSize: S * 0.17, lineHeight: 1 }}>{p.number}</div>
        <div style={{ position: 'absolute', right: S * 0.1, top: S * 0.11, fontFamily: FONTS.mono, fontSize: S * 0.055, letterSpacing: '0.05em', opacity: 0.85 }}>{p.mass}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: S * 0.2, textAlign: 'center', ...displayFace('shoulders'), fontSize: S * 0.56, lineHeight: 1, letterSpacing: '-0.02em' }}>{p.symbol}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: S * 0.09, textAlign: 'center', fontFamily: FONTS.mono, fontSize: S * 0.062, letterSpacing: '0.32em', textTransform: 'uppercase' }}>{p.element}</div>
      </div>

      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        {/* front arcs of the orbits, with electrons */}
        <path d={`M${cx - S * 1.02} ${cy} A${S * 1.02} ${S * 0.34} 0 0 0 ${cx + S * 1.02} ${cy}`} transform={`rotate(-22 ${cx} ${cy})`} {...orbit} />
        <circle cx={cx + Math.cos((-22 * Math.PI) / 180) * S * 1.02} cy={cy + Math.sin((-22 * Math.PI) / 180) * S * 1.02} r={S * 0.04} fill={p.accent} stroke={p.ink} strokeWidth={S * 0.008} />
        <Star x={cx - S * 0.7} y={cy - S * 0.62} r={S * 0.1} fill={p.pop} />
        <Star x={cx + S * 0.78} y={cy + S * 0.56} r={S * 0.065} fill={p.pop} />
        <Star x={cx + S * 0.62} y={cy - S * 0.78} r={S * 0.04} fill={p.accent} />
      </svg>

      {/* run ticker card */}
      {!compact && (
        <div
          style={{
            position: 'absolute',
            left: cx - S * 0.66,
            top: cy + S * 0.5,
            width: S * 0.82,
            padding: `${S * 0.04}px ${S * 0.05}px`,
            background: p.background,
            border: `${Math.max(2, S * 0.008)}px solid ${p.ink}`,
            borderRadius: S * 0.03,
            boxShadow: `${S * 0.025}px ${S * 0.025}px 0 ${p.ink}`,
            color: p.ink,
            fontFamily: FONTS.mono,
            rotate: '2deg',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: S * 0.045, letterSpacing: '0.06em' }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.ticker}</span>
            <span style={{ background: p.accent, color: lum(p.accent) > 0.6 ? p.ink : p.background, padding: `${S * 0.006}px ${S * 0.02}px`, borderRadius: S * 0.01, fontWeight: 700, marginLeft: S * 0.02 }}>{p.status}</span>
          </div>
          <svg viewBox="0 0 100 26" style={{ width: '100%', height: S * 0.13, marginTop: S * 0.02, display: 'block' }}>
            <line x1="0" y1="25" x2="100" y2="25" stroke={p.ink} strokeWidth="0.6" opacity="0.5" />
            <polyline
              fill="none"
              stroke={p.tile === p.background ? p.accent : p.tile}
              strokeWidth="1.2"
              strokeLinejoin="round"
              points="0,24 10,23.5 16,22 18,8 20,22.5 30,23 38,21 40,3 42,21 52,22.5 60,23 64,14 66,22.8 76,23 82,18 84,23 100,23.5"
            />
          </svg>
          <div style={{ fontSize: S * 0.034, letterSpacing: '0.16em', opacity: 0.75, marginTop: S * 0.01, whiteSpace: 'nowrap' }}>XRD MATCH 98.4%</div>
        </div>
      )}
    </>
  );
}

function Chip({ label, size, p, style }: { label: string; size: number; p: P; style: CSSProperties }) {
  if (!label) return null;
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.5,
        padding: `${size * 0.5}px ${size * 0.9}px`,
        borderRadius: 999,
        background: p.surface,
        border: `${Math.max(1.5, size * 0.08)}px solid ${p.ink}`,
        color: p.ink,
        fontFamily: FONTS.mono,
        fontSize: size,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: p.accent }} />
      {label}
    </div>
  );
}

export default function AutolabLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = lum(p.background) < 0.4;

  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.56 : 0.5);
  const head = stacked ? Math.min(W * 0.1, H * 0.075) : Math.min(H * (strip ? 0.2 : 0.125), colW * 0.125);
  const small = Math.max(head * 0.26, 13);

  const S = stacked ? Math.min(W, H) * 0.3 : strip ? H * 0.62 : Math.min(H * 0.48, W * 0.24);
  const cx = stacked ? W / 2 : W - pad - S * (strip ? 1.05 : 1.08);
  const cy = stacked ? H * 0.3 : H / 2 - (strip ? 0 : S * 0.06);

  const words = p.headline.split(' ');
  const hl = p.highlight.trim().toLowerCase();

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 26), color: dark ? '255,255,255' : '46,42,36' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,250,240,0.7)'}
        glows={[
          { x: cx, y: cy, size: S * 3.4, color: hexA(p.accent, dark ? 0.25 : 0.18), opacity: 0.9 },
          { x: stacked ? W * 0.1 : W * 0.08, y: H * 1.05, size: Math.max(W, H) * 0.7, color: hexA(p.tile, 0.16), opacity: 0.9 },
        ]}
        grain={0.05}
        vignette={dark ? 0.45 : 0.12}
      />

      {/* signage rule along the bottom: civic stripe */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.max(6, H * 0.018), background: p.accent }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(6, H * 0.018), height: Math.max(3, H * 0.008), background: p.tile }} />

      <Hero cx={cx} cy={cy} S={S} p={p} compact={strip} />

      {!strip && (
        <Chip
          label={p.chip1}
          size={small * 0.85}
          p={p}
          style={stacked ? { left: pad, top: cy - S * 0.85 } : { right: pad * 0.6, top: cy - S * 0.88 }}
        />
      )}
      {!strip && (
        <Chip label={p.chip2} size={small * 0.85} p={p} style={stacked ? { right: pad, top: cy - S * 0.85 } : { right: pad * 0.6, top: cy + S * 0.78 }} />
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: H * 0.58, textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.6, fontFamily: FONTS.mono, fontSize: small * 0.78, letterSpacing: '0.28em', textTransform: 'uppercase', color: p.ink }}>
          <span style={{ width: small * 1.6, height: Math.max(2, small * 0.16), background: p.accent }} />
          {p.eyebrow}
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 0.9,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            marginTop: small * 0.7,
            color: p.ink,
          }}
        >
          {words.map((w, i) => (
            <span key={i} style={{ color: hl && w.toLowerCase().replace(/[^a-z0-9]/g, '') === hl.replace(/[^a-z0-9]/g, '') ? p.accent : undefined }}>
              {w}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.05, lineHeight: 1.45, marginTop: small * 0.8, maxWidth: colW * 0.88, opacity: 0.85 }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', marginTop: small * (strip ? 0.7 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.2}px`,
                borderRadius: small * 0.3,
                fontWeight: 800,
                fontSize: small * 0.95,
                color: p.background,
                background: p.ink,
                boxShadow: `${small * 0.22}px ${small * 0.22}px 0 ${p.accent}`,
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
