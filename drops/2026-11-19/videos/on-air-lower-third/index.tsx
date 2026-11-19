import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'On Air Lower Third',
  category: 'lower-third',
  description:
    'Speaker lower third for Crossfade webinars, demos and live sets: a channel strip pushes its fader up on the beat, the name plate slides out of it, the title and a live tag land on beats, LED meters pulse through the hold, then it all pulls back into the strip.',
  tags: ['lower third', 'speaker', 'webinar', 'live', 'name', 'overlay'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames. 6 s = 3 bars.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(3) };

export const schema = z.object({
  name: text('Name').default('Maya Ortiz'),
  title: text('Title').default('Head of Growth, Crossfade'),
  tag: text('Live tag (empty to hide)').default('Live set · Ep. 12'),
  avatar: image('Headshot (optional)').default(''),
  footage: image('Background still (optional)').default(''),
  backdrop: toggle('Show stage backdrop').default(true),
  plate: color('Plate').default('#2B1B2E'),
  background: color('Backdrop').default('#2B1B2E'),
  accent: color().default('#FF8E5E'),
  accent2: color('Second light').default('#E5487A'),
  pop: color('Peak LED').default('#FFD27F'),
  textColor: color('Text').default('#FFE9D6'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { plate: '#12001F', background: '#12001F', accent: '#B026FF', accent2: '#FF2E88', pop: '#FFD600', textColor: '#FBEFFF', name: 'Dev Okafor', title: 'Founder & CEO, Crossfade', tag: 'Launch keynote' },
  'ink-gold': { plate: '#0D0D0F', background: '#1C1C20', accent: '#C9A45C', accent2: '#6E6A62', pop: '#E8D9B5', textColor: '#F3EDE2', name: 'Lena Brandt', title: 'VP Marketing, Harbor & Pine', tag: 'Customer story' },
  sorbet: { plate: '#3D0E2A', background: '#5A1A3F', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', textColor: '#FFEDE1', name: 'Sam Reyes', title: 'Paid Social Lead', tag: 'Office hours' },
  'no-backdrop': { backdrop: false },
};

type P = z.infer<typeof schema>;

const END = video.durationInFrames;
const OUT = END - T.beats(2); // exit starts two beats before the end

export default function OnAirLowerThird(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const kick = Math.exp(-((frame % T.beat) / 7));

  // Geometry (1080p safe area: ≥ 100 px from the bottom, ≥ 80 px from the side).
  const X = 120;
  const BOTTOM = H - 110;
  const STRIP_W = 64;
  const PLATE_H = 236;
  const TOP = BOTTOM - PLATE_H;
  const hasAvatar = p.avatar !== '';
  const AV = 168;
  const nameSize = p.name.length > 18 ? 72 : 88;
  const textX = X + STRIP_W + 44 + (hasAvatar ? AV + 36 : 0);
  const plateW = Math.max(820, Math.min(W - X - 160, textX - X + Math.max(p.name.length * nameSize * 0.62, p.title.length * 44 * 0.66) + 90));

  // Envelope: in on beat 0–1, out over the last two beats.
  const capUp = prog(frame, 4, 26, ease.out) * (1 - prog(frame, OUT + T.beat, 24, ease.in));
  const wipe = prog(frame, T.beat - 4, 30, ease.inOutSoft) * (1 - prog(frame, OUT, 26, ease.inOut));
  const outFade = 1 - prog(frame, END - 14, 14, ease.in);
  const hit = keys(frame, [T.beat - 2, T.beat + 2, T.beat + 22], [0, 1, 0], [ease.out, ease.outSoft]);

  const SEG = 9;
  const segH = (PLATE_H - 40) / SEG;
  const live = frame > T.beat && frame < OUT;
  const level = clamp(capUp * 0.55 + (live ? 0.18 + kick * 0.3 + 0.06 * Math.sin(frame / 9) : 0));
  const lit = Math.round(level * SEG);

  const tagAt = T.beats(3);
  const tagIn = prog(frame, tagAt, 22, ease.backOut) * (1 - prog(frame, OUT - 6, 18, ease.in));

  return (
    <AbsoluteFill style={{ fontFamily: FONTS.syne, color: p.textColor }}>
      {p.backdrop && (
        <>
          <Backdrop
            base={p.background}
            frame={frame}
            grid={{ opacity: 0.05, size: 40, y: -frame * 0.15, color: '255,233,214' }}
            lift={hexA(p.accent, 0.1)}
            glows={[
              { x: W * 0.72, y: H * 0.35, size: 1300, color: hexA(p.accent2, 0.5), opacity: 0.55 + 0.1 * Math.sin(frame / 40) },
              { x: W * 0.25, y: H * 0.2, size: 900, color: hexA(p.pop, 0.3), opacity: 0.45 },
              { x: W * 0.1, y: H, size: 1200, color: hexA(p.accent, 0.4), opacity: 0.6 },
            ]}
            grain={0}
            vignette={0.35}
          />
          {p.footage && <Img src={p.footage} style={{ position: 'absolute', inset: 0, width: W, height: H, objectFit: 'cover', scale: String(mix(1.04, 1, frame / END)) }} />}
          {/* out-of-focus stage lights: reads as footage behind the graphic */}
          {!p.footage && <Dust frame={frame} width={W} height={H} count={26} color={p.pop} seed={9} speed={0.5} opacity={0.5} maxSize={46} />}
          {/* legibility gradient under the plate */}
          <AbsoluteFill style={{ background: `linear-gradient(0deg, ${hexA('#000000', 0.45)} 0%, transparent 45%)` }} />
        </>
      )}

      <AbsoluteFill style={{ opacity: outFade }}>
        {/* the plate slides out of the channel strip */}
        <div
          style={{
            position: 'absolute',
            left: X + STRIP_W - 20,
            top: TOP,
            width: plateW,
            height: PLATE_H,
            borderRadius: '0 28px 28px 0',
            background: `linear-gradient(100deg, ${hexA(p.plate, 0.94)} 0%, ${hexA(p.plate, 0.86)} 70%, ${hexA(p.plate, 0.7)} 100%)`,
            boxShadow: `0 30px 80px ${hexA('#000000', 0.45)}, inset 0 1px 0 ${hexA(p.textColor, 0.12)}`,
            border: `1px solid ${hexA(p.textColor, 0.1)}`,
            clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0 round 0 28px 28px 0)`,
            overflow: 'hidden',
          }}
        >
          {/* top accent rule that rides the wipe */}
          <div style={{ position: 'absolute', left: 0, top: 0, height: 5, width: `${wipe * 100}%`, background: `linear-gradient(90deg, ${p.accent}, ${p.accent2})` }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 120% at 0% 50%, ${hexA(p.accent, 0.18 + hit * 0.3)} 0%, transparent 70%)` }} />
          {/* slow sheen across the plate during the hold */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '40%',
              left: `${mix(-45, 110, prog(frame, T.beats(4), T.bars(1) + T.beats(2), ease.inOutSoft))}%`,
              background: `linear-gradient(100deg, transparent 0%, ${hexA(p.textColor, 0.07)} 50%, transparent 100%)`,
            }}
          />
        </div>

        {/* avatar */}
        {hasAvatar && (
          <div
            style={{
              position: 'absolute',
              left: X + STRIP_W + 44,
              top: TOP + (PLATE_H - AV) / 2,
              width: AV,
              height: AV,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `4px solid ${p.accent}`,
              boxShadow: `0 0 30px ${hexA(p.accent, 0.5)}`,
              opacity: prog(frame, T.beat + 6, 18) * (1 - prog(frame, OUT, 16, ease.in)),
              scale: String(mix(0.7, 1, prog(frame, T.beat + 6, 26, ease.backOut))),
            }}
          >
            <Img src={p.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* name, title */}
        <div style={{ position: 'absolute', left: textX, top: TOP + 34, opacity: 1 - prog(frame, OUT, 18, ease.in), translate: `${-prog(frame, OUT, 26, ease.in) * 60}px 0` }}>
          <SweepReveal frame={frame} start={T.beat + 8} dur={30} style={{ fontWeight: 800, fontSize: nameSize, letterSpacing: '-0.03em', lineHeight: 1.05, whiteSpace: 'nowrap', color: p.textColor }}>
            {p.name}
          </SweepReveal>
          <Glint frame={frame} start={T.bars(2)} dur={40} style={{ position: 'absolute', left: 0, top: 0, fontWeight: 800, fontSize: nameSize, letterSpacing: '-0.03em', lineHeight: 1.05, whiteSpace: 'nowrap' }}>
            {p.name}
          </Glint>
          <WordsIn
            text={p.title}
            frame={frame}
            start={T.beats(2)}
            stagger={4}
            rise={18}
            style={{ marginTop: 14, fontFamily: FONTS.spacemono, fontSize: 44, letterSpacing: '0.04em', color: p.accent, whiteSpace: 'nowrap', flexWrap: 'nowrap' }}
          />
        </div>

        {/* live tag, pinned above the plate's right end */}
        {p.tag && (
          <div
            style={{
              position: 'absolute',
              left: X + STRIP_W - 20 + plateW,
              top: TOP - 34,
              translate: '-100% 0',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 24px',
              borderRadius: 999,
              fontFamily: FONTS.spacemono,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              color: p.plate,
              background: `linear-gradient(180deg, ${p.pop}, ${p.accent})`,
              boxShadow: `0 10px 30px ${hexA(p.accent, 0.45)}`,
              scale: String(tagIn),
              transformOrigin: 'right center',
              opacity: clamp(tagIn * 3),
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: 7, background: p.accent2, opacity: 0.55 + 0.45 * kick, boxShadow: `0 0 ${8 + kick * 10}px ${p.accent2}` }} />
            {p.tag}
          </div>
        )}

        {/* the channel strip: slot, LED meter and a fader cap that pushes up */}
        <div
          style={{
            position: 'absolute',
            left: X,
            top: TOP,
            width: STRIP_W,
            height: PLATE_H,
            borderRadius: 18,
            background: `linear-gradient(180deg, ${hexA(p.textColor, 0.14)}, ${hexA(p.textColor, 0.05)})`,
            border: `1px solid ${hexA(p.textColor, 0.18)}`,
            backdropFilter: 'blur(8px)',
            opacity: prog(frame, 0, 10) * (1 - prog(frame, END - 20, 18, ease.in)),
            translate: `0 ${(1 - prog(frame, 0, 24, ease.out)) * 40}px`,
          }}
        >
          <div style={{ position: 'absolute', left: 18, top: 20, bottom: 20, width: 6, borderRadius: 3, background: hexA('#000000', 0.55) }} />
          {Array.from({ length: SEG }, (_, s) => {
            const on = s < lit;
            const c = s === SEG - 1 ? p.pop : s >= SEG - 3 ? p.accent2 : p.accent;
            return (
              <div
                key={s}
                style={{
                  position: 'absolute',
                  left: 38,
                  top: PLATE_H - 20 - (s + 1) * segH + segH * 0.2,
                  width: 12,
                  height: segH * 0.6,
                  borderRadius: 3,
                  background: on ? c : hexA(p.textColor, 0.08),
                  boxShadow: on ? `0 0 8px ${c}` : undefined,
                }}
              />
            );
          })}
          <div
            style={{
              position: 'absolute',
              left: 5,
              top: mix(PLATE_H - 44, 34, capUp) - 12,
              width: 32,
              height: 24,
              borderRadius: 6,
              background: `linear-gradient(180deg, ${p.textColor}, ${hexA(p.textColor, 0.8)})`,
              boxShadow: `0 4px 10px ${hexA('#000000', 0.4)}, 0 0 ${hit * 30}px ${p.accent}`,
            }}
          >
            <div style={{ position: 'absolute', left: 4, right: 4, top: 11, height: 2, background: p.accent }} />
          </div>
        </div>
      </AbsoluteFill>

      {/* hit flash where the plate leaves the strip */}
      <AbsoluteFill style={{ background: `radial-gradient(circle 420px at ${X + STRIP_W}px ${TOP + PLATE_H / 2}px, ${hexA(p.pop, hit * 0.5)} 0%, ${hexA(p.accent2, hit * 0.3)} 35%, transparent 70%)`, mixBlendMode: 'screen' }} />
      {p.backdrop && <FilmOverlay grain={0.05} vignette={0} frame={frame} />}
    </AbsoluteFill>
  );
}
