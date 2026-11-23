import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, clamp, displayFace, ease, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Diesel Swap Promo',
  category: 'promo',
  description:
    'Vertical promo for a diesel-swap offer: the old diesel price slams in and gets struck out, a solar crate drops onto the frame and unfolds its wings, then the new price, a "90 days free" offer card and a hard-shadow CTA land on the beat.',
  tags: ['promo', 'offer', 'story', 'reel', 'solar', 'energy', 'brutalist'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  oldEyebrow: text('Before: eyebrow').default('Your site today'),
  oldLabel: text('Before: word').default('Diesel'),
  oldPrice: text('Before: price').default('$0.42 / kWh'),
  oldNote: text('Before: note').default('+ 2 fuel trucks a week'),
  brand: text('Brand').default('Sparkcrate'),
  newPrice: text('After: price').default('$0.11 / kWh'),
  newNote: text('After: note').default('Solar + 480 kWh storage, one crate'),
  offerEyebrow: text('Offer eyebrow').default('Launch offer · ends Dec 31'),
  offer: text('Offer headline').default('90 days free'),
  offerNote: text('Offer note').default('Then from $3,900/mo. No capex, no fuel contract.'),
  cta: text('Call to action').default('Book a site survey'),
  url: text('URL').default('sparkcrate.energy/swap'),
  ticker: text('Ticker').default('No crane · No electrician · No diesel · Power by 3PM'),
  sitePhoto: image('Site photo (optional)').default(''),
  font: font('Display font').default('anton'),
  background: color().default('#FFFDF2'),
  surface: color('Crate / offer card').default('#FFE45C'),
  ink: color('Ink & shadows').default('#000000'),
  accent: color('Accent (strike, CTA)').default('#FF6B4A'),
  accent2: color('Solar cells').default('#5C8AFF'),
  pop: color('Power-on').default('#00D1A0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  blueprint: { background: '#0F3B8C', surface: '#FFDD00', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', pop: '#FFDD00' },
  lava: { background: '#1A0A06', surface: '#FFB000', ink: '#FFEDE0', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63', font: 'bebas' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#2BB24C' },
  farm: {
    oldEyebrow: 'Your pumps today',
    oldLabel: 'Genset',
    oldPrice: '$1,840 / week',
    oldNote: 'Fuel run every Tuesday',
    newPrice: '$410 / week',
    newNote: 'Irrigation on sun + battery',
    offer: 'First month free',
    offerNote: 'Then from $2,900/mo for a 240 kWh crate.',
    cta: 'Get a farm quote',
  },
};

type P = z.infer<typeof schema>;
const W = video.width;
const H = video.height;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};
/** Text colour that reads on a flat fill. */
const on = (bg: string) => (isDark(bg) ? '#FFFDF2' : '#000000');

// Beat map
const STAMP_OLD = T.beats(1); // DIESEL slams
const PRICE_OLD = T.beats(2);
const STRIKE = T.beats(3);
const DROP = T.bars(1); // crate falls
const LAND = DROP + 14;
const UNFOLD = T.bars(1) + T.beats(1);
const POWER = T.bars(1) + T.beats(2); // power on, new price
const OFFER = T.bars(2);
const CTA = T.bars(3);
const GLINT = T.bars(4);
const OUT = T.bars(5) - 40;

function Tag({ children, bg, p, size, style }: { children: ReactNode; bg: string; p: P; size: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.5,
        padding: `${size * 0.4}px ${size * 0.75}px`,
        background: bg,
        color: on(bg),
        border: `${Math.max(4, size * 0.12)}px solid ${p.ink}`,
        boxShadow: `${size * 0.28}px ${size * 0.28}px 0 ${p.ink}`,
        fontFamily: FONTS.mono,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Hazard({ p, h, style }: { p: P; h: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: -40,
        right: -40,
        height: h,
        backgroundImage: `repeating-linear-gradient(135deg, ${p.ink} 0 34px, ${p.surface} 34px 68px)`,
        borderTop: `6px solid ${p.ink}`,
        borderBottom: `6px solid ${p.ink}`,
        ...style,
      }}
    />
  );
}

