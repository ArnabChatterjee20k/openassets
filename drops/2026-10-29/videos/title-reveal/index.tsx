import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, SweepReveal, WordsIn, ease, gradientText, hexA, keys, mix, prog, rand, tempo, displayFace } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Storm Title',
  category: 'intro',
  description: 'Channel/episode intro: rain in the dark, a lightning strike draws itself and the title is revealed in the flash.',
  tags: ['intro', 'title', 'youtube', 'lightning', 'cinematic'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(3) };

export const schema = z.object({
  title: text().default('MIDNIGHT WEATHER'),
  subtitle: text().default('Episode 01 — The Storm'),
  font: font().default('unbounded'),
  background: color().default('#0A1517'),
  bolt: color('Lightning').default('#E6FFB3'),
  accent: color().default('#D4FF3A'),
  textColor: color('Text').default('#EAF4EF'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { bolt: '#E7B8FF', accent: '#FF2E88', background: '#12001F', textColor: '#FBEFFF', font: 'syne' },
  couture: { font: 'bodoni', title: 'Midnight Weather', accent: '#C9A45C', bolt: '#F3EDE2', background: '#0D0D0F', textColor: '#F3EDE2' },
  terminal: { font: 'vt323', title: 'midnight_weather', accent: '#C6FF00', bolt: '#F0FFE0', background: '#0B0B0B', textColor: '#F0FFE0' },
};

type P = z.infer<typeof schema>;

/** Deterministic jagged lightning path from (x0,y0) down to (x1,y1), with a couple of branches. */
function boltPaths(seed: number, x0: number, y0: number, x1: number, y1: number) {
  const main: [number, number][] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jitter = i === 0 || i === steps ? 0 : (rand(seed + i * 3.3) - 0.5) * 140 * Math.sin(Math.PI * t);
    main.push([mix(x0, x1, t) + jitter, mix(y0, y1, t)]);
  }
  const branches = [4, 8].map((at, b) => {
    const [bx, by] = main[at];
    const dir = rand(seed + b * 9) > 0.5 ? 1 : -1;
    return Array.from({ length: 5 }, (_, i) => [bx + dir * i * (40 + rand(seed + b + i) * 30), by + i * 45] as [number, number]);
  });
  const d = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return { main: d(main), branches: branches.map(d) };
}

function Strike({ frame, at, seed, x, W, p, scale = 1 }: { frame: number; at: number; seed: number; x: number; W: number; p: P; scale?: number }) {
  const local = frame - at;
  if (local < 0 || local > 40) return null;
  const draw = prog(frame, at, 6, ease.out);
  const fade = keys(frame, [at + 6, at + 9, at + 12, at + 40], [1, 0.3, 0.9, 0], [ease.out, ease.out, ease.in]); // double flicker
  const { main, branches } = boltPaths(seed, x, -20, x + (rand(seed) - 0.5) * 200, 640 * scale);
  return (
    <svg width={W} height={1080} style={{ position: 'absolute', inset: 0, opacity: fade, filter: `drop-shadow(0 0 12px ${p.bolt}) drop-shadow(0 0 40px ${hexA(p.bolt, 0.8)})` }}>
      {[main, ...branches].map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill="none"
          stroke={i === 0 ? '#ffffff' : p.bolt}
          strokeWidth={(i === 0 ? 5 : 2.5) * scale}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      ))}
    </svg>
  );
}

function Rain({ frame, W, H, color }: { frame: number; W: number; H: number; color: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: 140 }, (_, i) => {
        const depth = 0.3 + rand(i * 2.1) * 0.7;
        const len = 30 + depth * 70;
        const speed = 28 + depth * 30;
        const x = (rand(i * 5.7) * (W + 400) - frame * speed * 0.18 + W * 4) % (W + 400);
        const y = ((rand(i * 3.9) * H + frame * speed) % (H + 200)) - 100;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 1.2 + depth,
              height: len,
              background: `linear-gradient(180deg, transparent, ${hexA(color, 0.15 + depth * 0.35)})`,
              rotate: '12deg',
            }}
          />
        );
      })}
    </div>
  );
}

