import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'API Beta Launch',
  description: 'Launch banner for the Benchwire Run API beta: a live terminal card running a protocol above a 96-well plate filling with chartreuse, beside a pixel-type headline and CTA.',
  tags: ['hero', 'social', 'launch', 'api', 'lab'],
};

export const schema = z.object({
  eyebrow: text().default('Run API · Public beta'),
  headline: text().default('Your next 1,000 experiments, one API call away.'),
  body: textarea().default('Send a protocol. Robot scientists in our Basel lab run it around the clock and stream the data back.'),
  cta: text('Button (empty to hide)').default('Request an API key'),
  command: text('Terminal command').default('benchwire run elisa-titration.yaml'),
  log1: text('Log line 1').default('protocol validated · 34 steps'),
  log2: text('Log line 2').default('workcell BSL-07 assigned'),
  log3: text('Log line 3').default('reading plate 3/4 · A1–H12'),
  chip1: text('Chip 1').default('412 runs queued'),
  chip2: text('Chip 2').default('median 6h 20m'),
  progress: z.number().min(0).max(96).default(42).describe(JSON.stringify({ ui: 'number', label: 'Wells done', step: 1 })),
  font: font('Headline font').default('vt323'),
  background: color().default('#0D1B1E'),
  surface: color('Panel').default('#16302F'),
  textColor: color('Text').default('#EAF4EF'),
  accent: color('Live').default('#D4FF3A'),
  accent2: color('Grid').default('#3FA7A0'),
  pop: color('Reading well').default('#FF5A36'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'deep-sea': { background: '#021B26', surface: '#06303F', textColor: '#E6FFFA', accent: '#2EF2C4', accent2: '#1B7FA6', pop: '#FF7A59' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', textColor: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', pop: '#FFFFFF', headline: 'Protocols in. Data out. By morning.' },
  nordic: { background: '#E9EEF1', surface: '#D3DDE3', textColor: '#17242E', accent: '#2F6F8F', accent2: '#A7C4D4', pop: '#E4572E', font: 'mono', headline: 'A robot lab behind every API call.' },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', textColor: '#F0FFE0', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', progress: 84, eyebrow: 'Now in beta · 2,000 seats', chip1: '1,180 runs queued' },
  minimal: { body: '', chip1: '', chip2: '', eyebrow: 'Run API' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** 96-well plate: done wells glow, the reading well is the pop colour, the rest are empty rings. */
function Plate({ x, y, w, p }: { x: number; y: number; w: number; p: P }) {
  const pitch = w / 13.4;
  const h = pitch * 9.6;
  const r = pitch * 0.34;
  const dark = isDark(p.background);
  const labels = pitch > 13;
  const ox = x + pitch * 1.3;
  const oy = y + pitch * 1.3;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <filter id="bw-plate-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={pitch * 0.18} />
          </filter>
        </defs>
        {/* hard offset shadow + plate body with chamfered corner */}
        <path d={plateD(pitch * 0.35, pitch * 0.45, w, h, pitch)} fill={hexA('#000000', dark ? 0.45 : 0.12)} />
        <path d={plateD(0, 0, w, h, pitch)} fill={p.surface} stroke={hexA(p.accent2, 0.7)} strokeWidth={Math.max(1, pitch * 0.06)} />
        {labels &&
          'ABCDEFGH'.split('').map((l, i) => (
            <text key={l} x={x - x + pitch * 0.6} y={oy - y + i * pitch + pitch * 0.18} fontFamily={FONTS.silkscreen} fontSize={pitch * 0.42} fill={hexA(p.textColor, 0.55)} textAnchor="middle">
              {l}
            </text>
          ))}
        {Array.from({ length: 96 }, (_, i) => {
          const c = i % 12;
          const rr = Math.floor(i / 12);
          // fill column by column, like a plate reader
          const order = c * 8 + rr;
          const cx = ox - x + c * pitch;
          const cy = oy - y + rr * pitch;
          const done = order < p.progress;
          const reading = order === Math.floor(p.progress);
          return (
            <g key={i}>
              {(done || reading) && <circle cx={cx} cy={cy} r={r * 1.5} fill={reading ? p.pop : p.accent} opacity={reading ? 0.6 : 0.28} filter="url(#bw-plate-glow)" />}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={done ? p.accent : reading ? p.pop : hexA(p.background, 0.55)}
                stroke={done || reading ? 'none' : hexA(p.accent2, 0.75)}
                strokeWidth={Math.max(1, pitch * 0.06)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function plateD(dx: number, dy: number, w: number, h: number, pitch: number) {
  const c = pitch * 0.7;
  const rr = pitch * 0.3;
  return `M${dx + c},${dy} H${dx + w - rr} Q${dx + w},${dy} ${dx + w},${dy + rr} V${dy + h - rr} Q${dx + w},${dy + h} ${dx + w - rr},${dy + h} H${dx + rr} Q${dx},${dy + h} ${dx},${dy + h - rr} V${dy + c} Z`;
}

/** Terminal card: title bar, command, three log lines and a block cursor. */
function Terminal({ x, y, w, p }: { x: number; y: number; w: number; p: P }) {
  const fs = Math.max(11, w * 0.034);
  const dark = isDark(p.background);
  const lines = [
    { mark: '✓', text: p.log1, c: p.accent2 },
    { mark: '→', text: p.log2, c: p.accent2 },
    { mark: '●', text: p.log3, c: p.pop },
  ].filter((l) => l.text);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        borderRadius: fs * 0.6,
        background: dark ? hexA(p.background, 0.96) : hexA('#ffffff', 0.96),
        border: `1px solid ${hexA(p.accent2, 0.55)}`,
        boxShadow: `${fs * 0.5}px ${fs * 0.6}px 0 ${hexA('#000000', dark ? 0.45 : 0.12)}, 0 0 ${fs * 4}px ${hexA(p.accent2, 0.18)}`,
        overflow: 'hidden',
        fontFamily: FONTS.mono,
        fontSize: fs,
        color: p.textColor,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: fs * 0.45, padding: `${fs * 0.55}px ${fs * 0.8}px`, background: hexA(p.accent2, 0.16), borderBottom: `1px solid ${hexA(p.accent2, 0.35)}` }}>
        {[p.pop, p.accent2, p.accent].map((c, i) => (
          <span key={i} style={{ width: fs * 0.55, height: fs * 0.55, borderRadius: '50%', background: c, opacity: 0.9 }} />
        ))}
        <span style={{ marginLeft: fs * 0.5, fontFamily: FONTS.silkscreen, fontSize: fs * 0.62, letterSpacing: '0.18em', opacity: 0.7, textTransform: 'uppercase' }}>benchwire — run</span>
      </div>
      <div style={{ padding: `${fs * 0.8}px ${fs * 0.9}px ${fs * 0.9}px`, lineHeight: 1.65 }}>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ color: p.accent }}>$ </span>
          {p.command}
        </div>
        {lines.map((l, i) => (
          <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.82 }}>
            <span style={{ color: l.c }}>{l.mark} </span>
            {l.text}
          </div>
        ))}
        <span style={{ display: 'inline-block', width: fs * 0.6, height: fs * 1.05, background: p.accent, verticalAlign: 'middle', boxShadow: `0 0 ${fs}px ${hexA(p.accent, 0.8)}` }} />
      </div>
    </div>
  );
}

function Chip({ x, right, y, size, label, p, live }: { x?: number; right?: number; y: number; size: number; label: string; p: P; live?: boolean }) {
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
        gap: size * 0.6,
        padding: `${size * 0.6}px ${size * 0.95}px`,
        fontFamily: FONTS.silkscreen,
        fontSize: size,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        color: p.textColor,
        background: dark ? hexA(p.surface, 0.92) : hexA('#ffffff', 0.9),
        border: `1px solid ${hexA(live ? p.accent : p.accent2, 0.7)}`,
        boxShadow: `${size * 0.35}px ${size * 0.4}px 0 ${hexA('#000000', dark ? 0.5 : 0.12)}`,
      }}
    >
      <span style={{ width: size * 0.6, height: size * 0.6, background: live ? p.accent : p.accent2, boxShadow: live ? `0 0 ${size}px ${p.accent}` : undefined }} />
      {label}
    </div>
  );
}

