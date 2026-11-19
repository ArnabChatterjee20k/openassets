import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, WordsIn, clamp, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Meet Crossfade',
  category: 'intro',
  description: 'Product intro: a wall of 31 channel faders pushes up in a wave on the beat, then the neon wordmark lights tube by tube, the tagline and three proof chips land on beats and a CTA closes.',
  tags: ['intro', 'product', 'neon', 'mixer', 'ads', 'channel'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Meet'),
  wordmark: text('Wordmark').default('CROSSFADE'),
  tagline: text().default('The AI agent that mixes your ads across 31 platforms.'),
  chip1: text('Chip 1').default('31 platforms'),
  chip2: text('Chip 2').default('1 brief'),
  chip3: text('Chip 3').default('0 spreadsheets'),
  cta: text('Call to action').default('Start free at crossfade.ai'),
  channels: text('Fader count').default('31'),
  logo: image('Logo (optional)').default(''),
  background: color().default('#2B1B2E'),
  accent: color().default('#FF8E5E'),
  accent2: color('Second light').default('#E5487A'),
  neon: color('Neon').default('#FFD27F'),
  textColor: color('Text').default('#FFE9D6'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { background: '#12001F', accent: '#B026FF', accent2: '#FF2E88', neon: '#FFD600', textColor: '#FBEFFF' },
  acid: { background: '#0B0B0B', accent: '#C6FF00', accent2: '#FF00E5', neon: '#00F0FF', textColor: '#F0FFE0', tagline: 'One brief in. Every channel mixed live.' },
  sorbet: { background: '#3D0E2A', accent: '#FF4F6D', accent2: '#7B2CBF', neon: '#FFB627', textColor: '#FFEDE1', eyebrow: 'Welcome to', chip3: 'ROAS up 38%' },
};

type P = z.infer<typeof schema>;

const IMPACT = T.bars(1);

/** One channel strip: slot, fader cap, LED meter. */
function Strip({ x, top, bottom, w, level, meter, p, hot }: { x: number; top: number; bottom: number; w: number; level: number; meter: number; p: P; hot: boolean }) {
  const SEG = 16;
  const segH = (bottom - top) / SEG;
  const capY = bottom - (bottom - top) * level;
  const lit = Math.round(meter * SEG);
  return (
    <g>
      <rect x={x + w * 0.3 - 3} y={top} width={6} height={bottom - top} rx={3} fill="#0B0509" opacity={0.9} />
      {Array.from({ length: SEG }, (_, s) => {
        const on = s < lit;
        const c = s === SEG - 1 ? p.neon : s >= SEG - 4 ? p.accent2 : p.accent;
        return <rect key={s} x={x + w * 0.62} y={bottom - (s + 1) * segH + segH * 0.2} width={w * 0.22} height={segH * 0.6} rx={2} fill={on ? c : hexA(p.textColor, 0.06)} />;
      })}
      <rect x={x + w * 0.3 - w * 0.26} y={capY - 11} width={w * 0.52} height={22} rx={5} fill={hot ? p.accent : p.textColor} style={hot ? { filter: `drop-shadow(0 0 10px ${p.accent})` } : undefined} />
      <rect x={x + w * 0.3 - w * 0.2} y={capY - 1} width={w * 0.4} height={2} fill={p.background} />
    </g>
  );
}

/** Neon tube flicker for letter i: buzzes on with two dropouts, then holds. */
const neonOn = (frame: number, start: number, i: number) => {
  const s = start + i * 4 + Math.floor(rand(i * 3.3) * 6);
  const f = frame - s;
  if (f < 0) return 0;
  if (f < 3) return 0.85;
  if (f < 6) return 0.15;
  if (f < 9) return 1;
  if (f < 11) return 0.35;
  return 1;
};

export default function MeetCrossfade(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const n = Math.max(8, Math.min(48, parseInt(p.channels, 10) || 31));
  const margin = 70;
  const sw = (W - margin * 2) / n;
  const kick = Math.exp(-((frame % T.beat) / 8));

  const dim = prog(frame, IMPACT - 4, 20, ease.out);
  const flash = keys(frame, [IMPACT - 2, IMPACT + 2, IMPACT + 26], [0, 1, 0], [ease.out, ease.outSoft]);
  const push = mix(1.06, 1, prog(frame, 0, IMPACT, ease.out)) * mix(1, 1.04, prog(frame, IMPACT, end - IMPACT, ease.inOutSoft));
  const outro = prog(frame, end - 32, 32, ease.in);

  const word = p.wordmark;
  const MARK = Math.min(200, 1560 / (Math.max(5, word.length) * 0.95));
  const markY = 330;
  const markStyle = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: markY,
    textAlign: 'center' as const,
    fontFamily: FONTS.monoton,
    fontSize: MARK,
    lineHeight: 1.1,
    whiteSpace: 'nowrap' as const,
  };
  const chips = [p.chip1, p.chip2, p.chip3].filter(Boolean);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.05, size: 40, y: -frame * 0.15, color: '255,233,214' }}
        lift={hexA(p.accent, 0.08)}
        glows={[
          { x: W / 2, y: H * 0.45, size: mix(900, 1700, dim), color: hexA(p.accent2, 0.45), opacity: 0.4 + dim * 0.5 + 0.1 * Math.sin(frame / 40) },
          { x: 200, y: H, size: 1300, color: hexA(p.accent, 0.4), opacity: 0.6 },
          { x: W - 160, y: 80, size: 1000, color: hexA(p.neon, 0.25), opacity: 0.5 },
        ]}
        grain={0}
        vignette={0.5}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        {/* the fader wall: pushes up in a wave, then dims behind the title */}
        <svg
          style={{ position: 'absolute', inset: 0, opacity: mix(1, 0.22, dim), filter: dim > 0.05 ? `blur(${dim * 3}px)` : undefined }}
          width={W}
          height={H}
        >
          {Array.from({ length: n }, (_, i) => {
            const target = 0.45 + rand(i * 2.7) * 0.45;
            const up = prog(frame, 6 + i * (70 / n), 40, ease.out);
            const sway = frame > IMPACT ? Math.sin(frame / 50 + i * 0.4) * 0.06 : 0;
            const meter = clamp(up * (0.3 + rand(i * 5.1) * 0.35) + kick * up * (0.2 + rand(i) * 0.3));
            return <Strip key={i} x={margin + i * sw} top={150} bottom={930} w={sw} level={0.08 + up * target + sway} meter={meter} p={p} hot={i === Math.floor(n * 0.62)} />;
          })}
        </svg>
        {/* bar 1 focal: channels coming online as the wave passes */}
        <div
          style={{
            position: 'absolute',
            top: 956,
            width: W,
            textAlign: 'center',
            fontFamily: FONTS.spacemono,
            fontSize: 44,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: p.textColor,
            opacity: prog(frame, 4, 16) * (1 - dim),
          }}
        >
          Channels live <span style={{ color: p.neon }}>{String(Math.min(n, Math.round(n * prog(frame, 6, 76, ease.linear)))).padStart(2, '0')}</span>/{n}
        </div>
        <Dust frame={frame} width={W} height={H} count={50} color={p.neon} seed={3} speed={1} opacity={0.35} />

        {/* eyebrow / logo */}
        <div
          style={{
            position: 'absolute',
            top: markY - 80,
            width: W,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 20,
            opacity: prog(frame, IMPACT + 20, 24),
            translate: `0 ${mix(16, 0, prog(frame, IMPACT + 20, 30))}px`,
          }}
        >
          {p.logo && <Img src={p.logo} style={{ height: 56, objectFit: 'contain' }} />}
          <span style={{ fontFamily: FONTS.spacemono, fontSize: 46, letterSpacing: '0.42em', textTransform: 'uppercase', color: p.accent }}>{p.eyebrow}</span>
        </div>

        {/* neon wordmark: each tube buzzes on */}
        {frame >= IMPACT - 2 && (
          <>
            <div style={{ ...markStyle, color: p.neon }}>
              {word.split('').map((ch, i) => {
                const o = neonOn(frame, IMPACT, i);
                return (
                  <span
                    key={i}
                    style={{
                      opacity: 0.12 + o * 0.88,
                      textShadow: o > 0.5 ? `0 0 ${MARK * 0.08}px ${hexA(p.accent, 0.95)}, 0 0 ${MARK * 0.35}px ${hexA(p.accent2, 0.7)}` : 'none',
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
            <Glint frame={frame} start={T.bars(3)} dur={44} style={markStyle}>
              {word}
            </Glint>
          </>
        )}

        <WordsIn
          text={p.tagline}
          frame={frame}
          start={T.bars(2)}
          stagger={4}
          style={{ position: 'absolute', top: markY + MARK * 1.2 + 10, left: 160, width: W - 320, justifyContent: 'center', fontWeight: 800, fontSize: 56, letterSpacing: '-0.01em' }}
        />

        {/* proof chips, one per beat */}
        <div style={{ position: 'absolute', top: markY + MARK * 1.2 + 172, width: W, display: 'flex', justifyContent: 'center', gap: 22 }}>
          {chips.map((c, i) => {
            const at = T.bars(2) + T.beats(1 + i);
            const t = prog(frame, at, 24, ease.backOut);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 28px',
                  borderRadius: 999,
                  fontFamily: FONTS.spacemono,
                  fontSize: 34,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: hexA(p.textColor, 0.07),
                  border: `1px solid ${hexA(i === 0 ? p.neon : p.accent, 0.45)}`,
                  scale: String(t),
                  opacity: clamp(prog(frame, at, 8)),
                }}
              >
                <span style={{ width: 12, height: 12, borderRadius: 6, background: i === 0 ? p.neon : p.accent, boxShadow: `0 0 12px ${i === 0 ? p.neon : p.accent}` }} />
                {c}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ position: 'absolute', top: 870, width: W, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: FONTS.spacemono,
              fontWeight: 700,
              fontSize: 36,
              padding: '20px 44px',
              borderRadius: 999,
              color: p.background,
              background: `linear-gradient(180deg, ${p.neon}, ${p.accent})`,
              boxShadow: `0 18px 50px ${hexA(p.accent, 0.45)}`,
              scale: String(prog(frame, T.bars(3) + T.beat, 26, ease.backOut)),
              opacity: clamp(prog(frame, T.bars(3) + T.beat, 10)),
            }}
          >
            {p.cta} →
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 40%, ${hexA('#ffffff', flash * 0.8)} 0%, ${hexA(p.accent2, flash * 0.6)} 30%, transparent 70%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
