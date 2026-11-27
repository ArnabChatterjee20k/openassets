import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Pilot Thank-You',
  category: 'thank-you',
  description:
    'A vertical thank-you for a pilot customer: a counter rolls up to the parts inspected on their line, then "Thank you, <customer>" lands with a burst of tick-and-nut confetti, a handwritten note and a signature. Optional team photo in a loupe-ring frame.',
  tags: ['thank you', 'customer', 'pilot', 'milestone', 'story', 'manufacturing'],
};

// 60 fps, 120 BPM: 1 beat = 30 frames, 1 bar = 120. Four bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Pilot wrap-up · Line 3'),
  count: num(0, 99999999, 1, 'Parts inspected').default(1204880),
  countLabel: text('Counter label').default('parts inspected · 0 escapes'),
  thanks: text('Thank-you line').default('Thank you,'),
  customer: text('Customer').default('Ridgeline Machining'),
  note: textarea('Handwritten note').default('For 14 weeks of honest feedback, early-morning calls and letting us loose on Line 3.'),
  signature: text().default('— Maya & the Loupe team'),
  footer: text().default('loupe.dev'),
  font: font('Headline font').default('fredoka'),
  background: color().default('#E9E3F5'),
  surface: color('Panels').default('#D6CCEC'),
  textColor: color('Text').default('#231942'),
  accent: color('Loupe').default('#5E4AE3'),
  accent2: color('Pink').default('#F49CBB'),
  pop: color('Pass').default('#2EC4B6'),
  photo: image('Team photo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  candy: { background: '#FDF3F8', surface: '#F7DDEB', textColor: '#3A1F4A', accent: '#8A7BFF', accent2: '#FF7EB6', pop: '#4FD1C5', customer: 'Halvorsen Aero' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', textColor: '#F3EDE2', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#C9A45C', count: 860214, customer: 'Brightline Medical', eyebrow: 'Pilot wrap-up · Cell 7' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', textColor: '#17242E', accent: '#2F6F8F', accent2: '#E4572E', pop: '#2EC4B6', thanks: 'Thanks a million,', customer: 'Norrland Bearings', count: 1000000 },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

function gearPath(cx: number, cy: number, r: number, teeth = 14) {
  const rRoot = r * 0.84;
  const step = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [
      [rRoot, a],
      [r, a + step * 0.16],
      [r, a + step * 0.42],
      [rRoot, a + step * 0.58],
    ].forEach(([rr, aa], k) => {
      d += `${i === 0 && k === 0 ? 'M' : 'L'}${(cx + Math.cos(aa) * rr).toFixed(1)},${(cy + Math.sin(aa) * rr).toFixed(1)}`;
    });
  }
  const circ = (x: number, y: number, rr: number) => `M${x - rr},${y}a${rr},${rr} 0 1,0 ${rr * 2},0a${rr},${rr} 0 1,0 ${-rr * 2},0Z`;
  d += 'Z' + circ(cx, cy, r * 0.22);
  for (let i = 0; i < 5; i++) d += circ(cx + Math.cos((i / 5) * Math.PI * 2 + 0.3) * r * 0.53, cy + Math.sin((i / 5) * Math.PI * 2 + 0.3) * r * 0.53, r * 0.12);
  return d;
}

