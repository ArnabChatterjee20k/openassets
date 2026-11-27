import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Pilot Launch Banner',
  description: 'Launch banner for Loupe line pilots: a bold headline beside a machined gear under a big loupe ring that magnifies a circled 38 μm burr, with yield and speed chips.',
  tags: ['hero', 'social', 'launch', 'inspection', 'manufacturing'],
};

export const schema = z.object({
  eyebrow: text().default('Now booking Q1 line pilots'),
  headline: text().default('Catch 40 μm flaws before assembly.'),
  body: textarea().default('Loupe photographs every part on your line and flags burrs, pits and scratches in 0.4 s. No fixtures, no rule-writing.'),
  cta: text('Button (empty to hide)').default('Book a line pilot'),
  note: text('Handwritten callout').default('38 μm burr!'),
  chip1: text('Chip 1').default('99.7% first-pass yield'),
  chip2: text('Chip 2').default('0.4 s per part'),
  font: font('Headline font').default('fredoka'),
  background: color().default('#E9E3F5'),
  surface: color('Part / panels').default('#D6CCEC'),
  textColor: color('Text').default('#231942'),
  accent: color('Loupe').default('#5E4AE3'),
  accent2: color('Defect').default('#F49CBB'),
  pop: color('Pass').default('#2EC4B6'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  blueprint: { background: '#0F3B8C', surface: '#3A69C4', textColor: '#EAF2FF', accent: '#FFFFFF', accent2: '#FFDD00', pop: '#7FB2FF', font: 'outfit' },
  frost: { background: '#E9EEF1', surface: '#C5D3DC', textColor: '#17242E', accent: '#2F6F8F', accent2: '#E4572E', pop: '#2EC4B6', eyebrow: 'Aerospace fasteners · AS9100' },
  'mid-century': { background: '#F4E9D8', surface: '#E6C98F', textColor: '#2E2A24', accent: '#2C7873', accent2: '#D96C3D', pop: '#2C7873', font: 'fraunces', headline: 'No burr leaves the building.' },
  minimal: { chip1: '', chip2: '', note: '', body: '', eyebrow: 'Loupe for precision parts' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Spur-gear outline with a bore and lightening holes (evenodd). */
function gearPath(cx: number, cy: number, r: number, teeth = 16) {
  const rRoot = r * 0.84;
  const step = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const ps: [number, number][] = [
      [rRoot, a],
      [r, a + step * 0.16],
      [r, a + step * 0.42],
      [rRoot, a + step * 0.58],
    ];
    ps.forEach(([rr, aa], k) => {
      d += `${i === 0 && k === 0 ? 'M' : 'L'}${(cx + Math.cos(aa) * rr).toFixed(2)},${(cy + Math.sin(aa) * rr).toFixed(2)}`;
    });
  }
  d += 'Z';
  const circ = (x: number, y: number, rr: number) => `M${x - rr},${y}a${rr},${rr} 0 1,0 ${rr * 2},0a${rr},${rr} 0 1,0 ${-rr * 2},0Z`;
  d += circ(cx, cy, r * 0.2);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.6;
    d += circ(cx + Math.cos(a) * r * 0.52, cy + Math.sin(a) * r * 0.52, r * 0.12);
  }
  return d;
}

function Hero({ cx, cy, r, p, small, compact }: { cx: number; cy: number; r: number; p: P; small: number; compact: boolean }) {
  const dark = isDark(p.background);
  // Loupe sits over the upper-right teeth; the flaw is on a tooth flank there.
  // The burr sits on the tip land of tooth 2 (16 teeth); the loupe is centred on it.
  const step = (Math.PI * 2) / 16;
  const fa = 2 * step - Math.PI / 2 + step * 0.29;
  const fx = cx + Math.cos(fa) * r * 0.99;
  const fy = cy + Math.sin(fa) * r * 0.99;
  const R = r * 0.6;
  const lx = fx;
  const ly = fy;
  const mag = 3;
  const sw = Math.max(1.5, r * 0.012);
  const gear = gearPath(cx, cy, r);
  const partFill = dark ? hexA('#ffffff', 0.92) : '#FBF9FF';
  // Magnified flaw position inside the loupe.
  const mx = lx + (fx - lx) * mag;
  const my = ly + (fy - ly) * mag;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
      <defs>
        <radialGradient id="pl-part" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={partFill} />
          <stop offset="1" stopColor={p.surface} />
        </radialGradient>
        <radialGradient id="pl-lens" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor={dark ? '#DDE6FF' : '#F1ECFF'} stopOpacity="0.95" />
        </radialGradient>
        <clipPath id="pl-clip">
          <circle cx={lx} cy={ly} r={R} />
        </clipPath>
        <filter id="pl-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r * 0.06} />
        </filter>
      </defs>
      {/* floor shadow and the part */}
      <ellipse cx={cx + r * 0.08} cy={cy + r * 1.08} rx={r * 0.9} ry={r * 0.12} fill={hexA(p.textColor, 0.18)} filter="url(#pl-soft)" />
      <path d={gear} transform={`translate(${r * 0.06} ${r * 0.07})`} fill={hexA(p.textColor, dark ? 0.35 : 0.9)} fillRule="evenodd" />
      <path d={gear} fill="url(#pl-part)" fillRule="evenodd" stroke={p.textColor} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={r * 0.3} fill="none" stroke={p.textColor} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r * 0.25} fill="none" stroke={p.pop} strokeWidth={sw * 2.2} />
      {/* the tiny flaw at true scale */}
      <circle cx={fx} cy={fy} r={Math.max(2, r * 0.012)} fill={p.accent2} />

      {/* loupe: offset shadow, lens with the magnified part, ring with ticks */}
      <circle cx={lx + r * 0.05} cy={ly + r * 0.06} r={R + r * 0.06} fill={p.textColor} opacity={dark ? 0.35 : 0.9} />
      <circle cx={lx} cy={ly} r={R} fill="url(#pl-lens)" />
      <g clipPath="url(#pl-clip)">
        <g transform={`translate(${lx} ${ly}) scale(${mag}) translate(${-lx} ${-ly})`}>
          <path d={gear} fill={hexA(p.surface, 0.9)} fillRule="evenodd" stroke={p.textColor} strokeWidth={sw / mag * 1.6} strokeLinejoin="round" />
          {/* machining marks */}
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx={cx} cy={cy} r={r * (0.86 + i * 0.012)} fill="none" stroke={hexA(p.textColor, 0.12)} strokeWidth={sw / mag} />
          ))}
        </g>
        {/* the burr: a little ragged notch on the edge, circled */}
        <path
          d={`M${mx - r * 0.05},${my + r * 0.005} l${r * 0.02},${-r * 0.03} l${r * 0.018},${r * 0.018} l${r * 0.02},${-r * 0.035} l${r * 0.016},${r * 0.04} l${r * 0.012},${-r * 0.012} l${r * 0.01},${r * 0.025}Z`}
          fill={p.accent2}
          stroke={p.textColor}
          strokeWidth={sw * 0.6}
          strokeLinejoin="round"
          transform={`rotate(${(fa * 180) / Math.PI + 90} ${mx} ${my})`}
        />
        <circle cx={mx} cy={my} r={r * 0.13} fill="none" stroke={p.accent2} strokeWidth={sw * 2.6} strokeDasharray={`${r * 0.06} ${r * 0.03}`} />
        <line x1={lx - R} y1={ly} x2={lx + R} y2={ly} stroke={hexA(p.accent, 0.35)} strokeWidth={sw * 0.8} />
        <line x1={lx} y1={ly - R} x2={lx} y2={ly + R} stroke={hexA(p.accent, 0.35)} strokeWidth={sw * 0.8} />
        <ellipse cx={lx - R * 0.35} cy={ly - R * 0.45} rx={R * 0.32} ry={R * 0.14} transform={`rotate(-30 ${lx - R * 0.35} ${ly - R * 0.45})`} fill="#ffffff" opacity={0.6} />
      </g>
      <circle cx={lx} cy={ly} r={R} fill="none" stroke={p.accent} strokeWidth={r * 0.09} />
      <circle cx={lx} cy={ly} r={R + r * 0.045} fill="none" stroke={p.textColor} strokeWidth={sw} />
      <circle cx={lx} cy={ly} r={R - r * 0.045} fill="none" stroke={p.textColor} strokeWidth={sw} />
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        const l = i % 6 === 0 ? r * 0.05 : r * 0.022;
        const r0 = R + r * 0.065;
        return <line key={i} x1={lx + Math.cos(a) * r0} y1={ly + Math.sin(a) * r0} x2={lx + Math.cos(a) * (r0 + l)} y2={ly + Math.sin(a) * (r0 + l)} stroke={p.textColor} strokeWidth={sw * 0.8} />;
      })}

      {/* handwritten callout with leader line */}
      {p.note && !compact && (
        <>
          <path
            d={`M${mx + r * 0.12},${my - r * 0.08} Q${lx + R * 1.05},${ly - R * 1.05} ${lx + R * 0.55},${ly - R * 1.32}`}
            fill="none"
            stroke={p.accent2}
            strokeWidth={sw * 1.8}
            strokeLinecap="round"
          />
          <text x={lx + R * 0.3} y={ly - R * 1.4} fontFamily={FONTS.caveat} fontWeight={700} fontSize={small * 1.9} fill={p.textColor} transform={`rotate(-6 ${lx + R * 0.3} ${ly - R * 1.4})`}>
            {p.note}
          </text>
        </>
      )}
    </svg>
  );
}

