import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Order Thank You',
  category: 'thank-you',
  description:
    'Post-purchase story: HUD brackets lock on, a parcel drops and lands on the beat, the customer’s name sweeps in with a ribbon-confetti burst, then the order chip and a comeback coupon.',
  tags: ['thank you', 'order', 'e-commerce', 'story', 'vertical', 'coupon', 'customer'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30f, bar = 120f
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('order confirmed'),
  greeting: text().default('Thank you,'),
  name: text('Customer name').default('Maya!'),
  message: textarea().default('Your 11.11 haul is packed with care and on its way.'),
  orderId: text('Order number').default('#MM-24811'),
  status: text('Order status').default('ships in 24h'),
  couponCode: text('Coupon code').default('COMEBACK15'),
  couponText: text('Coupon line').default('15% off your next order'),
  brand: text().default('mochimode.shop'),
  photo: image('Product photo (optional)').default(''),
  font: font('Name font').default('chakra'),
  background: color().default('#FDF3F8'),
  surface: color().default('#F7DDEB'),
  textColor: color('Text').default('#3A1F4A'),
  accent: color().default('#FF7EB6'),
  accent2: color('HUD / ribbon').default('#8A7BFF'),
  pop: color('Spark').default('#4FD1C5'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lilac: { background: '#E9E3F5', surface: '#D6CCEC', textColor: '#231942', accent: '#F49CBB', accent2: '#5E4AE3', pop: '#2EC4B6' },
  'night drop': { background: '#12001F', surface: '#24003D', textColor: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', name: 'Jun!', orderId: '#MM-30927' },
  memphis: { font: 'fredoka', background: '#FFF6E9', surface: '#FFE3D3', textColor: '#1A1A2E', accent: '#FF6F91', accent2: '#00B3A4', pop: '#FFC93C', greeting: 'Thanks a bunch,', name: 'Priya!' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** One HUD corner tick, snapping in from further out. */
function Corner({ x, y, sx, sy, k, t, c, w }: { x: number; y: number; sx: 1 | -1; sy: 1 | -1; k: number; t: number; c: string; w: number }) {
  const o = (1 - t) * 60;
  return (
    <path
      d={`M${x - sx * o},${y - sy * o + sy * k} V${y - sy * o} H${x - sx * o + sx * k}`}
      fill="none"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="square"
      opacity={clamp(t * 2)}
    />
  );
}

/** Isometric cardboard parcel in candy colours, with ribbon tape and a shipping label. */
function Parcel({ size, p }: { size: number; p: P }) {
  const s = size / 400;
  const top = '200,40 360,120 200,200 40,120';
  const left = '40,120 200,200 200,370 40,290';
  const right = '200,200 360,120 360,290 200,370';
  const ink = p.textColor;
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" style={{ overflow: 'visible' }}>
      <ellipse cx={200} cy={380} rx={170 * (1 / Math.max(0.6, s))} ry={26} fill={ink} opacity={0.12} />
      <g stroke={ink} strokeWidth={5} strokeLinejoin="round">
        <polygon points={left} fill={p.accent} />
        <polygon points={right} fill={mixHex(p.accent, '#000000', 0.12)} />
        <polygon points={top} fill={mixHex(p.accent, '#FFFFFF', 0.35)} />
      </g>
      {/* ribbon tape: across the top and down both faces */}
      <g fill={p.accent2} stroke={ink} strokeWidth={4} strokeLinejoin="round">
        <polygon points="104,72 136,56 296,136 264,152" />
        <polygon points="264,152 296,136 296,322 264,338" opacity={0.92} />
        <polygon points="104,152 136,168 136,338 104,322" />
      </g>
      {/* shipping label on the left face */}
      <g transform="matrix(1 0.5 0 1 0 0)">
        <rect x={150} y={150} width={44} height={70} rx={4} fill={p.background} stroke={ink} strokeWidth={3} />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={156 + i * 5} y={190} width={i % 3 === 0 ? 3 : 1.6} height={22} fill={ink} />
        ))}
        <rect x={156} y={160} width={30} height={4} fill={ink} opacity={0.6} />
        <rect x={156} y={170} width={22} height={4} fill={ink} opacity={0.4} />
      </g>
      {/* a little heart sticker on the right face */}
      <g transform="matrix(1 -0.5 0 1 0 0)">
        <path d="M318,388 c-8,-10 -22,-2 -14,10 l14,14 l14,-14 c8,-12 -6,-20 -14,-10 z" fill={p.pop} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      </g>
      {/* gloss on the top face */}
      <polygon points="200,58 320,118 300,128 186,68" fill="#FFFFFF" opacity={0.35} />
    </svg>
  );
}

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};

