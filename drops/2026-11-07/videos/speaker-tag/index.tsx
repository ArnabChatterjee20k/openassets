import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Speaker Tag',
  category: 'lower-third',
  description:
    'Ledger-style lower third for Mandate webinars and podcasts: a gold tick rule draws on the beat, the speaker’s name slams in beside a gold-multiplied headshot plate, a split-flap LIVE chip settles, a ticker crawls under the rule, and a gold wipe clears it.',
  tags: ['lower-third', 'name', 'speaker', 'podcast', 'webinar', 'finance'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  name: text('Speaker name').default('Priya Raman'),
  title: text('Title · company').default('VP Growth · Northwind Coffee'),
  chip: text('Chip').default('Mandate ▲ Live'),
  show: text('Show label').default('The Morning Ledger · Ep. 14'),
  ticker: text('Ticker crawl').default('META ▲2.3   GOOGLE ▲0.9   TIKTOK ▲3.1   YOUTUBE ▼0.4   AMAZON ▲1.2   LINKEDIN ▼1.8   REDDIT ▲0.6   CTV ▲4.0'),
  background: color().default('#0D0D0F'),
  surface: color('Panels').default('#1C1C20'),
  textColor: color('Text').default('#F3EDE2'),
  accent: color('Gold').default('#C9A45C'),
  muted: color('Rules & muted').default('#6E6A62'),
  pop: color('Highlight').default('#E8D9B5'),
  headshot: image('Headshot (optional)').default(''),
  footage: image('Background still (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', textColor: '#0A0A0A', accent: '#E3000F', muted: '#8C8C88', pop: '#E3000F', name: 'Jonas Weber', title: 'CFO · Halde Outdoor', chip: 'Mandate ▲ Panel' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', textColor: '#EAF2FF', accent: '#FFDD00', muted: '#7FB2FF', pop: '#FFFFFF', name: 'Ana Okafor', title: 'Head of Paid · Loop Fitness', show: 'Bid Desk Teardown · Ep. 15' },
  cherry: { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#F7B32B', muted: '#B0707A', pop: '#F5C6AA', name: 'Marcus Lee', title: 'Founder · Mandate', chip: 'Q4 ▲ Clinic', show: 'Live · Q4 Budget Clinic' },
};

type P = z.infer<typeof schema>;

const isDarkHex = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▲▼$%';
/** Split-flap scramble: characters settle left to right after `start`. */
function scramble(label: string, frame: number, start: number, seed: number) {
  if (frame < start) return '';
  return label
    .split('')
    .map((c, i) => {
      if (c === ' ' || frame >= start + 6 + i * 2) return c;
      return GLYPHS[Math.floor(rand(seed * 31 + i * 7 + Math.floor(frame / 2)) * GLYPHS.length)];
    })
    .join('');
}

const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export default function SpeakerTag(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDarkHex(p.background);
  const hasFootage = !!p.footage;
  const end = video.durationInFrames;
  const mono = { fontFamily: FONTS.spacemono } as const;

  // Beat map.
  const RULE = T.beats(1); // gold rule draws
  const NAME = T.beats(2); // plate + name slam
  const TITLE = T.beats(3); // title words + chip flaps
  const GLINT = T.bars(2); // glint on the name
  const EXIT = T.bars(3) + T.beats(2); // gold wipe clears the tag
  // Gold panel: its right edge sweeps across the band (cover), then its left edge follows (reveal).
  const cover = prog(frame, EXIT, 18, ease.inOut);
  const uncover = prog(frame, EXIT + 20, 18, ease.inOut);
  const exitOut = frame >= EXIT + 18 ? 1 : 0;

  // Layout (1080p safe area).
  const PAD = 120;
  const plate = 250;
  const ruleY = 888;
  const plateTop = ruleY - plate - 16;
  const textX = PAD + plate + 48;
  const textW = W - PAD - textX;
  const NAMEPX = Math.min(150, textW / Math.max(6, p.name.length * 0.66));
  const tickerY = ruleY + 24;

  // Motion.
  const rule = prog(frame, RULE, 26, ease.inOutSoft);
  const plateIn = prog(frame, NAME - 4, 26, ease.out);
  const nameHit = keys(frame, [NAME, NAME + 3, NAME + 24], [0, 1, 0], [ease.out, ease.outSoft]);
  const shakeK = frame >= NAME + 6 ? Math.exp(-(frame - NAME - 6) / 5) : 0;
  const shake = `${Math.sin(frame * 2.1) * 6 * shakeK}px ${Math.cos(frame * 2.9) * 4 * shakeK}px`;
  const breathe = 0.5 + 0.5 * Math.sin(frame / 40);
  const push = mix(1, 1.035, prog(frame, 0, end, ease.inOutSoft));
  const tickerOn = prog(frame, RULE + 16, 20);
  const crawl = (frame - RULE) * 2.2;
  const tickerText = `${p.ticker}   ·   `.repeat(4);

  const nameStyle = {
    fontFamily: FONTS.archivo,
    fontSize: NAMEPX,
    lineHeight: 0.96,
    letterSpacing: '-0.04em',
    whiteSpace: 'nowrap' as const,
  };
  const panelFill = hasFootage ? hexA(p.background, 0.72) : hexA(p.surface, 0.0);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, overflow: 'hidden' }}>
      {/* stage: the user's footage still, or the kit's ledger room */}
      {hasFootage ? (
        <AbsoluteFill>
          <Img src={p.footage} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(push) }} />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 38%, ${hexA(p.background, 0.55)} 62%, ${hexA(p.background, 0.92)} 100%)` }} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ scale: String(push) }}>
          <Backdrop
            base={p.background}
            frame={frame}
            grid={{ opacity: dark ? 0.08 : 0.13, size: 48, x: -frame * 0.2, color: dark ? '201,164,92' : '10,10,10' }}
            lift={dark ? 'rgba(243,237,226,0.05)' : 'rgba(255,255,255,0.5)'}
            glows={[
              { x: W * 0.62, y: H * 0.36, size: 1500, color: hexA(p.accent, dark ? 0.2 : 0.1), opacity: 0.7 + 0.3 * breathe },
              { x: PAD + plate / 2, y: ruleY - plate / 2, size: 900, color: hexA(p.accent, dark ? 0.28 : 0.14), opacity: clamp(plateIn) * (1 - exitOut) },
              { x: W - 180, y: 80, size: 1100, color: hexA(p.muted, dark ? 0.3 : 0.18), opacity: 0.6 },
            ]}
            grain={0}
            vignette={dark ? 0.5 : 0.08}
          />
          {/* type as image: a giant outlined ledger figure behind the stage */}
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: 40,
              fontFamily: FONTS.archivo,
              fontSize: 620,
              lineHeight: 1,
              letterSpacing: '-0.06em',
              color: 'transparent',
              WebkitTextStroke: `3px ${hexA(p.accent, dark ? 0.2 : 0.28)}`,
              translate: `${mix(40, -40, prog(frame, 0, end, ease.inOutSoft))}px 0`,
            }}
          >
            LIVE
          </div>
          <Dust frame={frame} width={W} height={H} count={44} color={p.pop} seed={5} speed={0.7} opacity={dark ? 0.32 : 0.18} maxSize={4} />
        </AbsoluteFill>
      )}

      {/* corner bug: on-air dot + show label, top-left */}
      <div style={{ position: 'absolute', left: PAD, top: 96, display: 'flex', alignItems: 'center', gap: 18, ...mono, fontSize: 30, letterSpacing: '0.26em', textTransform: 'uppercase', opacity: prog(frame, 6, 24) * (1 - exitOut), color: hasFootage ? p.textColor : hexA(p.textColor, 0.8) }}>
        <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.accent, boxShadow: `0 0 ${18 + 14 * breathe}px ${p.accent}`, opacity: 0.6 + 0.4 * (Math.floor(frame / 30) % 2) }} />
        {p.show}
      </div>

      {/* running timecode, top-right: keeps the hold alive */}
      <div style={{ position: 'absolute', right: PAD, top: 96, ...mono, fontSize: 30, letterSpacing: '0.18em', color: hexA(p.textColor, hasFootage ? 0.9 : 0.6), opacity: prog(frame, 6, 24) * (1 - exitOut), fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ color: p.accent }}>REC</span> 00:14:{String(7 + Math.floor(frame / FPS)).padStart(2, '0')}:{String(frame % FPS).padStart(2, '0')}
      </div>

      {/* the lower third */}
      <AbsoluteFill style={{ translate: shake }}>
        {/* soft backing band so the tag reads over any footage */}
        {hasFootage && <div style={{ position: 'absolute', left: 0, right: 0, top: plateTop - 160, bottom: 0, background: `linear-gradient(180deg, transparent 0%, ${panelFill} 45%, ${hexA(p.background, 0.85)} 100%)`, opacity: rule * (1 - exitOut) }} />}

        {/* headshot plate (or monogram) */}
        <div
          style={{
            position: 'absolute',
            left: PAD,
            top: plateTop,
            width: plate,
            height: plate,
            boxSizing: 'border-box',
            border: `3px solid ${p.accent}`,
            background: p.surface,
            boxShadow: `14px 14px 0 ${hexA(p.muted, dark ? 0.55 : 0.6)}`,
            overflow: 'hidden',
            opacity: clamp(plateIn * 1.6) * (1 - exitOut),
            translate: `0 ${mix(40, 0, plateIn)}px`,
            filter: plateIn < 1 ? `blur(${(1 - plateIn) * 10}px)` : undefined,
          }}
        >
          {p.headshot ? (
            <>
              <Img src={p.headshot} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)', scale: String(mix(1.14, 1.02, prog(frame, NAME, 300, ease.outSoft))) }} />
              <div style={{ position: 'absolute', inset: 0, background: p.accent, mixBlendMode: 'multiply', opacity: 0.55 }} />
            </>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.archivo, fontSize: 132, letterSpacing: '-0.05em', color: p.accent, background: `radial-gradient(circle at 30% 25%, ${hexA(p.pop, 0.14)}, transparent 70%)` }}>
              {initials(p.name)}
            </div>
          )}
          {/* corner ticks, like a registration mark */}
          <div style={{ position: 'absolute', right: 10, bottom: 8, ...mono, fontSize: 18, letterSpacing: '0.2em', color: p.headshot ? p.background : hexA(p.textColor, 0.55) }}>REC·01</div>
        </div>

        {/* chip: split-flap label on gold */}
        <div style={{ position: 'absolute', left: textX, top: plateTop - 26, display: 'flex', opacity: prog(frame, TITLE + 6, 8) * (1 - exitOut) }}>
          <span style={{ ...mono, fontSize: 30, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 18px', background: p.accent, color: dark ? p.background : '#FFFFFF', boxShadow: `6px 6px 0 ${p.textColor}`, whiteSpace: 'nowrap' }}>
            {scramble(p.chip.toUpperCase(), frame, TITLE + 6, 3)}
          </span>
        </div>

        {/* name: the hit on beat 3 */}
        <div style={{ position: 'absolute', left: textX, top: ruleY - 70 - NAMEPX * 1.02, opacity: 1 - exitOut, translate: `${mix(0, -60, exitOut)}px 0` }}>
          <SweepReveal frame={frame} start={NAME} dur={22} blur={18} scaleFrom={1.12} style={{ transformOrigin: 'left bottom' }}>
            <div style={{ ...nameStyle, color: p.textColor }}>{p.name}</div>
          </SweepReveal>
          <Glint frame={frame} start={GLINT} dur={46} style={{ ...nameStyle, position: 'absolute', left: 0, top: 0 }}>
            {p.name}
          </Glint>
        </div>

        {/* title · company */}
        <div style={{ position: 'absolute', left: textX, top: ruleY - 64, width: textW, opacity: 1 - exitOut }}>
          <WordsIn text={p.title} frame={frame} start={TITLE} stagger={4} style={{ ...mono, fontSize: 44, lineHeight: 1.1, color: dark ? p.accent : p.textColor, whiteSpace: 'nowrap', flexWrap: 'nowrap' }} />
        </div>

        {/* gold rule with ticks: draws from the plate to the right edge */}
        <div style={{ position: 'absolute', left: PAD, top: ruleY, width: (W - PAD) * rule, height: 4, background: p.accent, boxShadow: `0 0 ${12 + 16 * breathe}px ${hexA(p.accent, 0.7)}`, opacity: 1 - exitOut }} />
        <svg style={{ position: 'absolute', left: PAD, top: ruleY + 4, opacity: 1 - exitOut }} width={W - PAD} height={16}>
          {Array.from({ length: 49 }, (_, i) => {
            const x = (i / 48) * (W - PAD * 2);
            return <line key={i} x1={x} x2={x} y1={0} y2={i % 8 === 0 ? 14 : 7} stroke={p.accent} strokeWidth={2} opacity={rule >= i / 48 ? 0.85 : 0} />;
          })}
        </svg>
        {/* the playhead spark riding the rule as it draws */}
        {rule > 0 && rule < 1 && <div style={{ position: 'absolute', left: PAD + (W - PAD) * rule - 30, top: ruleY - 12, width: 60, height: 28, borderRadius: '50%', background: `radial-gradient(${p.pop}, transparent 70%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />}

        {/* ticker crawl under the rule */}
        <div style={{ position: 'absolute', left: PAD, right: 0, top: tickerY, height: 44, overflow: 'hidden', opacity: tickerOn * (1 - exitOut), maskImage: 'linear-gradient(90deg, transparent, black 6%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 6%, black 92%, transparent)' }}>
          <div style={{ ...mono, fontSize: 30, letterSpacing: '0.12em', whiteSpace: 'nowrap', color: hexA(p.textColor, 0.72), translate: `${-crawl}px 0` }}>
            {tickerText.split(/(▲[\d.]+|▼[\d.]+)/).map((s, i) => (
              <span key={i} style={{ color: s.startsWith('▲') ? p.pop : s.startsWith('▼') ? hexA(p.textColor, 0.45) : undefined }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {/* flash on the name hit */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 22% at ${((textX + 300) / W) * 100}% ${((ruleY - 90) / H) * 100}%, ${hexA(p.pop, nameHit * 0.55)} 0%, ${hexA(p.accent, nameHit * 0.25)} 40%, transparent 75%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />

      {/* exit: a gold panel wipes across the band and takes the tag with it */}
      {cover > 0 && uncover < 1 && (
        <>
          <div style={{ position: 'absolute', top: plateTop - 30, height: tickerY + 44 - plateTop + 60, left: mix(0, W, uncover), width: Math.max(0, mix(0, W, cover) - mix(0, W, uncover)), background: p.accent }} />
          <div style={{ position: 'absolute', top: plateTop - 30, height: tickerY + 44 - plateTop + 60, left: (cover < 1 ? mix(0, W, cover) : mix(0, W, uncover)) - 5, width: 10, background: p.pop, boxShadow: `0 0 40px ${p.pop}` }} />
        </>
      )}

      <FilmOverlay grain={dark ? 0.06 : 0.035} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
