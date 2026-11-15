import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, gradientText, hexA, keys, mix, prog, rand, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Customer Thank You',
  category: 'thank-you',
  description: 'Vertical thank-you story for customers: embers rise, a giant italic "Thank you," lands on the downbeat with the customer\'s name (and logo), a campaign counter heats the strip, then a signed note and a gift CTA.',
  tags: ['thank you', 'customer', 'story', 'vertical', 'year in review', 'editorial'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120. Four bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  folio: text('Folio line').default('Firebrand · 2026 in review'),
  eyebrow: text().default('From all of us at Firebrand'),
  thanks: text('Headline').default('Thank you,'),
  customer: text('Customer name').default('Northwind Coffee'),
  logo: image('Customer logo (optional)').default(''),
  stat: num(0, 1000000, 1, 'Counter').default(12480),
  statLabel: text('Counter label').default('campaigns launched together this year'),
  message: textarea().default('You trusted an agent with your budget. We will keep earning it.'),
  signature: text().default('Maya Okafor'),
  signRole: text('Signature role').default('CEO, Firebrand'),
  cta: text('Call to action').default('Your 2027 kickoff call is on us'),
  font: font('Display font').default('dmserif'),
  background: color().default('#1A0A06'),
  textColor: color('Text').default('#FFEDE0'),
  accent: color().default('#FF4D00'),
  accent2: color('Heat top').default('#FFB000'),
  pop: color('Spark').default('#FF2E63'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ink-gold': { background: '#0D0D0F', textColor: '#F3EDE2', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#E3173E', font: 'bodoni' },
  citrus: { background: '#FFF8E1', textColor: '#1C2B1A', accent: '#FF7A00', accent2: '#FF3D7F', pop: '#2BB24C', customer: 'Juniper & Co.' },
  dusk: { background: '#2B1B2E', textColor: '#FFE9D6', accent: '#E5487A', accent2: '#FFD27F', pop: '#FF8E5E', thanks: 'Thanks a million,', stat: 1000000, statLabel: 'ad impressions served in your first month' },
};

type P = z.infer<typeof schema>;

const BAR2 = T.bars(1);
const BAR3 = T.bars(2);
const BAR4 = T.bars(3);
const END = T.bars(4);

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Embers bursting from a point: linear drag + terminal velocity so they arc, hang and drift. */
function Embers({ frame, start, x, y, count, seed, p }: { frame: number; start: number; x: number; y: number; count: number; seed: number; p: P }) {
  const t = frame - start;
  if (t < 0 || t > 200) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 7.31 + seed * 3.3 + k);
        const a = -Math.PI / 2 + (r(1) - 0.5) * 2.4;
        const v = 9 + r(2) * 16;
        const drag = 0.06;
        const k = (1 - Math.exp(-drag * t)) / drag;
        const px = x + Math.cos(a) * v * k + Math.sin(t / 14 + i) * 8;
        const py = y + Math.sin(a) * v * k - t * 0.6 * r(3);
        const life = clamp(1 - t / (120 + r(4) * 80));
        const s = 4 + r(5) * 9;
        const c = i % 7 === 0 ? p.pop : i % 2 ? p.accent2 : p.accent;
        return <div key={i} style={{ position: 'absolute', left: px, top: py, width: s, height: s, borderRadius: '50%', background: c, opacity: life, boxShadow: `0 0 ${s * 2.5}px ${c}` }} />;
      })}
    </>
  );
}

