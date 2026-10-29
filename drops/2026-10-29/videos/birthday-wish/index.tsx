import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, ease, gradientText, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Birthday Wish',
  category: 'greeting',
  description: 'Story-format birthday card: confetti cannons fire on the beat, the name sweeps in with a glint, then your message.',
  tags: ['birthday', 'wish', 'greeting', 'story', 'vertical', 'celebration'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  greeting: text().default('Happy Birthday'),
  name: text('Their name').default('Maya'),
  message: textarea().default('Wishing you a year full of electric moments.'),
  from: text('Signed').default('— from all of us'),
  photo: image('Photo (optional)').default(''),
  font: font('Name font').default('serif'),
  background: color().default('#0A0A1F'),
  accent: color().default('#FFD34E'),
  confettiA: color('Confetti 1').default('#8B9CFF'),
  confettiB: color('Confetti 2').default('#FF6FAE'),
  textColor: color('Text').default('#FFF8EE'),
  confetti: num(0, 220, 10, 'Confetti amount').default(160),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  pastel: { background: '#FFF1E6', textColor: '#2B2340', accent: '#FF5C8A', confettiA: '#6EC6FF', confettiB: '#FFC93C' },
  neon: { font: 'grotesk', background: '#05030F', accent: '#7CFFB2', confettiA: '#B26CFF', confettiB: '#3BE0FF', greeting: 'HAPPY BIRTHDAY' },
  calm: { confetti: 0, background: '#14110E', accent: '#E8C99B', confettiA: '#C9A27A', confettiB: '#F4E3C3', message: 'Here’s to another trip around the sun.' },
};

type P = z.infer<typeof schema>;

/**
 * Confetti fired from two bottom cannons at `at`: each piece follows a ballistic
 * arc with drag, tumbles (rotate) and flutters (scaleY = cos) so it reads as paper.
 */
function Cannons({ frame, at, count, colors, W, H }: { frame: number; at: number; count: number; colors: string[]; W: number; H: number }) {
  const t = (frame - at) / FPS;
  if (t < 0 || count === 0) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 7.31 + k * 1.7);
        const left = i % 2 === 0;
        const delay = r(1) * 0.12;
        const tt = t - delay;
        if (tt < 0) return null;
        const spread = 0.12 + r(2) * 0.5; // radians away from vertical, toward the centre
        const speed = 2600 + r(3) * 1800;
        const vx = (left ? 1 : -1) * Math.sin(spread) * speed;
        const vy = -Math.cos(spread) * speed;
        const drag = 1.7;
        const g = 1100;
        const decay = (1 - Math.exp(-drag * tt)) / drag; // integrated velocity with air drag
        // Linear drag: pieces decelerate, then fall at terminal velocity g/drag (~650px/s) so they hang in the air.
        const x = (left ? 30 : W - 30) + vx * decay + Math.sin(tt * 3 + i) * 30 * clamp(tt);
        const y = H + 40 + vy * decay + (g / drag) * (tt - decay);
        if (y > H + 80 && tt > 0.8) return null;
        const w = 14 + r(4) * 16;
        const spin = (r(5) - 0.5) * 900;
        const flutter = Math.cos(tt * (8 + r(6) * 10) + i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: w,
              height: w * (r(7) > 0.7 ? 1 : 0.42),
              borderRadius: r(7) > 0.85 ? '50%' : 3,
              background: colors[i % colors.length],
              rotate: `${spin * tt}deg`,
              scale: `1 ${flutter}`,
              filter: `brightness(${0.75 + 0.35 * Math.abs(flutter)})`,
            }}
          />
        );
      })}
    </>
  );
}

