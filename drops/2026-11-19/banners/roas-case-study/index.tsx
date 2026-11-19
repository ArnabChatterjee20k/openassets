import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, gradientText, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'ROAS Case Study',
  description:
    'Customer case-study post for Crossfade: a huge neon "+38%" stat and headline beside a before/after mixdown, where each ad platform is a channel whose LED meter shows its new share of spend over a ghost of the old one.',
  tags: ['case study', 'results', 'social', 'roas', 'customer', 'stat'],
};

export const schema = z.object({
  eyebrow: text().default('Case study · Loomwell × Crossfade'),
  stat: text('Big stat').default('+38%'),
  statLabel: text('Stat label').default('ROAS in 30 days'),
  headline: text().default('Loomwell let the agent ride the faders.'),
  body: textarea().default('On day 3 Crossfade pulled spend from Search and pushed it into TikTok and Reddit. CPA fell 22% while the team slept.'),
  cta: text('Button (empty to hide)').default('Read the case study'),
  url: text('URL').default('crossfade.ai/loomwell'),
  channels: text('Channels (comma separated)').default('TikTok,Meta,Reddit,Google,YouTube,Snap'),
  before: text('Spend share before (%)').default('12,30,4,40,10,4'),
  after: text('Spend share after (%)').default('34,24,16,14,8,4'),
  chip: text('Result chip (empty to hide)').default('CPA −22%'),
  logo: image('Customer logo (optional)').default(''),
  background: color().default('#2B1B2E'),
  surface: color('Console').default('#45293F'),
  accent: color().default('#FF8E5E'),
  accent2: color('Second accent').default('#E5487A'),
  pop: color('Peak / stat').default('#FFD27F'),
  textColor: color('Text').default('#FFE9D6'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { background: '#12001F', surface: '#24003D', accent: '#B026FF', accent2: '#FF2E88', pop: '#FFD600', textColor: '#FBEFFF' },
  'ink-gold': {
    background: '#0D0D0F', surface: '#1C1C20', accent: '#C9A45C', accent2: '#6E6A62', pop: '#E8D9B5', textColor: '#F3EDE2',
    eyebrow: 'Case study · Harbor & Pine', stat: '3.1×', statLabel: 'Return on ad spend', headline: 'A two-person team, mixed like an agency.', chip: 'Saved 14 h / week',
    body: 'Harbor & Pine handed 11 ad accounts to the agent. It rebalanced daily and tripled return on spend by month two.', url: 'crossfade.ai/harbor-pine',
  },
  sorbet: {
    background: '#3D0E2A', surface: '#5A1A3F', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', textColor: '#FFEDE1',
    eyebrow: 'Case study · Pollen Coffee', stat: '−41%', statLabel: 'Cost per order', headline: 'Pollen found its buyers on Pinterest.',
    channels: 'Pinterest,Meta,Google,TikTok,Snap', before: '6,44,32,14,4', after: '30,30,18,18,4', chip: '9,400 new orders',
    body: 'The agent spotted Pinterest outperforming on day 5 and moved a quarter of the budget there. Orders followed.', url: 'crossfade.ai/pollen',
  },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', textColor: '#F0FFE0' },
};

type P = z.infer<typeof schema> & BannerSize;

const nums = (s: string) => s.split(',').map((v) => Math.max(0, parseFloat(v) || 0));

/** The hero: a mixdown console. Ghost outline = old share, lit LEDs = new share. */
function Mixdown({ x, y, w, h, p, compact }: { x: number; y: number; w: number; h: number; p: P; compact: boolean }) {
  const names = p.channels.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
  const n = Math.max(1, names.length);
  const b = nums(p.before);
  const a = nums(p.after);
  const max = Math.max(1, ...b.slice(0, n), ...a.slice(0, n));
  const deltas = names.map((_, i) => (a[i] ?? 0) - (b[i] ?? 0));
  const winner = deltas.indexOf(Math.max(...deltas));
  const r = Math.min(w, h) * 0.06;
  const pad = Math.min(w, h) * 0.08;
  const legendH = compact ? 0 : h * 0.1;
  const labelH = h * (compact ? 0.16 : 0.12);
  const top = pad + legendH;
  const bot = h - pad - labelH;
  const iw = w - pad * 2;
  const sw = iw / n;
  const SEG = compact ? 10 : 14;
  const segH = (bot - top) / SEG;
  const colW = Math.min(sw * 0.5, segH * 3.2);
  const labelSize = Math.min(sw * 0.16, h * 0.05);
  const legendSize = Math.max(9, h * 0.034);
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="md-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.surface} />
          <stop offset="1" stopColor={p.background} />
        </linearGradient>
      </defs>
      <rect x={w * 0.015} y={h * 0.03} width={w} height={h} rx={r} fill="#000" opacity={0.35} />
      <rect width={w} height={h} rx={r} fill="url(#md-body)" stroke={hexA(p.textColor, 0.16)} strokeWidth={Math.max(1, w * 0.003)} />
      <rect x={w * 0.012} y={w * 0.01} width={w * 0.976} height={h * 0.16} rx={r * 0.85} fill={hexA(p.textColor, 0.045)} />
      {!compact && (
        <g fontFamily={FONTS.spacemono} fontSize={legendSize} letterSpacing={legendSize * 0.14} fill={hexA(p.textColor, 0.72)}>
          <rect x={pad} y={pad + legendH * 0.2 - legendSize * 0.75} width={legendSize * 1.4} height={legendSize * 0.8} rx={legendSize * 0.2} fill="none" stroke={hexA(p.textColor, 0.55)} strokeDasharray={`${legendSize * 0.25} ${legendSize * 0.18}`} />
          <text x={pad + legendSize * 1.9} y={pad + legendH * 0.2}>BEFORE</text>
          <rect x={pad + legendSize * 8.6} y={pad + legendH * 0.2 - legendSize * 0.75} width={legendSize * 1.4} height={legendSize * 0.8} rx={legendSize * 0.2} fill={p.accent} />
          <text x={pad + legendSize * 10.5} y={pad + legendH * 0.2}>WITH CROSSFADE</text>
          <text x={w - pad} y={pad + legendH * 0.2} textAnchor="end" fill={hexA(p.textColor, 0.45)}>SHARE OF SPEND</text>
        </g>
      )}
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((k) => (
        <line key={k} x1={pad} x2={w - pad} y1={bot - (bot - top) * k} y2={bot - (bot - top) * k} stroke={hexA(p.textColor, 0.06)} strokeWidth={1} />
      ))}
      {names.map((name, i) => {
        const cx = pad + sw * (i + 0.5);
        const isWin = i === winner;
        const lit = Math.max(1, Math.round(((a[i] ?? 0) / max) * SEG));
        const ghostH = ((b[i] ?? 0) / max) * (bot - top);
        const delta = Math.round(deltas[i]);
        return (
          <g key={i}>
            {/* LED meter for the new share */}
            {Array.from({ length: SEG }, (_, s) => {
              const on = s < lit;
              const c = isWin && s === lit - 1 ? p.pop : s >= SEG * 0.7 ? p.accent2 : p.accent;
              return (
                <rect
                  key={s}
                  x={cx - colW / 2}
                  y={bot - (s + 1) * segH + segH * 0.16}
                  width={colW}
                  height={segH * 0.68}
                  rx={segH * 0.14}
                  fill={on ? c : hexA(p.textColor, 0.05)}
                  opacity={on ? (isWin ? 1 : 0.88) : 1}
                  style={on && s === lit - 1 ? { filter: `drop-shadow(0 0 ${segH * 0.5}px ${c})` } : undefined}
                />
              );
            })}
            {/* ghost of the old share */}
            {ghostH > 0 && (
              <rect
                x={cx - colW / 2 - segH * 0.18}
                y={bot - ghostH}
                width={colW + segH * 0.36}
                height={ghostH}
                rx={segH * 0.2}
                fill="none"
                stroke={hexA(p.textColor, 0.55)}
                strokeWidth={Math.max(1, segH * 0.08)}
                strokeDasharray={`${segH * 0.22} ${segH * 0.16}`}
              />
            )}
            {/* delta tag above the winner */}
            {isWin && delta > 0 && (
              <g>
                <rect x={cx - sw * 0.42} y={bot - lit * segH - segH * 2.1} width={sw * 0.84} height={segH * 1.4} rx={segH * 0.7} fill={p.pop} />
                <text x={cx} y={bot - lit * segH - segH * 1.08} textAnchor="middle" fontFamily={FONTS.spacemono} fontWeight={700} fontSize={Math.min(segH * 0.85, sw * 0.2)} fill={p.background}>
                  +{delta} PTS
                </text>
              </g>
            )}
            <text
              x={cx}
              y={h - pad - labelH * 0.3}
              textAnchor="middle"
              fontFamily={FONTS.spacemono}
              fontSize={labelSize}
              letterSpacing={labelSize * 0.06}
              fill={isWin ? p.pop : hexA(p.textColor, 0.7)}
            >
              {name.toUpperCase().slice(0, 9)}
            </text>
          </g>
        );
      })}
      <line x1={pad} x2={w - pad} y1={bot + 1} y2={bot + 1} stroke={hexA(p.textColor, 0.2)} strokeWidth={Math.max(1, h * 0.004)} />
    </svg>
  );
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

export default function RoasCaseStudy(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.09);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.5 : 0.46);
  const statLen = Math.max(3, p.stat.length);
  const stat = Math.min(colW / (statLen * 0.98), stacked ? W * 0.17 : H * (strip ? 0.42 : 0.27));
  const head = Math.min(stacked ? W * 0.05 : H * (strip ? 0.095 : 0.066), colW * 0.08);
  const small = Math.max(head * (stacked ? 0.48 : 0.44), 12);

  // Hero box: right-anchored on wide layouts, top band when stacked.
  const vw = stacked ? W - pad * 2 : strip ? Math.min(W * 0.38, H * 2.2) : Math.min(W * 0.42, H * 1.0);
  const vh = stacked ? H * 0.36 : strip ? H - pad * 1.6 : Math.min(H * 0.62, vw * 0.78);
  const vx = stacked ? pad : W - pad - vw;
  const vy = stacked ? pad : (H - vh) / 2;
  const chipSize = Math.max(small * 0.85, 11);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.06 : 0.1, size: Math.round(Math.min(W, H) / 22), color: dark ? '255,233,214' : '30,20,30' }}
        lift={hexA(p.accent, 0.08)}
        glows={[
          { x: vx + vw * 0.5, y: vy + vh * 0.3, size: vw * 1.9, color: hexA(p.accent2, 0.45), opacity: 0.75 },
          { x: stacked ? W * 0.5 : pad + colW * 0.3, y: stacked ? H * 0.7 : H * 0.42, size: Math.max(W, H) * 0.7, color: hexA(p.pop, 0.22), opacity: 0.6 },
          { x: W * 0.1, y: H * 1.05, size: Math.max(W, H) * 0.8, color: hexA(p.accent, 0.3), opacity: 0.6 },
        ]}
        grain={0.06}
        vignette={0.5}
      />
      {/* horizon band behind the console */}
      {!stacked && <div style={{ position: 'absolute', left: 0, right: 0, top: vy + vh * 0.55, height: H, background: `linear-gradient(180deg, ${hexA(p.surface, 0.5)} 0%, ${hexA(p.background, 0)} 55%)` }} />}
      <Mixdown x={vx} y={vy} w={vw} h={vh} p={p} compact={strip} />
      {p.chip && !strip && (
        <div
          style={{
            position: 'absolute',
            right: W - (vx + vw) + vw * 0.05,
            top: stacked ? vy - chipSize * 2.0 : vy + vh - chipSize * 1.3,
            display: 'flex',
            alignItems: 'center',
            gap: chipSize * 0.6,
            padding: `${chipSize * 0.6}px ${chipSize * 1}px`,
            borderRadius: 999,
            fontFamily: FONTS.spacemono,
            fontWeight: 700,
            fontSize: chipSize,
            whiteSpace: 'nowrap',
            color: p.background,
            background: `linear-gradient(180deg, ${p.textColor}, ${hexA(p.textColor, 0.88)})`,
            boxShadow: `0 ${chipSize}px ${chipSize * 3}px rgba(0,0,0,0.4)`,
            rotate: '-3deg',
          }}
        >
          <span style={{ width: chipSize * 0.55, height: chipSize * 0.55, borderRadius: '50%', background: p.accent2, boxShadow: `0 0 ${chipSize * 0.6}px ${p.accent2}` }} />
          {p.chip}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: vy + vh + pad * 0.55, bottom: pad * 0.7, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', textAlign: 'center' as const }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.7 }}>
          {p.logo && <img src={p.logo} alt="" style={{ height: small * 1.6, objectFit: 'contain' }} />}
          <div style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.88, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.accent }}>{p.eyebrow}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: small * 0.8, marginTop: small * 0.35, flexWrap: strip ? 'nowrap' : 'wrap', justifyContent: stacked ? 'center' : 'flex-start' }}>
          <div
            style={{
              fontFamily: FONTS.monoton,
              fontSize: stat,
              lineHeight: 1.08,
              whiteSpace: 'nowrap',
              color: p.pop,
              textShadow: `0 0 ${stat * 0.08}px ${hexA(p.accent, 0.9)}, 0 0 ${stat * 0.32}px ${hexA(p.accent2, 0.6)}`,
            }}
          >
            {p.stat}
          </div>
        </div>
        <div style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.95, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.textColor, opacity: 0.85, marginTop: -stat * 0.02 }}>{p.statLabel}</div>
        <div
          style={{
            ...displayFace('syne'),
            fontSize: head,
            lineHeight: 1.04,
            letterSpacing: '-0.02em',
            marginTop: small * 0.75,
            ...gradientText(`linear-gradient(165deg, ${p.textColor} 45%, ${p.accent} 130%)`, head),
            marginBottom: -head * 0.2,
          }}
        >
          {p.headline}
        </div>
        {!strip && <div style={{ fontSize: small, lineHeight: 1.45, opacity: 0.8, marginTop: small * 0.6, maxWidth: colW * 0.94 }}>{p.body}</div>}
        {!strip && (p.cta || p.url) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small, marginTop: small * 1.2 }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.62}px ${small * 1.3}px`,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: small * 0.92,
                  color: p.background,
                  background: `linear-gradient(180deg, ${p.pop}, ${p.accent})`,
                  boxShadow: `0 ${small * 0.5}px ${small * 2}px ${hexA(p.accent, 0.4)}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.url && <span style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.8, letterSpacing: '0.12em', opacity: 0.75 }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