export default function CustomerThankYou(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);

  const build = prog(frame, 0, BAR2, ease.inSoft);
  const flash = keys(frame, [BAR2 - 2, BAR2 + 2, BAR2 + 28], [0, 1, 0], [ease.out, ease.outSoft]);
  const push = mix(1, 1.05, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 30, 30, ease.in);
  const L = 90;
  const mono: CSSProperties = { fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: '0.3em' };

  // "Thank you," stacks on two lines when it has two words.
  const words = p.thanks.split(' ');
  const line1 = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : p.thanks;
  const line2 = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : '';
  const longest = Math.max(line1.length, line2.length);
  const BIG = longest > 7 ? Math.min(250, 1500 / longest) : 270;
  const gradient = `linear-gradient(165deg, ${dark ? '#FFF4DE' : p.textColor} 0%, ${p.accent2} 45%, ${p.accent} 95%)`;
  const bigStyle: CSSProperties = { position: 'absolute', left: L, ...displayFace(p.font, { italic: true }), fontSize: BIG, lineHeight: 1, letterSpacing: '-0.04em', whiteSpace: 'nowrap' };
  const y1 = 330;
  const y2 = y1 + BIG * 0.92;
  const nameY = (line2 ? y2 : y1) + BIG * 1.02;

  const count = Math.round(p.stat * prog(frame, BAR3, T.beats(3), ease.outSoft));
  const statY = nameY + 175;
  const fill = prog(frame, BAR3, T.beats(3), ease.outSoft);
  const ctaT = prog(frame, BAR4 + T.beats(1), 26, ease.backOut);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.bricolage }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.05 : 0.08, size: 40, y: -frame * 0.2, color: dark ? '255,237,224' : '28,43,26' }}
        lift={dark ? hexA(p.accent, 0.07) : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: W * 0.5, y: H * mix(1.25, 1.0, build), size: 2000, color: hexA(p.accent, dark ? 0.55 : 0.35), opacity: 0.8 + 0.15 * Math.sin(frame / 36) },
          { x: W * 0.15, y: H * 0.25, size: 1100, color: hexA(p.accent2, dark ? 0.28 : 0.3), opacity: prog(frame, BAR2, 60) * 0.9 },
          { x: W * 0.95, y: H * 0.6, size: 900, color: hexA(p.pop, 0.18), opacity: 0.6 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro, filter: outro > 0 ? `blur(${outro * 12}px)` : undefined }}>
        <Dust frame={frame} width={W} height={H} count={55} color={p.accent2} seed={21} speed={mix(1.2, 2, build)} opacity={dark ? 0.55 : 0.4} maxSize={6} />

        {/* Folio (top) */}
        <div style={{ position: 'absolute', left: L, right: L, top: 120, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...mono, fontSize: 24, color: p.accent }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ width: 60 * prog(frame, 4, 30), height: 3, backgroundImage: `linear-gradient(90deg, ${p.accent}, ${p.accent2})` }} />
            {typed(frame, 8, FPS, 36, p.folio)}
          </span>
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.pop, opacity: prog(frame, 40, 10) * (0.55 + 0.45 * Math.abs(Math.sin(frame / 16))), boxShadow: `0 0 16px ${p.pop}` }} />
        </div>

        {/* Eyebrow types in during the build */}
        <div style={{ position: 'absolute', left: L, top: 250, ...mono, letterSpacing: '0.2em', fontSize: 30, color: p.textColor, opacity: 0.8 }}>{typed(frame, 30, FPS, 28, p.eyebrow)}</div>

        {/* Build: a ghost year heats up from outline to glow, then burns away into the hit */}
        {frame < BAR2 + 4 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: W,
              top: 640,
              textAlign: 'center',
              ...displayFace(p.font, { italic: true }),
              fontSize: 400,
              lineHeight: 1,
              letterSpacing: '-0.05em',
              color: hexA(p.accent, build * 0.35),
              WebkitTextStroke: `3px ${hexA(p.accent2, 0.35 + build * 0.6)}`,
              textShadow: `0 0 ${50 * build}px ${hexA(p.accent, 0.7)}`,
              opacity: prog(frame, 10, 30) * (1 - prog(frame, BAR2 - 10, 12, ease.in)),
              scale: String(mix(0.94, 1.06, build)),
              filter: `blur(${prog(frame, BAR2 - 10, 12, ease.in) * 20}px)`,
            }}
          >
            {(p.folio.match(/\d{4}/) ?? ['2026'])[0]}
          </div>
        )}

        {/* Embers converge, then burst on the downbeat */}
        <Streaks frame={frame} start={BAR2 - T.beats(2)} dur={T.beats(2)} direction="in" count={90} width={W} height={H} cx={W * 0.45} cy={y1 + BIG * 0.6} seed={6} intensity={0.4 + build * 0.5} color={p.accent} highlight={p.accent2} />
        <Streaks frame={frame} start={BAR2} dur={44} direction="out" count={150} width={W} height={H} cx={W * 0.45} cy={y1 + BIG * 0.6} seed={17} intensity={1.1} color={p.accent} highlight="#FFF4DE" />
        <Embers frame={frame} start={BAR2} x={W * 0.45} y={y1 + BIG * 0.7} count={46} seed={2} p={p} />
        <Embers frame={frame} start={BAR4} x={W * 0.82} y={H - 150} count={30} seed={9} p={p} />

        {/* Hero: "Thank / you," */}
        {frame >= BAR2 && (
          <>
            <SweepReveal frame={frame} start={BAR2 + 2} dur={30} style={{ ...bigStyle, top: y1 }}>
              <span style={{ ...gradientText(gradient, BIG), paddingRight: BIG * 0.12 }}>{line1}</span>
            </SweepReveal>
            {line2 && (
              <SweepReveal frame={frame} start={BAR2 + 8} dur={30} style={{ ...bigStyle, top: y2 }}>
                <span style={{ ...gradientText(gradient, BIG), paddingRight: BIG * 0.12 }}>{line2}</span>
              </SweepReveal>
            )}
            <Glint frame={frame} start={BAR4 + T.beats(2)} dur={44} style={{ ...bigStyle, top: y1 }}>
              {line1}
            </Glint>
          </>
        )}

        {/* Customer name (+ optional logo badge) on beat 3 of bar 2 */}
        {(() => {
          const t = prog(frame, BAR2 + T.beats(2), 28, ease.out);
          return (
            <div style={{ position: 'absolute', left: L, right: L, top: nameY, display: 'flex', alignItems: 'center', gap: 26, opacity: clamp(t * 1.4), translate: `0 ${mix(30, 0, t)}px`, filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined }}>
              {p.logo && (
                <div style={{ width: 120, height: 120, flexShrink: 0, borderRadius: '50%', background: dark ? '#FFF4DE' : '#FFFFFF', display: 'grid', placeItems: 'center', boxShadow: `0 0 0 4px ${p.accent}, 0 20px 50px ${hexA(p.accent, 0.4)}`, overflow: 'hidden' }}>
                  <Img src={p.logo} style={{ width: '72%', height: '72%', objectFit: 'contain' }} />
                </div>
              )}
              <div style={{ ...displayFace(p.font), fontSize: p.customer.length > 16 ? 76 : 96, lineHeight: 1, letterSpacing: '-0.02em' }}>{p.customer}</div>
            </div>
          );
        })()}

        {/* Counter + heat strip fill on bar 3 */}
        {(() => {
          const t = prog(frame, BAR3 - 6, 24, ease.out);
          return (
            <div style={{ position: 'absolute', left: L, right: L, top: statY, opacity: clamp(t * 1.4), translate: `0 ${mix(30, 0, t)}px` }}>
              <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 150, lineHeight: 1, letterSpacing: '-0.04em', color: p.accent2, textShadow: `0 0 40px ${hexA(p.accent, 0.5)}` }}>{count.toLocaleString('en-US')}</div>
              <div style={{ position: 'relative', height: 10, marginTop: 28, borderRadius: 99, background: hexA(p.textColor, 0.1) }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, borderRadius: 99, backgroundImage: `linear-gradient(90deg, ${hexA(p.accent, 0.3)}, ${p.accent} 50%, ${p.accent2} 85%, #FFF4DE)`, backgroundSize: `${W - L * 2}px 100%`, boxShadow: `0 0 24px ${hexA(p.accent, 0.7)}` }} />
              </div>
              <div style={{ fontSize: 44, lineHeight: 1.25, marginTop: 24, opacity: 0.9 }}>{p.statLabel}</div>
            </div>
          );
        })()}

        <WordsIn text={p.message} frame={frame} start={BAR3 + T.beats(2)} stagger={3} style={{ position: 'absolute', left: L, width: W - L * 2, top: statY + 340, fontSize: 46, lineHeight: 1.3, opacity: 0.85 }} />

        {/* Signature on bar 4, CTA one beat later */}
        {(() => {
          const t = prog(frame, BAR4, 28, ease.out);
          return (
            <div style={{ position: 'absolute', left: L, top: H - 385, display: 'flex', alignItems: 'baseline', gap: 24, opacity: clamp(t * 1.4), translate: `${mix(-30, 0, t)}px 0` }}>
              <span style={{ ...displayFace(p.font, { italic: true }), fontSize: 72, color: p.textColor }}>— {p.signature}</span>
              <span style={{ ...mono, fontSize: 24, letterSpacing: '0.2em', color: p.accent2 }}>{p.signRole}</span>
            </div>
          );
        })()}
        <div style={{ position: 'absolute', left: L, right: L, top: H - 275, display: 'flex' }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              padding: '26px 44px',
              borderRadius: 999,
              color: dark ? p.background : '#FFFDF6',
              background: `linear-gradient(180deg, ${p.accent2}, ${p.accent})`,
              boxShadow: `0 0 0 1px ${hexA('#FFFFFF', 0.25)} inset, 0 18px 50px ${hexA(p.accent, 0.5 + 0.2 * Math.sin(frame / 12))}`,
              whiteSpace: 'nowrap',
              scale: String(ctaT),
              transformOrigin: 'left center',
              opacity: clamp(prog(frame, BAR4 + T.beats(1), 8)),
            }}
          >
            {p.cta} →
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 45% ${((y1 + BIG * 0.6) / H) * 100}%, ${hexA('#FFF4DE', flash)} 0%, ${hexA(p.accent, flash * 0.6)} 25%, transparent 60%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.4 : 0.08} frame={frame} />
    </AbsoluteFill>
  );
}
