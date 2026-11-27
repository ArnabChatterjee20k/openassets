import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Structures Milestone',
  category: 'milestone',
  description:
    'Vertical milestone post: a counter rolls to 10,000 inside a heating thermal ring, bursts on the downbeat, then stat chips land on beats and a thank-you signs off. Optional site photo fills the ring.',
  tags: ['milestone', 'counter', 'story', 'infrastructure', 'thank you'],
};

// 60 fps, 120 BPM: 1 beat = 30 frames, 1 bar = 120. Four bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Plumbline · Milestone'),
  target: num(1, 9999999, 1, 'Number').default(10000),
  label: text('Label').default('structures watched'),
  stat1: text('Stat 1').default('1.2M camera-hours analysed'),
  stat2: text('Stat 2').default('412 alerts caught early'),
  stat3: text('Stat 3').default('0 sensors installed'),
  thanks: text('Thank-you line').default('Thank you to the 38 operators who trusted us first.'),
  signoff: text('Sign-off').default('— Team Plumbline'),
  footer: text('Footer').default('plumbline.io'),
  sitePhoto: image('Site photo (optional)').default(''),
  font: font('Display font').default('bodoni'),
  background: color().default('#1A0A06'),
  surface: color().default('#2E120B'),
  accent: color('Heat').default('#FF4D00'),
  accent2: color('Hot core').default('#FFB000'),
  pop: color('Spark').default('#FF2E63'),
  textColor: color('Text').default('#FFEDE0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#FF5A36', textColor: '#F3EDE2', font: 'instrument' },
  'rail-km': { target: 2400, label: 'km of track on watch', stat1: '312 level crossings', stat2: '9 s median alert time', stat3: '0 track closures for installs', background: '#021B26', surface: '#06303F', accent: '#1B7FA6', accent2: '#2EF2C4', pop: '#FF7A59', textColor: '#E6FFFA' },
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', accent: '#E3000F', accent2: '#FF6A3D', pop: '#E3000F', textColor: '#0A0A0A', font: 'familjen' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const CX = 540;
const CY = 780;
const R = 330;

