import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Dust, FilmOverlay, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: "Season's Greeting",
  category: 'greeting',
  description:
    'Story-format holiday card from a SaaS team to its customers: a year of usage tiles fills in on the beat and resolves into a pixel heart, then the customer name slams in with your message and sign-off.',
  tags: ['greeting', 'holiday', 'thank you', 'customers', 'story', 'vertical', 'heatmap'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  greeting: text().default('Happy holidays,'),
  name: text('Their name').default('Northwind'),
  message: textarea().default('Thanks for a year of 1.2 million prompts, zero surprise invoices and one very busy December.'),
  from: text('Signed').default('— Mara, Theo & the Ambit team'),
  photo: image('Photo (optional)').default(''),
  font: font('Name font').default('archivo'),
  background: color().default('#E9E3F5'),
  surface: color('Empty tile').default('#D6CCEC'),
  ink: color('Ink').default('#231942'),
  accent: color('Heart').default('#5E4AE3'),
  accent2: color('Heart highlight').default('#F49CBB'),
  pop: color('Sparkle').default('#2EC4B6'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'thank-you': { greeting: 'Thank you,', name: 'Halcyon Labs', message: 'For trusting us with your first year of AI. Here’s to the next one.' },
  'cherry-cola': { background: '#2A0A10', surface: '#3F1019', ink: '#FFE8E0', accent: '#E3173E', accent2: '#F5C6AA', pop: '#F7B32B', font: 'dela' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#2F6F8F', accent2: '#A7C4D4', pop: '#E4572E', greeting: 'Warm wishes,', font: 'shoulders' },
};

type P = z.infer<typeof schema>;

// 9 × 8 pixel heart.
const HEART = ['.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
const COLS = 9;
const ROWS = 8;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};
function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * t));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

function Sparkle({ x, y, s, c, o }: { x: number; y: number; s: number; c: string; o: number }) {
  return (
    <svg viewBox="-10 -10 20 20" style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, opacity: o, overflow: 'visible' }}>
      <path d="M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10Z" fill={c} />
    </svg>
  );
}

