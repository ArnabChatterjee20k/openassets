import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, SweepReveal, WordsIn, clamp, ease, hexA, mix, prog, rand, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Creator Lower Third',
  category: 'lower-third',
  description:
    'Name card for dev-diary episodes, cast interviews and creator streams: a cherry bar wipes in, a wax-seal heart pops beside the photo, the name sweeps in and the role and handle type on, then it all wipes away.',
  tags: ['lower third', 'name tag', 'interview', 'stream', 'romance', 'overlay'],
};

// 60 fps, 120 BPM: beat = 30 frames, bar = 120. 3 bars = 6 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(3) };

export const schema = z.object({
  eyebrow: text().default('Dev diary · Ep. 12'),
  name: text().default('Mira Okafor'),
  role: text().default('Lead Story Writer, Ardor'),
  handle: text('Handle (empty to hide)').default('@mira.writes'),
  photo: image('Photo (optional)').default(''),
  preview: toggle('Preview background (off = transparent overlay)').default(true),
  background: color('Preview background').default('#2A0A10'),
  panel: color().default('#3F1019'),
  accent: color('Seal / bar').default('#E3173E'),
  accent2: color('Second light').default('#F5C6AA'),
  textColor: color('Text').default('#FFE8E0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  guest: { eyebrow: 'Cast interview', name: 'Dana Reyes', role: 'Voice of Lucien, The Midnight Court', handle: '@danareyes.vo' },
  overlay: { preview: false },  'ink-gold': { background: '#0D0D0F', panel: '#1C1C20', accent: '#C9A45C', accent2: '#E8D9B5', textColor: '#F3EDE2', eyebrow: 'Live on Twitch', name: 'Sasha Lin', role: 'Community Lead', handle: '@ardor.sasha' },
  dusk: { background: '#2B1B2E', panel: '#45293F', accent: '#E5487A', accent2: '#FF8E5E', textColor: '#FFE9D6' },
};

type P = z.infer<typeof schema>;

const luma = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(mix((pa >> s) & 255, (pb >> s) & 255, t));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

/** Wax-seal heart, the kit's brand mark. */
function Seal({ size, accent, id }: { size: number; accent: string; id: string }) {
  const R = 100;
  const blob = Array.from({ length: 120 }, (_, i) => {
    const a = (i / 120) * Math.PI * 2;
    const r = R * (0.93 + 0.045 * Math.sin(a * 9) + 0.03 * Math.sin(a * 5 + 1.3) + 0.02 * Math.sin(a * 14 + 0.4));
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  const heart = Array.from({ length: 60 }, (_, i) => {
    const t = (i / 60) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return `${(x * 2.6).toFixed(1)},${(-y * 2.6 + 4).toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="-120 -120 240 240" width={size} height={size} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <radialGradient id={`${id}-wax`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={mixHex(accent, '#FFFFFF', 0.28)} />
          <stop offset="0.55" stopColor={accent} />
          <stop offset="1" stopColor={mixHex(accent, '#000000', 0.45)} />
        </radialGradient>
      </defs>
      <polygon points={blob} fill={mixHex(accent, '#000000', 0.55)} transform="translate(4 7)" opacity={0.6} />
      <polygon points={blob} fill={`url(#${id}-wax)`} />
      <circle r={R * 0.7} fill="none" stroke={mixHex(accent, '#000000', 0.35)} strokeWidth={5} />
      <circle r={R * 0.7} fill="none" stroke={mixHex(accent, '#FFFFFF', 0.35)} strokeWidth={1.5} transform="translate(-1.5 -1.5)" opacity={0.7} />
      <polygon points={heart} fill={mixHex(accent, '#FFFFFF', 0.4)} transform="translate(-2 -2)" opacity={0.55} />
      <polygon points={heart} fill={mixHex(accent, '#000000', 0.3)} />
      <ellipse cx={-38} cy={-52} rx={26} ry={12} fill="#FFFFFF" opacity={0.22} transform="rotate(-30 -38 -52)" />
    </svg>
  );
}

/** Stand-in footage so the template previews well: a warm, out-of-focus interview set. */
function PreviewSet({ p, frame, W, H }: { p: P; frame: number; W: number; H: number }) {
  return (
    <Backdrop
      base={p.background}
      frame={frame}
      grid={false}
      lift={hexA(p.accent2, 0.08)}
      glows={[
        { x: W * 0.78, y: H * 0.3, size: 1300, color: hexA(p.accent2, 0.45), opacity: 0.55 + 0.1 * Math.sin(frame / 50) },
        { x: W * 0.2, y: H * 0.15, size: 900, color: hexA(p.accent, 0.5), opacity: 0.5 },
        { x: W * 0.5, y: H * 1.05, size: 1400, color: hexA(p.accent, 0.4), opacity: 0.6 },
      ]}
      grain={0}
      vignette={0.55}
    >
      {/* Bokeh: big soft discs drifting very slowly, like fairy lights behind a guest */}
      {Array.from({ length: 16 }, (_, i) => {
        const s = 60 + rand(i * 4.1) * 180;
        const x = rand(i * 2.3) * W + Math.sin(frame / 90 + i) * 14;
        const y = rand(i * 7.9) * H * 0.75 - frame * 0.08 * (0.5 + rand(i));
        const c = i % 3 === 0 ? p.accent : p.accent2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - s / 2,
              top: y - s / 2,
              width: s,
              height: s,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${hexA(c, 0.32)} 0%, ${hexA(c, 0.16)} 62%, ${hexA(c, 0.28)} 70%, transparent 74%)`,
              filter: `blur(${2 + rand(i * 3.3) * 6}px)`,
              opacity: 0.5 + 0.5 * Math.sin(frame / (40 + i * 3) + i),
            }}
          />
        );
      })}
    </Backdrop>
  );
}

export default function CreatorLowerThird(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;

  // Beat grid
  const B1 = T.beats(1); // bar fully in
  const B2 = T.beats(2); // seal/photo pop + name
  const B3 = T.beats(3); // role + handle
  const SHEEN = T.bars(1) + T.beats(2);
  const OUT = end - T.beats(2) - 6; // exit starts

  // Geometry
  const D = 210; // photo/seal diameter
  const cx = 130 + D / 2;
  const bottom = H - 110;
  const panelH = 224;
  const panelTop = bottom - panelH;
  const cy = panelTop + panelH / 2;
  const nameSize = p.name.length > 18 ? 76 : 96;
  const textW = Math.max(p.name.length * nameSize * 0.56, (p.role.length * 44 * 0.57) + (p.handle ? p.handle.length * 34 * 0.62 + 34 : 0));
  const textLeft = cx + D / 2 + 44;
  const panelRight = Math.min(W - 120, textLeft + textW + 50 + panelH * 0.3);
  const panelLeft = cx;
  const panelW = panelRight - panelLeft;

  const outT = prog(frame, OUT, 30, ease.in);
  const barIn = prog(frame, 6, B1 - 6, ease.inOutSoft);
  const barOut = prog(frame, OUT + 10, 28, ease.inOut);
  const panelIn = prog(frame, B1 - 4, 26, ease.out);
  const panelOut = prog(frame, OUT + 4, 24, ease.inOut);
  const pop = prog(frame, B2 - 6, 24, ease.backOut);
  const breathe = 0.5 + 0.5 * Math.sin(frame / 30);
  const eyebrowIn = prog(frame, B3 + 10, 24, ease.out);
  const onAccent = luma(p.accent) > 150 ? mixHex(p.accent, '#000000', 0.8) : p.textColor;
  const sheen = mix(-20, 120, prog(frame, SHEEN, 50, ease.inOut));

  return (
    <AbsoluteFill style={{ color: p.textColor }}>
      {p.preview && <PreviewSet p={p} frame={frame} W={W} H={H} />}

      {/* Soft scrim so the card reads over any footage */}
      <AbsoluteFill style={{ background: `linear-gradient(0deg, ${hexA('#000000', 0.45 * (1 - outT) * clamp(frame / 20))} 0%, transparent 38%)` }} />

      {/* Glow behind the seal/photo, breathing in the hold */}
      <div
        style={{
          position: 'absolute',
          left: cx - D * 1.4,
          top: cy - D * 1.4,
          width: D * 2.8,
          height: D * 2.8,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${hexA(p.accent, 0.55)} 0%, transparent 65%)`,
          mixBlendMode: 'screen',
          opacity: pop * (0.55 + 0.35 * breathe) * (1 - outT),
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'absolute',
          left: panelLeft,
          top: panelTop,
          width: panelW,
          height: panelH,
          borderRadius: `0 ${panelH * 0.5}px ${panelH * 0.5}px 0`,
          background: `linear-gradient(100deg, ${hexA(p.panel, 0.96)} 0%, ${hexA(p.panel, 0.88)} 70%, ${hexA(mixHex(p.panel, p.accent, 0.25), 0.88)} 100%)`,
          boxShadow: `0 30px 70px ${hexA('#000000', 0.45)}, inset 0 1px 0 ${hexA('#FFFFFF', 0.08)}`,
          border: `1.5px solid ${hexA(p.accent2, 0.18)}`,
          backdropFilter: 'blur(18px)',
          clipPath: `inset(${(1 - panelIn) * 100}% ${panelOut * 100}% 0 0)`,
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sheen}%`, width: 220, background: `linear-gradient(100deg, transparent, ${hexA(p.accent2, 0.14)}, transparent)` }} />
        {/* halftone dots on the right end, a pulp-print nod */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 260,
            backgroundImage: `radial-gradient(circle, ${hexA(p.accent, 0.35)} 1.6px, transparent 2.2px)`,
            backgroundSize: '12px 12px',
            backgroundPosition: `${frame * 0.2}px 0`,
            maskImage: 'linear-gradient(90deg, transparent, black)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent, black)',
          }}
        />
      </div>

      {/* Cherry bar: wipes in first, wipes out last */}
      <div
        style={{
          position: 'absolute',
          left: panelLeft,
          top: bottom - 4,
          width: panelW - panelH * 0.35,
          height: 10,
          borderRadius: 5,
          background: `linear-gradient(90deg, ${p.accent}, ${mixHex(p.accent, p.accent2, 0.5)})`,
          boxShadow: `0 0 24px ${hexA(p.accent, 0.7)}`,
          transformOrigin: barOut > 0 ? '100% 50%' : '0% 50%',
          scale: `${barOut > 0 ? 1 - barOut : barIn} 1`,
        }}
      />

      {/* Eyebrow tab above the panel */}
      {p.eyebrow && (
        <div
          style={{
            position: 'absolute',
            left: textLeft,
            top: panelTop - 58,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 20px',
            borderRadius: 999,
            background: p.accent,
            color: onAccent,
            fontFamily: FONTS.spacemono,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            opacity: eyebrowIn * (1 - outT),
            translate: `${mix(-30, 0, eyebrowIn) - outT * 40}px ${mix(12, 0, eyebrowIn)}px`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: 5, background: onAccent, opacity: 0.5 + 0.5 * breathe }} />
          {p.eyebrow}
        </div>
      )}

      {/* Text */}
      <div style={{ position: 'absolute', left: textLeft, top: panelTop + 30, opacity: 1 - outT, translate: `${-outT * 60}px 0`, filter: outT > 0.01 ? `blur(${outT * 10}px)` : undefined }}>
        {frame >= B2 - 4 && (
          <SweepReveal frame={frame} start={B2 - 4} dur={30} scaleFrom={1.04}>
            <div style={{ fontFamily: FONTS.gloock, fontSize: nameSize, lineHeight: 1.05, letterSpacing: '-0.03em', whiteSpace: 'nowrap', color: p.textColor }}>{p.name}</div>
          </SweepReveal>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 6, whiteSpace: 'nowrap' }}>
          <WordsIn text={p.role} frame={frame} start={B3} stagger={3} dur={18} rise={14} style={{ fontFamily: FONTS.syne, fontWeight: 700, fontSize: 44, flexWrap: 'nowrap', color: hexA(p.textColor, 0.88) }} />
          {p.handle && frame >= B3 + 14 && (
            <span style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 34, color: p.accent2, letterSpacing: '0.01em' }}>
              {typed(frame, B3 + 14, FPS, 22, p.handle)}
              <span style={{ opacity: Math.floor(frame / 15) % 2 ? 0.9 : 0.15 }}>▍</span>
            </span>
          )}
        </div>
      </div>

      {/* Photo (or the seal when there's no photo) */}
      <div
        style={{
          position: 'absolute',
          left: cx - D / 2,
          top: cy - D / 2,
          width: D,
          height: D,
          scale: String(mix(0.4, 1, pop) * mix(1, 0.6, outT)),
          opacity: clamp(pop * 2) * (1 - outT),
          rotate: p.photo ? '0deg' : `${mix(-30, -8, pop) + Math.sin(frame / 45) * 3}deg`,
        }}
      >
        {p.photo ? (
          <>
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: `conic-gradient(from ${frame * 1.2}deg, ${p.accent}, ${p.accent2}, ${p.accent})`, boxShadow: `0 20px 50px ${hexA('#000000', 0.5)}` }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${p.panel}` }}>
              <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(mix(1.15, 1.02, prog(frame, B2, 200, ease.outSoft))) }} />
            </div>
            <div style={{ position: 'absolute', right: -34, top: -26, rotate: `${-12 + Math.sin(frame / 45) * 4}deg`, scale: String(prog(frame, B2 + 8, 22, ease.backOut)), filter: `drop-shadow(0 8px 14px ${hexA('#000000', 0.45)})` }}>
              <Seal size={104} accent={p.accent} id="clt-b" />
            </div>
          </>
        ) : (
          <div style={{ filter: `drop-shadow(0 18px 30px ${hexA('#000000', 0.5)})` }}>
            <Seal size={D} accent={p.accent} id="clt" />
          </div>
        )}
      </div>

      {/* Sparks that fly off the seal on the pop */}
      <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
        {Array.from({ length: 10 }, (_, i) => {
          const t = prog(frame, B2 - 2, 34, ease.out);
          const a = (i / 10) * Math.PI * 2 + 0.3;
          const r0 = D * 0.55 + t * 120 * (0.7 + rand(i) * 0.6);
          const r1 = r0 - 26 * (1 - t);
          return (
            <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * r0} y2={cy + Math.sin(a) * r0} stroke={i % 3 ? p.accent2 : p.accent} strokeWidth={4} strokeLinecap="round" opacity={frame >= B2 - 2 ? (1 - t) * 0.9 : 0} />
          );
        })}
        <circle cx={cx} cy={cy} r={D * 0.55 + prog(frame, B2 - 2, 40) * 140} fill="none" stroke={p.accent2} strokeWidth={mix(4, 0.5, prog(frame, B2 - 2, 40))} opacity={frame >= B2 - 2 ? (1 - prog(frame, B2 - 2, 40)) * 0.6 : 0} />
      </svg>

      {p.preview && <Dust frame={frame} width={W} height={H} count={40} color={p.accent2} seed={3} speed={0.6} opacity={0.35} maxSize={4} />}
      {p.preview && <FilmOverlay grain={0.05} vignette={0} frame={frame} />}
    </AbsoluteFill>
  );
}