export default function StructuresMilestone(p: P) {
  const frame = useCurrentFrame();
  const W = video.width;
  const H = video.height;
  const end = video.durationInFrames;
  const dark = isDark(p.background);

  const HIT = T.bars(1);
  const STATS = T.bars(2);
  const THANKS = T.bars(3);

  const draw = prog(frame, 4, 40, ease.out);
  const count = prog(frame, 14, HIT - 18, ease.inOutSoft);
  const value = Math.round(p.target * count).toLocaleString('en-US');
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, HIT, 70, ease.out);
  const shock2 = prog(frame, HIT + 6, 80, ease.out);
  const pop = frame >= HIT ? keys(frame, [HIT, HIT + 8, HIT + 30], [1, 1.07, 1], [ease.out, ease.inOutSoft]) : mix(0.94, 1, prog(frame, 0, 40));
  const push = mix(1, 1.05, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 34, 34, ease.in);
  const NUM = value.length > 7 ? 160 : value.length > 5 ? 192 : 240;
  const numStyle = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: CY - NUM * 0.56,
    textAlign: 'center' as const,
    ...displayFace(p.font, { italic: false, weight: 400 }),
    fontSize: NUM,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums' as const,
  };

  // brackets around the whole ring
  const bk = 90 * draw;
  const box = R + 70;
  const brackets = [
    `M${CX - box},${CY - box + bk} L${CX - box},${CY - box} L${CX - box + bk},${CY - box}`,
    `M${CX + box - bk},${CY - box} L${CX + box},${CY - box} L${CX + box},${CY - box + bk}`,
    `M${CX + box},${CY + box - bk} L${CX + box},${CY + box} L${CX + box - bk},${CY + box}`,
    `M${CX - box + bk},${CY + box} L${CX - box},${CY + box} L${CX - box},${CY + box - bk}`,
  ];
  const circ = 2 * Math.PI * R;
  const heat = frame >= HIT ? 1 : count;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.05 : 0.08, size: 40, y: -frame * 0.15, color: dark ? '255,237,224' : '10,10,10' }}
        lift={dark ? hexA(p.accent, 0.05) : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: CX, y: CY, size: mix(900, 1500, heat), color: hexA(p.accent, dark ? 0.4 : 0.25), opacity: mix(0.4, 0.95, heat) * (0.88 + 0.12 * Math.sin(frame / 36)) },
          { x: CX, y: H + 120, size: 1500, color: hexA(p.accent2, dark ? 0.2 : 0.15), opacity: prog(frame, HIT, 80) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        {/* embers rise faster after the hit */}
        <Dust frame={frame} width={W} height={H} count={70} color={p.accent2} seed={4} speed={frame >= HIT ? 2.2 : 0.8} opacity={dark ? 0.5 : 0.35} maxSize={6} />

        {/* eyebrow */}
        <div
          style={{
            position: 'absolute',
            top: 190,
            width: W,
            textAlign: 'center',
            fontFamily: FONTS.italiana,
            fontSize: 44,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: p.accent,
            opacity: prog(frame, 8, 30),
            translate: `0 ${mix(-20, 0, prog(frame, 8, 30))}px`,
          }}
        >
          {p.eyebrow}
        </div>

        {/* optional site photo inside the ring, gradient-mapped toward the heat */}
        {p.sitePhoto && (
          <div
            style={{
              position: 'absolute',
              left: CX - R + 22,
              top: CY - R + 22,
              width: (R - 22) * 2,
              height: (R - 22) * 2,
              borderRadius: '50%',
              overflow: 'hidden',
              opacity: prog(frame, 10, 40) * 0.9,
            }}
          >
            <Img src={p.sitePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.15)', scale: String(mix(1.12, 1, prog(frame, 0, end, ease.inOutSoft))) }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${p.accent2}, ${p.accent} 50%, ${p.background})`, mixBlendMode: 'multiply', opacity: mix(0.3, 0.95, heat) }} />
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${hexA(p.background, 0.55)} 20%, ${hexA(p.background, 0.15)} 75%)` }} />
          </div>
        )}

        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <defs>
            <linearGradient id="ms-heat" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor={p.accent} />
              <stop offset="0.6" stopColor={p.accent2} />
              <stop offset="1" stopColor={dark ? '#FFF3E0' : p.accent2} />
            </linearGradient>
            <filter id="ms-bloom" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>
          {/* tick dial: ticks heat up as the counter passes them */}
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2 - Math.PI / 2;
            const lit = i / 72 <= heat;
            const l = i % 6 === 0 ? 30 : 14;
            const r0 = R + 26;
            return (
              <line
                key={i}
                x1={CX + Math.cos(a) * r0}
                y1={CY + Math.sin(a) * r0}
                x2={CX + Math.cos(a) * (r0 + l)}
                y2={CY + Math.sin(a) * (r0 + l)}
                stroke={lit ? p.accent2 : hexA(p.textColor, 0.2)}
                strokeWidth={i % 6 === 0 ? 3 : 1.5}
                opacity={draw}
              />
            );
          })}
          {/* base ring + heat arc */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={hexA(p.textColor, 0.12)} strokeWidth="10" opacity={draw} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#ms-heat)" strokeWidth="22" strokeDasharray={`${circ * heat} ${circ}`} transform={`rotate(-90 ${CX} ${CY})`} filter="url(#ms-bloom)" opacity="0.7" />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#ms-heat)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circ * heat} ${circ}`} transform={`rotate(-90 ${CX} ${CY})`} />
          {/* slow outer dashed ring for life */}
          <circle cx={CX} cy={CY} r={R + 92} fill="none" stroke={hexA(p.textColor, 0.18)} strokeWidth="1.5" strokeDasharray="2 14" transform={`rotate(${frame * 0.12} ${CX} ${CY})`} opacity={draw} />
          {/* spark riding the arc head */}
          {heat < 1 && heat > 0.01 && (
            <circle cx={CX + Math.cos(heat * Math.PI * 2 - Math.PI / 2) * R} cy={CY + Math.sin(heat * Math.PI * 2 - Math.PI / 2) * R} r="11" fill={p.pop} />
          )}
          {/* shockwaves on the downbeat (start outside the ring) */}
          {frame >= HIT && (
            <>
              <circle cx={CX} cy={CY} r={R + 20 + shock * 520} fill="none" stroke={p.accent2} strokeWidth={mix(8, 1, shock)} opacity={(1 - shock) * 0.8} />
              <circle cx={CX} cy={CY} r={R + 20 + shock2 * 380} fill="none" stroke={p.pop} strokeWidth={mix(3, 0.5, shock2)} opacity={(1 - shock2) * 0.6} />
            </>
          )}
          {brackets.map((d, i) => (
            <path key={i} d={d} stroke={p.textColor} strokeWidth="3" fill="none" strokeLinecap="square" opacity={0.85 * draw} />
          ))}
          <circle cx={CX - box + 36} cy={CY - box + 36} r="9" fill={p.pop} opacity={Math.floor(frame / 30) % 2 === 0 ? draw : 0.25 * draw} />
        </svg>

        {/* the number */}
        <div style={{ ...numStyle, scale: String(pop), opacity: prog(frame, 6, 24) }}>{value}</div>
        <Glint frame={frame} start={THANKS + T.beats(2)} dur={44} style={numStyle}>
          {value}
        </Glint>

        {/* label sweeps in on the downbeat */}
        {frame >= HIT && (
          <SweepReveal frame={frame} start={HIT + 4} dur={34} style={{ position: 'absolute', left: 0, width: W, top: CY + R + 120, textAlign: 'center', ...displayFace(p.font, { italic: true, weight: 400 }), fontSize: p.label.length > 20 ? 92 : 112, lineHeight: 1, letterSpacing: '-0.02em', color: dark ? p.accent2 : p.accent }}>
            {p.label}
          </SweepReveal>
        )}

        {/* stats on beats, fading out for the thank-you */}
        <div style={{ position: 'absolute', left: 0, width: W, top: CY + R + 290, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: 1 - prog(frame, THANKS - 8, 16, ease.in) }}>
          {[p.stat1, p.stat2, p.stat3].filter(Boolean).map((s, i) => {
            const t = prog(frame, STATS + i * T.beat, 24, ease.backOut);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 34px',
                  fontSize: 46,
                  fontWeight: 500,
                  background: dark ? hexA(p.surface, 0.9) : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${hexA(p.textColor, 0.16)}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,${dark ? 0.4 : 0.08})`,
                  opacity: clamp(t * 1.5),
                  scale: String(mix(0.85, 1, t)),
                  translate: `0 ${mix(30, 0, t)}px`,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.accent2, boxShadow: `0 0 16px ${p.accent2}` }} />
                {s}
              </div>
            );
          })}
        </div>

        {/* thank-you + sign-off */}
        <WordsIn
          text={p.thanks}
          frame={frame}
          start={THANKS + 4}
          stagger={4}
          style={{ position: 'absolute', left: 100, width: W - 200, top: CY + R + 290, justifyContent: 'center', textAlign: 'center', ...displayFace(p.font, { italic: false, weight: 400 }), fontSize: 62, lineHeight: 1.15 }}
        />
        <div
          style={{
            position: 'absolute',
            width: W,
            top: CY + R + 560,
            textAlign: 'center',
            fontFamily: FONTS.italiana,
            fontSize: 46,
            letterSpacing: '0.2em',
            color: p.accent,
            opacity: prog(frame, THANKS + T.beats(1.5), 24),
            translate: `0 ${mix(20, 0, prog(frame, THANKS + T.beats(1.5), 30))}px`,
          }}
        >
          {p.signoff}
        </div>

        {/* footer */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: W,
            top: 1790,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 22,
            fontSize: 34,
            letterSpacing: '0.12em',
            color: hexA(p.textColor, 0.7),
            opacity: prog(frame, 20, 40),
          }}
        >
          <span style={{ width: 60, height: 1, background: hexA(p.textColor, 0.4) }} />
          {p.footer}
          <span style={{ width: 60, height: 1, background: hexA(p.textColor, 0.4) }} />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${(CY / H) * 100}%, ${hexA('#FFFFFF', flash * 0.85)} 0%, ${hexA(p.accent2, flash * 0.6)} 20%, transparent 55%)`,
          mixBlendMode: dark ? 'screen' : 'multiply',
        }}
      />
      <FilmOverlay grain={0.06} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
