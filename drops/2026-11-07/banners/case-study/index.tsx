import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Case Study',
  description:
    'Customer-results post for Mandate: a blunt result headline and a client quote beside a ledger chart of 30 daily CPA bars falling from the start value to the end value, a gold −31% hit and a before/after allocation bar.',
  tags: ['case study', 'results', 'social', 'customer', 'finance', 'chart'],
};

export const schema = z.object({
  eyebrow: text().default('Case study · Kettle & Co.'),
  headline: text('Headline line 1').default('CPA down 31%.'),
  headline2: text('Headline line 2 (accent)').default('In 30 days.'),
  quote: textarea('Quote').default('“We handed Mandate a $240K month and a $35 target. It hit $33 by week three.”'),
  author: text('Quote attribution').default('Dana Okafor, Head of Growth'),
  cta: text('Button (empty to hide)').default('Read the case study'),
  metricLabel: text('Chart label').default('Blended CPA · 30 days'),
  before: num(1, 999, 1, 'Start value').default(48),
  after: num(1, 999, 1, 'End value').default(33),
  unit: text('Unit prefix').default('$'),
  delta: text('Result chip').default('−31%'),
  background: color().default('#0D0D0F'),
  surface: color('Board').default('#1C1C20'),
  textColor: color('Text').default('#F3EDE2'),
  accent: color('Gold').default('#C9A45C'),
  muted: color('Rules & muted').default('#6E6A62'),
  pop: color('Highlight').default('#E8D9B5'),
  logo: image('Customer logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', textColor: '#0A0A0A', accent: '#E3000F', muted: '#8C8C88', pop: '#E3000F' },
  blueprint: {
    background: '#0F3B8C', surface: '#134AA8', textColor: '#EAF2FF', accent: '#FFDD00', muted: '#7FB2FF', pop: '#FFFFFF',
    eyebrow: 'Case study · Northline Outdoor', headline: 'ROAS up 2.4×.', headline2: 'Same budget.', delta: '+2.4×', metricLabel: 'Cost per $1 revenue · 30 days', before: 61, after: 25, unit: '¢',
    quote: '“Mandate moved 40% of our spend off Meta in a week. Our CFO stopped asking about ads.”', author: 'Priya Raman, VP Marketing',
  },
  cherry: { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#F7B32B', muted: '#B0707A', pop: '#F5C6AA' },
  forest: {
    background: '#0E1A14', surface: '#18291F', textColor: '#EAF2DC', accent: '#B5E550', muted: '#6F8A72', pop: '#FFE7B0',
    eyebrow: 'Case study · Fernway', headline: '$1.2M saved.', headline2: 'One quarter.', delta: '−24%', before: 92, after: 70,
    quote: '“The overnight rebalance does what three media buyers used to do by hand.”', author: 'Tom Achterberg, CMO', cta: 'See the numbers',
  },
  minimal: { quote: '', cta: '', eyebrow: 'Case study' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const mono = (size: number, extra: CSSProperties = {}): CSSProperties => ({ fontFamily: FONTS.spacemono, fontSize: size, lineHeight: 1.2, ...extra });

/** 30 daily values easing from `a` to `b` with ledger-like noise. */
function series(a: number, b: number) {
  return Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    const e = 1 - Math.pow(1 - t, 1.8);
    const noise = i === 0 || i === 29 ? 0 : (rand(i * 3.1 + 2) - 0.5) * 0.09 * a * (1 - t * 0.75);
    return a + (b - a) * e + noise;
  });
}

/** The kit's 32-segment allocation bar; `shift` moves weight from the old leaders to the new one. */
function AllocationBar({ w, h, p, shift }: { w: number; h: number; p: P; shift: number }) {
  const segs = Array.from({ length: 32 }, (_, i) => {
    const base = 0.35 + rand(i * 4.3 + 1) * (i < 6 ? 2.6 : 1);
    if (i === 2) return base * (1 + shift * 1.6);
    if (i === 0 || i === 1) return base * (1 - shift * 0.45);
    return base;
  });
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
            background: i === 2 && shift > 0 ? p.accent : i < 6 ? hexA(p.textColor, shift > 0 ? 0.72 : 0.5) : hexA(p.muted, 0.55 + rand(i) * 0.3),
            boxShadow: i === 2 && shift > 0 ? `0 0 ${h * 1.4}px ${hexA(p.accent, 0.6)}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

function Board({ x, y, w, h, p, compact }: { x: number; y: number; w: number; h: number; p: P; compact: boolean }) {
  const dark = isDark(p.background);
  const f = Math.max(11, Math.min(w * 0.028, h * 0.045));
  const padB = f * 1.3;
  const inner = w - padB * 2;
  const vals = series(p.before, p.after);
  const max = Math.max(...vals) * 1.04;
  const min = Math.min(...vals) * 0.72;
  const N = Math.min(h * (compact ? 0.26 : 0.17), (inner * 0.5) / Math.max(3, p.delta.length * 0.62));
  const header = f * 2.1;
  const metricH = N * 0.92 + f * 0.9;
  const allocH = compact ? 0 : f * 5.6;
  const chartH = Math.max(f * 3, h - padB * 2 - header - metricH - allocH - f * 3.2);
  const bw = inner / vals.length;
  const yOf = (v: number) => chartH - ((v - min) / (max - min)) * chartH;
  const target = vals[vals.length - 1] * 1.06;
  const fmt = (v: number) => `${p.unit}${Math.round(v)}`;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: 'border-box',
        padding: padB,
        background: `linear-gradient(180deg, ${hexA(p.surface, 0.96)}, ${hexA(p.surface, 0.86)})`,
        border: `1px solid ${hexA(p.accent, 0.55)}`,
        boxShadow: `${f * 0.7}px ${f * 0.7}px 0 ${hexA(p.muted, dark ? 0.35 : 0.5)}, 0 ${f * 3}px ${f * 8}px rgba(0,0,0,${dark ? 0.5 : 0.12})`,
        color: p.textColor,
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div style={{ height: header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', ...mono(f * 0.8, { letterSpacing: '0.22em', textTransform: 'uppercase' }), color: hexA(p.textColor, 0.7), borderBottom: `1px solid ${hexA(p.muted, 0.6)}`, boxSizing: 'border-box' }}>
        <span style={{ whiteSpace: 'nowrap' }}>{p.metricLabel}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: f * 0.4, color: p.accent, whiteSpace: 'nowrap' }}>
          <span style={{ width: f * 0.5, height: f * 0.5, borderRadius: '50%', background: p.accent, boxShadow: `0 0 ${f}px ${p.accent}` }} />
          Audited
        </span>
      </div>
      {/* the hit: a big gold delta, with the before → after ledger line */}
      <div style={{ height: metricH, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', boxSizing: 'border-box', paddingTop: f * 0.9 }}>
        <div style={{ fontFamily: FONTS.archivo, fontSize: N, lineHeight: 0.92, letterSpacing: '-0.04em', color: p.accent, whiteSpace: 'nowrap', textShadow: `0 0 ${N * 0.3}px ${hexA(p.accent, 0.25)}` }}>{p.delta}</div>
        <div style={{ textAlign: 'right', paddingBottom: N * 0.06 }}>
          <div style={mono(f * 0.7, { letterSpacing: '0.2em', textTransform: 'uppercase', color: hexA(p.textColor, 0.55), whiteSpace: 'nowrap' })}>Day 01 → Day 30</div>
          <div style={mono(f * 1.25, { fontWeight: 700, marginTop: f * 0.2, whiteSpace: 'nowrap' })}>
            <span style={{ color: hexA(p.textColor, 0.6), textDecoration: 'line-through', textDecorationColor: hexA(p.textColor, 0.45) }}>{fmt(p.before)}</span>
            <span style={{ color: p.pop }}> → {fmt(p.after)}</span>
          </div>
        </div>
      </div>
      {/* chart */}
      <div style={{ position: 'relative', height: chartH, marginTop: f * 1.1 }}>
        <svg width={inner} height={chartH} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={0} x2={inner} y1={chartH * g} y2={chartH * g} stroke={hexA(p.muted, 0.28)} strokeWidth={1} />
          ))}
          {vals.map((v, i) => {
            const last = i === vals.length - 1;
            const top = yOf(v);
            return <rect key={i} x={i * bw + bw * 0.14} y={top} width={bw * 0.72} height={chartH - top} fill={last ? p.accent : i === 0 ? hexA(p.textColor, 0.75) : hexA(p.textColor, 0.16 + (i / 29) * 0.3)} />;
          })}
          {/* target line */}
          <line x1={0} x2={inner} y1={yOf(target)} y2={yOf(target)} stroke={p.pop} strokeWidth={Math.max(1, f * 0.1)} strokeDasharray={`${f * 0.5} ${f * 0.35}`} opacity={0.85} />
          {/* trend line across the bar tops */}
          <polyline points={vals.map((v, i) => `${i * bw + bw / 2},${yOf(v)}`).join(' ')} fill="none" stroke={p.accent} strokeWidth={Math.max(1.5, f * 0.14)} strokeLinejoin="round" />
          <circle cx={inner - bw / 2} cy={yOf(vals[vals.length - 1])} r={f * 0.38} fill={p.pop} stroke={p.surface} strokeWidth={f * 0.12} />
          {/* start value tag */}
          <text x={0} y={yOf(vals[0]) - f * 0.6} fontFamily={FONTS.spacemono} fontSize={f * 0.85} fill={hexA(p.textColor, 0.75)}>
            {fmt(p.before)}
          </text>
          <text x={inner} y={yOf(target) - f * 0.5} textAnchor="end" fontFamily={FONTS.spacemono} fontSize={f * 0.7} letterSpacing="0.18em" fill={p.pop} stroke={p.surface} strokeWidth={f * 0.35} paintOrder="stroke">
            TARGET
          </text>
        </svg>
      </div>
      {/* gold rule with day ticks */}
      <svg width={inner} height={f * 1.9} style={{ display: 'block' }}>
        <line x1={0} y1={1} x2={inner} y2={1} stroke={p.accent} strokeWidth={1.5} />
        {Array.from({ length: 30 }, (_, i) => (
          <line key={i} x1={i * bw + bw / 2} x2={i * bw + bw / 2} y1={1} y2={i % 7 === 0 || i === 29 ? f * 0.6 : f * 0.35} stroke={p.accent} strokeWidth={1} opacity={0.75} />
        ))}
        {[0, 7, 14, 21, 29].map((d) => (
          <text key={d} x={d * bw + bw / 2} y={f * 1.6} textAnchor={d === 0 ? 'start' : d === 29 ? 'end' : 'middle'} fontFamily={FONTS.spacemono} fontSize={f * 0.68} fill={hexA(p.textColor, 0.55)} letterSpacing="0.1em">
            D{String(d + 1).padStart(2, '0')}
          </text>
        ))}
      </svg>
      {/* allocation before / after */}
      {!compact && (
        <div style={{ marginTop: f * 0.6, display: 'flex', flexDirection: 'column', gap: f * 0.55 }}>
          {[
            { label: 'Day 01', shift: 0 },
            { label: 'Day 30', shift: 1 },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: f * 0.8 }}>
              <span style={mono(f * 0.72, { width: f * 4.4, letterSpacing: '0.16em', textTransform: 'uppercase', color: r.shift ? p.accent : hexA(p.textColor, 0.55), whiteSpace: 'nowrap' })}>{r.label}</span>
              <AllocationBar w={inner - f * 5.2} h={f * 0.85} p={p} shift={r.shift} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CaseStudy(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : strip ? Math.max(H * 0.1, W * 0.03) : Math.max(W * 0.05, H * 0.09);
  const bw = stacked ? W - pad * 2 : strip ? W * 0.4 : Math.min(W * 0.42, H * 0.95);
  const bh = stacked ? H * 0.4 : H - pad * 2;
  const bx = stacked ? pad : W - pad - bw;
  const by = pad;
  const colW = stacked ? W - pad * 2 : bx - pad * 2.1;
  const longest = Math.max(p.headline.length, p.headline2.length, 6);
  const head = Math.min(stacked ? W * 0.08 : H * (strip ? 0.17 : 0.15), colW / (longest * 0.6));  const small = Math.max(head * 0.3, Math.min(W, H) * 0.028, 13);
  const showQuote = !strip && !!p.quote;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.spacemono }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 24), color: dark ? '201,164,92' : '10,10,10' }}
        lift={dark ? 'rgba(243,237,226,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: bx + bw * 0.7, y: by + bh * 0.3, size: Math.max(bw, bh) * 1.8, color: hexA(p.accent, dark ? 0.22 : 0.12), opacity: 1 },
          { x: 0, y: H, size: Math.max(W, H) * 0.9, color: hexA(p.muted, dark ? 0.25 : 0.15), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.5 : 0.06}
      />

      {/* type-as-image: a giant outlined percent bleeding off the bottom-left */}
      {!strip && (
        <div
          style={{
            position: 'absolute',
            left: -W * 0.03,
            bottom: -Math.min(W, H) * 0.24,
            fontFamily: FONTS.archivo,
            fontSize: Math.min(W, H) * 0.8,
            lineHeight: 1,
            letterSpacing: '-0.06em',
            color: 'transparent',
            WebkitTextStroke: `${Math.max(1, Math.min(W, H) * 0.002)}px ${hexA(p.accent, dark ? 0.2 : 0.28)}`,
            pointerEvents: 'none',
          }}
        >
          %
        </div>
      )}

      <Board x={bx} y={by} w={bw} h={bh} p={p} compact={strip || stacked} />

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: by + bh + H * 0.04 } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.7 }}>
          {p.logo && <img src={p.logo} alt="" style={{ height: small * 1.6, maxWidth: small * 6, objectFit: 'contain' }} />}
          <span style={mono(small * 0.78, { color: p.accent, letterSpacing: '0.3em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>{p.eyebrow}</span>
        </div>
        <div style={{ height: 1.5, background: p.accent, marginTop: small * 0.6, width: '100%' }} />
        <div style={{ fontFamily: FONTS.archivo, fontSize: head, lineHeight: 0.94, letterSpacing: '-0.04em', marginTop: small * 0.7, whiteSpace: 'nowrap' }}>
          <div>{p.headline}</div>
          <div style={{ color: p.accent }}>{p.headline2}</div>
        </div>
        {showQuote && (
          <div style={{ marginTop: small * 0.9, paddingLeft: small * 0.9, borderLeft: `${Math.max(2, small * 0.18)}px solid ${p.accent}`, maxWidth: stacked ? colW : Math.min(colW, small * 30) }}>
            <div style={mono(small * (stacked ? 0.8 : 0.92), { lineHeight: 1.45, color: hexA(p.textColor, 0.82) })}>{p.quote}</div>
            {p.author && <div style={mono(small * 0.68, { marginTop: small * 0.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: hexA(p.textColor, 0.55) })}>— {p.author}</div>}
          </div>
        )}
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
