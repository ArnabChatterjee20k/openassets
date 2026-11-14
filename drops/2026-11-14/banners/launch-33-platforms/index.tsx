import type { CSSProperties, ReactNode } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Launch: 33 Platforms',
  description: 'Launch banner for Plotwell: a cyanotype plan sheet where compass arcs link one brief to its ad platforms, dimension lines carry the budget, and a highlighter marks the top channel.',
  tags: ['launch', 'social', 'header', 'blueprint', 'ads', 'ai agent'],
};

export const schema = z.object({
  eyebrow: text().default('now drafting on 33 ad platforms'),
  headline: text().default("Draw the plan. We'll run it."),
  highlight: text('Highlighted words (in headline)').default("We'll run it."),
  body: textarea().default('Plotwell drafts your media plan, generates the creatives, launches everywhere and rebalances spend every hour.'),
  cta: text('Button (empty to hide)').default('Start a plan at plotwell.ai'),
  platforms: text('Platforms (comma separated)').default('Meta, Google, TikTok, YouTube, LinkedIn, Reddit, Pinterest'),
  top: text('Highlighted platform').default('TikTok'),
  budget: text('Budget dimension').default('$4,200 / day'),
  sheet: text('Sheet number').default('pw-033 · rev 3'),
  font: font('Headline font').default('syne'),
  background: color().default('#0F3B8C'),
  surface: color('Sheet').default('#134AA8'),
  ink: color('Text').default('#EAF2FF'),
  line: color('Linework').default('#7FB2FF'),
  pop: color('Highlighter').default('#FFDD00'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  whiteprint: { background: '#F1EEE4', surface: '#E7E2D4', ink: '#173F9A', line: '#173F9A', pop: '#FFDD00' },
  bauhaus: { background: '#F2EBDD', surface: '#E4D9C4', ink: '#111111', line: '#1D4E9E', pop: '#F2B90F', font: 'bricolage', headline: 'One brief. 33 platforms.', highlight: '33 platforms.' },
  'ink & gold': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', line: '#C9A45C', pop: '#E8D9B5', headline: 'Your media plan, drawn to scale.', highlight: 'to scale.' },
  'dusk studio': { background: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', line: '#FF8E5E', pop: '#FFD27F', cta: '', eyebrow: 'launch week · nov 18' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Headline with the highlighter swipe behind the chosen words. */
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

/** A drafting dimension line with tick ends and a label riding on it. */
function Dim({ x1, y1, x2, y2, label, c, size }: { x1: number; y1: number; x2: number; y2: number; label: string; c: string; size: number }) {
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const t = 9;
  return (
    <g stroke={c} strokeWidth={1.6} fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? (
        <>
          <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} />
          <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} />
          <line x1={x1 - 6} y1={y1 + 6} x2={x1 + 6} y2={y1 - 6} strokeWidth={2.4} />
          <line x1={x2 - 6} y1={y2 + 6} x2={x2 + 6} y2={y2 - 6} strokeWidth={2.4} />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} />
          <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} />
          <line x1={x1 - 6} y1={y1 + 6} x2={x1 + 6} y2={y1 - 6} strokeWidth={2.4} />
          <line x1={x2 - 6} y1={y2 + 6} x2={x2 + 6} y2={y2 - 6} strokeWidth={2.4} />
        </>
      )}
      <text
        x={mx}
        y={my}
        transform={vertical ? `rotate(-90 ${mx} ${my})` : undefined}
        dy={-size * 0.55}
        textAnchor="middle"
        fill={c}
        stroke="none"
        fontFamily={FONTS.majormono}
        fontSize={size}
      >
        {label}
      </text>
    </g>
  );
}

