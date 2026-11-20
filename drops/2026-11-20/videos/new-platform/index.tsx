import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'New Platform',
  category: 'announcement',
  description:
    'Feature announcement for an AI ad agent: a TV switches on mid-print, "Now printing on Connected TV" lands out of register and snaps in on the downbeat with a 32/32 edition sticker, three feature lines arrive on the beat, then the CTA. Drop your own spot into the screen.',
  tags: ['announcement', 'feature', 'new', 'saas', 'ads', 'ctv'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30f, bar = 120f
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text('Eyebrow (handwritten)').default('new on Inkrun'),
  kicker: text('Kicker').default('Now printing on'),
  headline: text('Headline').default('Connected TV'),
  edition: text('Edition sticker').default('32/32'),
  feature1: text('Feature 1').default('Roku, Hulu, Tubi and Samsung TV+'),
  feature2: text('Feature 2').default('15 s and 30 s cuts from the same brief'),
  feature3: text('Feature 3').default('Scan-to-shop QR on every spot'),
  cta: text('Call to action').default('Turn it on in Settings'),
  date: text('Date (handwritten)').default('live today · Nov 20'),
  screenTitle: text('On-screen ad title').default('Night Market'),
  screenOffer: text('On-screen ad offer').default('20% off · this weekend'),
  screenImage: image('Your spot on the TV (optional)').default(''),
  font: font('Display font').default('fraunces'),
  background: color().default('#12001F'),
  paper: color('Paper').default('#FBEFFF'),
  accent: color('Ink 1').default('#B026FF'),
  accent2: color('Ink 2').default('#FF2E88'),
  pop: color('Highlighter').default('#FFD600'),
  textColor: color('Text').default('#FBEFFF'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  risograph: { background: '#F4EFE6', paper: '#FFFFFF', accent: '#0078BF', accent2: '#FF48B0', pop: '#FFE800', textColor: '#1F2A6B' },
  'deep-sea': {
    background: '#021B26', paper: '#E6FFFA', accent: '#1B7FA6', accent2: '#2EF2C4', pop: '#FF7A59', textColor: '#E6FFFA',
    headline: 'Podcasts', edition: '33/33', feature1: 'Spotify, iHeart and SiriusXM', feature2: 'Host-read scripts from your brief', feature3: 'Promo codes tracked per show', screenTitle: 'Kiln Coffee', screenOffer: 'code KILN15',
  },
  lava: { background: '#1A0A06', paper: '#FFEDE0', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63', textColor: '#FFEDE0', headline: 'Retail media', feature1: 'Amazon, Walmart and Instacart', feature2: 'Product ads synced to your catalogue', feature3: 'Budget follows in-stock items' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

// Beat map
const TV_IN = 12;
const TV_ON = 40;
const HIT = T.bars(1); // headline snaps into register
const FEAT = T.bars(2); // features on beats
const CTA = T.bars(3);
const END = video.durationInFrames;

// TV geometry
const TV = { x: 1080, y: 230, w: 700, h: 440 };
const BEZ = 22;

/** The default on-screen spot: a two-ink gig-poster ad that keeps moving. */
function DefaultSpot({ p, frame, w, h }: { p: P; frame: number; w: number; h: number }) {
  const ink = isDark(p.paper) ? p.paper : '#1A0830';
  const t = frame - TV_ON;
  const sunY = mix(h * 0.75, h * 0.42, prog(frame, TV_ON, 70, ease.out));
  const titleSize = Math.min(86, (w * 0.62) / (Math.max(6, p.screenTitle.length) * 0.5));
  return (
    <div style={{ position: 'absolute', inset: 0, background: p.paper, overflow: 'hidden' }}>
      {/* scrolling stripes */}
      <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply' }}>
        {Array.from({ length: 9 }, (_, k) => (
          <div key={k} style={{ position: 'absolute', left: -w * 0.3, width: w * 1.6, top: ((k * 64 + t * 0.9) % (9 * 64)) - 64, height: 22, rotate: '-14deg', background: k % 2 ? p.accent2 : p.accent, opacity: 0.85 }} />
        ))}
      </div>
      {/* sun rising, two passes out of register */}
      <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply' }}>
        <div style={{ position: 'absolute', left: w * 0.68 - 110, top: sunY - 110, width: 220, height: 220, borderRadius: '50%', background: p.accent2 }} />
        <div style={{ position: 'absolute', left: w * 0.68 - 110 + 10, top: sunY - 110 + 6, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, transparent 0 40%, ${p.accent} 41%)` }} />
      </div>
      {/* copy block */}
      <div style={{ position: 'absolute', left: 36, bottom: 40, width: w * 0.58, padding: '18px 24px', background: p.paper, boxShadow: `8px 8px 0 ${p.accent}` }}>
        <div style={{ ...displayFace(p.font), fontSize: titleSize, lineHeight: 0.95, letterSpacing: '-0.035em', color: ink, whiteSpace: 'nowrap', textShadow: `4px 3px 0 ${hexA(p.accent2, 0.7)}` }}>{p.screenTitle}</div>
        <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 30, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink, marginTop: 8, whiteSpace: 'nowrap' }}>{p.screenOffer}</div>
      </div>
    </div>
  );
}

export default function NewPlatform(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const eyebrowColor = p.pop === '#FFE800' && !dark ? p.accent2 : p.pop;

  const push = mix(1, 1.045, prog(frame, 0, END, ease.inOutSoft));
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 14) * 6 : 0;
  const outro = prog(frame, END - 34, 34, ease.inOut);
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 26], [0, 1, 0], [ease.out, ease.outSoft]) + keys(frame, [CTA - 2, CTA + 2, CTA + 22], [0, 0.45, 0], [ease.out, ease.outSoft]);

  // TV entrance and power-on
  const tvIn = prog(frame, TV_IN, 40);
  const on = prog(frame, TV_ON, 16, ease.out);
  const sw = TV.w - BEZ * 2;
  const sh = TV.h - BEZ * 2 - 26;
  // Pink ghost of the TV, out of register until the hit.
  const ghost = mix(26, 0, prog(frame, HIT, 18, ease.backOut));

  // Headline sizing
  const headSize = Math.min(160, 820 / (Math.max(6, p.headline.length) * 0.52));
  const headTop = 380;
  const off = mix(34, 4, prog(frame, HIT, 16, ease.backOut));
  const headStyle = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    ...displayFace(p.font),
    fontStyle: 'italic' as const,
    fontWeight: 700,
    fontSize: headSize,
    lineHeight: 1,
    letterSpacing: '-0.04em',
    whiteSpace: 'nowrap' as const,
  };

  const features = [p.feature1, p.feature2, p.feature3].filter(Boolean);
  const ctaT = prog(frame, CTA, 26, ease.backOut);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.09 : 0.14, size: 30, y: -frame * 0.15, color: dark ? '251,239,255' : '31,42,107' }}
        glows={[
          { x: TV.x + TV.w / 2, y: TV.y + TV.h / 2, size: 1500, color: hexA(p.accent, dark ? 0.45 : 0.22), opacity: (0.4 + 0.5 * on) * (0.85 + 0.15 * Math.sin(frame / 40)) },
          { x: 300, y: 900, size: 1200, color: hexA(p.accent2, dark ? 0.3 : 0.16), opacity: 0.6 + 0.2 * Math.sin(frame / 53) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.4}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={46} color={p.accent2} seed={4} opacity={dark ? 0.35 : 0.22} />

        {/* ── The TV ── */}
        <div style={{ position: 'absolute', left: TV.x, top: TV.y, width: TV.w, height: TV.h + 120, opacity: clamp(tvIn * 1.3), translate: `${mix(140, 0, tvIn)}px ${mix(20, 0, tvIn)}px`, rotate: `${mix(4, -1.5, tvIn)}deg`, filter: tvIn < 1 ? `blur(${(1 - tvIn) * 14}px)` : undefined }}>
          {/* pink pass of the whole set */}
          <div style={{ position: 'absolute', left: ghost, top: ghost * 0.6, width: TV.w, height: TV.h, borderRadius: 30, background: p.accent2, opacity: 0.85, mixBlendMode: dark ? 'screen' : 'multiply' }} />
          {/* stand */}
          <div style={{ position: 'absolute', left: TV.w / 2 - 150, top: TV.h - 10, width: 300, height: 74, background: `linear-gradient(${p.paper}, ${hexA(p.paper, 0.75)})`, clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)', opacity: 0.9 }} />
          {/* body */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: TV.w, height: TV.h, borderRadius: 30, background: p.paper, boxShadow: `16px 16px 0 ${p.accent}, 0 50px 120px rgba(0,0,0,0.5)` }}>
            {/* screen */}
            <div style={{ position: 'absolute', left: BEZ, top: BEZ, width: sw, height: sh, borderRadius: 14, background: '#0B0214', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, scale: `1 ${mix(0.006, 1, on)}`, opacity: clamp(on * 3) }}>
                {p.screenImage ? (
                  <>
                    <Img src={p.screenImage} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.15)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: p.accent, mixBlendMode: 'multiply' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${hexA(p.accent2, 0.55)}, transparent 60%)`, mixBlendMode: 'screen' }} />
                  </>
                ) : (
                  <DefaultSpot p={p} frame={frame} w={sw} h={sh} />
                )}
                {/* scanlines + glass sheen */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0 2px, transparent 2px 5px)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.18) 0%, transparent 35%)' }} />
                {/* LIVE chip + progress bar */}
                <div style={{ position: 'absolute', left: 22, top: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', borderRadius: 999, background: 'rgba(12,2,22,0.75)', color: '#FBEFFF', fontWeight: 800, fontSize: 26, letterSpacing: '0.12em', opacity: prog(frame, HIT + 6, 14) }}>
                  <span style={{ width: 14, height: 14, borderRadius: 7, background: p.accent2, opacity: 0.55 + 0.45 * Math.sin(frame / 6) }} />
                  ON AIR
                </div>
                <div style={{ position: 'absolute', left: 0, bottom: 0, height: 8, width: `${clamp((frame - TV_ON) / (END - TV_ON)) * 100}%`, background: p.pop }} />
              </div>
              {/* power-on line flare */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: sh / 2 - 3, height: 6, background: '#FFFFFF', boxShadow: `0 0 40px 10px ${hexA(p.accent2, 0.8)}`, opacity: keys(frame, [TV_ON - 2, TV_ON + 2, TV_ON + 14], [0, 1, 0]) }} />
            </div>
            {/* chin: brand dot + LED */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: on > 0.5 ? p.accent2 : hexA('#1A0830', 0.3) }} />
            </div>
          </div>
        </div>

        {/* Edition sticker on the TV corner */}
        <div style={{ position: 'absolute', left: TV.x + TV.w - 120, top: TV.y - 60, padding: '4px 22px', background: p.pop, color: '#12001F', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 76, lineHeight: 1.1, rotate: '-10deg', boxShadow: `6px 6px 0 ${p.accent2}`, scale: String(prog(frame, HIT + 10, 22, ease.backOut)), opacity: clamp(prog(frame, HIT + 10, 8)) }}>
          {p.edition}
        </div>

        {/* ── Copy column ── */}
        <div style={{ position: 'absolute', left: 150, top: 168, fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 68, color: eyebrowColor, rotate: '-4deg', opacity: prog(frame, 8, 24), translate: `${mix(-24, 0, prog(frame, 8, 30))}px 0` }}>
          {p.eyebrow}
        </div>
        <WordsIn text={p.kicker} frame={frame} start={T.beats(2)} stagger={6} style={{ position: 'absolute', left: 156, top: 272, width: 860, ...displayFace(p.font), fontSize: 88, letterSpacing: '-0.035em', lineHeight: 1 }} />

        {frame >= HIT - 8 && (
          <div style={{ position: 'absolute', left: 150, top: headTop, width: 900, height: headSize * 1.3 }}>
            <div style={{ ...headStyle, color: p.accent2, translate: `${off}px ${off * 0.55}px`, opacity: prog(frame, HIT - 8, 10) * 0.95, mixBlendMode: dark ? 'screen' : 'multiply' }}>{p.headline}</div>
            <SweepReveal frame={frame} start={HIT - 6} dur={26} style={{ position: 'absolute', inset: 0 }}>
              <div style={{ ...headStyle, color: dark ? p.textColor : p.accent }}>{p.headline}</div>
            </SweepReveal>
            <Glint frame={frame} start={CTA + 40} dur={44} style={{ position: 'absolute', inset: 0 }}>
              <div style={headStyle}>{p.headline}</div>
            </Glint>
          </div>
        )}

        {/* Features on the beats of bar 3 */}
        {features.map((f, i) => {
          const at = FEAT + i * T.beat;
          const t = prog(frame, at, 24);
          return (
            <div key={i} style={{ position: 'absolute', left: 156, top: headTop + headSize * 1.15 + 18 + i * 78, display: 'flex', alignItems: 'baseline', gap: 22, opacity: clamp(t * 1.4), translate: `${mix(-30, 0, t)}px 0`, filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined }}>
              <span style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 54, color: p.accent2, rotate: '-6deg', display: 'inline-block', width: 52 }}>{`0${i + 1}`}</span>
              <span style={{ fontSize: 46, fontWeight: 500, whiteSpace: 'nowrap', opacity: 0.92 }}>{f}</span>
            </div>
          );
        })}

        {/* CTA on bar 4 */}
        <div style={{ position: 'absolute', left: 156, top: 906, display: 'flex', alignItems: 'center', gap: 34 }}>
          <div style={{ fontWeight: 800, fontSize: 44, padding: '20px 44px', borderRadius: 999, color: dark ? p.background : '#FFFFFF', background: p.textColor, boxShadow: `8px 8px 0 ${p.accent2}`, whiteSpace: 'nowrap', scale: String(ctaT), opacity: clamp(prog(frame, CTA, 10)) }}>
            {p.cta} →
          </div>
          <div style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 56, color: eyebrowColor, rotate: '-5deg', whiteSpace: 'nowrap', opacity: prog(frame, CTA + T.beat, 18), translate: `0 ${mix(16, 0, prog(frame, CTA + T.beat, 24))}px` }}>
            {p.date}
          </div>
        </div>

        <Streaks frame={frame} start={HIT} dur={40} width={W} height={H} direction="out" cx={TV.x + TV.w / 2} cy={TV.y + TV.h / 2} color={p.accent2} highlight={p.pop} count={120} intensity={dark ? 0.9 : 0.5} seed={7} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${((TV.x + TV.w / 2) / W) * 100}% ${((TV.y + TV.h / 2) / H) * 100}%, ${hexA(p.paper, flash * 0.45)} 0%, ${hexA(p.accent2, flash * 0.3)} 30%, transparent 62%)`, mixBlendMode: dark ? 'screen' : 'multiply', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
