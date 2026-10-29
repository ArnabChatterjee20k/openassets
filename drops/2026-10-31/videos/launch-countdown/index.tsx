import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, num, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, clamp, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Launch Countdown',
  category: 'countdown',
  description:
    'Vertical launch countdown in riso print: each number is printed as a pink and a blue plate that slide in from opposite sides and snap into register on the beat, over a pulsing halftone sun; on zero the product name slams in with a flash, ink confetti and the CTA.',
  tags: ['countdown', 'launch', 'story', 'vertical', 'riso', 'openassets'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Kit 03 drops in'),
  countFrom: num(3, 5, 1, 'Count from').default(5),
  name1: text('Name, first line').default('Open'),
  name2: text('Name, second line (accent)').default('Assets'),
  live: text('Reveal line').default('is live.'),
  date: text('Date line').default('31 Oct 2026 · Kit 03'),
  cta: text('Call to action').default('Browse today’s kit'),
  url: text('Link').default('arnabchatterjee20k.github.io/openassets'),
  background: color('Paper').default('#F4EFE6'),
  ink: color('Ink').default('#1F2A6B'),
  accent: color('Plate 1 (pink)').default('#FF48B0'),
  accent2: color('Plate 2 (blue)').default('#0078BF'),
  pop: color('Pop').default('#FFE800'),
  logo: image('Logo (optional, shown on the reveal)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  acid: { background: '#0B0B0B', ink: '#F0FFE0', accent: '#FF00E5', accent2: '#00F0FF', pop: '#C6FF00', countFrom: 3 },
  brutalist: { background: '#FFFDF2', ink: '#111111', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#FFE45C', eyebrow: 'Launching in' },
  memphis: { background: '#FFF6E9', ink: '#1A1A2E', accent: '#FF6F91', accent2: '#00B3A4', pop: '#FFC93C', live: 'is open.', countFrom: 4 },
};

type P = z.infer<typeof schema>;

const W = 1080;
const H = 1920;
const HIT = T.beats(14); // zero: the reveal lands on beat 14 (frame 420)

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

function RegMark({ x, y, s, c, rot = 0, scale = 1 }: { x: number; y: number; s: number; c: string; rot?: number; scale?: number }) {
  return (
    <svg width={s} height={s} viewBox="-12 -12 24 24" style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, overflow: 'visible', rotate: `${rot}deg`, scale: String(scale) }}>
      <circle r="6.5" fill="none" stroke={c} strokeWidth="1.2" />
      <line x1="-11" y1="0" x2="11" y2="0" stroke={c} strokeWidth="1.2" />
      <line x1="0" y1="-11" x2="0" y2="11" stroke={c} strokeWidth="1.2" />
    </svg>
  );
}

/** One riso plate of a centred line of type. */
function Plate({ children, c, dx, dy, blend, style, o = 1 }: { children: ReactNode; c: string; dx: number; dy: number; blend: CSSProperties['mixBlendMode']; style: CSSProperties; o?: number }) {
  return <div style={{ position: 'absolute', left: 0, width: W, textAlign: 'center', whiteSpace: 'nowrap', color: c, opacity: o, mixBlendMode: blend, translate: `${dx}px ${dy}px`, ...style }}>{children}</div>;
}

