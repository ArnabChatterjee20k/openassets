import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, clamp, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Customer Quote',
  category: 'quote',
  description:
    'Square testimonial for social: a chunky arcade quote mark pops on the beat, the quote rises word by word, the key phrase gets an acid marker swipe, then the customer, their stat and your logo land.',
  tags: ['quote', 'testimonial', 'customer story', 'saas', 'social', 'square'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Customer story · Fernpay'),
  quote: textarea().default('We went from two deploys a week to forty a day. Rolling back is now a toggle, not a war room.'),
  highlight: text('Highlighted phrase').default('forty a day'),
  name: text().default('Priya Raman'),
  role: text().default('VP Engineering, Fernpay'),
  photo: image('Headshot (optional)').default(''),
  statLabel: text('Stat label').default('Deploys / day'),
  statFrom: num(0, 999, 1, 'Stat before').default(2),
  statTo: num(0, 999, 1, 'Stat after').default(40),
  brand: text('Brand').default('Strobe'),
  url: text('URL').default('strobe.dev'),
  background: color().default('#0B0B0B'),
  surface: color('Card').default('#1A1A1A'),
  textColor: color('Text').default('#F0FFE0'),
  accent: color('Accent').default('#C6FF00'),
  accent2: color('Laser').default('#FF00E5'),
  pop: color('Live dot').default('#00F0FF'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { background: '#12001F', surface: '#24003D', textColor: '#FBEFFF', accent: '#B026FF', accent2: '#FF2E88', pop: '#FFD600' },
  lava: {
    background: '#1A0A06',
    surface: '#2E120B',
    textColor: '#FFEDE0',
    accent: '#FF4D00',
    accent2: '#FFB000',
    pop: '#FF2E63',
    eyebrow: 'Customer story · Loomly',
    quote: 'Our checkout redesign went to 5% of shoppers on a Friday. By Monday it was at 100% and revenue was up 9%.',
    highlight: 'revenue was up 9%',
    name: 'Tomás Ferreira',
    role: 'Head of Product, Loomly',
    statLabel: 'Revenue lift %',
    statFrom: 0,
    statTo: 9,
  },
  deepsea: { background: '#021B26', surface: '#06303F', textColor: '#E6FFFA', accent: '#2EF2C4', accent2: '#1B7FA6', pop: '#FF7A59' },
};

type P = z.infer<typeof schema>;

const shade = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (to - v) * k).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};

/** Nabla's colour layers flattened to currentColor so it renders identically everywhere. */
const NABLA_CSS = `@font-palette-values --strobe-flat { font-family: 'Nabla'; override-colors: ${Array.from({ length: 32 }, (_, i) => `${i} currentColor`).join(', ')}; }`;

