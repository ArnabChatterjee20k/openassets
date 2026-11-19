import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, WordsIn, clamp, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Crossfade 2.0 Launch',
  category: 'launch',
  description:
    'Version launch film: Deck A lists the old way (tabs, spreadsheets, 3 a.m. bid edits), a giant crossfader slams across to Deck B on the downbeat, the neon wordmark and "2.0" light up, then the product screen rises beside three feature chips, a headline, a launch-date tag and a CTA.',
  tags: ['launch', 'release', 'version', 'product', 'crossfader', 'neon'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 12 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(6) };

export const schema = z.object({
  deckA: text('Deck A label').default('Deck A · the old way'),
  pain1: text('Old way 1').default('31 ad manager tabs'),
  pain2: text('Old way 2').default('9 budget spreadsheets'),
  pain3: text('Old way 3').default('Bid edits at 3 a.m.'),
  deckB: text('Deck B label').default('Deck B · the agent'),
  eyebrow: text().default('Introducing'),
  wordmark: text('Wordmark').default('CROSSFADE'),
  version: text('Version').default('2.0'),
  headline: text().default('One brief. Every platform. Mixed live.'),
  feature1: text('Feature 1').default('Creative Booth'),
  feature2: text('Feature 2').default('Auto-Mix Budgets'),
  feature3: text('Feature 3').default('Brand Guard'),
  date: text('Launch tag').default('Live today · Nov 19'),
  cta: text('Call to action').default('Upgrade free at crossfade.ai'),
  screenshot: image('Product screenshot (optional)').default(''),
  background: color().default('#2B1B2E'),
  surface: color().default('#45293F'),
  accent: color().default('#FF8E5E'),
  accent2: color('Second light').default('#E5487A'),
  neon: color('Neon').default('#FFD27F'),
  textColor: color('Text').default('#FFE9D6'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { background: '#12001F', surface: '#24003D', accent: '#B026FF', accent2: '#FF2E88', neon: '#FFD600', textColor: '#FBEFFF' },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', accent: '#C6FF00', accent2: '#FF00E5', neon: '#00F0FF', textColor: '#F0FFE0', headline: 'Drop the spreadsheet. Ride the faders.', date: 'Shipping now' },
  'cherry-cola': { background: '#2A0A0A', surface: '#4A1414', accent: '#E8323C', accent2: '#FF7A59', neon: '#F7E3C3', textColor: '#FFF1E6', version: '3.0', date: 'Available Dec 2', feature1: 'Video Remix', feature2: 'CTV Channels', feature3: 'Agency Seats' },
};

type P = z.infer<typeof schema>;

const HIT = T.bars(2); // crossfader lands, Deck B blooms
const MOVE = T.bars(3); // title slides into the left column, screen rises
const END = video.durationInFrames;

/** Neon tube flicker for letter i: buzzes on with two dropouts, then holds. */
const neonOn = (frame: number, start: number, i: number) => {
  const f = frame - (start + i * 3 + Math.floor(rand(i * 3.3) * 5));
  if (f < 0) return 0;
  if (f < 3) return 0.85;
  if (f < 6) return 0.15;
  if (f < 9) return 1;
  if (f < 11) return 0.35;
  return 1;
};

/** Fallback product UI when no screenshot is uploaded: the mixer dashboard. */
function DashboardMock({ p, frame, w, h }: { p: P; frame: number; w: number; h: number }) {
  const names = ['TikTok', 'Meta', 'Google', 'Reddit', 'YouTube', 'Snap', 'LinkedIn', 'Pinterest'];
  const kick = Math.exp(-((frame % T.beat) / 8));
  const side = 150;
  const n = names.length;
  const sw = (w - side - 60) / n;
  const top = 120;
  const bot = h - 70;
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${p.surface}, ${p.background})`, fontFamily: FONTS.spacemono }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: side, background: hexA('#000000', 0.25), borderRight: `1px solid ${hexA(p.textColor, 0.08)}` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: 'absolute', left: 26, top: 40 + i * 56, width: i === 0 ? 98 : 70 + (i % 2) * 20, height: 14, borderRadius: 7, background: i === 0 ? p.accent : hexA(p.textColor, 0.16) }} />
        ))}
      </div>
      <div style={{ position: 'absolute', left: side + 30, top: 30, fontSize: 22, letterSpacing: '0.2em', color: hexA(p.textColor, 0.7) }}>LIVE MIX · 31 PLATFORMS</div>
      <div style={{ position: 'absolute', right: 30, top: 24, padding: '6px 16px', borderRadius: 999, fontSize: 20, color: p.background, background: p.neon }}>ROAS 4.2×</div>
      <svg style={{ position: 'absolute', inset: 0 }} width={w} height={h}>
        {names.map((nm, i) => {
          const cx = side + 30 + sw * (i + 0.5);
          const lvl = clamp(0.3 + rand(i * 2.1) * 0.5 + Math.sin(frame / 40 + i) * 0.08 + (i === 0 ? 0.15 : 0));
          const capY = bot - (bot - top) * lvl;
          const SEG = 12;
          const segH = (bot - top) / SEG;
          const lit = Math.round(clamp(lvl * 0.8 + kick * 0.2 * rand(i + 4)) * SEG);
          return (
            <g key={nm}>
              <rect x={cx - sw * 0.18 - 3} y={top} width={6} height={bot - top} rx={3} fill="#0B0509" />
              <rect x={cx - sw * 0.18 - 18} y={capY - 9} width={36} height={18} rx={5} fill={i === 0 ? p.accent : p.textColor} />
              {Array.from({ length: SEG }, (_, s) => (
                <rect key={s} x={cx + sw * 0.1} y={bot - (s + 1) * segH + segH * 0.2} width={sw * 0.16} height={segH * 0.6} rx={2} fill={s < lit ? (s === SEG - 1 ? p.neon : s >= SEG - 3 ? p.accent2 : p.accent) : hexA(p.textColor, 0.06)} />
              ))}
              <text x={cx} y={h - 30} textAnchor="middle" fontSize={16} fill={hexA(p.textColor, 0.6)} fontFamily={FONTS.spacemono}>
                {nm.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function CrossfadeLaunch(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const kick = Math.exp(-((frame % T.beat) / 8));

  // --- the crossfader slam: cap travels A → B in the last beat before the hit
  const slam = prog(frame, HIT - 22, 22, ease.in);
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 14) * 10 : 0;
  const deckAOut = prog(frame, HIT - 10, 24, ease.out);
  const faderOut = prog(frame, HIT + 30, 30, ease.in);

  // --- title block: centre at the hit, then shrinks into the left column
  const move = prog(frame, MOVE, 50, ease.inOut);
  const MARK = Math.min(170, 1500 / (Math.max(5, p.wordmark.length) * 0.95));
  const markW = p.wordmark.length * MARK * 0.95;
  const s = mix(1, Math.min(0.6, 760 / markW), move);
  const titleX = mix(0, 120 + (markW * s) / 2 - W / 2, move);
  const titleY = mix(0, -205, move);
  const push = mix(1, 1.04, prog(frame, 0, HIT, ease.inOutSoft)) * mix(1.03, 1, prog(frame, HIT, 60, ease.out));
  const outro = prog(frame, END - 30, 30, ease.in);

  const pains = [p.pain1, p.pain2, p.pain3];
  const features = [p.feature1, p.feature2, p.feature3].filter(Boolean);

  const faderY = 905;
  const faderW = 980;
  const faderX = (W - faderW) / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.05, size: 40, y: -frame * 0.15, color: '255,233,214' }}
        lift={hexA(p.accent, 0.06)}
        glows={[
          // Deck A light dims, Deck B blooms on the hit.
          { x: W * 0.25, y: H * 0.45, size: 1100, color: hexA('#8A8A9A', 0.35), opacity: 0.5 * (1 - deckAOut) },
          { x: mix(W * 0.75, W * 0.5, deckAOut), y: H * 0.42, size: mix(800, 1700, deckAOut), color: hexA(p.accent2, 0.5), opacity: 0.25 + deckAOut * 0.55 + 0.08 * Math.sin(frame / 40) },
          { x: W - 200, y: H, size: 1300, color: hexA(p.accent, 0.4), opacity: 0.2 + deckAOut * 0.5 },
          { x: 200, y: 60, size: 900, color: hexA(p.neon, 0.25), opacity: deckAOut * 0.5 },
        ]}
        grain={0}
        vignette={0.5}
      />
      <Dust frame={frame} width={W} height={H} count={40} color={p.neon} seed={5} speed={0.8} opacity={0.15 + deckAOut * 0.25} />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.4}px`, opacity: 1 - outro }}>
        {/* ---------- bar 1–2: the two decks ---------- */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: W / 2, height: H, opacity: 1 - deckAOut, translate: `${-deckAOut * 120}px 0`, filter: deckAOut > 0.02 ? `blur(${deckAOut * 14}px)` : undefined }}>
          <div style={{ position: 'absolute', left: 160, top: 170, fontFamily: FONTS.spacemono, fontSize: 34, letterSpacing: '0.3em', textTransform: 'uppercase', color: hexA(p.textColor, 0.6), opacity: prog(frame, 6, 18) }}>
            {p.deckA}
          </div>
          {pains.map((t, i) => {
            const at = T.beats(1 + i);
            const strike = prog(frame, T.beats(4.5 + i * 0.5), 14, ease.out);
            return (
              <div key={i} style={{ position: 'absolute', left: 160, top: 270 + i * 112, opacity: prog(frame, at, 16) * mix(1, 0.45, strike), translate: `0 ${mix(30, 0, prog(frame, at, 24))}px`, filter: `blur(${mix(10, 0, prog(frame, at, 20))}px)` }}>
                <div style={{ position: 'relative', fontWeight: 800, fontSize: 64, letterSpacing: '-0.03em', color: hexA(p.textColor, 0.72), whiteSpace: 'nowrap' }}>
                  {t}
                  <div style={{ position: 'absolute', left: -10, top: '54%', height: 8, borderRadius: 4, width: `calc(${strike * 100}% + 20px)`, background: p.accent2, opacity: strike > 0 ? 1 : 0 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: W / 2, top: 0, width: W / 2, height: H, opacity: 1 - deckAOut }}>
          <div style={{ position: 'absolute', right: 160, top: 170, fontFamily: FONTS.spacemono, fontSize: 34, letterSpacing: '0.3em', textTransform: 'uppercase', color: p.accent, opacity: prog(frame, 6, 18) }}>
            {p.deckB}
          </div>
          {/* the version waits on Deck B as an unlit outline, breathing with the beat */}
          <div style={{ position: 'absolute', right: 150, top: 470, fontWeight: 800, fontSize: 320, lineHeight: 1, letterSpacing: '-0.05em', color: 'transparent', WebkitTextStroke: `3px ${hexA(p.accent, 0.3 + kick * 0.25 + slam * 0.4)}`, opacity: prog(frame, 20, 30) }}>
            {p.version}
          </div>
        </div>

        {/* the crossfader */}
        <div style={{ position: 'absolute', left: faderX, top: faderY, width: faderW, height: 80, opacity: prog(frame, 0, 20) * (1 - faderOut), translate: `0 ${faderOut * 60 + (1 - prog(frame, 0, 30)) * 40}px` }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 31, height: 18, borderRadius: 9, background: hexA('#000000', 0.55), boxShadow: `inset 0 2px 6px ${hexA('#000000', 0.6)}` }} />
          <div style={{ position: 'absolute', left: 0, top: 31, height: 18, borderRadius: 9, width: `${mix(8, 100, slam)}%`, background: `linear-gradient(90deg, ${hexA(p.accent, 0.2)}, ${p.accent2})`, opacity: slam }} />
          {Array.from({ length: 21 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', left: (faderW * i) / 20 - 1, top: i % 5 === 0 ? 0 : 10, width: 2, height: i % 5 === 0 ? 18 : 10, background: hexA(p.textColor, 0.25) }} />
          ))}
          <div style={{ position: 'absolute', left: -70, top: 18, fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 40, color: hexA(p.textColor, 0.6 * (1 - slam) + 0.2) }}>A</div>
          <div style={{ position: 'absolute', right: -70, top: 18, fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 40, color: slam > 0.9 ? p.neon : hexA(p.textColor, 0.4) }}>B</div>
          <div
            style={{
              position: 'absolute',
              left: mix(0, faderW, slam) - 46,
              top: 2,
              width: 92,
              height: 76,
              borderRadius: 14,
              background: `linear-gradient(180deg, ${p.textColor}, ${hexA(p.textColor, 0.78)})`,
              boxShadow: `0 10px 26px ${hexA('#000000', 0.5)}, 0 0 ${slam * 50}px ${p.accent2}`,
              transform: `skewX(${-Math.sin(slam * Math.PI) * 10}deg)`,
            }}
          >
            <div style={{ position: 'absolute', left: 43, top: 10, bottom: 10, width: 6, borderRadius: 3, background: p.accent2 }} />
          </div>
        </div>

        {/* ---------- bar 3+: the reveal ---------- */}
        {frame >= HIT - 2 && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, translate: `${titleX}px ${titleY}px`, scale: String(s) }}>
            <div
              style={{
                position: 'absolute',
                top: 250,
                width: W,
                textAlign: 'center',
                fontFamily: FONTS.spacemono,
                fontSize: 44,
                letterSpacing: '0.42em',
                textTransform: 'uppercase',
                color: p.accent,
                opacity: prog(frame, HIT + 16, 20) * (1 - move),
              }}
            >
              {p.eyebrow}
            </div>
            <div style={{ position: 'absolute', top: 330, width: W, textAlign: 'center', fontFamily: FONTS.monoton, fontSize: MARK, lineHeight: 1.1, whiteSpace: 'nowrap', color: p.neon }}>
              {p.wordmark.split('').map((ch, i) => {
                const o = neonOn(frame, HIT, i);
                return (
                  <span key={i} style={{ opacity: 0.1 + o * 0.9, textShadow: o > 0.5 ? `0 0 ${MARK * 0.08}px ${hexA(p.accent, 0.95)}, 0 0 ${MARK * 0.35}px ${hexA(p.accent2, 0.7)}` : 'none' }}>
                    {ch}
                  </span>
                );
              })}
            </div>
            <Glint frame={frame} start={T.bars(5)} dur={44} style={{ position: 'absolute', top: 330, width: W, textAlign: 'center', fontFamily: FONTS.monoton, fontSize: MARK, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              {p.wordmark}
            </Glint>
            <div
              style={{
                position: 'absolute',
                top: 330 + MARK * 1.1,
                width: W,
                textAlign: 'center',
                fontWeight: 800,
                fontSize: 260,
                lineHeight: 0.95,
                letterSpacing: '-0.05em',
                color: p.textColor,
                WebkitTextStroke: `4px ${p.accent}`,
                textShadow: `0 0 60px ${hexA(p.accent2, 0.6)}`,
                opacity: prog(frame, HIT + T.beat, 14),
                scale: String(mix(1.25, 1, prog(frame, HIT + T.beat, 30, ease.out))),
                filter: `blur(${mix(14, 0, prog(frame, HIT + T.beat, 22))}px)`,
              }}
            >
              {p.version}
            </div>
          </div>
        )}

        {/* left column after the move: a flex stack, so long copy pushes, never overlaps */}
        <div style={{ position: 'absolute', left: 120, top: 505, width: 780, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <WordsIn
          text={p.headline}
          frame={frame}
          start={MOVE + 40}
          stagger={5}
          style={{ fontWeight: 800, fontSize: p.headline.length > 34 ? 56 : 64, lineHeight: 1.06, letterSpacing: '-0.02em' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {features.map((f, i) => {
            const at = T.bars(4) + T.beats(i);
            const t = prog(frame, at, 24, ease.backOut);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 24px',
                  borderRadius: 999,
                  fontFamily: FONTS.spacemono,
                  fontSize: 32,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  background: hexA(p.textColor, 0.07),
                  border: `1px solid ${hexA(i === 0 ? p.neon : p.accent, 0.5)}`,
                  scale: String(t),
                  opacity: clamp(prog(frame, at, 8)),
                }}
              >
                <span style={{ fontSize: 26, color: i === 0 ? p.neon : p.accent }}>+</span>
                {f}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, transformOrigin: 'left center' }}>
          <div
            style={{
              fontFamily: FONTS.spacemono,
              fontWeight: 700,
              fontSize: 34,
              padding: '20px 40px',
              borderRadius: 999,
              color: p.background,
              background: `linear-gradient(180deg, ${p.neon}, ${p.accent})`,
              boxShadow: `0 18px 50px ${hexA(p.accent, 0.45)}`,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, T.bars(5) - T.beat, 26, ease.backOut)),
              opacity: clamp(prog(frame, T.bars(5) - T.beat, 10)),
            }}
          >
            {p.cta} →
          </div>
        </div>
        </div>

        {/* the product screen rises on the right */}
        {(() => {
          const r = prog(frame, MOVE + 28, 50, ease.out);
          const sw = 860;
          const sh = 560;
          return (
            <div
              style={{
                position: 'absolute',
                left: W - 120 - sw,
                top: 210,
                width: sw,
                height: sh,
                opacity: clamp(r * 1.5),
                translate: `0 ${mix(200, 0, r) + Math.sin(frame / 50) * 6}px`,
                rotate: `${mix(6, 0, r)}deg`,
                borderRadius: 26,
                padding: 14,
                background: `linear-gradient(160deg, ${hexA(p.textColor, 0.22)}, ${hexA(p.textColor, 0.06)})`,
                border: `1px solid ${hexA(p.textColor, 0.25)}`,
                boxShadow: `0 50px 120px ${hexA('#000000', 0.55)}, 0 0 80px ${hexA(p.accent2, 0.25)}`,
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', background: p.background }}>
                {p.screenshot ? <Img src={p.screenshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <DashboardMock p={p} frame={frame} w={sw - 28} h={sh - 28} />}
              </div>
              {/* launch tag pinned to the screen's top-right corner */}
              {p.date && (
                <div
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: sh + 26,
                    padding: '14px 26px',
                    borderRadius: 999,
                    fontFamily: FONTS.spacemono,
                    fontWeight: 700,
                    fontSize: 30,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    color: p.background,
                    background: p.neon,
                    rotate: '-3deg',
                    boxShadow: `0 10px 30px ${hexA('#000000', 0.4)}, 0 0 ${20 + kick * 20}px ${hexA(p.neon, 0.5)}`,
                    scale: String(prog(frame, T.bars(4) + T.beats(3), 24, ease.backOut)),
                  }}
                >
                  {p.date}
                </div>
              )}
            </div>
          );
        })()}
      </AbsoluteFill>

      <Streaks frame={frame} start={HIT - 4} dur={50} width={W} height={H} direction="out" count={140} color={p.accent} highlight={p.neon} intensity={0.9} seed={7} />
      {/* shockwave behind the reveal; starts outside the wordmark */}
      {frame >= HIT && frame < HIT + 50 && (
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          {[0, 8].map((d) => {
            const u = prog(frame, HIT + d, 40, ease.out);
            return <circle key={d} cx={W / 2} cy={H * 0.45} r={mix(Math.max(720, markW * 0.56), 1500, u)} fill="none" stroke={p.neon} strokeWidth={mix(10, 1, u)} opacity={(1 - u) * 0.7} />;
          })}
        </svg>
      )}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 45%, ${hexA('#ffffff', flash * 0.75)} 0%, ${hexA(p.accent2, flash * 0.6)} 30%, transparent 70%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
