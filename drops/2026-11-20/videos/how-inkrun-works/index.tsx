import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'How Inkrun Works',
  category: 'tech',
  description:
    'Three-step product explainer for an AI ad agent: a brief types itself, a squeegee pulls it into a 31-platform grid that snaps into register, stats count up on the beat, then the wordmark and CTA land.',
  tags: ['tech', 'explainer', 'saas', 'ads', 'agent', 'how it works'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30f, bar = 120f
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

const PLATFORMS =
  'Google, YouTube, Meta, Instagram, TikTok, LinkedIn, X, Reddit, Snapchat, Pinterest, Microsoft, Amazon, Apple Search, Spotify, Quora, Taboola, Outbrain, Trade Desk, DV360, Roku, Hulu, Twitch, Discord, Nextdoor, Threads, StackAdapt, AdRoll, Criteo, Yahoo DSP, Waze, Tubi';

export const schema = z.object({
  eyebrow: text('Eyebrow (handwritten)').default('how Inkrun works'),
  step1: text('Step 1 title').default('Write one brief'),
  brief: textarea('Brief text').default('Launch the Night Market sale to Gen Z in LA + NYC. $12k a month, Dec 1–24. Keep it playful.'),
  step2: text('Step 2 title').default('Printed for 31 platforms'),
  platforms: textarea('Platforms (comma separated)').default(PLATFORMS),
  step3: text('Step 3 title').default('The agent tunes spend, 24/7'),
  stat1: text('Stat 1 value').default('4.2×'),
  stat1Label: text('Stat 1 label').default('ROAS'),
  stat2: text('Stat 2 value').default('−38%'),
  stat2Label: text('Stat 2 label').default('cost per acquisition'),
  stat3: text('Stat 3 value').default('31'),
  stat3Label: text('Stat 3 label').default('platforms live'),
  product: text('Product name').default('Inkrun'),
  tagline: text().default('Your AI ad agent, on every platform at once.'),
  cta: text('Call to action').default('Start free  ·  inkrun.ai'),
  font: font('Display font').default('fraunces'),
  background: color().default('#12001F'),
  paper: color('Paper').default('#FBEFFF'),
  accent: color('Ink 1').default('#B026FF'),
  accent2: color('Ink 2').default('#FF2E88'),
  pop: color('Highlighter').default('#FFD600'),
  textColor: color('Text').default('#FBEFFF'),
  productImage: image('Product shot in the brief (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  risograph: { background: '#F4EFE6', paper: '#FFFFFF', accent: '#0078BF', accent2: '#FF48B0', pop: '#FFE800', textColor: '#1F2A6B' },
  lava: { background: '#1A0A06', paper: '#FFEDE0', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63', textColor: '#FFEDE0' },
  agency: { font: 'dmserif', background: '#0D0D0F', paper: '#F3EDE2', accent: '#C9A45C', accent2: '#6E6A62', pop: '#E8D9B5', textColor: '#F3EDE2', brief: 'Fall/Winter lookbook for Atelier Nord. $40k across EU, Nov 18 – Dec 31. Quiet luxury.', stat1: '6.8×', stat2: '−52%' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

// Beat map
const B1 = 0; // brief
const B2 = T.bars(1); // squeegee pull → grid
const REG = B2 + T.beats(2); // grid snaps into register
const B3 = T.bars(2); // stats
const B4 = T.bars(3); // wordmark
const B5 = T.bars(4); // glint + hold
const END = video.durationInFrames;

const COLS = 8;
const ROWS = 4;
const TW = 200;
const TH = 128;
const GAP = 16;

/** Step label: handwritten number + title, top-left. */
function Step({ n, title, frame, from, to, p }: { n: string; title: string; frame: number; from: number; to: number; p: P }) {
  const a = prog(frame, from, 22) * (1 - prog(frame, to - 14, 14, ease.in));
  if (a <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 160, top: 110, display: 'flex', alignItems: 'baseline', gap: 26, opacity: a, translate: `${mix(-30, 0, prog(frame, from, 26))}px 0` }}>
      <span style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 84, color: p.accent2, rotate: '-6deg', display: 'inline-block' }}>{n}</span>
      <span style={{ ...displayFace(p.font), fontSize: 84, letterSpacing: '-0.035em', color: p.textColor }}>{title}</span>
    </div>
  );
}

function Tile({ i, name, frame, sweepX, p, ink }: { i: number; name: string; frame: number; sweepX: number; p: P; ink: string }) {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const x = (1920 - (COLS * TW + (COLS - 1) * GAP)) / 2 + c * (TW + GAP);
  const y = 290 + r * (TH + GAP);
  const shown = clamp((sweepX - x) / 160);
  if (shown <= 0) return null;
  // Out of register until REG, then snap (small residual offset is the house style).
  const snap = prog(frame, REG + (c + r) * 1.5, 16, ease.backOut);
  const off = mix(22, 3, snap);
  const formats = [9 / 16, 4 / 5, 1, 16 / 9, 2 / 3];
  const ar = formats[(i * 7) % formats.length];
  const sh = 52;
  const sw = Math.min(sh * ar, 80);
  const last = i === COLS * ROWS - 1;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: TW, height: TH, opacity: shown, translate: `0 ${mix(18, 0, shown)}px`, borderRadius: 10, background: last ? p.pop : p.paper, overflow: 'hidden', boxShadow: `0 10px 30px rgba(0,0,0,0.35)` }}>
      {last ? (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 64, color: '#12001F', rotate: '-6deg' }}>31/31</div>
      ) : (
        <>
          <div style={{ position: 'absolute', left: 16 + off, top: 16 + off * 0.6, width: sw, height: sh * (sw / (sh * ar)), borderRadius: 4, background: p.accent2, mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', left: 16, top: 16, width: sw, height: sh * (sw / (sh * ar)), borderRadius: 4, background: p.accent, mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', left: 16, bottom: 12, right: 10, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 30, color: ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ position: 'absolute', right: 12, top: 12, width: 12, height: 12, borderRadius: 6, background: frame > REG + 20 ? '#2BD67B' : hexA(ink, 0.2) }} />
        </>
      )}
    </div>
  );
}

