import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, clamp, displayFace, ease, gradientText, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Launch Countdown',
  category: 'countdown',
  description:
    'Vertical Product Hunt launch countdown: a blueprint hinge dial closes step by step, 110° → 0°, as huge serif digits count down on the beat. At zero the commit dot lights, the frame flashes and "We\'re live." sweeps in with the date and CTA.',
  tags: ['countdown', 'launch', 'story', 'product hunt', 'blueprint'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 f
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) }; // 10 s

export const schema = z.object({
  eyebrow: text().default('Launching on Product Hunt'),
  brand: text('Product').default('Latch'),
  from: num(3, 5, 1, 'Count from').default(5),
  liveLine1: text('Reveal line 1').default("We're"),
  liveLine2: text('Reveal line 2').default('live.'),
  date: text('Date & time').default('Tue · Nov 25 · 12:01 AM PT'),
  cta: text('Call to action').default('Upvote Latch →'),
  sheet: text('Title block').default('LAUNCH SHEET · REV 1'),
  font: font('Digits & headline font').default('dmserif'),
  background: color().default('#0F3B8C'),
  surface: color('Panels').default('#134AA8'),
  textColor: color('Text & lines').default('#EAF2FF'),
  lines: color('Construction lines').default('#7FB2FF'),
  pop: color('Commit dot & CTA').default('#FFDD00'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'three-two-one': { from: 3, eyebrow: 'Latch 2.0 drops in' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', textColor: '#F3EDE2', lines: '#6E6A62', pop: '#C9A45C', font: 'bodoni' },
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', textColor: '#0A0A0A', lines: '#8C8C88', pop: '#E3000F', font: 'anton', liveLine1: 'NOW', liveLine2: 'LIVE.' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};
const rad = (d: number) => (d * Math.PI) / 180;

const HX = 140, HY = 300, L = 240, R = 282;
const at = (deg: number, r: number) => [HX + Math.cos(rad(deg)) * r, HY - Math.sin(rad(deg)) * r] as const;
const DOT = at(0, R);
const lidPts = (deg: number) => {
  const [ex, ey] = at(deg, L);
  const nx = Math.cos(rad(deg + 90)) * 7, ny = -Math.sin(rad(deg + 90)) * 7;
  return `${HX - nx},${HY - ny} ${ex - nx},${ey - ny} ${ex + nx},${ey + ny} ${HX + nx},${HY + ny}`;
};
const drawn = (t: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp(t) });

const STEP = T.beats(2); // one digit per two beats
const START = T.beats(2);

/** The hinge dial: lid angle closes one step per count; ticks light as it passes. */
function Dial({ frame, p, HIT }: { frame: number; p: P; HIT: number }) {
  const ink = p.textColor;
  const ln = p.lines;
  const n = p.from;
  // angle steps down on each count, snapping with an expo-out
  let angle = 110;
  for (let k = 0; k < n; k++) angle -= (110 / n) * prog(frame, START + k * STEP + STEP - 14, 14, k === n - 1 ? ease.in : ease.out);
  angle = Math.max(0.01, angle);
  const build = prog(frame, 0, 50, ease.inOutSoft);
  const hit = frame >= HIT;
  const shock = prog(frame, HIT, 50, ease.out);
  const settle = hit ? Math.exp(-(frame - HIT) / 6) * Math.sin((frame - HIT) / 2.2) * 2.5 : 0;
  const mono = { fontFamily: FONTS.mono, fontSize: 15, letterSpacing: '0.12em', fill: ink } as const;
  const [ax, ay] = at(110, R);
  const [lx, ly] = at(angle, R + 34);
  return (
    <svg viewBox="0 0 520 400" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="lc-dot">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1={-60} y1={HY + 30} x2={580} y2={HY + 30} stroke={ln} strokeWidth="1" opacity="0.7" {...drawn(build)} />
      <line x1={HX} y1={-10} x2={HX} y2={HY + 70} stroke={ln} strokeWidth="1" opacity="0.6" {...drawn(build)} />
      {/* arc + one tick per count */}
      <path d={`M${ax},${ay} A${R},${R} 0 0 1 ${DOT[0]},${DOT[1]}`} fill="none" stroke={ink} strokeWidth="1.6" {...drawn(prog(frame, 14, 40, ease.inOutSoft))} />
      {Array.from({ length: n + 1 }, (_, k) => {
        const d = 110 - (110 / n) * k;
        const [x1, y1] = at(d, R - 10);
        const [x2, y2] = at(d, R + 12);
        const passed = angle <= d + 0.5;
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={passed && k > 0 ? p.pop : ink} strokeWidth={passed && k > 0 ? 3 : 1.6} opacity={prog(frame, 30 + k * 3, 16)} />;
      })}
      {/* ghost of the open lid */}
      <polygon points={lidPts(110)} fill="none" stroke={ln} strokeWidth="1.3" strokeDasharray="6 6" opacity={angle < 104 ? 0.8 : 0} />
      <rect x={HX - 20} y={HY} width={L + 40} height={26} rx={7} fill={hexA(p.surface, 0.9 * build)} stroke={ink} strokeWidth={2.2} {...drawn(build)} />
      <g transform={`rotate(${settle} ${HX} ${HY})`}>
        <polygon points={lidPts(angle)} fill={hexA(p.surface, 0.95 * build)} stroke={ink} strokeWidth={2.2} strokeLinejoin="round" {...drawn(prog(frame, 20, 36, ease.inOutSoft))} />
      </g>
      <circle cx={HX} cy={HY} r={11} fill={p.background} stroke={ink} strokeWidth={2.2} opacity={build} />
      <circle cx={HX} cy={HY} r={3.5} fill={ink} opacity={build} />
      {/* live angle readout riding the lid tip */}
      <g opacity={prog(frame, 40, 20) * (hit ? 1 - prog(frame, HIT, 20) : 1)}>
        <rect x={lx - 36} y={ly - 16} width={72} height={30} rx={4} fill={p.background} />
        <text x={lx} y={ly + 6} textAnchor="middle" {...mono} fontSize={20} letterSpacing="0.04em">{`${Math.round(angle)}°`}</text>
      </g>
      <circle cx={DOT[0]} cy={DOT[1]} r={13} fill="none" stroke={ink} strokeWidth="1.4" strokeDasharray="3 4" opacity={hit ? 0 : build} />
      {hit && (
        <>
          <circle cx={DOT[0]} cy={DOT[1]} r={56 * (1 + 0.08 * Math.sin((frame - HIT) / 9))} fill="url(#lc-dot)" />
          <circle cx={DOT[0]} cy={DOT[1]} r={22 + shock * 220} fill="none" stroke={p.pop} strokeWidth={mix(5, 0.6, shock)} opacity={1 - shock} />
          <circle cx={DOT[0]} cy={DOT[1]} r={mix(4, 14, prog(frame, HIT, 10, ease.backOut))} fill={p.pop} stroke={p.background} strokeWidth="3" />
        </>
      )}
      <g opacity={prog(frame, 50, 20) * (1 - prog(frame, HIT, 14))} transform="translate(310 352)">
        <rect width={200} height={44} fill="none" stroke={ink} strokeWidth="1.3" />
        <line x1={0} y1={22} x2={200} y2={22} stroke={ink} strokeWidth="0.8" />
        <text x={10} y={16} {...mono} fontSize={11}>{p.sheet}</text>
        <text x={10} y={38} {...mono} fontSize={10} opacity={0.75}>{`T-MINUS ${p.from}`}</text>
      </g>
    </svg>
  );
}

function Digit({ n, frame, at: s, p, cy }: { n: number; frame: number; at: number; p: P; cy: number }) {
  const local = frame - s;
  if (local < -4 || local > STEP + 8) return null;
  const inT = prog(frame, s, 12, ease.out);
  const outT = prog(frame, s + STEP - 10, 12, ease.in);
  const SIZE = 620;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: cy - SIZE * 0.55,
        textAlign: 'center',
        ...displayFace(p.font, { italic: false }),
        fontSize: SIZE,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        ...gradientText(`linear-gradient(170deg, ${p.textColor} 30%, ${p.lines} 120%)`, SIZE),
        scale: String(mix(1.25, 1, inT) * mix(1, 0.9, outT)),
        translate: `0 ${mix(0, -40, outT)}px`,
        opacity: inT * (1 - outT),
        filter: `blur(${mix(16, 0, inT) + outT * 12}px)`,
      }}
    >
      {n}
    </div>
  );
}