/** The crate, in a 400×260 box. `open` 0 = wings standing up, 1 = unfolded. */
function Crate({ p, frame, open, power }: { p: P; frame: number; open: number; power: number }) {
  const S = 5;
  const ink = '#000000';
  const a = mix(90, 16, open);
  const head = ((frame / 10) % 6) - 1; // charge chase across the four bars
  const Wing = ({ x, rot, ox }: { x: number; rot: number; ox: number }) => (
    <g transform={`rotate(${rot} ${ox} 118)`}>
      <rect x={x} y={90} width={120} height={28} fill="#1B1F2E" stroke={ink} strokeWidth={S} strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 6 + i * 27.5} y={95} width={23} height={18} fill={p.accent2} opacity={0.55 + 0.45 * power} />
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <rect x={150} y={128} width={140} height={92} rx={6} fill={ink} />
      <Wing x={20} rot={a} ox={140} />
      <Wing x={260} rot={-a} ox={260} />
      <rect x={156} y={212} width={30} height={18} fill={ink} />
      <rect x={234} y={212} width={30} height={18} fill={ink} />
      <rect x={140} y={118} width={140} height={94} rx={6} fill={p.surface} stroke={ink} strokeWidth={S} />
      <rect x={140} y={186} width={140} height={12} fill={p.accent} stroke={ink} strokeWidth={S * 0.7} />
      <rect x={154} y={132} width={84} height={34} rx={4} fill={ink} />
      {[0, 1, 2, 3].map((i) => {
        const lit = power * (0.55 + 0.45 * Math.max(0, 1 - Math.abs(head - i)));
        return <rect key={i} x={160 + i * 19.5} y={138} width={14} height={22} rx={2} fill={p.pop} opacity={0.15 + lit * 0.85} />;
      })}
      <circle cx={259} cy={149} r={9} fill={power > 0.5 && Math.floor(frame / 15) % 4 !== 0 ? p.pop : '#555'} stroke={ink} strokeWidth={S * 0.8} />
      {/* power-on sparks */}
      <g stroke={ink} strokeWidth={S * 0.8} strokeLinecap="round" opacity={power}>
        <line x1={210} y1={102} x2={204} y2={84 - power * 6} />
        <line x1={228} y1={104} x2={238} y2={88 - power * 6} />
        <line x1={192} y1={106} x2={176} y2={94 - power * 6} />
      </g>
    </svg>
  );
}

