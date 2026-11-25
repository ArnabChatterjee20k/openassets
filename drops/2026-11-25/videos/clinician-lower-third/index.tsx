import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Clinician Lower Third',
  category: 'lower-third',
  description:
    'A chrome Y2K lower third for explainer videos: a headshot in a weekly dose-dial ring pops in on the beat, a silver capsule slides out with the speaker name and role, then a jelly topic tag drops below. Retracts on the beat.',
  tags: ['lower third', 'name', 'speaker', 'health', 'youtube'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  name: text('Name').default('Dr. Amara Osei'),
  role: text('Role').default('Obesity medicine · Satiate clinical advisor'),
  topic: text('Topic tag (empty to hide)').default('week 1: easing nausea'),
  initials: text('Initials (no headshot)').default('AO'),
  headshot: image('Headshot (optional)').default(''),
  footage: image('Footage still (optional)').default(''),
  font: font('Name font').default('syne'),
  chrome: color('Chrome').default('#C3C8D1'),
  accent: color().default('#3D5AFE'),
  pop: color('Pop').default('#FF3DB4'),
  textColor: color('Text').default('#101219'),
  stage: color('Placeholder stage').default('#DADDE3'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  creator: { name: 'Jules Moreno', role: '6 months on tirzepatide · @julesmoves', topic: 'my protein-first breakfast', initials: 'JM', accent: '#FF3DB4', pop: '#3D5AFE' },
  lilac: { chrome: '#D6CCEC', accent: '#5E4AE3', pop: '#2EC4B6', textColor: '#231942', stage: '#E9E3F5' },
  midnight: { chrome: '#5A5A64', accent: '#C9A45C', pop: '#E8D9B5', textColor: '#F3EDE2', stage: '#141418', font: 'bricolage' },
  'no-topic': { topic: '' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
};
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`;
};

/** Out-of-focus placeholder stage: soft bokeh discs drifting, so the template previews well without footage. */
function Stage({ p, frame, W, H }: { p: P; frame: number; W: number; H: number }) {
  const dark = isDark(p.stage);
  return (
    <Backdrop
      base={p.stage}
      frame={frame}
      grid={{ opacity: dark ? 0.06 : 0.12, size: 44, y: -frame * 0.15, color: dark ? '255,255,255' : '16,18,25' }}
      lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}
      glows={[
        { x: W * 0.72, y: H * 0.38, size: 1300, color: hexA(p.accent, dark ? 0.3 : 0.22), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
        { x: W * 0.9, y: H * 0.9, size: 900, color: hexA(p.pop, dark ? 0.25 : 0.18), opacity: 0.8 },
        { x: W * 0.25, y: 0, size: 1400, color: hexA('#ffffff', dark ? 0.04 : 0.8), opacity: 0.9 },
      ]}
      grain={0}
      vignette={dark ? 0.5 : 0.18}
    >
      {/* a huge out-of-focus chrome dial behind the speaker: the kit's motif */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, filter: 'blur(6px)' }}>
        <defs>
          <linearGradient id="st-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity={dark ? 0.15 : 0.95} />
            <stop offset="0.5" stopColor={dark ? '#ffffff' : '#9AA2B1'} stopOpacity={dark ? 0.08 : 0.55} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={dark ? 0.12 : 0.8} />
          </linearGradient>
        </defs>
        <g transform={`rotate(${frame * 0.08} ${W * 0.74} ${H * 0.42})`}>
          <circle cx={W * 0.74} cy={H * 0.42} r={420} fill="none" stroke="url(#st-ring)" strokeWidth={70} />
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={arc(W * 0.74, H * 0.42, 330, i * (360 / 7) + 4, (i + 1) * (360 / 7) - 4)} fill="none" strokeLinecap="round" strokeWidth={36} stroke={i === 2 ? hexA(p.accent, 0.55) : hexA(dark ? '#ffffff' : '#101219', 0.07)} />
          ))}
        </g>
      </svg>
      {Array.from({ length: 9 }, (_, i) => {
        const s = 120 + rand(i * 3.3) * 260;
        const x = W * (0.35 + rand(i * 1.7) * 0.65) + Math.sin(frame / 90 + i) * 30;
        const y = H * (0.1 + rand(i * 5.1) * 0.6) + Math.cos(frame / 110 + i) * 20;
        return (
          <div
            key={i}
            style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', background: i % 3 === 0 ? hexA(p.accent, 0.18) : hexA('#ffffff', dark ? 0.06 : 0.5), filter: `blur(${10 + rand(i) * 18}px)` }}
          />
        );
      })}
    </Backdrop>
  );
}

export default function ClinicianLowerThird(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.stage);

  // ── Beat grid ──
  const DISC = T.beats(1); // headshot disc pops
  const SLIDE = T.beats(1) + 8; // capsule extends
  const NAME = T.beats(2); // name sweeps in
  const TOPIC = T.bars(1); // bar 2 downbeat: topic tag + glint
  const OUT = T.bars(3) + T.beats(1); // retract, one element per beat
  const discIn = prog(frame, DISC - 6, 26, ease.backOut);
  const discOut = prog(frame, OUT + T.beats(2), 22, ease.in);
  const disc = clamp(discIn) * (1 - discOut);
  const capIn = prog(frame, SLIDE, 34, ease.out);
  const capOut = prog(frame, OUT + T.beats(1), 26, ease.inOut);
  const cap = capIn * (1 - capOut);
  const nameOut = prog(frame, OUT + 10, 18, ease.in);
  const tagIn = prog(frame, TOPIC, 26, ease.backOut);
  const tagOut = prog(frame, OUT - 4, 18, ease.in);
  const tag = p.topic ? clamp(tagIn) * (1 - tagOut) : 0;

  // ── Geometry ──
  const R = 104; // headshot disc radius
  const cx = 150 + R;
  const cy = H - 150 - R - (p.topic ? 40 : 0);
  const NAME_SIZE = p.name.length > 18 ? 70 : 88;
  const nameW = p.name.length * NAME_SIZE * (p.font === 'syne' ? 0.78 : 0.6);
  const roleW = p.role.length * 44 * 0.5;
  const capW = Math.min(W - cx - 140, Math.max(nameW, roleW) + R + 150);
  const capH = 196;
  const left = cx; // capsule starts at the disc's centre and slides right
  const textX = cx + R + 46;

  // Dial ring around the headshot: 7 segments light up one per beat during the hold.
  const lit = Math.floor(clamp((frame - TOPIC) / T.beat, 0, 7));
  const spin = frame * 0.25;
  // Light chrome on light stages; smoked chrome on dark ones. Text always uses textColor.
  const chromeGrad = dark
    ? `linear-gradient(180deg, ${p.chrome} 0%, #1E1E24 48%, #121216 70%, #2C2C33 100%)`
    : `linear-gradient(180deg, #FFFFFF 0%, ${p.chrome} 38%, #F4F6FA 55%, ${p.chrome} 100%)`;
  const ink = p.textColor;
  const glintAt = TOPIC + 6;

  return (
    <AbsoluteFill style={{ backgroundColor: p.stage }}>
      {p.footage ? <Img src={p.footage} style={{ position: 'absolute', inset: 0, width: W, height: H, objectFit: 'cover' }} /> : <Stage p={p} frame={frame} W={W} H={H} />}
      {/* legibility scrim behind the lower third */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 520, background: `linear-gradient(0deg, ${hexA(dark ? '#000000' : '#101219', dark ? 0.5 : p.footage ? 0.3 : 0.1)} 0%, transparent 100%)`, opacity: Math.max(cap, disc) }} />
      <Dust frame={frame} width={W} height={H} count={40} color={dark ? p.pop : '#ffffff'} seed={9} speed={0.6} opacity={0.5} />

      {/* ── Capsule ── */}
      <div
        style={{
          position: 'absolute',
          left,
          top: cy - capH / 2,
          width: (capW + R) * cap,
          height: capH,
          borderRadius: capH / 2,
          overflow: 'hidden',
          background: chromeGrad,
          boxShadow: `0 30px 60px ${hexA('#101219', 0.28)}, inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -3px 0 ${hexA('#101219', 0.12)}`,
          border: `1.5px solid ${hexA('#ffffff', 0.7)}`,
          opacity: cap > 0.01 ? 1 : 0,
        }}
      >
        {/* specular band */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 14, height: 46, borderRadius: 30, margin: '0 40px', background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0))' }} />
        {/* glint sweeping across on the bar-2 downbeat */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 160, left: mix(-200, capW + 200, prog(frame, glintAt, 40, ease.inOut)), background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.95), transparent)', opacity: frame > glintAt && frame < glintAt + 42 ? 1 : 0 }} />
      </div>

      {/* Name + role, clipped to the capsule */}
      <div style={{ position: 'absolute', left: textX, top: cy - capH / 2, width: Math.max(0, (capW + R) * cap - (textX - left) - 40), height: capH, overflow: 'hidden', opacity: 1 - nameOut }}>
        {frame >= NAME - 2 && (
          <SweepReveal frame={frame} start={NAME} dur={30} blur={12} style={{ position: 'absolute', left: 0, top: 22, whiteSpace: 'nowrap', ...displayFace(p.font), fontSize: NAME_SIZE, lineHeight: 1.1, letterSpacing: '-0.035em', color: ink }}>
            {p.name}
          </SweepReveal>
        )}
        <WordsIn
          text={p.role}
          frame={frame}
          start={NAME + 14}
          stagger={3}
          style={{ position: 'absolute', left: 2, top: 32 + NAME_SIZE * 1.1, whiteSpace: 'nowrap', flexWrap: 'nowrap', fontFamily: FONTS.bricolage, fontWeight: 600, fontSize: 44, color: hexA(ink, 0.8) }}
        />
      </div>

      {/* Topic tag drops below the capsule */}
      {p.topic && (
        <div
          style={{
            position: 'absolute',
            left: textX - 6,
            top: cy + capH / 2 + 18,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '16px 34px 16px 26px',
            borderRadius: 999,
            fontFamily: FONTS.majormono,
            fontSize: 50,
            textShadow: '0 1px 0 rgba(0,0,0,0.25)',
            whiteSpace: 'nowrap',
            color: isDark(p.accent) ? '#F6F7FA' : '#16161A',
            background: `linear-gradient(180deg, ${hexA('#ffffff', 0.5)} 0%, ${p.accent} 42%, ${p.accent} 100%)`,
            backgroundColor: p.accent,
            boxShadow: `0 16px 40px ${hexA(p.accent, 0.4)}, inset 0 -3px 0 rgba(0,0,0,0.15)`,
            opacity: clamp(tag * 1.4),
            translate: `0 ${mix(-46, 0, tag)}px`,
            scale: String(mix(0.9, 1, tag)),
            transformOrigin: 'left center',
          }}
        >
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${12 + 8 * Math.sin(frame / 8)}px ${p.pop}`, border: '3px solid #ffffff' }} />
          {p.topic}
        </div>
      )}

      {/* ── Headshot disc with the weekly dose-dial ring ── */}
      <div style={{ position: 'absolute', left: cx - R - 34, top: cy - R - 34, width: (R + 34) * 2, height: (R + 34) * 2, scale: String(mix(0.4, 1, disc)), opacity: clamp(disc * 1.5), rotate: `${mix(-40, 0, discIn)}deg` }}>
        <svg width={(R + 34) * 2} height={(R + 34) * 2} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <linearGradient id="lt-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.35" stopColor={p.chrome} />
              <stop offset="0.6" stopColor="#F4F6FA" />
              <stop offset="1" stopColor={hexA('#101219', 0.5)} />
            </linearGradient>
          </defs>
          <circle cx={R + 34} cy={R + 34} r={R + 30} fill="url(#lt-ring)" style={{ filter: `drop-shadow(0 18px 30px ${hexA('#101219', 0.3)})` }} />
          {Array.from({ length: 7 }, (_, i) => {
            const a0 = spin + i * (360 / 7) + 4;
            const a1 = spin + (i + 1) * (360 / 7) - 4;
            const on = i < lit;
            return <path key={i} d={arc(R + 34, R + 34, R + 15, a0, a1)} fill="none" strokeLinecap="round" strokeWidth={10} stroke={on ? (i === 6 ? p.pop : p.accent) : hexA('#101219', 0.14)} />;
          })}
        </svg>
        <div style={{ position: 'absolute', left: 34, top: 34, width: R * 2, height: R * 2, borderRadius: '50%', overflow: 'hidden', background: `radial-gradient(circle at 35% 30%, ${hexA('#ffffff', 0.6)} 0%, ${p.accent} 55%, ${p.accent} 100%)`, border: '4px solid #ffffff', display: 'grid', placeItems: 'center' }}>
          {p.headshot ? (
            <Img src={p.headshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ ...displayFace('syne'), fontSize: p.initials.length > 2 ? 52 : 68, letterSpacing: '-0.05em', color: '#F6F7FA' }}>{p.initials}</span>
          )}
        </div>
        {/* live dot */}
        <div style={{ position: 'absolute', right: 30, top: 30, width: 30, height: 30, borderRadius: '50%', background: p.pop, border: '5px solid #ffffff', scale: String(1 + 0.12 * Math.sin(frame / 7)), opacity: prog(frame, NAME, 14) }} />
      </div>

      {/* Name glint on the downbeat of bar 3 */}
      {frame >= NAME && (
        <Glint frame={frame} start={T.bars(2)} dur={44} style={{ position: 'absolute', left: textX, top: cy - capH / 2 + 22, whiteSpace: 'nowrap', ...displayFace(p.font), fontSize: NAME_SIZE, lineHeight: 1.1, letterSpacing: '-0.035em', opacity: 1 - nameOut }}>
          {p.name}
        </Glint>
      )}

      {/* Flash where the disc lands */}
      <div style={{ position: 'absolute', left: cx - 300, top: cy - 300, width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${hexA('#ffffff', 0.9)} 0%, ${hexA(p.accent, 0.4)} 30%, transparent 65%)`, mixBlendMode: 'screen', opacity: keys(frame, [DISC - 2, DISC + 2, DISC + 24], [0, 1, 0], [ease.out, ease.outSoft]) }} />
      <FilmOverlay grain={0.04} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
