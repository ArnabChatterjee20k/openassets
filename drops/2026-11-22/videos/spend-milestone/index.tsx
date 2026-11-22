import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { FilmOverlay, Glint, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Spend Milestone',
  category: 'milestone',
  description:
    'Square milestone post on a Swiss grid: rules draw in on the beat, the agent’s red square hops cell to cell, then snaps into a red block where the milestone counts up in editorial serif, followed by three stat rows and a thank-you.',
  tags: ['milestone', 'stats', 'swiss', 'count up', 'social', 'ad agent'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat 30f, bar 120f
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  masthead: text('Masthead').default('Folio · Milestone · Nov 2026'),
  label: text('Number label').default('Ad spend managed by agents'),
  prefix: text('Prefix').default('$'),
  value: text('Milestone number').default('10000000'),
  suffix: text('Suffix').default(''),
  subline: text('Subline').default('Across 32 platforms, rebalanced every hour.'),
  thanks: text('Thank-you line').default('Thank you for trusting us with it.'),
  stat1: text('Stat 1 value').default('32'),
  stat1Label: text('Stat 1 label').default('Platforms connected'),
  stat2: text('Stat 2 value').default('1,400'),
  stat2Label: text('Stat 2 label').default('Growth teams'),
  stat3: text('Stat 3 value').default('4.2×'),
  stat3Label: text('Stat 3 label').default('Median ROAS'),
  font: font('Display font').default('instrument'),
  background: color().default('#F5F5F0'),
  surface: color('Grid cells').default('#E6E6E1'),
  ink: color('Ink').default('#0A0A0A'),
  accent: color('Block').default('#E3000F'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-edition': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', accent: '#C9A45C', masthead: 'Folio · Night Edition' },
  'ad-count': { label: 'Ads launched by the agent', prefix: '', value: '1000000', subline: 'One million ads, written, sized and shipped.', stat3: '−31%', stat3Label: 'Avg. CPA' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', font: 'gloock' },
  bauhaus: { background: '#F2EBDD', surface: '#E4D9C4', ink: '#111111', accent: '#1D4E9E', value: '250000000', label: 'Annual spend under management' },
};

type P = z.infer<typeof schema>;

const W = 1080;
const H = 1080;
const PAD = 80;
const CELL = (W - PAD * 2) / 8; // 115
const BLOCK = { x: PAD, y: 250, w: W - PAD * 2, h: 330 };
const HOPS: [number, number][] = [
  [1, 6],
  [5, 1],
  [2, 3],
  [6, 6],
];

const TICKER = 'GGL +2.1%   ·   MTA +0.8%   ·   TTK +4.6%   ·   LKD +1.2%   ·   AMZ +3.0%   ·   RDT −0.4%   ·   PIN +1.9%   ·   SNP +0.6%   ·   YTB +2.7%   ·   CTV +5.2%';

function fmt(target: number, t: number) {
  const v = Math.round(target * t);
  return v.toLocaleString('en-US');
}

export default function SpendMilestone(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const HIT = T.bars(1); // block + count-up
  const STATS = T.bars(2) + T.beats(1);
  const OUTRO = T.bars(3);

  const isDark = parseInt(p.background.slice(1, 3), 16) < 90;
  const exit = prog(frame, end - 28, 28, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 14) * 5 : 0;

  // Rules draw on beats: horizontals on beat 0, verticals on beat 1.
  const hRule = prog(frame, 0, 34, ease.inOutSoft);
  const vRule = prog(frame, T.beats(1), 34, ease.inOutSoft);

  // The agent square: hops on beats in bar 1, then grows into the block on the downbeat.
  const hop = Math.min(HOPS.length - 1, Math.floor(frame / T.beat));
  const hopT = prog(frame, hop * T.beat, 14, ease.out);
  const prev = HOPS[Math.max(0, hop - 1)];
  const cur = HOPS[hop];
  const sqX = PAD + mix(prev[0], cur[0], hop === 0 ? 1 : hopT) * CELL;
  const sqY = 130 + mix(prev[1], cur[1], hop === 0 ? 1 : hopT) * CELL;
  const grow = prog(frame, HIT - 4, 26, ease.out);
  const sq = {
    x: mix(sqX, BLOCK.x, grow),
    y: mix(sqY, BLOCK.y, grow),
    w: mix(CELL, BLOCK.w, grow),
    h: mix(CELL, BLOCK.h, grow),
  };
  const sqIn = prog(frame, 0, 10, ease.out);
  const blockPulse = frame > OUTRO ? 1 + Math.sin((frame - OUTRO) / 9) * 0.004 : 1;

  // Count-up after the hit.
  const target = parseFloat(p.value.replace(/[^0-9.]/g, '')) || 0;
  const count = prog(frame, HIT + 6, T.beats(3), ease.out);
  const shown = `${p.prefix}${fmt(target, count)}${p.suffix}`;
  const finalStr = `${p.prefix}${fmt(target, 1)}${p.suffix}`;
  const NUM = Math.min(200, (BLOCK.w * 0.9) / (finalStr.length * (p.font === 'instrument' ? 0.43 : 0.6)));
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 24], [0, 1, 0], [ease.out, ease.outSoft]);

  const stats = [
    [p.stat1, p.stat1Label],
    [p.stat2, p.stat2Label],
    [p.stat3, p.stat3Label],
  ];
  const subOut = prog(frame, OUTRO + T.beats(1), 14, ease.in);
  const thanksAt = OUTRO + T.beats(1) + 10;

  const numberStyle = {
    position: 'absolute' as const,
    left: BLOCK.x,
    width: BLOCK.w,
    top: BLOCK.y + BLOCK.h / 2 - NUM * 0.58 - 22,
    textAlign: 'center' as const,
    ...displayFace(p.font),
    fontSize: NUM,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ background: p.background, color: p.ink, fontFamily: FONTS.familjen }}>
      {/* soft paper light */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 40%, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'} 0%, transparent 70%)` }} />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px 0`, opacity: 1 - exit }}>
        {/* Grid: cells tint in during bar 1, then settle back as texture */}
        {Array.from({ length: 64 }, (_, i) => {
          const c = i % 8;
          const r = Math.floor(i / 8);
          const at = 20 + ((i * 37) % 64) * 1.4;
          const on = prog(frame, at, 16, ease.out) * (1 - prog(frame, HIT, 40, ease.inOut) * 0.6);
          return (c + r) % 3 === 0 ? (
            <div key={i} style={{ position: 'absolute', left: PAD + c * CELL, top: 130 + r * CELL, width: CELL, height: CELL, background: p.surface, opacity: on * 0.8 }} />
          ) : null;
        })}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1={PAD} y1={130 + i * CELL} x2={PAD + (W - PAD * 2) * hRule} y2={130 + i * CELL} stroke={hexA(p.ink, 0.14)} strokeWidth={1} />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={PAD + i * CELL} y1={130} x2={PAD + i * CELL} y2={130 + CELL * 8 * vRule} stroke={hexA(p.ink, 0.14)} strokeWidth={1} />
          ))}
        </svg>
        {/* cell indices, tiny mono, ticking on with the rules */}
        {Array.from({ length: 8 }, (_, c) => (
          <div key={c} style={{ position: 'absolute', left: PAD + c * CELL + 8, top: 136, fontFamily: FONTS.spacemono, fontSize: 15, opacity: prog(frame, T.beats(1) + c * 4, 14) * 0.45 }}>
            {String(c + 1).padStart(2, '0')}
          </div>
        ))}

        {/* Masthead */}
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: 56, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: FONTS.spacemono, fontSize: 24, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: prog(frame, 4, 20), translate: `0 ${mix(-12, 0, prog(frame, 4, 24))}px` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {p.logo ? <Img src={p.logo} style={{ height: 40, objectFit: 'contain' }} /> : <span style={{ fontWeight: 700, letterSpacing: '0.1em' }}>FOLIO</span>}
          </span>
          <span style={{ opacity: 0.7, fontSize: 20 }}>{p.masthead}</span>
        </div>
        <div style={{ position: 'absolute', left: PAD, top: 116, height: 4, width: (W - PAD * 2) * prog(frame, 0, 30, ease.inOutSoft), background: p.ink }} />

        {/* Number label above the block */}
        <div style={{ position: 'absolute', left: PAD, top: BLOCK.y - 52, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONTS.spacemono, fontSize: 26, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: prog(frame, HIT + 10, 20), translate: `${mix(-20, 0, prog(frame, HIT + 10, 24))}px 0` }}>
          {p.label}
        </div>

        {/* The agent square → milestone block */}
        <div
          style={{
            position: 'absolute',
            left: sq.x,
            top: sq.y,
            width: sq.w,
            height: sq.h,
            background: p.accent,
            scale: String(sqIn * blockPulse),
            boxShadow: grow > 0.5 ? `14px 14px 0 ${p.ink}` : undefined,
          }}
        />
        {/* Count-up */}
        {frame >= HIT && (
          <>
            <div style={{ ...numberStyle, color: p.background, opacity: prog(frame, HIT + 4, 12), filter: `blur(${mix(10, 0, prog(frame, HIT + 4, 20))}px)` }}>{shown}</div>
            <Glint frame={frame} start={OUTRO} dur={46} style={numberStyle}>
              {finalStr}
            </Glint>
            {/* Live platform ticker scrolling along the block's foot: keeps the hold alive */}
            <div
              style={{
                position: 'absolute',
                left: BLOCK.x,
                top: BLOCK.y + BLOCK.h - 58,
                width: BLOCK.w,
                height: 58,
                overflow: 'hidden',
                borderTop: `1px solid ${hexA(p.background, 0.45)}`,
                opacity: prog(frame, HIT + 24, 20),
              }}
            >
              <div style={{ position: 'absolute', top: 15, left: 0, whiteSpace: 'nowrap', fontFamily: FONTS.spacemono, fontSize: 22, letterSpacing: '0.12em', color: p.background, translate: `${-((frame * 2.4) % 1320)}px 0` }}>
                {Array.from({ length: 2 }, () => TICKER).join('   ·   ')}
              </div>
            </div>
          </>
        )}

        {/* Subline, swapped for the thank-you in bar 4 */}
        <div style={{ position: 'absolute', left: PAD, top: BLOCK.y + BLOCK.h + 44, width: W - PAD * 2, opacity: 1 - subOut }}>
          <WordsIn text={p.subline} frame={frame} start={T.bars(2)} stagger={4} style={{ fontSize: 44, lineHeight: 1.15, letterSpacing: '-0.01em' }} />
        </div>
        <div style={{ position: 'absolute', left: PAD, top: BLOCK.y + BLOCK.h + 44, width: W - PAD * 2 }}>
          {frame >= thanksAt - 2 && <WordsIn text={p.thanks} frame={frame} start={thanksAt} stagger={4} style={{ ...displayFace(p.font), fontSize: 52, lineHeight: 1.1 }} />}
        </div>

        {/* Stat rows, one per beat, each with a rule that draws first */}
        {stats.map(([v, l], i) => {
          const at = STATS + i * T.beat;
          const y = 760 + i * 92;
          const r = prog(frame, at, 20, ease.inOutSoft);
          const t = prog(frame, at + 6, 22, ease.out);
          return (
            <div key={i}>
              <div style={{ position: 'absolute', left: PAD, top: y, height: i === 0 ? 3 : 1, width: (W - PAD * 2) * r, background: p.ink }} />
              <div style={{ position: 'absolute', left: PAD, top: y + 30, fontFamily: FONTS.spacemono, fontSize: 28, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: t, translate: `0 ${mix(16, 0, t)}px` }}>
                {String(i + 1).padStart(2, '0')}&nbsp;&nbsp;{l}
              </div>
              <div style={{ position: 'absolute', right: PAD, top: y + 6, ...displayFace(p.font), fontSize: 72, lineHeight: 1.05, opacity: t, translate: `0 ${mix(22, 0, t)}px`, filter: `blur(${mix(8, 0, t)}px)` }}>{v}</div>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: PAD, top: 760 + 3 * 92, height: 1, width: (W - PAD * 2) * prog(frame, STATS + T.beats(3), 20, ease.inOutSoft), background: p.ink }} />

        {/* Live dot: the agent keeps blinking during the hold */}
        <div style={{ position: 'absolute', right: PAD, top: BLOCK.y - 44, width: 16, height: 16, background: p.accent, opacity: frame > HIT + 20 ? (Math.floor(frame / 30) % 2 ? 1 : 0.25) : 0 }} />
      </AbsoluteFill>

      {/* Impact flash: a paper-white bloom from the block */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, ${hexA(isDark ? '#ffffff' : p.accent, flash * 0.35)} 0%, transparent 55%)`, mixBlendMode: isDark ? 'screen' : 'multiply', opacity: clamp(flash) }} />
      <FilmOverlay grain={isDark ? 0.06 : 0.045} vignette={isDark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
