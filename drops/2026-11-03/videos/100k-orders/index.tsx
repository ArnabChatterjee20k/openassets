import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: '100K Orders',
  category: 'milestone',
  description:
    'Milestone film for a store: a HUD gauge spins up while the order counter rolls to 100,000, locks with a flash and a burst of tag confetti, then stat chips land on the beat and a thank-you closes.',
  tags: ['milestone', 'orders', 'counter', 'e-commerce', 'celebration', 'stats', 'thank you'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat 30f, bar 120f
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('11.11 flash sale · milestone'),
  count: num(100, 10000000, 100, 'Number').default(100000),
  label: text('Counter label').default('orders in 48 hours'),
  stat1Value: text('Stat 1 value').default('48h'),
  stat1Label: text('Stat 1 label').default('sale window'),
  stat2Value: text('Stat 2 value').default('31'),
  stat2Label: text('Stat 2 label').default('countries'),
  stat3Value: text('Stat 3 value').default('4.9★'),
  stat3Label: text('Stat 3 label').default('avg. rating'),
  thanks: text('Thank-you line').default('Thank you for shopping the 11.11 drop.'),
  brand: text('Brand pill').default('Mochi Mode · mochimode.shop'),
  photo: image('Team photo / logo (optional)').default(''),
  font: font('Counter font').default('chakra'),
  background: color().default('#FDF3F8'),
  surface: color().default('#F7DDEB'),
  textColor: color('Text').default('#3A1F4A'),
  accent: color().default('#FF7EB6'),
  accent2: color('HUD lines').default('#8A7BFF'),
  pop: color('Spark').default('#4FD1C5'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night drop': { background: '#12001F', surface: '#24003D', textColor: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600' },
  sorbet: { background: '#FFEDE1', surface: '#FFD3C2', textColor: '#3D0E2A', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', count: 1000000, label: 'happy customers', stat1Value: '3 yrs', stat1Label: 'since launch' },
  brutal: { font: 'archivo', background: '#FFFDF2', surface: '#FFE45C', textColor: '#000000', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#00D1A0', count: 25000, label: 'members in the club' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Mini price tags + ribbon strips fired from (x, y) with drag so they hang and drift. */
function TagBurst({ frame, at, x, y, count, colors, seed }: { frame: number; at: number; x: number; y: number; count: number; colors: string[]; seed: number }) {
  const t = (frame - at) / FPS;
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 4.77 + seed * 2.9 + k * 1.31);
        const a = r(1) * Math.PI * 2;
        const speed = 1300 + r(2) * 1900;
        const drag = 2.3;
        const g = 900;
        const decay = (1 - Math.exp(-drag * t)) / drag;
        const px = x + Math.cos(a) * speed * decay * 1.25 + Math.sin(t * 2.6 + i) * 22 * clamp(t);
        const py = y + Math.sin(a) * speed * decay * 0.8 + (g / drag) * (t - decay);
        if (py > 1200) return null;
        const w = 18 + r(4) * 18;
        const flutter = Math.cos(t * (6 + r(5) * 8) + i);
        const style: CSSProperties = {
          position: 'absolute',
          left: px,
          top: py,
          rotate: `${(r(6) - 0.5) * 700 * t}deg`,
          scale: `1 ${flutter}`,
          opacity: 1 - clamp((t - 3) / 0.8),
          background: colors[i % colors.length],
        };
        if (r(3) > 0.6) return <div key={i} style={{ ...style, width: w * 1.3, height: w * 0.8, clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 28% 100%, 0 50%)' }} />;
        return <div key={i} style={{ ...style, width: w * 0.42, height: w * 1.7, borderRadius: w }} />;
      })}
    </>
  );
}

