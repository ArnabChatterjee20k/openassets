import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, ease, gradientText, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Release Notes',
  category: 'tech',
  description:
    'Product-update film for an AI ad agent: one light pings in the dark, 31 platform photophores ignite as a counter ticks up, then the release title sweeps in with a changelog list, optional screenshot and CTA.',
  tags: ['release', 'changelog', 'product update', 'integrations', 'tech', 'saas'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Release 2.4 · November 2026'),
  title1: text('Title line 1').default('31 platforms.'),
  title2: text('Title line 2 (italic)').default('One agent.'),
  tagline: text().default('Now live wherever your customers scroll.'),
  counterLabel: text('Counter label').default('platforms connected'),
  count: num(6, 60, 1, 'Platforms (counter)').default(31),
  note1: text('Changelog 1').default('CTV, Spotify & retail media, now live'),
  note2: text('Changelog 2').default('Auto-pacing across 14 time zones'),
  note3: text('Changelog 3').default('Per-platform creative variants'),
  cta: text('Call to action').default('Rolling out today · lanternfish.ai/changelog'),
  screenshot: image('Screenshot (optional)').default(''),
  font: font('Title font').default('bodoni'),
  background: color().default('#021B26'),
  surface: color().default('#06303F'),
  accent: color('Photophores').default('#2EF2C4'),
  accent2: color('Sonar').default('#1B7FA6'),
  pop: color('Spark').default('#FF7A59'),
  textColor: color('Text').default('#E6FFFA'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  gold: { background: '#0D0D0F', surface: '#1C1C20', accent: '#E8D9B5', accent2: '#C9A45C', pop: '#C9A45C', textColor: '#F3EDE2', eyebrow: 'Release 2.4 · Enterprise' },
  ultraviolet: { background: '#12001F', surface: '#24003D', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', textColor: '#FBEFFF', font: 'instrument' },
  'retail-media': {
    eyebrow: 'Release 2.5 · Retail media',
    title1: '36 platforms.',
    title2: 'Every shelf.',
    count: 36,
    note1: 'Amazon, Walmart & Instacart ads',
    note2: 'Shared budgets with search',
    note3: 'SKU-level ROAS reporting',
    tagline: 'Your agent now reaches shoppers at the shelf.',
  },
};

type P = z.infer<typeof schema>;

const RINGS = [
  { k: 0.42, share: 6 / 31, off: 0.3 },
  { k: 0.68, share: 10 / 31, off: 0.05 },
  { k: 0.94, share: 15 / 31, off: 0.17 },
];

const PING = T.bars(1); // bar 2 downbeat: the agent pings
const HIT = T.bars(2); // bar 3 downbeat: title impact

/** Tiny lanternfish: the agent. Centred at (0, 0), ~2 units long. */
function Fish({ s, p, glow }: { s: number; p: P; glow: number }) {
  return (
    <g transform={`scale(${s})`}>
      <path d="M-1.05 0 L-1.45 -0.42 Q-1.32 0 -1.45 0.42 Z" fill={p.textColor} opacity={0.9} />
      <path d="M-1.1 0 C-0.8 -0.5 0.3 -0.62 0.82 -0.28 C1.06 -0.12 1.06 0.12 0.82 0.28 C0.3 0.62 -0.8 0.5 -1.1 0 Z" fill={p.textColor} />
      <path d="M-0.35 -0.47 Q-0.15 -0.8 0.18 -0.52 Z" fill={p.textColor} opacity={0.85} />
      <circle cx={0.58} cy={-0.08} r={0.16} fill={p.background} />
      <circle cx={0.62} cy={-0.08} r={0.08} fill={p.accent} />
      {[0.5, 0.25, 0, -0.25, -0.5, -0.72].map((x, i) => (
        <circle key={i} cx={x} cy={0.22 + Math.abs(x) * 0.05 - (x < -0.4 ? 0.06 : 0)} r={0.055} fill={p.accent} opacity={0.5 + glow * 0.5} />
      ))}
      <circle cx={0.98} cy={-0.18} r={0.12 * (0.6 + glow)} fill={p.pop} opacity={0.35} />
      <circle cx={0.98} cy={-0.18} r={0.06} fill={p.pop} />
    </g>
  );
}

/** The sonar plate: rings, photophores (ignite as the ping passes), the agent in the middle. */
function Plate({ frame, cx, cy, R, p, dim }: { frame: number; cx: number; cy: number; R: number; p: P; dim: number }) {
  const counts = RINGS.map((g) => Math.round(g.share * p.count));
  counts[2] += p.count - counts.reduce((a, b) => a + b, 0);
  const pingR = R * 1.18 * clamp((frame - PING) / 66);
  const pingOn = frame >= PING && frame < PING + 70;
  const breathe = 0.5 + 0.5 * Math.sin(frame / 22);
  const spin = frame * 0.0009;
  const ambient = [T.bars(3), T.bars(4)].map((at) => prog(frame, at, 90, ease.out));
  const dots: { x: number; y: number; on: number; id: number }[] = [];
  let id = 0;
  RINGS.forEach((g, ri) => {
    for (let i = 0; i < counts[ri]; i++) {
      const a = (i / counts[ri] + g.off + spin * (ri % 2 ? -1 : 1)) * Math.PI * 2 - Math.PI / 2;
      const at = PING + (g.k / 1.18) * 66 + (i / counts[ri]) * 8;
      dots.push({ x: cx + Math.cos(a) * R * g.k, y: cy + Math.sin(a) * R * g.k, on: prog(frame, at, 14, ease.backOut), id: id++ });
    }
  });
  const dotR = R * 0.03;
  return (
    <svg style={{ position: 'absolute', inset: 0, opacity: 1 - dim * 0.65 }} width="100%" height="100%">
      <defs>
        <radialGradient id="rn-glow">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rn-core">
          <stop offset="0" stopColor={p.accent2} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.accent2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R * 1.4} fill="url(#rn-core)" />
      {[0.42, 0.68, 0.94, 1.1].map((k, i) => (
        <circle key={k} cx={cx} cy={cy} r={R * k} fill="none" stroke={hexA(p.accent2, 0.55 * prog(frame, 10 + i * 6, 50))} strokeWidth={i === 3 ? 1 : 1.4} strokeDasharray={i === 3 ? '2 8' : undefined} />
      ))}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2 + spin * 2;
        const l = i % 2 ? 0.05 : 0.11;
        return <line key={i} x1={cx + Math.cos(a) * R * 1.13} y1={cy + Math.sin(a) * R * 1.13} x2={cx + Math.cos(a) * R * (1.13 + l)} y2={cy + Math.sin(a) * R * (1.13 + l)} stroke={hexA(p.accent2, 0.6 * prog(frame, 30, 60))} strokeWidth={1.2} />;
      })}
      {/* ping */}
      {pingOn && <circle cx={cx} cy={cy} r={pingR} fill="none" stroke={p.accent} strokeWidth={mix(6, 1, pingR / (R * 1.18))} opacity={1 - clamp((frame - PING) / 70) * 0.8} />}
      {ambient.map((a, i) => (a > 0 && a < 1 ? <circle key={i} cx={cx} cy={cy} r={R * (0.3 + a * 0.95)} fill="none" stroke={p.accent} strokeWidth={1.5} opacity={(1 - a) * 0.45} /> : null))}
      {dots.map((d) => (
        <g key={d.id}>
          <circle cx={d.x} cy={d.y} r={dotR * 0.95} fill={hexA(p.accent2, 0.25)} stroke={hexA(p.accent, 0.55)} strokeWidth={1.6} opacity={(1 - d.on) * prog(frame, 16 + d.id * 2.4, 20)} />
          {d.on > 0 && (
            <>
              <circle cx={d.x} cy={d.y} r={dotR * (3.2 + 0.9 * Math.sin(frame / 18 + d.id))} fill="url(#rn-glow)" opacity={0.5 * d.on} />
              <circle cx={d.x} cy={d.y} r={dotR * d.on} fill={d.id === 9 ? p.pop : p.accent} />
            </>
          )}
        </g>
      ))}
      <g transform={`translate(${cx} ${cy + Math.sin(frame / 30) * 4})`}>
        <circle r={R * 0.22 * (1 + breathe * 0.15)} fill="url(#rn-glow)" opacity={0.25 + keys(frame, [PING - 10, PING, PING + 30], [0, 0.6, 0])} />
        <Fish s={R * 0.16} p={p} glow={breathe} />
      </g>
    </svg>
  );
}

