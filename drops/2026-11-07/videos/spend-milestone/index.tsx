import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, WordsIn, clamp, ease, gradientText, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Spend Milestone',
  category: 'milestone',
  description:
    'Square milestone post: a ledger counter rolls up and slams into a huge gold "$100M", the 32-segment allocation bar fills, stats land on the beat and it closes on a thank-you to customers.',
  tags: ['milestone', 'celebration', 'finance', 'counter', 'social', 'ads'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  brand: text('Brand (shown without a logo)').default('MANDATE'),
  issue: text('Corner label').default('No. 100'),
  eyebrow: text().default('Milestone · Nov 2026'),
  value: text('Milestone value').default('$100M'),
  caption: text().default('in ad spend now managed by Mandate agents'),
  stat1: text('Stat 1 (value|label)').default('32|platforms'),
  stat2: text('Stat 2 (value|label)').default('4,200|teams'),
  stat3: text('Stat 3 (value|label)').default('−31%|avg. CPA'),
  thanks: text('Closing line').default('Thank you, 4,200 teams.'),
  ticker: text('Ticker tape').default('META ▲2.3   GOOGLE ▲0.9   TIKTOK ▲3.1   YOUTUBE ▼0.4   AMAZON ▲1.2   LINKEDIN ▼1.8   REDDIT ▲0.6   SNAP ▲0.8'),
  background: color().default('#0D0D0F'),
  surface: color('Ticker strip').default('#1C1C20'),
  textColor: color('Text').default('#F3EDE2'),
  accent: color('Gold').default('#C9A45C'),
  muted: color('Rules & muted').default('#6E6A62'),
  pop: color('Highlight').default('#E8D9B5'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', textColor: '#0A0A0A', accent: '#E3000F', muted: '#8C8C88', pop: '#E3000F' },
  'forest-1b': { background: '#0E1A14', surface: '#18291F', textColor: '#EAF2DC', accent: '#B5E550', muted: '#4E8A5B', pop: '#FF9F43', value: '1B', eyebrow: 'Milestone · Auctions won', caption: 'auctions won for our customers this year', stat3: '4.2×|blended ROAS' },
  'cherry-10k': { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#F7B32B', muted: '#B0707A', pop: '#F5C6AA', value: '10,000', issue: 'Day 365', eyebrow: 'Milestone · Year one', caption: 'campaigns launched by Mandate agents', thanks: 'Here’s to year two.' },
};

type P = z.infer<typeof schema>;

const dark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** "$100M" → prefix "$", target 100,000,000, so the roll counts real digits. */
function parseValue(v: string) {
  const m = v.match(/^([^\d]*)([\d.,]+)\s*([KkMmBb])?(.*)$/);
  if (!m) return { prefix: '', target: 0, ok: false };
  const n = parseFloat(m[2].replace(/,/g, '')) || 0;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[3] ?? '').toLowerCase() as 'k' | 'm' | 'b'] ?? 1;
  return { prefix: m[1], target: n * mult, ok: true };
}