export default function SeasonsGreeting(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const hasPhoto = !!p.photo;

  const HEARTAT = T.beats(3); // beat 4 of bar 1: the tiles resolve into the heart
  const HIT = T.bars(1);
  const MSG = T.bars(2);
  const PULSE = T.bars(3);

  const tile = hasPhoto ? 62 : 90;
  const gap = hasPhoto ? 8 : 12;
  const gw = COLS * tile + (COLS - 1) * gap;
  const gh = ROWS * tile + (ROWS - 1) * gap;
  const gx = (W - gw) / 2;
  const gy = hasPhoto ? 650 : 360;
  const hcx = gx + gw / 2;
  const hcy = gy + gh * 0.45;
  const textTop = gy + gh + (hasPhoto ? 60 : 90);
  const nameSize = Math.min(150, 920 / Math.max(1, p.name.length * 0.8));

  const flash = keys(frame, [HEARTAT - 1, HEARTAT + 3, HEARTAT + 28], [0, 1, 0], [ease.out, ease.outSoft]);
  const slam = prog(frame, HIT + T.beat, 16, ease.out);
  const outro = prog(frame, end - 30, 30, ease.inOut);
  const breathe = 1 + Math.sin(frame / 50) * 0.008;
  const mono: CSSProperties = { fontFamily: FONTS.spacemono, color: p.ink };
  const empty = mixHex(p.surface, p.background, dark ? 0.1 : 0.35);

  return (
    <AbsoluteFill style={{ background: p.background, overflow: 'hidden' }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle, ${hexA(p.ink, dark ? 0.2 : 0.13)} 1.4px, transparent 2px)`, backgroundSize: '34px 34px', backgroundPosition: `0 ${-frame * 0.2}px` }} />
      <div style={{ position: 'absolute', left: hcx - 800, top: hcy - 800, width: 1600, height: 1600, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent2, 0.5)} 0%, transparent 60%)`, opacity: keys(frame, [0, HEARTAT, HEARTAT + 30, end], [0.3, 0.5, 1, 0.85]) }} />
      <div style={{ position: 'absolute', left: -300, top: 1300, width: 1200, height: 1200, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent, dark ? 0.35 : 0.22)} 0%, transparent 62%)` }} />
      <Dust frame={frame} width={W} height={H} count={45} color={p.accent2} seed={12} opacity={0.5} speed={0.6} />

      <AbsoluteFill style={{ opacity: 1 - outro, scale: String(breathe) }}>
        {/* taped polaroid */}
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              left: W / 2 - 220,
              top: 130,
              width: 440,
              padding: '22px 22px 70px',
              background: '#FBF9FE',
              border: `4px solid ${p.ink}`,
              boxShadow: `12px 12px 0 ${p.ink}`,
              rotate: `${mix(-12, -4, prog(frame, 4, 40, ease.backOut))}deg`,
              translate: `0 ${mix(-80, 0, prog(frame, 4, 40, ease.out))}px`,
              opacity: prog(frame, 4, 16),
              boxSizing: 'border-box',
              zIndex: 5,
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: 360, objectFit: 'cover', display: 'block', border: `3px solid ${p.ink}`, boxSizing: 'border-box' }} />
            <div style={{ position: 'absolute', left: 150, top: -22, width: 140, height: 40, background: hexA(p.accent2, 0.75), rotate: '3deg' }} />
          </div>
        )}

        {/* the year grid → heart */}
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const inHeart = HEART[r][c] === 'X';
          // Bar 1: tiles land one by one in a scattered order, like days filling in.
          const at = 6 + rand(i * 1.7) * (HEARTAT - 26);
          const s = prog(frame, at, 14, ease.backOut);
          const lv = 0.15 + rand(i * 5.1) * 0.55;
          const resolve = prog(frame, HEARTAT, 18, ease.out);
          const d = Math.hypot(c - 4, r - 3.2);
          // Bar 4: a pulse travels out from the centre of the heart.
          const pulse = Math.max(0, 1 - Math.abs((frame - PULSE) / 5 - d * 1.6) / 2.2) * (frame >= PULSE ? 1 : 0);
          const heartCol = mixHex(p.accent, p.accent2, clamp(1 - (r + (c < 4 ? 4 - c : c - 4) * 0.5) / 4.5));
          const before = mixHex(empty, p.accent, lv);
          const bg = inHeart ? mixHex(before, heartCol, resolve) : mixHex(before, empty, resolve);
          const pop = inHeart ? keys(frame, [HEARTAT, HEARTAT + 6, HEARTAT + 20], [1, 1.18, 1], [ease.out, ease.inOutSoft]) : 1;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: gx + c * (tile + gap),
                top: gy + r * (tile + gap),
                width: tile,
                height: tile,
                borderRadius: tile * 0.2,
                background: bg,
                border: inHeart && resolve > 0 ? `${Math.max(2, tile * 0.05) * resolve}px solid ${p.ink}` : undefined,
                boxShadow: inHeart && resolve > 0 ? `${tile * 0.07 * resolve}px ${tile * 0.07 * resolve}px 0 ${p.ink}` : undefined,
                boxSizing: 'border-box',
                scale: String(s * pop * (1 + pulse * 0.16)),
                opacity: clamp(s * 2) * (inHeart ? 1 : mix(1, 0.55, resolve)),
              }}
            />
          );
        })}

        {/* sparkles around the heart: twinkle after it forms, burst on the bar-4 pulse */}
        {Array.from({ length: 7 }, (_, i) => {
          const a = -Math.PI * 0.95 + (i / 6) * Math.PI * 0.9 + rand(i) * 0.2;
          const rr = gw * (0.6 + rand(i + 9) * 0.12);
          const x = hcx + Math.cos(a) * rr;
          const y = hcy + Math.sin(a) * rr * 0.9;
          const tw = 0.55 + 0.45 * Math.sin(frame / 9 + i * 1.9);
          const on = prog(frame, HEARTAT + 6 + i * 4, 16, ease.backOut);
          const burst = keys(frame, [PULSE + i * 3, PULSE + 10 + i * 3, PULSE + 40 + i * 3], [1, 1.7, 1], [ease.out, ease.inOutSoft]);
          return <Sparkle key={i} x={x} y={y} s={(i % 2 ? 34 : 54) * on * burst} c={i % 3 === 0 ? p.pop : p.accent2} o={tw * on} />;
        })}

        {/* greeting eyebrow on bar 2 */}
        <div style={{ ...mono, position: 'absolute', width: W, top: textTop, textAlign: 'center', fontSize: 46, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: prog(frame, HIT, 24), translate: `0 ${mix(26, 0, prog(frame, HIT, 30))}px` }}>
          {p.greeting}
        </div>

        {/* name slams in on beat 2 of bar 2 */}
        {frame >= HIT + T.beat && (
          <div
            style={{
              ...displayFace(p.font),
              position: 'absolute',
              left: 80,
              width: W - 160,
              top: textTop + 76,
              textAlign: 'center',
              fontSize: nameSize,
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              color: p.accent,
              WebkitTextStroke: `${Math.max(2, nameSize * 0.025)}px ${p.ink}`,
              textShadow: `${mix(0, 9, slam)}px ${mix(0, 9, slam)}px 0 ${p.ink}`,
              scale: String(mix(1.4, 1, slam)),
              opacity: clamp(slam * 3),
              filter: slam < 1 ? `blur(${(1 - slam) * 10}px)` : undefined,
            }}
          >
            {p.name}
          </div>
        )}

        <WordsIn
          text={p.message}
          frame={frame}
          start={MSG}
          stagger={4}
          style={{ position: 'absolute', left: 110, width: W - 220, top: textTop + 110 + nameSize * 1.05, justifyContent: 'center', textAlign: 'center', fontFamily: FONTS.spacemono, color: p.ink, fontSize: 44, lineHeight: 1.4 }}
        />
        <div
          style={{
            ...mono,
            position: 'absolute',
            width: W,
            top: Math.min(H - 150, textTop + 330 + nameSize * 1.05),
            display: 'flex',
            justifyContent: 'center',
            opacity: prog(frame, MSG + T.beats(2), 24),
            translate: `0 ${mix(20, 0, prog(frame, MSG + T.beats(2), 30))}px`,
          }}
        >
          <span style={{ fontSize: 34, fontWeight: 700, padding: '12px 24px', background: p.surface, border: `3px solid ${p.ink}`, borderRadius: 12, boxShadow: `6px 6px 0 ${p.ink}` }}>{p.from}</span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${(hcy / H) * 100}%, ${hexA(dark ? '#FFFFFF' : p.accent2, flash * 0.75)} 0%, transparent 40%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