/** Ribbon + tag confetti fired upward from (x, y): drag + terminal velocity so pieces hang and drift. */
function Burst({ frame, at, x, y, count, colors, seed }: { frame: number; at: number; x: number; y: number; count: number; colors: string[]; seed: number }) {
  const t = (frame - at) / FPS;
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 5.13 + seed * 3.3 + k * 1.7);
        const a = -Math.PI / 2 + (r(1) - 0.5) * 2.4;
        const speed = 1500 + r(2) * 1700;
        const drag = 2.1;
        const g = 1300;
        const decay = (1 - Math.exp(-drag * t)) / drag;
        const px = x + Math.cos(a) * speed * decay + Math.sin(t * 3 + i) * 26 * clamp(t);
        const py = y + Math.sin(a) * speed * decay + (g / drag) * (t - decay);
        if (py > 2100) return null;
        const kind = r(3);
        const w = 16 + r(4) * 18;
        const flutter = Math.cos(t * (7 + r(5) * 9) + i);
        const style: CSSProperties = {
          position: 'absolute',
          left: px,
          top: py,
          rotate: `${(r(6) - 0.5) * 800 * t}deg`,
          scale: `1 ${flutter}`,
          opacity: 1 - clamp((t - 2.6) / 0.8),
        };
        if (kind > 0.72) {
          // mini price tag
          return <div key={i} style={{ ...style, width: w * 1.3, height: w * 0.8, background: colors[i % colors.length], clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 28% 100%, 0 50%)' }} />;
        }
        if (kind > 0.4) {
          // curly ribbon strip
          return <div key={i} style={{ ...style, width: w * 0.45, height: w * 1.9, borderRadius: w, background: colors[(i + 1) % colors.length] }} />;
        }
        return <div key={i} style={{ ...style, width: w, height: w * 0.5, borderRadius: 3, background: colors[(i + 2) % colors.length] }} />;
      })}
    </>
  );
}

