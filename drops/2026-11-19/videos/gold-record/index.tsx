import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Gold Record',
  category: 'milestone',
  description: 'Milestone story: a vinyl spins up, the tonearm drops on the beat and the record turns gold as your number counts up in neon. Thank-you line, LED meters and a CTA.',
  tags: ['milestone', 'story', 'record', 'thank you', 'neon', 'ads'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Milestone unlocked'),
  amount: text('Number (prefix + digits + suffix)').default('$50M'),
  label: text('What it counts').default('in ad spend mixed by our agents'),
  message: textarea().default('Thank you to the 2,400 teams who let Crossfade ride the faders.'),
  signature: text().default('The Crossfade crew'),
  cta: text('Call to action').default('crossfade.ai/50m'),
  recordLabel: text('Record label text').default('CROSSFADE'),
  labelImage: image('Record label image (optional)').default(''),
  background: color().default('#2B1B2E'),
  accent: color().default('#FF8E5E'),
  accent2: color('Second light').default('#E5487A'),
  gold: color('Gold').default('#FFD27F'),
  textColor: color('Text').default('#FFE9D6'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { background: '#12001F', accent: '#B026FF', accent2: '#FF2E88', gold: '#FFD600', textColor: '#FBEFFF', amount: '10,000', label: 'campaigns launched on autopilot' },
  'cherry-cola': { background: '#2A0A10', accent: '#E3173E', accent2: '#F5C6AA', gold: '#F7B32B', textColor: '#FFE8E0', amount: '31', label: 'ad platforms, one agent', eyebrow: 'Now live on', message: 'Pinterest, Snap and Amazon DSP just joined the mix.' },
  'ink-gold': { background: '#0D0D0F', accent: '#C9A45C', accent2: '#6E6A62', gold: '#E8D9B5', textColor: '#F3EDE2', amount: '4.1x', label: 'average ROAS in year one', eyebrow: 'One year of Crossfade' },
};

type P = z.infer<typeof schema>;

const IMPACT = T.bars(1); // record turns gold on the downbeat of bar 2
const DROP = T.beats(3); // needle drops on beat 3 of bar 1

/** Splits "$50M" into prefix, number and suffix so the digits can count up. */
function countUp(amount: string, t: number) {
  const m = amount.match(/^(\D*)([\d.,]+)(.*)$/);
  if (!m) return amount;
  const raw = m[2].replace(/,/g, '');
  const target = parseFloat(raw);
  if (!Number.isFinite(target)) return amount;
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  const v = target * t;
  const body = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
  return `${m[1]}${t >= 1 ? m[2] : body}${m[3]}`;
}

function Record({ cx, cy, r, frame, p }: { cx: number; cy: number; r: number; frame: number; p: P }) {
  const spin = frame * mix(1.2, 3.6, prog(frame, 0, DROP, ease.inOutSoft));
  const goldT = prog(frame, IMPACT - 2, 18, ease.out);
  const track = prog(frame, DROP, T.bars(3.2), ease.linear); // needle moving inward
  const grooveR = mix(r * 0.93, r * 0.5, track);
  const grooveOn = frame >= DROP ? 1 : 0;
  // Tonearm: swings in on beat 2, drops on beat 3, then tracks inward.
  const swing = keys(frame, [T.beats(1.6), DROP - 4, DROP], [-26, 6, 9], [ease.inOut, ease.out]);
  const armAngle = frame < DROP ? swing : mix(9, 26, track);
  const lift = frame < DROP ? 1 - prog(frame, DROP - 8, 8, ease.in) : 0;
  const px = cx + r * 0.98;
  const py = cy - r * 0.98;
  const armLen = r * 1.12;
  return (
    <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
      <defs>
        <radialGradient id="gr-vinyl">
          <stop offset="0" stopColor="#24161F" />
          <stop offset="1" stopColor="#0E080C" />
        </radialGradient>
        <linearGradient id="gr-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF4D6" />
          <stop offset="0.35" stopColor={p.gold} />
          <stop offset="0.7" stopColor={p.accent} />
          <stop offset="1" stopColor={p.gold} />
        </linearGradient>
        <clipPath id="gr-label">
          <circle cx={cx} cy={cy} r={r * 0.33} />
        </clipPath>
        <filter id="gr-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {/* glow behind */}
      <circle cx={cx} cy={cy} r={r * 1.08} fill={hexA(p.gold, 0.35 * goldT)} filter="url(#gr-glow)" />
      <circle cx={cx + r * 0.04} cy={cy + r * 0.07} r={r} fill="#000" opacity={0.4} filter="url(#gr-glow)" />
      {/* vinyl, then the gold pressing fading over it */}
      <circle cx={cx} cy={cy} r={r} fill="url(#gr-vinyl)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#gr-gold)" opacity={goldT} />
      <g transform={`rotate(${spin} ${cx} ${cy})`}>
        {Array.from({ length: 34 }, (_, i) => {
          const rr = r * (0.38 + (i / 33) * 0.6);
          return <circle key={i} cx={cx} cy={cy} r={rr} fill="none" stroke={goldT > 0.5 ? hexA('#5A3A10', 0.25) : hexA('#ffffff', 0.05 + rand(i) * 0.05)} strokeWidth={i % 6 === 0 ? 3 : 1.2} />;
        })}
        {/* lit groove under the needle */}
        <circle cx={cx} cy={cy} r={grooveR} fill="none" stroke={p.accent} strokeWidth={4} opacity={grooveOn * (1 - goldT * 0.5)} />
        <circle cx={cx} cy={cy} r={grooveR} fill="none" stroke={p.accent} strokeWidth={14} opacity={grooveOn * 0.35} filter="url(#gr-glow)" />
        {/* label */}
        <circle cx={cx} cy={cy} r={r * 0.33} fill={p.accent2} />
        {p.labelImage ? (
          <image href={p.labelImage} x={cx - r * 0.33} y={cy - r * 0.33} width={r * 0.66} height={r * 0.66} preserveAspectRatio="xMidYMid slice" clipPath="url(#gr-label)" />
        ) : (
          <>
            <circle cx={cx} cy={cy} r={r * 0.27} fill="none" stroke={hexA(p.textColor, 0.35)} strokeWidth={2} />
            <text x={cx} y={cy - r * 0.11} textAnchor="middle" fontFamily={FONTS.spacemono} fontWeight={700} fontSize={r * 0.07} letterSpacing={r * 0.012} fill={p.textColor}>
              {p.recordLabel}
            </text>
            <text x={cx} y={cy + r * 0.17} textAnchor="middle" fontFamily={FONTS.spacemono} fontSize={r * 0.045} letterSpacing={r * 0.01} fill={hexA(p.textColor, 0.8)}>
              SIDE A · 120 BPM
            </text>
          </>
        )}
      </g>
      {/* static sheen: light doesn't spin with the record */}
      <path d={`M${cx} ${cy} L${cx - r * 0.5} ${cy - r * 0.87} A${r} ${r} 0 0 1 ${cx + r * 0.17} ${cy - r * 0.98} Z`} fill={hexA('#ffffff', 0.07 + goldT * 0.18)} />
      <path d={`M${cx} ${cy} L${cx + r * 0.5} ${cy + r * 0.87} A${r} ${r} 0 0 1 ${cx - r * 0.17} ${cy + r * 0.98} Z`} fill={hexA('#ffffff', 0.05 + goldT * 0.12)} />
      <circle cx={cx} cy={cy} r={r * 0.025} fill={p.background} />
      {/* tonearm */}
      <g transform={`rotate(${armAngle} ${px} ${py})`}>
        <line x1={px} y1={py} x2={px} y2={py + armLen} stroke={hexA('#000000', 0.35)} strokeWidth={14} strokeLinecap="round" transform={`translate(10 ${14 + lift * 16})`} />
        <line x1={px} y1={py} x2={px} y2={py + armLen} stroke={p.textColor} strokeWidth={12} strokeLinecap="round" />
        <rect x={px - 22} y={py + armLen - 10} width={44} height={64} rx={8} fill={p.textColor} />
        <rect x={px - 14} y={py + armLen + 30} width={28} height={10} rx={3} fill={p.accent} />
        <circle cx={px} cy={py} r={42} fill={hexA(p.textColor, 0.9)} />
        <circle cx={px} cy={py} r={22} fill={p.accent2} />
      </g>
    </svg>
  );
}

/** LED level meters along the bottom: kick on every beat, deterministic. */
function Meters({ frame, W, y, p, on }: { frame: number; W: number; y: number; p: P; on: number }) {
  const n = 18;
  const gap = 10;
  const bw = (W - 160 - gap * (n - 1)) / n;
  const seg = 6;
  const kick = Math.exp(-((frame % T.beat) / 9));
  return (
    <div style={{ position: 'absolute', left: 80, top: y, width: W - 160, height: 60, display: 'flex', gap, alignItems: 'flex-end', opacity: on }}>
      {Array.from({ length: n }, (_, i) => {
        const lvl = clamp(0.25 + 0.35 * Math.abs(Math.sin(frame / (14 + rand(i) * 10) + i)) + kick * (0.25 + rand(i * 3) * 0.3));
        const lit = Math.round(lvl * seg);
        return (
          <div key={i} style={{ width: bw, display: 'flex', flexDirection: 'column-reverse', gap: 3 }}>
            {Array.from({ length: seg }, (_, s) => {
              const c = s === seg - 1 ? p.gold : s >= seg - 3 ? p.accent2 : p.accent;
              return <div key={s} style={{ height: 9, borderRadius: 2, background: s < lit ? c : hexA(p.textColor, 0.07), boxShadow: s < lit && s === lit - 1 ? `0 0 12px ${c}` : undefined }} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function GoldRecord(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const cx = W / 2;
  const cy = 620;
  const r = 330;

  const enter = prog(frame, 0, 50, ease.out);
  const flash = keys(frame, [IMPACT - 2, IMPACT + 2, IMPACT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, IMPACT, 60, ease.out);
  const shake = frame >= IMPACT && frame < IMPACT + 14 ? Math.sin(frame * 3.1) * (1 - (frame - IMPACT) / 14) * 10 : 0;
  const outro = prog(frame, end - 30, 30, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));

  // Number counts up over two beats after the hit, ticking on each beat.
  const countT = prog(frame, IMPACT + 4, T.beats(2), ease.inOutSoft);
  const numIn = prog(frame, IMPACT + 2, 24, ease.out);
  const numSize = p.amount.length > 6 ? 170 : p.amount.length > 4 ? 210 : 250;
  const numY = 1000;
  const labelY = numY + numSize * 1.1 + 14;
  const numBlock = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: numY,
    textAlign: 'center' as const,
    fontFamily: FONTS.monoton,
    fontSize: numSize,
    lineHeight: 1.1,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.05, size: 44, y: -frame * 0.15, color: '255,233,214' }}
        lift={hexA(p.accent, 0.08)}
        glows={[
          { x: cx, y: cy, size: mix(900, 1500, prog(frame, IMPACT, 60)), color: hexA(p.gold, 0.4), opacity: 0.25 + prog(frame, IMPACT, 30) * 0.6 },
          { x: 120, y: 260, size: 1100, color: hexA(p.accent2, 0.45), opacity: 0.55 + 0.2 * Math.sin(frame / 40) },
          { x: W - 100, y: H - 200, size: 1200, color: hexA(p.accent, 0.4), opacity: 0.6 },
        ]}
        grain={0}
        vignette={0.5}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={60} color={p.gold} seed={8} speed={1.1} opacity={0.4} />

        {/* eyebrow */}
        <div
          style={{
            position: 'absolute',
            top: 150,
            width: W,
            textAlign: 'center',
            fontFamily: FONTS.spacemono,
            fontSize: 40,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: p.accent,
            opacity: prog(frame, 10, 24),
            translate: `0 ${mix(20, 0, prog(frame, 10, 30))}px`,
          }}
        >
          {p.eyebrow}
        </div>

        {/* the record rises in and spins up */}
        <div style={{ position: 'absolute', inset: 0, translate: `0 ${mix(700, 0, enter)}px`, rotate: `${mix(-25, 0, enter)}deg`, transformOrigin: `${cx}px ${cy}px` }}>
          <Record cx={cx} cy={cy} r={r} frame={frame} p={p} />
        </div>

        {/* impact: shockwave rings start outside the record */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <circle cx={cx} cy={cy} r={r + 20 + shock * 520} fill="none" stroke={p.gold} strokeWidth={mix(10, 1, shock)} opacity={frame >= IMPACT ? (1 - shock) * 0.8 : 0} />
          <circle cx={cx} cy={cy} r={r + 10 + prog(frame, IMPACT + 5, 70) * 380} fill="none" stroke={p.accent2} strokeWidth={3} opacity={frame >= IMPACT + 5 ? (1 - prog(frame, IMPACT + 5, 70)) * 0.6 : 0} />
          {/* after the hit, a soft gold ring pulses out of the record every two beats */}
          {frame >= IMPACT + T.beats(2) &&
            [0, 1].map((k) => {
              const u = (((frame - IMPACT + k * T.beat) % T.beats(2)) / T.beats(2));
              return <circle key={k} cx={cx} cy={cy} r={r + 12 + ease.out(u) * 240} fill="none" stroke={p.gold} strokeWidth={mix(4, 0.5, u)} opacity={(1 - u) * 0.35 * (k ? 0.6 : 1)} />;
            })}
        </svg>
        <Streaks frame={frame} start={IMPACT} dur={50} direction="out" count={160} width={W} height={H} cx={cx} cy={cy} seed={4} intensity={1} color={p.gold} highlight="#ffffff" />

        {/* the number */}
        {frame >= IMPACT && (
          <>
            <div
              style={{
                ...numBlock,
                color: p.gold,
                opacity: numIn,
                scale: String(mix(1.25, 1, numIn) * (1 + Math.exp(-((frame - IMPACT) % T.beat) / 6) * 0.03 * (countT < 1 ? 1 : 0))),
                filter: `blur(${mix(16, 0, numIn)}px)`,
                textShadow: `0 0 18px ${hexA(p.accent, 0.9)}, 0 0 60px ${hexA(p.accent2, 0.6)}`,
              }}
            >
              {countUp(p.amount, countT)}
            </div>
            <Glint frame={frame} start={T.bars(3)} dur={44} style={numBlock}>
              {p.amount}
            </Glint>
          </>
        )}
        <WordsIn
          text={p.label}
          frame={frame}
          start={IMPACT + 18}
          stagger={4}
          style={{ position: 'absolute', top: labelY, left: 90, width: W - 180, justifyContent: 'center', ...displayFace('syne'), fontSize: 48, letterSpacing: '-0.01em', lineHeight: 1.15 }}
        />

        {/* bar 3: the thank-you */}
        <WordsIn
          text={p.message}
          frame={frame}
          start={T.bars(2)}
          stagger={4}
          style={{ position: 'absolute', top: 1450, left: 110, width: W - 220, justifyContent: 'center', fontSize: 44, lineHeight: 1.3, opacity: 0.86 }}
        />
        <div
          style={{
            position: 'absolute',
            top: 1592,
            width: W,
            textAlign: 'center',
            fontFamily: FONTS.spacemono,
            fontSize: 30,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: p.accent,
            opacity: prog(frame, T.bars(2) + T.beats(2), 24),
          }}
        >
          — {p.signature}
        </div>

        {/* bar 4: CTA pops on the beat */}
        <div style={{ position: 'absolute', top: 1680, width: W, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: FONTS.spacemono,
              fontSize: 40,
              padding: '20px 44px',
              borderRadius: 999,
              color: p.background,
              background: `linear-gradient(180deg, ${p.gold}, ${p.accent})`,
              boxShadow: `0 18px 50px ${hexA(p.accent, 0.45)}`,
              scale: String(prog(frame, T.bars(3) + T.beat, 26, ease.backOut)),
              opacity: clamp(prog(frame, T.bars(3) + T.beat, 10)),
            }}
          >
            {p.cta}
          </div>
        </div>

        <Meters frame={frame} W={W} y={H - 92} p={p} on={prog(frame, IMPACT, 30)} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${(cy / H) * 100}%, ${hexA('#ffffff', flash)} 0%, ${hexA(p.gold, flash * 0.7)} 25%, transparent 60%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