/** Confetti with linear drag: pieces shoot up from the bottom corners, hang, then drift down at terminal speed. */
function Confetti({ frame, start, W, H, p }: { frame: number; start: number; W: number; H: number; p: P }) {
  const t = (frame - start) / FPS;
  if (t < 0) return null;
  const k = 1.5;
  const g = 420; // terminal fall speed = g / k = 280 px/s
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      {Array.from({ length: 70 }, (_, i) => {
        const r = (n: number) => rand(i * 17.3 + n * 3.1);
        const left = i % 2 === 0;
        const x0 = left ? -20 : W + 20;
        const y0 = H * 0.72;
        const vx = (left ? 1 : -1) * (250 + r(1) * 900);
        const vy = -(1300 + r(2) * 900);
        const e = (1 - Math.exp(-k * t)) / k;
        const x = x0 + vx * e + Math.sin(t * (2 + r(3) * 3) + i) * 30 * t;
        // dv/dt = g - k·v  →  y = y0 + (vy - g/k)(1 - e^-kt)/k + (g/k)·t
        const y = y0 + (vy - g / k) * e + (g / k) * t;
        const spin = (r(4) - 0.5) * 720 * t + r(5) * 360;
        const s = 0.8 + r(6) * 0.8;
        const kind = i % 3;
        const fade = 1 - clamp((t - 2.6) / 1.4);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${spin}) scale(${s})`} opacity={fade}>
            {kind === 0 && (
              <>
                <circle r={17} fill={p.pop} />
                <path d="M-8,0 l5,6 l11,-12" fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {kind === 1 && (
              <path
                d={`${Array.from({ length: 6 }, (_, j) => `${j ? 'L' : 'M'}${(Math.cos((j * Math.PI) / 3) * 17).toFixed(1)},${(Math.sin((j * Math.PI) / 3) * 17).toFixed(1)}`).join('')}ZM-7,0a7,7 0 1,0 14,0a7,7 0 1,0 -14,0Z`}
                fill={p.accent}
                fillRule="evenodd"
              />
            )}
            {kind === 2 && <path d="M0,-18 Q3,-3 18,0 Q3,3 0,18 Q-3,3 -18,0 Q-3,-3 0,-18Z" fill={p.accent2} />}
          </g>
        );
      })}
    </svg>
  );
}

export default function PilotThankYou(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const end = video.durationInFrames;

  const HIT = T.bars(1); // thank-you + confetti
  const NOTE = T.bars(2);
  const SIGN = T.bars(3);
  const OUT = end - 36;

  const out = prog(frame, OUT, 36, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const roll = prog(frame, 8, HIT - 22, ease.out);
  const shown = Math.round(p.count * roll);
  const pop = prog(frame, HIT - 14, 22, ease.backOut);
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);

  // Hero circle: team photo or the gear, framed by the loupe ring
  const hcx = W / 2;
  const hcy = 560;
  const R = 250;
  const heroIn = prog(frame, 0, 40, ease.out);
  const ringDraw = prog(frame, 6, 40, ease.inOutSoft);
  const C = 2 * Math.PI * R;
  const bob = Math.sin(frame / 36) * 6;

  const nameSize = p.customer.length > 18 ? 92 : p.customer.length > 13 ? 108 : 124;
  const nameStyle = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: 1250,
    textAlign: 'center' as const,
    ...displayFace(p.font),
    fontSize: nameSize,
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.1 : 0.17, size: 40, y: -frame * 0.15, color: dark ? '255,255,255' : '35,25,66' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: hcx, y: hcy, size: 1100, color: hexA(p.accent2, 0.6), opacity: 0.45 + 0.15 * Math.sin(frame / 40) },
          { x: W * 0.1, y: H * 0.85, size: 1200, color: hexA(p.accent, 0.4), opacity: 0.45 },
          { x: W * 0.95, y: H * 0.6, size: 900, color: hexA(p.pop, 0.35), opacity: prog(frame, HIT, 60) * 0.6 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ scale: String(push * mix(1, 0.96, out)), opacity: 1 - out, filter: out > 0.01 ? `blur(${out * 12}px)` : undefined }}>
        <Dust frame={frame} width={W} height={H} count={36} color={dark ? '#ffffff' : p.accent} seed={9} speed={0.6} opacity={dark ? 0.4 : 0.22} maxSize={5} />
        {/* Confetti sits behind the copy so it never covers the words */}
        <Confetti frame={frame} start={HIT} W={W} H={H} p={p} />

        {/* Eyebrow */}
        <div
          style={{
            position: 'absolute',
            top: 150,
            width: W,
            textAlign: 'center',
            fontFamily: FONTS.caveat,
            fontWeight: 700,
            fontSize: 60,
            color: p.accent,
            opacity: prog(frame, 4, 24),
            translate: `0 ${mix(20, 0, prog(frame, 4, 30))}px`,
          }}
        >
          {p.eyebrow}
        </div>

        {/* Hero: loupe ring with the photo (or the inspected gear) inside */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <clipPath id="ty-lens">
              <circle cx={hcx} cy={hcy + bob} r={R - 4} />
            </clipPath>
            <radialGradient id="ty-part" cx="0.35" cy="0.3" r="0.9">
              <stop offset="0" stopColor="#FDFBFF" />
              <stop offset="1" stopColor={dark ? '#BDB5D6' : p.surface} />
            </radialGradient>
          </defs>
          <g opacity={heroIn}>
            <circle cx={hcx + 16} cy={hcy + bob + 18} r={R + 22} fill={p.textColor} opacity={dark ? 0.5 : 1} />
            <circle cx={hcx} cy={hcy + bob} r={R + 4} fill={dark ? '#EDE8FF' : '#FBF9FF'} />
            <g clipPath="url(#ty-lens)">
              {!p.photo && (
                <g transform={`rotate(${frame * 0.25} ${hcx} ${hcy + bob})`}>
                  <path d={gearPath(hcx, hcy + bob, R * 0.78)} fill="url(#ty-part)" stroke={p.textColor} strokeWidth={5} fillRule="evenodd" strokeLinejoin="round" />
                  <circle cx={hcx} cy={hcy + bob} r={R * 0.78 * 0.28} fill="none" stroke={p.pop} strokeWidth={12} />
                </g>
              )}
              <line x1={hcx - R} y1={hcy + bob} x2={hcx + R} y2={hcy + bob} stroke={hexA(p.accent, 0.3)} strokeWidth={2} />
              <line x1={hcx} y1={hcy + bob - R} x2={hcx} y2={hcy + bob + R} stroke={hexA(p.accent, 0.3)} strokeWidth={2} />
            </g>
          </g>
        </svg>
        {p.photo && (
          <Img
            src={p.photo}
            style={{
              position: 'absolute',
              left: hcx - R + 4,
              top: hcy + bob - R + 4,
              width: (R - 4) * 2,
              height: (R - 4) * 2,
              borderRadius: '50%',
              objectFit: 'cover',
              opacity: heroIn,
              scale: String(mix(1.12, 1, heroIn)),
            }}
          />
        )}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <circle cx={hcx} cy={hcy + bob} r={R} fill="none" stroke={p.accent} strokeWidth={30} strokeDasharray={`${C * ringDraw} ${C}`} transform={`rotate(-90 ${hcx} ${hcy + bob})`} strokeLinecap="round" />
          <circle cx={hcx} cy={hcy + bob} r={R + 16} fill="none" stroke={p.textColor} strokeWidth={3} opacity={ringDraw} />
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i / 60) * Math.PI * 2 - frame * 0.003;
            const l = i % 5 === 0 ? 18 : 9;
            const r0 = R + 26;
            return <line key={i} x1={hcx + Math.cos(a) * r0} y1={hcy + bob + Math.sin(a) * r0} x2={hcx + Math.cos(a) * (r0 + l)} y2={hcy + bob + Math.sin(a) * (r0 + l)} stroke={p.textColor} strokeWidth={2.5} opacity={ringDraw} />;
          })}
          {/* teal pass badge pops as the counter lands */}
          <g transform={`translate(${hcx + R * 0.74} ${hcy + bob + R * 0.74}) scale(${pop})`}>
            <circle r={58} fill={p.pop} stroke={p.textColor} strokeWidth={5} />
            <path d="M-24,2 l15,16 l31,-34" fill="none" stroke="#FFFFFF" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>

        {/* Counter */}
        <div
          style={{
            position: 'absolute',
            top: 905,
            width: W,
            textAlign: 'center',
            ...displayFace(p.font),
            fontSize: 150,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            color: p.textColor,
            opacity: prog(frame, 6, 20),
            scale: String(1 + pop * 0.06 * (1 - prog(frame, HIT, 30))),
          }}
        >
          {shown.toLocaleString('en-US')}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1075,
            width: W,
            textAlign: 'center',
            fontSize: 46,
            fontWeight: 500,
            opacity: prog(frame, 20, 24) * 0.85,
          }}
        >
          {p.countLabel}
        </div>

        {/* Thank you, <customer> */}
        <div
          style={{
            position: 'absolute',
            top: 1150,
            width: W,
            textAlign: 'center',
            fontFamily: FONTS.caveat,
            fontWeight: 700,
            fontSize: 84,
            color: p.accent,
            rotate: '-3deg',
            opacity: prog(frame, HIT, 16),
            scale: String(mix(0.7, 1, prog(frame, HIT, 26, ease.backOut))),
          }}
        >
          {p.thanks}
        </div>
        {frame >= HIT && (
          <>
            <SweepReveal frame={frame} start={HIT + 6} dur={34} style={nameStyle}>
              <span style={{ backgroundImage: `linear-gradient(165deg, ${p.textColor} 55%, ${p.accent} 125%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: 14 }}>{p.customer}</span>
            </SweepReveal>
            <Glint frame={frame} start={SIGN + 10} dur={50} style={nameStyle}>
              {p.customer}
            </Glint>
          </>
        )}

        {/* Handwritten note + signature */}
        <WordsIn
          text={p.note}
          frame={frame}
          start={NOTE}
          stagger={3}
          style={{ position: 'absolute', left: 110, width: W - 220, top: 1440, justifyContent: 'center', fontFamily: FONTS.caveat, fontSize: 62, lineHeight: 1.12, color: p.textColor }}
        />
        <div
          style={{
            position: 'absolute',
            top: 1655,
            width: W,
            textAlign: 'center',
            fontFamily: FONTS.caveat,
            fontWeight: 700,
            fontSize: 64,
            color: p.accent,
            maskImage: `linear-gradient(90deg, black ${prog(frame, SIGN, 40, ease.inOutSoft) * 120 - 10}%, transparent ${prog(frame, SIGN, 40, ease.inOutSoft) * 120 + 10}%)`,
            WebkitMaskImage: `linear-gradient(90deg, black ${prog(frame, SIGN, 40, ease.inOutSoft) * 120 - 10}%, transparent ${prog(frame, SIGN, 40, ease.inOutSoft) * 120 + 10}%)`,
          }}
        >
          {p.signature}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1745,
            width: W,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 30px',
              borderRadius: 999,
              fontSize: 44,
              fontWeight: 500,
              color: p.textColor,
              background: dark ? hexA('#ffffff', 0.1) : hexA('#ffffff', 0.8),
              border: `3px solid ${p.textColor}`,
              scale: String(prog(frame, SIGN + T.beats(1), 24, ease.backOut)),
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: p.pop }} />
            {p.footer}
          </span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 62%, ${hexA(p.accent2, flash * 0.5)} 0%, transparent 55%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
