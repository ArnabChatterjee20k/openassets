import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Launch Week Hero',
  description:
    'Latch launch-week banner: a magazine-cover headline beside a cyanotype engineering drawing of a laptop whose hinge arc is dimensioned 110° → 0°, ending in a yellow commit dot, with mono commit chips.',
  tags: ['hero', 'social', 'launch', 'developer', 'blueprint'],
};

export const schema = z.object({
  eyebrow: text().default('Launch week · Nov 24–28'),
  headline: text().default("Close the lid. It's committed."),
  emphasis: text('Italic word(s) in the headline').default('committed.'),
  body: textarea().default('Latch stages, commits and pushes your work to a safe branch the second your Mac goes to sleep. Free for solo devs.'),
  cta: text('Button (empty to hide)').default('brew install latch'),
  chip1: text('Chip 1').default('a3f9c21 · wip: checkout flow'),
  chip2: text('Chip 2').default('pushed → origin/latch-wip · 0.8s'),
  sheet: text('Title block').default('LATCH 2.0 · SHEET 01'),
  font: font('Headline font').default('dmserif'),
  background: color().default('#0F3B8C'),
  surface: color('Panels').default('#134AA8'),
  textColor: color('Text & lines').default('#EAF2FF'),
  lines: color('Construction lines').default('#7FB2FF'),
  pop: color('Commit dot & CTA').default('#FFDD00'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', textColor: '#0A0A0A', lines: '#8C8C88', pop: '#E3000F', font: 'bodoni' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', textColor: '#F3EDE2', lines: '#6E6A62', pop: '#C9A45C', font: 'instrument', headline: 'Shut it. Ship it.', emphasis: 'Ship it.' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', textColor: '#17242E', lines: '#2F6F8F', pop: '#E4572E', eyebrow: 'Now on Product Hunt', cta: 'Upvote Latch' },
  minimal: { chip1: '', chip2: '', cta: '', eyebrow: 'Latch for macOS' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const rad = (d: number) => (d * Math.PI) / 180;

/** Blueprint side elevation of a laptop with the hinge arc dimensioned. viewBox 520 × 400. */
function Elevation({ left, top, w, p, compact }: { left: number; top: number; w: number; p: P; compact: boolean }) {
  const h = w * (400 / 520);
  const ink = p.textColor;
  const ln = p.lines;
  const HX = 140, HY = 300, L = 240;
  const at = (deg: number, r: number) => [HX + Math.cos(rad(deg)) * r, HY - Math.sin(rad(deg)) * r] as const;
  const lid = (deg: number) => {
    const [ex, ey] = at(deg, L);
    const nx = Math.cos(rad(deg + 90)) * 7, ny = -Math.sin(rad(deg + 90)) * 7;
    return `${HX - nx},${HY - ny} ${ex - nx},${ey - ny} ${ex + nx},${ey + ny} ${HX + nx},${HY + ny}`;
  };
  const R = 282;
  const [ax, ay] = at(110, R);
  const [bx, by] = at(0, R);
  const [mx, my] = at(56, R + 22);
  const sw = 2.2;
  const mono = { fontFamily: FONTS.mono, fontSize: 15, letterSpacing: '0.12em', fill: ink } as const;
  return (
    <svg viewBox="0 0 520 400" width={w} height={h} style={{ position: 'absolute', left, top, overflow: 'visible' }}>
      <defs>
        <radialGradient id="lw-dot">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.85" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
        <marker id="lw-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M0,1 L10,5 L0,9" fill="none" stroke={ink} strokeWidth="1.6" />
        </marker>
      </defs>
      {/* construction lines: ground line, centre lines through the hinge */}
      <line x1={-20} y1={HY + 30} x2={540} y2={HY + 30} stroke={ln} strokeWidth="1" strokeDasharray="14 5 3 5" opacity="0.7" />
      <line x1={HX} y1={10} x2={HX} y2={HY + 60} stroke={ln} strokeWidth="1" strokeDasharray="14 5 3 5" opacity="0.6" />
      {/* ghost lid positions while closing */}
      {[75, 40].map((d) => (
        <polygon key={d} points={lid(d)} fill="none" stroke={ln} strokeWidth="1.3" strokeDasharray="6 6" opacity="0.75" />
      ))}
      <polygon points={lid(0.01)} fill={hexA(p.pop, 0.08)} stroke={p.pop} strokeWidth="1.4" strokeDasharray="6 6" opacity="0.9" />
      {/* base deck + feet */}
      <rect x={HX - 20} y={HY} width={L + 40} height={26} rx={7} fill={hexA(p.surface, 0.9)} stroke={ink} strokeWidth={sw} />
      <line x1={HX - 6} y1={HY + 13} x2={HX + L + 6} y2={HY + 13} stroke={ln} strokeWidth="1" opacity="0.6" />
      <rect x={HX + 6} y={HY + 26} width={26} height={5} rx={2} fill={ink} />
      <rect x={HX + L - 32} y={HY + 26} width={26} height={5} rx={2} fill={ink} />
      {/* open lid at 110° with its screen face */}
      <polygon points={lid(110)} fill={hexA(p.surface, 0.95)} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      {/* hinge */}
      <circle cx={HX} cy={HY} r={11} fill={p.background} stroke={ink} strokeWidth={sw} />
      <circle cx={HX} cy={HY} r={3.5} fill={ink} />
      {/* the hinge arc dimension, 110° → 0° */}
      <path d={`M${ax},${ay} A${R},${R} 0 0 1 ${bx},${by}`} fill="none" stroke={ink} strokeWidth="1.6" markerStart="url(#lw-arr)" markerEnd="url(#lw-arr)" />
      <line x1={HX} y1={HY} x2={ax} y2={ay} stroke={ink} strokeWidth="0.9" opacity="0.6" />
      <rect x={mx - 34} y={my - 15} width={68} height={28} rx={4} fill={p.background} />
      <text x={mx} y={my + 6} textAnchor="middle" {...mono} fontSize={19} letterSpacing="0.04em">110°</text>
      {/* commit dot where the lid lands */}
      <circle cx={bx} cy={by} r={46} fill="url(#lw-dot)" />
      <circle cx={bx} cy={by} r={13} fill={p.pop} stroke={p.background} strokeWidth="3" />
      {/* callouts */}
      <line x1={HX - 8} y1={HY + 8} x2={HX - 70} y2={HY + 70} stroke={ink} strokeWidth="1" />
      <circle cx={HX - 8} cy={HY + 8} r={2.5} fill={ink} />
      <text x={HX - 74} y={HY + 90} {...mono} textAnchor="middle">LID SENSOR</text>
      {!compact && (
        <>
          <line x1={bx + 10} y1={by - 12} x2={bx + 50} y2={by - 70} stroke={ink} strokeWidth="1" />
          <text x={bx + 54} y={by - 78} {...mono} textAnchor="middle">COMMIT</text>
          {/* title block */}
          <g transform="translate(330 352)">
            <rect width={200} height={44} fill="none" stroke={ink} strokeWidth="1.3" />
            <line x1={0} y1={22} x2={200} y2={22} stroke={ink} strokeWidth="0.8" />
            <line x1={130} y1={22} x2={130} y2={44} stroke={ink} strokeWidth="0.8" />
            <text x={10} y={16} {...mono} fontSize={11}>{p.sheet}</text>
            <text x={10} y={38} {...mono} fontSize={10} opacity={0.75}>SCALE 1:4</text>
            <text x={140} y={38} {...mono} fontSize={10} opacity={0.75}>REV B</text>
          </g>
        </>
      )}
    </svg>
  );
}

function Chip({ right, left, top, size, label, p }: { right?: number; left?: number; top: number; size: number; label: string; p: P }) {
  if (!label) return null;
  const dark = isDark(p.background);
  return (
    <div
      style={{
        position: 'absolute',
        right,
        left,
        top,
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.6,
        padding: `${size * 0.6}px ${size * 1}px`,
        borderRadius: size * 0.35,
        fontFamily: FONTS.mono,
        fontSize: size,
        whiteSpace: 'nowrap',
        color: p.textColor,
        background: dark ? hexA(p.background, 0.72) : hexA('#ffffff', 0.75),
        border: `1px solid ${hexA(p.textColor, 0.35)}`,
        boxShadow: `${size * 0.3}px ${size * 0.3}px 0 ${hexA(p.lines, 0.35)}`,
      }}
    >
      <span style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${size * 0.7}px ${p.pop}` }} />
      {label}
    </div>
  );
}

function Headline({ p, size, align }: { p: P; size: number; align: 'left' | 'center' }) {
  const i = p.emphasis ? p.headline.lastIndexOf(p.emphasis) : -1;
  const pre = i >= 0 ? p.headline.slice(0, i) : p.headline;
  const em = i >= 0 ? p.emphasis : '';
  const post = i >= 0 ? p.headline.slice(i + p.emphasis.length) : '';
  return (
    <div style={{ ...displayFace(p.font, { italic: false }), fontSize: size, lineHeight: 0.98, letterSpacing: '-0.025em', textAlign: align, color: p.textColor, textWrap: 'balance' as never }}>
      {pre}
      {em && <span style={{ ...displayFace(p.font, { italic: true }), color: p.pop === '#FFDD00' || isDark(p.background) ? p.textColor : p.textColor, textDecoration: `underline ${hexA(p.pop, 0.9)}`, textDecorationThickness: size * 0.07, textUnderlineOffset: size * 0.12 }}>{em}</span>}
      {post}
    </div>
  );
}

export default function LaunchWeekHero(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.46 : 0.47);
  const head = stacked ? Math.min(W * 0.092, H * 0.07) : Math.min(H * (strip ? 0.17 : 0.125), colW * 0.14);
  const small = Math.max(head * (strip ? 0.3 : 0.27), 13);

  // drawing box
  const dw = stacked ? Math.min(W * 0.84, H * 0.56) : strip ? H * 1.12 : Math.min(W * 0.42, H * 0.72);
  const dh = dw * (400 / 520);
  const dl = stacked ? (W - dw) / 2 : W - pad - dw;
  // wide: lift the drawing to leave room for the commit chips underneath
  const dt = stacked ? H * 0.07 : strip ? (H - dh) / 2 - H * 0.02 : (H - dh) / 2 - small * 1.6;
  const cell = Math.round(Math.max(W, H) / 48);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.bricolage }}>
      <Backdrop
        base={p.background}
        grid={false}
        lift={dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: dl + dw * 0.6, y: dt + dh * 0.5, size: dw * 1.5, color: hexA(p.lines, dark ? 0.35 : 0.2), opacity: 0.8 },
          { x: dl + dw * 0.83, y: dt + dh * 0.75, size: dw * 0.5, color: hexA(p.pop, 0.25), opacity: 0.7 },
        ]}
        grain={dark ? 0.07 : 0.04}
        vignette={dark ? 0.45 : 0.06}
      >
        {/* drafting paper: fine cells, heavier every 5th line */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `linear-gradient(${hexA(p.lines, 0.22)} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${hexA(p.lines, 0.22)} 1px, transparent 1px)`,
              `linear-gradient(${hexA(p.lines, 0.09)} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${hexA(p.lines, 0.09)} 1px, transparent 1px)`,
            ].join(','),
            backgroundSize: `${cell * 5}px ${cell * 5}px, ${cell * 5}px ${cell * 5}px, ${cell}px ${cell}px, ${cell}px ${cell}px`,
          }}
        />
        {/* sheet border, like a drawing frame */}
        <div style={{ position: 'absolute', inset: Math.min(W, H) * 0.025, border: `1px solid ${hexA(p.textColor, 0.3)}` }} />
      </Backdrop>

      <Elevation left={dl} top={dt} w={dw} p={p} compact={strip} />
      {!strip && !stacked && (
        <>
          {/* commit log stacked under the drawing, anchored by the right edge */}
          <Chip right={pad * 0.6} top={dt + dh + small * 0.15} size={small * 0.8} label={p.chip1} p={p} />
          <Chip right={pad * 0.6 + small * 2} top={dt + dh + small * 2.45} size={small * 0.8} label={p.chip2} p={p} />
        </>
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: dt + dh + H * 0.06, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ fontFamily: FONTS.mono, fontSize: small * 0.8, letterSpacing: '0.28em', textTransform: 'uppercase', color: p.textColor, opacity: 0.9, display: 'flex', alignItems: 'center', gap: small * 0.6, justifyContent: stacked ? 'center' : 'flex-start' }}>
          <span style={{ width: small * 1.6, height: 1, background: p.textColor }} />
          {p.eyebrow}
        </div>
        <div style={{ marginTop: small * 0.8 }}>
          <Headline p={p} size={head} align={stacked ? 'center' : 'left'} />
        </div>
        {!strip && <div style={{ fontSize: small * 1.05, lineHeight: 1.45, opacity: 0.85, marginTop: small * 1, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.8 : 1.4) }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: small * 0.5,
                padding: `${small * 0.6}px ${small * 1.1}px`,
                borderRadius: small * 0.3,
                fontFamily: FONTS.mono,
                fontWeight: 700,
                fontSize: small * 0.9,
                color: isDark(p.pop) ? '#FFFFFF' : '#0A1B3F',
                background: p.pop,
                boxShadow: `${small * 0.25}px ${small * 0.25}px 0 ${dark ? hexA('#000000', 0.35) : p.textColor}`,
              }}
            >
              <span style={{ opacity: 0.6 }}>$</span>
              {p.cta}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