/** The hero: a plan sheet, 1000 × 700 units. */
function PlanSheet({ p }: { p: P }) {
  const dark = isDark(p.background);
  const L = p.line;
  const ink = p.ink;
  const names = p.platforms
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const n = Math.max(1, names.length);
  const bx = 250;
  const by = 330;
  const R = 410;
  // Platform nodes on a compass arc around the brief.
  const nodes = names.map((name, i) => {
    const a = -0.98 + (1.96 * i) / Math.max(1, n - 1);
    return { name, x: bx + Math.cos(a) * R * 0.86, y: by + Math.sin(a) * R * 0.66, top: name.toLowerCase() === p.top.trim().toLowerCase() };
  });
  const sheetFill = dark ? hexA(p.surface, 0.55) : hexA(p.surface, 0.7);
  const label = 28;
  return (
    <svg viewBox="0 0 1000 700" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <pattern id="pw-minor" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke={L} strokeOpacity={dark ? 0.16 : 0.12} strokeWidth="1" />
        </pattern>
        <pattern id="pw-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#pw-minor)" />
          <path d="M100 0H0V100" fill="none" stroke={L} strokeOpacity={dark ? 0.3 : 0.22} strokeWidth="1.2" />
        </pattern>
        <filter id="pw-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* sheet with double border */}
      <rect x="6" y="6" width="988" height="688" fill={sheetFill} />
      <rect x="6" y="6" width="988" height="688" fill="url(#pw-major)" />
      <rect x="6" y="6" width="988" height="688" fill="none" stroke={ink} strokeOpacity={0.85} strokeWidth="2.4" />
      <rect x="22" y="22" width="956" height="656" fill="none" stroke={ink} strokeOpacity={0.4} strokeWidth="1" />
      {/* registration marks */}
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

      {/* construction circles around the brief */}
      <circle cx={bx} cy={by} r="120" fill="none" stroke={L} strokeOpacity={0.55} strokeDasharray="4 8" strokeWidth="1.4" />
      <ellipse cx={bx} cy={by} rx={R * 0.86} ry={R * 0.66} fill="none" stroke={L} strokeOpacity={0.35} strokeDasharray="2 10" strokeWidth="1.4" />

      {/* links: compass arcs from brief to each platform */}
      {nodes.map((nd, i) => {
        const mx = (bx + nd.x) / 2;
        const my = (by + nd.y) / 2 - 60 + i * 6;
        return (
          <path
            key={`l${i}`}
            d={`M${bx + 34},${by} Q${mx},${my} ${nd.x - 16},${nd.y}`}
            fill="none"
            stroke={nd.top ? p.pop : ink}
            strokeOpacity={nd.top ? 1 : 0.75}
            strokeWidth={nd.top ? 3.2 : 1.6}
            strokeDasharray={nd.top ? undefined : '10 6'}
          />
        );
      })}

      {/* platform nodes */}
      {nodes.map((nd, i) => {
        const w = nd.name.length * label * 0.78 + 24;
        return (
          <g key={`n${i}`}>
            {nd.top && <circle cx={nd.x} cy={nd.y} r="34" fill={p.pop} opacity="0.45" filter="url(#pw-glow)" />}
            <circle cx={nd.x} cy={nd.y} r="15" fill={nd.top ? p.pop : dark ? p.background : p.surface} stroke={nd.top ? p.pop : ink} strokeWidth="2.4" />
            <circle cx={nd.x} cy={nd.y} r="4.5" fill={nd.top ? p.background : ink} />
            {nd.top && <rect x={nd.x + 26} y={nd.y - label * 0.85} width={w} height={label * 1.5} fill={p.pop} transform={`rotate(-2 ${nd.x + 26} ${nd.y})`} />}
            <text x={nd.x + 36} y={nd.y + label * 0.32} fontFamily={FONTS.majormono} fontSize={label} fill={nd.top ? (dark ? p.background : p.ink) : ink}>
              {nd.name.toLowerCase()}
            </text>
          </g>
        );
      })}

      {/* the brief */}
      <circle cx={bx} cy={by} r="64" fill={p.pop} opacity="0.12" filter="url(#pw-glow)" />
      <circle cx={bx} cy={by} r="40" fill={dark ? p.background : p.surface} stroke={ink} strokeWidth="2.8" />
      <circle cx={bx} cy={by} r="28" fill="none" stroke={ink} strokeOpacity={0.5} strokeWidth="1.2" />
      <line x1={bx - 56} y1={by} x2={bx + 56} y2={by} stroke={ink} strokeWidth="1.4" />
      <line x1={bx} y1={by - 56} x2={bx} y2={by + 56} stroke={ink} strokeWidth="1.4" />
      <circle cx={bx} cy={by} r="7" fill={p.pop} />
      <text x={bx} y={by + 84} textAnchor="middle" fontFamily={FONTS.majormono} fontSize={label} fill={ink}>
        brief
      </text>

      {/* dimension lines */}
      <Dim x1={bx - 120} y1={650} x2={bx + 200} y2={650} label={p.budget.toLowerCase()} c={ink} size={label * 0.9} />
      <Dim x1={70} y1={by - R * 0.66 + 30} x2={70} y2={by + R * 0.66 - 30} label={`${n} of 33 shown`} c={ink} size={label * 0.8} />

      {/* title block */}
      <g transform="translate(640 572)" fontFamily={FONTS.majormono} fill={ink}>
        <rect width="338" height="106" fill={dark ? p.background : p.surface} stroke={ink} strokeWidth="1.8" />
        <line x1="0" y1="56" x2="338" y2="56" stroke={ink} strokeWidth="1.2" />
        <text x="16" y="40" fontSize="27">plotwell · plan</text>
        <text x="16" y="90" fontSize="20" opacity="0.85">
          {p.sheet.toLowerCase()}
        </text>
      </g>
    </svg>
  );
}