function Stat({ value, label, frame, at, x, p }: { value: string; label: string; frame: number; at: number; x: number; p: P }) {
  const t = prog(frame, at, 26, ease.backOut);
  const out = prog(frame, B4 - 16, 16, ease.in);
  const count = prog(frame, at, 40, ease.out);
  // Count up the numeric part, keep prefix/suffix.
  const m = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  const shown = m ? `${m[1]}${(parseFloat(m[2]) * count).toFixed(m[2].includes('.') ? 1 : 0)}${m[3]}` : value;
  return (
    <div style={{ position: 'absolute', left: x - 255, top: 380, width: 510, height: 340, opacity: clamp(t * 1.5) * (1 - out), scale: String(mix(0.85, 1, t)), borderRadius: 28, background: hexA(p.paper, isDark(p.background) ? 0.06 : 0.75), border: `2px solid ${hexA(p.paper, 0.16)}`, backdropFilter: 'blur(18px)', boxShadow: `12px 12px 0 ${hexA(p.accent, 0.85)}` }}>
      <div style={{ position: 'absolute', left: 44, top: 40, ...displayFace(p.font), fontSize: shown.length > 4 ? 120 : 144, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '-0.04em', color: p.textColor, textShadow: `5px 4px 0 ${hexA(p.accent2, 0.85)}` }}>{shown}</div>
      <div style={{ position: 'absolute', left: 48, bottom: 48, fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 44, color: p.textColor, opacity: 0.85 }}>{label}</div>
    </div>
  );
}

