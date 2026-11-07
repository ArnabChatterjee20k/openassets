import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, WordsIn, clamp, ease, gradientText, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Channel Intro',
  category: 'intro',
  description:
    'Brutalist show ident for Mandate’s weekly video: 32 allocation segments slam in on the beat with flickering ticker labels, collapse into a gold rule as the wordmark hits huge, then the episode title types in and a gold wipe exits.',
  tags: ['intro', 'ident', 'youtube', 'series', 'brand', 'finance'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(3) };

export const schema = z.object({
  wordmark: text().default('MANDATE'),
  episode: text('Episode label').default('Ep. 14 · The Morning Ledger'),
  tagline: text().default('How our agent moved $2.1M across 32 platforms overnight.'),
  meta: text('Corner meta').default('Nov 07 · 2026'),
  url: text('End card').default('mandate.ai'),
  platforms: text('Segment labels (comma list)').default('META,GOOGLE,TIKTOK,YOUTUBE,AMAZON,LINKEDIN'),
  background: color().default('#0D0D0F'),
  surface: color('Panels').default('#1C1C20'),
  textColor: color('Text').default('#F3EDE2'),
  accent: color('Gold').default('#C9A45C'),
  muted: color('Rules & muted').default('#6E6A62'),
  pop: color('Highlight').default('#E8D9B5'),
  host: image('Host photo or logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', textColor: '#0A0A0A', accent: '#E3000F', muted: '#8C8C88', pop: '#E3000F' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', textColor: '#EAF2FF', accent: '#FFDD00', muted: '#7FB2FF', pop: '#FFFFFF', episode: 'Ep. 15 · Bid Desk Teardown', tagline: 'Inside one night of 1.8 billion auctions.' },
  'cherry-live': { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#F7B32B', muted: '#B0707A', pop: '#F5C6AA', episode: 'Live · Q4 Budget Clinic', tagline: 'Bring your media plan. We’ll rebalance it on air.', meta: 'Thu 18:00 ET' },
};

type P = z.infer<typeof schema>;

const isDarkHex = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▲▼$%';
/** Split-flap scramble: characters settle left to right after `start`. */
function scramble(label: string, frame: number, start: number, seed: number) {
  if (frame < start) return '';
  return label
    .split('')
    .map((c, i) => {
      if (frame >= start + 6 + i * 2) return c;
      return GLYPHS[Math.floor(rand(seed * 31 + i * 7 + Math.floor(frame / 2)) * GLYPHS.length)];
    })
    .join('');
}

export default function ChannelIntro(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDarkHex(p.background);
  const end = video.durationInFrames;
  const IMPACT = T.bars(1);
  const GLINT = T.bars(2);
  const WIPE = end - T.beats(2) + 6;
  const PAD = 120;

  // Allocation bar: 32 segments, one every 8th note across bar 1.
  const barW = W - PAD * 2;
  const barY = 470;
  const barH = 150;
  const gap = 6;
  // The six named positions are wide enough to carry their ticker labels.
  const segs = Array.from({ length: 32 }, (_, i) => (i < 6 ? 2.6 + rand(i * 4.3 + 1) * 1.4 : 0.3 + rand(i * 4.3 + 1) * 0.7));
  const segTotal = segs.reduce((a, b) => a + b, 0);
  const segX: number[] = [];
  segs.reduce((x, s, i) => ((segX[i] = x), x + ((barW - gap * 31) * s) / segTotal + gap), PAD);
  // One segment per 32nd note (3.75 f), so all 32 are in before the downbeat.
  const segAt = (i: number) => 2 + i * (T.beat / 8) * 0.9;
  const collapse = prog(frame, IMPACT - 10, 12, ease.in);
  const labels = p.platforms.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 6);

  // Wordmark hit.
  const WM = Math.min(400, (W * 0.92) / Math.max(3, p.wordmark.length * 0.78));
  const wmTop = barY + barH / 2 - WM * 0.82;
  const ruleY = wmTop + WM * 1.02;
  const wmIn = prog(frame, IMPACT, 22, ease.out);
  const flash = keys(frame, [IMPACT - 2, IMPACT + 2, IMPACT + 26], [0, 1, 0], [ease.out, ease.outSoft]);
  const shakeK = frame >= IMPACT ? Math.exp(-(frame - IMPACT) / 6) : 0;
  const shake = `${Math.sin(frame * 2.3) * 18 * shakeK}px ${Math.cos(frame * 3.1) * 12 * shakeK}px`;
  const push = mix(1.0, 1.04, prog(frame, IMPACT, end - IMPACT, ease.inOutSoft));

  // Exit: a gold panel wipes across; the URL sits on it.
  const wipe = prog(frame, WIPE, 26, ease.inOut);
  const urlIn = prog(frame, WIPE + 18, 20, ease.out);

  const counter = Math.min(32, segs.filter((_, i) => frame >= segAt(i)).length);
  const hasHost = !!p.host;
  const wmStyle = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: wmTop,
    textAlign: 'center' as const,
    fontFamily: FONTS.archivo,
    fontSize: WM,
    lineHeight: 1,
    letterSpacing: '-0.05em',
    whiteSpace: 'nowrap' as const,
  };
  const mono = { fontFamily: FONTS.spacemono } as const;
  const lowerY = ruleY + 46;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.13, size: 48, x: -frame * 0.25, color: dark ? '201,164,92' : '10,10,10' }}
        lift={dark ? 'rgba(243,237,226,0.05)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: W / 2, y: barY + barH / 2, size: mix(900, 1900, prog(frame, 0, IMPACT, ease.inSoft)), color: hexA(p.accent, dark ? 0.26 : 0.14), opacity: keys(frame, [0, IMPACT, IMPACT + 40, end], [0.4, 1, 0.7, 0.6]) },
          { x: W - 200, y: 120, size: 1100, color: hexA(p.muted, dark ? 0.3 : 0.18), opacity: 0.55 + 0.25 * Math.sin(frame / 40) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ scale: String(push), translate: shake }}>
        <Dust frame={frame} width={W} height={H} count={50} color={p.pop} seed={3} speed={0.8} opacity={dark ? 0.35 : 0.2} maxSize={4} />

        {/* corner chrome: counter + meta, like a terminal header */}
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: 100, display: 'flex', justifyContent: 'space-between', ...mono, fontSize: 30, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: prog(frame, 0, 18) }}>
          <span style={{ color: p.accent }}>Allocating {String(counter).padStart(2, '0')}/32</span>
          <span style={{ color: hexA(p.textColor, 0.7) }}>{p.meta}</span>
        </div>

        {/* type as image: a giant outlined allocation counter behind the bar */}
        {frame < IMPACT && (
          <div
            style={{
              position: 'absolute',
              right: PAD - 30,
              top: barY + barH / 2 - 330,
              fontFamily: FONTS.archivo,
              fontSize: 560,
              lineHeight: 1,
              letterSpacing: '-0.06em',
              color: 'transparent',
              WebkitTextStroke: `3px ${hexA(p.accent, 0.35)}`,
              opacity: prog(frame, 0, 20) * (1 - collapse),
              translate: `0 ${mix(0, -30, prog(frame, 0, IMPACT, ease.inOutSoft))}px`,
            }}
          >
            {String(counter).padStart(2, '0')}
          </div>
        )}

        {/* bar 1: segments slam in, labels scramble above the big ones */}
        {frame < IMPACT + 4 &&
          segs.map((s, i) => {
            const at = segAt(i);
            const t = prog(frame, at, 10, ease.out);
            if (t <= 0) return null;
            const w = ((barW - gap * 31) * s) / segTotal;
            const h = mix(barH, 4, collapse);
            const lit = i === 2;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: segX[i],
                  top: barY + (barH - h) / 2 + mix(-60, 0, t) * (1 - collapse),
                  width: w,
                  height: h,
                  opacity: clamp(t * 2),
                  filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined,
                  background: lit ? p.accent : i < 6 ? hexA(p.textColor, 0.85) : hexA(p.muted, 0.55 + rand(i) * 0.35),
                  boxShadow: lit ? `0 0 40px ${hexA(p.accent, 0.7)}` : undefined,
                }}
              />
            );
          })}
        {frame < IMPACT - 4 &&
          labels.map((l, i) => (
            <div key={i} style={{ position: 'absolute', left: segX[i], top: barY - (i % 2 ? 84 : 48), ...mono, fontSize: 24, fontWeight: 700, letterSpacing: '0.06em', color: i === 2 ? p.accent : hexA(p.textColor, 0.85), opacity: 1 - collapse }}>
              {scramble(l, frame, 10 + i * 9, i + 1)}
            </div>
          ))}
        {frame < IMPACT - 4 &&
          labels.map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: segX[i], top: barY + barH + 18, ...mono, fontSize: 24, color: i === 2 ? p.pop : hexA(p.textColor, 0.6), opacity: prog(frame, 30 + i * 9, 12) * (1 - collapse) }}>
              {rand(i * 9) > 0.25 ? '▲' : '▼'}
              {(rand(i * 5) * 3.4).toFixed(1)}
            </div>
          ))}

        {/* the hit: the bar has become the gold rule, the wordmark slams on top */}
        <div
          style={{
            position: 'absolute',
            left: W / 2 - (barW / 2) * (frame >= IMPACT ? 1 : 0),
            width: frame >= IMPACT ? barW : 0,
            top: ruleY,
            height: 4,
            background: p.accent,
            boxShadow: `0 0 ${mix(40, 10, prog(frame, IMPACT, 40))}px ${hexA(p.accent, 0.8)}`,
          }}
        />
        {frame >= IMPACT && (
          <svg style={{ position: 'absolute', left: PAD, top: ruleY + 4 }} width={barW} height={20}>
            {Array.from({ length: 33 }, (_, i) => (
              <line key={i} x1={(i / 32) * barW} x2={(i / 32) * barW} y1={0} y2={i % 8 === 0 ? 18 : 9} stroke={p.accent} strokeWidth={2} opacity={prog(frame, IMPACT + 4 + Math.abs(i - 16) * 0.8, 10)} />
            ))}
          </svg>
        )}
        {frame >= IMPACT && (
          <>
            <div style={{ ...wmStyle, scale: String(mix(1.25, 1, wmIn)), filter: wmIn < 1 ? `blur(${(1 - wmIn) * 16}px)` : undefined, opacity: clamp(wmIn * 2) }}>
              <span style={gradientText(`linear-gradient(170deg, ${p.textColor} 0%, ${p.textColor} 55%, ${p.accent} 120%)`, WM)}>{p.wordmark}</span>
            </div>
            <Glint frame={frame} start={GLINT} dur={44} style={wmStyle}>
              {p.wordmark}
            </Glint>
          </>
        )}
        <Streaks frame={frame} start={IMPACT} dur={44} direction="out" count={160} width={W} height={H} cy={ruleY} seed={8} intensity={0.9} color={p.accent} highlight={p.pop} />

        {/* lower third: episode + tagline (left), host plate (right, optional) */}
        <div style={{ position: 'absolute', left: PAD, top: lowerY, width: hasHost ? barW - 300 : barW }}>
          <div style={{ ...mono, fontSize: 40, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: p.accent, whiteSpace: 'nowrap' }}>
            {p.episode.slice(0, Math.max(0, Math.floor((frame - IMPACT - 20) / 1.4)))}
            {frame > IMPACT + 20 && frame < GLINT + 30 && Math.floor(frame / 15) % 2 === 0 && <span style={{ color: p.pop }}>▌</span>}
          </div>
          <WordsIn text={p.tagline} frame={frame} start={IMPACT + T.beats(2)} style={{ ...mono, fontSize: 44, lineHeight: 1.3, marginTop: 18, color: hexA(p.textColor, 0.85) }} />
        </div>
        {hasHost && (
          <div
            style={{
              position: 'absolute',
              right: PAD,
              top: lowerY - 6,
              width: 260,
              height: 260,
              border: `3px solid ${p.accent}`,
              boxShadow: `14px 14px 0 ${hexA(p.muted, 0.6)}`,
              background: p.surface,
              overflow: 'hidden',
              opacity: prog(frame, IMPACT + 30, 20),
              translate: `0 ${mix(30, 0, prog(frame, IMPACT + 30, 30))}px`,
            }}
          >
            <Img src={p.host} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)', scale: String(mix(1.12, 1.02, prog(frame, IMPACT + 30, 200, ease.outSoft))) }} />
            <div style={{ position: 'absolute', inset: 0, background: p.accent, mixBlendMode: 'multiply', opacity: 0.55 }} />
          </div>
        )}
      </AbsoluteFill>

      {/* flash on the hit */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at 50% ${(ruleY / H) * 100}%, ${hexA(p.pop, flash)} 0%, ${hexA(p.accent, flash * 0.5)} 30%, transparent 70%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />

      {/* exit wipe: gold panel with the URL */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: W * wipe, background: p.accent, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, width: W, top: H / 2 - 50, textAlign: 'center', fontFamily: FONTS.archivo, fontSize: 96, letterSpacing: '-0.03em', color: p.background, opacity: urlIn, translate: `0 ${mix(20, 0, urlIn)}px` }}>
          {p.url}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: W * wipe - 10, width: 10, background: p.pop, opacity: wipe > 0 && wipe < 1 ? 1 : 0 }} />

      <FilmOverlay grain={dark ? 0.06 : 0.035} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