/** Pill chip. Pass `right` to anchor by its right edge so long labels can't overflow. */
function Chip({ x, right, y, size, label, dot, p }: { x?: number; right?: number; y: number; size: number; label: string; dot: string; p: P }) {
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
        padding: `${size * 0.6}px ${size * 1}px`,
        borderRadius: 999,
        fontFamily: FONTS.outfit,
        fontWeight: 500,
        fontSize: size,
        whiteSpace: 'nowrap',
        color: p.textColor,
        background: dark ? hexA('#ffffff', 0.12) : hexA('#ffffff', 0.85),
        border: `${Math.max(1.5, size * 0.09)}px solid ${p.textColor}`,
        boxShadow: `${size * 0.22}px ${size * 0.26}px 0 ${p.textColor}`,
      }}
    >
      <span style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: dot, boxShadow: `0 0 0 ${size * 0.14}px ${hexA(dot, 0.25)}` }} />
      {label}
    </div>
  );
}

export default function PilotLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.5 : 0.5);
  const head = Math.min(stacked ? W * 0.082 : H * (strip ? 0.15 : 0.105), colW * (strip ? 0.075 : 0.13));
  const small = Math.max(head * 0.3, 13);

  const r = stacked ? Math.min(W, H) * 0.18 : Math.min(H * (strip ? 0.33 : 0.27), W * 0.17);
  const cx = stacked ? W * 0.44 : W - pad - r * (strip ? 1.9 : 1.75);
  const cy = stacked ? H * 0.33 : H * (strip ? 0.56 : 0.54);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.1 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,255,255' : '35,25,66' }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: cx + r * 0.6, y: cy - r * 0.4, size: r * 4.2, color: hexA(p.accent2, 0.55), opacity: 0.6 },
          { x: stacked ? W * 0.9 : W * 0.08, y: H * 1.05, size: Math.max(W, H) * 0.8, color: hexA(p.accent, 0.35), opacity: 0.5 },
        ]}
        grain={0.04}
        vignette={dark ? 0.45 : 0.06}
      />
      {/* lavender floor panel behind the part, like a product sweep */}
      <div
        style={{
          position: 'absolute',
          left: stacked ? 0 : cx - r * 2.1,
          right: 0,
          top: stacked ? cy + r * 0.7 : cy + r * 0.75,
          height: stacked ? r * 0.9 : H,
          background: `linear-gradient(180deg, ${hexA(p.surface, dark ? 0.35 : 0.85)}, ${hexA(p.surface, 0)})`,
          borderTopLeftRadius: stacked ? 0 : r * 0.6,
        }}
      />

      <Hero cx={cx} cy={cy} r={r} p={p} small={small} compact={strip} />
      {!strip && <Chip right={W - (cx + r * 1.95)} y={cy + r * 0.62} size={small * 0.95} label={p.chip1} dot={p.pop} p={p} />}
      <Chip
        x={cx - r * 1.45}
        y={cy - r * 1.15}
        size={small * 0.95}
        label={strip ? '' : p.chip2}
        dot={p.accent}
        p={p}
      />

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.58, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        {p.eyebrow && (
          <div style={{ display: stacked ? 'flex' : 'block', justifyContent: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: small * 0.5,
                padding: `${small * 0.3}px ${small * 0.85}px`,
                borderRadius: 999,
                background: p.textColor,
                color: p.background,
                fontFamily: FONTS.outfit,
                fontWeight: 500,
                fontSize: small * 0.82,
                letterSpacing: '0.02em',
              }}
            >
              <span style={{ width: small * 0.45, height: small * 0.45, borderRadius: '50%', background: p.pop }} />
              {p.eyebrow}
            </span>
          </div>
        )}
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 1.0,
            letterSpacing: '-0.025em',
            marginTop: small * 0.8,
            color: p.textColor,
          }}
        >
          {p.headline}
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.1, lineHeight: 1.42, opacity: 0.82, marginTop: small * 0.7, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.8 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.62}px ${small * 1.3}px`,
                borderRadius: 999,
                fontWeight: 500,
                fontSize: small * 0.98,
                color: dark ? p.background : '#FBF9FF',
                background: p.accent,
                border: `${Math.max(1.5, small * 0.09)}px solid ${p.textColor}`,
                boxShadow: `${small * 0.22}px ${small * 0.26}px 0 ${p.textColor}`,
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