export default function SpendMilestone(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const isDark = dark(p.background);
  const end = video.durationInFrames;
  const IMPACT = T.bars(1); // bar 2 downbeat
  const FILL = T.bars(2); // bar 3: allocation bar + stats
  const THANKS = T.bars(3); // bar 4: closing line
  const PAD = 90;

  // Camera: slow push after the hit + a short shake on impact.
  const push = mix(1, 1.045, prog(frame, IMPACT, end - IMPACT, ease.inOutSoft));
  const shakeK = frame >= IMPACT ? Math.exp(-(frame - IMPACT) / 7) : 0;
  const shake = `${Math.sin(frame * 2.1) * 14 * shakeK}px ${Math.cos(frame * 2.7) * 10 * shakeK}px`;
  const outro = prog(frame, end - 30, 30, ease.in);
  const flash = keys(frame, [IMPACT - 2, IMPACT + 2, IMPACT + 28], [0, 1, 0], [ease.out, ease.outSoft]);

  // Rolling ledger counter (bar 1), landing exactly on the beat.
  const { prefix, target, ok } = parseValue(p.value);
  const roll = prog(frame, T.beats(1), IMPACT - T.beats(1), ease.inSoft);
  const rolled = Math.floor(target * roll + (roll < 1 ? rand(Math.floor(frame / 2)) * target * 0.01 : 0));
  const rollText = `${prefix}${Math.min(target, rolled).toLocaleString('en-US')}`;

  const HERO = Math.min(330, (W - PAD * 2) / Math.max(2.4, p.value.length * 0.7));
  const heroY = 300;
  const heroIn = prog(frame, IMPACT, 26, ease.out);
  const ruleY = 196;

  const stats = [p.stat1, p.stat2, p.stat3].map((s) => s.split('|')).filter((s) => s[0]);
  const statsOut = prog(frame, THANKS - 6, 22, ease.in);
  const thanksWords = p.thanks.split(' ');
  const mid = Math.ceil(thanksWords.length / 2);
  const thanksLines = [thanksWords.slice(0, mid).join(' '), thanksWords.slice(mid).join(' ')].filter(Boolean);
  const THX = Math.min(88, (W - PAD * 2) / (Math.max(...thanksLines.map((l) => l.length)) * 0.68));

  const segs = Array.from({ length: 32 }, (_, i) => 0.35 + rand(i * 4.3 + 1) * (i < 6 ? 2.6 : 1));
  const segTotal = segs.reduce((a, b) => a + b, 0);
  const barW = W - PAD * 2;
  const gap = 4;

  const mono = { fontFamily: FONTS.spacemono } as const;
  const heroStyle = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: heroY,
    textAlign: 'center' as const,
    fontFamily: FONTS.archivo,
    fontSize: HERO,
    lineHeight: 1,
    letterSpacing: '-0.05em',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: isDark ? 0.09 : 0.14, size: 40, y: -frame * 0.15, color: isDark ? '201,164,92' : '10,10,10' }}
        lift={isDark ? 'rgba(243,237,226,0.05)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: W / 2, y: heroY + HERO * 0.5, size: mix(500, 1300, prog(frame, 0, IMPACT, ease.inSoft)), color: hexA(p.accent, isDark ? 0.3 : 0.18), opacity: keys(frame, [0, IMPACT, IMPACT + 40, end], [0.35, 1, 0.75, 0.6]) },
          { x: 120, y: H - 80, size: 900, color: hexA(p.muted, isDark ? 0.35 : 0.2), opacity: 0.6 + 0.25 * Math.sin(frame / 40) },
        ]}
        grain={0}
        vignette={isDark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ scale: String(push), translate: shake, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={40} color={p.pop} seed={9} speed={0.7} opacity={isDark ? 0.35 : 0.2} maxSize={4} />

        {/* masthead: logo or wordmark, issue label */}
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: 96, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: prog(frame, 4, 24), translate: `0 ${mix(-14, 0, prog(frame, 4, 30))}px` }}>
          {p.logo ? <Img src={p.logo} style={{ height: 54, objectFit: 'contain' }} /> : <span style={{ fontFamily: FONTS.archivo, fontSize: 44, letterSpacing: '-0.03em' }}>{p.brand}</span>}
          <span style={{ ...mono, fontSize: 26, letterSpacing: '0.3em', textTransform: 'uppercase', color: p.accent }}>{p.issue}</span>
        </div>

        {/* gold rule with ledger ticks draws across */}
        <svg style={{ position: 'absolute', left: PAD, top: ruleY }} width={barW} height={24}>
          <line x1={0} y1={4} x2={barW * prog(frame, 8, 40, ease.inOutSoft)} y2={4} stroke={p.accent} strokeWidth={2} />
          {Array.from({ length: 33 }, (_, i) => (
            <line key={i} x1={(i / 32) * barW} x2={(i / 32) * barW} y1={4} y2={i % 8 === 0 ? 20 : 12} stroke={p.accent} strokeWidth={1.5} opacity={prog(frame, 8 + i * 1.2, 10)} />
          ))}
        </svg>
        <div style={{ position: 'absolute', left: PAD, top: ruleY + 38, ...mono, fontSize: 28, letterSpacing: '0.3em', textTransform: 'uppercase', color: hexA(p.textColor, 0.8), opacity: prog(frame, 18, 24), translate: `${mix(-20, 0, prog(frame, 18, 30))}px 0` }}>
          {p.eyebrow}
        </div>

        {/* bar 1: rolling ledger counter */}
        {ok && frame < IMPACT + 4 && (
          <div
            style={{
              position: 'absolute',
              width: W,
              top: heroY + HERO * 0.28,
              textAlign: 'center',
              ...mono,
              fontWeight: 700,
              fontSize: Math.min(110, (W - PAD * 2) / (rollText.length * 0.62)),
              letterSpacing: '-0.02em',
              color: mix(0, 1, roll) > 0.9 ? p.pop : p.textColor,
              opacity: prog(frame, T.beats(1) - 6, 14) * (1 - prog(frame, IMPACT - 2, 6)),
              filter: `blur(${(1 - roll) * 2}px)`,
            }}
          >
            {rollText}
          </div>
        )}

        {/* the hit: Archivo value slams in */}
        {frame >= IMPACT && (
          <>
            <div style={{ ...heroStyle, scale: String(mix(1.35, 1, heroIn)), filter: heroIn < 1 ? `blur(${(1 - heroIn) * 18}px)` : undefined, opacity: clamp(heroIn * 2) }}>
              <span style={gradientText(`linear-gradient(160deg, ${p.pop} 0%, ${p.accent} 45%, ${isDark ? '#8C6A2E' : p.accent} 100%)`, HERO)}>{p.value}</span>
            </div>
            <Glint frame={frame} start={IMPACT + T.beats(2)} dur={40} style={heroStyle}>
              {p.value}
            </Glint>
            <Glint frame={frame} start={THANKS} dur={44} style={heroStyle}>
              {p.value}
            </Glint>
          </>
        )}
        {/* shockwave rule: a horizontal gold line snapping outward */}
        <div
          style={{
            position: 'absolute',
            left: W / 2 - (W / 2) * prog(frame, IMPACT, 30, ease.out),
            width: W * prog(frame, IMPACT, 30, ease.out),
            top: heroY + HERO * 1.02,
            height: mix(8, 2, prog(frame, IMPACT, 40)),
            background: `linear-gradient(90deg, transparent, ${p.accent} 20%, ${p.pop} 50%, ${p.accent} 80%, transparent)`,
            opacity: frame >= IMPACT ? mix(1, 0.6, prog(frame, IMPACT + 20, 40)) : 0,
          }}
        />
        <Streaks frame={frame} start={IMPACT} dur={46} direction="out" count={120} width={W} height={H} cy={heroY + HERO * 0.5} seed={4} intensity={0.9} color={p.accent} highlight={p.pop} />

        <WordsIn
          text={p.caption}
          frame={frame}
          start={IMPACT + 26}
          style={{ position: 'absolute', left: 150, right: 150, top: heroY + HERO * 1.02 + 34, justifyContent: 'center', textAlign: 'center', ...mono, fontSize: 44, lineHeight: 1.25, color: hexA(p.textColor, 0.88) }}
        />

        {/* bar 3: allocation bar fills segment by segment */}
        <div style={{ position: 'absolute', left: PAD, top: 740, width: barW, height: 26, display: 'flex', gap }}>
          {segs.map((s, i) => {
            const t = prog(frame, FILL - 24 + i * 1.6, 14, ease.backOut);
            return (
              <div
                key={i}
                style={{
                  width: ((barW - gap * 31) * s) / segTotal,
                  height: 26,
                  transformOrigin: 'bottom',
                  scale: `1 ${clamp(t, 0, 1.2)}`,
                  opacity: clamp(t * 3),
                  background: i === 2 ? p.accent : i < 6 ? hexA(p.textColor, 0.78) : hexA(p.muted, 0.6 + rand(i) * 0.3),
                  boxShadow: i === 2 ? `0 0 24px ${hexA(p.accent, 0.7)}` : undefined,
                }}
              />
            );
          })}
        </div>

        {/* stats land on beats, then make way for the thank-you */}
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: 800, display: 'flex', justifyContent: 'space-between', opacity: 1 - statsOut, translate: `0 ${-statsOut * 30}px` }}>
          {stats.map(([v, l], i) => {
            // Half-beat stagger from the bar-3 downbeat, so all three hold for ~1.5 beats.
            const t = prog(frame, FILL + T.beats(i * 0.5), 20, ease.out);
            return (
              <div key={i} style={{ opacity: t, translate: `0 ${mix(26, 0, t)}px`, filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined, textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center' }}>
                <div style={{ fontFamily: FONTS.archivo, fontSize: 64, lineHeight: 1, letterSpacing: '-0.03em', color: i === 1 ? p.accent : p.textColor }}>{v}</div>
                <div style={{ ...mono, fontSize: 24, letterSpacing: '0.24em', textTransform: 'uppercase', color: hexA(p.textColor, 0.65), marginTop: 10 }}>{l}</div>
              </div>
            );
          })}
        </div>

        {/* bar 4: closing line */}
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: 796, fontFamily: FONTS.archivo, fontSize: THX, lineHeight: 0.98, letterSpacing: '-0.035em', textAlign: 'center' }}>
          {thanksLines.map((l, i) => {
            const t = prog(frame, THANKS + 8 + i * 8, 28, ease.out);
            return (
              <div key={i} style={{ opacity: t, translate: `0 ${mix(40, 0, t)}px`, filter: t < 1 ? `blur(${(1 - t) * 12}px)` : undefined, color: i === thanksLines.length - 1 ? p.accent : p.textColor }}>
                {l}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* ticker tape crawl along the bottom edge */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, background: p.surface, borderTop: `2px solid ${p.accent}`, overflow: 'hidden', opacity: prog(frame, 0, 20) * (1 - outro) }}>
        <div style={{ position: 'absolute', top: 12, left: 0, whiteSpace: 'pre', ...mono, fontSize: 24, letterSpacing: '0.12em', color: hexA(p.textColor, 0.8), translate: `${-((frame * 2.2) % 2400)}px 0` }}>
          {`${p.ticker}   ${p.ticker}   ${p.ticker}   ${p.ticker}`}
        </div>
      </div>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${((heroY + HERO * 0.5) / H) * 100}%, ${hexA(p.pop, flash)} 0%, ${hexA(p.accent, flash * 0.5)} 25%, transparent 60%)`, mixBlendMode: isDark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={isDark ? 0.06 : 0.035} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
