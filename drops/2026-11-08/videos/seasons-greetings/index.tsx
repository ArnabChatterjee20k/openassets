import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, ease, gradientText, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: "Season's Greetings",
  category: 'greeting',
  description:
    'Story-format holiday greeting a team sends its customers: bioluminescent jellyfish rise through the deep, "Happy Holidays" blooms in couture Bodoni on the beat, then a personal note, signature and optional team photo.',
  tags: ['holiday', 'greeting', 'season', 'customers', 'story', 'vertical', 'thank you'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default("Season's greetings"),
  line1: text('Headline line 1').default('Happy'),
  line2: text('Headline line 2 (italic)').default('Holidays'),
  name: text('Recipient').default('Dear Priya,'),
  message: textarea().default('Thank you for trusting us with your 2026 campaigns. Here’s to a bright, calm new year.'),
  signature: text('Signed').default('Ama, Theo & the Lanternfish crew'),
  photo: image('Team photo (optional)').default(''),
  font: font('Headline font').default('bodoni'),
  background: color().default('#021B26'),
  surface: color().default('#06303F'),
  accent: color('Glow').default('#2EF2C4'),
  accent2: color('Deep glow').default('#1B7FA6'),
  pop: color('Spark').default('#FF7A59'),
  textColor: color('Text').default('#E6FFFA'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'new-year-gold': { eyebrow: 'Twenty twenty-seven', line1: 'Happy', line2: 'New Year', background: '#0D0D0F', surface: '#1C1C20', accent: '#E8D9B5', accent2: '#C9A45C', pop: '#C9A45C', textColor: '#F3EDE2' },
  ultraviolet: { background: '#12001F', surface: '#24003D', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', textColor: '#FBEFFF', font: 'instrument' },
  dusk: { eyebrow: 'From all of us', line1: 'Warm', line2: 'Wishes', background: '#2B1B2E', surface: '#45293F', accent: '#FF8E5E', accent2: '#E5487A', pop: '#FFD27F', textColor: '#FFE9D6', name: 'Dear Marcus,' },
};

type P = z.infer<typeof schema>;

const BLOOM = T.bars(1); // headline blooms on bar 2 downbeat
const NOTE = T.bars(2); // note on bar 3
const SIGN = T.bars(3); // signature + second bloom on bar 4

/** A jellyfish: pulsing bell with scalloped rim, oral arms and trailing tentacles. Units ≈ bell radius. */
function Jelly({ frame, x, y, s, c, c2, seed, blur = 0, opacity = 1 }: { frame: number; x: number; y: number; s: number; c: string; c2: string; seed: number; blur?: number; opacity?: number }) {
  const ph = frame / 26 + seed * 2.1; // 26 frames per radian ≈ one pulse per 1.6 s
  const pulse = Math.sin(ph);
  const sx = 1 + pulse * 0.07;
  const sy = 1 - pulse * 0.09;
  const id = `jg${seed}`;
  const tentacle = (i: number, n: number, len: number, w: number) => {
    const x0 = -0.82 + (1.64 * i) / (n - 1);
    let d = `M${x0} 0.05`;
    for (let k = 1; k <= 10; k++) {
      const t = k / 10;
      const wob = Math.sin(ph - t * 4 + i * 1.3) * 0.16 * t + Math.sin(frame / 40 + seed) * 0.12 * t;
      d += ` L${(x0 * (1 - t * 0.35) + wob).toFixed(3)} ${(0.05 + t * len).toFixed(3)}`;
    }
    return <path key={i} d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" opacity={0.55} />;
  };
  return (
    <svg
      viewBox="-2 -1.6 4 6"
      style={{ position: 'absolute', left: x - s * 2, top: y - s * 1.6, width: s * 4, height: s * 6, overflow: 'visible', opacity, filter: `${blur ? `blur(${blur}px) ` : ''}drop-shadow(0 0 ${s * 0.25}px ${hexA(c, 0.7)})` }}
    >
      <defs>
        <radialGradient id={id} cx="0.5" cy="0.75" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor={c} stopOpacity="0.75" />
          <stop offset="1" stopColor={c2} stopOpacity="0.15" />
        </radialGradient>
      </defs>
      {Array.from({ length: 7 }, (_, i) => tentacle(i, 7, 3.2 + (i % 3) * 0.5, 0.035))}
      {/* oral arms: thicker, frilly, shorter */}
      {[-0.25, 0.05, 0.3].map((ax, i) => {
        let d = `M${ax} 0.05`;
        for (let k = 1; k <= 8; k++) {
          const t = k / 8;
          d += ` L${(ax + Math.sin(ph * 0.8 - t * 3 + i) * 0.14 * t).toFixed(3)} ${(0.05 + t * 1.5).toFixed(3)}`;
        }
        return <path key={`a${i}`} d={d} fill="none" stroke={c} strokeWidth={0.11} strokeLinecap="round" opacity={0.4} />;
      })}
      <g transform={`scale(${sx} ${sy})`}>
        <path
          d="M-1 0 C-1 -1.25 1 -1.25 1 0 Q0.9 0.14 0.75 0.02 Q0.6 0.14 0.45 0.02 Q0.3 0.14 0.15 0.02 Q0 0.14 -0.15 0.02 Q-0.3 0.14 -0.45 0.02 Q-0.6 0.14 -0.75 0.02 Q-0.9 0.14 -1 0 Z"
          fill={`url(#${id})`}
          stroke={c}
          strokeWidth={0.03}
        />
        {/* inner gonads: four soft lobes */}
        {[-0.42, -0.14, 0.14, 0.42].map((gx, i) => (
          <ellipse key={i} cx={gx} cy={-0.38} rx={0.12} ry={0.18} fill="none" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={0.03} />
        ))}
        {/* rim photophores */}
        {[-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].map((rx, i) => (
          <circle key={`r${i}`} cx={rx} cy={0.04} r={0.035} fill="#ffffff" opacity={0.5 + 0.5 * Math.sin(frame / 9 + i + seed)} />
        ))}
      </g>
    </svg>
  );
}

export default function SeasonsGreetings(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const cx = W / 2;
  const hasPhoto = !!p.photo;

  const shift = hasPhoto ? 250 : 0;
  const eyebrowY = 330 + shift;
  const HEAD = Math.min(210, Math.round(1700 / Math.max(p.line1.length, p.line2.length, 6)));
  const head1Y = eyebrowY + 80;
  const head2Y = head1Y + HEAD * 0.98;
  const nameY = head2Y + HEAD + 70;
  const msgY = nameY + 110;
  const rowY = msgY + 3 * 62 + 60;
  const signY = rowY + 44;

  const bloom = keys(frame, [BLOOM - 2, BLOOM + 3, BLOOM + 40], [0, 0.75, 0], [ease.out, ease.outSoft]);
  const bloom2 = keys(frame, [SIGN - 2, SIGN + 4, SIGN + 40], [0, 0.35, 0], [ease.out, ease.outSoft]);
  const exit = prog(frame, end - 50, 50, ease.inOut);
  const push = mix(1.04, 1, prog(frame, 0, end, ease.inOutSoft));
  const italic = p.font === 'bodoni' || p.font === 'instrument' || p.font === 'dmserif';
  const headStyle = { position: 'absolute' as const, left: 0, width: W, textAlign: 'center' as const, fontFamily: FONTS[p.font], fontWeight: 400, fontSize: HEAD, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap' as const };

  // Jellies rise steadily and surge on each bell contraction.
  const rise = (base: number, speed: number, seed: number) => base - frame * speed - Math.max(0, Math.sin(frame / 26 + seed * 2.1)) * 10;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={false}
        lift={hexA(p.surface, 0.95)}
        glows={[
          { x: cx, y: 260, size: 1600, color: hexA(p.accent2, 0.5), opacity: 0.7 + 0.15 * Math.sin(frame / 50) },
          { x: cx, y: head2Y, size: 1500, color: hexA(p.accent, 0.3), opacity: keys(frame, [0, BLOOM, BLOOM + 50, end], [0.2, 0.5, 1, 0.8]) },
          { x: 200, y: 1750, size: 1000, color: hexA(p.pop, 0.18), opacity: 0.6 },
        ]}
        grain={0}
        vignette={0.6}
      />
      {/* god rays from the surface */}
      <AbsoluteFill style={{ background: `repeating-linear-gradient(100deg, transparent 0 90px, ${hexA(p.textColor, 0.035)} 90px 150px)`, maskImage: 'linear-gradient(180deg, black 0%, transparent 55%)', WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 55%)', translate: `${Math.sin(frame / 70) * 30}px 0` }} />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - exit * 0.85 }}>
        <Dust frame={frame} width={W} height={H} count={90} color={p.accent} seed={12} speed={0.5} opacity={0.45} maxSize={5} />
        {/* far jelly (blurred), then two nearer ones at the sides */}
        {/* Jellies live in the bottom third (the stage under the card): pulsing and drifting up slowly, never into the copy */}
        <Jelly frame={frame} x={560} y={rise(1700 + shift * 0.3, 0.25, 3)} s={46} c={p.accent2} c2={p.accent2} seed={3} blur={3} opacity={0.55} />
        <Jelly frame={frame} x={250} y={rise(1840 + shift * 0.3, 0.5, 1)} s={118} c={p.accent} c2={p.accent2} seed={1} />
        <Jelly frame={frame} x={850} y={rise(1800 + shift * 0.3, 0.42, 2)} s={74} c={p.pop} c2={p.accent2} seed={2} opacity={0.85} />
      </AbsoluteFill>

      <AbsoluteFill style={{ opacity: 1 - exit, translate: `0 ${-exit * 40}px` }}>
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              left: cx - 150,
              top: 150,
              width: 300,
              height: 300,
              borderRadius: '50%',
              padding: 8,
              background: `conic-gradient(from ${frame * 0.8}deg, ${p.accent}, ${p.accent2}, ${p.pop}, ${p.accent})`,
              boxShadow: `0 0 90px ${hexA(p.accent, 0.4)}`,
              scale: String(prog(frame, 20, 40, ease.backOut)),
              opacity: prog(frame, 20, 30),
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: `6px solid ${p.background}` }} />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            width: W,
            top: eyebrowY,
            textAlign: 'center',
            fontFamily: FONTS.italiana,
            fontSize: 50,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: p.accent,
            opacity: prog(frame, 40, 34),
            translate: `0 ${mix(30, 0, prog(frame, 40, 40))}px`,
            filter: `blur(${mix(10, 0, prog(frame, 40, 34))}px)`,
          }}
        >
          {p.eyebrow}
        </div>

        <SweepReveal frame={frame} start={BLOOM - 6} dur={30} style={{ ...headStyle, top: head1Y }}>
          <span>{p.line1}</span>
        </SweepReveal>
        <SweepReveal frame={frame} start={BLOOM + 4} dur={36} style={{ ...headStyle, top: head2Y, fontStyle: italic ? 'italic' : 'normal' }}>
          <span style={gradientText(`linear-gradient(165deg, ${p.textColor} 15%, ${p.accent} 95%)`, HEAD)}>{p.line2}</span>
        </SweepReveal>
        <Glint frame={frame} start={T.bars(4)} dur={50} style={{ ...headStyle, top: head2Y, fontStyle: italic ? 'italic' : 'normal' }}>
          {p.line2}
        </Glint>

        <div
          style={{
            position: 'absolute',
            width: W,
            top: nameY,
            textAlign: 'center',
            fontFamily: FONTS[p.font],
            fontStyle: italic ? 'italic' : 'normal',
            fontSize: 84,
            lineHeight: 1,
            opacity: prog(frame, NOTE, 26),
            translate: `0 ${mix(26, 0, prog(frame, NOTE, 34))}px`,
            filter: `blur(${mix(10, 0, prog(frame, NOTE, 26))}px)`,
          }}
        >
          {p.name}
        </div>
        <WordsIn
          text={p.message}
          frame={frame}
          start={NOTE + 14}
          stagger={4}
          style={{ position: 'absolute', left: 120, width: W - 240, top: msgY, justifyContent: 'center', textAlign: 'center', fontSize: 48, lineHeight: 1.3, opacity: 0.9 }}
        />

        {/* a row of photophores lights left to right, then the signature */}
        <svg style={{ position: 'absolute', left: cx - 160, top: rowY - 10, overflow: 'visible' }} width={320} height={20}>
          {Array.from({ length: 9 }, (_, i) => {
            const on = prog(frame, SIGN - 10 + i * 3, 12, ease.backOut);
            return (
              <g key={i}>
                <circle cx={i * 40} cy={10} r={14} fill={hexA(i === 4 ? p.pop : p.accent, 0.25 * on)} />
                <circle cx={i * 40} cy={10} r={5 * on + 0.01} fill={i === 4 ? p.pop : p.accent} />
              </g>
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            width: W,
            top: signY,
            textAlign: 'center',
            fontFamily: FONTS.italiana,
            fontSize: 46,
            letterSpacing: '0.12em',
            opacity: prog(frame, SIGN + 10, 30) * 0.9,
            translate: `0 ${mix(18, 0, prog(frame, SIGN + 10, 36))}px`,
          }}
        >
          {p.signature}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${((head2Y + HEAD * 0.4) / H) * 100}%, ${hexA('#ffffff', bloom * 0.7)} 0%, ${hexA(p.accent, bloom * 0.6 + bloom2)} 25%, transparent 62%)`, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: p.background, opacity: clamp(exit * 0.5) }} />
      <FilmOverlay grain={0.05} vignette={0.4} frame={frame} />
    </AbsoluteFill>
  );
}
