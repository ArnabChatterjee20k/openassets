import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Booth Invite',
  category: 'event',
  description:
    'Trade-show invite: a loupe ring scans a machined gear and circles a 38 μm burr on the beat, then the headline, show name, dates, booth number and a booking CTA land on the grid. Optional booth photo.',
  tags: ['event', 'trade show', 'invite', 'booth', 'manufacturing', 'demo'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120. Four bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Live demo at our booth'),
  headline: text().default('See it catch a 38 μm burr, live.'),
  subline: text().default('Bring your own part. We scan it in 0.4 s.'),
  eventName: text('Event').default('Midwest Precision Expo · Detroit'),
  date: text('Dates').default('Mar 9–11, 2027'),
  booth: text('Booth').default('Booth 4127'),
  cta: text('Call to action').default('Book a 15-min slot  →  loupe.dev/expo'),
  note: text('Handwritten callout').default('38 μm burr!'),
  font: font('Headline font').default('fredoka'),
  background: color().default('#E9E3F5'),
  surface: color('Part / panels').default('#D6CCEC'),
  textColor: color('Text').default('#231942'),
  accent: color('Loupe').default('#5E4AE3'),
  accent2: color('Defect').default('#F49CBB'),
  pop: color('Pass').default('#2EC4B6'),
  photo: image('Booth photo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-hall': { background: '#12001F', surface: '#3B1F66', textColor: '#FBEFFF', accent: '#B026FF', accent2: '#FF2E88', pop: '#3BF0D0' },
  frost: { background: '#E9EEF1', surface: '#C5D3DC', textColor: '#17242E', accent: '#2F6F8F', accent2: '#E4572E', pop: '#2EC4B6', eventName: 'AeroFab Summit · Seattle', date: 'Apr 14–16, 2027', booth: 'Booth B-22' },
  'mid-century': { background: '#F4E9D8', surface: '#E6C98F', textColor: '#2E2A24', accent: '#2C7873', accent2: '#D96C3D', pop: '#2C7873', font: 'fraunces', headline: 'Bring a part. Watch it get judged.' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const TEETH = 16;
const STEP = (Math.PI * 2) / TEETH;

function gearPath(cx: number, cy: number, r: number, teeth = TEETH, holes = true) {
  const rRoot = r * 0.84;
  const step = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    [
      [rRoot, a],
      [r, a + step * 0.16],
      [r, a + step * 0.42],
      [rRoot, a + step * 0.58],
    ].forEach(([rr, aa], k) => {
      d += `${i === 0 && k === 0 ? 'M' : 'L'}${(cx + Math.cos(aa) * rr).toFixed(1)},${(cy + Math.sin(aa) * rr).toFixed(1)}`;
    });
  }
  d += 'Z';
  const circ = (x: number, y: number, rr: number) => `M${x - rr},${y}a${rr},${rr} 0 1,0 ${rr * 2},0a${rr},${rr} 0 1,0 ${-rr * 2},0Z`;
  d += circ(cx, cy, r * 0.2);
  if (holes) for (let i = 0; i < 5; i++) d += circ(cx + Math.cos((i / 5) * Math.PI * 2 + 0.6) * r * 0.52, cy + Math.sin((i / 5) * Math.PI * 2 + 0.6) * r * 0.52, r * 0.12);
  return d;
}

export default function BoothInvite(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const end = video.durationInFrames;

  // Beat map
  const FOUND = T.beats(3); // the burr is circled (bar 1, beat 4)
  const HIT = T.bars(1); // headline downbeat
  const EVENT = T.bars(2); // event card
  const CTA = T.bars(3); // CTA + glint
  const OUT = end - 36;

  const out = prog(frame, OUT, 36, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const found = prog(frame, FOUND, 22, ease.backOut);
  const shock = prog(frame, FOUND, 50, ease.out);
  const shake = frame >= FOUND && frame < FOUND + 14 ? Math.sin(frame * 2.3) * (1 - (frame - FOUND) / 14) * 6 : 0;
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);

  // Visual: the part and the loupe
  const hasPhoto = !!p.photo;
  const r = 270;
  const cx = 1400;
  const cy = hasPhoto ? 540 : 610;
  const flawA = 2 * STEP - Math.PI / 2 + STEP * 0.29;
  const startA = flawA - 2.3;
  const scan = prog(frame, 34, FOUND - 34, ease.inOut);
  const la = mix(startA, flawA, scan);
  const lx = cx + Math.cos(la) * r * 0.99;
  const ly = cy + Math.sin(la) * r * 0.99;
  const fx = cx + Math.cos(flawA) * r * 0.99;
  const fy = cy + Math.sin(flawA) * r * 0.99;
  const R = 165;
  const mag = 2.6;
  const gearIn = prog(frame, 0, 40, ease.out);
  const ringDraw = prog(frame, 10, 34, ease.inOutSoft);
  const C = 2 * Math.PI * R;
  const gear = gearPath(cx, cy, r);
  const bob = Math.sin(frame / 38) * 6;
  // Burr: pink notch at the flaw, oriented outward
  const burr = (s: number) =>
    `M${-s * 0.05},0 l${s * 0.02},${-s * 0.03} l${s * 0.018},${s * 0.018} l${s * 0.02},${-s * 0.035} l${s * 0.016},${s * 0.04} l${s * 0.012},${-s * 0.012} l${s * 0.01},${s * 0.025}Z`;
  const burrRot = (flawA * 180) / Math.PI + 90;

  // Copy column
  const X = 130;
  const colW = 900;
  const HEAD = p.headline.length > 30 ? 98 : 108;
  const gradient = `linear-gradient(165deg, ${p.textColor} 55%, ${p.accent} 120%)`;
  const headStyle = {
    position: 'absolute' as const,
    left: X,
    top: 228,
    width: colW,
    ...displayFace(p.font),
    fontSize: HEAD,
    lineHeight: 1.0,
    letterSpacing: '-0.03em',
  };
  const chip = (label: string, at: number, dot: string) => {
    const t = prog(frame, at, 24, ease.backOut);
    return (
      <span
        key={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 30px',
          borderRadius: 999,
          fontFamily: FONTS.outfit,
          fontWeight: 500,
          fontSize: 44,
          color: p.textColor,
          background: dark ? hexA('#ffffff', 0.1) : hexA('#ffffff', 0.85),
          border: `3px solid ${p.textColor}`,
          boxShadow: `6px 7px 0 ${p.textColor}`,
          scale: String(mix(0.6, 1, t)),
          opacity: clamp(t * 2),
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 22, height: 22, borderRadius: '50%', background: dot }} />
        {label}
      </span>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.1 : 0.18, size: 44, y: -frame * 0.15, color: dark ? '255,255,255' : '35,25,66' }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: cx, y: cy, size: 1300, color: hexA(p.accent2, 0.6), opacity: 0.45 + 0.2 * Math.sin(frame / 40) + found * 0.2 },
          { x: 260, y: 1000, size: 1300, color: hexA(p.accent, 0.4), opacity: 0.5 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ scale: String(push * mix(1, 0.96, out)), opacity: 1 - out, filter: out > 0.01 ? `blur(${out * 12}px)` : undefined, translate: `${shake}px 0` }}>
        <Dust frame={frame} width={W} height={H} count={40} color={dark ? '#ffffff' : p.accent} seed={4} speed={0.7} opacity={dark ? 0.4 : 0.25} maxSize={5} />

        {/* ── The part ── */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <radialGradient id="bi-part" cx="0.35" cy="0.3" r="0.9">
              <stop offset="0" stopColor={dark ? '#F4F0FF' : '#FDFBFF'} />
              <stop offset="1" stopColor={p.surface} />
            </radialGradient>
            <clipPath id="bi-lens">
              <circle cx={lx} cy={ly + bob} r={R} />
            </clipPath>
            <filter id="bi-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>
          <g opacity={gearIn} transform={`translate(0 ${mix(60, 0, gearIn) + bob})`}>
            {/* a second gear idling behind */}
            <g transform={`rotate(${frame * 0.35} ${cx - r * 0.95} ${cy - r * 0.75})`} opacity={0.55}>
              <path d={gearPath(cx - r * 0.95, cy - r * 0.75, r * 0.45, 10, false)} fill={p.surface} stroke={p.textColor} strokeWidth={3} fillRule="evenodd" />
            </g>
            <ellipse cx={cx + 20} cy={cy + r * 1.12 - bob} rx={r * 0.9} ry={r * 0.11} fill={hexA(p.textColor, 0.22)} filter="url(#bi-soft)" />
            <path d={gear} transform="translate(14 16)" fill={p.textColor} fillRule="evenodd" opacity={dark ? 0.5 : 1} />
            <path d={gear} fill="url(#bi-part)" stroke={p.textColor} strokeWidth={4} strokeLinejoin="round" fillRule="evenodd" />
            <circle cx={cx} cy={cy} r={r * 0.3} fill="none" stroke={p.textColor} strokeWidth={4} />
            <circle cx={cx} cy={cy} r={r * 0.25} fill="none" stroke={p.pop} strokeWidth={10} />
            <path d={burr(r)} transform={`translate(${fx} ${fy}) rotate(${burrRot})`} fill={p.accent2} />
          </g>

          {/* ── The loupe ── */}
          <g opacity={clamp(ringDraw * 3)}>
            <circle cx={lx + 12} cy={ly + bob + 14} r={R + 14} fill={p.textColor} opacity={dark ? 0.45 : 0.9 * ringDraw} />
            <circle cx={lx} cy={ly + bob} r={R} fill={dark ? '#EDE8FF' : '#FBF9FF'} />
            <g clipPath="url(#bi-lens)">
              <g transform={`translate(0 ${bob}) translate(${lx} ${ly}) scale(${mag}) translate(${-lx} ${-ly})`}>
                <path d={gear} fill={p.surface} stroke={p.textColor} strokeWidth={4 / mag} fillRule="evenodd" />
                {Array.from({ length: 8 }, (_, i) => (
                  <circle key={i} cx={cx} cy={cy} r={r * (0.86 + i * 0.016)} fill="none" stroke={hexA(p.textColor, 0.12)} strokeWidth={2 / mag} />
                ))}
                <path d={burr(r)} transform={`translate(${fx} ${fy}) rotate(${burrRot})`} fill={p.accent2} stroke={p.textColor} strokeWidth={1.5 / mag} strokeLinejoin="round" />
              </g>
              <line x1={lx - R} y1={ly + bob} x2={lx + R} y2={ly + bob} stroke={hexA(p.accent, 0.4)} strokeWidth={2} />
              <line x1={lx} y1={ly + bob - R} x2={lx} y2={ly + bob + R} stroke={hexA(p.accent, 0.4)} strokeWidth={2} />
              <ellipse cx={lx - R * 0.38} cy={ly + bob - R * 0.45} rx={R * 0.3} ry={R * 0.12} transform={`rotate(-30 ${lx - R * 0.38} ${ly + bob - R * 0.45})`} fill="#ffffff" opacity={0.65} />
            </g>
            <circle cx={lx} cy={ly + bob} r={R} fill="none" stroke={p.accent} strokeWidth={26} strokeDasharray={`${C * ringDraw} ${C}`} transform={`rotate(-90 ${lx} ${ly + bob})`} strokeLinecap="round" />
            <circle cx={lx} cy={ly + bob} r={R + 14} fill="none" stroke={p.textColor} strokeWidth={3} opacity={ringDraw} />
            {Array.from({ length: 48 }, (_, i) => {
              const a = (i / 48) * Math.PI * 2 + frame * 0.004;
              const l = i % 6 === 0 ? 16 : 8;
              const r0 = R + 22;
              return <line key={i} x1={lx + Math.cos(a) * r0} y1={ly + bob + Math.sin(a) * r0} x2={lx + Math.cos(a) * (r0 + l)} y2={ly + bob + Math.sin(a) * (r0 + l)} stroke={p.textColor} strokeWidth={2.5} opacity={ringDraw} />;
            })}
          </g>

          {/* ── The find: ring pops round the burr, shockwave, callout ── */}
          {frame >= FOUND && (
            <g>
              <circle cx={lx} cy={ly + bob} r={R + 40 + shock * 260} fill="none" stroke={p.accent2} strokeWidth={mix(10, 1, shock)} opacity={(1 - shock) * 0.8} />
              <circle cx={lx} cy={ly + bob} r={46 * found} fill="none" stroke={p.accent2} strokeWidth={9} strokeDasharray="22 11" transform={`rotate(${frame * 0.8} ${lx} ${ly + bob})`} />
              <path
                d={`M${lx - 40},${ly + bob - 48} Q${lx - R * 0.35},${ly + bob - R * 1.25} ${lx - R * 0.95},${ly + bob - R * 1.3}`}
                fill="none"
                stroke={p.accent2}
                strokeWidth={6}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={`${prog(frame, FOUND + 4, 18, ease.out)} 1`}
              />
            </g>
          )}
        </svg>
        {frame >= FOUND && (
          <div
            style={{
              position: 'absolute',
              right: W - (lx - R * 1.05),
              top: ly + bob - R * 1.3 - 70,
              textAlign: 'right',
              fontFamily: FONTS.caveat,
              fontWeight: 700,
              fontSize: 76,
              color: p.textColor,
              rotate: '-6deg',
              whiteSpace: 'nowrap',
            }}
          >
            {typed(frame, FOUND + 10, FPS, 18, p.note)}
          </div>
        )}

        {/* Optional booth photo: a tilted print under the part */}
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              left: 1150,
              top: 760,
              width: 380,
              height: 250,
              padding: 12,
              background: '#FBF9FF',
              border: `3px solid ${p.textColor}`,
              boxShadow: `8px 10px 0 ${p.textColor}`,
              borderRadius: 18,
              rotate: `${mix(10, -4, prog(frame, EVENT + 30, 30, ease.out))}deg`,
              opacity: prog(frame, EVENT + 30, 16),
              translate: `0 ${mix(60, 0, prog(frame, EVENT + 30, 30, ease.out))}px`,
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
          </div>
        )}

        {/* ── Copy column ── */}
        <div
          style={{
            position: 'absolute',
            left: X,
            top: 150,
            fontFamily: FONTS.caveat,
            fontWeight: 700,
            fontSize: 58,
            color: p.accent,
            opacity: prog(frame, HIT - 6, 20),
            translate: `${mix(-30, 0, prog(frame, HIT - 6, 26))}px 0`,
          }}
        >
          {p.eyebrow}
        </div>
        {frame >= HIT && (
          <>
            <SweepReveal frame={frame} start={HIT + 2} dur={36} style={headStyle}>
              <span style={{ backgroundImage: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: 12 }}>{p.headline}</span>
            </SweepReveal>
            <Glint frame={frame} start={CTA + 6} dur={50} style={headStyle}>
              {p.headline}
            </Glint>
          </>
        )}
        <WordsIn
          text={p.subline}
          frame={frame}
          start={HIT + T.beats(1)}
          style={{ position: 'absolute', left: X, top: 456, width: colW, fontSize: 46, fontWeight: 300, opacity: 0.9 }}
        />

        {/* Event card */}
        <div style={{ position: 'absolute', left: X, top: 580, width: colW }}>
          <div
            style={{
              ...displayFace(p.font),
              fontSize: 56,
              letterSpacing: '-0.01em',
              opacity: prog(frame, EVENT, 20),
              translate: `0 ${mix(30, 0, prog(frame, EVENT, 30))}px`,
            }}
          >
            {p.eventName}
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 30, transformOrigin: 'left' }}>
            {chip(p.date, EVENT + T.beats(1), p.accent)}
            {chip(p.booth, EVENT + T.beats(2), p.pop)}
          </div>
        </div>

        {/* CTA lands on bar 4 */}
        <div
          style={{
            position: 'absolute',
            left: X,
            top: 840,
            padding: '24px 44px',
            borderRadius: 999,
            fontWeight: 500,
            fontSize: 46,
            color: dark ? p.background : '#FBF9FF',
            background: p.accent,
            border: `3px solid ${p.textColor}`,
            boxShadow: `7px 8px 0 ${p.textColor}`,
            whiteSpace: 'pre',
            scale: String(prog(frame, CTA, 26, ease.backOut)),
            transformOrigin: 'left center',
            opacity: clamp(prog(frame, CTA, 10) * 1.2),
          }}
        >
          {p.cta}
        </div>
      </AbsoluteFill>

      {/* Downbeat bloom */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 40%, ${hexA(p.accent2, flash * 0.55)} 0%, transparent 55%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