export default function ApiBetaLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pixel = p.font === 'vt323' || p.font === 'silkscreen';

  // Layout boxes
  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.56 : 0.46);
  const headRaw = stacked ? W * 0.068 : H * (strip ? 0.2 : 0.125);
  const head = Math.round(Math.min(headRaw, colW * (pixel ? 0.15 : 0.1)));
  const small = Math.max(Math.round(head * (pixel ? 0.26 : 0.3)), 13);

  // Hero: a big plate on the right with the terminal card overlapping its top-left corner.
  const heroX = stacked ? pad : W * 0.53;
  const heroW = stacked ? W - pad * 2 : W - heroX - pad * 0.8;
  const plateW = strip ? Math.min(heroW * 0.72, H * 0.74 * 1.4) : stacked ? W * 0.5 : heroW * 0.84;
  const plateH = (plateW / 13.4) * 9.6;
  const plateX = W - pad - plateW;
  const termW = stacked ? W * 0.5 : heroW * 0.58;
  const termFs = Math.max(11, termW * 0.034);
  const termH = termFs * 12.8;
  const termX = stacked ? pad : heroX + heroW * 0.02;
  // The terminal docks onto the plate's top-left corner, covering only the top edge.
  const plateY = strip ? (H - plateH) / 2 : stacked ? H * 0.06 + termH - termFs * 1.2 : H * 0.5 - plateH / 2 + H * 0.12;
  const termTop = stacked ? H * 0.06 : Math.max(H * 0.05, plateY - termH + termFs * 1.2);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.mono }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.09 : 0.14, size: Math.round(Math.min(W, H) / 26), color: dark ? '63,167,160' : '23,36,46', fade: 0.9 }}
        lift={dark ? 'rgba(234,244,239,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: plateX + plateW / 2, y: plateY + plateH / 2, size: plateW * 2, color: hexA(p.accent2, dark ? 0.32 : 0.2), opacity: 0.9 },
          { x: plateX + plateW * 0.3, y: plateY + plateH * 0.4, size: plateW * 1.1, color: hexA(p.accent, dark ? 0.16 : 0.1), opacity: 0.8 },
          { x: stacked ? W * 0.15 : W * 0.1, y: H, size: Math.max(W, H) * 0.7, color: hexA(p.accent2, 0.14), opacity: 0.7 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.5 : 0.08}
      />
      {/* CRT scanlines */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, ${hexA('#000000', dark ? 0.16 : 0.04)} 0 1px, transparent 1px ${Math.max(3, Math.round(H / 220))}px)`, pointerEvents: 'none' }} />

      <Plate x={plateX} y={plateY} w={plateW} p={p} />
      {!strip && <Terminal x={termX} y={termTop} w={termW} p={p} />}
      {!strip && !stacked && <Chip right={pad * 0.8} y={plateY - small * 2.3} size={small * 0.72} label={p.chip1} p={p} live />}
      {!strip && !stacked && <Chip x={plateX} y={plateY + plateH + small * 0.7} size={small * 0.72} label={p.chip2} p={p} />}
      {stacked && <Chip x={pad} y={termTop + termH + small * 1.2} size={small * 0.72} label={p.chip1} p={p} live />}
      {stacked && <Chip x={pad} y={termTop + termH + small * 3.6} size={small * 0.72} label={p.chip2} p={p} />}
      {strip && <Chip right={pad + plateW + small * 0.8} y={plateY + plateH - small * 1.9} size={small * 0.72} label={p.chip1} p={p} live />}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.62 } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: 'flex-start', display: 'block' }} />}
        {p.eyebrow && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.55, fontFamily: FONTS.silkscreen, fontSize: Math.round(small * 0.78), letterSpacing: '0.24em', textTransform: 'uppercase', color: dark ? p.accent : p.textColor }}>
            <span style={{ width: small * 0.55, height: small * 0.55, background: p.pop, boxShadow: `0 0 ${small}px ${hexA(p.pop, 0.8)}` }} />
            {p.eyebrow}
          </div>
        )}
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: pixel ? 0.92 : 1.05,
            letterSpacing: pixel ? '0' : '-0.03em',
            marginTop: small * 0.6,
            color: p.textColor,
            textShadow: dark ? `0 0 ${head * 0.25}px ${hexA(p.accent2, 0.45)}` : undefined,
          }}
        >
          {p.headline}
          <span style={{ display: 'inline-block', width: head * 0.42, height: head * 0.72, marginLeft: head * 0.12, background: p.accent, verticalAlign: '-0.05em', boxShadow: dark ? `0 0 ${head * 0.3}px ${hexA(p.accent, 0.7)}` : undefined }} />
        </div>
        {!strip && p.body && <div style={{ fontSize: small, lineHeight: 1.5, opacity: 0.8, marginTop: small * 0.8, maxWidth: colW * 0.92 }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', marginTop: small * (strip ? 0.8 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.65}px ${small * 1.2}px`,
                fontFamily: FONTS.mono,
                fontWeight: 700,
                fontSize: small,
                color: dark ? p.background : '#FFFFFF',
                background: dark ? p.accent : p.textColor,
                boxShadow: `${small * 0.3}px ${small * 0.35}px 0 ${dark ? hexA(p.accent2, 0.55) : hexA(p.accent, 0.9)}`,
                whiteSpace: 'nowrap',
              }}
            >
              {'> '}
              {p.cta}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
