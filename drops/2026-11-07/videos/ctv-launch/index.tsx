import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, ease, gradientText, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'CTV Launch',
  category: 'launch',
  description:
    'Channel-launch spot for Mandate: the 32-segment allocation bar builds under a crawling ticker, then a 33rd gold segment slams in on the downbeat with a flash and shockwave as "NOW ON CTV." hits huge. A ledger panel reveals the product screenshot (or a built-in dashboard mock) with partner chips, then a gold end card carries the CTA.',
  tags: ['launch', 'product', 'feature', 'ctv', 'announcement', 'finance', 'ads'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Mandate · Launch · Nov 2026'),
  preline: text('Build-up line').default('32 platforms.'),
  headline: text('Headline line 1').default('Now on'),
  headline2: text('Headline line 2 (accent)').default('CTV.'),
  slotLabel: text('New segment label').default('CTV · #33'),
  body: textarea().default('Platform #33. Same mandate, same guardrails, now bidding on the living-room screen.'),
  chips: text('Partner chips (comma list)').default('Roku,Samsung Ads,LG Ads'),
  panelTitle: text('Panel title').default('Channels / Connected TV'),
  metric: text('Mock metric').default('6.2%'),
  metricLabel: text('Mock metric label').default('of spend moved to CTV · week 1'),
  endEyebrow: text('End card eyebrow').default('Available today'),
  url: text('End card URL').default('mandate.ai'),
  cta: text('CTA button').default('Start trading CTV'),
  tickers: textarea('Ticker tape').default('META ▲2.3   GOOGLE ▲0.9   TIKTOK ▲3.1   YOUTUBE ▼0.4   AMAZON ▲1.2   LINKEDIN ▼1.8   REDDIT ▲0.6   SNAP ▲0.4   PINTEREST ▼0.2'),
  background: color().default('#0D0D0F'),
  surface: color('Panels').default('#1C1C20'),
  textColor: color('Text').default('#F3EDE2'),
  accent: color('Gold').default('#C9A45C'),
  muted: color('Rules & muted').default('#6E6A62'),
  pop: color('Highlight').default('#E8D9B5'),
  screenshot: image('Product screenshot (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', textColor: '#0A0A0A', accent: '#E3000F', muted: '#8C8C88', pop: '#E3000F' },
  blueprint: {
    background: '#0F3B8C', surface: '#134AA8', textColor: '#EAF2FF', accent: '#FFDD00', muted: '#7FB2FF', pop: '#FFFFFF',
    preline: '32 platforms.', headline: 'Now on', headline2: 'Audio.', slotLabel: 'AUDIO · #33', chips: 'Spotify,iHeart,Pandora',
    body: 'Podcast and streaming audio join the book. The agent bids every ad break against your target CPA.', panelTitle: 'Channels / Streaming audio', metric: '3.8%', metricLabel: 'of spend moved to audio · week 1', cta: 'Start trading audio',
  },
  'cherry-retail': {
    background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#F7B32B', muted: '#B0707A', pop: '#F5C6AA',
    headline: 'Now on', headline2: 'Retail.', slotLabel: 'RETAIL · #33', chips: 'Walmart Connect,Instacart,Target Roundel',
    body: 'Retail media joins the mandate: shelf-side ads, bid against the same ROAS floor as everything else.', panelTitle: 'Channels / Retail media', metric: '9.4%', metricLabel: 'of spend moved to retail · week 1', cta: 'Start trading retail',
  },
};

type P = z.infer<typeof schema>;

const isDarkHex = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const mono = (size: number, extra: CSSProperties = {}): CSSProperties => ({ fontFamily: FONTS.spacemono, fontSize: size, lineHeight: 1.25, ...extra });

const W = 1920;
const H = 1080;
const PAD = 120;
// Timeline (frames).
const HIT = T.bars(1); // the 33rd segment slams in
const HEAD = HIT + 2; // headline sweeps in, settles on beat 2 of bar 2
const MOVE = T.bars(2); // headline docks left, panel reveals
const PANEL = MOVE + 22;
const END = T.bars(4); // gold end card wipes in
const OUT = video.durationInFrames - 22;

