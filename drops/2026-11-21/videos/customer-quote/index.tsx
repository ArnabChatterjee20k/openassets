import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, WordsIn, clamp, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Customer Quote',
  category: 'quote',
  description:
    'Story-format customer testimonial: a Memphis frame builds, a giant quote mark drops on the beat, the quote types in word by word, a HI-SCORE board flips the before/after metric with a flash, then the customer and brand land.',
  tags: ['quote', 'testimonial', 'customer', 'story', 'memphis', 'social proof'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  label: text('Top label').default('Player review'),
  quote: textarea().default('Multiball moved $40k from Meta to TikTok over one weekend. Our ROAS nearly doubled.'),
  metricLabel: text('Metric label').default('ROAS'),
  before: text('Before').default('3.1x'),
  after: text('After').default('5.4x'),
  delta: text('Change tag').default('+74%'),
  name: text('Customer name').default('Dana Okafor'),
  role: text('Role · company').default('Head of Growth · Kiln Coffee'),
  brand: text('Brand').default('Multiball'),
  url: text('URL').default('multiball.ai'),
  photo: image('Customer photo (optional)').default(''),
  background: color().default('#FFF6E9'),
  surface: color('Card').default('#FFE3D3'),
  ink: color('Ink').default('#1A1A2E'),
  accent: color().default('#FF6F91'),
  accent2: color('Second color').default('#00B3A4'),
  pop: color('Pop').default('#FFC93C'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'after-dark': { background: '#12001F', surface: '#24003D', ink: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600' },
  agency: {
    quote: 'We run 19 client accounts on 11 platforms. Multiball gave my team back 14 hours a week.',
    metricLabel: 'HOURS / WK',
    before: '22',
    after: '8',
    delta: '-14 HRS',
    name: 'Priya Raman',
    role: 'Founder · Fieldwork Studio',
    background: '#F4EFE6',
    surface: '#EAE2D3',
    ink: '#1F2A6B',
    accent: '#FF48B0',
    accent2: '#0078BF',
    pop: '#FFE800',
  },
  citrus: {
    quote: 'Our CPA dropped by a third in two weeks, and I never opened Ads Manager once.',
    metricLabel: 'CPA',
    before: '$41',
    after: '$27',
    delta: '-34%',
    name: 'Marco Bell',
    role: 'CMO · Juniper Socks',
    background: '#FFF8E1',
    surface: '#FFE9A8',
    ink: '#1C2B1A',
    accent: '#FF7A00',
    accent2: '#2BB24C',
    pop: '#FF3D7F',
  },
};

type P = z.infer<typeof schema>;

const NABLA_CSS = `@font-palette-values --mb-flat { font-family: 'Nabla'; override-colors: ${Array.from({ length: 32 }, (_, i) => `${i} currentColor`).join(', ')}; }`;

function arcade(face: string, side: string, size: number): CSSProperties {
  const depth = Math.max(3, Math.round(size * 0.07));
  return {
    fontFamily: FONTS.nabla,
    fontPalette: '--mb-flat',
    color: face,
    textShadow: Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`).join(', '),
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
  } as CSSProperties;
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const W = 1080;
const H = 1920;
const CARD = { x: 80, y: 330, w: 920, h: 1130 };
const BAR2 = T.bars(1);
const BAR3 = T.bars(2);
const BAR4 = T.bars(3);
const BAR5 = T.bars(4);

/** Slow ambient confetti that lives behind the card. */
function Drift({ frame, p }: { frame: number; p: P }) {
  const cols = [p.accent, p.accent2, p.pop, p.ink];
  const items: ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const x = rand(i * 3.3 + 1) * W;
    const y = (((rand(i * 7.1) * H + frame * (0.5 + rand(i * 1.9) * 0.9)) % (H + 80)) + H + 80) % (H + 80) - 40;
    // Keep the customer + brand band clear: no confetti crossing the name.
    if (y > CARD.y + CARD.h + 20 && x > 20 && x < 1000) continue;
    const rot = rand(i * 5.1) * 360 + frame * (rand(i * 2.7) - 0.5) * 2;
    const k = 1.6 + rand(i * 4.4) * 1.4;
    const c = cols[i % 4];
    const kind = i % 4;
    items.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
        {kind === 0 && <path d="M-18,0 q4.5,-8 9,0 t9,0 t9,0 t9,0" fill="none" stroke={c} strokeWidth="4.5" strokeLinecap="round" />}
        {kind === 1 && <path d="M0,-10 L10,8 L-10,8 Z" fill={c} stroke={p.ink} strokeWidth="2" strokeLinejoin="round" />}
        {kind === 2 && <circle r="7" fill="none" stroke={c} strokeWidth="4" />}
        {kind === 3 && <rect x="-2.5" y="-11" width="5" height="22" rx="2.5" fill={c} />}
      </g>,
    );
  }
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: prog(frame, 20, 60) }}>
      {items}
    </svg>
  );
}

export default function CustomerQuote(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const onPop = isDark(p.pop) ? '#FFFFFF' : '#1A1A2E';

  // Bar 1: frame build.
  const blockA = prog(frame, 0, 34, ease.out);
  const blockB = prog(frame, 8, 34, ease.out);
  const card = prog(frame, T.beats(1), 30, ease.backOut);
  const label = prog(frame, T.beats(2), 20, ease.out);
  // Bar 2: quote mark drop on the downbeat.
  const markDrop = prog(frame, BAR2 - 10, 20, ease.backOut);
  // Bar 3: score flip with flash.
  const flip = prog(frame, BAR3, 14, ease.inOut);
  const flash = keys(frame, [BAR3 - 1, BAR3 + 2, BAR3 + 24], [0, 1, 0], [ease.out, ease.outSoft]);
  const boardIn = prog(frame, BAR3 - T.beats(2), 26, ease.out);
  // Bar 4: customer.
  const person = prog(frame, BAR4, 30, ease.out);
  const brand = prog(frame, BAR4 + T.beats(2), 24, ease.out);
  // Life + exit.
  const push = mix(1, 1.035, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 24, 24, ease.in);
  const shake = frame >= BAR3 && frame < BAR3 + 12 ? Math.sin(frame * 2.1) * (1 - (frame - BAR3) / 12) * 8 : 0;

  // Rubik Mono is very wide (~0.95em per glyph): size by length so the quote clears the board.
  const quoteSize = p.quote.length > 110 ? 48 : p.quote.length > 84 ? 53 : 58;
  const initials = p.name
    .split(/\s+/)
    .map((s) => s[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const value = frame < BAR3 + 7 ? p.before : p.after;
  const VAL = Math.max(p.before.length, p.after.length) > 4 ? 150 : 196;
  const boardTop = CARD.y + CARD.h - 370;
  const valStyle: CSSProperties = { position: 'absolute', left: CARD.x + 100, top: boardTop + 96, fontSize: VAL, lineHeight: 1 };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, overflow: 'hidden' }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.14 : 0.2, size: 44, y: -frame * 0.25, color: dark ? '255,255,255' : '26,26,46', fade: 1 }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={dark ? [{ x: 540, y: 900, size: 1500, color: hexA(p.accent, 0.3), opacity: 0.6 + 0.2 * Math.sin(frame / 40) }] : []}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${-outro * 60}px`, opacity: 1 - outro }}>
        {/* Memphis blocks slide in from the edges */}
        <div style={{ position: 'absolute', right: mix(-700, -120, blockA), top: 90, width: 520, height: 360, background: p.accent, rotate: '-8deg', borderRadius: 30, border: `8px solid ${p.ink}` }} />
        <div style={{ position: 'absolute', left: mix(-900, -260, blockB), bottom: 160 + Math.sin(frame / 50) * 12, width: 640, height: 640, borderRadius: '50%', background: p.accent2, opacity: dark ? 0.6 : 1 }} />
        <div style={{ position: 'absolute', right: -60, top: mix(1900, 1180, blockB), width: 240, height: 240, background: `repeating-linear-gradient(45deg, ${p.ink} 0 7px, transparent 7px 24px)`, opacity: 0.45, rotate: `${-6 + frame * 0.02}deg` }} />
        <Drift frame={frame} p={p} />

        {/* Top label */}
        <div style={{ position: 'absolute', left: 0, width: W, top: 150, textAlign: 'center', opacity: label, translate: `0 ${mix(-20, 0, label)}px` }}>
          <span style={{ fontFamily: FONTS.pressstart, fontSize: 34, padding: '16px 22px', background: p.pop, color: onPop, border: `6px solid ${p.ink}`, boxShadow: `8px 8px 0 ${p.ink}`, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            ★ {p.label} ★
          </span>
        </div>

        {/* The card */}
        <div
          style={{
            position: 'absolute',
            left: CARD.x,
            top: CARD.y,
            width: CARD.w,
            height: CARD.h,
            background: p.surface,
            border: `9px solid ${p.ink}`,
            borderRadius: 36,
            boxShadow: `20px 20px 0 ${p.ink}`,
            scale: String(card),
            opacity: clamp(card * 3),
            rotate: `${mix(-6, -1.5, card)}deg`,
            backgroundImage: `radial-gradient(${hexA(p.ink, 0.12)} 2px, transparent 2.5px)`,
            backgroundSize: '26px 26px',
          }}
        />

        {/* Giant quote mark drops on the bar-2 downbeat */}
        <div style={{ position: 'absolute', left: CARD.x + 40, top: CARD.y - 150 + mix(-260, 0, markDrop) + Math.sin(frame / 26) * 6 * markDrop, fontSize: 380, lineHeight: 1, opacity: clamp(markDrop * 4), rotate: `${mix(-30, -6, markDrop)}deg` }}>
          <span style={arcade(p.accent, p.ink, 380)}>“</span>
        </div>

        <WordsIn
          text={p.quote}
          frame={frame}
          start={BAR2 + 12}
          stagger={5}
          dur={20}
          style={{ position: 'absolute', left: CARD.x + 60, top: CARD.y + 185, width: CARD.w - 110, fontFamily: FONTS.rubikmono, fontSize: quoteSize, lineHeight: 1.32, color: p.ink, textTransform: 'uppercase', columnGap: '0.4em' }}
        />

        {/* HI-SCORE board */}
        <div
          style={{
            position: 'absolute',
            left: CARD.x + 60,
            top: boardTop,
            width: CARD.w - 120,
            height: 310,
            background: dark ? p.background : p.ink,
            borderRadius: 24,
            border: `6px solid ${p.ink}`,
            opacity: boardIn,
            translate: `0 ${mix(40, 0, boardIn)}px`,
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', left: 40, top: 32, fontFamily: FONTS.pressstart, fontSize: 30, color: p.accent2, textTransform: 'uppercase' }}>HI-SCORE · {p.metricLabel}</div>
          <div style={{ position: 'absolute', right: 40, top: 32, fontFamily: FONTS.pressstart, fontSize: 30, color: hexA(dark ? p.ink : p.background, 0.6), textDecoration: 'line-through', opacity: frame >= BAR3 + 7 ? 1 : 0 }}>
            {p.before}
          </div>
          {/* scanlines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, ${hexA('#000000', 0.18)} 0 2px, transparent 2px 6px)` }} />
        </div>
        <div style={{ ...valStyle, opacity: boardIn, scale: `1 ${Math.abs(1 - flip * 2) * 0.9 + 0.1}`, transformOrigin: 'center' }}>
          <span style={arcade(frame >= BAR3 + 7 ? p.pop : hexA(p.pop, 0.55), p.accent, VAL)}>{value}</span>
        </div>
        <Glint frame={frame} start={BAR5} dur={40} style={{ ...valStyle, fontFamily: FONTS.nabla, fontPalette: '--mb-flat', textTransform: 'uppercase', letterSpacing: '0.01em', whiteSpace: 'nowrap' } as CSSProperties}>
          {p.after}
        </Glint>
        {p.delta && (
          <div
            style={{
              position: 'absolute',
              right: CARD.x + 90,
              top: boardTop + 150,
              padding: '18px 22px',
              background: p.accent,
              color: isDark(p.accent) ? '#FFFFFF' : '#1A1A2E',
              border: `6px solid ${p.ink}`,
              boxShadow: `8px 8px 0 ${p.pop}`,
              fontFamily: FONTS.pressstart,
              fontSize: 34,
              rotate: `${6 + Math.sin(frame / 18) * 2.5}deg`,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, BAR3 + T.beats(1), 20, ease.backOut)),
            }}
          >
            {p.delta}
          </div>
        )}

        {/* Customer */}
        <div style={{ position: 'absolute', left: CARD.x + 20, top: CARD.y + CARD.h + 70, display: 'flex', alignItems: 'center', gap: 36, opacity: person, translate: `${mix(-60, 0, person)}px 0` }}>
          <div style={{ width: 170, height: 170, flex: 'none', borderRadius: '50%', border: `8px solid ${p.ink}`, boxShadow: `10px 10px 0 ${p.ink}`, background: p.pop, overflow: 'hidden', display: 'grid', placeItems: 'center', fontFamily: FONTS.rubikmono, fontSize: 64, color: onPop }}>
            {p.photo ? <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div>
            <div style={{ fontFamily: FONTS.rubikmono, fontSize: 52, color: p.ink, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.name}</div>
            <div style={{ fontFamily: FONTS.pressstart, fontSize: 28, color: p.ink, marginTop: 18, lineHeight: 1.5, maxWidth: 700 }}>{p.role}</div>
          </div>
        </div>

        {/* Brand line */}
        <div style={{ position: 'absolute', left: 0, width: W, top: 1770, textAlign: 'center', opacity: brand, translate: `0 ${mix(24, 0, brand)}px` }}>
          <span style={{ fontFamily: FONTS.pressstart, fontSize: 30, color: p.ink, textTransform: 'uppercase' }}>
            <span style={{ color: dark ? p.pop : p.accent }}>●</span> {p.brand} <span style={{ opacity: 0.6 }}>· {p.url}</span>
          </span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 66%, ${hexA('#FFFFFF', flash * 0.9)} 0%, ${hexA(p.pop, flash * 0.6)} 30%, transparent 70%)`, pointerEvents: 'none' }} />
      <FilmOverlay grain={0.04} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