export default function StormTitle(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const cx = W / 2;
  const STRIKE = T.beats(2);
  const STRIKE2 = T.bars(2);
  const end = video.durationInFrames;

  const flash = keys(frame, [STRIKE, STRIKE + 2, STRIKE + 8, STRIKE + 11, STRIKE + 34], [0, 1, 0.25, 0.7, 0], [ease.out, ease.out, ease.out, ease.outSoft]);
  const flash2 = keys(frame, [STRIKE2, STRIKE2 + 2, STRIKE2 + 24], [0, 0.45, 0], [ease.out, ease.outSoft]);
  const shake = Math.max(0, 1 - (frame - STRIKE) / 30) * (frame >= STRIKE ? 1 : 0);
  const shakeX = (rand(frame * 1.3) - 0.5) * 18 * shake;
  const shakeY = (rand(frame * 2.9) - 0.5) * 12 * shake;
  const outro = prog(frame, end - 36, 36, ease.inOut);
  const push = mix(1.04, 1, prog(frame, STRIKE, end - STRIKE, ease.outSoft));
  const TITLE = p.title.length > 14 ? 128 : 160;
  const titleY = p.logo ? 560 : 470;
  const titleBlock = {
    position: 'absolute' as const,
    left: 0,
    width: W,
    top: titleY - TITLE / 2,
    textAlign: 'center' as const,
    ...displayFace(p.font),
    fontSize: TITLE,
    lineHeight: 1,
    letterSpacing: p.font === 'serif' ? '-0.02em' : '0.02em',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor }}>
      <AbsoluteFill style={{ translate: `${shakeX}px ${shakeY}px`, scale: String(push), opacity: 1 - outro }}>
        <Backdrop
          base={p.background}
          frame={frame}
          grid={false}
          lift={hexA(p.bolt, 0.05 + flash * 0.25)}
          glows={[
            // Storm clouds: big soft shapes lit from inside by the lightning
            { x: 380, y: 120, size: 1300, color: hexA(p.bolt, 0.18 + flash * 0.5), opacity: 0.8 },
            { x: 1500, y: 60, size: 1500, color: hexA(p.bolt, 0.12 + flash2 * 0.6), opacity: 0.8 },
            { x: cx, y: titleY, size: 1400, color: hexA(p.accent, 0.18), opacity: prog(frame, STRIKE, 60) },
          ]}
          grain={0}
          vignette={0.7}
        />
        <Rain frame={frame} W={W} H={H} color={p.bolt} />
        <Strike frame={frame} at={STRIKE} seed={7} x={cx - 140} W={W} p={p} />
        <Strike frame={frame} at={STRIKE2} seed={21} x={1500} W={W} p={p} scale={0.8} />

        {p.logo && (
          <Img
            src={p.logo}
            style={{
              position: 'absolute',
              left: cx - 90,
              top: titleY - TITLE / 2 - 220,
              width: 180,
              height: 180,
              objectFit: 'contain',
              opacity: prog(frame, STRIKE + 20, 30),
              scale: String(mix(0.9, 1, prog(frame, STRIKE + 20, 40))),
            }}
          />
        )}

        {frame >= STRIKE && (
          <>
            <SweepReveal frame={frame} start={STRIKE + 2} dur={28} blur={22} style={titleBlock}>
              <span style={gradientText(`linear-gradient(175deg, ${p.textColor} 30%, ${hexA(p.bolt, 1)} 70%, ${p.accent} 120%)`, TITLE)}>{p.title}</span>
            </SweepReveal>
            <Glint frame={frame} start={STRIKE2 + 4} dur={40} style={titleBlock}>
              {p.title}
            </Glint>
          </>
        )}

        <div style={{ position: 'absolute', left: cx - 200, top: titleY + TITLE * 0.62, width: 400, height: 2, background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)`, scale: `${prog(frame, STRIKE + 30, 40, ease.inOutSoft)} 1` }} />
        <WordsIn
          text={p.subtitle}
          frame={frame}
          start={STRIKE + 40}
          style={{ position: 'absolute', width: W, top: titleY + TITLE * 0.62 + 34, justifyContent: 'center', fontFamily: FONTS.spacemono, fontSize: 40, letterSpacing: '0.12em', textTransform: 'uppercase', color: hexA(p.textColor, 0.85) }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 45% 0%, ${hexA('#ffffff', flash * 0.9 + flash2 * 0.5)} 0%, ${hexA(p.bolt, flash * 0.4)} 35%, transparent 75%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.07} vignette={0.4} frame={frame} />
    </AbsoluteFill>
  );
}
