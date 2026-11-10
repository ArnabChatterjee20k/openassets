import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Founding Plan Promo',
  category: 'promo',
  description:
    'Bauhaus promo for a pricing offer: three primaries drop onto a hairline grid on the beat, the circle swells into a vermilion price disc, the offer sweeps in, feature chips pop and 34 channel tiles fill before the CTA lands.',
  tags: ['promo', 'pricing', 'offer', 'saas', 'bauhaus', 'ads'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Formwork · Founding plan'),
  headline: text().default('First month'),
  headlineItalic: text('Headline (italic)').default('on us.'),
  price: text().default('$149'),
  oldPrice: text('Old price (empty to hide)').default('$249'),
  priceNote: text('Price note').default('/mo · for life'),
  chip1: text('Chip 1').default('34 ad platforms'),
  chip2: text('Chip 2').default('Hourly rebalancing'),
  chip3: text('Chip 3').default('Unlimited variants'),
  cta: text('Call to action').default('Claim by Nov 30 → formwork.ai'),
  meterLabel: text('Tile meter label').default('Channels connected'),
  channels: text('Tile count').default('34'),
  background: color().default('#F2EBDD'),
  surface: color('Tiles').default('#E4D9C4'),
  ink: color('Text').default('#111111'),
  accent: color('Circle').default('#D9381E'),
  accent2: color('Square').default('#1D4E9E'),
  pop: color('Triangle').default('#F2B90F'),
  productImage: image('Product screenshot (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', ink: '#0A0A0A', accent: '#E3000F', accent2: '#0A0A0A', pop: '#8C8C88', headline: 'Black Friday', headlineItalic: '40% off.', price: '$89', oldPrice: '$149', cta: 'Ends Dec 1 → formwork.ai' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', accent: '#C9A45C', accent2: '#6E6A62', pop: '#E8D9B5', eyebrow: 'Formwork · Agency plan', headline: 'Every client,', headlineItalic: 'one agent.', price: '$990', oldPrice: '', priceNote: '/mo · 10 brands' },
  terracotta: { background: '#F1E4D3', surface: '#E5CDB2', ink: '#3B1F14', accent: '#C8553D', accent2: '#4F6D58', pop: '#F2A541' },
  riso: { background: '#F4EFE6', surface: '#EAE2D3', ink: '#1F2A6B', accent: '#FF48B0', accent2: '#0078BF', pop: '#FFE800' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const HIT = T.bars(1); // downbeat of bar 2

export default function FoundingPlanPromo(p: P) {
  const frame = useCurrentFrame();
  const W = video.width;
  const H = video.height;
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const blend = dark ? 'screen' : 'multiply';
  const hasImg = !!p.productImage;

  // camera: slow push, small shake on the hit
  const push = mix(1, 1.045, prog(frame, 0, end, ease.inOutSoft));
  const shake = frame >= HIT && frame < HIT + 18 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 18) * 7 : 0;
  const exit = prog(frame, end - 30, 30, ease.in);

  // primaries: drop onto the grid on beats 1-3 of bar 1, then move to their poster positions on the hit
  const move = prog(frame, HIT, 34, ease.inOut);
  const drop = (at: number) => prog(frame, at, 22, ease.backOut);
  const dC = drop(T.beats(0.5) - 4);
  const dS = drop(T.beats(1.5) - 4);
  const dT = drop(T.beats(2.5) - 4);

  const cR = mix(92, 410, move);
  const cX = mix(660, 560, move);
  const cY = mix(540, 540, move) + (1 - dC) * -60;
  const sqS = mix(170, 210, move);
  const sqX = mix(960, 940, move);
  const sqY = mix(540, 880, move) + (1 - dS) * -60;
  const triS = mix(190, 150, move);
  const triX = mix(1260, 990, move) + exit * 300;
  const triY = mix(540, 175, move) + (1 - dT) * -60;

  // shockwave ring outside the circle on the hit
  const ring = prog(frame, HIT + 6, 50, ease.out);

  // right column layout
  const colX = 1090;
  const imgTop = 96;
  const top = hasImg ? 386 : 236;
  const HEAD = 150;
  const chipsY = top + 70 + HEAD * 2 + 26;
  const ctaY = chipsY + 150;
  const count = Math.max(1, Math.min(48, parseInt(p.channels, 10) || 34));
  const fill = prog(frame, T.bars(2), T.beats(3), ease.inOutSoft) * count;

  const headStyle = { ...displayFace('instrument', { italic: false }), fontSize: HEAD, lineHeight: 0.95, letterSpacing: '-0.025em', whiteSpace: 'nowrap' as const };
  const headBlock = { position: 'absolute' as const, left: colX, top: top + 66, ...headStyle };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 40, y: -frame * 0.15, color: dark ? '255,255,255' : '17,17,17' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={dark ? [{ x: cX, y: cY, size: 1400, color: hexA(p.accent, 0.3), opacity: 0.6 + 0.2 * Math.sin(frame / 40) }] : []}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - exit * 0.9 }}>
        {/* hairline 12-column grid draws in */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          {Array.from({ length: 13 }, (_, i) => {
            const x = 80 + i * ((W - 160) / 12);
            const t = prog(frame, i * 2, 30, ease.out);
            return <line key={`v${i}`} x1={x} y1={H / 2 - (H / 2) * t} x2={x} y2={H / 2 + (H / 2) * t} stroke={p.ink} strokeOpacity={0.2} strokeWidth={1} />;
          })}
          {[120, 540, 960].map((y, i) => {
            const t = prog(frame, 6 + i * 4, 34, ease.out);
            return <line key={`h${i}`} x1={W / 2 - (W / 2) * t} y1={y} x2={W / 2 + (W / 2) * t} y2={y} stroke={p.ink} strokeOpacity={0.14} strokeWidth={1} />;
          })}
        </svg>

        {/* folio + Nº counter, top-left / top-right */}
        <div style={{ position: 'absolute', left: 80, top: 62, fontFamily: FONTS.spacemono, fontSize: 28, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: prog(frame, 8, 24) }}>Formwork / Promo</div>
        <div style={{ position: 'absolute', right: 80, top: 62, fontFamily: FONTS.spacemono, fontSize: 28, letterSpacing: '0.3em', opacity: prog(frame, 14, 24) }}>
          Nº {String(Math.round(mix(1, count, prog(frame, 0, HIT, ease.inOutSoft)))).padStart(2, '0')}
        </div>

        {/* shockwave hairline */}
        {frame >= HIT && <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}><circle cx={cX} cy={cY} r={cR + 20 + ring * 420} fill="none" stroke={p.ink} strokeWidth={mix(3, 0.5, ring)} opacity={(1 - ring) * 0.6} /></svg>}

        {/* vermilion circle (offset ink shadow = print misregistration) */}
        <div style={{ position: 'absolute', left: cX - cR + cR * 0.045, top: cY - cR + cR * 0.045, width: cR * 2, height: cR * 2, borderRadius: '50%', border: `2px solid ${p.ink}`, scale: String(dC), opacity: dark ? 0.4 : 0.9 }} />
        <div style={{ position: 'absolute', left: cX - cR, top: cY - cR, width: cR * 2, height: cR * 2, borderRadius: '50%', background: p.accent, scale: String(dC * (1 + Math.sin(frame / 36) * 0.006)) }} />

        {/* cobalt square overprints the circle */}
        <div style={{ position: 'absolute', left: sqX - sqS / 2, top: sqY - sqS / 2, width: sqS, height: sqS, background: p.accent2, mixBlendMode: blend, rotate: `${mix(0, -8, move) + Math.sin(frame / 50) * 1.2}deg`, scale: String(dS), translate: `${-exit * 300}px 0` }} />

        {/* yellow triangle */}
        <svg style={{ position: 'absolute', left: triX - triS / 2, top: triY - triS / 2, width: triS, height: triS, overflow: 'visible', scale: String(dT), rotate: `${mix(0, 12, move) + Math.sin(frame / 44) * 2}deg` }} viewBox="0 0 100 100">
          <polygon points="50,6 96,92 4,92" fill={p.pop} style={{ mixBlendMode: blend }} />
        </svg>

        {/* price inside the disc */}
        {frame >= HIT && (
          <div style={{ position: 'absolute', left: cX - 400, width: 800, top: cY - 210, textAlign: 'center', color: p.background }}>
            {p.oldPrice && (
              <div style={{ fontFamily: FONTS.spacemono, fontSize: 46, letterSpacing: '0.1em', opacity: prog(frame, HIT + 16, 20), position: 'relative', display: 'inline-block' }}>
                {p.oldPrice}
                <span style={{ position: 'absolute', left: -8, right: -8, top: '52%', height: 4, background: p.background, transformOrigin: 'left', scale: `${prog(frame, HIT + 30, 16, ease.inOut)} 1` }} />
              </div>
            )}
            <SweepReveal frame={frame} start={HIT + 10} dur={30} style={{ ...displayFace('instrument', { italic: false }), fontSize: p.price.length > 5 ? 200 : 260, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {p.price}
            </SweepReveal>
            <div style={{ fontFamily: FONTS.spacemono, fontSize: 44, letterSpacing: '0.06em', opacity: prog(frame, HIT + 26, 20), translate: `0 ${mix(16, 0, prog(frame, HIT + 26, 24))}px` }}>{p.priceNote}</div>
          </div>
        )}

        {/* optional product screenshot in a framed card */}
        {hasImg && (
          <div
            style={{
              position: 'absolute',
              left: colX,
              top: imgTop,
              width: 480,
              height: 256,
              background: p.surface,
              border: `2px solid ${p.ink}`,
              boxShadow: `14px 14px 0 ${p.ink}`,
              overflow: 'hidden',
              opacity: prog(frame, HIT + 4, 24),
              translate: `0 ${mix(40, 0, prog(frame, HIT + 4, 36)) + Math.sin(frame / 34) * 5}px`,
              rotate: `${mix(-4, -1.5, prog(frame, HIT + 4, 40))}deg`,
            }}
          >
            <Img src={p.productImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* eyebrow */}
        <div style={{ position: 'absolute', left: colX, top, display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONTS.spacemono, fontSize: 30, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: prog(frame, HIT + 4, 20), translate: `${mix(-20, 0, prog(frame, HIT + 4, 26))}px 0` }}>
          <span style={{ width: 54 * prog(frame, HIT + 4, 26), height: 2, background: p.accent }} />
          {p.eyebrow}
        </div>

        {/* headline: roman line + italic line in the accent */}
        {frame >= HIT && (
          <>
            <SweepReveal frame={frame} start={HIT + 8} dur={32} style={headBlock}>
              {p.headline}
              <br />
              <span style={{ ...displayFace('instrument', { italic: true }), color: p.accent }}>{p.headlineItalic}</span>
            </SweepReveal>
            <Glint frame={frame} start={T.bars(3) + 30} dur={44} style={headBlock}>
              {p.headline}
              <br />
              <span style={{ fontStyle: 'italic' }}>{p.headlineItalic}</span>
            </Glint>
          </>
        )}

        {/* feature chips pop on the beats of bar 3 */}
        <div style={{ position: 'absolute', left: colX, top: chipsY, width: W - colX - 80, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[p.chip1, p.chip2, p.chip3].filter(Boolean).map((c, i) => {
            const t = prog(frame, T.bars(2) + T.beats(i), 22, ease.backOut);
            return (
              <div key={i} style={{ padding: '10px 20px', border: `2px solid ${p.ink}`, background: i === 0 ? p.ink : 'transparent', color: i === 0 ? p.background : p.ink, fontSize: 32, fontWeight: 500, whiteSpace: 'nowrap', scale: String(t), opacity: clamp(t * 2), transformOrigin: 'left center' }}>
                {c}
              </div>
            );
          })}
        </div>

        {/* CTA lands on the downbeat of bar 4 */}
        <div style={{ position: 'absolute', left: colX, top: ctaY, display: 'flex' }}>
          <div
            style={{
              padding: '22px 34px',
              background: p.accent,
              color: dark ? p.ink : '#FBF7EE',
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              boxShadow: `10px 10px 0 ${p.ink}`,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, T.bars(3), 24, ease.backOut)),
              opacity: clamp(prog(frame, T.bars(3), 8) * 1.5),
            }}
          >
            {p.cta}
          </div>
        </div>

        {/* 34-tile channel meter along the bottom */}
        {!hasImg && (
          <div style={{ position: 'absolute', left: colX, top: 938, width: W - colX - 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.spacemono, fontSize: 24, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12, opacity: prog(frame, T.bars(2), 20) }}>
              <span>{p.meterLabel}</span>
              <span>{String(Math.floor(fill)).padStart(2, '0')} / {count}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: count }, (_, i) => {
                const on = clamp(fill - i);
                const c = [p.accent, p.accent2, p.pop][Math.floor(rand(i * 3.3) * 3)];
                return <div key={i} style={{ flex: 1, height: 26, background: on > 0 ? c : p.surface, opacity: on > 0 ? 0.35 + on * 0.65 : 1, border: `1px solid ${hexA(p.ink, 0.18)}`, scale: `1 ${0.4 + on * 0.6}` }} />;
              })}
            </div>
          </div>
        )}

        {/* bar-1 caption under the primaries */}
        <WordsIn
          text="One brief. Every channel."
          frame={frame}
          start={T.beats(1)}
          stagger={8}
          style={{ position: 'absolute', width: W, top: 690, justifyContent: 'center', ...displayFace('instrument', { italic: true }), fontSize: 84, opacity: 1 - prog(frame, HIT - 8, 12, ease.in) }}
        />
      </AbsoluteFill>
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
