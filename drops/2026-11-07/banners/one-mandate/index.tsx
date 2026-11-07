import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'One Mandate',
  description:
    'Launch banner for Mandate: a blunt two-line headline beside a live ledger board of platform positions: blended ROAS, a 32-segment allocation bar and ticker rows with deltas.',
  tags: ['launch', 'hero', 'social', 'ads', 'finance', 'dashboard'],
};

export const schema = z.object({
  eyebrow: text().default('Mandate · 32 platforms'),
  headline: text('Headline line 1').default('32 platforms.'),
  headline2: text('Headline line 2 (accent)').default('One mandate.'),
  body: textarea().default('Set a budget, a target CPA and your guardrails. The agent allocates, bids and rebalances overnight.'),
  cta: text('Button (empty to hide)').default('Set your mandate'),
  metric: text('Board metric').default('4.2×'),
  metricLabel: text('Metric label').default('Blended ROAS · 30 days'),
  rows: textarea('Ledger rows (SYMBOL share delta)').default('META 24.1 +2.3\nGOOGLE 19.8 +0.9\nTIKTOK 14.2 +3.1\nYOUTUBE 9.6 -0.4\nAMAZON 8.3 +1.2\nLINKEDIN 6.1 -1.8\nREDDIT 4.4 +0.6'),
  background: color().default('#0D0D0F'),
  surface: color('Board').default('#1C1C20'),
  textColor: color('Text').default('#F3EDE2'),
  accent: color('Gold').default('#C9A45C'),
  muted: color('Rules & muted').default('#6E6A62'),
  pop: color('Highlight').default('#E8D9B5'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', textColor: '#0A0A0A', accent: '#E3000F', muted: '#8C8C88', pop: '#E3000F' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', textColor: '#EAF2FF', accent: '#FFDD00', muted: '#7FB2FF', pop: '#FFFFFF' },
  'cherry-close': { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#F7B32B', muted: '#B0707A', pop: '#F5C6AA', headline: 'Q4 closes tonight.', headline2: 'Your agent won’t.', cta: 'Book a demo', metric: '−31%', metricLabel: 'Blended CPA · since launch' },
  minimal: { body: '', cta: '', eyebrow: 'Mandate', rows: 'META 24.1 +2.3\nGOOGLE 19.8 +0.9\nTIKTOK 14.2 +3.1' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

interface Row {
  sym: string;
  share: number;
  delta: number;
}
const parseRows = (s: string): Row[] =>
  s
    .split('\n')
    .map((l) => l.trim().split(/\s+/))
    .filter((t) => t.length >= 2 && t[0])
    .map(([sym, share, delta]) => ({ sym, share: parseFloat(share) || 0, delta: parseFloat(delta ?? '0') || 0 }));

const mono = (size: number, extra: CSSProperties = {}): CSSProperties => ({ fontFamily: FONTS.spacemono, fontSize: size, lineHeight: 1.2, ...extra });

/** The 32-segment allocation bar: the kit's shared motif. */
function AllocationBar({ w, h, p, lit = 2 }: { w: number; h: number; p: P; lit?: number }) {
  const segs = Array.from({ length: 32 }, (_, i) => 0.35 + rand(i * 4.3 + 1) * (i < 6 ? 2.6 : 1));
  const total = segs.reduce((a, b) => a + b, 0);
  const gap = Math.max(1.5, w * 0.004);
  return (
    <div style={{ display: 'flex', width: w, height: h, gap }}>
      {segs.map((s, i) => (
        <div
          key={i}
          style={{
            width: ((w - gap * 31) * s) / total,
            height: h,
            background: i === lit ? p.accent : i < 6 ? hexA(p.textColor, 0.72) : hexA(p.muted, 0.55 + rand(i) * 0.3),
            boxShadow: i === lit ? `0 0 ${h * 1.4}px ${hexA(p.accent, 0.6)}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

function Board({ x, y: slotY, w, h: slotH, p, maxRows }: { x: number; y: number; w: number; h: number; p: P; maxRows: number }) {
  let y = slotY;
  let h = slotH;
  const dark = isDark(p.background);
  const f = Math.max(11, Math.min(w * 0.03, h * 0.046));
  const inner = w - f * 2.6;
  const N = Math.min(h * 0.24, w * 0.19, (inner * 0.55) / Math.max(2, p.metric.length * 0.62));
  const rowH = f * 2.05;
  const used = f * 2.6 + f * 1.7 + N * 1.08 + f * 1.2 + f * 2.6;
  const rows = parseRows(p.rows).slice(0, Math.max(0, Math.min(maxRows, Math.floor((h - used) / rowH))));
  // Shrink to the content so short ledgers don't leave a void; stay centred on the slot.
  const fitH = Math.min(h, used + rows.length * rowH);
  y += (h - fitH) / 2;
  h = fitH;
  const maxShare = Math.max(1, ...rows.map((r) => r.share));
  const spark = Array.from({ length: 14 }, (_, i) => 0.25 + i * 0.045 + rand(i * 2.7) * 0.18);
  const sw = inner * 0.34;
  const sh = N * 0.62;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: 'border-box',
        padding: f * 1.3,
        background: `linear-gradient(180deg, ${hexA(p.surface, 0.96)}, ${hexA(p.surface, 0.86)})`,
        border: `1px solid ${hexA(p.accent, 0.55)}`,
        boxShadow: `${f * 0.7}px ${f * 0.7}px 0 ${hexA(p.muted, dark ? 0.35 : 0.5)}, 0 ${f * 3}px ${f * 8}px rgba(0,0,0,${dark ? 0.5 : 0.12})`,
        color: p.textColor,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...mono(f * 0.8, { letterSpacing: '0.22em', textTransform: 'uppercase' }), color: hexA(p.textColor, 0.7), paddingBottom: f * 0.6, borderBottom: `1px solid ${hexA(p.muted, 0.6)}` }}>
        <span>Portfolio · Nov 07</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: f * 0.4, color: p.accent }}>
          <span style={{ width: f * 0.5, height: f * 0.5, borderRadius: '50%', background: p.accent, boxShadow: `0 0 ${f}px ${p.accent}` }} />
          Live 06:00
        </span>
      </div>
      {/* metric + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: f * 0.9 }}>
        <div>
          <div style={{ fontFamily: FONTS.archivo, fontSize: N, lineHeight: 0.92, letterSpacing: '-0.04em', color: p.accent, whiteSpace: 'nowrap' }}>{p.metric}</div>
          <div style={mono(f * 0.78, { letterSpacing: '0.18em', textTransform: 'uppercase', color: hexA(p.textColor, 0.65), marginTop: f * 0.35, whiteSpace: 'nowrap' })}>{p.metricLabel}</div>
        </div>
        <svg width={sw} height={sh} style={{ overflow: 'visible', marginBottom: f * 1.3 }}>
          <polyline points={spark.map((v, i) => `${(i / (spark.length - 1)) * sw},${sh - Math.min(1, v) * sh}`).join(' ')} fill="none" stroke={p.accent} strokeWidth={Math.max(1.5, f * 0.14)} strokeLinejoin="round" />
          <line x1={0} y1={sh} x2={sw} y2={sh} stroke={hexA(p.muted, 0.7)} strokeWidth={1} />
          <circle cx={sw} cy={sh - Math.min(1, spark[spark.length - 1]) * sh} r={f * 0.3} fill={p.pop} />
        </svg>
      </div>
      <div style={{ marginTop: f * 0.9 }}>
        <AllocationBar w={inner} h={f * 0.8} p={p} />
      </div>
      {/* ledger rows */}
      <div style={{ marginTop: f * 0.8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', height: rowH, gap: f * 0.8, borderTop: i ? `1px solid ${hexA(p.muted, 0.28)}` : undefined, ...mono(f * 0.92) }}>
            <span style={{ width: f * 6.2, letterSpacing: '0.08em', fontWeight: 700 }}>{r.sym}</span>
            <span style={{ flex: 1, height: f * 0.42, background: hexA(p.muted, 0.22), position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(r.share / maxShare) * 100}%`, background: i === 0 ? p.accent : hexA(p.textColor, 0.55) }} />
            </span>
            <span style={{ width: f * 3.4, textAlign: 'right' }}>{r.share.toFixed(1)}%</span>
            <span style={{ width: f * 3.6, textAlign: 'right', color: r.delta >= 0 ? p.pop : hexA(p.textColor, 0.45) }}>
              {r.delta >= 0 ? '▲' : '▼'}
              {Math.abs(r.delta).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OneMandate(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : strip ? Math.max(H * 0.1, W * 0.03) : Math.max(W * 0.05, H * 0.09);
  // Board geometry, anchored by its right edge.
  const bw = stacked ? W - pad * 2 : strip ? W * 0.4 : Math.min(W * 0.42, H * 0.95);
  const bh = stacked ? H * 0.36 : H - pad * 2;
  const bx = stacked ? pad : W - pad - bw;
  const by = pad;
  const colW = stacked ? W - pad * 2 : bx - pad * 2.2;
  const longest = Math.max(p.headline.length, p.headline2.length, 6);
  const head = Math.min(stacked ? W * 0.095 : H * (strip ? 0.17 : 0.15), colW / (longest * 0.6));
  const small = Math.max(head * 0.3, Math.min(W, H) * 0.03, 13);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.spacemono }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 24), color: dark ? '201,164,92' : '10,10,10' }}
        lift={dark ? 'rgba(243,237,226,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: bx + bw * 0.6, y: by + bh * 0.35, size: Math.max(bw, bh) * 1.8, color: hexA(p.accent, dark ? 0.22 : 0.12), opacity: 1 },
          { x: 0, y: H, size: Math.max(W, H) * 0.9, color: hexA(p.muted, dark ? 0.25 : 0.15), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.5 : 0.06}
      />

      {/* type-as-image: a giant outlined numeral bleeding off the bottom-left */}
      {!strip && (
        <div
          style={{
            position: 'absolute',
            left: -W * 0.02,
            bottom: -Math.min(W, H) * 0.2,
            fontFamily: FONTS.archivo,
            fontSize: Math.min(W, H) * 0.75,
            lineHeight: 1,
            letterSpacing: '-0.06em',
            color: 'transparent',
            WebkitTextStroke: `${Math.max(1, Math.min(W, H) * 0.002)}px ${hexA(p.accent, dark ? 0.22 : 0.3)}`,
            pointerEvents: 'none',
          }}
        >
          32
        </div>
      )}

      <Board x={bx} y={by} w={bw} h={bh} p={p} maxRows={strip ? 3 : 7} />

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: by + bh + H * 0.045 } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.7 }}>
          {p.logo && <img src={p.logo} alt="" style={{ height: small * 1.6, objectFit: 'contain' }} />}
          <span style={mono(small * 0.78, { color: p.accent, letterSpacing: '0.3em', textTransform: 'uppercase', whiteSpace: 'nowrap' })}>{p.eyebrow}</span>
        </div>
        {/* gold rule with ticks */}
        <svg width={colW} height={small * 0.8} style={{ display: 'block', marginTop: small * 0.6 }}>
          <line x1={0} y1={small * 0.4} x2={colW} y2={small * 0.4} stroke={p.accent} strokeWidth={1.5} />
          {Array.from({ length: 33 }, (_, i) => (
            <line key={i} x1={(i / 32) * colW} x2={(i / 32) * colW} y1={small * 0.4} y2={small * (i % 8 === 0 ? 0.8 : 0.6)} stroke={p.accent} strokeWidth={1} opacity={0.7} />
          ))}
        </svg>
        <div style={{ fontFamily: FONTS.archivo, fontSize: head, lineHeight: 0.94, letterSpacing: '-0.04em', marginTop: small * 0.7, whiteSpace: 'nowrap' }}>
          <div>{p.headline}</div>
          <div style={{ color: p.accent }}>{p.headline2}</div>
        </div>
        {!strip && p.body && <div style={mono(small * (stacked ? 0.78 : 0.95), { lineHeight: 1.45, color: hexA(p.textColor, 0.75), marginTop: small * 0.8, maxWidth: stacked ? colW : Math.min(colW, small * 30) })}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', marginTop: small * (strip ? 0.8 : 1.3) }}>
            <span
              style={{
                ...mono(small * 0.9, { fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }),
                padding: `${small * 0.7}px ${small * 1.2}px`,
                color: dark ? p.background : '#FFFFFF',
                background: p.accent,
                boxShadow: `${small * 0.3}px ${small * 0.3}px 0 ${p.textColor}`,
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
