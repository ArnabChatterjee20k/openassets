import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, clamp, displayFace, ease, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Customer Quote',
  category: 'quote',
  description:
    'Square testimonial for feeds: a giant hard-shadow quote mark stamps in, the customer\'s words rise one by one while a highlighter swipes the key phrase, then the attribution card and a bursting result stat land on the beat.',
  tags: ['quote', 'testimonial', 'customer', 'social', 'square', 'brutalist'],
};

// 60 fps, 120 BPM: beat = 30 frames, bar = 120. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  label: text('Top label').default('Sparkcrate · Field notes'),
  quote: textarea().default('We went from diesel to solar in one shift. The crate was humming before lunch.'),
  highlight: text('Highlighted phrase').default('in one shift.'),
  name: text().default('Amara Okafor'),
  role: text('Role · company').default('Site lead · Kesho Cold Chain, Kisumu'),
  stat: text('Result number').default('−71%'),
  statLabel: text('Result label').default('Fuel spend'),
  photo: image('Customer photo (optional)').default(''),
  font: font('Display font').default('anton'),
  background: color().default('#FFFDF2'),
  surface: color('Burst / card').default('#FFE45C'),
  ink: color('Ink & shadows').default('#000000'),
  accent: color('Quote mark & highlight').default('#FF6B4A'),
  pop: color('Result').default('#00D1A0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  blueprint: { background: '#0F3B8C', surface: '#FFDD00', ink: '#EAF2FF', accent: '#FFDD00', pop: '#7FB2FF' },
  lava: { background: '#1A0A06', surface: '#FFB000', ink: '#FFEDE0', accent: '#FF4D00', pop: '#FF2E63', font: 'bebas' },
  clinic: {
    quote: 'Our vaccine fridges haven\'t blinked since the crate arrived. Not once in the rainy season.',
    highlight: 'haven\'t blinked',
    name: 'Dr. Lucía Ferreyra',
    role: 'Medical director · Clínica Alto Paraná',
    stat: '0',
    statLabel: 'Outages since May',
    background: '#FFF6E9',
    accent: '#00B3A4',
    surface: '#FFC93C',
    pop: '#FF6F91',
  },
};

type P = z.infer<typeof schema>;
const W = video.width;
const H = video.height;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};
const on = (bg: string) => (isDark(bg) ? '#FFFDF2' : '#000000');

// Beat map
const MARK = T.beats(1);
const WORDS = T.beats(2);
const ATTR = T.bars(2);
const STAT = T.bars(3);
const OUT = T.bars(4) - 40;

