import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Live Countdown',
  category: 'countdown',
  description:
    'Countdown for a live event (4:5 feed): the event title lands, then 3 · 2 · 1 are pulled one per two beats, each printed pink first and snapped into register as a ring of 31 edition ticks fills, then the ring bursts and an ON AIR poster slams in with the host photo, details and a CTA.',
  tags: ['countdown', 'live', 'event', 'webinar', 'social', 'ads'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30f, bar = 120f
export const video: VideoConfig = { width: 1080, height: 1350, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text('Eyebrow (handwritten)').default('Inkrun Live'),
  title: text('Title').default('Black Friday'),
  titleItalic: text('Title, italic line').default('war room'),
  startsIn: text('Lead-in').default('starts in'),
  liveLine: text('Reveal line').default("We're live."),
  body: textarea('Body').default('Watch the agent run 31 platforms through the busiest hour of the year.'),
  posterWord: text('Poster word').default('ON AIR'),
  date: text('Date sticker (handwritten)').default('Nov 27 · 9am PT'),
  host: text('Host credit').default('with Maya Ortiz, Night Market'),
  cta: text('Call to action').default('Save your seat'),
  hostPhoto: image('Host photo (optional)').default(''),
  font: font('Display font').default('fraunces'),
  background: color().default('#12001F'),
  paper: color('Paper').default('#FBEFFF'),
  accent: color('Ink 1').default('#B026FF'),
  accent2: color('Ink 2').default('#FF2E88'),
  pop: color('Highlighter').default('#FFD600'),
  textColor: color('Text').default('#FBEFFF'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  acid: { background: '#0B0B0B', paper: '#F0FFE0', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', textColor: '#F0FFE0', title: 'Cyber Monday', titleItalic: 'live audit', date: 'Dec 1 · 10am ET' },
  risograph: { background: '#F4EFE6', paper: '#FFFFFF', accent: '#0078BF', accent2: '#FF48B0', pop: '#FFE800', textColor: '#1F2A6B' },
  'desert-dusk': {
    background: '#2B1B2E', paper: '#FFE9D6', accent: '#E5487A', accent2: '#FF8E5E', pop: '#FFD27F', textColor: '#FFE9D6',
    eyebrow: 'Inkrun office hours', title: 'Q1 planning', titleItalic: 'with the agent', liveLine: 'Doors open.', body: 'Bring your 2027 budget. We will build the first brief together, live.', date: 'Jan 8 · 4pm GMT', host: 'with the Inkrun crew', cta: 'Get the invite',
  },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

// Beat map
const COUNT = T.bars(1); // "3" on the bar-2 downbeat
const STEP = T.beats(2); // a digit every two beats
const DIGITS = ['3', '2', '1'];
const HIT = COUNT + STEP * DIGITS.length; // bar 3, beat 3: live
const END = video.durationInFrames;

const CX = 540;
const CY = 790;
const RING = 340; // tick ring radius, well outside the digit

function Digit({ d, i, frame, p, dark }: { d: string; i: number; frame: number; p: P; dark: boolean }) {
  const s = COUNT + i * STEP;
  const e = s + STEP;
  if (frame < s - 2 || frame > e + 16 || frame > HIT + 2) return null;
  // Squeegee wipe reveals the digit left → right.
  const wipe = mix(-20, 120, prog(frame, s - 2, 16, ease.inOut));
  const mask = `linear-gradient(90deg, black ${wipe - 10}%, transparent ${wipe + 10}%)`;
  const snap = prog(frame, s + 10, 16, ease.backOut);
  const off = mix(40, 5, snap);
  // The last digit clears before the poster slams in on the hit.
  const out = i === DIGITS.length - 1 ? prog(frame, HIT - 10, 12, ease.in) : prog(frame, e - 2, 16, ease.in);
  const style = {
    position: 'absolute' as const,
    left: 0,
    width: 1080,
    top: CY - 360,
    textAlign: 'center' as const,
    ...displayFace(p.font),
    fontSize: 620,
    lineHeight: 1,
    letterSpacing: '-0.05em',
  };
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, translate: `0 ${out * 120}px`, scale: String(mix(1, 0.86, out)), filter: out > 0 ? `blur(${out * 16}px)` : undefined, maskImage: mask, WebkitMaskImage: mask }}>
      <div style={{ ...style, color: p.accent2, translate: `${off}px ${off * 0.6}px`, mixBlendMode: dark ? 'screen' : 'multiply', opacity: 0.95 }}>{d}</div>
      <div style={{ ...style, color: dark ? p.textColor : p.accent }}>{d}</div>
    </div>
  );
}

export default function LiveCountdown(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const eyebrowColor = p.pop === '#FFE800' && !dark ? p.accent2 : p.pop;

  const push = mix(1, 1.05, prog(frame, 0, END, ease.inOutSoft));
  const kick = (at: number) => (frame >= at && frame < at + 12 ? Math.sin((frame - at) * 2.4) * (1 - (frame - at) / 12) * 7 : 0);
  const shake = kick(HIT) + DIGITS.reduce((a, _, i) => a + kick(COUNT + i * STEP + 10) * 0.4, 0);
  const outro = prog(frame, END - 36, 36, ease.inOut);
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]) + DIGITS.reduce((a, _, i) => a + keys(frame, [COUNT + i * STEP + 8, COUNT + i * STEP + 11, COUNT + i * STEP + 26], [0, 0.3, 0], [ease.out, ease.outSoft]), 0);

  // Title: centred and big in bar 1, then lifts to the top for the count.
  const lift = prog(frame, COUNT - 24, 30, ease.inOut);
  const titleSize = Math.min(150, 900 / (Math.max(8, p.title.length, p.titleItalic.length) * 0.5));
  const titleY = mix(470, 120, lift);
  const titleScale = mix(1, 0.6, lift);

  // Ring of 31 edition ticks fills across the count, bursts on the hit.
  const fill = clamp((frame - COUNT + 10) / (HIT - COUNT));
  const ringIn = prog(frame, COUNT - 10, 24);
  const burst = prog(frame, HIT, 34, ease.out);
  const ringOn = frame < HIT + 34;

  // Reveal
  const posterT = prog(frame, HIT, 26, ease.backOut);
  const posterIn = prog(frame, HIT, 12);
  const PW = 640;
  const PH = 470;
  const PX = (W - PW) / 2;
  const PY = 300;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.09 : 0.14, size: 30, y: -frame * 0.15, color: dark ? '251,239,255' : '31,42,107' }}
        glows={[
          { x: CX, y: CY, size: 1300, color: hexA(p.accent, dark ? 0.45 : 0.22), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: W, y: H, size: 1100, color: hexA(p.accent2, dark ? 0.35 : 0.18), opacity: 0.6 + 0.2 * Math.sin(frame / 53) },
          { x: 0, y: 200, size: 900, color: hexA(p.accent2, dark ? 0.2 : 0.1), opacity: 0.6 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.5}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={40} color={p.accent2} seed={12} opacity={dark ? 0.35 : 0.22} />

        {/* Title block */}
        <div style={{ position: 'absolute', left: 0, width: W, top: titleY, textAlign: 'center', scale: String(titleScale), transformOrigin: '50% 0', opacity: 1 - prog(frame, HIT - 8, 12, ease.in), translate: `0 ${-prog(frame, HIT - 8, 14, ease.in) * 60}px` }}>
          <div style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 76, color: eyebrowColor, rotate: '-4deg', opacity: prog(frame, 6, 22), translate: `0 ${mix(20, 0, prog(frame, 6, 28))}px` }}>{p.eyebrow}</div>
          <SweepReveal frame={frame} start={16} dur={30}>
            <div style={{ ...displayFace(p.font), fontSize: titleSize, lineHeight: 0.96, letterSpacing: '-0.04em', whiteSpace: 'nowrap' }}>{p.title}</div>
          </SweepReveal>
          <SweepReveal frame={frame} start={28} dur={30}>
            <div style={{ ...displayFace(p.font), fontStyle: 'italic', fontWeight: 600, fontSize: titleSize, lineHeight: 1.05, letterSpacing: '-0.035em', color: p.accent2, textShadow: `${titleSize * 0.03}px ${titleSize * 0.025}px 0 ${hexA(p.accent, 0.9)}`, whiteSpace: 'nowrap' }}>{p.titleItalic}</div>
          </SweepReveal>
          <WordsIn text={p.startsIn} frame={frame} start={T.beats(2)} style={{ justifyContent: 'center', fontSize: 60, fontWeight: 500, marginTop: 18, opacity: (1 - lift) * 0.9 }} />
        </div>

        {/* Tick ring */}
        {ringOn && ringIn > 0 && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: ringIn * (1 - burst) }}>
            <g transform={`translate(${CX} ${CY}) rotate(${frame * 0.15}) scale(${mix(0.9, 1, ringIn) * mix(1, 1.7, burst)})`}>
              {Array.from({ length: 31 }, (_, i) => {
                const lit = i / 31 < fill;
                const a = (i / 31) * Math.PI * 2 - Math.PI / 2;
                const r1 = RING;
                const r2 = RING + (i % 5 === 0 ? 42 : 26);
                return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={lit ? (i === 30 ? p.pop : p.accent2) : hexA(p.textColor, 0.2)} strokeWidth={i % 5 === 0 ? 9 : 6} strokeLinecap="round" />;
              })}
              <circle r={RING - 24} fill="none" stroke={hexA(p.accent, 0.5)} strokeWidth={3} strokeDasharray="4 14" />
            </g>
          </svg>
        )}

        {DIGITS.map((d, i) => (
          <Digit key={i} d={d} i={i} frame={frame} p={p} dark={dark} />
        ))}

        {/* Squeegee blade for each pull */}
        {DIGITS.map((_, i) => {
          const s = COUNT + i * STEP - 2;
          const t = prog(frame, s, 16, ease.inOut);
          if (frame < s || frame > s + 16) return null;
          const x = mix(-80, W + 80, t);
          return <div key={i} style={{ position: 'absolute', left: x - 14, top: CY - 420, height: 840, width: 28, borderRadius: 14, background: `linear-gradient(90deg, ${p.accent}, ${p.accent2})`, boxShadow: `0 0 50px ${hexA(p.accent2, 0.8)}`, rotate: '5deg' }} />;
        })}

        {/* Shockwave rings at the hit, starting outside the tick ring */}
        {frame >= HIT && frame < HIT + 50 && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {[0, 8].map((dl, k) => {
              const t = prog(frame, HIT + dl, 40, ease.out);
              return <circle key={k} cx={CX} cy={CY - 100} r={mix(RING + 40, 900, t)} fill="none" stroke={k ? p.accent2 : p.pop} strokeWidth={mix(18, 1, t)} opacity={1 - t} />;
            })}
          </svg>
        )}

        {/* ── Reveal: the ON AIR poster ── */}
        {frame >= HIT && (
          <>
            <div style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH, rotate: `${mix(-8, -2, posterT)}deg`, scale: String(mix(1.25, 1, posterT)), opacity: clamp(posterIn * 1.5) }}>
              <div style={{ position: 'absolute', inset: 0, background: p.accent, borderRadius: 10, translate: '18px 16px' }} />
              <div style={{ position: 'absolute', inset: 0, background: p.paper, borderRadius: 10, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.5)' }}>
                {p.hostPhoto ? (
                  <>
                    <Img src={p.hostPhoto} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.2)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: p.accent2, mixBlendMode: 'multiply' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(200deg, ${hexA(p.accent, 0.6)}, transparent 55%)`, mixBlendMode: 'multiply' }} />
                  </>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply' }}>
                    <div style={{ position: 'absolute', left: PW / 2 - 190, top: PH * 0.5 - 190, width: 380, height: 380, borderRadius: '50%', background: p.accent2 }} />
                    <div style={{ position: 'absolute', left: PW / 2 - 190 + 14, top: PH * 0.5 - 190 + 9, width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, transparent 0 38%, ${p.accent} 39%)` }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: PH * 0.5, backgroundImage: `radial-gradient(${p.accent} 32%, transparent 36%)`, backgroundSize: '14px 14px', maskImage: 'linear-gradient(transparent, black)', WebkitMaskImage: 'linear-gradient(transparent, black)', opacity: 0.6, translate: `${-(frame % 14)}px 0` }} />
                  </div>
                )}
                {/* poster word, two passes */}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', ...displayFace(p.font), fontSize: Math.min(132, 560 / (Math.max(4, p.posterWord.length) * 0.58)), lineHeight: 1, letterSpacing: '-0.03em', color: isDark(p.paper) ? p.paper : '#1A0830', textShadow: `6px 4px 0 ${hexA(p.accent2, 0.85)}`, whiteSpace: 'nowrap' }}>{p.posterWord}</div>
                {/* live chip */}
                <div style={{ position: 'absolute', left: 24, top: 22, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', borderRadius: 999, background: 'rgba(12,2,22,0.78)', color: '#FBEFFF', fontWeight: 800, fontSize: 26, letterSpacing: '0.14em' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 7, background: p.accent2, opacity: 0.5 + 0.5 * Math.sin(frame / 6) }} />
                  LIVE
                </div>
              </div>
              {/* date sticker */}
              <div style={{ position: 'absolute', right: -44, bottom: -34, padding: '4px 22px', background: p.pop, color: '#12001F', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 56, rotate: '-7deg', whiteSpace: 'nowrap', boxShadow: `6px 6px 0 ${p.accent2}`, scale: String(prog(frame, HIT + 16, 22, ease.backOut)), opacity: clamp(prog(frame, HIT + 16, 8)) }}>
                {p.date}
              </div>
            </div>

            {/* reveal line + glint */}
            <div style={{ position: 'absolute', left: 0, width: W, top: PY + PH + 50 }}>
              <SweepReveal frame={frame} start={HIT + 4} dur={28}>
                <div style={{ textAlign: 'center', ...displayFace(p.font), fontSize: 124, lineHeight: 1, letterSpacing: '-0.04em', whiteSpace: 'nowrap' }}>{p.liveLine}</div>
              </SweepReveal>
              <Glint frame={frame} start={HIT + T.bars(1)} dur={44} style={{ position: 'absolute', inset: 0 }}>
                <div style={{ textAlign: 'center', ...displayFace(p.font), fontSize: 124, lineHeight: 1, letterSpacing: '-0.04em', whiteSpace: 'nowrap' }}>{p.liveLine}</div>
              </Glint>
            </div>
            <WordsIn text={p.body} frame={frame} start={HIT + T.beat} stagger={3} style={{ position: 'absolute', left: 110, width: W - 220, top: PY + PH + 200, justifyContent: 'center', textAlign: 'center', fontSize: 44, lineHeight: 1.3, fontWeight: 500, opacity: 0.9 }} />
            <div style={{ position: 'absolute', left: 0, width: W, top: PY + PH + 350, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
              <div style={{ fontWeight: 800, fontSize: 44, padding: '20px 44px', borderRadius: 999, color: dark ? p.background : '#FFFFFF', background: p.textColor, boxShadow: `8px 8px 0 ${p.accent2}`, whiteSpace: 'nowrap', scale: String(prog(frame, HIT + T.beats(3), 26, ease.backOut)), opacity: clamp(prog(frame, HIT + T.beats(3), 10)) }}>
                {p.cta} →
              </div>
            </div>
            <div style={{ position: 'absolute', left: 0, width: W, top: PY - 92, textAlign: 'center', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 52, color: eyebrowColor, rotate: '-2deg', opacity: prog(frame, HIT + T.beats(2), 20) }}>{p.host}</div>
          </>
        )}

        <Streaks frame={frame} start={HIT} dur={44} width={W} height={H} direction="out" cx={CX} cy={PY + PH / 2} color={p.accent2} highlight={p.pop} count={120} intensity={dark ? 0.9 : 0.5} seed={3} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, ${hexA(p.paper, flash * 0.45)} 0%, ${hexA(p.accent2, flash * 0.3)} 30%, transparent 62%)`, mixBlendMode: dark ? 'screen' : 'multiply', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