// Allocation bar geometry: 32 segments plus a reserved 33rd slot on the right.
const BAR = { x: PAD, y: 730, w: W - PAD * 2, h: 104, gap: 6, slot: 168 };
const SEGS = Array.from({ length: 32 }, (_, i) => (i < 6 ? 2.4 + rand(i * 4.3 + 1) * 1.4 : 0.3 + rand(i * 4.3 + 1) * 0.7));
const SEG_TOTAL = SEGS.reduce((a, b) => a + b, 0);
const SEG_SPACE = BAR.w - BAR.slot - BAR.gap * 32;
const SEG_X: number[] = [];
SEGS.reduce((x, s, i) => ((SEG_X[i] = x), x + (SEG_SPACE * s) / SEG_TOTAL + BAR.gap), BAR.x);
const SLOT_X = BAR.x + BAR.w - BAR.slot;
const segAt = (i: number) => 4 + i * (T.beat / 8) * 0.88;

/** Built-in dashboard mock, shown when no screenshot is uploaded. */
function DashboardMock({ p, frame, w, h, chips }: { p: P; frame: number; w: number; h: number; chips: string[] }) {
  const k = (d: number) => prog(frame, PANEL + 20 + d, 40, ease.out);
  const weeks = Array.from({ length: 14 }, (_, i) => 0.16 + i * 0.05 + rand(i * 3.1) * 0.12);
  const cw = w * 0.46;
  const ch = h * 0.42;
  const scan = ((frame - PANEL) * 2.2) % (cw + 60);
  const shares = chips.map((_, i) => 0.92 - i * 0.24 + rand(i + 4) * 0.08);
  return (
    <div style={{ position: 'absolute', inset: 0, padding: 36, boxSizing: 'border-box', color: p.textColor, display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={mono(22, { letterSpacing: '0.24em', textTransform: 'uppercase', color: hexA(p.textColor, 0.6) })}>Week 1 · Allocation</div>
          <div style={{ fontFamily: FONTS.archivo, fontSize: 132, lineHeight: 0.95, letterSpacing: '-0.04em', color: p.accent, marginTop: 10 }}>{p.metric}</div>
          <div style={mono(22, { color: hexA(p.textColor, 0.7), marginTop: 6, maxWidth: w * 0.42 })}>{p.metricLabel}</div>
        </div>
        <svg width={cw} height={ch} style={{ overflow: 'visible' }}>
          {weeks.map((v, i) => {
            const bw = cw / weeks.length - 6;
            const bh = v * ch * k(i * 3);
            const last = i === weeks.length - 1;
            return <rect key={i} x={i * (cw / weeks.length)} y={ch - bh} width={bw} height={bh} fill={last ? p.accent : hexA(p.textColor, 0.28 + i * 0.03)} />;
          })}
          <line x1={0} y1={ch} x2={cw} y2={ch} stroke={hexA(p.muted, 0.9)} strokeWidth={2} />
          <line x1={scan - 30} y1={-10} x2={scan - 30} y2={ch} stroke={p.pop} strokeWidth={2} opacity={0.5} />
        </svg>
      </div>
      <div style={{ borderTop: `2px solid ${hexA(p.muted, 0.6)}`, marginTop: 'auto' }}>
        {chips.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, height: 70, borderBottom: `1px solid ${hexA(p.muted, 0.3)}`, ...mono(24) }}>
            <span style={{ width: 260, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden' }}>{c}</span>
            <span style={{ flex: 1, height: 12, background: hexA(p.muted, 0.25), position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${shares[i] * 100 * k(20 + i * 6)}%`, background: i === 0 ? p.accent : hexA(p.textColor, 0.55) }} />
            </span>
            <span style={{ width: 90, textAlign: 'right', color: p.pop }}>▲{(1.2 + rand(i * 7) * 2).toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CtvLaunch(p: P) {
  const frame = useCurrentFrame();
  useVideoConfig();
  const dark = isDarkHex(p.background);
  const chips = p.chips.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);

  // Camera: slow push across the whole spot, a shake on the hit.
  const push = mix(1, 1.04, prog(frame, 0, END, ease.inOutSoft));
  const shakeK = frame >= HIT ? Math.exp(-(frame - HIT) / 6) : 0;
  const shake = `${Math.sin(frame * 2.3) * 20 * shakeK}px ${Math.cos(frame * 3.1) * 14 * shakeK}px`;
  const flash = keys(frame, [HIT - 2, HIT + 1, HIT + 28], [0, 1, 0], [ease.out, ease.outSoft]);

  // Bar 1: segments build. The bar leaves when the headline docks.
  const counter = Math.min(32, SEGS.filter((_, i) => frame >= segAt(i)).length) + (frame >= HIT ? 1 : 0);
  const barOut = prog(frame, MOVE, 26, ease.in);
  const slotDrop = keys(frame, [HIT - 12, HIT], [-340, 0], ease.in);
  const slotSquash = frame >= HIT ? 1 - Math.exp(-(frame - HIT) / 5) * Math.cos((frame - HIT) * 0.6) * 0.25 : 1;

  // Headline: huge after the hit, docks into the left column at MOVE.
  const dock = prog(frame, MOVE, 30, ease.inOut);
  const longest = Math.max(p.headline.length, p.headline2.length, 4);
  const HA = Math.min(280, (W - PAD * 2) / (longest * 0.82));
  const HB = Math.min(150, 760 / (longest * 0.82));
  const hs = mix(HA, HB, dock);
  const headTop = mix(190, 210, dock);
  const headStyle: CSSProperties = { fontFamily: FONTS.archivo, fontSize: hs, lineHeight: 0.88, letterSpacing: '-0.045em', textTransform: 'uppercase', whiteSpace: 'nowrap' };
  const headBlock = { position: 'absolute' as const, left: PAD, top: headTop };

  // End card.
  const wipe = prog(frame, END, 26, ease.inOut);
  const endIn = (d: number) => prog(frame, END + 16 + d, 26, ease.out);
  const fadeOut = prog(frame, OUT, 22, ease.in);

  const tickerX = -frame * 2.6;
  const slotCx = SLOT_X + BAR.slot / 2;
  const slotCy = BAR.y + BAR.h / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.13, size: 48, x: -frame * 0.2, y: -frame * 0.1, color: dark ? '201,164,92' : '10,10,10' }}
        lift={dark ? 'rgba(243,237,226,0.05)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: slotCx, y: slotCy, size: mix(700, 1500, prog(frame, HIT, 60)), color: hexA(p.accent, dark ? 0.3 : 0.16), opacity: keys(frame, [0, HIT, HIT + 40, MOVE + 30], [0.25, 1, 0.75, 0]) },
          { x: 1400, y: 520, size: 1400, color: hexA(p.accent, dark ? 0.22 : 0.12), opacity: prog(frame, MOVE, 60) * (0.75 + 0.2 * Math.sin(frame / 40)) },
          { x: 160, y: 120, size: 1100, color: hexA(p.muted, dark ? 0.3 : 0.18), opacity: 0.55 + 0.25 * Math.sin(frame / 45) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ scale: String(push), translate: shake }}>
        <Dust frame={frame} width={W} height={H} count={46} color={p.pop} seed={11} speed={0.7} opacity={dark ? 0.35 : 0.2} maxSize={4} />

        {/* type as image: giant outlined platform count, bleeding off the right edge */}
        <div
          style={{
            position: 'absolute',
            right: -110,
            top: 20,
            fontFamily: FONTS.archivo,
            fontSize: 820,
            lineHeight: 1,
            letterSpacing: '-0.07em',
            color: 'transparent',
            WebkitTextStroke: `3px ${hexA(frame >= HIT ? p.accent : p.muted, frame >= HIT ? 0.4 : 0.45)}`,
            opacity: prog(frame, 0, 24) * mix(1, 0.35, dock) * (1 - wipe),
            translate: `0 ${mix(0, -40, prog(frame, 0, END, ease.inOutSoft))}px`,
            scale: String(frame >= HIT ? mix(1.08, 1, prog(frame, HIT, 24)) : 1),
          }}
        >
          {String(counter).padStart(2, '0')}
        </div>

        {/* corner chrome */}
        <div style={{ position: 'absolute', left: PAD, right: PAD, top: 96, display: 'flex', justifyContent: 'space-between', ...mono(28, { letterSpacing: '0.28em', textTransform: 'uppercase' }), opacity: prog(frame, 0, 18) }}>
          <span style={{ color: p.accent }}>{p.eyebrow}</span>
          <span style={{ color: hexA(p.textColor, 0.7) }}>Platforms {String(counter).padStart(2, '0')}</span>
        </div>

        {/* bar 1: the build-up line, leaves just before the hit */}
        {frame < HIT && (
          <div style={{ position: 'absolute', left: PAD, top: 330, opacity: 1 - prog(frame, HIT - 14, 12, ease.in), translate: `0 ${mix(0, -40, prog(frame, HIT - 14, 14, ease.in))}px`, filter: frame > HIT - 14 ? `blur(${prog(frame, HIT - 14, 14) * 12}px)` : undefined }}>
            <WordsIn text={p.preline} frame={frame} start={T.beats(1) - 10} stagger={6} style={{ fontFamily: FONTS.archivo, fontSize: 200, lineHeight: 1, letterSpacing: '-0.045em', color: hexA(p.textColor, 0.92) }} />
            <div style={mono(44, { color: hexA(p.textColor, 0.6), marginTop: 26, opacity: prog(frame, T.beats(2), 20) })}>One budget. One agent.</div>
          </div>
        )}

        {/* the allocation bar + the 33rd slot */}
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - barOut, translate: `0 ${barOut * 60}px` }}>
          {SEGS.map((s, i) => {
            const t = prog(frame, segAt(i), 10, ease.out);
            if (t <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: SEG_X[i],
                  top: BAR.y + mix(-50, 0, t),
                  width: (SEG_SPACE * s) / SEG_TOTAL,
                  height: BAR.h,
                  opacity: clamp(t * 2),
                  filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined,
                  background: i < 6 ? hexA(p.textColor, 0.82 - i * 0.05) : hexA(p.muted, 0.5 + rand(i) * 0.35),
                }}
              />
            );
          })}
          {/* a gold sweep runs along the bar during the hold */}
          {frame >= HIT + 20 && (
            <div style={{ position: 'absolute', left: BAR.x, top: BAR.y, width: BAR.w, height: BAR.h, overflow: 'hidden', mixBlendMode: dark ? 'screen' : 'multiply', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: 260, left: mix(-300, BAR.w, ((frame - HIT - 20) % 60) / 60), background: `linear-gradient(90deg, transparent, ${hexA(p.pop, 0.55)}, transparent)` }} />
            </div>
          )}
          {/* empty slot, waiting */}
          {frame < HIT && (
            <div style={{ position: 'absolute', left: SLOT_X, top: BAR.y, width: BAR.slot, height: BAR.h, boxSizing: 'border-box', border: `3px dashed ${hexA(p.accent, 0.5 + 0.4 * Math.sin(frame / 6))}`, opacity: prog(frame, 60, 20) }} />
          )}
          {/* the new segment slams in */}
          {frame >= HIT - 12 && (
            <div
              style={{
                position: 'absolute',
                left: SLOT_X,
                top: BAR.y + slotDrop,
                width: BAR.slot,
                height: BAR.h,
                background: p.accent,
                boxShadow: `0 0 ${mix(90, 36, prog(frame, HIT, 40))}px ${hexA(p.accent, 0.8)}`,
                scale: `${2 - slotSquash} ${slotSquash}`,
                transformOrigin: '50% 100%',
              }}
            />
          )}
          {/* gold rule with ticks under the bar */}
          <div style={{ position: 'absolute', left: BAR.x, top: BAR.y + BAR.h + 18, width: BAR.w * prog(frame, 0, T.bars(1), ease.inOutSoft), height: 3, background: p.accent }} />
          {/* labels */}
          <div style={{ position: 'absolute', left: BAR.x, top: BAR.y + BAR.h + 40, ...mono(28, { letterSpacing: '0.2em', textTransform: 'uppercase', color: hexA(p.textColor, 0.6) }), opacity: prog(frame, 30, 20) }}>
            Allocation · {String(Math.min(32, counter)).padStart(2, '0')} positions
          </div>
          <div style={{ position: 'absolute', right: W - (SLOT_X + BAR.slot), top: BAR.y - 56, ...mono(30, { fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: p.accent, whiteSpace: 'nowrap' }), opacity: frame < HIT ? (0.55 + 0.35 * Math.sin(frame / 6)) * prog(frame, 60, 20) : 1 }}>
            {frame < HIT ? '+1 ?' : p.slotLabel}
          </div>
        </div>

        {/* shockwave: a gold rule racing out from the slot + rings that start outside it */}
        {frame >= HIT && frame < HIT + 50 && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {[0, 8].map((d, i) => {
              const t = prog(frame, HIT + d, 40, ease.out);
              return <ellipse key={i} cx={slotCx} cy={slotCy} rx={mix(130, 900, t)} ry={mix(90, 520, t)} fill="none" stroke={i ? p.pop : p.accent} strokeWidth={mix(10, 1, t)} opacity={(1 - t) * 0.9} />;
            })}
            <line x1={slotCx - mix(0, 1900, prog(frame, HIT, 30))} x2={slotCx + 40} y1={slotCy} y2={slotCy} stroke={p.pop} strokeWidth={4} opacity={1 - prog(frame, HIT + 10, 30)} />
          </svg>
        )}
        <Streaks frame={frame} start={HIT} dur={44} direction="out" count={150} width={W} height={H} cx={slotCx} cy={slotCy} seed={33} intensity={0.85} color={p.accent} highlight={p.pop} />

        {/* the headline */}
        {frame >= HEAD && (
          <div style={{ ...headBlock, opacity: 1 - wipe }}>
            <SweepReveal frame={frame} start={HEAD} dur={26} blur={18} scaleFrom={1.12} style={{ transformOrigin: '0% 50%' }}>
              <div style={headStyle}>{p.headline}</div>
              <div style={{ ...headStyle, ...gradientText(`linear-gradient(160deg, ${p.pop} 0%, ${p.accent} 55%, ${p.accent} 100%)`, hs), paddingBottom: 0 }}>{p.headline2}</div>
            </SweepReveal>
            <Glint frame={frame} start={T.bars(3) + T.beats(1)} dur={44} style={{ position: 'absolute', inset: 0 }}>
              <div style={headStyle}>{p.headline}</div>
              <div style={headStyle}>{p.headline2}</div>
            </Glint>
          </div>
        )}

        {/* bar 3: copy + chips in the left column */}
        {frame >= MOVE && (
          <div style={{ position: 'absolute', left: PAD, top: headTop + HB * 0.88 * 2 + 44, width: 760, opacity: 1 - wipe }}>
            <WordsIn text={p.body} frame={frame} start={MOVE + 24} stagger={2} style={mono(44, { lineHeight: 1.4, color: hexA(p.textColor, 0.82) })} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 40 }}>
              {chips.map((c, i) => {
                const t = prog(frame, MOVE + T.beats(2) + i * T.beats(0.5), 18, ease.backOut);
                return (
                  <span
                    key={i}
                    style={{
                      ...mono(30, { fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }),
                      padding: '12px 22px',
                      border: `2px solid ${i === 0 ? p.accent : hexA(p.textColor, 0.4)}`,
                      color: i === 0 ? p.accent : p.textColor,
                      background: hexA(p.surface, 0.8),
                      boxShadow: `6px 6px 0 ${hexA(p.muted, 0.5)}`,
                      opacity: clamp(t * 2),
                      scale: String(mix(0.8, 1, t)),
                    }}
                  >
                    {c}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* bar 3: the ledger panel with the product */}
        {frame >= PANEL && (
          <div
            style={{
              position: 'absolute',
              left: 960,
              top: 200 + Math.sin((frame - PANEL) / 50) * 6,
              width: 840,
              height: 640,
              background: p.surface,
              border: `2px solid ${hexA(p.accent, 0.7)}`,
              boxShadow: `18px 18px 0 ${hexA(p.muted, dark ? 0.4 : 0.55)}, 0 40px 120px rgba(0,0,0,${dark ? 0.55 : 0.15})`,
              opacity: clamp(prog(frame, PANEL, 26) * 1.5) * (1 - wipe),
              translate: `${mix(220, 0, prog(frame, PANEL, 40, ease.out))}px 0`,
              filter: frame < PANEL + 20 ? `blur(${(1 - prog(frame, PANEL, 20)) * 14}px)` : undefined,
              overflow: 'hidden',
            }}
          >
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: `2px solid ${hexA(p.muted, 0.6)}`, ...mono(22, { letterSpacing: '0.22em', textTransform: 'uppercase', color: hexA(p.textColor, 0.7) }) }}>
              <span style={{ whiteSpace: 'nowrap' }}>{p.panelTitle}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: p.accent }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.accent, opacity: 0.5 + 0.5 * Math.sin(frame / 8), boxShadow: `0 0 14px ${p.accent}` }} />
                Live
              </span>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 66, bottom: 0 }}>
              {p.screenshot ? (
                <>
                  <Img src={p.screenshot} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%', filter: 'grayscale(1) contrast(1.08)', scale: String(mix(1.1, 1.02, prog(frame, PANEL, 260, ease.outSoft))) }} />
                  <div style={{ position: 'absolute', inset: 0, background: p.accent, mixBlendMode: 'multiply', opacity: 0.5 }} />
                </>
              ) : (
                <DashboardMock p={p} frame={frame} w={840} h={574} chips={chips} />
              )}
            </div>
          </div>
        )}

        {/* ticker tape */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 952, height: 60, background: hexA(p.surface, 0.9), borderTop: `2px solid ${hexA(p.accent, 0.6)}`, borderBottom: `2px solid ${hexA(p.accent, 0.6)}`, overflow: 'hidden', opacity: prog(frame, 0, 20) }}>
          <div style={{ position: 'absolute', top: 12, left: tickerX, whiteSpace: 'pre', ...mono(28, { letterSpacing: '0.08em', color: hexA(p.textColor, 0.8) }) }}>
            {`${p.tickers}   `.repeat(4)}
          </div>
          {frame >= HIT && (
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', padding: '0 28px 0 120px', background: p.accent, color: p.background, ...mono(28, { fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }), translate: `${mix(-500, 0, prog(frame, HIT + 6, 22))}px 0` }}>
              {p.slotLabel} ▲ New
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* flash on the hit */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 45% at ${(slotCx / W) * 100}% ${(slotCy / H) * 100}%, ${hexA(p.pop, flash * 0.9)} 0%, ${hexA(p.accent, flash * 0.45)} 30%, transparent 70%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />

      {/* end card: gold wipe with the CTA */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: W * wipe, background: p.accent, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }}>
          <div style={{ position: 'absolute', right: -90, top: 60, fontFamily: FONTS.archivo, fontSize: 900, lineHeight: 1, letterSpacing: '-0.07em', color: 'transparent', WebkitTextStroke: `4px ${hexA(p.background, 0.28)}`, translate: `${mix(120, 0, endIn(0))}px 0` }}>33</div>
          <div style={{ position: 'absolute', left: PAD, top: 300, ...mono(44, { fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: p.background }), opacity: endIn(0), translate: `0 ${mix(24, 0, endIn(0))}px` }}>
            {p.endEyebrow}
          </div>
          <div style={{ position: 'absolute', left: PAD - 8, top: 380, fontFamily: FONTS.archivo, fontSize: Math.min(260, (W - PAD * 2) / Math.max(4, p.url.length * 0.78)), lineHeight: 1, letterSpacing: '-0.05em', color: p.background, whiteSpace: 'nowrap', opacity: endIn(6), translate: `0 ${mix(40, 0, endIn(6))}px`, filter: endIn(6) < 1 ? `blur(${(1 - endIn(6)) * 12}px)` : undefined }}>
            {p.url}
          </div>
          <div style={{ position: 'absolute', left: PAD, top: 700, display: 'flex' }}>
            <span style={{ ...mono(44, { fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }), padding: '22px 40px', background: p.background, color: p.accent, boxShadow: `10px 10px 0 ${hexA(p.background, 0.35)}`, opacity: clamp(prog(frame, END + T.beats(1.5), 20, ease.backOut) * 2), scale: String(mix(0.85, 1, prog(frame, END + T.beats(1.5), 20, ease.backOut))) }}>
              {p.cta} →
            </span>
          </div>
          {/* the allocation bar returns as a 33-segment signature */}
          <div style={{ position: 'absolute', left: PAD, right: PAD, top: 900, height: 24, display: 'flex', gap: 4 }}>
            {[...SEGS, 3.2].map((s, i) => (
              <div key={i} style={{ flex: s, background: i === 32 ? p.background : hexA(p.background, 0.28), opacity: prog(frame, END + 30 + i * 1.2, 10) }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: W * wipe - 12, width: 12, background: p.pop, opacity: wipe > 0 && wipe < 1 ? 1 : 0 }} />

      <AbsoluteFill style={{ background: p.background, opacity: fadeOut }} />
      <FilmOverlay grain={dark ? 0.06 : 0.035} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
