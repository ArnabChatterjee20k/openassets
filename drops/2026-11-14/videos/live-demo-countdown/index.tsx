import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Streaks, SweepReveal, clamp, displayFace, ease, hexA, keys, mix, prog, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Live Demo Countdown',
  category: 'countdown',
  description:
    'Vertical story countdown for a launch livestream: a drafting compass scribes a full circle around each huge 3 · 2 · 1, then a highlighter flash reveals "We\'re live", the host photo in the compass ring and the join link.',
  tags: ['countdown', 'livestream', 'story', 'blueprint', 'webinar', 'launch'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120. 4.5 bars = 9 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.beats(18) };

export const schema = z.object({
  eyebrow: text().default('thu nov 20 · 11:00 pt'),
  title: text().default('Live demo'),
  subtitle: text().default('Watch Plotwell plan and launch a campaign on 33 platforms.'),
  liveText: text('Reveal headline').default("We're live"),
  host: text('Host line').default('with Maya Okafor, Head of Growth'),
  cta: text('Call to action').default('Join at plotwell.ai/live'),
  hostPhoto: image('Host photo (optional)').default(''),
  background: color().default('#0F3B8C'),
  surface: color('Panel').default('#134AA8'),
  ink: color('Text & lines').default('#EAF2FF'),
  line: color('Grid').default('#7FB2FF'),
  pop: color('Highlighter').default('#FFDD00'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  whiteprint: { background: '#F1EEE4', surface: '#E7E2D4', ink: '#173F9A', line: '#173F9A', pop: '#FFDD00' },
  'ink & gold': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', line: '#C9A45C', pop: '#E8D9B5', title: 'Keynote', eyebrow: 'dec 3 · 9:00 am pt', subtitle: 'The Plotwell 3 keynote, streamed from SF.' },
  'planning clinic': {
    background: '#2B1B2E',
    surface: '#45293F',
    ink: '#FFE9D6',
    line: '#FF8E5E',
    pop: '#FFD27F',
    title: 'Q4 clinic',
    eyebrow: 'every tuesday · 4 pm et',
    subtitle: 'Bring your holiday plan. Our agent redraws it live.',
    liveText: 'Doors open',
    host: 'with the Plotwell growth team',
    cta: 'Save a seat at plotwell.ai/clinic',
  },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const W = 1080;
const H = 1920;
const CX = W / 2;
const CY = 1085;
const R = 310;
const COUNT0 = T.bars(1); // 3 lands on bar 2
const STEP = T.beats(2);
const HIT = COUNT0 + STEP * 3; // 300: we're live
const END = video.durationInFrames;

function Grid({ frame, p }: { frame: number; p: P }) {
  const step = 90;
  const drift = (frame * 0.3) % step;
  const op = isDark(p.background) ? 0.22 : 0.18;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(0 ${-drift})`} stroke={p.line} strokeWidth={1.2}>
        {Array.from({ length: Math.ceil(W / step) + 1 }, (_, i) => {
          const t = prog(frame, 2 + Math.abs(i * step - CX) / 30, 40);
          return <line key={`v${i}`} x1={i * step} y1={CY - (CY + step) * t} x2={i * step} y2={CY + (H - CY + step * 2) * t} strokeOpacity={op} />;
        })}
        {Array.from({ length: Math.ceil(H / step) + 2 }, (_, j) => {
          const t = prog(frame, 6 + Math.abs(j * step - CY) / 50, 40);
          return <line key={`h${j}`} x1={CX - CX * t} y1={j * step} x2={CX + CX * t} y2={j * step} strokeOpacity={op} />;
        })}
      </g>
    </svg>
  );
}

/** The compass ring: ticks, a scribed arc that sweeps a full turn per step, and the compass arm. */
function CompassRing({ frame, p }: { frame: number; p: P }) {
  const appear = prog(frame, 40, 50, ease.out);
  const counting = frame >= COUNT0 && frame < HIT;
  const local = counting ? ((frame - COUNT0) % STEP) / STEP : frame >= HIT ? 1 : 0;
  const sweep = counting ? ease.inOutSoft(local) : frame >= HIT ? 1 : 0;
  const angle = -90 + sweep * 360;
  const a = (angle * Math.PI) / 180;
  const lx = CX + Math.cos(a) * R;
  const ly = CY + Math.sin(a) * R;
  const hitPulse = prog(frame, HIT, 50, ease.out);
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {/* construction circle + ticks */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={p.ink} strokeOpacity={0.3} strokeWidth={2} strokeDasharray="4 10" opacity={appear} />
      {Array.from({ length: 60 }, (_, i) => {
        const ta = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const long = i % 5 === 0;
        const r1 = R + 22;
        const r2 = R + (long ? 56 : 36);
        const on = prog(frame, 40 + i * 0.8, 12);
        return <line key={i} x1={CX + Math.cos(ta) * r1} y1={CY + Math.sin(ta) * r1} x2={CX + Math.cos(ta) * r2} y2={CY + Math.sin(ta) * r2} stroke={p.ink} strokeWidth={long ? 3 : 1.5} strokeOpacity={on * (long ? 0.9 : 0.5)} />;
      })}
      {/* scribed arc */}
      {(counting || frame >= HIT) && (
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={frame >= HIT ? p.pop : p.ink}
          strokeWidth={frame >= HIT ? 8 : 6}
          pathLength={1}
          strokeDasharray={`${sweep} 1`}
          transform={`rotate(-90 ${CX} ${CY})`}
          strokeLinecap="round"
        />
      )}
      {/* compass arm from the centre to the lead */}
      {counting && (
        <g>
          <line x1={CX} y1={CY} x2={lx} y2={ly} stroke={p.ink} strokeWidth={3} strokeOpacity={0.55} />
          <circle cx={CX} cy={CY} r={10} fill={p.background} stroke={p.ink} strokeWidth={3} />
          <circle cx={lx} cy={ly} r={26} fill={p.pop} opacity={0.3} />
          <circle cx={lx} cy={ly} r={12} fill={p.pop} />
        </g>
      )}
      {/* shockwave on the hit, starting outside the ring */}
      {frame >= HIT && (
        <>
          <circle cx={CX} cy={CY} r={R + 70 + hitPulse * 520} fill="none" stroke={p.pop} strokeWidth={mix(10, 1, hitPulse)} opacity={(1 - hitPulse) * 0.8} />
          <circle cx={CX} cy={CY} r={R + 70 + prog(frame, HIT + 6, 60) * 380} fill="none" stroke={p.ink} strokeWidth={2} opacity={(1 - prog(frame, HIT + 6, 60)) * 0.5} />
        </>
      )}
    </svg>
  );
}

function Digit({ n, frame, at, p }: { n: number; frame: number; at: number; p: P }) {
  if (frame < at - 4 || frame > at + STEP + 4) return null;
  const inT = prog(frame, at, 14, ease.out);
  const outT = prog(frame, at + STEP - 10, 12, ease.in);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: W,
        top: CY - 300,
        height: 600,
        display: 'grid',
        placeItems: 'center',
        ...displayFace('syne'),
        fontSize: 440,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        color: p.ink,
        opacity: inT * (1 - outT),
        scale: String(mix(1.25, 1, inT) * mix(1, 0.85, outT)),
        filter: `blur(${mix(16, 0, inT) + outT * 12}px)`,
      }}
    >
      {n}
    </div>
  );
}

export default function LiveDemoCountdown(p: P) {
  const frame = useCurrentFrame();
  const dark = isDark(p.background);
  const onPop = dark ? p.background : p.ink;
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shake = frame >= HIT && frame < HIT + 16 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 16) * 10 : 0;
  const push = mix(1, 1.05, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 30, 30, ease.in);
  const count = frame >= COUNT0 && frame < HIT ? 3 - Math.floor((frame - COUNT0) / STEP) : frame >= HIT ? 0 : 3;
  const TITLE = p.title.length > 10 ? 140 : 170;
  // Syne ExtraBold is wide (~0.8em per glyph): estimate how many lines the title takes.
  const titleLines = Math.min(2, Math.ceil((p.title.length * 0.8 * TITLE) / (W - 150)));
  const subTop = 240 + TITLE * 0.92 * titleLines + 26;
  const live = prog(frame, HIT, 22, ease.inOutSoft);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={false}
        lift={dark ? 'rgba(127,178,255,0.14)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: CX, y: CY, size: 1400, color: hexA(p.line, dark ? 0.35 : 0.16), opacity: 0.7 + 0.25 * Math.sin(frame / 30) },
          { x: CX, y: CY, size: 1200, color: hexA(p.pop, 0.25), opacity: prog(frame, HIT, 30) * (0.7 + 0.2 * Math.sin(frame / 24)) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />
      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        <Grid frame={frame} p={p} />
        <Dust frame={frame} width={W} height={H} count={50} color={frame >= HIT ? p.pop : p.ink} seed={4} speed={0.8} opacity={0.35} maxSize={5} />
        <Streaks frame={frame} start={HIT} dur={50} direction="out" count={120} width={W} height={H} cx={CX} cy={CY} seed={6} intensity={0.9} color={p.pop} highlight={p.ink} />

        {/* Header: eyebrow types, title sweeps in */}
        <div style={{ position: 'absolute', left: 90, top: 150, fontFamily: FONTS.majormono, fontSize: 40, letterSpacing: '0.06em', color: p.ink, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: frame >= HIT ? p.pop : 'transparent', border: `3px solid ${p.pop}`, opacity: Math.floor(frame / 15) % 2 || frame >= HIT ? 1 : 0.35 }} />
          {typed(frame, 8, FPS, 30, p.eyebrow.toLowerCase())}
        </div>
        <SweepReveal frame={frame} start={20} dur={34} style={{ position: 'absolute', left: 84, top: 230, width: W - 150, ...displayFace('syne'), fontSize: TITLE, lineHeight: 0.92, letterSpacing: '-0.045em', color: p.ink, transformOrigin: '0 0' }}>
          {p.title}
        </SweepReveal>
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: subTop,
            width: 860,
            fontFamily: FONTS.bricolage,
            fontSize: 46,
            lineHeight: 1.25,
            opacity: prog(frame, 50, 24) * (1 - prog(frame, HIT - 10, 14) * 0.0),
            translate: `0 ${mix(24, 0, prog(frame, 50, 30))}px`,
          }}
        >
          {p.subtitle}
        </div>

        <CompassRing frame={frame} p={p} />

        {/* Pre-count: the starting digit sits ghosted inside the ring */}
        {frame < COUNT0 && (
          <div style={{ position: 'absolute', left: 0, width: W, top: CY - 300, height: 600, display: 'grid', placeItems: 'center', ...displayFace('syne'), fontSize: 440, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${hexA(p.ink, 0.5)}`, opacity: prog(frame, 60, 30) }}>
            3
          </div>
        )}
        {[3, 2, 1].map((n, i) => (
          <Digit key={n} n={n} frame={frame} at={COUNT0 + i * STEP} p={p} />
        ))}

        {/* Dimension readout under the ring */}
        <div style={{ position: 'absolute', left: 0, width: W, top: CY + R + 80, textAlign: 'center', fontFamily: FONTS.majormono, fontSize: 40, color: p.ink, opacity: prog(frame, 70, 20) * (frame < HIT ? 1 : 0) }}>
          t − 00:00:0{count}
        </div>

        {/* Hit: host photo (or "on air" mark) inside the ring */}
        {frame >= HIT && (
          <div
            style={{
              position: 'absolute',
              left: CX - (R - 40),
              top: CY - (R - 40),
              width: (R - 40) * 2,
              height: (R - 40) * 2,
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'grid',
              placeItems: 'center',
              background: p.hostPhoto ? p.surface : 'transparent',
              border: p.hostPhoto ? `6px solid ${p.ink}` : undefined,
              scale: String(mix(0.6, 1, prog(frame, HIT, 30, ease.backOut))),
              opacity: clamp(prog(frame, HIT, 10)),
            }}
          >
            {p.hostPhoto ? (
              <Img src={p.hostPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ ...displayFace('syne'), fontSize: 175, lineHeight: 0.9, letterSpacing: '-0.05em', color: p.ink }}>on</div>
                <div style={{ ...displayFace('syne'), fontSize: 175, lineHeight: 0.9, letterSpacing: '-0.05em', color: p.ink }}>air</div>
              </div>
            )}
          </div>
        )}

        {/* "We're live" with the highlighter swipe */}
        {frame >= HIT && (
          <div style={{ position: 'absolute', left: 0, width: W, top: CY + R + 75, textAlign: 'center' }}>
            <span
              style={{
                ...displayFace('syne'),
                fontSize: p.liveText.length > 11 ? 96 : 112,
                lineHeight: 1.1,
                letterSpacing: '-0.04em',
                padding: '0 24px',
                color: live > 0.5 ? onPop : p.ink,
                backgroundImage: `linear-gradient(${p.pop}, ${p.pop})`,
                backgroundSize: `${live * 100}% 80%`,
                backgroundPosition: '0 60%',
                backgroundRepeat: 'no-repeat',
                whiteSpace: 'nowrap',
              }}
            >
              {p.liveText}
            </span>
          </div>
        )}
        {frame >= HIT && (
          <div style={{ position: 'absolute', left: 90, width: W - 180, top: CY + R + 200, textAlign: 'center', fontFamily: FONTS.bricolage, fontSize: 46, opacity: prog(frame, HIT + 16, 20), translate: `0 ${mix(20, 0, prog(frame, HIT + 16, 26))}px` }}>
            {p.host}
          </div>
        )}
        {/* CTA on the next beat */}
        <div style={{ position: 'absolute', left: 0, width: W, top: H - 220, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: FONTS.bricolage,
              fontWeight: 800,
              fontSize: 50,
              padding: '24px 40px',
              color: dark ? p.background : '#F7F5EF',
              background: p.ink,
              boxShadow: `10px 10px 0 ${p.pop}`,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, HIT + T.beat, 24, ease.backOut)),
              opacity: clamp(prog(frame, HIT + T.beat, 8)),
            }}
          >
            {p.cta} →
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${(CY / H) * 100}%, ${hexA('#ffffff', flash * 0.7)} 0%, ${hexA(p.pop, flash * 0.6)} 25%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
