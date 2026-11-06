import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, shade } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Now Boarding',
  description:
    'Launch banner for an AI ad agent: an airplane-window view of a striped 70s sunset with a tow plane carrying your platform list, boarding-pass stat chips and a bold serif headline.',
  tags: ['launch', 'hero', 'social', 'ads', 'plane', 'sunset'],
};

export const schema = z.object({
  eyebrow: text().default('Now boarding · 34 platforms'),
  headline: text('Headline line 1').default('Brief it once.'),
  headline2: text('Headline line 2 (accent)').default('Fly it everywhere.'),
  body: textarea().default('Towline turns one brief into live campaigns on Meta, Google, TikTok and 31 more, then moves budget to what works while you sleep.'),
  cta: text('Button (empty to hide)').default('Start a flight'),
  url: text('URL').default('towline.ai'),
  towText: text('Tow banner text').default('META · TIKTOK · GOOGLE · +31'),
  chip1Label: text('Chip 1 label').default('Rebalanced overnight'),
  chip1: text('Chip 1 value').default('$12.4k → winners'),
  chip2Label: text('Chip 2 label').default('Blended CPA'),
  chip2: text('Chip 2 value').default('−31%'),
  font: font('Headline font').default('gloock'),
  background: color().default('#FFEDE1'),
  surface: color('Card / cloud').default('#FFD3C2'),
  ink: color('Text').default('#3D0E2A'),
  accent: color('Accent (sun, banner)').default('#FF4F6D'),
  accent2: color('Sky + sea').default('#7B2CBF'),
  pop: color('Spark').default('#FFB627'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { background: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', accent: '#FF8E5E', accent2: '#E5487A', pop: '#FFD27F' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', font: 'shrikhand', headline2: 'Ship it everywhere.' },
  'mid-century': { background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', font: 'fraunces', eyebrow: 'Flight TL-034 · Gate: all of them' },
  lilac: { background: '#E9E3F5', surface: '#D6CCEC', ink: '#231942', accent: '#5E4AE3', accent2: '#F49CBB', pop: '#2EC4B6', font: 'syne', headline: 'One brief.', headline2: '34 platforms.' },
  minimal: { chip1: '', chip2: '', cta: '', body: '', eyebrow: 'Towline' },
};

type P = z.infer<typeof schema> & BannerSize;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const isDark = (hex: string) => lum(hex) < 140;
/** Of two candidate colors, the one that contrasts more with `bg`. */
const onColor = (bg: string, a: string, b: string) => (Math.abs(lum(a) - lum(bg)) > Math.abs(lum(b) - lum(bg)) ? a : b);

/** Flat poster-style prop plane facing right, nose at x=100, centreline y=0. */
function PlaneShape({ p }: { p: P }) {
  const body = isDark(p.background) ? shade(p.surface, 0.75) : shade(p.background, 0.55);
  const ink = { stroke: p.ink, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  return (
    <g>
      <path d="M2,-4 L-3,-25 C-3,-27 -1,-28 2,-27 L10,-25 L26,-6 Z" fill={p.accent} {...ink} />
      <ellipse cx={11} cy={-2} rx={12} ry={2.6} fill={body} {...ink} />
      <path d="M0,-3 C14,-8 40,-12 70,-12 C86,-12 96,-8 100,-2 L100,4 C96,8 88,10 70,10 L28,9 C14,8 4,5 0,1 Z" fill={body} {...ink} />
      <path d="M6,2.2 L97,2.2" stroke={p.accent} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M62,-11 C67,-20 80,-20 86,-10 Z" fill={shade(p.accent2, 0.55)} {...ink} />
      {[34, 43, 52].map((x) => (
        <circle key={x} cx={x} cy={-4} r={2.3} fill={p.accent2} />
      ))}
      <line x1={52} y1={-12} x2={45} y2={7} stroke={p.ink} strokeWidth={1.4} />
      <ellipse cx={58} cy={-14} rx={20} ry={3.4} fill={body} {...ink} />
      <path d="M92,-7 C97,-6 100,-3 101.5,0 C100,3 97,6 92,7 Z" fill={p.accent} {...ink} />
      <line x1={62} y1={9} x2={64} y2={16} stroke={p.ink} strokeWidth={1.6} />
      <circle cx={64} cy={17.5} r={3.6} fill={p.ink} />
      <ellipse cx={104} cy={0} rx={2.4} ry={19} fill={p.ink} opacity={0.14} />
      <line x1={102} y1={-16} x2={105} y2={16} stroke={p.ink} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={103} cy={0} r={2.6} fill={p.ink} />
    </g>
  );
}

/** Rippling tow banner with a swallowtail, text on its centre line. */
function TowBanner({ x0, y, BL, BH, label, p, id }: { x0: number; y: number; BL: number; BH: number; label: string; p: P; id: string }) {
  const N = 48;
  const A = BH * 0.14;
  const wv = (d: number) => A * Math.sin(d * Math.PI * 2.4 + 0.6) * (0.25 + 0.75 * d);
  const notch = BH * 0.32;
  const top: string[] = [];
  const bot: string[] = [];
  const mid: string[] = [];
  for (let i = 0; i <= N; i++) {
    const d = i / N;
    const x = x0 + d * BL;
    const w = wv(d);
    top.push(`${x.toFixed(1)},${(y - BH / 2 + w).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(y + BH / 2 + w * 1.1).toFixed(1)}`);
    mid.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${(y + w * 1.05).toFixed(1)}`);
  }
  const endMid = `${(x0 + BL - notch).toFixed(1)},${(y + wv(1)).toFixed(1)}`;
  const outline = `M${top.join(' L')} L${endMid} L${bot.reverse().join(' L')} Z`;
  const fs = BH * 0.44;
  return (
    <g>
      <path d={outline} transform={`translate(${BH * 0.12} ${BH * 0.14})`} fill={p.ink} opacity={0.9} />
      <path d={outline} fill={p.accent} stroke={p.ink} strokeWidth={Math.max(1.2, BH * 0.03)} strokeLinejoin="round" />
      {/* a thin pop hem along the top */}
      <path d={`M${top.slice(0, N - 2).join(' L')}`} transform={`translate(0 ${BH * 0.12})`} stroke={p.pop} strokeWidth={BH * 0.05} fill="none" opacity={0.95} />
      <path id={`${id}-mid`} d={mid.join(' ')} fill="none" />
      <text fontFamily={FONTS.spacemono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.12} fill={onColor(p.accent, p.ink, isDark(p.background) ? p.background : shade(p.background, 0.6))} dy={fs * 0.36}>
        <textPath href={`#${id}-mid`} startOffset={BH * 0.55}>
          {label}
        </textPath>
      </text>
      <line x1={x0} y1={y - BH * 0.62} x2={x0} y2={y + BH * 0.62} stroke={p.ink} strokeWidth={Math.max(2, BH * 0.07)} strokeLinecap="round" />
    </g>
  );
}

function Cloud({ x, y, s, p }: { x: number; y: number; s: number; p: P }) {
  const fill = isDark(p.background) ? shade(p.surface, 0.2) : shade(p.surface, 0.35);
  return (
    <g opacity={0.95}>
      <path
        d={`M${x - s},${y} C${x - s},${y - s * 0.45} ${x - s * 0.55},${y - s * 0.6} ${x - s * 0.3},${y - s * 0.42} C${x - s * 0.2},${y - s * 0.9} ${x + s * 0.4},${y - s * 0.95} ${x + s * 0.5},${y - s * 0.45} C${x + s * 0.8},${y - s * 0.6} ${x + s * 1.1},${y - s * 0.3} ${x + s},${y} Z`}
        fill={fill}
      />
      <path d={`M${x - s * 0.7},${y} L${x + s * 0.9},${y}`} stroke={hexA(p.ink, 0.12)} strokeWidth={s * 0.05} strokeLinecap="round" />
    </g>
  );
}

function Gull({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return <path d={`M${x - s},${y} Q${x - s / 2},${y - s * 0.7} ${x},${y} Q${x + s / 2},${y - s * 0.7} ${x + s},${y}`} stroke={c} strokeWidth={Math.max(1.4, s * 0.16)} fill="none" strokeLinecap="round" />;
}

/** Boarding-pass stat chip with a perforated stub. */
function Chip({ label, value, size, p, style }: { label: string; value: string; size: number; p: P; style: CSSProperties }) {
  if (!value) return null;
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'stretch',
        background: isDark(p.background) ? p.surface : shade(p.background, 0.5),
        border: `${Math.max(1.5, size * 0.07)}px solid ${p.ink}`,
        borderRadius: size * 0.45,
        boxShadow: `${size * 0.28}px ${size * 0.28}px 0 ${p.ink}`,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        color: p.ink,
        ...style,
      }}
    >
      <div style={{ width: size * 0.55, background: p.accent, borderRight: `${Math.max(1.5, size * 0.07)}px dashed ${p.ink}` }} />
      <div style={{ padding: `${size * 0.45}px ${size * 0.9}px ${size * 0.5}px ${size * 0.7}px` }}>
        <div style={{ fontFamily: FONTS.spacemono, fontSize: size * 0.66, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>{label}</div>
        <div style={{ fontFamily: FONTS.syne, fontWeight: 800, fontSize: size * 1.25, lineHeight: 1.1, marginTop: size * 0.12 }}>{value}</div>
      </div>
    </div>
  );
}

export default function NowBoarding(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.07 : Math.max(W * 0.05, H * 0.09);

  // The airplane window holding the sky.
  let pw: number, ph: number, px: number, py: number, rx: number;
  if (stacked) {
    pw = W - pad * 2;
    ph = H * 0.44;
    px = pad;
    py = pad;
    rx = Math.min(pw, ph) * 0.32;
  } else if (strip) {
    ph = H * 0.8;
    pw = W * 0.36;
    px = W - pad - pw;
    py = (H - ph) / 2;
    rx = ph * 0.46;
  } else {
    ph = H * 0.8;
    pw = Math.min(ph * 0.82, W * 0.38);
    px = W - pad - pw;
    py = (H - ph) / 2;
    rx = pw * 0.46;
  }
  const S = Math.min(pw, ph);
  const sunR = S * (strip ? 0.36 : 0.3);
  const sunX = px + pw * (strip ? 0.62 : 0.52);
  const horizon = py + ph * (strip ? 0.74 : 0.7);
  const sunY = horizon - sunR * 0.55;

  // Tow plane + banner, sized so the whole tow fits from the nose to the canvas edge.
  const n = p.towText.length;
  const noseX = stacked ? px + pw * 0.06 : strip ? px - pw * 0.08 : px - pw * 0.14;
  const avail = W - noseX - pad * 0.3;
  // Space Mono advance ≈ 0.6em + 0.12em tracking at 0.44·BH → ~0.32·BH per char.
  const BH = Math.min(S * 0.13, avail / (3.4 + 0.5 + n * 0.335 + 1.5));
  const Lp = BH * 3.4;
  const BL = (n * 0.335 + 1.4) * BH;
  const planeY = py + ph * (strip ? 0.3 : 0.28);
  const tail = noseX + Lp;
  const bx0 = tail + BH * 0.5;

  const sky = `${p.accent2}`;
  const gid = `nb-${W}x${H}`;

  // Type scale
  const colW = stacked ? W - pad * 2 : noseX - pad - (strip ? W * 0.02 : W * 0.03);
  const head = stacked ? Math.min(W * 0.088, H * 0.06) : Math.min(H * (strip ? 0.17 : 0.105), colW * 0.125);
  const small = Math.max(head * 0.3, 13);
  const chipSize = Math.max(small * 0.82, 12);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.1, size: Math.round(Math.min(W, H) / 22), color: dark ? '255,233,214' : '61,14,42' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: sunX, y: sunY, size: S * 2.4, color: hexA(p.accent, dark ? 0.4 : 0.22), opacity: 1 },
          { x: stacked ? W * 0.1 : W * 0.08, y: H * 1.05, size: Math.max(W, H) * 0.7, color: hexA(p.pop, dark ? 0.2 : 0.3), opacity: 0.9 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.5 : 0.06}
      />

      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${gid}-sky`} gradientUnits="userSpaceOnUse" x1={0} y1={py} x2={0} y2={horizon}>
            <stop offset="0" stopColor={sky} />
            <stop offset="0.5" stopColor={p.accent} />
            <stop offset="1" stopColor={p.pop} />
          </linearGradient>
          <linearGradient id={`${gid}-sea`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={shade(p.accent2, -0.15)} />
            <stop offset="1" stopColor={shade(p.accent2, -0.55)} />
          </linearGradient>
          <clipPath id={`${gid}-win`}>
            <rect x={px} y={py} width={pw} height={ph} rx={rx} />
          </clipPath>
        </defs>

        {/* hard offset shadow + window rim */}
        <rect x={px + S * 0.035} y={py + S * 0.04} width={pw} height={ph} rx={rx} fill={p.ink} />
        <g clipPath={`url(#${gid}-win)`}>
          <rect x={px} y={py} width={pw} height={ph} fill={`url(#${gid}-sky)`} />
          {/* striped sun: gaps widen toward the horizon */}
          <circle cx={sunX} cy={sunY} r={sunR} fill={p.pop} />
          <circle cx={sunX} cy={sunY} r={sunR * 0.82} fill={shade(p.pop, 0.25)} opacity={0.5} />
          {[0, 1, 2, 3, 4].map((i) => {
            const yy = sunY - sunR * 0.05 + i * sunR * 0.17;
            const th = sunR * (0.03 + i * 0.022);
            return <rect key={i} x={sunX - sunR * 1.1} y={yy} width={sunR * 2.2} height={th} fill={`url(#${gid}-sky)`} />;
          })}
          <Cloud x={px + pw * 0.22} y={py + ph * 0.52} s={S * 0.16} p={p} />
          <Cloud x={px + pw * 0.86} y={py + ph * 0.6} s={S * 0.11} p={p} />
          {/* sea with sun glitter */}
          <rect x={px} y={horizon} width={pw} height={py + ph - horizon} fill={`url(#${gid}-sea)`} />
          {[0, 1, 2, 3, 4].map((i) => {
            const w = sunR * (1.3 - i * 0.22);
            return <rect key={i} x={sunX - w / 2 + (i % 2 ? sunR * 0.06 : -sunR * 0.04)} y={horizon + S * 0.025 + i * S * 0.028} width={w} height={S * 0.011} rx={S * 0.006} fill={p.pop} opacity={0.85 - i * 0.12} />;
          })}
          <Gull x={px + pw * 0.72} y={py + ph * 0.5} s={S * 0.025} c={p.ink} />
          <Gull x={px + pw * 0.8} y={py + ph * 0.45} s={S * 0.018} c={p.ink} />
          {/* window glare */}
          <path d={`M${px + pw * 0.12},${py + ph * 0.35} L${px + pw * 0.3},${py + ph * 0.12} L${px + pw * 0.38},${py + ph * 0.12} L${px + pw * 0.2},${py + ph * 0.35} Z`} fill="#ffffff" opacity={0.12} />
        </g>
        <rect x={px} y={py} width={pw} height={ph} rx={rx} fill="none" stroke={dark ? shade(p.surface, 0.25) : shade(p.background, 0.6)} strokeWidth={S * 0.045} />
        <rect x={px + S * 0.022} y={py + S * 0.022} width={pw - S * 0.044} height={ph - S * 0.044} rx={rx - S * 0.022} fill="none" stroke={p.ink} strokeWidth={Math.max(1.5, S * 0.006)} />
        <rect x={px} y={py} width={pw} height={ph} rx={rx} fill="none" stroke={p.ink} strokeWidth={Math.max(1.5, S * 0.008)} />

        {/* the tow: plane breaks out of the window, banner trails off to the right */}
        {p.towText && (
          <>
            <path d={`M${tail - BH * 0.05},${planeY - BH * 0.05} L${bx0},${planeY}`} stroke={p.ink} strokeWidth={Math.max(1.2, BH * 0.035)} />
            <TowBanner x0={bx0} y={planeY + BH * 0.1} BL={BL} BH={BH} label={p.towText} p={p} id={gid} />
          </>
        )}
        <g transform={`translate(${noseX + Lp} ${planeY}) scale(${-Lp / 100} ${Lp / 100})`}>
          <PlaneShape p={p} />
        </g>
      </svg>

      {!strip && <Chip label={p.chip1Label} value={p.chip1} size={chipSize} p={p} style={stacked ? { left: px + pw * 0.04, top: py + ph - chipSize * 2.1 } : { left: px - pw * 0.16, top: py + ph * 0.66 }} />}
      <Chip
        label={p.chip2Label}
        value={p.chip2}
        size={chipSize}
        p={p}
        style={stacked ? { right: W - (px + pw * 0.96), top: py + ph - chipSize * 2.1 } : strip ? { left: px - pw * 0.1, top: py + ph - chipSize * 3.2 } : { right: W - (px + pw * 1.04), top: py + ph * 0.84 }}
      />

      {/* Copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: py + ph + pad * 0.75 } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: 'flex-start' }} />}
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              padding: `${small * 0.32}px ${small * 0.8}px`,
              borderRadius: 999,
              border: `${Math.max(1.5, small * 0.08)}px solid ${p.ink}`,
              fontFamily: FONTS.spacemono,
              fontWeight: 700,
              fontSize: small * 0.78,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop, border: `1.5px solid ${p.ink}` }} />
            {p.eyebrow}
          </span>
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            marginTop: small * (strip ? 0.6 : 0.9),
          }}
        >
          <div style={{ color: p.ink }}>{p.headline}</div>
          <div style={{ color: p.accent }}>{p.headline2}</div>
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.05, lineHeight: 1.45, opacity: 0.85, marginTop: small * 0.9, maxWidth: colW * 0.92 }}>{p.body}</div>}
        {(p.cta || p.url) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small * 1.1, marginTop: small * (strip ? 0.8 : 1.4) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.62}px ${small * 1.3}px`,
                  borderRadius: 999,
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
            )}
            {p.url && !strip && <span style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.82, letterSpacing: '0.08em' }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
