import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, ease, hexA, keys, mix, prog, rand, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Beta Lab Thank You',
  category: 'thank-you',
  description:
    'Story-format thank-you to a customer: a run log counts to 100%, "THANK YOU" bursts out of the well plate on the downbeat, the lab name sweeps in, three milestone stats tick up on the beat and a signed note closes it.',
  tags: ['thank you', 'customer', 'milestone', 'story', 'terminal'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) + T.beats(2) };

export const schema = z.object({
  logLine: text('Log line').default('run #1000 · halden-lab/kinase-screen'),
  done: text('Done label').default('complete'),
  thanks1: text('Thanks line 1').default('THANK'),
  thanks2: text('Thanks line 2').default('YOU,'),
  lab: text('Customer / lab name').default('Halden Lab'),
  stat1: z.number().min(0).max(999999).default(1000).describe(JSON.stringify({ ui: 'number', label: 'Stat 1', step: 1 })),
  stat1Label: text().default('runs on our robots'),
  stat2: z.number().min(0).max(999999).default(412).describe(JSON.stringify({ ui: 'number', label: 'Stat 2', step: 1 })),
  stat2Label: text().default('plates read'),
  stat3: z.number().min(0).max(999999).default(9800).describe(JSON.stringify({ ui: 'number', label: 'Stat 3', step: 1 })),
  stat3Label: text().default('bench hours saved'),
  note: textarea().default('You broke our robots first, and made them better. See you at run #2000.'),
  signature: text().default('— Mara & the Benchwire team, Basel'),
  logo: image('Customer logo (optional)').default(''),
  background: color().default('#0D1B1E'),
  surface: color('Panel').default('#16302F'),
  textColor: color('Text').default('#EAF4EF'),
  accent: color('Live').default('#D4FF3A'),
  accent2: color('Grid').default('#3FA7A0'),
  pop: color('Spark').default('#FF5A36'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'deep-sea': { background: '#021B26', surface: '#06303F', textColor: '#E6FFFA', accent: '#2EF2C4', accent2: '#1B7FA6', pop: '#FF7A59', lab: 'Marisol Bio' },
  risograph: { background: '#F4EFE6', surface: '#EAE2D3', textColor: '#1F2A6B', accent: '#FF48B0', accent2: '#0078BF', pop: '#FFE800', lab: 'Okafor Group' },
  ultraviolet: { background: '#12001F', surface: '#24003D', textColor: '#FBEFFF', accent: '#B026FF', accent2: '#FF2E88', pop: '#FFD600', thanks2: 'TEAM', lab: 'Kinetika Labs', stat1: 250, stat1Label: 'first runs' },
};

type P = z.infer<typeof schema>;

const HIT = T.bars(1);
const LAB_AT = HIT + T.beats(1);
const STATS_AT = T.bars(2);
const NOTE_AT = T.bars(3);
const END = video.durationInFrames;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Wells bursting out from the hit: they arc up, hang and drift down (linear drag, not plain gravity). */
function WellBurst({ frame, p, cx, cy }: { frame: number; p: P; cx: number; cy: number }) {
  const t = (frame - HIT) / FPS;
  if (t < 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {Array.from({ length: 46 }, (_, i) => {
        const a = rand(i * 2.3) * Math.PI * 2;
        const v = 900 + rand(i * 5.1) * 1300;
        const k = 2.6; // drag
        const fall = 160; // terminal velocity
        const decay = (1 - Math.exp(-k * t)) / k;
        const x = cx + Math.cos(a) * v * decay;
        const y = cy + Math.sin(a) * v * 0.8 * decay - 220 * decay + fall * Math.max(0, t - 0.25);
        const r = 7 + rand(i * 9.7) * 14;
        const life = clamp(1 - (t - 2.2) / 1.2);
        const c = i % 7 === 0 ? p.pop : i % 3 === 0 ? p.accent2 : p.accent;
        const ring = i % 4 === 1;
        return <circle key={i} cx={x} cy={y} r={r} fill={ring ? 'none' : c} stroke={ring ? c : 'none'} strokeWidth={3} opacity={life * 0.9} />;
      })}
    </svg>
  );
}

function Stat({ frame, at, value, label, p }: { frame: number; at: number; value: number; label: string; p: P }) {
  if (!label && !value) return null;
  const t = prog(frame, at, 18, ease.out);
  const count = Math.round(value * prog(frame, at, 40, ease.outSoft));
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, opacity: t, translate: `${mix(-40, 0, t)}px 0`, borderTop: `2px dashed ${hexA(p.accent2, 0.45)}`, paddingTop: 10 }}>
      <span style={{ minWidth: 380, fontFamily: FONTS.vt323, fontSize: 150, lineHeight: 0.9, color: p.accent, textShadow: isDark(p.background) ? `0 0 30px ${hexA(p.accent, 0.5)}` : undefined }}>{count.toLocaleString('en-US')}</span>
      <span style={{ fontFamily: FONTS.silkscreen, fontSize: 34, lineHeight: 1.2, letterSpacing: '0.12em', textTransform: 'uppercase', color: p.textColor }}>{label}</span>
    </div>
  );
}