export default function DieselSwapPromo(p: P) {
  const frame = useCurrentFrame();
  const dark = isDark(p.background);
  const disp = displayFace(p.font);
  const inkOnBg = p.ink;

  // ---- global camera: shake on the slams and the landing ----
  const shake = (at: number, amt: number) => {
    const t = frame - at;
    return t >= 0 && t < 18 ? Math.sin(t * 2.3) * amt * (1 - t / 18) : 0;
  };
  const shx = shake(STAMP_OLD, 10) + shake(LAND, 16) + shake(CTA, 8);
  const shy = shake(STAMP_OLD + 1, 8) + shake(LAND + 2, 22);
  const push = mix(1, 1.04, prog(frame, 0, OUT, ease.inOutSoft));

  // ---- scene A: the diesel price ----
  const aOut = prog(frame, DROP - 6, 16, ease.in);
  const word = prog(frame, STAMP_OLD, 12, ease.out);
  const strike = prog(frame, STRIKE, 14, ease.inOutSoft);
  const oldSize = p.oldLabel.length > 7 ? 230 : 300;

  // ---- scene B: the crate ----
  const fall = prog(frame, DROP, LAND - DROP, ease.in);
  const squash = frame >= LAND ? Math.exp(-(frame - LAND) / 8) * Math.sin((frame - LAND) / 2.4) * 0.1 : 0;
  const open = prog(frame, UNFOLD, 34, ease.backOut);
  const power = prog(frame, POWER, 10, ease.out);
  const flash = keys(frame, [POWER - 1, POWER + 3, POWER + 26], [0, 0.75, 0], [ease.out, ease.outSoft]);
  const lift = prog(frame, OFFER, 40, ease.inOut); // crate + title move up for the offer
  const crateW = mix(900, 640, lift);
  const crateY = mix(-700, mix(430, 190, lift), fall);
  const crateX = (W - crateW) / 2;
  const crateH = (crateW * 260) / 400;

  const titleTop = mix(1090, 660, lift);
  const titleIn = prog(frame, POWER, 18, ease.out);
  const priceIn = prog(frame, POWER + 6, 22, ease.backOut);

  // ---- scene C: offer card ----
  const cardIn = prog(frame, OFFER + 10, 30, ease.out);
  const photoIn = prog(frame, OFFER + 24, 30, ease.backOut);

  // ---- scene D: CTA + ticker ----
  const ctaIn = prog(frame, CTA, 18, ease.backOut);
  const tickerIn = prog(frame, CTA + 10, 24, ease.out);
  const glint = keys(frame, [GLINT, GLINT + 8, GLINT + 24], [0, 1, 0]);

  // ---- exit: hazard shutters close ----
  const shut = prog(frame, OUT, 40, ease.inOut);
  const bandIn = prog(frame, 0, 22, ease.out);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.18 : 0.2, size: 40, y: -frame * 0.4, color: dark ? '234,242,255' : '0,0,0', fade: 1.3 }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[]}
        grain={0.04}
        vignette={dark ? 0.4 : 0}
      />

      <AbsoluteFill style={{ translate: `${shx}px ${shy}px`, scale: String(push) }}>
        {/* sun behind the crate: rotating rays, rises on power-on */}
        {frame >= DROP && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {(() => {
              const cx = W * 0.72;
              const cy = crateY + crateH * 0.18 + mix(140, 0, prog(frame, UNFOLD, 50, ease.out));
              const r = 120 * mix(0.6, 1, prog(frame, UNFOLD, 40, ease.backOut));
              return (
                <g opacity={prog(frame, UNFOLD - 6, 20)}>
                  <g transform={`rotate(${frame * 0.35} ${cx} ${cy})`} stroke={p.ink} strokeWidth={12} strokeLinecap="round">
                    {Array.from({ length: 12 }, (_, i) => {
                      const a = (i / 12) * Math.PI * 2;
                      return <line key={i} x1={cx + Math.cos(a) * (r + 34)} y1={cy + Math.sin(a) * (r + 34)} x2={cx + Math.cos(a) * (r + 74)} y2={cy + Math.sin(a) * (r + 74)} />;
                    })}
                  </g>
                  <circle cx={cx} cy={cy} r={r} fill={p.surface} stroke={p.ink} strokeWidth={12} />
                </g>
              );
            })()}
          </svg>
        )}

        {/* ===== Scene A ===== */}
        {frame < DROP + 12 && (
          <div style={{ position: 'absolute', left: 0, width: W, top: 680, translate: `0 ${-aOut * 520}px`, opacity: 1 - aOut, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ opacity: prog(frame, 14, 14), translate: `0 ${mix(30, 0, prog(frame, 14, 20))}px` }}>
              <Tag p={p} bg={dark ? p.background : '#FFFFFF'} size={40}>
                {p.oldEyebrow}
              </Tag>
            </div>
            <div style={{ position: 'relative', marginTop: 40 }}>
              <div
                style={{
                  ...disp,
                  fontSize: oldSize,
                  lineHeight: 0.92,
                  textTransform: 'uppercase',
                  letterSpacing: '0.01em',
                  color: mixHex(inkOnBg, dark ? '#6B7790' : '#9A9A92', strike),
                  scale: String(mix(1.5, 1, word)),
                  opacity: clamp(word * 3),
                  filter: word < 1 ? `blur(${(1 - word) * 12}px)` : undefined,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.oldLabel}
              </div>
              {/* the strike: a thick bar with a hard outline, drawn left to right */}
              <div
                style={{
                  position: 'absolute',
                  left: -40,
                  right: -40,
                  top: '46%',
                  height: 54,
                  background: p.accent,
                  border: `6px solid ${p.ink}`,
                  boxShadow: `10px 10px 0 ${p.ink}`,
                  rotate: '-6deg',
                  transformOrigin: 'left center',
                  scale: `${strike} 1`,
                  opacity: strike > 0 ? 1 : 0,
                }}
              />
            </div>
            <div style={{ marginTop: 50, scale: String(prog(frame, PRICE_OLD, 16, ease.backOut)), opacity: clamp(prog(frame, PRICE_OLD, 8)) }}>
              <Tag p={p} bg={p.ink} size={72} style={{ color: p.background, letterSpacing: '0.04em' }}>
                {p.oldPrice}
              </Tag>
            </div>
            <div style={{ marginTop: 56, fontFamily: FONTS.familjen, fontWeight: 600, fontSize: 48, color: inkOnBg, opacity: prog(frame, PRICE_OLD + 14, 16), translate: `0 ${mix(20, 0, prog(frame, PRICE_OLD + 14, 20))}px` }}>
              {p.oldNote}
            </div>
          </div>
        )}

        {/* ===== Scene B: crate ===== */}
        {frame >= DROP && (
          <>
            {/* ground the crate lands on */}
            <div
              style={{
                position: 'absolute',
                left: 80,
                right: 80,
                top: crateY + crateH * 0.885,
                height: 10,
                borderRadius: 5,
                background: p.ink,
                scale: `${prog(frame, DROP + 4, 16, ease.out)} 1`,
              }}
            />
            {/* landing dust ticks */}
            {frame >= LAND && frame < LAND + 30 && (
              <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
                {[-1, 1].map((s) =>
                  [0, 1, 2].map((i) => {
                    const t = prog(frame, LAND, 24, ease.out);
                    const bx = W / 2 + s * (crateW * 0.32 + t * 90);
                    const by = crateY + crateH * 0.86 - i * 34;
                    return <line key={`${s}${i}`} x1={bx} y1={by} x2={bx + s * (40 + i * 10)} y2={by - 16 + i * 8} stroke={p.ink} strokeWidth={10} strokeLinecap="round" opacity={1 - t} />;
                  }),
                )}
              </svg>
            )}
            <div
              style={{
                position: 'absolute',
                left: crateX,
                top: crateY,
                width: crateW,
                height: crateH,
                transformOrigin: '50% 100%',
                scale: `${1 + squash} ${1 - squash}`,
              }}
            >
              <Crate p={p} frame={frame} open={open} power={power} />
            </div>

            {/* brand + new price */}
            <div style={{ position: 'absolute', left: 0, width: W, top: titleTop, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  ...disp,
                  fontSize: p.brand.length > 11 ? 150 : 190,
                  lineHeight: 0.9,
                  textTransform: 'uppercase',
                  color: inkOnBg,
                  letterSpacing: '0.01em',
                  opacity: clamp(titleIn * 2),
                  translate: `0 ${mix(60, 0, titleIn)}px`,
                  filter: titleIn < 1 ? `blur(${(1 - titleIn) * 10}px)` : undefined,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.brand}
              </div>
              <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 24, scale: String(priceIn), opacity: clamp(priceIn * 3) }}>
                <Tag p={p} bg={p.pop} size={72} style={{ letterSpacing: '0.04em' }}>
                  {p.newPrice}
                </Tag>
              </div>
              <div style={{ marginTop: 40, fontFamily: FONTS.familjen, fontWeight: 600, fontSize: 46, color: inkOnBg, opacity: prog(frame, POWER + 20, 16) * (1 - lift), translate: `0 ${mix(20, 0, prog(frame, POWER + 20, 20))}px` }}>
                {p.newNote}
              </div>
            </div>
          </>
        )}

        {/* ===== Scene C: offer card ===== */}
        {frame >= OFFER && (
          <div
            style={{
              position: 'absolute',
              left: 80,
              width: W - 160 - 18,
              top: 1036,
              translate: `0 ${mix(900, 0, cardIn)}px`,
              rotate: `${mix(6, -1.5, cardIn)}deg`,
            }}
          >
            <div style={{ position: 'absolute', inset: 0, translate: '18px 18px', background: p.ink }} />
            <div style={{ position: 'relative', background: p.surface, border: `7px solid ${p.ink}`, padding: '30px 44px 34px', color: on(p.surface) }}>
              <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{p.offerEyebrow}</div>
              <div style={{ ...disp, fontSize: p.offer.length > 13 ? 128 : 156, lineHeight: 0.95, textTransform: 'uppercase', marginTop: 14, whiteSpace: 'nowrap' }}>{p.offer}</div>
              <div style={{ fontFamily: FONTS.familjen, fontWeight: 600, fontSize: 44, lineHeight: 1.2, marginTop: 14, maxWidth: p.sitePhoto ? 560 : undefined }}>{p.offerNote}</div>
            </div>
          </div>
        )}
        {p.sitePhoto && frame >= OFFER && (
          <div
            style={{
              position: 'absolute',
              right: 70,
              top: 860,
              width: 330,
              height: 250,
              rotate: `${mix(14, 5, photoIn)}deg`,
              scale: String(photoIn),
              background: '#FFFFFF',
              border: `7px solid ${p.ink}`,
              boxShadow: `14px 14px 0 ${p.ink}`,
              padding: 12,
            }}
          >
            <Img src={p.sitePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'contrast(1.1) saturate(1.1)' }} />
            <div style={{ position: 'absolute', left: -20, bottom: -26 }}>
              <Tag p={p} bg={p.pop} size={24}>
                Live site
              </Tag>
            </div>
          </div>
        )}

        {/* ===== Scene D: CTA ===== */}
        {frame >= CTA && (
          <div style={{ position: 'absolute', left: 0, width: W, top: 1470, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', scale: String(mix(1.35, 1, ctaIn)), opacity: clamp(ctaIn * 4) }}>
              <div
                style={{
                  padding: '28px 54px',
                  background: p.accent,
                  color: on(p.accent),
                  border: `7px solid ${p.ink}`,
                  boxShadow: `${mix(0, 14, ctaIn)}px ${mix(0, 14, ctaIn)}px 0 ${p.ink}`,
                  fontFamily: FONTS.familjen,
                  fontWeight: 700,
                  fontSize: 58,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {p.cta} →
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${mix(-20, 110, glint) - 12}%, rgba(255,255,255,0.75) ${mix(-20, 110, glint)}%, transparent ${mix(-20, 110, glint) + 12}%)`, opacity: glint > 0 ? 1 : 0 }} />
              </div>
            </div>
            <div style={{ marginTop: 28, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 38, letterSpacing: '0.06em', color: inkOnBg, opacity: prog(frame, CTA + 12, 16) }}>{p.url}</div>
          </div>
        )}
      </AbsoluteFill>

      {/* ticker band */}
      {frame >= CTA && (
        <div
          style={{
            position: 'absolute',
            left: -20,
            right: -20,
            top: 1736,
            height: 84,
            background: p.ink,
            rotate: '-2deg',
            translate: `${mix(-W, 0, tickerIn)}px 0`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ whiteSpace: 'nowrap', fontFamily: FONTS.mono, fontWeight: 700, fontSize: 40, letterSpacing: '0.12em', textTransform: 'uppercase', color: p.background, translate: `${-((frame * 4) % 1400)}px 0` }}>
            {Array.from({ length: 6 }, () => `${p.ticker}  ●  `).join('')}
          </div>
        </div>
      )}

      {/* hazard tape at the top (and the exit shutters) */}
      <Hazard p={p} h={mix(70, H / 2 + 60, shut)} style={{ top: -6, translate: `${mix(-W, 0, bandIn)}px 0` }} />
      <Hazard p={p} h={mix(0, H / 2 + 60, shut)} style={{ bottom: -6, opacity: shut > 0 ? 1 : 0 }} />
      {/* end card: brand lockup stamped onto the closed shutters */}
      {frame >= OUT + 18 && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ scale: String(mix(1.4, 1, prog(frame, OUT + 18, 14, ease.out))), opacity: clamp(prog(frame, OUT + 18, 6)), rotate: '-3deg' }}>
            <Tag p={p} bg={p.background} size={64} style={{ fontFamily: FONTS.anton, letterSpacing: '0.06em', fontWeight: 400, padding: '18px 44px', fontSize: 110, color: inkOnBg }}>
              {p.brand}
            </Tag>
          </div>
        </div>
      )}

      {/* power-on flash */}
      <AbsoluteFill style={{ background: p.pop, opacity: flash * 0.55, mixBlendMode: dark ? 'screen' : 'multiply' }} />
    </AbsoluteFill>
  );
}

/** Mix two #RRGGBB colours. */
function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(mix((pa >> s) & 255, (pb >> s) & 255, t));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}