export default function HundredKOrders(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const shadowC = dark ? '#05000A' : p.textColor;

  const LOCK = T.bars(1); // counter locks on bar 2
  const STATS = T.bars(2); // bar 3
  const THANKS = T.bars(3); // bar 4
  const BRAND = T.bars(4); // bar 5
  const outro = prog(frame, end - 36, 36, ease.inOut);

  const hasPhoto = !!p.photo;
  const colCx = hasPhoto ? 700 : W / 2;

  // Counter roll: slow start, fast middle, decelerates into the lock.
  const roll = prog(frame, 8, LOCK - 8, ease.inOutSoft);
  const value = frame >= LOCK ? p.count : Math.floor(p.count * roll);
  const digits = value.toLocaleString('en-US');
  const finalLen = p.count.toLocaleString('en-US').length;
  const NUM = Math.min(250, (hasPhoto ? 1000 : 1500) / (finalLen * 0.6));

  // Layout: the counter rises to make room for the stats on bar 3.
  const lift = prog(frame, STATS - 12, 34, ease.inOut);
  const cy = mix(500, 350, lift);
  const lockPop = frame >= LOCK ? 1 + Math.exp(-(frame - LOCK) / 8) * Math.sin((frame - LOCK) / 2.6) * 0.06 : 1;
  const flash = keys(frame, [LOCK - 1, LOCK + 2, LOCK + 26], [0, 0.75, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, LOCK, 60, ease.out);
  const shake = frame >= LOCK && frame < LOCK + 16 ? Math.sin(frame * 2.3) * (1 - (frame - LOCK) / 16) * 12 : 0;
  const push = mix(1, 1.04, prog(frame, LOCK, end - LOCK, ease.inOutSoft));

  // HUD: bracket half-extents around the counter, side dials, loading gauge width
  const BW = hasPhoto ? 540 : 640;
  const BH = 250;
  const DIAL = 92;
  const GAUGE = hasPhoto ? 820 : 1000;
  const spin = frame * mix(0.6, 4, roll) * (frame >= LOCK ? 0.35 : 1);
  const gaugeFade = mix(1, 0.18, lift);

  const counterBlock: CSSProperties = {
    position: 'absolute',
    left: colCx - 900,
    width: 1800,
    top: cy - NUM * 0.62,
    textAlign: 'center',
    ...displayFace(p.font),
    fontStyle: p.font === 'chakra' ? 'italic' : 'normal',
    fontSize: NUM,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };

  const stats = [
    [p.stat1Value, p.stat1Label],
    [p.stat2Value, p.stat2Label],
    [p.stat3Value, p.stat3Label],
  ].filter(([v]) => v);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.sora, overflow: 'hidden' }}>
      {/* Depth */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 45% 60% at ${(colCx / W) * 100}% ${(cy / H) * 100}%, ${hexA(p.accent, dark ? 0.32 : 0.34)} 0%, transparent 70%)`, opacity: mix(0.6, 1, roll) }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 55% at 92% 95%, ${hexA(p.accent2, dark ? 0.4 : 0.24)} 0%, transparent 70%)`, opacity: 0.75 + 0.25 * Math.sin(frame / 40) }} />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${hexA(p.textColor, dark ? 0.16 : 0.13)} 1.3px, transparent 1.9px)`,
          backgroundSize: '44px 44px',
          backgroundPosition: `0px ${-frame * 0.2}px`,
        }}
      />
      {[16, H - 56].map((y, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: -100,
            top: y,
            width: W + 200,
            height: 40,
            backgroundImage: `repeating-linear-gradient(${i ? 45 : 135}deg, ${hexA(p.accent2, dark ? 0.5 : 0.32)} 0 16px, transparent 16px 34px)`,
            backgroundPosition: `${(i ? -1 : 1) * frame * 1.4}px 0`,
            borderTop: `2px solid ${hexA(p.accent2, 0.5)}`,
            borderBottom: `2px solid ${hexA(p.accent2, 0.5)}`,
            opacity: prog(frame, 4 + i * 6, 30) * 0.9,
            translate: `${(i ? 1 : -1) * mix(300, 0, prog(frame, 4 + i * 6, 50))}px 0`,
          }}
        />
      ))}
      <Dust frame={frame} width={W} height={H} count={44} color={p.accent2} seed={8} opacity={0.4} speed={mix(0.6, 1.3, roll)} maxSize={7} />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.4}px`, opacity: 1 - outro }}>
        {/* HUD: target brackets around the counter, spinning side dials, shockwave on lock */}
        <svg style={{ position: 'absolute', inset: 0, opacity: prog(frame, 0, 24) }} width={W} height={H}>
          <g transform={`translate(${colCx} ${cy})`} opacity={gaugeFade}>
            {[
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ].map(([sx, sy], i) => {
              const k = 80;
              const t = prog(frame, i * 8, 20, ease.out);
              const dx = BW + (1 - t) * 90;
              const dy = BH + (1 - t) * 60;
              return <path key={i} d={`M${sx * dx},${sy * dy - sy * k} V${sy * dy} H${sx * dx - sx * k}`} fill="none" stroke={p.textColor} strokeWidth={6} strokeLinecap="square" opacity={clamp(t * 2)} />;
            })}
            {[-1, 1].map((s) => (
              <line key={s} x1={s * (BW + 20)} y1={0} x2={s * (BW + 70)} y2={0} stroke={p.accent2} strokeWidth={4} />
            ))}
          </g>
          {(hasPhoto ? [-1] : [-1, 1]).map((s) => (
            <g key={s} transform={`translate(${colCx + s * (BW + 190)} ${cy})`} opacity={prog(frame, 10, 30) * gaugeFade}>
              <circle r={DIAL} fill={hexA(p.background, 0.6)} stroke={hexA(p.textColor, 0.25)} strokeWidth={3} />
              <g transform={`rotate(${spin * s})`}>
                {Array.from({ length: 36 }, (_, i) => {
                  const a = (i / 36) * Math.PI * 2;
                  const l = i % 6 === 0 ? 20 : 9;
                  return <line key={i} x1={Math.cos(a) * (DIAL - 6)} y1={Math.sin(a) * (DIAL - 6)} x2={Math.cos(a) * (DIAL - 6 - l)} y2={Math.sin(a) * (DIAL - 6 - l)} stroke={p.accent2} strokeWidth={i % 6 === 0 ? 4 : 2} />;
                })}
              </g>
              <circle
                r={DIAL - 40}
                fill="none"
                stroke={p.accent}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * (DIAL - 40) * (frame >= LOCK ? 1 : roll)} 999`}
                transform="rotate(-90)"
              />
              <circle r={10} fill={frame >= LOCK ? p.pop : p.accent2} />
            </g>
          ))}
          {frame >= LOCK && (
            <>
              <rect x={colCx - BW * (1 + shock * 0.5)} y={cy - BH * (1 + shock * 0.9)} width={BW * 2 * (1 + shock * 0.5)} height={BH * 2 * (1 + shock * 0.9)} rx={20} fill="none" stroke={p.accent} strokeWidth={mix(12, 1, shock)} opacity={(1 - shock) * 0.85} />
              <circle cx={colCx} cy={cy} r={BW * 0.6 + prog(frame, LOCK + 5, 70) * 900} fill="none" stroke={p.accent2} strokeWidth={mix(5, 1, prog(frame, LOCK + 5, 70))} opacity={(1 - prog(frame, LOCK + 5, 70)) * 0.6} />
            </>
          )}
        </svg>

        {/* Bar 1: segmented loading gauge under the counter; collapses at the lock as the label arrives */}
        <div
          style={{
            position: 'absolute',
            left: colCx - GAUGE / 2,
            width: GAUGE,
            top: cy + NUM * 0.5 + 8,
            height: 56,
            display: 'flex',
            gap: 6,
            padding: 6,
            border: `4px solid ${p.textColor}`,
            borderRadius: 10,
            boxShadow: `8px 8px 0 ${shadowC}`,
            background: dark ? p.surface : '#FFFFFF',
            boxSizing: 'border-box',
            opacity: prog(frame, 6, 20) * (1 - prog(frame, LOCK, 12, ease.in)),
            scale: `1 ${1 - prog(frame, LOCK, 12, ease.in)}`,
          }}
        >
          {Array.from({ length: 32 }, (_, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 3, background: i / 32 < roll ? (i % 8 === 7 ? p.accent2 : p.accent) : hexA(p.textColor, 0.08) }} />
          ))}
        </div>

        {/* Eyebrow */}
        <div
          style={{
            position: 'absolute',
            left: colCx - 600,
            width: 1200,
            top: cy - NUM * 0.62 - 74,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            fontFamily: FONTS.majormono,
            fontSize: 44,
            letterSpacing: '0.08em',
            opacity: prog(frame, 12, 24),
          }}
        >
          <span style={{ width: 18, height: 18, borderRadius: 9, background: p.pop, opacity: frame % 40 < 28 ? 1 : 0.35 }} />
          {p.eyebrow}
        </div>

        {/* Counter */}
        <div style={{ ...counterBlock, scale: String(lockPop), color: frame >= LOCK ? p.accent : p.textColor, textShadow: frame >= LOCK ? `10px 10px 0 ${shadowC}` : 'none', filter: `blur(${(1 - prog(frame, 0, 20)) * 10}px)`, opacity: prog(frame, 0, 16) }}>
          {digits}
        </div>
        <Glint frame={frame} start={BRAND + 10} dur={44} style={counterBlock}>
          {digits}
        </Glint>

        {/* Label sweeps in right after the lock */}
        {frame >= LOCK && (
          <SweepReveal
            frame={frame}
            start={LOCK + 8}
            dur={30}
            style={{ position: 'absolute', left: colCx - 900, width: 1800, top: cy + NUM * 0.5, textAlign: 'center', ...displayFace('chakra'), fontSize: 84, lineHeight: 1, letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
          >
            {p.label}
          </SweepReveal>
        )}

        {/* Stat chips land on the beats of bar 3 */}
        <div style={{ position: 'absolute', left: colCx - 900, width: 1800, top: 650, display: 'flex', justifyContent: 'center', gap: hasPhoto ? 28 : 40 }}>
        {stats.map(([v, l], i) => {
          const at = STATS + i * T.beat;
          const t = prog(frame, at, 26, ease.backOut);
          return (
            <div
              key={i}
              style={{
                padding: hasPhoto ? '18px 22px' : '22px 30px',
                borderRadius: 20,
                background: dark ? p.surface : '#FFFFFF',
                border: `4px solid ${p.textColor}`,
                boxShadow: `10px 10px 0 ${i === 1 ? p.accent : shadowC}`,
                display: 'flex',
                alignItems: 'baseline',
                gap: 18,
                scale: String(t),
                opacity: clamp(prog(frame, at, 8)),
                translate: `0 ${mix(40, 0, prog(frame, at, 30))}px`,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ ...displayFace('chakra'), fontSize: hasPhoto ? 60 : 76, lineHeight: 1 }}>{v}</span>
              <span style={{ fontSize: hasPhoto ? 36 : 44, fontWeight: 600, opacity: 0.85 }}>{l}</span>
            </div>
          );
        })}
        </div>

        <WordsIn
          text={p.thanks}
          frame={frame}
          start={THANKS}
          stagger={5}
          style={{ position: 'absolute', left: colCx - (hasPhoto ? 560 : 800), width: hasPhoto ? 1120 : 1600, top: 812, justifyContent: 'center', fontSize: 56, fontWeight: 600, letterSpacing: '-0.01em' }}
        />

        {/* Brand pill on bar 5 */}
        <div style={{ position: 'absolute', left: colCx - 600, width: 1200, top: 908, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 30px',
              borderRadius: 999,
              background: p.textColor,
              color: p.background,
              fontSize: 40,
              fontWeight: 600,
              boxShadow: `6px 6px 0 ${p.accent}`,
              scale: String(prog(frame, BRAND, 26, ease.backOut)),
              opacity: clamp(prog(frame, BRAND, 8)),
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: 8, background: p.pop }} />
            {p.brand}
          </div>
        </div>

        {/* Optional team photo / logo in a bracketed card, enters on bar 3 */}
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              left: 1300,
              top: 230,
              width: 470,
              height: 580,
              padding: 14,
              borderRadius: 30,
              background: p.background,
              border: `5px solid ${p.textColor}`,
              boxShadow: `16px 16px 0 ${shadowC}`,
              rotate: `${mix(8, 3, prog(frame, STATS, 40))}deg`,
              translate: `${mix(500, 0, prog(frame, STATS, 40, ease.out))}px ${Math.sin(frame / 34) * 6}px`,
              opacity: prog(frame, STATS, 16),
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }} />
            <div style={{ position: 'absolute', left: 26, bottom: -26, padding: '8px 18px', borderRadius: 10, background: p.accent, color: p.textColor, fontFamily: FONTS.majormono, fontSize: 30, letterSpacing: '0.1em', border: `3px solid ${p.textColor}` }}>
              the team
            </div>
          </div>
        )}
      </AbsoluteFill>

      <TagBurst frame={frame} at={LOCK} x={colCx} y={cy} count={130} colors={[p.accent, p.accent2, p.pop, p.surface]} seed={3} />
      <TagBurst frame={frame} at={BRAND} x={colCx} y={930} count={40} colors={[p.accent2, p.pop, p.accent]} seed={11} />

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${(colCx / W) * 100}% ${(cy / H) * 100}%, ${hexA('#ffffff', flash)} 0%, ${hexA(p.accent, flash * 0.45)} 25%, transparent 60%)`, mixBlendMode: dark ? 'screen' : 'normal' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
