import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, gradientText, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: '31 Platforms Launch',
  description: 'Launch banner for Crossfade: neon Monoton wordmark and headline beside a mixing console whose channel strips are ad platforms, with a striped sunset behind it.',
  tags: ['launch', 'hero', 'social', 'ads', 'mixer', 'platforms'],
};

export const schema = z.object({
  wordmark: text('Wordmark').default('CROSSFADE'),
  eyebrow: text().default('Now mixing · 31 ad platforms'),
  headline: text().default('One brief. 31 platforms. Mixed live.'),
  body: textarea().default('Your AI agent builds, launches and rebalances campaigns across Google, Meta, TikTok, LinkedIn and 27 more while you sleep.'),
  cta: text('Button (empty to hide)').default('Start free for 14 days'),
  url: text('URL').default('crossfade.ai'),
  channels: text('Channels (comma separated)').default('Google,Meta,TikTok,LinkedIn,Reddit,Snap,YouTube,Pinterest'),
  chip: text('Agent chip (empty to hide)').default('Agent moved $4.2k → TikTok'),
  background: color().default('#2B1B2E'),
  surface: color('Console').default('#45293F'),
  accent: color().default('#FF8E5E'),
  accent2: color('Second accent').default('#E5487A'),
  pop: color('Peak / sun').default('#FFD27F'),
  textColor: color('Text').default('#FFE9D6'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { background: '#12001F', surface: '#24003D', accent: '#B026FF', accent2: '#FF2E88', pop: '#FFD600', textColor: '#FBEFFF' },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', textColor: '#F0FFE0', headline: 'Drop the spreadsheet. Ride the faders.' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', accent: '#C9A45C', accent2: '#6E6A62', pop: '#E8D9B5', textColor: '#F3EDE2', eyebrow: 'Private beta · Agencies', cta: 'Book a demo' },
  sorbet: { background: '#3D0E2A', surface: '#5A1A3F', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', textColor: '#FFEDE1', chip: '', body: 'Plug in your accounts. Write one brief. Watch the agent mix spend toward what works.' },
};

type P = z.infer<typeof schema> & BannerSize;

/** The hero: a mixing console where every channel strip is an ad platform. */
function Console({ x, y, w, h, names, p }: { x: number; y: number; w: number; h: number; names: string[]; p: P }) {
  const n = names.length;
  const pad = w * 0.045;
  const iw = w - pad * 2;
  const sw = iw / n;
  const top = pad * 1.3;
  const labelH = Math.max(sw * 0.42, h * 0.1);
  const slotTop = top + sw * 0.62;
  const slotBot = h - pad - labelH;
  const SEG = 12;
  const segH = (slotBot - slotTop) / SEG;
  const winner = Math.min(2, n - 1); // the channel the agent is pushing
  const labelSize = Math.min(sw * 0.15, h * 0.045);
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="cs-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.surface} />
          <stop offset="1" stopColor={p.background} />
        </linearGradient>
      </defs>
      {/* drop shadow + body */}
      <rect x={w * 0.02} y={h * 0.04} width={w} height={h} rx={w * 0.04} fill="#000" opacity={0.35} />
      <rect width={w} height={h} rx={w * 0.04} fill="url(#cs-body)" stroke={hexA(p.textColor, 0.16)} strokeWidth={Math.max(1, w * 0.003)} />
      <rect x={w * 0.01} y={w * 0.008} width={w * 0.98} height={h * 0.18} rx={w * 0.035} fill={hexA(p.textColor, 0.05)} />
      {names.map((name, i) => {
        const cx = pad + sw * i;
        const isWin = i === winner;
        const level = isWin ? 0.92 : 0.35 + rand(i * 4.7 + 2) * 0.45;
        const capY = slotBot - (slotBot - slotTop) * level;
        const slotX = cx + sw * 0.36;
        const meterX = cx + sw * 0.66;
        const lit = Math.round(level * SEG);
        return (
          <g key={i}>
            {i > 0 && <line x1={cx} y1={top * 0.8} x2={cx} y2={h - pad * 0.8} stroke={hexA(p.textColor, 0.08)} strokeWidth={1} />}
            {/* gain knob */}
            <circle cx={cx + sw / 2} cy={top + sw * 0.2} r={sw * 0.17} fill={hexA(p.textColor, 0.85)} />
            <line
              x1={cx + sw / 2}
              y1={top + sw * 0.2}
              x2={cx + sw / 2 + Math.cos(-2.4 + level * 3.6) * sw * 0.15}
              y2={top + sw * 0.2 + Math.sin(-2.4 + level * 3.6) * sw * 0.15}
              stroke={p.background}
              strokeWidth={Math.max(1.5, sw * 0.035)}
              strokeLinecap="round"
            />
            {/* fader slot + cap */}
            <rect x={slotX - sw * 0.025} y={slotTop} width={sw * 0.05} height={slotBot - slotTop} rx={sw * 0.025} fill="#0B0509" opacity={0.85} />
            <rect
              x={slotX - sw * 0.2}
              y={capY - sw * 0.1}
              width={sw * 0.4}
              height={sw * 0.2}
              rx={sw * 0.05}
              fill={isWin ? p.accent : hexA(p.textColor, 0.92)}
              style={isWin ? { filter: `drop-shadow(0 0 ${sw * 0.15}px ${p.accent})` } : undefined}
            />
            <rect x={slotX - sw * 0.16} y={capY - sw * 0.008} width={sw * 0.32} height={Math.max(1, sw * 0.016)} fill={isWin ? p.background : p.surface} />
            {/* LED meter */}
            {Array.from({ length: SEG }, (_, s) => {
              const on = s < lit;
              const c = s === SEG - 1 ? p.pop : s >= SEG - 4 ? p.accent2 : p.accent;
              return (
                <rect
                  key={s}
                  x={meterX - sw * 0.07}
                  y={slotBot - (s + 1) * segH + segH * 0.18}
                  width={sw * 0.14}
                  height={segH * 0.64}
                  rx={segH * 0.12}
                  fill={on ? c : hexA(p.textColor, 0.08)}
                  style={on && s >= lit - 1 ? { filter: `drop-shadow(0 0 ${sw * 0.08}px ${c})` } : undefined}
                />
              );
            })}
            {/* channel label */}
            <text
              x={cx + sw / 2}
              y={h - pad - labelH * 0.35}
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
    </svg>
  );
}

/** Retro striped sun sitting behind the console. */
function Sun({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: P }) {
  // Stripes thicken toward the horizon (just above the console's top edge).
  const stripes = [-0.5, -0.36, -0.23, -0.11, 0.0, 0.1];
  return (
    <svg style={{ position: 'absolute', left: cx - r, top: cy - r, overflow: 'visible' }} width={r * 2} height={r * 2}>
      <defs>
        <linearGradient id="sun-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.pop} />
          <stop offset="0.5" stopColor={p.accent} />
          <stop offset="1" stopColor={p.accent2} />
        </linearGradient>
        <mask id="sun-m">
          <rect width={r * 2} height={r * 2} fill="#fff" />
          {stripes.map((k, i) => (
            <rect key={i} x={0} y={r + r * k} width={r * 2} height={r * (0.03 + i * 0.022)} fill="#000" />
          ))}
        </mask>
      </defs>
      <circle cx={r} cy={r} r={r * 1.5} fill={hexA(p.accent, 0.12)} />
      <circle cx={r} cy={r} r={r} fill="url(#sun-g)" mask="url(#sun-m)" />
    </svg>
  );
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

export default function PlatformsLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const all = p.channels.split(',').map((s) => s.trim()).filter(Boolean);
  const names = (all.length ? all : ['Google']).slice(0, strip ? 6 : 8);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.09);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.46 : 0.48);
  const mark = Math.min(colW / (Math.max(6, p.wordmark.length) * 0.98), stacked ? W * 0.082 : H * (strip ? 0.2 : 0.13));
  const head = Math.min(stacked ? W * 0.05 : H * (strip ? 0.105 : 0.075), colW * 0.085);
  const small = Math.max(head * (stacked ? 0.46 : 0.42), 12);

  // Console box: right-anchored on wide layouts, top-centred when stacked.
  const cw = stacked ? W * 0.7 : strip ? Math.min(W * 0.36, H * 2.1) : Math.min(W * 0.4, H * 0.95);
  const ch = stacked ? H * 0.28 : strip ? H * 0.6 : Math.min(H * 0.56, cw * 0.7);
  const cx = stacked ? (W - cw) / 2 : W - pad - cw;
  const cy = stacked ? H * 0.17 : strip ? H * 0.3 : H * 0.33;
  const sunR = stacked ? cw * 0.3 : cw * (strip ? 0.2 : 0.36);
  const chipSize = Math.max(small * 0.82, 11);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.06 : 0.1, size: Math.round(Math.min(W, H) / 22), color: dark ? '255,233,214' : '30,20,30' }}
        lift={hexA(p.accent, 0.08)}
        glows={[
          { x: cx + cw / 2, y: cy, size: cw * 2.2, color: hexA(p.accent2, 0.45), opacity: 0.8 },
          { x: stacked ? W * 0.2 : W * 0.12, y: H * 1.05, size: Math.max(W, H) * 0.9, color: hexA(p.accent, 0.3), opacity: 0.7 },
        ]}
        grain={0.06}
        vignette={0.5}
      />
      {/* horizon line + dune bands behind the hero */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy + ch * 0.18, height: H, background: `linear-gradient(180deg, ${hexA(p.surface, 0.55)} 0%, ${hexA(p.background, 0)} 60%)` }} />
      <Sun cx={cx + cw / 2} cy={cy + sunR * 0.12} r={sunR} p={p} />
      <Console x={cx} y={cy} w={cw} h={ch} names={names} p={p} />
      {p.chip && !strip && !stacked && (
        <div
          style={{
            position: 'absolute',
            right: W - (cx + cw) - cw * 0.04,
            top: cy + ch + chipSize * 1.1,
            display: 'flex',
            alignItems: 'center',
            gap: chipSize * 0.6,
            padding: `${chipSize * 0.6}px ${chipSize * 1}px`,
            borderRadius: 999,
            fontFamily: FONTS.spacemono,
            fontSize: chipSize,
            whiteSpace: 'nowrap',
            color: p.textColor,
            background: hexA(p.surface, 0.85),
            border: `1px solid ${hexA(p.pop, 0.4)}`,
            boxShadow: `0 ${chipSize}px ${chipSize * 3}px rgba(0,0,0,0.35)`,
          }}
        >
          <span style={{ width: chipSize * 0.55, height: chipSize * 0.55, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${chipSize}px ${p.pop}` }} />
          {p.chip}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.5, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div
          style={{
            fontFamily: FONTS.spacemono,
            fontSize: small * 0.9,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: p.accent,
          }}
        >
          {p.eyebrow}
        </div>
        <div
          style={{
            fontFamily: FONTS.monoton,
            fontSize: mark,
            lineHeight: 1.05,
            marginTop: small * 0.5,
            whiteSpace: 'nowrap',
            color: p.pop,
            textShadow: `0 0 ${mark * 0.12}px ${hexA(p.accent, 0.9)}, 0 0 ${mark * 0.4}px ${hexA(p.accent2, 0.6)}`,
          }}
        >
          {p.wordmark}
        </div>
        <div
          style={{
            ...displayFace('syne'),
            fontSize: head,
            lineHeight: 1.04,
            letterSpacing: '-0.02em',
            marginTop: small * 0.55,
            ...gradientText(`linear-gradient(165deg, ${p.textColor} 45%, ${p.accent} 130%)`, head),
            marginBottom: -head * 0.2,
          }}
        >
          {p.headline}
        </div>
        {!strip && <div style={{ fontSize: small, lineHeight: 1.45, opacity: 0.8, marginTop: small * 0.7, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {(p.cta || p.url) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small, justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.3) }}>
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
