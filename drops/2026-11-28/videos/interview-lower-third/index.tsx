import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, clamp, displayFace, ease, hexA, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Interview Lower Third',
  category: 'lower-third',
  description:
    'A 70s-sunshine lower third for factory tours and founder interviews: a lime / pine / orange triple stripe sweeps in on the beat, a headshot pellet pops, the name rolls out in juicy Shrikhand and a topic chip snaps on. Retracts on the beat.',
  tags: ['lower third', 'name', 'interview', 'speaker', 'manufacturing', '70s'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  name: text('Name').default('Maya Okafor'),
  role: text('Role').default('Head of Tooling, Sprue'),
  topic: text('Topic chip (empty to hide)').default('Factory tour · Line 3, Fremont'),
  initials: text('Initials (no headshot)').default('MO'),
  headshot: image('Headshot (optional)').default(''),
  footage: image('Footage still (optional)').default(''),
  font: font('Name font').default('shrikhand'),
  plate: color('Name plate').default('#18291F'),
  accent: color('Stripe 1 / chip').default('#B5E550'),
  accent2: color('Stripe 2').default('#4E8A5B'),
  pop: color('Stripe 3').default('#FF9F43'),
  textColor: color('Text').default('#EAF2DC'),
  stage: color('Placeholder stage').default('#0E1A14'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  founder: { name: 'Dev Raman', role: 'Co-founder & CEO, Sprue', topic: 'Why molds took 10 weeks', initials: 'DR' },
  citrus: { plate: '#FFF8E1', textColor: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', stage: '#FFE9A8' },
  'mid-century': { plate: '#F4E9D8', textColor: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', stage: '#E6D3B3', font: 'fraunces' },
  'no-topic': { topic: '' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

export default function InterviewLowerThird(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.plate);
  const shadow = dark ? '#050B08' : hexA(p.textColor, 0.9);

  // Beat map: b0 stripes · beat 1 headshot · beat 2 name · beat 3 role · bar 2 chip · bar 3 glint · bar 4 beat 1 exit.
  const OUT = T.bars(3) + T.beats(1);
  const exit = (k: number) => prog(frame, OUT + k * 6, 26, ease.in);

  // Layout
  const X = 150;
  const BASE = H - 150; // bottom of the block
  const R = 92; // headshot radius
  const cx = X + R;
  const cy = BASE - 120;
  const nameSize = p.name.length > 16 ? 76 : 92;
  const plateLeft = cx;
  const plateW = Math.min(1400, R + 120 + Math.max(p.name.length * nameSize * 0.62, p.role.length * 24));
  const plateH = 176;
  const plateTop = cy - plateH / 2 - 6;

  // Stripes
  const stripes = [p.accent, p.accent2, p.pop].map((c, i) => {
    const t = prog(frame, i * 5, 34, ease.out) * (1 - exit(4 - i));
    return { c, t, y: cy + 104 + i * 22 };
  });

  const head = prog(frame, T.beat, 24, ease.backOut) * (1 - exit(3));
  const plateIn = prog(frame, T.beats(1) + 8, 34, ease.out) * (1 - exit(2));
  const nameIn = prog(frame, T.beats(2), 30, ease.out);
  const roleIn = prog(frame, T.beats(3), 26, ease.out);
  const chipIn = prog(frame, T.bars(1), 22, ease.backOut) * (1 - exit(0));
  const ring = prog(frame, T.beat, 40, ease.out);
  const breathe = 1 + Math.sin(frame / 24) * 0.012;
  const textOut = exit(1);

  const nameStyle = {
    ...displayFace(p.font),
    fontStyle: p.font === 'fraunces' ? ('italic' as const) : undefined,
    fontSize: nameSize,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.stage, overflow: 'hidden' }}>
      {/* Footage, or a soft out-of-focus placeholder stage */}
      {p.footage ? (
        <Img src={p.footage} style={{ position: 'absolute', inset: 0, width: W, height: H, objectFit: 'cover', scale: String(mix(1.02, 1.06, frame / video.durationInFrames)) }} />
      ) : (
        <Backdrop
          base={p.stage}
          frame={frame}
          grid={{ opacity: 0.06, size: 44, y: -frame * 0.15, color: isDark(p.stage) ? '234,242,220' : '28,43,26' }}
          glows={[
            { x: W * 0.72, y: H * 0.32, size: 1100, color: hexA(p.accent, 0.35), opacity: 0.55 + 0.1 * Math.sin(frame / 40) },
            { x: W * 0.2, y: H * 0.15, size: 900, color: hexA(p.accent2, 0.5), opacity: 0.6 },
            { x: W * 0.9, y: H * 0.9, size: 700, color: hexA(p.pop, 0.3), opacity: 0.5 },
          ]}
          grain={0}
          vignette={0.3}
        />
      )}
      {!p.footage && <Dust frame={frame} width={W} height={H} count={40} color={p.accent} seed={9} speed={0.6} opacity={0.35} maxSize={10} />}

      {/* readability scrim behind the lower third */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 520, background: `linear-gradient(180deg, transparent, ${hexA('#000000', 0.42)})`, opacity: plateIn }} />

      {/* Triple stripe sweeping in from the left edge */}
      {stripes.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: -40,
            top: s.y,
            width: X + plateW + 140 - i * 70,
            height: 16,
            borderRadius: 99,
            background: s.c,
            transformOrigin: '0 50%',
            scale: `${s.t} 1`,
            boxShadow: `0 5px 0 ${shadow}`,
            overflow: 'hidden',
          }}
        >
          {/* gloss highlight travelling along the stripe once per bar, keeps the hold alive */}
          <div
            style={{
              position: 'absolute',
              top: 3,
              height: 5,
              width: 220,
              borderRadius: 99,
              background: `linear-gradient(90deg, transparent, ${hexA('#ffffff', 0.75)}, transparent)`,
              left: (((frame - i * 8) % T.bar) / T.bar) * (X + plateW + 400) - 260,
            }}
          />
        </div>
      ))}

      {/* Name plate rolling out from behind the headshot */}
      <div
        style={{
          position: 'absolute',
          left: plateLeft,
          top: plateTop,
          width: plateW,
          height: plateH,
          borderRadius: plateH / 2,
          background: p.plate,
          border: `2px solid ${hexA(p.textColor, 0.1)}`,
          boxShadow: `10px 12px 0 ${shadow}`,
          clipPath: `inset(-20px ${(1 - plateIn) * 100}% -20px -20px round ${plateH / 2}px)`,
        }}
      >
        <div style={{ position: 'absolute', left: R + 48, top: 26, opacity: clamp(nameIn * 1.4) * (1 - textOut), translate: `${mix(-30, 0, nameIn)}px 0`, filter: nameIn < 1 ? `blur(${(1 - nameIn) * 10}px)` : undefined }}>
          <div style={{ ...nameStyle, color: p.textColor }}>{p.name}</div>
          <Glint frame={frame} start={T.bars(2)} dur={44} style={{ ...nameStyle, position: 'absolute', left: 0, top: 0 }}>
            {p.name}
          </Glint>
        </div>
        <div
          style={{
            position: 'absolute',
            left: R + 52,
            top: 26 + nameSize * 1.08,
            fontFamily: FONTS.fraunces,
            fontWeight: 600,
            fontSize: 44,
            color: p.textColor,
            opacity: roleIn * 0.85 * (1 - textOut),
            translate: `0 ${mix(18, 0, roleIn)}px`,
            whiteSpace: 'nowrap',
          }}
        >
          {p.role}
        </div>
      </div>

      {/* Topic chip */}
      {p.topic && (
        <div
          style={{
            position: 'absolute',
            left: cx + R + 40,
            top: plateTop - 74,
            padding: '14px 28px',
            borderRadius: 999,
            background: p.accent,
            color: isDark(p.accent) ? '#FFFDF5' : '#0E1A14',
            fontFamily: FONTS.outfit,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            boxShadow: `6px 7px 0 ${shadow}`,
            transformOrigin: '0 100%',
            scale: String(chipIn),
            rotate: `${mix(-8, -2, chipIn)}deg`,
          }}
        >
          {p.topic}
        </div>
      )}

      {/* Headshot pellet */}
      <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
        <circle cx={cx} cy={cy} r={R + 18 + ring * 90} fill="none" stroke={p.accent} strokeWidth={mix(6, 0.5, ring)} opacity={frame >= T.beat ? (1 - ring) * 0.7 : 0} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - R,
          top: cy - R,
          width: R * 2,
          height: R * 2,
          borderRadius: '50%',
          overflow: 'hidden',
          background: `radial-gradient(circle at 35% 30%, ${hexA('#ffffff', 0.5)}, ${p.accent} 45%, ${p.accent2} 100%)`,
          border: `8px solid ${p.accent}`,
          boxShadow: `8px 10px 0 ${shadow}`,
          scale: String(head * breathe),
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {p.headshot ? (
          <Img src={p.headshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ ...displayFace('shrikhand'), fontSize: 72, color: '#0E1A14', lineHeight: 1, translate: '0 6px' }}>{p.initials}</span>
        )}
      </div>
      {/* a small orange spark on the headshot */}
      <div style={{ position: 'absolute', left: cx + R * 0.62, top: cy - R * 0.95, width: 30, height: 30, borderRadius: '50%', background: p.pop, boxShadow: `0 0 24px ${p.pop}`, scale: String(prog(frame, T.beats(1) + 10, 20, ease.backOut) * (1 - exit(3)) * (1 + Math.sin(frame / 10) * 0.08)) }} />

      <FilmOverlay grain={0.05} vignette={p.footage ? 0.25 : 0.4} frame={frame} />
    </AbsoluteFill>
  );
}
