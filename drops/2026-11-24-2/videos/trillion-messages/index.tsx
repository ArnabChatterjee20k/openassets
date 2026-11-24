import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Trillion Messages',
  category: 'milestone',
  description: 'Square milestone clip on a Swiss grid: a log counter rolls up, then slams into a huge "1T" split across a red half-block, followed by three stats on the beat and a thank-you.',
  tags: ['milestone', 'counter', 'stats', 'kafka', 'social', 'square'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30f, bar = 120f
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Halfstream // cluster log'),
  count: text('Rolling counter').default('1,000,000,000,000'),
  short: text('Hero number').default('1T'),
  label: text('Hero label').default('Messages streamed'),
  stat1Label: text('Stat 1 label').default('p99 produce latency'),
  stat1: text('Stat 1').default('4 ms'),
  stat2Label: text('Stat 2 label').default('3 a.m. pages you got'),
  stat2: text('Stat 2').default('0'),
  stat3Label: text('Stat 3 label').default('Saved vs MSK'),
  stat3: text('Stat 3').default('$2.1M'),
  thanks: text('Thank-you line').default('Thank you, 412 teams streaming on Halfstream.'),
  url: text().default('halfstream.dev'),
  font: font('Display font').default('bungee'),
  background: color().default('#F5F5F0'),
  surface: color().default('#E6E6E1'),
  ink: color('Text').default('#0A0A0A'),
  accent: color().default('#E3000F'),
  accent2: color('Grid + secondary').default('#8C8C88'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'cherry-night': { background: '#2A0A10', surface: '#3F1019', ink: '#FFE8E0', accent: '#E3173E', accent2: '#F5C6AA' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF' },
  'first-100b': { count: '100,000,000,000', short: '100B', label: 'Events in month one', stat3Label: 'Brokers we run', stat3: '1,280', thanks: 'Month one, done. Thank you, early teams.' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Rolls a formatted number up from zero, keeping its separators. */
function rolled(target: string, t: number) {
  const digits = target.replace(/\D/g, '');
  if (!digits) return target;
  const n = Number(digits);
  if (t >= 1) return target;
  return Math.floor(n * t).toLocaleString('en-US');
}

/** Fake broker log lines that scroll under the counter while it builds. */
const LOG = [
  'p-07  offset 88,201,442  ack  2ms',
  'p-02  offset 91,550,017  ack  3ms',
  'p-11  offset 12,904,330  ack  2ms',
  'isr   3/3 in sync  · broker-4',
  'p-05  offset 77,031,968  ack  4ms',
  'p-09  offset 63,418,205  ack  2ms',
  'rebalance  0 lag  · group checkout',
  'p-01  offset 40,772,611  ack  3ms',
];

const PAD = 84;
const BOX = { x: PAD, y: 196, w: 1080 - PAD * 2, h: 380 };

export default function TrillionMessages(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const HIT = T.bars(1);
  const STATS = T.bars(2);
  const OUTRO = T.bars(3);
  const END = video.durationInFrames;
  const onAccent = isDark(p.accent) ? '#F5F5F0' : '#0A0A0A';

  // Camera: shake on the hit, slow push after it.
  const shakeAmt = keys(frame, [HIT, HIT + 4, HIT + 22], [0, 14, 0], [ease.out, ease.outSoft]);
  const shake = { x: (rand(frame * 1.7) - 0.5) * shakeAmt, y: (rand(frame * 3.1) - 0.5) * shakeAmt };
  const push = mix(1, 1.04, prog(frame, HIT, END - HIT, ease.inOutSoft));
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 24], [0, 1, 0], [ease.out, ease.outSoft]);

  // Grid draws in during the first beats.
  const grid = prog(frame, 0, 40, ease.out);
  const wipe = prog(frame, END - 34, 34, ease.inOut);

  // Counter roll: build until the downbeat of bar 2.
  const roll = prog(frame, 14, HIT - 18, ease.inOutSoft);
  const counterOut = prog(frame, HIT - 4, 12, ease.in);
  const countSize = Math.min(132, (BOX.w * 0.96) / Math.max(4, p.count.length * 0.5));

  // Hero number.
  const block = prog(frame, HIT, 16, ease.snap);
  const heroSize = Math.min(380, (BOX.w * 0.92) / Math.max(1, p.short.length * 0.78));
  const heroStyle: CSSProperties = {
    position: 'absolute',
    left: BOX.x,
    width: BOX.w,
    top: BOX.y + BOX.h / 2 - heroSize * 0.56,
    textAlign: 'center',
    ...displayFace(p.font),
    fontSize: heroSize,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
  };
  // The hero sits across the half-block: paper on the red half, ink on the paper half.
  const half = (side: 'l' | 'r'): CSSProperties => ({
    ...heroStyle,
    color: side === 'l' ? onAccent : p.ink,
    clipPath: side === 'l' ? `inset(0 50% 0 0)` : `inset(0 0 0 50%)`,
  });

  const stats = [
    [p.stat1Label, p.stat1],
    [p.stat2Label, p.stat2],
    [p.stat3Label, p.stat3],
  ];
  const statsOut = prog(frame, OUTRO - 10, 16, ease.in);
  const tickY = 676;
  const tick = 14;

  return (
    <AbsoluteFill style={{ background: p.background, color: p.ink, overflow: 'hidden' }}>
      <AbsoluteFill style={{ translate: `${shake.x}px ${shake.y}px`, scale: String(push) }}>
        {/* Swiss 12-col grid, drawing down from the top */}
        {Array.from({ length: 13 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: PAD + ((W - PAD * 2) * i) / 12,
              top: 0,
              width: 1,
              height: H * clamp(grid * 1.4 - i * 0.03),
              background: hexA(p.ink, isDark(p.background) ? 0.1 : 0.07),
            }}
          />
        ))}
        {/* masthead rule + corner block + eyebrow */}
        <div style={{ position: 'absolute', left: PAD, top: 92, height: 4, width: (W - PAD * 2) * prog(frame, 4, 34, ease.inOutSoft), background: p.ink }} />
        <div style={{ position: 'absolute', left: PAD, top: 92, width: 60, height: 22, background: p.accent, scale: `${prog(frame, 10, 18, ease.backOut)} 1`, transformOrigin: 'left' }} />
        <div style={{ position: 'absolute', left: PAD, top: 126, fontFamily: FONTS.vt323, fontSize: 44, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          {p.eyebrow.slice(0, Math.floor(prog(frame, 8, 40, ease.linear) * p.eyebrow.length))}
          <span style={{ opacity: frame < 60 && Math.floor(frame / 8) % 2 ? 0 : 1, color: p.accent }}>▌</span>
        </div>
        <div style={{ position: 'absolute', right: PAD, top: 126, fontFamily: FONTS.vt323, fontSize: 44, letterSpacing: '0.1em', color: p.accent }}>
          {frame < HIT ? '● LIVE' : '✓ MILESTONE'}
        </div>

        {/* Hero box: thin frame always, red half-block slams in on the hit */}
        <div style={{ position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, border: `3px solid ${p.ink}`, boxSizing: 'border-box', opacity: prog(frame, 16, 20) }} />
        <div style={{ position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w / 2, height: BOX.h, background: p.accent, scale: `1 ${block}`, transformOrigin: 'top' }} />
        <div style={{ position: 'absolute', left: BOX.x + BOX.w / 2 - 1.5, top: BOX.y - 18, width: 3, height: BOX.h + 36, background: p.ink, scale: `1 ${prog(frame, HIT + 6, 14, ease.out)}`, transformOrigin: 'top' }} />

        {/* Rolling counter (bar 1) */}
        {frame < HIT + 10 && (
          <div
            style={{
              position: 'absolute',
              left: BOX.x,
              width: BOX.w,
              top: BOX.y + BOX.h / 2 - countSize * 0.55,
              textAlign: 'center',
              fontFamily: FONTS.vt323,
              fontSize: countSize,
              lineHeight: 1,
              letterSpacing: '0.02em',
              opacity: prog(frame, 14, 10) * (1 - counterOut),
              filter: counterOut > 0 ? `blur(${counterOut * 16}px)` : undefined,
              scale: String(mix(1, 1.15, counterOut)),
            }}
          >
            {rolled(p.count, roll)}
          </div>
        )}

        {/* Hero number on the hit */}
        {frame >= HIT && (
          <>
            <SweepReveal frame={frame} start={HIT + 2} dur={26} blur={18} scaleFrom={1.25} style={half('l')}>
              {p.short}
            </SweepReveal>
            <SweepReveal frame={frame} start={HIT + 2} dur={26} blur={18} scaleFrom={1.25} style={half('r')}>
              {p.short}
            </SweepReveal>
            <Glint frame={frame} start={STATS + T.beats(3)} dur={44} style={heroStyle}>
              {p.short}
            </Glint>
          </>
        )}
        <div
          style={{
            position: 'absolute',
            left: BOX.x,
            top: BOX.y + BOX.h + 22,
            ...displayFace(p.font),
            fontSize: 60,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            opacity: prog(frame, HIT + 14, 20),
            translate: `${mix(-30, 0, prog(frame, HIT + 14, 26))}px 0`,
          }}
        >
          {p.label}
        </div>

        {/* The log: message ticks stream along a rule, all the time */}
        <div style={{ position: 'absolute', left: PAD, top: tickY + tick + 8, width: (W - PAD * 2) * prog(frame, 20, 40, ease.inOutSoft), height: 3, background: p.ink }} />
        <div style={{ position: 'absolute', left: PAD, top: tickY, width: W - PAD * 2, height: tick, overflow: 'hidden' }}>
          {Array.from({ length: 34 }, (_, i) => {
            const speed = frame < HIT ? mix(1, 5, roll) : 2.2;
            const travel = frame < HIT ? frame * 1 + roll * 300 : 300 + HIT + (frame - HIT) * speed * 0.5;
            const x = ((i * 28 + travel * 1.6) % (34 * 28)) - 28;
            return <div key={i} style={{ position: 'absolute', left: x, top: 0, width: tick, height: tick, background: i % 6 === 2 ? p.accent : hexA(p.ink, i % 2 ? 0.25 : 0.6) }} />;
          })}
        </div>

        {/* Log feed scrolling up under the counter until the stats take over */}
        <div
          style={{
            position: 'absolute',
            left: PAD,
            width: W - PAD * 2,
            top: 726,
            height: 4 * 64,
            overflow: 'hidden',
            opacity: prog(frame, 24, 20) * (1 - prog(frame, STATS - 16, 16, ease.in)),
            maskImage: 'linear-gradient(180deg, transparent 0%, black 30%, black 75%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 30%, black 75%, transparent 100%)',
          }}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const rate = frame < HIT ? mix(0.6, 2.4, roll) : 0.9;
            const scroll = frame < HIT ? frame * 0.6 + roll * 260 : HIT * 0.6 + 260 + (frame - HIT) * rate;
            const y = ((i * 64 - scroll) % (12 * 64) + 12 * 64) % (12 * 64) - 64;
            return (
              <div key={i} style={{ position: 'absolute', top: y, left: 0, fontFamily: FONTS.vt323, fontSize: 46, letterSpacing: '0.06em', whiteSpace: 'nowrap', color: i % 4 === 3 ? p.accent : hexA(p.ink, 0.62) }}>
                {'> '}
                {LOG[i % LOG.length]}
              </div>
            );
          })}
        </div>

        {/* Bar 3: stats on the beats */}
        <div style={{ position: 'absolute', left: PAD, width: W - PAD * 2, top: 722, opacity: 1 - statsOut, translate: `0 ${-statsOut * 24}px` }}>
          {stats.map(([lab, val], i) => {
            const t = prog(frame, STATS + i * T.beat, 22, ease.out);
            return (
              <div key={i} style={{ position: 'relative', height: 86, borderBottom: `2px solid ${hexA(p.ink, 0.85 * t)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: t, translate: `${(1 - t) * 40}px 0` }}>
                <span style={{ fontFamily: FONTS.vt323, fontSize: 46, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{lab}</span>
                <span style={{ ...displayFace(p.font), fontSize: 62, color: i === 2 ? p.accent : p.ink }}>{val}</span>
              </div>
            );
          })}
        </div>

        {/* Bar 4: thank-you, logo, url */}
        <div style={{ position: 'absolute', left: PAD, width: W - PAD * 2, top: 730 }}>
          <WordsIn text={p.thanks} frame={frame} start={OUTRO + 6} stagger={4} style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 58, lineHeight: 1.12, letterSpacing: '-0.02em' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 34, opacity: prog(frame, OUTRO + T.beats(2), 20), translate: `0 ${mix(18, 0, prog(frame, OUTRO + T.beats(2), 26))}px` }}>
            {p.logo && <Img src={p.logo} style={{ height: 64, objectFit: 'contain' }} />}
            <span style={{ fontFamily: FONTS.vt323, fontSize: 48, letterSpacing: '0.1em', padding: '6px 22px', background: p.accent, color: onAccent, boxShadow: `6px 6px 0 ${p.ink}` }}>{p.url} →</span>
          </div>
        </div>
      </AbsoluteFill>

      {/* hit flash: accent bloom (multiply on paper reads as a red pulse) */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 36%, ${hexA(p.accent, flash * 0.55)} 0%, transparent 60%)`, mixBlendMode: isDark(p.background) ? 'screen' : 'multiply' }} />
      {/* exit: red panel wipes across, leaving the url */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: W * wipe, background: p.accent, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: W,
            top: H / 2 - 90,
            textAlign: 'center',
            color: onAccent,
            opacity: prog(frame, END - 16, 12),
          }}
        >
          <div style={{ ...displayFace(p.font), fontSize: 120, lineHeight: 1 }}>{p.short}</div>
          <div style={{ fontFamily: FONTS.vt323, fontSize: 52, letterSpacing: '0.12em', marginTop: 18 }}>{p.url}</div>
        </div>
      </div>
      <FilmOverlay grain={0.05} vignette={isDark(p.background) ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