export default function OrderThankYou(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const cx = W / 2;
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const shadowC = dark ? '#05000A' : p.textColor;

  const LAND = T.beats(3); // parcel lands on beat 4
  const HIT = T.bars(1); // name + burst on bar 2
  const CHIP = HIT + T.beats(3);
  const COUPON = T.bars(3); // bar 4 downbeat
  const outro = prog(frame, end - 30, 30, ease.inOut);

  // Parcel drop: falls from above, lands with a squash, then breathes.
  const fall = prog(frame, LAND - 26, 26, ease.in);
  const heroY = 590;
  const dropY = mix(-700, 0, fall);
  const impact = frame >= LAND ? frame - LAND : -1;
  const squash = impact >= 0 ? Math.exp(-impact / 9) * Math.cos(impact / 3.2) * 0.16 : 0;
  const bob = frame > LAND + 30 ? Math.sin((frame - LAND - 30) / 28) * 8 : 0;
  const hitFlash = keys(frame, [HIT - 1, HIT + 2, HIT + 24], [0, 0.7, 0], [ease.out, ease.outSoft]);
  const shake = frame >= LAND && frame < LAND + 14 ? Math.sin(frame * 2.1) * (1 - (frame - LAND) / 14) * 10 : 0;
  const push = mix(1, 1.045, prog(frame, 0, end, ease.inOutSoft));

  const hasPhoto = !!p.photo;
  const NAME = p.name.length > 9 ? 150 : 210;
  const nameY = 1040;
  const nameBlock: CSSProperties = {
    position: 'absolute',
    left: 0,
    width: W,
    top: nameY,
    textAlign: 'center',
    ...displayFace(p.font),
    fontStyle: p.font === 'chakra' ? 'italic' : 'normal',
    fontSize: NAME,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    whiteSpace: 'nowrap',
  };

  // HUD frame around the hero
  const bx = cx - 310;
  const by = heroY - 310;
  const bs = 620;
  const corners: [number, number, 1 | -1, 1 | -1][] = [
    [bx, by, 1, 1],
    [bx + bs, by, -1, 1],
    [bx + bs, by + bs, -1, -1],
    [bx, by + bs, 1, -1],
  ];
  const ring = prog(frame, LAND, 50, ease.out);
  const grid = Math.round(46);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.sora, overflow: 'hidden' }}>
      {/* Depth: colour fields, parallax dot grid, chevron band */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 45% at 50% ${(heroY / H) * 100}%, ${hexA(p.accent, dark ? 0.32 : 0.3)} 0%, transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 15% 100%, ${hexA(p.accent2, dark ? 0.35 : 0.22)} 0%, transparent 70%)`, opacity: 0.7 + 0.3 * Math.sin(frame / 40) }} />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${hexA(p.textColor, dark ? 0.16 : 0.14)} 1.3px, transparent 1.9px)`,
          backgroundSize: `${grid}px ${grid}px`,
          backgroundPosition: `0px ${-frame * 0.25}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -400,
          top: heroY + 150,
          width: W + 800,
          height: 110,
          rotate: '-10deg',
          backgroundImage: `repeating-linear-gradient(135deg, ${hexA(p.accent2, dark ? 0.55 : 0.38)} 0 22px, transparent 22px 48px)`,
          backgroundPosition: `${frame * 1.2}px 0`,
          borderTop: `3px solid ${hexA(p.accent2, 0.6)}`,
          borderBottom: `3px solid ${hexA(p.accent2, 0.6)}`,
          opacity: prog(frame, 6, 30),
          translate: `${mix(-200, 0, prog(frame, 6, 50))}px 0`,
        }}
      />
      <Dust frame={frame} width={W} height={H} count={36} color={p.accent2} seed={4} opacity={0.4} speed={0.7} maxSize={7} />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px 0`, opacity: 1 - outro }}>
        {/* HUD: corners snap in on beats 1-3, then a lock ring when the parcel lands */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          {corners.map(([x, y, sx, sy], i) => (
            <Corner key={i} x={x} y={y} sx={sx} sy={sy} k={90} t={prog(frame, Math.floor(i / 2) * T.beat + (i % 2) * 6, 18, ease.out)} c={p.textColor} w={6} />
          ))}
          <g stroke={p.accent2} strokeWidth={4} opacity={prog(frame, T.beats(2), 20)}>
            <line x1={cx} y1={by - 40} x2={cx} y2={by + 20} />
            <line x1={bx - 40} y1={heroY} x2={bx + 20} y2={heroY} />
            <line x1={bx + bs - 20} y1={heroY} x2={bx + bs + 40} y2={heroY} />
          </g>
          {frame >= LAND && <circle cx={cx} cy={heroY + 40} r={300 + ring * 300} fill="none" stroke={p.accent} strokeWidth={mix(10, 1, ring)} opacity={(1 - ring) * 0.8} />}
          <circle
            cx={cx}
            cy={heroY}
            r={380}
            fill="none"
            stroke={hexA(p.accent2, 0.5)}
            strokeWidth={3}
            strokeDasharray="6 18"
            transform={`rotate(${frame * 0.3} ${cx} ${heroY})`}
            opacity={prog(frame, T.beat, 40)}
          />
        </svg>

        {/* HUD readout, typed in */}
        <div style={{ position: 'absolute', left: bx + 4, top: by - 76, fontFamily: FONTS.majormono, fontSize: 44, letterSpacing: '0.1em', color: p.textColor, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 20, height: 20, borderRadius: 10, background: p.pop, opacity: frame % 40 < 28 ? 1 : 0.3 }} />
          {typed(frame, 10, FPS, 18, p.eyebrow)}
        </div>
        {/* Bar 1: packing progress readout fills the lower frame, clears before the hit */}
        <div
          style={{
            position: 'absolute',
            left: 140,
            width: W - 280,
            top: 1240,
            opacity: prog(frame, 16, 24) * (1 - prog(frame, HIT - 16, 14, ease.in)),
            filter: `blur(${prog(frame, HIT - 16, 14, ease.in) * 12}px)`,
            translate: `0 ${mix(30, 0, prog(frame, 16, 30))}px`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 44, fontWeight: 600 }}>
            <span>{frame < LAND ? 'Packing your order' : 'Packed with care'}</span>
            <span style={{ ...displayFace('chakra'), fontSize: 64, color: p.textColor }}>{Math.round(prog(frame, 16, LAND - 16, ease.inOutSoft) * 100)}%</span>
          </div>
          <div style={{ marginTop: 20, height: 34, borderRadius: 8, border: `4px solid ${p.textColor}`, padding: 4, boxShadow: `8px 8px 0 ${shadowC}`, background: dark ? p.surface : '#FFFFFF' }}>
            <div
              style={{
                height: '100%',
                width: `${prog(frame, 16, LAND - 16, ease.inOutSoft) * 100}%`,
                borderRadius: 4,
                backgroundColor: p.accent,
                backgroundImage: `repeating-linear-gradient(135deg, ${hexA(p.textColor, 0.18)} 0 10px, transparent 10px 22px)`,
                backgroundPosition: `${frame * 1.5}px 0`,
              }}
            />
          </div>
          <div style={{ marginTop: 22, fontFamily: FONTS.majormono, fontSize: 32, letterSpacing: '0.12em', color: p.accent2 }}>{p.orderId.toLowerCase()} · 3 items</div>
        </div>

        {/* Hero: parcel (or the product photo in a bracketed card) */}
        <div
          style={{
            position: 'absolute',
            left: cx - 260,
            top: heroY - 260 + dropY + bob,
            width: 520,
            height: 520,
            scale: `${1 + squash} ${1 - squash}`,
            transformOrigin: '50% 100%',
            opacity: frame < LAND - 26 ? 0 : 1,
          }}
        >
          {hasPhoto ? (
            <div style={{ position: 'absolute', inset: 10, borderRadius: 36, padding: 14, background: p.background, border: `6px solid ${p.textColor}`, boxShadow: `18px 18px 0 ${shadowC}` }}>
              <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24 }} />
              <div style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, rotate: '12deg' }}>
                <Parcel size={150} p={p} />
              </div>
            </div>
          ) : (
            <Parcel size={520} p={p} />
          )}
        </div>

        {/* Greeting + name: sweep in on the bar-2 downbeat */}
        <div
          style={{
            position: 'absolute',
            width: W,
            top: nameY - 96,
            textAlign: 'center',
            fontFamily: FONTS.sora,
            fontWeight: 600,
            fontSize: 64,
            letterSpacing: '-0.01em',
            opacity: prog(frame, HIT - 10, 24),
            translate: `0 ${mix(30, 0, prog(frame, HIT - 10, 30))}px`,
            filter: `blur(${mix(8, 0, prog(frame, HIT - 10, 24))}px)`,
          }}
        >
          {p.greeting}
        </div>
        {frame >= HIT - 4 && (
          <>
            <SweepReveal frame={frame} start={HIT - 2} dur={30} style={nameBlock}>
              <span style={{ color: p.accent, textShadow: `8px 8px 0 ${shadowC}` }}>{p.name}</span>
            </SweepReveal>
            <Glint frame={frame} start={COUPON + T.beats(2)} dur={44} style={nameBlock}>
              {p.name}
            </Glint>
          </>
        )}

        <WordsIn
          text={p.message}
          frame={frame}
          start={HIT + T.beats(1)}
          stagger={5}
          style={{ position: 'absolute', left: 110, width: W - 220, top: nameY + NAME + 36, justifyContent: 'center', textAlign: 'center', fontSize: 50, lineHeight: 1.35 }}
        />

        {/* Order chip */}
        <div style={{ position: 'absolute', width: W, top: 1478, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '20px 34px',
              borderRadius: 18,
              background: dark ? p.surface : '#FFFFFF',
              border: `4px solid ${p.textColor}`,
              boxShadow: `10px 10px 0 ${shadowC}`,
              fontSize: 44,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, CHIP, 24, ease.backOut)),
              opacity: clamp(prog(frame, CHIP, 8)),
            }}
          >
            <span style={{ ...displayFace('chakra'), fontSize: 46 }}>{p.orderId}</span>
            <span style={{ width: 4, height: 40, background: hexA(p.textColor, 0.25) }} />
            <span style={{ width: 16, height: 16, borderRadius: 8, background: p.pop }} />
            <span style={{ fontWeight: 600 }}>{p.status}</span>
          </div>
        </div>

        {/* Comeback coupon: a ticket with punched notches */}
        <div style={{ position: 'absolute', width: W, top: 1620, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              background: p.accent,
              borderRadius: 22,
              boxShadow: `12px 12px 0 ${shadowC}`,
              scale: String(prog(frame, COUPON, 28, ease.backOut)),
              rotate: `${mix(-8, -2, prog(frame, COUPON, 40, ease.out))}deg`,
              opacity: clamp(prog(frame, COUPON, 8)),
              color: dark ? '#12001F' : p.textColor,
            }}
          >
            {[0, 1].map((k) => (
              <span key={k} style={{ position: 'absolute', top: '50%', [k ? 'right' : 'left']: -26, width: 52, height: 52, marginTop: -26, borderRadius: 26, background: p.background }} />
            ))}
            <div style={{ padding: '26px 30px 26px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: `4px dashed ${hexA(dark ? '#12001F' : p.textColor, 0.5)}` }}>
              <span style={{ fontFamily: FONTS.majormono, fontSize: 28, letterSpacing: '0.12em' }}>code</span>
              <span style={{ ...displayFace('chakra'), fontSize: p.couponCode.length > 10 ? 56 : 66, lineHeight: 1, letterSpacing: '0.01em' }}>{p.couponCode}</span>
            </div>
            <div style={{ padding: '22px 46px 22px 28px', display: 'flex', alignItems: 'center', maxWidth: 400, fontSize: 44, fontWeight: 600, lineHeight: 1.15 }}>{p.couponText}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', width: W, top: 1838, textAlign: 'center', fontFamily: FONTS.majormono, fontSize: 34, letterSpacing: '0.16em', opacity: prog(frame, COUPON + 20, 30) * 0.8 }}>
          {p.brand}
        </div>
      </AbsoluteFill>

      {/* Confetti in front: one big burst on the hit, a small one with the coupon */}
      <Burst frame={frame} at={HIT} x={cx} y={heroY + 60} count={110} colors={[p.accent, p.accent2, p.pop, p.surface]} seed={2} />
      <Burst frame={frame} at={COUPON} x={cx} y={1680} count={40} colors={[p.accent2, p.pop, p.accent]} seed={7} />

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${heroY + 100}px, ${hexA('#ffffff', hitFlash)} 0%, ${hexA(p.accent, hitFlash * 0.4)} 25%, transparent 60%)`, mixBlendMode: dark ? 'screen' : 'normal' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