export default function LaunchCountdown(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const blend: CSSProperties['mixBlendMode'] = dark ? 'screen' : 'multiply';
  const ink = p.ink;
  const n = Math.round(p.countFrom);
  const STEP = T.beats(2);
  const first = HIT - n * STEP;

  // Which number is up, and how far into its two beats we are.
  const k = Math.floor((frame - first) / STEP);
  const counting = frame >= first && frame < HIT;
  const local = frame - (first + k * STEP);
  const digit = n - k;
  const land = 16; // plates travel for 16 frames and lock on the beat
  const inT = prog(local, 0, land, ease.out);
  const outT = prog(local, STEP - 12, 12, ease.in);
  const side = k % 2 ? 1 : -1;
  const reg = mix(44, 26, prog(local, land - 2, 10, ease.out)); // residual misregistration
  const punch = keys(local, [land - 4, land, land + 14], [1, 1.07, 1], [ease.out, ease.outSoft]);
  const DIG = 1080;

  // Each landing pulses the halftone sun and throws a ring.
  const lastLand = counting ? first + k * STEP + land : frame >= HIT ? HIT : -999;
  const sinceLand = frame - lastLand;
  const pulse = sinceLand >= 0 ? Math.exp(-sinceLand / 10) : 0;
  const ring = prog(sinceLand, 0, 40, ease.out);

  // Reveal.
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const slam = prog(frame, HIT, 22, ease.out);
  const regT = mix(46, 9, prog(frame, HIT + 4, 24, ease.backOut));
  const shake = frame >= HIT && frame < HIT + 18 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 18) * 14 : 0;
  const outro = prog(frame, end - 26, 26, ease.inOut);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const TITLE = Math.min(330, 940 / (Math.max(p.name1.length, p.name2.length, 4) * 0.46));
  const titleTop = 560;

  const sunX = W / 2;
  const sunY = 900;
  const sunR = 560 * (1 + pulse * 0.07) * mix(0.6, 1, prog(frame, 0, 70, ease.out));

  // Ink confetti on the hit: drag + terminal velocity, so it hangs then drifts.
  const conf = frame >= HIT
    ? Array.from({ length: 70 }, (_, i) => {
        const t = (frame - HIT) / FPS;
        const a = rand(i * 3.1) * Math.PI * 2;
        const sp = 900 + rand(i * 7.3) * 1500;
        const kd = 2.6;
        const vt = 150 + rand(i * 2.2) * 120;
        const f = (1 - Math.exp(-kd * t)) / kd;
        const x = sunX + Math.cos(a) * sp * f + Math.sin(t * 3 + i) * 18;
        const y = 820 + (Math.sin(a) * sp - 500 - vt) * f + vt * t;
        return { x, y, r: rand(i * 5.5) * 360 + t * 240 * (i % 2 ? 1 : -1), c: [p.accent, p.accent2, p.pop][i % 3], s: 14 + rand(i * 9.9) * 20, round: i % 4 === 0 };
      })
    : [];

  const timecode = counting ? `T–00:0${digit}` : frame < first ? `T–00:0${n}` : 'LIVE';

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: ink, overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.1 : 0.16, size: 46, y: -frame * 0.15, color: dark ? '240,255,224' : '31,42,107' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />
      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        {/* Halftone sun, two plates out of register */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            {[0, 1].map((j) => (
              <pattern key={j} id={`lc-dots-${j}`} width="56" height="56" patternUnits="userSpaceOnUse" patternTransform={`rotate(${j ? 15 : 45} ${sunX} ${sunY})`}>
                <circle cx="28" cy="28" r={16 + pulse * 4} fill={j ? p.accent2 : p.accent} />
              </pattern>
            ))}
            <radialGradient id="lc-fade">
              <stop offset="0.5" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id="lc-mask">
              <circle cx={sunX} cy={sunY} r={sunR} fill="url(#lc-fade)" />
            </mask>
          </defs>
          <g mask="url(#lc-mask)" style={{ mixBlendMode: blend }} opacity={0.55 + Math.sin(frame / 40) * 0.05}>
            <rect x={sunX - sunR + 22} y={sunY - sunR + 16} width={sunR * 2} height={sunR * 2} fill="url(#lc-dots-1)" opacity="0.6" />
            <rect x={sunX - sunR} y={sunY - sunR} width={sunR * 2} height={sunR * 2} fill="url(#lc-dots-0)" opacity="0.75" />
          </g>
          {sinceLand >= 0 && sinceLand < 40 && <circle cx={sunX} cy={sunY} r={mix(500, 900, ring)} fill="none" stroke={p.accent} strokeWidth={mix(14, 2, ring)} opacity={(1 - ring) * 0.7} />}
        </svg>

        <Dust frame={frame} width={W} height={H} count={36} color={p.accent2} seed={4} speed={0.7} opacity={dark ? 0.5 : 0.35} maxSize={7} />

        {/* Print-sheet chrome: marks in the margins and a header rule */}
        {[
          [70, 70],
          [W - 70, 70],
          [70, H - 70],
          [W - 70, H - 70],
        ].map(([x, y], i) => (
          <RegMark key={i} x={x} y={y} s={52} c={hexA(ink, 0.6)} scale={prog(frame, 6 + i * 4, 24, ease.backOut)} />
        ))}
        <div style={{ position: 'absolute', left: 120, right: 120, top: 150, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONTS.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: prog(frame, 8, 24), translate: `0 ${mix(-24, 0, prog(frame, 8, 30))}px` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {[p.accent, p.accent2, p.pop].map((c) => (
              <span key={c} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: `2px solid ${ink}` }} />
            ))}
            <span style={{ marginLeft: 6 }}>{`${p.name1}${p.name2}`}</span>
          </span>
          <span style={{ padding: '8px 18px', borderRadius: 99, background: frame >= HIT ? p.pop : 'transparent', color: frame >= HIT ? '#111111' : ink, border: `3px solid ${frame >= HIT ? p.pop : ink}` }}>{timecode}</span>
        </div>
        <div style={{ position: 'absolute', left: 120, right: 120, top: 214, height: 3, background: ink, transformOrigin: 'left', scale: `${prog(frame, 12, 40, ease.inOut)} 1` }} />

        {/* Countdown phase */}
        {frame < HIT + 6 && (
          <>
            <div style={{ position: 'absolute', left: 0, width: W, top: 300, textAlign: 'center', fontFamily: FONTS.familjen, fontWeight: 700, fontSize: 84, letterSpacing: '-0.02em', opacity: prog(frame, 24, 24) * (1 - prog(frame, HIT - 8, 10, ease.in)), translate: `0 ${mix(40, 0, prog(frame, 24, 34))}px`, filter: `blur(${mix(12, 0, prog(frame, 24, 28))}px)` }}>
              {p.eyebrow}
            </div>
            {frame < first && (
              // Before the first number: the start digit as an empty outline, waiting for ink.
              <div style={{ position: 'absolute', left: 0, width: W, top: 360, textAlign: 'center', fontFamily: FONTS.anton, fontSize: DIG, lineHeight: 1, color: 'transparent', WebkitTextStroke: `4px ${hexA(ink, 0.5)}`, opacity: prog(frame, 30, 40) }}>
                {n}
              </div>
            )}
            {counting && (
              <div style={{ position: 'absolute', inset: 0, scale: String(punch * mix(1, 1.25, outT)), opacity: 1 - outT, filter: outT > 0 ? `blur(${outT * 16}px)` : undefined }}>
                <Plate c={p.accent2} o={0.6} blend={blend} dx={mix(side * 700, reg, inT)} dy={mix(0, reg * 0.6, inT)} style={{ top: 360, fontFamily: FONTS.anton, fontSize: DIG, lineHeight: 1 }}>
                  {digit}
                </Plate>
                <Plate c={p.accent} blend={blend} dx={mix(-side * 700, 0, inT)} dy={0} style={{ top: 360, fontFamily: FONTS.anton, fontSize: DIG, lineHeight: 1 }}>
                  {digit}
                </Plate>
                {/* the next number waits as an outline behind */}
                {digit > 1 && (
                  <div style={{ position: 'absolute', left: W / 2 + 250, top: 1380, fontFamily: FONTS.anton, fontSize: 220, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${hexA(ink, 0.45)}`, opacity: inT }}>{digit - 1}</div>
                )}
              </div>
            )}
            {/* Beat ticks: one per number, filled as they pass */}
            <div style={{ position: 'absolute', left: 0, width: W, top: 1640, display: 'flex', justifyContent: 'center', gap: 22, opacity: prog(frame, 40, 24) * (1 - prog(frame, HIT - 6, 8, ease.in)) }}>
              {Array.from({ length: n }, (_, i) => {
                const on = counting && i <= k;
                return <span key={i} style={{ width: 70, height: 16, borderRadius: 99, background: on ? p.accent : 'transparent', border: `3px solid ${ink}`, scale: on && i === k ? String(1 + pulse * 0.25) : '1' }} />;
              })}
            </div>
          </>
        )}

        {/* Reveal */}
        {frame >= HIT && (
          <>
            {conf.map((c, i) => (
              <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, width: c.s, height: c.round ? c.s : c.s * 0.5, borderRadius: c.round ? '50%' : 2, background: c.c, rotate: `${c.r}deg`, mixBlendMode: blend }} />
            ))}
            <div style={{ position: 'absolute', left: 0, width: W, top: 330, display: 'flex', justifyContent: 'center', opacity: prog(frame, HIT + 10, 18), scale: String(prog(frame, HIT + 10, 26, ease.backOut)) }}>
              {p.logo ? (
                <Img src={p.logo} style={{ height: 150, objectFit: 'contain' }} />
              ) : (
                <div style={{ position: 'relative', width: 130, height: 130, scale: String(1 + Math.sin(frame / 14) * 0.04) }}>
                  <RegMark x={65} y={65} s={130} c={ink} />
                </div>
              )}
            </div>
            <div style={{ position: 'absolute', inset: 0, scale: String(mix(1.5, 1, slam)), opacity: clamp(slam * 3), filter: slam < 0.9 ? `blur(${(1 - slam) * 16}px)` : undefined }}>
              {[p.name1, p.name2].map((line, i) => (
                <div key={i}>
                  <Plate c={p.accent2} o={0.7} blend={blend} dx={regT * (i ? -1 : 1)} dy={regT * 0.7} style={{ top: titleTop + i * TITLE * 0.9, fontFamily: FONTS.anton, fontSize: TITLE, lineHeight: 1, textTransform: 'uppercase' }}>
                    {line}
                  </Plate>
                  <Plate c={i ? p.accent : ink} blend={blend} dx={0} dy={0} style={{ top: titleTop + i * TITLE * 0.9, fontFamily: FONTS.anton, fontSize: TITLE, lineHeight: 1, textTransform: 'uppercase' }}>
                    {line}
                  </Plate>
                </div>
              ))}
            </div>
            <Glint frame={frame} start={HIT + T.bars(1)} dur={44} style={{ position: 'absolute', left: 0, width: W, top: titleTop + TITLE * 0.9, textAlign: 'center', fontFamily: FONTS.anton, fontSize: TITLE, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {p.name2}
            </Glint>
            <div style={{ position: 'absolute', left: 0, width: W, top: titleTop + TITLE * 1.95, textAlign: 'center', fontFamily: FONTS.familjen, fontStyle: 'italic', fontWeight: 700, fontSize: 132, letterSpacing: '-0.03em', lineHeight: 1, color: ink, opacity: prog(frame, HIT + T.beat, 16), translate: `0 ${mix(60, 0, prog(frame, HIT + T.beat, 30))}px`, filter: `blur(${mix(14, 0, prog(frame, HIT + T.beat, 24))}px)` }}>
              {p.live}
            </div>
            <div style={{ position: 'absolute', left: 0, width: W, top: titleTop + TITLE * 1.95 + 190, textAlign: 'center', fontFamily: FONTS.mono, fontWeight: 700, fontSize: 40, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: prog(frame, HIT + T.beats(1.5), 20), translate: `0 ${mix(24, 0, prog(frame, HIT + T.beats(1.5), 26))}px` }}>
              {p.date}
            </div>
            <div style={{ position: 'absolute', left: 0, width: W, top: 1560, display: 'flex', justifyContent: 'center' }}>
              <div style={{ padding: '28px 54px', borderRadius: 999, background: dark ? p.pop : ink, color: dark ? '#0B0B0B' : p.background, fontFamily: FONTS.familjen, fontWeight: 700, fontSize: 56, whiteSpace: 'nowrap', boxShadow: `8px 9px 0 ${p.accent}`, scale: String(prog(frame, HIT + T.beats(2.5), 26, ease.backOut)) }}>
                {p.cta} →
              </div>
            </div>
            <div style={{ position: 'absolute', left: 0, width: W, top: 1700, textAlign: 'center', fontFamily: FONTS.mono, fontWeight: 700, fontSize: 34, color: ink, opacity: prog(frame, HIT + T.beats(3), 22) }}>
              {p.url}
            </div>
          </>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${hexA(dark ? p.accent : '#FFFFFF', flash * 0.9)} 0%, ${hexA(p.accent, flash * 0.45)} 35%, transparent 70%)`, mixBlendMode: dark ? 'screen' : 'normal', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.35 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