export default function HowInkrunWorks(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const ink = dark ? '#1A0830' : p.textColor;
  const names = p.platforms.split(',').map((s) => s.trim()).filter(Boolean);

  // Squeegee pull across the screen on the bar-2 downbeat.
  const pull = prog(frame, B2 - 6, 40, ease.inOut);
  const sweepX = mix(-240, W + 260, pull);
  const pullOn = frame >= B2 - 6 && frame <= B2 + 40;

  const flash = keys(frame, [REG - 2, REG + 2, REG + 24], [0, 1, 0], [ease.out, ease.outSoft]) * 0.8 + keys(frame, [B4 - 2, B4 + 2, B4 + 28], [0, 1, 0], [ease.out, ease.outSoft]);
  const push = mix(1, 1.04, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 36, 36, ease.inOut);

  // Brief card
  const cardIn = prog(frame, B1 + 6, 30);
  // The blade catches the card's left edge and shoves it off to the right.
  const cardLeft = (W - (p.productImage ? 1320 : 1160)) / 2;
  const shove = Math.max(0, sweepX + 18 - cardLeft);
  const cardOut = clamp(shove / 700);
  const typedN = Math.floor(clamp((frame - 30) / 66) * p.brief.length);
  const hasImg = !!p.productImage;
  const cardW = hasImg ? 1320 : 1160;

  // Grid recedes behind the stats, leaves before the wordmark.
  const gridDim = prog(frame, B3 - 8, 24, ease.inOut);
  const gridGone = prog(frame, B4 - 20, 20, ease.in);

  // Wordmark
  const wmSnap = prog(frame, B4, 18, ease.backOut);
  const wmOff = mix(30, 4, wmSnap);
  const WM = p.product.length > 9 ? 220 : 300;
  const wmStyle = { position: 'absolute' as const, left: 0, width: W, top: 300, textAlign: 'center' as const, ...displayFace(p.font), fontSize: WM, lineHeight: 1, letterSpacing: '-0.045em', whiteSpace: 'nowrap' as const };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.09 : 0.14, size: 30, y: -frame * 0.15, color: dark ? '251,239,255' : '31,42,107' }}
        glows={[
          { x: W * 0.3, y: H * 0.3, size: 1500, color: hexA(p.accent, dark ? 0.4 : 0.22), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: W * 0.8, y: H * 0.85, size: 1300, color: hexA(p.accent2, dark ? 0.3 : 0.18), opacity: 0.6 + 0.2 * Math.sin(frame / 53) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={50} color={p.accent2} seed={9} opacity={dark ? 0.35 : 0.25} />

        {/* Handwritten eyebrow */}
        <div style={{ position: 'absolute', right: 160, top: 120, fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 56, color: p.pop === '#FFE800' && !dark ? p.accent2 : p.pop, rotate: '-4deg', opacity: prog(frame, 10, 24) * (1 - prog(frame, B2 + 10, 16)) }}>{p.eyebrow}</div>

        <Step n="01" title={p.step1} frame={frame} from={8} to={B2 + 10} p={p} />
        <Step n="02" title={p.step2} frame={frame} from={B2 + 24} to={B3} p={p} />
        <Step n="03" title={p.step3} frame={frame} from={B3 + 4} to={B4} p={p} />

        {/* ── Bar 1: the brief ── */}
        {cardOut < 1 && (
          <div
            style={{
              position: 'absolute',
              left: (W - cardW) / 2,
              top: 330,
              width: cardW,
              height: 440,
              borderRadius: 32,
              background: p.paper,
              color: ink,
              opacity: cardIn * (1 - cardOut),
              translate: `${shove}px ${mix(50, 0, cardIn)}px`,
              rotate: `${mix(-2, 0, cardIn) + cardOut * 4}deg`,
              filter: cardIn < 1 ? `blur(${(1 - cardIn) * 12}px)` : undefined,
              boxShadow: `16px 16px 0 ${p.accent}, 0 40px 100px rgba(0,0,0,0.45)`,
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', left: 56, top: 44, display: 'flex', gap: 18, alignItems: 'center' }}>
              <span style={{ padding: '8px 22px', borderRadius: 999, background: p.accent, color: '#FFFFFF', fontWeight: 800, fontSize: 30 }}>Brief</span>
              <span style={{ fontSize: 30, opacity: 0.6 }}>to: {p.product} agent</span>
            </div>
            <div style={{ position: 'absolute', left: 56, top: 128, width: hasImg ? 820 : cardW - 112, fontSize: 54, lineHeight: 1.25, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {p.brief.slice(0, typedN)}
              <span style={{ display: 'inline-block', width: 4, height: 56, marginLeft: 4, verticalAlign: 'text-bottom', background: p.accent2, opacity: Math.floor(frame / 15) % 2 ? 1 : 0.15 }} />
            </div>
            {hasImg && <Img src={p.productImage} style={{ position: 'absolute', right: 48, top: 48, width: 360, height: 344, objectFit: 'cover', borderRadius: 20 }} />}
            <div style={{ position: 'absolute', right: hasImg ? 440 : 56, bottom: 40, fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 48, color: p.accent2, rotate: '-5deg', opacity: prog(frame, 96, 16) }}>send ↵</div>
          </div>
        )}

        {/* ── Bar 2: the 31-tile grid, printed by the pull ── */}
        {frame >= B2 - 6 && gridGone < 1 && (
          <div style={{ position: 'absolute', inset: 0, opacity: mix(1, 0.22, gridDim) * (1 - gridGone), filter: gridDim > 0 ? `blur(${gridDim * 6}px)` : undefined, scale: String(mix(1, 0.94, gridDim)) }}>
            {Array.from({ length: COLS * ROWS }, (_, i) => (
              <Tile key={i} i={i} name={names[i] ?? ''} frame={frame} sweepX={sweepX} p={p} ink={ink} />
            ))}
          </div>
        )}

        {/* Squeegee blade + ink wash */}
        {pullOn && (
          <>
            <div style={{ position: 'absolute', top: -40, bottom: -40, left: sweepX - 420, width: 420, background: `linear-gradient(90deg, transparent, ${hexA(p.accent2, 0.25)} 70%, ${hexA(p.accent, 0.6)})`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
            <div style={{ position: 'absolute', top: -40, bottom: -40, left: sweepX - 18, width: 36, borderRadius: 18, background: `linear-gradient(90deg, ${p.accent}, ${p.accent2})`, boxShadow: `0 0 60px ${hexA(p.accent2, 0.7)}`, rotate: '4deg' }} />
          </>
        )}

        {/* ── Bar 3: stats on the beats ── */}
        <Stat value={p.stat1} label={p.stat1Label} frame={frame} at={B3} x={W / 2 - 580} p={p} />
        <Stat value={p.stat2} label={p.stat2Label} frame={frame} at={B3 + T.beat} x={W / 2} p={p} />
        <Stat value={p.stat3} label={p.stat3Label} frame={frame} at={B3 + T.beats(2)} x={W / 2 + 580} p={p} />

        {/* ── Bar 4: wordmark with a pink pass that snaps into register ── */}
        {frame >= B4 - 4 && (
          <>
            <div style={{ ...wmStyle, color: p.accent2, translate: `${wmOff}px ${wmOff * 0.6}px`, opacity: prog(frame, B4 - 4, 10) * 0.9, mixBlendMode: dark ? 'screen' : 'multiply' }}>{p.product}</div>
            <SweepReveal frame={frame} start={B4} dur={30} style={wmStyle}>
              <span style={{ color: p.textColor }}>{p.product}</span>
            </SweepReveal>
            <Glint frame={frame} start={B5} dur={46} style={wmStyle}>
              {p.product}
            </Glint>
            <div style={{ position: 'absolute', left: W / 2 + WM * p.product.length * 0.26, top: 270, fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 64, color: p.pop === '#FFE800' && !dark ? p.accent2 : p.pop, rotate: '-10deg', opacity: prog(frame, B4 + 16, 14), scale: String(prog(frame, B4 + 16, 22, ease.backOut)) }}>31/31</div>
            {/* Platform marquee keeps the hold alive */}
            <div style={{ position: 'absolute', left: 0, top: 940, width: W, overflow: 'hidden', opacity: prog(frame, B4 + 40, 30) * 0.55 }}>
              <div style={{ whiteSpace: 'nowrap', fontWeight: 500, fontSize: 40, letterSpacing: '0.02em', translate: `${-(frame - B4) * 2.2}px 0` }}>
                {[...names, ...names].map((n, i) => (
                  <span key={i}>
                    {n}
                    <span style={{ color: i % 2 ? p.accent2 : p.accent, margin: '0 26px' }}>●</span>
                  </span>
                ))}
              </div>
            </div>
            <WordsIn text={p.tagline} frame={frame} start={B4 + 24} style={{ position: 'absolute', width: W, top: 300 + WM * 1.08, justifyContent: 'center', fontSize: 56, fontWeight: 500, opacity: 0.9 }} />
            <div style={{ position: 'absolute', width: W, top: 300 + WM * 1.08 + 120, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 46,
                  padding: '22px 46px',
                  borderRadius: 999,
                  color: dark ? p.background : '#FFFFFF',
                  background: p.textColor,
                  boxShadow: `8px 8px 0 ${p.accent2}`,
                  whiteSpace: 'pre',
                  scale: String(prog(frame, B4 + T.beats(2), 26, ease.backOut)),
                  opacity: clamp(prog(frame, B4 + T.beats(2), 10)),
                }}
              >
                {p.cta}
              </div>
            </div>
          </>
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${hexA(p.paper, flash * 0.5)} 0%, ${hexA(p.accent2, flash * 0.35)} 30%, transparent 65%)`, mixBlendMode: dark ? 'screen' : 'multiply', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
