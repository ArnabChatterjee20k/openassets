import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Case Study: CPA Cut',
  description:
    'Customer-results banner for Plotwell: weekly cost-per-acquisition drawn as an elevation of falling columns on a plan sheet, with a dimension line carrying the drop, a before/after title block and a highlighter on the final week.',
  tags: ['case study', 'results', 'social', 'header', 'blueprint', 'proof'],
};

export const schema = z.object({
  eyebrow: text().default('case study · glowbar skincare'),
  headline: text().default('CPA down 38% in six weeks.'),
  highlight: text('Highlighted words (in headline)').default('38%'),
  body: textarea().default('Glowbar moved nine channels onto one Plotwell plan. The agent cut wasted spend and shifted budget hourly to what converted.'),
  cta: text('Button (empty to hide)').default('Read the case study'),
  metric: text('Metric label').default('cost per acquisition'),
  values: text('Weekly values (comma separated)').default('41.2, 37.8, 33.1, 30.4, 27.2, 25.5'),
  unit: text('Unit prefix').default('$'),
  change: text('Change label').default('−38%'),
  client: text('Client (title block)').default('glowbar · section a–a'),
  font: font('Headline font').default('syne'),
  background: color().default('#0F3B8C'),
  surface: color('Sheet').default('#134AA8'),
  ink: color('Text').default('#EAF2FF'),
  line: color('Linework').default('#7FB2FF'),
  pop: color('Highlighter').default('#FFDD00'),
  logo: image('Client logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  whiteprint: { background: '#F1EEE4', surface: '#E7E2D4', ink: '#173F9A', line: '#173F9A', pop: '#FFDD00' },
  'roas up': {
    eyebrow: 'case study · northpine outdoor',
    headline: 'ROAS up 2.4× before peak season.',
    highlight: '2.4×',
    metric: 'return on ad spend',
    values: '1.6, 1.9, 2.4, 2.9, 3.3, 3.8',
    unit: '',
    change: '+2.4×',
    client: 'northpine · section b–b',
    body: 'One plan across Meta, Google, Pinterest and CTV. Plotwell rebalanced spend 1,008 times in six weeks.',
  },
  bauhaus: { background: '#F2EBDD', surface: '#E4D9C4', ink: '#111111', line: '#1D4E9E', pop: '#F2B90F', font: 'bricolage' },
  'ink & gold': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', line: '#C9A45C', pop: '#E8D9B5', cta: 'See the numbers' },
  'desert dusk': { background: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', line: '#FF8E5E', pop: '#FFD27F', cta: '' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

function Highlighted({ text: t, mark, p }: { text: string; mark: string; p: P }) {
  const i = mark ? t.indexOf(mark) : -1;
  if (i < 0) return <>{t}</>;
  const hl: CSSProperties = {
    color: isDark(p.background) ? p.background : p.ink,
    backgroundImage: `linear-gradient(176deg, transparent 14%, ${p.pop} 14%, ${p.pop} 86%, transparent 86%)`,
    padding: '0 0.08em',
    margin: '0 -0.04em',
    WebkitBoxDecorationBreak: 'clone',
    boxDecorationBreak: 'clone',
  };
  return (
    <>
      {t.slice(0, i)}
      <span style={hl}>{mark}</span>
      {t.slice(i + mark.length)}
    </>
  );
}

const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(v % 1 === 0 ? 0 : 1));

/** The hero: an elevation drawing of weekly columns, 1000 × 700 units. */
function Elevation({ p, crop }: { p: P; crop?: boolean }) {
  const dark = isDark(p.background);
  const ink = p.ink;
  const L = p.line;
  const vals = p.values
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((v) => Number.isFinite(v) && v > 0)
    .slice(0, 8);
  const data = vals.length >= 2 ? vals : [41.2, 25.5];
  const n = data.length;
  const max = Math.max(...data);
  // plot frame
  const x0 = 130;
  const x1 = 790;
  const base = 520;
  const top = 200;
  const slot = (x1 - x0) / n;
  const bw = slot * 0.56;
  const hOf = (v: number) => ((base - top) * v) / max;
  const first = data[0];
  const last = data[n - 1];
  const label = 26;
  const sheetFill = dark ? hexA(p.surface, 0.55) : hexA(p.surface, 0.7);
  // Dimension line sits right of the last column, spanning first → last height.
  const dimX = 935;
  const yFirst = base - hOf(first);
  const yLast = base - hOf(last);

  return (
    <svg viewBox={crop ? '0 130 1000 450' : '0 0 1000 700'} width="100%" height="100%" style={{ overflow: crop ? 'hidden' : 'visible', display: 'block' }}>
      <defs>
        <pattern id="cs-minor" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke={L} strokeOpacity={dark ? 0.16 : 0.12} strokeWidth="1" />
        </pattern>
        <pattern id="cs-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#cs-minor)" />
          <path d="M100 0H0V100" fill="none" stroke={L} strokeOpacity={dark ? 0.3 : 0.22} strokeWidth="1.2" />
        </pattern>
        <pattern id="cs-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="12" stroke={ink} strokeOpacity="0.45" strokeWidth="2" />
        </pattern>
        <filter id="cs-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* sheet */}
      <rect x="6" y="6" width="988" height="688" fill={sheetFill} />
      <rect x="6" y="6" width="988" height="688" fill="url(#cs-major)" />
      <rect x="6" y="6" width="988" height="688" fill="none" stroke={ink} strokeOpacity={0.85} strokeWidth="2.4" />
      <rect x="22" y="22" width="956" height="656" fill="none" stroke={ink} strokeOpacity={0.4} strokeWidth="1" />
      {[
        [22, 22],
        [978, 22],
        [22, 678],
      ].map(([x, y], i) => (
        <g key={i} stroke={ink} strokeOpacity={0.7} strokeWidth="1.4" fill="none">
          <circle cx={x} cy={y} r="10" />
          <line x1={x - 18} y1={y} x2={x + 18} y2={y} />
          <line x1={x} y1={y - 18} x2={x} y2={y + 18} />
        </g>
      ))}

      {/* metric title, top-left in drafting lettering */}
      <text x="60" y="84" fontFamily={FONTS.majormono} fontSize={label} fill={ink}>
        {p.metric.toLowerCase()}
      </text>
      <text x="60" y="118" fontFamily={FONTS.majormono} fontSize={label * 0.72} fill={ink} opacity={0.6}>
        elevation · weekly · scale 1:{Math.round(max)}
      </text>

      {/* level lines from first and last heights (construction) */}
      <line x1={x0 - 30} y1={yFirst} x2={dimX + 12} y2={yFirst} stroke={L} strokeOpacity="0.7" strokeDasharray="3 7" strokeWidth="1.4" />
      <line x1={x0 - 30} y1={yLast} x2={dimX + 12} y2={yLast} stroke={L} strokeOpacity="0.7" strokeDasharray="3 7" strokeWidth="1.4" />

      {/* trend line over the column tops */}
      <polyline
        points={data.map((v, i) => `${x0 + slot * (i + 0.5)},${base - hOf(v) - 18}`).join(' ')}
        fill="none"
        stroke={ink}
        strokeOpacity="0.8"
        strokeWidth="1.6"
        strokeDasharray="10 6"
      />

      {/* columns: drawn as elevations with a hatched section and a cap */}
      {data.map((v, i) => {
        const cx = x0 + slot * (i + 0.5);
        const h = hOf(v);
        const isLast = i === n - 1;
        const y = base - h;
        return (
          <g key={i}>
            {isLast && <rect x={cx - bw / 2 - 14} y={y - 14} width={bw + 28} height={h + 14} fill={p.pop} opacity="0.4" filter="url(#cs-glow)" />}
            <rect x={cx - bw / 2} y={y} width={bw} height={h} fill={isLast ? p.pop : dark ? hexA(p.background, 0.85) : p.surface} stroke={isLast ? p.pop : ink} strokeWidth="2.2" />
            {!isLast && <rect x={cx - bw / 2} y={y} width={bw} height={h} fill="url(#cs-hatch)" />}
            {/* cap moulding */}
            <rect x={cx - bw / 2 - 6} y={y - 8} width={bw + 12} height="8" fill={isLast ? p.pop : ink} opacity={isLast ? 1 : 0.9} />
            {/* node on the trend line */}
            <circle cx={cx} cy={y - 18} r={isLast ? 7 : 4.5} fill={isLast ? p.pop : ink} stroke={isLast ? (dark ? p.background : ink) : 'none'} strokeWidth="2" />
            {/* value */}
            <text x={cx} y={y - 34} textAnchor="middle" fontFamily={FONTS.majormono} fontSize={label * (isLast ? 0.95 : 0.74)} fill={ink} opacity={isLast ? 1 : 0.8}>
              {p.unit}
              {fmt(v)}
            </text>
            {/* week label */}
            <text x={cx} y={base + 38} textAnchor="middle" fontFamily={FONTS.majormono} fontSize={label * 0.78} fill={ink} opacity={0.8}>
              w{i + 1}
            </text>
          </g>
        );
      })}

      {/* ground line */}
      <line x1={x0 - 40} y1={base} x2={x1 + 40} y2={base} stroke={ink} strokeWidth="3" />
      {Array.from({ length: 24 }, (_, i) => (
        <line key={i} x1={x0 - 40 + i * 34} y1={base + 2} x2={x0 - 52 + i * 34} y2={base + 14} stroke={ink} strokeOpacity="0.5" strokeWidth="1.4" />
      ))}

      {/* dimension line carrying the change */}
      <g stroke={ink} strokeWidth="1.8" fill="none">
        <line x1={dimX} y1={yFirst} x2={dimX} y2={yLast} />
        <line x1={dimX - 10} y1={yFirst} x2={dimX + 10} y2={yFirst} />
        <line x1={dimX - 10} y1={yLast} x2={dimX + 10} y2={yLast} />
        <line x1={dimX - 7} y1={yFirst + 7} x2={dimX + 7} y2={yFirst - 7} strokeWidth="2.6" />
        <line x1={dimX - 7} y1={yLast + 7} x2={dimX + 7} y2={yLast - 7} strokeWidth="2.6" />
      </g>
      <g transform={`translate(${dimX - 22} ${(yFirst + yLast) / 2}) rotate(-90)`}>
        <rect x={-p.change.length * 25 - 16} y={-58} width={p.change.length * 50 + 32} height="74" fill={p.pop} transform="rotate(-2)" />
        <text x="0" y="0" textAnchor="middle" fontFamily={FONTS.syne} fontWeight={800} fontSize="60" fill={dark ? p.background : p.ink} letterSpacing="-0.02em">
          {p.change}
        </text>
      </g>

      {crop && <rect x="4" y="132" width="992" height="446" fill="none" stroke={ink} strokeOpacity={0.85} strokeWidth="4" />}
      {/* title block */}
      <g transform="translate(640 572)" fontFamily={FONTS.majormono} fill={ink}>
        <rect width="338" height="106" fill={dark ? p.background : p.surface} stroke={ink} strokeWidth="1.8" />
        <line x1="0" y1="56" x2="338" y2="56" stroke={ink} strokeWidth="1.2" />
        <line x1="169" y1="56" x2="169" y2="106" stroke={ink} strokeWidth="1.2" />
        <text x="16" y="37" fontSize={Math.min(22, 300 / Math.max(1, p.client.length * 0.72))}>
          {p.client.toLowerCase()}
        </text>
        <text x="16" y="90" fontSize="20" opacity="0.85">
          was {p.unit}
          {fmt(first)}
        </text>
        <text x="185" y="90" fontSize="20">
          now {p.unit}
          {fmt(last)}
        </text>
      </g>
    </svg>
  );
}

export default function CaseStudyCpa(p: P) {
  const { width: W, height: H } = p;
  const ar = W / H;
  const stacked = ar < 1.3;
  const strip = ar > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.075 : Math.max(W * 0.05, H * 0.09);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.46 : 0.42);
  const head = stacked ? W * 0.068 : Math.min(H * (strip ? 0.16 : 0.105), colW * 0.13);
  const small = Math.max(head * 0.32, 13);

  let hw: number;
  let hh: number;
  let hx: number;
  let hy: number;
  if (stacked) {
    hh = H * 0.44;
    hw = Math.min(W - pad * 2, hh / 0.7);
    hh = hw * 0.7;
    hx = (W - hw) / 2;
    hy = pad * 0.8;
  } else {
    // The strip shows a cropped, wider slice of the sheet (columns + dimension only).
    const r = strip ? 0.45 : 0.7;
    const maxW = W - pad * 2 - colW - pad * 0.5;
    const maxH = H - pad * (strip ? 0.7 : 1.2);
    hw = Math.min(maxW, maxH / r);
    hh = hw * r;
    hx = W - pad - hw;
    hy = (H - hh) / 2;
  }

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.12 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '127,178,255' : '23,63,154' }}
        lift={dark ? 'rgba(127,178,255,0.12)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: hx + hw * 0.6, y: hy + hh * 0.55, size: Math.max(hw, hh) * 1.4, color: hexA(p.line, dark ? 0.35 : 0.18), opacity: 0.9 },
          { x: stacked ? W * 0.8 : W * 0.1, y: H * 1.05, size: Math.max(W, H) * 0.7, color: hexA(p.pop, dark ? 0.1 : 0.12), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.45 : 0.08}
      />
      <div style={{ position: 'absolute', left: hx, top: hy, width: hw, height: hh, filter: `drop-shadow(0 ${hh * 0.03}px ${hh * 0.06}px rgba(0,0,0,${dark ? 0.35 : 0.12}))` }}>
        <Elevation p={p} crop={strip} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          display: 'flex',
          flexDirection: 'column',
          ...(stacked ? { top: hy + hh + pad * 0.6 } : { top: 0, bottom: 0, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: 'flex-start' }} />}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: small * 0.6,
            fontFamily: FONTS.majormono,
            fontSize: Math.min(small * 0.9, (colW - small * 3.5) / Math.max(1, p.eyebrow.length * 0.78)),
            color: p.ink,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${small}px ${hexA(p.pop, 0.8)}` }} />
          {p.eyebrow.toLowerCase()}
          <span style={{ width: small * 1.6, height: 2, background: p.ink }} />
        </div>
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 1.0, letterSpacing: '-0.04em', color: p.ink, marginTop: small * 0.8 }}>
          <Highlighted text={p.headline} mark={p.highlight} p={p} />
        </div>
        {!strip && p.body && (
          <div style={{ fontFamily: FONTS.bricolage, fontSize: small * 1.08, lineHeight: 1.42, color: p.ink, opacity: 0.86, marginTop: small * 0.9, maxWidth: colW * 0.92 }}>{p.body}</div>
        )}
        {p.cta && (
          <div style={{ display: 'flex', marginTop: small * (strip ? 0.8 : 1.4) }}>
            <span
              style={{
                fontFamily: FONTS.bricolage,
                fontWeight: 800,
                fontSize: small * 0.95,
                padding: `${small * 0.6}px ${small * 1.1}px`,
                color: dark ? p.background : '#F7F5EF',
                background: p.ink,
                boxShadow: `${small * 0.3}px ${small * 0.3}px 0 ${hexA(p.line, 0.6)}`,
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
