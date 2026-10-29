import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, ease, gradientText, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Product Launch',
  category: 'launch',
  description: 'Beat-synced 3-2-1 countdown collapses into a light burst; your product name sweeps in with a glint, tagline and CTA.',
  tags: ['launch', 'product', 'countdown', 'saas', 'reveal'],
};

// 60 fps, cut on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Introducing'),
  product: text('Product name').default('Stormcast'),
  tagline: text().default('Forecasts that strike first.'),
  cta: text('Call to action').default('Live now  →  stormcast.app'),
  font: font().default('grotesk'),
  background: color().default('#07091A'),
  accent: color().default('#FFD34E'),
  accent2: color('Second light').default('#5B5FFF'),
  textColor: color('Text').default('#F5F7FF'),
  productImage: image('Product shot (optional)').default(''),
  countdown: toggle('3-2-1 countdown').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'no-countdown': { countdown: false },
  ember: { background: '#140806', accent: '#FF7A45', accent2: '#FF2E63', textColor: '#FFF4EE' },
  aurora: { background: '#03120F', accent: '#7CFFB2', accent2: '#3BC8FF', font: 'inter' },
  editorial: { background: '#0E0D0B', accent: '#F2E6CF', accent2: '#B08D57', font: 'serif', eyebrow: 'Now available' },
};

type P = z.infer<typeof schema>;

/** One countdown digit: blur-scale in on the beat, shockwave ring, blur out. */
function Digit({ n, frame, at, p, cx, cy }: { n: number; frame: number; at: number; p: P; cx: number; cy: number }) {
  const local = frame - at;
  if (local < -4 || local > T.beat + 6) return null;
  const inT = prog(frame, at, 10, ease.out);
  const outT = prog(frame, at + T.beat - 8, 12, ease.in);
  const ring = prog(frame, at, 40, ease.out);
  return (
    <>
      <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
        <circle cx={cx} cy={cy} r={260 + ring * 520} fill="none" stroke={p.accent} strokeWidth={mix(6, 0.5, ring)} opacity={(1 - ring) * 0.55} />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: FONTS[p.font],
          fontWeight: 700,
          fontSize: 380,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          ...gradientText(`linear-gradient(170deg, #ffffff 10%, ${p.accent} 90%)`, 380),
          scale: String(mix(1.35, 1, inT) * mix(1, 0.86, outT)),
          opacity: inT * (1 - outT),
          filter: `blur(${mix(18, 0, inT) + outT * 14}px)`,
        }}
      >
        {n}
      </div>
    </>
  );
}