export default function LaunchCountdown(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const HIT = START + p.from * STEP;
  const end = video.durationInFrames;

  const dw = 900;
  const dh = dw * (400 / 520);
  const dl = (W - dw) / 2 + 40;
  const dtop = 420;
  const dotX = dl + (DOT[0] / 520) * dw;
  const dotY = dtop + (DOT[1] / 400) * dh;

  const flash = keys(frame, [HIT - 1, HIT + 2, HIT + 26], [0, 1, 0], [ease.out, ease.outSoft]);
  const shake = frame >= HIT ? Math.exp(-(frame - HIT) / 7) * 10 : 0;
  const push = mix(1, 1.05, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 30, 30, ease.inOut);
  // build-up: the beat pulse in the grid gets stronger as zero approaches
  const urgency = prog(frame, START, HIT - START, ease.inSoft);
  const beatPulse = frame < HIT ? Math.max(0, 1 - ((frame - START) % T.beat) / 14) * urgency : 0;
  const cell = 36;
  const digitsY = 1400;
  const liveY = 1340; // the reveal sits a little higher than the digits to clear the date line
  const LIVE = Math.min(300, (W - 160) / (Math.max(p.liveLine1.length, p.liveLine2.length, 3) * 0.5));

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.bricolage }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={false}
        lift={dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: dotX, y: dotY, size: mix(500, 1300, prog(frame, HIT, 40)), color: hexA(p.pop, 0.35), opacity: frame >= HIT ? 0.75 + 0.15 * Math.sin(frame / 30) : 0.15 + urgency * 0.25 },
          { x: W / 2, y: digitsY, size: 1300, color: hexA(p.lines, dark ? 0.35 : 0.2), opacity: 0.5 + beatPulse * 0.4 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      >
        <div
          style={{
            position: 'absolute',
            inset: -cell * 5,
            translate: `0 ${(-frame * 0.3) % (cell * 5)}px`,
            opacity: prog(frame, 0, 40) * (0.85 + beatPulse * 0.5),
            backgroundImage: [
              `linear-gradient(${hexA(p.lines, 0.22)} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${hexA(p.lines, 0.22)} 1px, transparent 1px)`,
              `linear-gradient(${hexA(p.lines, 0.08)} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${hexA(p.lines, 0.08)} 1px, transparent 1px)`,
            ].join(','),
            backgroundSize: `${cell * 5}px ${cell * 5}px, ${cell * 5}px ${cell * 5}px, ${cell}px ${cell}px, ${cell}px ${cell}px`,
          }}
        />
        <div style={{ position: 'absolute', inset: 30, border: `1px solid ${hexA(p.textColor, 0.3)}`, opacity: prog(frame, 6, 30) }} />
      </Backdrop>

      <AbsoluteFill style={{ scale: String(push), translate: `${Math.sin(frame * 1.7) * shake}px ${Math.cos(frame * 2.3) * shake}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={45} color={p.lines} seed={8} speed={mix(0.6, 1.3, urgency)} opacity={0.35} maxSize={4} />

        {/* header: logo + eyebrow + brand */}
        <div style={{ position: 'absolute', left: 90, right: 90, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          {p.logo && <Img src={p.logo} style={{ height: 90, objectFit: 'contain', opacity: prog(frame, 4, 20) }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONTS.mono, fontSize: 32, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: prog(frame, 6, 20), translate: `0 ${mix(16, 0, prog(frame, 6, 24))}px` }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: p.pop, boxShadow: `0 0 16px ${p.pop}` }} />
            {p.eyebrow}
          </div>
          <SweepReveal frame={frame} start={12} dur={30} style={{ ...displayFace(p.font, { italic: true }), fontSize: 120, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {p.brand}
          </SweepReveal>
        </div>

        <div style={{ position: 'absolute', left: dl, top: dtop, width: dw, height: dh }}>
          <Dial frame={frame} p={p} HIT={HIT} />
        </div>

        {/* countdown digits */}
        {Array.from({ length: p.from }, (_, k) => (
          <Digit key={k} n={p.from - k} frame={frame} at={START + k * STEP} p={p} cy={digitsY} />
        ))}

        {/* reveal */}
        {frame >= HIT && (
          <>
            <SweepReveal frame={frame} start={HIT + 4} dur={30} style={{ position: 'absolute', left: 0, right: 0, top: liveY - LIVE * 1.05, textAlign: 'center', ...displayFace(p.font, { italic: false }), fontSize: LIVE, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
              {p.liveLine1}
            </SweepReveal>
            <SweepReveal frame={frame} start={HIT + 12} dur={30} style={{ position: 'absolute', left: 0, right: 0, top: liveY - LIVE * 0.1, textAlign: 'center', ...displayFace(p.font, { italic: true }), fontSize: LIVE, lineHeight: 0.95, letterSpacing: '-0.03em', color: p.pop }}>
              {p.liveLine2}
            </SweepReveal>
            <Glint frame={frame} start={HIT + T.bars(1)} dur={44} style={{ position: 'absolute', left: 0, right: 0, top: liveY - LIVE * 1.05, textAlign: 'center', ...displayFace(p.font, { italic: false }), fontSize: LIVE, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
              {p.liveLine1}
            </Glint>
          </>
        )}

        {/* footer: date (always), CTA pops on the beat after the hit */}
        <div style={{ position: 'absolute', left: 80, right: 80, top: 1660, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 40, letterSpacing: '0.08em', opacity: prog(frame, 20, 24), whiteSpace: 'nowrap' }}>{p.date}</div>
          <div
            style={{
              padding: '22px 44px',
              borderRadius: 12,
              fontFamily: FONTS.mono,
              fontWeight: 700,
              fontSize: 44,
              color: isDark(p.pop) ? '#FFFFFF' : '#0A1B3F',
              background: p.pop,
              boxShadow: `8px 8px 0 ${dark ? 'rgba(0,0,0,0.35)' : p.textColor}`,
              scale: String(prog(frame, HIT + T.beats(2), 24, ease.backOut)),
              opacity: clamp(prog(frame, HIT + T.beats(2), 8)),
            }}
          >
            {p.cta}
          </div>
        </div>
        <Streaks frame={frame} start={HIT} dur={46} direction="out" count={130} width={W} height={H} cx={dotX} cy={dotY} seed={12} intensity={1} color={p.pop} highlight={p.textColor} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${dotX}px ${dotY}px, ${hexA('#ffffff', flash * 0.9)} 0%, ${hexA(p.pop, flash * 0.55)} 20%, transparent 60%)`, mixBlendMode: 'screen', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.35 : 0.05} frame={frame} />
    </AbsoluteFill>
  );
}