/** Arcade block letters: stacked hard shadows (isometric extrusion) + offset laser shadow. */
const arcade = (face: string, side: string, laser: string, size: number): CSSProperties => {
  const depth = Math.max(3, Math.round(size * 0.07));
  const s = Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`);
  s.push(`${depth + size * 0.05}px ${depth + size * 0.05}px 0 ${laser}`);
  return { fontFamily: FONTS.nabla, fontPalette: '--strobe-flat', color: face, textShadow: s.join(', ') } as CSSProperties;
};

const BAR = T.bars(1);
const MARK_AT = T.beats(1); // quote mark pops on beat 2 of bar 1
const WORDS_AT = T.beats(1.5);
const MARKER_AT = BAR; // downbeat bar 2
const WHO_AT = T.bars(2); // downbeat bar 3
const STAT_AT = T.bars(2) + T.beats(1);
const END_AT = T.bars(3); // downbeat bar 4
const OUT_AT = T.bars(4) - 34;

export default function CustomerQuote(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const out = prog(frame, OUT_AT, 34, ease.in);

  const words = p.quote.split(/\s+/).filter(Boolean);
  const hl = p.highlight.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let hlStart = -1;
  if (hl.length) {
    const norm = words.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}%$]/gu, ''));
    for (let i = 0; i + hl.length <= norm.length && hlStart < 0; i++) {
      if (hl.every((h, k) => norm[i + k] === h.replace(/[^\p{L}\p{N}%$]/gu, ''))) hlStart = i;
    }
  }
  const qSize = p.quote.length > 120 ? 44 : p.quote.length > 90 ? 50 : 58;
  const marker = prog(frame, MARKER_AT, 26, ease.inOutSoft);

  const flash = keys(frame, [MARK_AT - 2, MARK_AT + 1, MARK_AT + 18], [0, 1, 0], [ease.out, ease.outSoft]) + keys(frame, [WHO_AT - 2, WHO_AT + 1, WHO_AT + 14], [0, 0.6, 0], [ease.out, ease.outSoft]);
  const markIn = prog(frame, MARK_AT, 22, ease.backOut);
  const push = mix(1, 1.04, prog(frame, 0, OUT_AT, ease.inOutSoft));

  // Laser fan that sweeps slowly from bar 2.
  const sweep = mix(-18, 22, prog(frame, MARKER_AT - 20, T.bars(2), ease.inOutSoft));
  const laserOn = (0.25 + 0.75 * prog(frame, MARKER_AT - 10, 30)) * (1 - out);

  const statT = prog(frame, STAT_AT, 44, ease.out);
  const stat = Math.round(mix(p.statFrom, p.statTo, statT));
  const statIn = prog(frame, STAT_AT, 22, ease.backOut);
  const whoIn = prog(frame, WHO_AT, 30, ease.out);
  const endIn = prog(frame, END_AT, 28, ease.backOut);
  const initials = p.name.split(/\s+/).map((s) => s[0] ?? '').join('').slice(0, 2).toUpperCase();

  const label: CSSProperties = { fontFamily: FONTS.pressstart, fontSize: 20, letterSpacing: '0.14em', textTransform: 'uppercase' };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, overflow: 'hidden' }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.08, size: 40, y: -frame * 0.15, color: '240,255,224' }}
        glows={[
          { x: W * 0.15, y: H * 0.25, size: 900, color: hexA(p.accent2, 0.4), opacity: 0.55 + 0.25 * Math.sin(frame / 40) },
          { x: W * 0.9, y: H * 0.95, size: 1000, color: hexA(p.accent, 0.22), opacity: 0.4 + prog(frame, WHO_AT, 60) * 0.4 },
        ]}
        grain={0}
        vignette={0.5}
      />

      {/* Laser fan from the top-right corner */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: laserOn * 0.7 }}>
        <defs>
          <linearGradient id="cq-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.accent2} stopOpacity="1" />
            <stop offset="1" stopColor={p.accent2} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cq-beam2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.pop} stopOpacity="1" />
            <stop offset="1" stopColor={p.pop} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 34, 48, 62, 76].map((a, i) => (
          <rect key={i} x={W + 20} y={-20} width={4} height={1700} fill={`url(#${i % 2 ? 'cq-beam2' : 'cq-beam'})`} transform={`rotate(${a + sweep + Math.sin(frame / 30 + i) * 2} ${W + 20} -20)`} />
        ))}
      </svg>

      <AbsoluteFill style={{ scale: String(push * mix(1, 0.96, out)), opacity: 1 - out, filter: out > 0.01 ? `blur(${out * 12}px)` : undefined }}>
        <Dust frame={frame} width={W} height={H} count={40} color={p.accent} seed={9} speed={0.8} opacity={0.35} maxSize={4} />

        {/* Top bar */}
        <div style={{ position: 'absolute', left: 84, top: 92, display: 'flex', alignItems: 'center', gap: 16, ...label, color: p.accent, opacity: prog(frame, 6, 24), translate: `${mix(-20, 0, prog(frame, 6, 30))}px 0` }}>
          <span style={{ width: 14, height: 14, background: p.pop, boxShadow: `0 0 14px ${p.pop}`, opacity: 0.6 + 0.4 * Math.round((Math.sin(frame / 8) + 1) / 2) }} />
          {p.eyebrow}
        </div>

        {/* Giant quote mark */}
        <div
          style={{
            position: 'absolute',
            left: 66,
            top: 108,
            fontSize: 470,
            lineHeight: 1,
            ...arcade(p.accent, shade(p.accent, -0.6), p.accent2, 300),
            scale: String(mix(0.4, 1, markIn)),
            rotate: `${mix(-14, 0, markIn)}deg`,
            opacity: clamp(markIn * 3),
            transformOrigin: '30% 60%',
          }}
        >
          “
        </div>
        <Glint frame={frame} start={END_AT + 10} dur={40} style={{ position: 'absolute', left: 66, top: 108, fontSize: 470, lineHeight: 1, fontFamily: FONTS.nabla, fontPalette: '--strobe-flat' } as CSSProperties}>
          “
        </Glint>

        {/* Stat chip, top right */}
        <div
          style={{
            position: 'absolute',
            right: 84,
            top: 190,
            padding: '26px 30px 24px',
            borderRadius: 22,
            background: p.surface,
            border: `2px solid ${hexA(p.textColor, 0.14)}`,
            boxShadow: `10px 10px 0 ${p.accent2}`,
            textAlign: 'right',
            scale: String(statIn),
            opacity: clamp(statIn * 2),
            transformOrigin: '100% 0%',
          }}
        >
          <div style={{ ...label, fontSize: 16, color: hexA(p.textColor, 0.6) }}>{p.statLabel}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 18, marginTop: 14 }}>
            <span style={{ fontFamily: FONTS.rubikmono, fontSize: 40, opacity: 0.5 }}>{p.statFrom}</span>
            <span style={{ fontFamily: FONTS.pressstart, fontSize: 26, color: p.accent2 }}>→</span>
            <span style={{ fontSize: 96, lineHeight: 0.9, ...arcade(p.accent, shade(p.accent, -0.6), p.accent2, 96) }}>{stat}</span>
          </div>
        </div>

        {/* Quote, word by word, with a marker swipe on the key phrase */}
        <div style={{ position: 'absolute', left: 84, right: 84, top: 400, display: 'flex', flexWrap: 'wrap', rowGap: qSize * 0.32, fontFamily: FONTS.rubikmono, fontSize: qSize, lineHeight: 1.08, textTransform: 'uppercase' }}>
          {words.map((w, i) => {
            const t = prog(frame, WORDS_AT + i * 4, 22, ease.out);
            const inHl = hlStart >= 0 && i >= hlStart && i < hlStart + hl.length;
            const k = inHl ? clamp(marker * hl.length - (i - hlStart)) : 0;
            const lastHl = inHl && i === hlStart + hl.length - 1;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  padding: `0.08em ${lastHl ? '0.12em' : '0.32em'} 0.02em ${inHl && i === hlStart ? '0.12em' : 0}`,
                  marginLeft: inHl && i === hlStart ? '-0.12em' : 0,
                  marginRight: lastHl ? '0.2em' : 0,
                  opacity: clamp(t * 1.4),
                  translate: `0 ${(1 - t) * 30}px`,
                  filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined,
                  color: inHl && k > 0.5 ? p.background : p.textColor,
                  backgroundImage: inHl ? `linear-gradient(${p.accent}, ${p.accent})` : undefined,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${k * 100}% 100%`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* Attribution */}
        <div style={{ position: 'absolute', left: 84, right: 84, top: 812, display: 'flex', alignItems: 'center', gap: 30, opacity: whoIn, translate: `0 ${mix(30, 0, whoIn)}px` }}>
          <div style={{ position: 'relative', width: 124, height: 124, flex: 'none' }}>
            <svg width={124} height={124} style={{ position: 'absolute', inset: 0, rotate: `${frame * 0.6}deg` }}>
              <circle cx={62} cy={62} r={59} fill="none" stroke={p.accent} strokeWidth={4} strokeDasharray="10 8" />
            </svg>
            <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', overflow: 'hidden', background: p.accent2, display: 'grid', placeItems: 'center' }}>
              {p.photo ? (
                <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: FONTS.rubikmono, fontSize: 38, color: p.background }}>{initials}</span>
              )}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONTS.rubikmono, fontSize: p.name.length > 16 ? 42 : 54, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.name}</div>
            <div style={{ fontFamily: FONTS.rubikmono, fontSize: p.role.length > 26 ? 26 : 30, marginTop: 12, color: hexA(p.textColor, 0.65), textTransform: 'uppercase' }}>{p.role}</div>
          </div>
        </div>

        {/* End card: brand pill bottom-right */}
        <div
          style={{
            position: 'absolute',
            right: 84,
            bottom: 66,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            scale: String(endIn),
            opacity: clamp(endIn * 2),
            transformOrigin: '100% 50%',
          }}
        >
          <span style={{ ...label, fontSize: 18, color: hexA(p.textColor, 0.7) }}>{p.url}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16, height: 64, padding: '0 8px 0 28px', borderRadius: 64, background: p.accent, boxShadow: `0 0 40px ${hexA(p.accent, 0.4)}` }}>
            <span style={{ fontFamily: FONTS.rubikmono, fontSize: 26, color: p.background, textTransform: 'uppercase' }}>{p.brand}</span>
            <span style={{ width: 50, height: 50, borderRadius: '50%', background: p.background }} />
          </span>
        </div>
      </AbsoluteFill>

      {/* Strobe bars flash on the hits */}
      <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: clamp(flash) * 0.5 }}>
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: (i / 14) * H, height: 10 + (i % 3) * 8, background: p.accent }} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 25% 30%, ${hexA(p.accent, clamp(flash) * 0.45)} 0%, transparent 60%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.4} frame={frame} />
    </AbsoluteFill>
  );
}