export default function ProductLaunch(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const cx = W / 2;
  const cy = H / 2;

  // Without the countdown the reveal starts after a short build-up.
  const IMPACT = p.countdown ? T.bars(1) : T.beats(1);
  const end = video.durationInFrames;

  const build = prog(frame, 0, IMPACT, ease.inSoft); // tension rising before impact
  const flash = keys(frame, [IMPACT - 2, IMPACT + 2, IMPACT + 26], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, IMPACT, 60, ease.out);
  const push = mix(1, 1.05, prog(frame, IMPACT, end - IMPACT, ease.inOutSoft));
  const outro = prog(frame, end - 36, 36, ease.inOut);
  const titleY = p.productImage ? cy + 70 : cy - 20;
  const TITLE = p.product.length > 12 ? 150 : 196;
  const gradient = `linear-gradient(160deg, #ffffff 0%, ${hexA(p.textColor, 1)} 45%, ${p.accent} 120%)`;
  const titleBlock = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: titleY - TITLE / 2,
    textAlign: 'center' as const,
    fontFamily: FONTS[p.font],
    fontWeight: 700,
    fontSize: TITLE,
    lineHeight: 1,
    letterSpacing: '-0.04em',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.05 + build * 0.03, size: 42, y: -frame * 0.15 }}
        glows={[
          { x: cx, y: cy, size: mix(700, 1800, build), color: hexA(p.accent, 0.3), opacity: keys(frame, [0, IMPACT, IMPACT + 40, end], [0.25, 1, 0.7, 0.6]) },
          { x: cx - 520, y: cy - 200, size: 1200, color: hexA(p.accent2, 0.35), opacity: 0.5 + 0.3 * Math.sin(frame / 40) },
          { x: cx + 560, y: cy + 240, size: 1100, color: hexA(p.accent2, 0.25), opacity: prog(frame, IMPACT, 60) * 0.8 },
        ]}
        grain={0}
        vignette={0.55}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={70} color={p.accent} seed={5} speed={mix(0.6, 1.4, build)} opacity={0.45} />

        {/* Build-up: light converging on the centre, beat-synced digits. */}
        <Streaks frame={frame} start={IMPACT - T.bars(1)} dur={T.bars(1)} direction="in" count={140} width={W} height={H} seed={3} intensity={0.5 + build * 0.6} color={p.accent} highlight="#ffffff" />
        {p.countdown && [3, 2, 1].map((n, i) => <Digit key={n} n={n} frame={frame} at={i * T.beat + T.beat * 0.5} p={p} cx={cx} cy={cy} />)}

        {/* Impact */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <circle cx={cx} cy={cy} r={10 + shock * 1300} fill="none" stroke={p.accent} strokeWidth={mix(10, 1, shock)} opacity={frame >= IMPACT ? (1 - shock) * 0.8 : 0} />
          <circle cx={cx} cy={cy} r={10 + prog(frame, IMPACT + 4, 70) * 900} fill="none" stroke="#ffffff" strokeWidth={mix(3, 0.5, prog(frame, IMPACT + 4, 70))} opacity={frame >= IMPACT + 4 ? (1 - prog(frame, IMPACT + 4, 70)) * 0.5 : 0} />
        </svg>
        <Streaks frame={frame} start={IMPACT} dur={48} direction="out" count={180} width={W} height={H} seed={11} intensity={1.1} color={p.accent} highlight="#ffffff" />

        {/* Optional product shot floats in above the title */}
        {p.productImage && (
          <Img
            src={p.productImage}
            style={{
              position: 'absolute',
              left: cx - 230,
              top: titleY - 420,
              width: 460,
              height: 300,
              objectFit: 'contain',
              opacity: prog(frame, IMPACT + 8, 30),
              translate: `0 ${mix(40, 0, prog(frame, IMPACT + 8, 40)) + Math.sin(frame / 30) * 6}px`,
              filter: `drop-shadow(0 30px 60px ${hexA(p.accent2, 0.45)})`,
            }}
          />
        )}

        {/* Eyebrow */}
        <div
          style={{
            position: 'absolute',
            width: W,
            top: titleY - TITLE / 2 - 70,
            textAlign: 'center',
            fontFamily: FONTS.mono,
            fontSize: 32,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: p.accent,
            opacity: prog(frame, IMPACT + 6, 24) * (frame < IMPACT ? 0 : 1),
            translate: `0 ${mix(14, 0, prog(frame, IMPACT + 6, 24))}px`,
          }}
        >
          {p.eyebrow}
        </div>

        {/* Title: sweep + blur reveal, then a glint on the downbeat of bar 3 */}
        {frame >= IMPACT && (
          <>
            <SweepReveal frame={frame} start={IMPACT + 4} dur={34} style={titleBlock}>
              <span style={gradientText(gradient, TITLE)}>{p.product}</span>
            </SweepReveal>
            <Glint frame={frame} start={IMPACT + T.bars(1)} dur={44} style={titleBlock}>
              {p.product}
            </Glint>
          </>
        )}

        <WordsIn
          text={p.tagline}
          frame={frame}
          start={IMPACT + 28}
          style={{ position: 'absolute', width: W, top: titleY + TITLE * 0.62, justifyContent: 'center', fontFamily: FONTS.inter, fontSize: 48, opacity: 0.86 }}
        />

        {/* Bar-3 accent: a light line draws under the tagline on the downbeat */}
        <div
          style={{
            position: 'absolute',
            left: cx - 260,
            top: titleY + TITLE * 0.62 + 74,
            width: 520,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)`,
            scale: `${prog(frame, IMPACT + T.bars(1), 40, ease.inOutSoft)} 1`,
            opacity: 0.8,
          }}
        />

        {/* CTA pill lands on a beat with a little overshoot */}
        <div
          style={{
            position: 'absolute',
            width: W,
            top: titleY + TITLE * 0.62 + 104,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 34,
              padding: '20px 38px',
              borderRadius: 999,
              color: p.background,
              background: `linear-gradient(180deg, ${p.accent}, ${hexA(p.accent, 0.85)})`,
              boxShadow: `0 0 0 1px ${hexA('#ffffff', 0.25)} inset, 0 18px 50px ${hexA(p.accent, 0.35)}`,
              whiteSpace: 'pre',
              scale: String(prog(frame, IMPACT + T.beats(2), 26, ease.backOut)),
              opacity: clamp(prog(frame, IMPACT + T.beats(2), 10)),
            }}
          >
            {p.cta}
          </div>
        </div>
      </AbsoluteFill>

      {/* Flash on impact, screen-blended so it blooms rather than whites out */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${hexA('#ffffff', flash)} 0%, ${hexA(p.accent, flash * 0.6)} 22%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