function Tag({ children, bg, p, size, style }: { children: ReactNode; bg: string; p: P; size: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.5,
        padding: `${size * 0.4}px ${size * 0.75}px`,
        background: bg,
        color: on(bg),
        border: `${Math.max(4, size * 0.13)}px solid ${p.ink}`,
        boxShadow: `${size * 0.28}px ${size * 0.28}px 0 ${p.ink}`,
        fontFamily: FONTS.mono,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Indices of the words that belong to the highlighted phrase. */
function highlightRange(words: string[], phrase: string): [number, number] {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
  const target = phrase.split(/\s+/).map(norm).filter(Boolean);
  if (!target.length) return [-1, -1];
  for (let i = 0; i + target.length <= words.length; i++) {
    if (target.every((t, j) => norm(words[i + j]) === t)) return [i, i + target.length - 1];
  }
  return [-1, -1];
}

export default function CustomerQuote(p: P) {
  const frame = useCurrentFrame();
  const dark = isDark(p.background);
  const disp = displayFace(p.font);

  const shakeAt = (at: number, amt: number) => {
    const t = frame - at;
    return t >= 0 && t < 16 ? Math.sin(t * 2.4) * amt * (1 - t / 16) : 0;
  };
  const sx = shakeAt(MARK, 8) + shakeAt(STAT, 7);
  const sy = shakeAt(MARK + 1, 6) + shakeAt(STAT + 1, 5);
  const push = mix(1, 1.035, prog(frame, 0, OUT, ease.inOutSoft));
  const shut = prog(frame, OUT, 40, ease.inOut);
  const tapeIn = prog(frame, 0, 24, ease.out);

  const words = p.quote.split(/\s+/).filter(Boolean);
  const [h0, h1] = highlightRange(words, p.highlight);
  const qSize = p.quote.length > 110 ? 58 : p.quote.length > 84 ? 66 : 76;
  const lastWordAt = WORDS + words.length * 4;
  const swipeAt = Math.max(lastWordAt + 6, T.bars(1) + T.beats(1)); // the highlighter lands on a beat after the words
  const swipeStart = Math.ceil(swipeAt / T.beat) * T.beat;

  const mark = prog(frame, MARK, 14, ease.out);
  const attr = prog(frame, ATTR, 26, ease.out);
  const stat = prog(frame, STAT, 18, ease.backOut);

  const initials = p.name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w) && !/\.$/.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <AbsoluteFill style={{ background: p.background, overflow: 'hidden', color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.16 : 0.2, size: 36, y: -frame * 0.3, color: dark ? '234,242,255' : '0,0,0', fade: 1.3 }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[]}
        grain={0.04}
        vignette={dark ? 0.4 : 0}
      />

      <AbsoluteFill style={{ translate: `${sx}px ${sy}px`, scale: String(push) }}>
        {/* label */}
        <div style={{ position: 'absolute', right: 86, top: 96, opacity: prog(frame, 8, 16), translate: `${mix(40, 0, prog(frame, 8, 22))}px 0` }}>
          <Tag p={p} bg={dark ? p.background : '#FFFFFF'} size={26}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.pop, border: '3px solid #000000' }} />
            {p.label}
          </Tag>
        </div>

        {/* giant quote mark: stamped with a hard shadow */}
        <div
          style={{
            position: 'absolute',
            left: 64,
            top: 40,
            ...displayFace('anton'),
            fontSize: 420,
            lineHeight: 1,
            color: p.accent,
            WebkitTextStroke: `8px ${p.ink}`,
            textShadow: `${mix(0, 16, mark)}px ${mix(0, 16, mark)}px 0 ${p.ink}`,
            scale: String(mix(1.6, 1, mark)),
            rotate: `${mix(-14, -4, mark)}deg`,
            opacity: clamp(mark * 3),
            transformOrigin: '30% 40%',
          }}
        >
          “
        </div>

        {/* the quote, word by word, with a highlighter on the key phrase */}
        <div style={{ position: 'absolute', left: 90, right: 90, top: 330, fontFamily: FONTS.familjen, fontWeight: 700, fontSize: qSize, lineHeight: 1.16, letterSpacing: '-0.015em' }}>
          {words.map((w, i) => {
            const t = prog(frame, WORDS + i * 4, 20, ease.out);
            const hi = i >= h0 && i <= h1;
            const sw = hi ? prog(frame, swipeStart + (i - h0) * 4, 10, ease.inOutSoft) : 0;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  paddingRight: hi && i < h1 ? '0.26em' : undefined,
                  marginRight: hi && i < h1 ? 0 : '0.26em',
                  opacity: clamp(t * 1.5),
                  translate: `0 ${(1 - t) * 30}px`,
                  filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined,
                  backgroundImage: hi ? `linear-gradient(${p.accent}, ${p.accent})` : undefined,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '0 85%',
                  backgroundSize: hi ? `${sw * 100}% 62%` : undefined,
                  color: hi && sw > 0.5 ? on(p.accent) : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* attribution card */}
        <div style={{ position: 'absolute', left: 90, top: 790, translate: `${mix(-900, 0, attr)}px 0`, rotate: `${mix(-6, -1.5, attr)}deg`, opacity: frame >= ATTR ? 1 : 0 }}>
          <div style={{ position: 'absolute', inset: 0, translate: '12px 12px', background: p.ink }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 26, padding: '22px 34px 22px 22px', background: dark ? p.background : '#FFFFFF', border: `6px solid ${p.ink}`, maxWidth: 580 }}>
            <div style={{ width: 112, height: 112, borderRadius: '50%', border: `6px solid ${p.ink}`, background: p.surface, overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
              {p.photo ? (
                <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ ...displayFace('anton'), fontSize: 54, color: '#000000' }}>{initials}</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: 46, lineHeight: 1.05, color: on(dark ? p.background : '#FFFFFF') }}>{p.name}</div>
              <div style={{ fontFamily: FONTS.familjen, fontWeight: 500, fontSize: 30, lineHeight: 1.2, marginTop: 8, color: on(dark ? p.background : '#FFFFFF'), opacity: 0.85 }}>{p.role}</div>
            </div>
          </div>
        </div>

        {/* result stat in a burst */}
        {frame >= STAT - 2 && (
          <div style={{ position: 'absolute', right: 60, top: 620, width: 340, height: 340, scale: String(stat * 0.86), rotate: `${mix(-30, 6, stat)}deg` }}>
            <svg viewBox="-170 -170 340 340" width={340} height={340} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <g transform={`rotate(${frame * 0.4})`}>
                <polygon
                  points={Array.from({ length: 28 }, (_, i) => {
                    const r = i % 2 ? 132 : 164;
                    const a = (i / 28) * Math.PI * 2;
                    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
                  }).join(' ')}
                  fill={p.ink}
                  transform="translate(12 12)"
                />
                <polygon
                  points={Array.from({ length: 28 }, (_, i) => {
                    const r = i % 2 ? 132 : 164;
                    const a = (i / 28) * Math.PI * 2;
                    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
                  }).join(' ')}
                  fill={p.surface}
                  stroke={p.ink}
                  strokeWidth={7}
                  strokeLinejoin="round"
                />
              </g>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: on(p.surface) }}>
              <div style={{ ...disp, fontSize: p.stat.length > 3 ? 104 : 132, lineHeight: 0.9, letterSpacing: '-0.01em' }}>{p.stat}</div>
              <div style={{ marginTop: 10 }}>
                <Tag p={p} bg={p.pop} size={22} style={{ boxShadow: 'none' }}>
                  {p.statLabel}
                </Tag>
              </div>
            </div>
          </div>
        )}
      </AbsoluteFill>

      {/* hazard tape (and exit shutters) */}
      <div
        style={{
          position: 'absolute',
          left: -20,
          right: -20,
          bottom: -6,
          height: mix(44, H / 2 + 60, shut),
          translate: `${mix(W, 0, tapeIn)}px 0`,
          backgroundImage: `repeating-linear-gradient(135deg, ${p.ink} 0 26px, ${p.surface} 26px 52px)`,
          borderTop: `6px solid ${p.ink}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -20,
          right: -20,
          top: -6,
          height: mix(0, H / 2 + 60, shut),
          backgroundImage: `repeating-linear-gradient(135deg, ${p.ink} 0 26px, ${p.surface} 26px 52px)`,
          borderBottom: `6px solid ${p.ink}`,
          opacity: shut > 0 ? 1 : 0,
        }}
      />
      {frame >= OUT + 18 && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ scale: String(mix(1.4, 1, prog(frame, OUT + 18, 14, ease.out))), opacity: clamp(prog(frame, OUT + 18, 6)), rotate: '-3deg' }}>
            <Tag p={p} bg={p.background} size={40} style={{ color: p.ink }}>
              {p.label}
            </Tag>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