export default function BetaLabThankYou(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);

  const on = prog(frame, 0, 16, ease.out);
  const offY = prog(frame, END - 30, 14, ease.in);
  const offX = prog(frame, END - 16, 12, ease.in);
  const crtY = Math.max(0.004, on * (1 - offY));
  const crtX = Math.max(0.002, 1 - offX);

  const pct = Math.min(100, Math.round(100 * prog(frame, 14, HIT - 30, ease.inOutSoft)));
  const counterOut = prog(frame, HIT - 4, 8, ease.in);
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, HIT, 70, ease.out);
  const shake = frame >= HIT && frame < HIT + 16 ? (1 - (frame - HIT) / 16) * 10 * Math.sin(frame * 2.1) : 0;
  const push = mix(1, 1.04, prog(frame, HIT, END - HIT, ease.inOutSoft));
  const thanksIn = prog(frame, HIT, 22, ease.out);
  const cursorOn = Math.floor(frame / 15) % 2 === 0;
  const heroY = 330;

  const thanksStyle = { fontFamily: FONTS.vt323, fontSize: 330, lineHeight: 0.8, color: p.textColor, whiteSpace: 'nowrap' as const };

  return (
    <AbsoluteFill style={{ backgroundColor: dark ? '#050A0B' : p.background }}>
      <AbsoluteFill style={{ scale: `${crtX} ${crtY}` }}>
        <Backdrop
          base={p.background}
          frame={frame}
          grid={{ opacity: dark ? 0.12 : 0.18, size: 54, y: -frame * 0.15, color: dark ? '63,167,160' : '31,42,107' }}
          lift={dark ? 'rgba(234,244,239,0.05)' : 'rgba(255,255,255,0.5)'}
          glows={[
            { x: W / 2, y: heroY + 260, size: 1500, color: hexA(p.accent, dark ? 0.22 : 0.18), opacity: keys(frame, [0, HIT, HIT + 40, END], [0.3, 1, 0.7, 0.6]) },
            { x: W * 0.9, y: H * 0.75, size: 1300, color: hexA(p.accent2, 0.35), opacity: 0.5 + 0.2 * Math.sin(frame / 40) },
          ]}
          grain={0}
          vignette={dark ? 0.5 : 0.1}
        />
        <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.5}px` }}>
          <Dust frame={frame} width={W} height={H} count={50} color={p.accent} seed={4} speed={0.7} opacity={dark ? 0.35 : 0.5} maxSize={5} />

          {/* log header */}
          <div style={{ position: 'absolute', left: 90, right: 90, top: 140, fontFamily: FONTS.mono, fontSize: 34, color: p.textColor, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ color: p.accent }}>$ </span>
            {typed(frame, 8, FPS, 40, p.logLine)}
            <span style={{ color: p.accent, opacity: cursorOn ? 1 : 0 }}>█</span>
          </div>
          <div style={{ position: 'absolute', left: 90, right: 90, top: 250, display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.silkscreen, fontSize: 26, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.accent2 }}>
            <span>{frame >= HIT - 16 ? <span style={{ color: p.accent }}>✓ {p.done}</span> : 'running…'}</span>
            <span>{pct}%</span>
          </div>

          {/* bar 1: the plate being read, which blows apart on the hit */}
          {frame < HIT + 20 && (
            <svg
              width={W}
              height={H}
              style={{ position: 'absolute', inset: 0, opacity: prog(frame, 10, 20) * (1 - prog(frame, HIT, 16, ease.in)), scale: String(mix(1, 1.25, prog(frame, HIT, 20, ease.in))), filter: frame > HIT ? `blur(${(frame - HIT) * 0.8}px)` : undefined }}
            >
              <rect x={110} y={980} width={860} height={600} rx={26} fill={hexA(p.surface, 0.85)} stroke={hexA(p.accent2, 0.7)} strokeWidth={3} />
              {Array.from({ length: 96 }, (_, i) => {
                const c = Math.floor(i / 8);
                const r = i % 8;
                const lit = i < Math.round((pct / 100) * 96);
                const cur = i === Math.round((pct / 100) * 96);
                return <circle key={i} cx={175 + c * 66} cy={1050 + r * 66} r={22} fill={lit ? p.accent : cur ? p.pop : 'none'} stroke={lit ? 'none' : hexA(p.accent2, 0.7)} strokeWidth={3} opacity={lit ? 0.9 : 1} />;
              })}
            </svg>
          )}
          {/* progress bar made of wells */}
          <div style={{ position: 'absolute', left: 90, right: 90, top: 210, display: 'flex', gap: 10 }}>
            {Array.from({ length: 20 }, (_, i) => {
              const lit = i < Math.round(pct / 5);
              return <div key={i} style={{ flex: 1, height: 22, borderRadius: 11, background: lit ? p.accent : 'transparent', border: `2px solid ${hexA(p.accent2, 0.6)}`, boxShadow: lit && dark ? `0 0 14px ${hexA(p.accent, 0.5)}` : undefined }} />;
            })}
          </div>

          {/* bar 1: percentage counter */}
          {frame < HIT + 4 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: heroY + 130, textAlign: 'center', fontFamily: FONTS.vt323, fontSize: 380, lineHeight: 1, color: p.textColor, opacity: (1 - counterOut) * prog(frame, 6, 16), scale: String(mix(1, 1.3, counterOut)), filter: counterOut > 0 ? `blur(${counterOut * 16}px)` : undefined }}>
              {pct}
              <span style={{ color: p.accent }}>%</span>
            </div>
          )}

          {/* hit */}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={W / 2} cy={heroY + 270} r={380 + shock * 900} fill="none" stroke={p.accent} strokeWidth={mix(10, 1, shock)} opacity={frame >= HIT ? (1 - shock) * 0.75 : 0} />
          </svg>
          <WellBurst frame={frame} p={p} cx={W / 2} cy={heroY + 270} />

          {frame >= HIT && (
            <div style={{ position: 'absolute', left: 90, top: heroY, opacity: thanksIn, scale: String(mix(1.12, 1, thanksIn)), transformOrigin: 'left top', filter: thanksIn < 1 ? `blur(${(1 - thanksIn) * 12}px)` : undefined }}>
              <div style={{ position: 'relative' }}>
                <div style={{ ...thanksStyle, textShadow: dark ? `0 0 50px ${hexA(p.accent2, 0.5)}` : undefined }}>{p.thanks1}</div>
                <Glint frame={frame} start={STATS_AT - 10} dur={44} style={{ ...thanksStyle, position: 'absolute', inset: 0 }}>
                  {p.thanks1}
                </Glint>
              </div>
              <div style={{ ...thanksStyle, color: p.accent, textShadow: dark ? `0 0 50px ${hexA(p.accent, 0.55)}` : undefined }}>
                {p.thanks2}
                <span style={{ display: 'inline-block', width: 120, height: 210, marginLeft: 24, background: p.accent, opacity: cursorOn ? 1 : 0.15, verticalAlign: '-0.08em' }} />
              </div>
            </div>
          )}

          {/* lab name, optional logo */}
          {frame >= LAB_AT - 2 && (
            <div style={{ position: 'absolute', left: 90, right: 90, top: heroY + 560, display: 'flex', alignItems: 'center', gap: 30 }}>
              {p.logo && <Img src={p.logo} style={{ height: 110, maxWidth: 240, objectFit: 'contain', opacity: prog(frame, LAB_AT, 20) }} />}
              <SweepReveal frame={frame} start={LAB_AT} dur={30} style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: p.lab.length > 14 ? 76 : 96, letterSpacing: '-0.03em', color: p.textColor, whiteSpace: 'nowrap' }}>
                {p.lab}
              </SweepReveal>
            </div>
          )}

          {/* stats on the beat */}
          <div style={{ position: 'absolute', left: 90, right: 90, top: 1060, display: 'flex', flexDirection: 'column', gap: 26 }}>
            {frame >= STATS_AT - 2 && <Stat frame={frame} at={STATS_AT} value={p.stat1} label={p.stat1Label} p={p} />}
            {frame >= STATS_AT + T.beat - 2 && <Stat frame={frame} at={STATS_AT + T.beat} value={p.stat2} label={p.stat2Label} p={p} />}
            {frame >= STATS_AT + T.beats(2) - 2 && <Stat frame={frame} at={STATS_AT + T.beats(2)} value={p.stat3} label={p.stat3Label} p={p} />}
          </div>

          {/* signed note */}
          {frame >= NOTE_AT && (
            <div style={{ position: 'absolute', left: 90, right: 90, top: 1610 }}>
              <WordsIn text={p.note} frame={frame} start={NOTE_AT} stagger={3} style={{ fontFamily: FONTS.mono, fontSize: 40, lineHeight: 1.4, color: p.textColor }} />
              <div style={{ marginTop: 18, fontFamily: FONTS.silkscreen, fontSize: 26, letterSpacing: '0.16em', color: p.accent2, opacity: prog(frame, NOTE_AT + T.beats(2), 20) }}>{p.signature}</div>
            </div>
          )}
        </AbsoluteFill>

        <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, ${hexA('#000000', dark ? 0.2 : 0.05)} 0 2px, transparent 2px 5px)`, pointerEvents: 'none' }} />
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 32%, ${hexA('#ffffff', flash * 0.8)} 0%, ${hexA(p.accent, flash * 0.5)} 25%, transparent 65%)`, mixBlendMode: dark ? 'screen' : 'normal', opacity: dark ? 1 : 0.6 }} />
        <FilmOverlay grain={0.06} vignette={dark ? 0.45 : 0.08} frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