export default function ReleaseNotes(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;

  // The plate starts centred and large, then slides right to make room for the title.
  const move = prog(frame, HIT - 14, 44, ease.inOut);
  const hasShot = !!p.screenshot;
  const R = mix(320, hasShot ? 250 : 300, move);
  const cx = mix(W / 2, hasShot ? 1530 : 1450, move);
  const cy = mix(H / 2, hasShot ? 300 : 540, move);

  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 28], [0, 0.85, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, HIT, 60, ease.out);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.1) * (1 - (frame - HIT) / 14) * 6 : 0;
  const exit = prog(frame, end - 44, 44, ease.in);

  // counter during bar 2
  const counted = Math.round(p.count * clamp((frame - PING - 6) / 74));
  const counterIn = prog(frame, PING + 6, 20) * (1 - prog(frame, HIT - 18, 16, ease.in));

  const longest = Math.max(p.title1.length, p.title2.length, 8);
  const TITLE = Math.min(136, Math.round(1800 / longest));
  const L = 150; // left margin
  const titleTop = 220;
  const titleStyle = { fontFamily: FONTS[p.font], fontWeight: 400, fontSize: TITLE, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap' as const };
  const italic = p.font === 'bodoni' || p.font === 'instrument' || p.font === 'dmserif';
  const notes = [p.note1, p.note2, p.note3].filter(Boolean);
  const tagLines = p.tagline.length > 44 ? 2 : 1;
  const listTop = titleTop + TITLE * 2 + 34 + tagLines * 56 + 40; // title, tagline, gap

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        lift={hexA(p.surface, 0.9)}
        grid={{ opacity: 0.05, size: 44, y: -frame * 0.15, color: '230,255,250' }}
        glows={[
          { x: cx, y: cy, size: 1500, color: hexA(p.accent2, 0.45), opacity: keys(frame, [0, PING, HIT, end], [0.35, 0.8, 1, 0.8]) },
          { x: 260, y: 980, size: 1100, color: hexA(p.accent, 0.12), opacity: 0.5 + 0.3 * Math.sin(frame / 40) },
        ]}
        grain={0}
        vignette={0.55}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${exit * 60}px`, opacity: 1 - exit, filter: exit > 0.01 ? `blur(${exit * 14}px)` : undefined }}>
        <Dust frame={frame} width={W} height={H} count={60} color={p.accent} seed={4} speed={0.6} opacity={0.35} maxSize={5} />

        {/* Bar 1 build: light converging on the agent before the ping */}
        <Streaks frame={frame} start={10} dur={PING - 4} direction="in" count={110} width={W} height={H} cx={W / 2} cy={H / 2} seed={8} intensity={0.55} color={p.accent} highlight={p.textColor} />
        <Plate frame={frame} cx={cx} cy={cy} R={R} p={p} dim={0} />
        <Streaks frame={frame} start={PING} dur={44} direction="out" count={120} width={W} height={H} cx={W / 2} cy={H / 2} seed={13} intensity={0.7} color={p.accent} highlight={p.textColor} />

        {/* Shockwave from the plate on the hit */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <circle cx={cx} cy={cy} r={R * 1.2 + shock * 900} fill="none" stroke={p.accent} strokeWidth={mix(8, 1, shock)} opacity={frame >= HIT ? (1 - shock) * 0.7 : 0} />
        </svg>

        {/* Bar 1: eyebrow over the lone agent */}
        <div
          style={{
            position: 'absolute',
            width: W,
            top: 86,
            textAlign: 'center',
            fontFamily: FONTS.italiana,
            fontSize: 42,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: p.accent,
            opacity: prog(frame, 14, 30) * (1 - prog(frame, HIT - 20, 16, ease.in)),
            translate: `0 ${mix(24, 0, prog(frame, 14, 36))}px`,
            filter: `blur(${mix(10, 0, prog(frame, 14, 30))}px)`,
          }}
        >
          {p.eyebrow}
        </div>

        {/* Bar 2: counter under the plate */}
        <div style={{ position: 'absolute', left: L, width: 400, top: H / 2 - 130, opacity: counterIn, translate: `${mix(-30, 0, prog(frame, PING + 6, 30))}px 0` }}>
          <div style={{ fontFamily: FONTS[p.font], fontStyle: italic ? 'italic' : 'normal', fontSize: 190, lineHeight: 1, color: p.textColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{String(counted).padStart(2, '0')}</div>
          <div style={{ fontFamily: FONTS.italiana, fontSize: 38, lineHeight: 1.3, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.accent, marginTop: 10 }}>{p.counterLabel}</div>
        </div>

        {/* Bar 3+: release title, left column */}
        {frame >= HIT - 4 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: L,
                top: titleTop - 78,
                fontFamily: FONTS.italiana,
                fontSize: 40,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: p.accent,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                opacity: prog(frame, HIT + 4, 24),
                translate: `0 ${mix(16, 0, prog(frame, HIT + 4, 30))}px`,
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.pop, boxShadow: `0 0 18px ${p.pop}` }} />
              {p.eyebrow}
            </div>
            <SweepReveal frame={frame} start={HIT} dur={30} style={{ position: 'absolute', left: L, top: titleTop, ...titleStyle }}>
              <span>{p.title1}</span>
            </SweepReveal>
            <SweepReveal frame={frame} start={HIT + 8} dur={34} style={{ position: 'absolute', left: L, top: titleTop + TITLE * 1.02, ...titleStyle, fontStyle: italic ? 'italic' : 'normal' }}>
              <span style={gradientText(`linear-gradient(160deg, ${p.textColor} 0%, ${p.accent} 90%)`, TITLE)}>{p.title2}</span>
            </SweepReveal>
            <Glint frame={frame} start={T.bars(3) + T.beats(2)} dur={46} style={{ position: 'absolute', left: L, top: titleTop + TITLE * 1.02, ...titleStyle, fontStyle: italic ? 'italic' : 'normal' }}>
              {p.title2}
            </Glint>
          </>
        )}

        <WordsIn
          text={p.tagline}
          frame={frame}
          start={HIT + T.beats(1)}
          stagger={4}
          style={{ position: 'absolute', left: L, width: 1000, top: titleTop + TITLE * 2 + 34, fontSize: 44, lineHeight: 1.25, opacity: 0.88 }}
        />

        {/* Changelog list: one item per beat, photophore bullets */}
        {notes.map((n, i) => {
          const at = HIT + T.beats(3) + i * T.beat;
          const t = prog(frame, at, 24, ease.out);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: L,
                top: listTop + i * 66,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                fontSize: 44,
                fontWeight: 500,
                opacity: t,
                translate: `${mix(-30, 0, t)}px 0`,
                filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.accent, boxShadow: `0 0 ${14 + 8 * Math.sin(frame / 15 + i)}px ${p.accent}`, scale: String(prog(frame, at, 18, ease.backOut)) }} />
              {n}
            </div>
          );
        })}

        {/* Optional screenshot: glass frame below the plate */}
        {hasShot && (
          <div
            style={{
              position: 'absolute',
              left: 1180,
              top: 560,
              width: 680,
              height: 400,
              borderRadius: 22,
              padding: 10,
              background: hexA(p.surface, 0.7),
              border: `1px solid ${hexA(p.accent2, 0.6)}`,
              boxShadow: `0 40px 90px rgba(0,0,0,0.45), 0 0 60px ${hexA(p.accent2, 0.3)}`,
              opacity: prog(frame, HIT + T.beats(2), 30),
              translate: `${mix(80, 0, prog(frame, HIT + T.beats(2), 40))}px ${Math.sin(frame / 34) * 5}px`,
              filter: `blur(${mix(14, 0, prog(frame, HIT + T.beats(2), 30))}px)`,
            }}
          >
            <Img src={p.screenshot} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
          </div>
        )}

        {/* CTA on bar 4 downbeat */}
        <div
          style={{
            position: 'absolute',
            left: L,
            top: listTop + notes.length * 66 + 26,
            padding: '18px 34px',
            borderRadius: 999,
            fontSize: 34,
            fontWeight: 700,
            color: p.background,
            background: p.accent,
            boxShadow: `0 18px 50px ${hexA(p.accent, 0.35)}`,
            whiteSpace: 'nowrap',
            transformOrigin: 'left center',
            scale: String(prog(frame, T.bars(4), 26, ease.backOut)),
            opacity: clamp(prog(frame, T.bars(4), 10)),
          }}
        >
          {p.cta} →
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${(cx / W) * 100}% ${(cy / H) * 100}%, ${hexA('#ffffff', flash * 0.8)} 0%, ${hexA(p.accent, flash * 0.5)} 25%, transparent 60%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