export default function BirthdayWish(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const cx = W / 2;
  const end = video.durationInFrames;

  const BOOM = T.beats(2); // cannons fire on beat 3
  const photoIn = prog(frame, 6, 40, ease.backOut);
  const flash = keys(frame, [BOOM - 1, BOOM + 2, BOOM + 22], [0, 0.55, 0], [ease.out, ease.outSoft]);
  const outro = prog(frame, end - 30, 30, ease.inOut);
  const breathe = 1 + Math.sin(frame / 45) * 0.012;

  const hasPhoto = !!p.photo;
  const photoY = 470;
  const nameY = hasPhoto ? 960 : 720;
  const NAME = p.name.length > 9 ? 170 : 230;
  const light = hexA(p.accent, 0.35);
  const nameBlock = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: nameY,
    textAlign: 'center' as const,
    fontFamily: FONTS[p.font],
    fontWeight: 700,
    fontSize: NAME,
    lineHeight: 1,
    letterSpacing: '-0.03em',
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={false}
        lift={hexA(p.textColor, 0.06)}
        glows={[
          { x: cx, y: nameY + 80, size: 1500, color: light, opacity: keys(frame, [0, BOOM, BOOM + 40, end], [0.3, 0.6, 1, 0.8]) },
          { x: cx - 360, y: 300, size: 1000, color: hexA(p.confettiA, 0.35), opacity: 0.6 },
          { x: cx + 380, y: 1600, size: 1100, color: hexA(p.confettiB, 0.3), opacity: 0.6 },
        ]}
        grain={0}
        vignette={0.5}
      />
      <Dust frame={frame} width={W} height={H} count={50} color={p.accent} seed={9} opacity={0.5} speed={0.8} />

      <AbsoluteFill style={{ opacity: 1 - outro, scale: String(breathe) }}>
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              left: cx - 230,
              top: photoY - 230,
              width: 460,
              height: 460,
              borderRadius: '50%',
              padding: 10,
              background: `conic-gradient(from ${frame * 1.2}deg, ${p.accent}, ${p.confettiA}, ${p.confettiB}, ${p.accent})`,
              boxShadow: `0 0 80px ${hexA(p.accent, 0.45)}`,
              scale: String(photoIn),
              opacity: clamp(photoIn * 2),
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: `6px solid ${p.background}` }} />
          </div>
        )}

        {/* Greeting: wide-tracked, rises in before the hit */}
        <div
          style={{
            position: 'absolute',
            width: W,
            top: nameY - 110,
            textAlign: 'center',
            fontFamily: FONTS.inter,
            fontWeight: 700,
            fontSize: 54,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: p.accent,
            opacity: prog(frame, 14, 26),
            translate: `0 ${mix(30, 0, prog(frame, 14, 30))}px`,
            filter: `blur(${mix(8, 0, prog(frame, 14, 26))}px)`,
          }}
        >
          {p.greeting}
        </div>

        {/* Name lands exactly with the cannons */}
        <SweepReveal frame={frame} start={BOOM - 6} dur={30} style={nameBlock}>
          <span style={gradientText(`linear-gradient(170deg, ${p.textColor} 30%, ${p.accent} 110%)`, NAME)}>{p.name}</span>
        </SweepReveal>
        <Glint frame={frame} start={T.bars(2)} dur={44} style={nameBlock}>
          {p.name}
        </Glint>

        <WordsIn
          text={p.message}
          frame={frame}
          start={BOOM + T.beats(2)}
          stagger={5}
          style={{ position: 'absolute', left: 110, width: W - 220, top: nameY + NAME + 70, justifyContent: 'center', textAlign: 'center', fontFamily: FONTS.inter, fontSize: 52, lineHeight: 1.35 }}
        />
        <div
          style={{
            position: 'absolute',
            width: W,
            top: nameY + NAME + 330,
            textAlign: 'center',
            fontFamily: FONTS[p.font],
            fontStyle: 'italic',
            fontSize: 46,
            opacity: prog(frame, BOOM + T.beats(5), 30) * 0.8,
          }}
        >
          {p.from}
        </div>
      </AbsoluteFill>

      {/* Confetti sits above the text so it feels like it's in the room */}
      <Cannons frame={frame} at={BOOM} count={p.confetti} colors={[p.accent, p.confettiA, p.confettiB, p.textColor]} W={W} H={H} />
      <Cannons frame={frame} at={BOOM + T.bars(2)} count={Math.round(p.confetti * 0.4)} colors={[p.confettiA, p.confettiB, p.accent]} W={W} H={H} />

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${nameY + 100}px, ${hexA('#ffffff', flash)} 0%, transparent 55%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.05} vignette={0.35} frame={frame} />
    </AbsoluteFill>
  );
}