export default function Launch33Platforms(p: P) {
  const { width: W, height: H } = p;
  const ar = W / H;
  const stacked = ar < 1.3;
  const strip = ar > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.075 : Math.max(W * 0.05, H * 0.09);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.44 : 0.42);
  const head = stacked ? W * 0.062 : Math.min(H * (strip ? 0.15 : 0.1), colW * 0.125);
  const small = Math.max(head * 0.32, 13);

  // Hero box: keeps the sheet's 10:7 ratio, anchored to the right edge (or the top when stacked).
  let hw: number;
  let hh: number;
  let hx: number;
  let hy: number;
  if (stacked) {
    hh = H * 0.42;
    hw = Math.min(W - pad * 2, hh / 0.7);
    hh = hw * 0.7;
    hx = (W - hw) / 2;
    hy = pad * 0.8;
  } else {
    const maxW = W - pad * 2 - colW - pad * 0.5;
    const maxH = H - pad * (strip ? 0.9 : 1.2);
    hw = Math.min(maxW, maxH / 0.7);
    hh = hw * 0.7;
    hx = W - pad - hw;
    hy = (H - hh) / 2;
  }

  const copy: ReactNode = (
    <>
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
        <span style={{ width: small * 1.6, height: 2, background: p.ink }} />
        {p.eyebrow.toLowerCase()}
        <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${small}px ${hexA(p.pop, 0.8)}` }} />
      </div>
      <div
        style={{
          ...displayFace(p.font),
          fontSize: head,
          lineHeight: 1.0,
          letterSpacing: '-0.04em',
          color: p.ink,
          marginTop: small * 0.8,
        }}
      >
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
    </>
  );

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.12 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '127,178,255' : '23,63,154' }}
        lift={dark ? 'rgba(127,178,255,0.12)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: hx + hw * 0.35, y: hy + hh * 0.47, size: Math.max(hw, hh) * 1.4, color: hexA(p.line, dark ? 0.35 : 0.18), opacity: 0.9 },
          { x: stacked ? W * 0.2 : W * 0.12, y: H * 1.05, size: Math.max(W, H) * 0.7, color: hexA(p.pop, dark ? 0.1 : 0.12), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.45 : 0.08}
      />
      <div style={{ position: 'absolute', left: hx, top: hy, width: hw, height: hh, filter: `drop-shadow(0 ${hh * 0.03}px ${hh * 0.06}px rgba(0,0,0,${dark ? 0.35 : 0.12}))` }}>
        <PlanSheet p={p} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          display: 'flex',
          flexDirection: 'column',
          ...(stacked ? { top: hy + hh + pad * 0.7 } : { top: 0, bottom: 0, justifyContent: 'center' }),
        }}
      >
        {copy}
      </div>
    </div>
  );
}
