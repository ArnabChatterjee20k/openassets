import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Sprue Launch',
  category: 'launch',
  description:
    'Vertical launch film for a rapid-manufacturing service: a CAD file drops in and its part draws itself, the quote ticks down on the beat, the mold slams shut with a heat flash and pops a fresh lime part, then the 70s sunrise, title and CTA land.',
  tags: ['launch', 'manufacturing', 'story', 'vertical', 'product', '70s'],
};

// 60 fps, 120 BPM: 1 beat = 30 frames, 1 bar = 120. 10 s = 5 bars.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Introducing Sprue'),
  step: text('Upload line').default('Drop in your STEP file'),
  fileName: text('File name').default('motor_bracket_v7.step'),
  quoteSpec: text('Quote spec').default('PA12 Nylon · 2,500 pcs'),
  price: text('Final price').default('$0.42'),
  priceUnit: text('Price unit').default('per part · quoted in 41 s'),
  title: text().default('Parts in 5 days.'),
  tagline: text().default('Real injection-molded parts. No 10-week tooling wait.'),
  cta: text('Call to action').default('Get a quote → sprue.parts'),
  font: font('Title font').default('shrikhand'),
  background: color().default('#0E1A14'),
  surface: color().default('#18291F'),
  textColor: color('Text').default('#EAF2DC'),
  accent: color('Part / accent').default('#B5E550'),
  accent2: color('Stripe 2').default('#4E8A5B'),
  pop: color('Heat / pop').default('#FF9F43'),
  productImage: image('Part photo (optional, replaces the gear)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', textColor: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F' },
  cherry: { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#F7B32B', accent2: '#E3173E', pop: '#F5C6AA', title: 'Bridge parts, fast.' },
  'tpu-run': { fileName: 'grip_overmold_v3.step', quoteSpec: 'TPU 85A · 10,000 pcs', price: '$0.19', priceUnit: 'per part · quoted in 38 s', title: 'Soft parts, hard deadlines.' },
  'mid-century': { background: '#F4E9D8', surface: '#E6D3B3', textColor: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', font: 'fraunces' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

function gearPath(R: number, r: number, n = 8) {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = (Math.PI * 2) / n;
    for (const [da, rad] of [[-0.5, r], [-0.22, r], [-0.14, R], [0.14, R], [0.22, r]] as const) {
      const ang = a + da * s;
      out.push(`${(Math.cos(ang) * rad).toFixed(1)},${(Math.sin(ang) * rad).toFixed(1)}`);
    }
  }
  return `M${out.join(' L')} Z`;
}
const GEAR = gearPath(1, 0.78);

// Beat map
const DROP = 6; // file card drops
const QUOTE = T.bars(1); // quote ticks on beats
const SLAM = T.bars(2); // mold slams shut: the hit
const OPEN = SLAM + T.beats(1) - 6;
const CLEAR = SLAM + T.beats(2); // mold halves leave
const TITLE = SLAM + T.beats(3);
const SUN = T.bars(3);
const CTA = T.bars(3) + T.beats(2);
const GLINT = T.bars(4);

export default function SprueLaunch(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const cx = W / 2;
  const cy = 820;
  const dark = isDark(p.background);
  const ink = dark ? '#050B08' : mixHex(p.textColor, p.background, 0.1);

  // Act 1 + 2 leave just before the slam.
  const actOut = prog(frame, SLAM - 16, 14, ease.in);
  const fileIn = prog(frame, DROP, 26, ease.backOut);
  const fileUp = prog(frame, QUOTE - 10, 30, ease.inOutSoft);
  const draw = prog(frame, DROP + 14, 80, ease.inOutSoft);

  // Quote tick
  const target = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0.42;
  const cur = p.price.match(/^[^0-9]*/)?.[0] ?? '$';
  const steps = [9.05, 4.6, 2.1, 1];
  const tick = Math.min(3, Math.max(0, Math.floor((frame - QUOTE) / T.beat)));
  const tickPulse = frame >= QUOTE ? 1 - prog(frame, QUOTE + tick * T.beat, 16, ease.out) : 0;
  const priceText = tick === 3 ? p.price : `${cur}${(target * steps[tick]).toFixed(2)}`;
  const quoteIn = prog(frame, QUOTE, 26, ease.out);

  // The hit
  const slamIn = prog(frame, SLAM - 18, 18, ease.in);
  const opened = prog(frame, OPEN, 28, ease.out);
  const cleared = prog(frame, CLEAR, 36, ease.inOut);
  const gap = 250 * opened;
  const heat = keys(frame, [SLAM, SLAM + 4, OPEN + 10], [0, 1, 0], [ease.out, ease.inSoft]);
  const flash = keys(frame, [SLAM - 2, SLAM + 2, SLAM + 28], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, SLAM, 60, ease.out);
  const shake = frame >= SLAM && frame < SLAM + 16 ? Math.sin(frame * 2.7) * (1 - (frame - SLAM) / 16) * 14 : 0;
  const pop = prog(frame, OPEN + 4, 34, ease.backOut);
  const gearR = 190;
  const gearY = cy - mix(0, 40, prog(frame, CLEAR, 40, ease.inOutSoft)) + Math.sin(frame / 30) * 8;
  const spin = (frame - OPEN) * 0.4 + mix(-140, 0, prog(frame, OPEN, 50, ease.out));

  const sun = prog(frame, SUN - 20, 50, ease.inOutSoft);
  const push = mix(1, 1.05, prog(frame, SLAM, end - SLAM, ease.inOutSoft));
  const outro = prog(frame, end - 36, 36, ease.inOut);

  const titleSize = p.title.length > 18 ? 108 : 138;
  const titleTop = 1170;
  const titleStyle = {
    position: 'absolute' as const,
    left: 60,
    width: W - 120,
    top: titleTop,
    textAlign: 'center' as const,
    ...displayFace(p.font),
    fontStyle: p.font === 'fraunces' ? ('italic' as const) : undefined,
    fontSize: titleSize,
    lineHeight: 1.02,
    letterSpacing: '-0.02em',
    textWrap: 'balance' as const,
  };

  const plastic = (
    <linearGradient id="sl-pl" x1="0.15" y1="0" x2="0.75" y2="1">
      <stop offset="0" stopColor={mixHex(p.accent, '#ffffff', 0.5)} />
      <stop offset="0.45" stopColor={p.accent} />
      <stop offset="1" stopColor={mixHex(p.accent, '#000000', 0.3)} />
    </linearGradient>
  );

  const half = (dir: -1 | 1) => {
    const closedY = dir < 0 ? cy - 300 : cy;
    const offY = dir < 0 ? -800 : H + 400;
    const startY = dir < 0 ? -520 : H + 100;
    let y = mix(startY, closedY, slamIn) + dir * gap;
    y = mix(y, offY, cleared);
    return (
      <div
        key={dir}
        style={{
          position: 'absolute',
          left: cx - 360,
          top: y,
          width: 720,
          height: 300,
          borderRadius: 44,
          background: `linear-gradient(${dir < 0 ? 180 : 0}deg, ${mixHex(p.accent2, '#ffffff', 0.12)}, ${mixHex(p.accent2, '#000000', 0.25)})`,
          border: `6px solid ${ink}`,
          boxShadow: `14px 16px 0 ${ink}, inset 0 ${dir < 0 ? -10 : 10}px 0 ${hexA(p.pop, heat * 0.9)}`,
          opacity: frame < SLAM - 18 ? 0 : 1,
        }}
      >
        {/* guide-pin bushings */}
        {[60, 660].map((x) => (
          <div key={x} style={{ position: 'absolute', left: x - 22, top: dir < 0 ? 236 : 20, width: 44, height: 44, borderRadius: '50%', background: mixHex(p.accent2, '#000000', 0.45), border: `4px solid ${ink}` }} />
        ))}
        {dir < 0 && <div style={{ position: 'absolute', left: 360 - 40, top: -70, width: 80, height: 80, borderRadius: '18px 18px 8px 8px', background: hexA(p.pop, 0.4 + heat * 0.6), border: `6px solid ${ink}`, boxShadow: `0 0 ${40 * heat}px ${p.pop}` }} />}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.06 : 0.1, size: 44, y: -frame * 0.15, color: dark ? '234,242,220' : '28,43,26' }}
        glows={[
          { x: cx, y: cy, size: mix(900, 1600, prog(frame, SLAM, 60)), color: hexA(p.accent, dark ? 0.3 : 0.22), opacity: 0.6 + 0.15 * Math.sin(frame / 40) },
          { x: cx - 420, y: 260, size: 1100, color: hexA(p.accent2, 0.45), opacity: 0.6 },
          { x: cx + 400, y: 1700, size: 1000, color: hexA(p.pop, 0.25), opacity: prog(frame, SLAM, 60) * 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.12}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={50} color={p.accent} seed={4} speed={0.8} opacity={dark ? 0.4 : 0.6} />

        {/* Eyebrow, throughout */}
        <div
          style={{
            position: 'absolute',
            width: W,
            top: 150,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 18,
            fontFamily: FONTS.outfit,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: dark ? p.accent : p.textColor,
            opacity: prog(frame, 0, 24),
            translate: `0 ${mix(-20, 0, prog(frame, 0, 30))}px`,
          }}
        >
          <span style={{ display: 'inline-flex', gap: 6 }}>
            {[p.accent, p.accent2, p.pop].map((c) => (
              <span key={c} style={{ width: 9, height: 34, borderRadius: 9, background: c, rotate: '18deg' }} />
            ))}
          </span>
          {p.eyebrow}
        </div>

        {/* 70s triple-stripe sunrise behind the part */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <defs>
            <clipPath id="sl-sun">
              <rect x="0" y="0" width={W} height={cy + 190} />
            </clipPath>
          </defs>
          <g clipPath="url(#sl-sun)" fill="none">
            {[p.accent, p.accent2, p.pop].map((c, i) => {
              const r = 440 - i * 60;
              const len = Math.PI * r;
              const t = clamp(sun * 1.3 - i * 0.15);
              return (
                <circle
                  key={c}
                  cx={cx}
                  cy={cy + 190}
                  r={r}
                  stroke={c}
                  strokeWidth={52}
                  strokeDasharray={`${len * t} ${len * 3}`}
                  transform={`rotate(180 ${cx} ${cy + 190})`}
                />
              );
            })}
          </g>
        </svg>

        {/* Act 1: the CAD file */}
        {frame < SLAM && (
          <div
            style={{
              position: 'absolute',
              left: cx - 330,
              top: mix(mix(-500, 470, fileIn), 300, fileUp),
              width: 660,
              scale: String(mix(1, 0.82, fileUp) * mix(1, 0.6, actOut)),
              opacity: 1 - actOut,
              filter: actOut > 0 ? `blur(${actOut * 14}px)` : undefined,
              transformOrigin: '50% 0',
            }}
          >
            <div style={{ borderRadius: 40, background: p.surface, border: `4px solid ${hexA(p.textColor, 0.12)}`, boxShadow: `14px 16px 0 ${ink}`, padding: 36, rotate: `${mix(-6, -2, fileIn)}deg` }}>
              <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 28, letterSpacing: '0.2em', textTransform: 'uppercase', color: dark ? p.accent : p.textColor, opacity: 0.85 }}>{p.step}</div>
              <svg viewBox="-1.3 -1.3 2.6 2.6" width={588} height={360} style={{ display: 'block', marginTop: 16 }}>
                {[-1, -0.5, 0, 0.5, 1].map((v) => (
                  <g key={v} stroke={hexA(p.textColor, 0.08)} strokeWidth={0.008}>
                    <line x1={-2} x2={2} y1={v} y2={v} />
                    <line x1={v * 1.6} x2={v * 1.6} y1={-2} y2={2} />
                  </g>
                ))}
                <path d={GEAR} fill="none" stroke={p.accent} strokeWidth={0.03} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinejoin="round" />
                <circle r={0.24} fill="none" stroke={p.accent} strokeWidth={0.03} pathLength={1} strokeDasharray={`${draw} 1`} />
                <path d={GEAR} fill={hexA(p.accent, 0.12 * draw)} transform="translate(0.06 0.08)" stroke={hexA(p.accent, 0.35)} strokeWidth={0.01} pathLength={1} strokeDasharray={`${draw} 1`} />
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                <span style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 32, color: p.textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{p.fileName}</span>
                <span style={{ height: 12, width: 160, borderRadius: 99, background: hexA(p.textColor, 0.12), overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${draw * 100}%`, background: p.accent }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Act 2: the quote ticking down on beats */}
        {frame >= QUOTE - 4 && frame < SLAM && (
          <div
            style={{
              position: 'absolute',
              left: cx - 360,
              top: mix(1220, 1000, quoteIn),
              width: 720,
              opacity: quoteIn * (1 - actOut),
              scale: String(mix(1, 0.7, actOut)),
              filter: actOut > 0 ? `blur(${actOut * 14}px)` : undefined,
            }}
          >
            <div style={{ borderRadius: 40, background: dark ? p.textColor : '#FFFDF5', color: dark ? p.background : p.textColor, boxShadow: `14px 16px 0 ${ink}`, padding: '34px 44px', rotate: '2deg' }}>
              <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 30, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>{p.quoteSpec}</div>
              <div style={{ ...displayFace('shrikhand'), fontSize: 168, lineHeight: 1.1, color: tick === 3 ? mixHex(p.pop, '#000000', dark ? 0.1 : 0.15) : dark ? p.background : p.textColor, scale: String(1 + tickPulse * 0.08), transformOrigin: '0 60%' }}>
                {priceText}
              </div>
              <div style={{ fontFamily: FONTS.fraunces, fontWeight: 600, fontSize: 44, opacity: 0.8 }}>{p.priceUnit}</div>
            </div>
          </div>
        )}

        {/* The hit: shockwave + streaks + the mold */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <circle cx={cx} cy={cy} r={240 + shock * 900} fill="none" stroke={p.pop} strokeWidth={mix(14, 1, shock)} opacity={frame >= SLAM ? (1 - shock) * 0.8 : 0} />
          <circle cx={cx} cy={cy} r={240 + prog(frame, SLAM + 5, 70) * 700} fill="none" stroke={p.accent} strokeWidth={mix(5, 0.5, prog(frame, SLAM + 5, 70))} opacity={frame >= SLAM + 5 ? (1 - prog(frame, SLAM + 5, 70)) * 0.6 : 0} />
        </svg>
        <Streaks frame={frame} start={SLAM} dur={50} direction="out" count={150} width={W} height={H} cy={cy} seed={13} intensity={1.1} color={p.pop} highlight={p.accent} />

        {/* The fresh part */}
        {frame >= OPEN && (
          <div style={{ position: 'absolute', left: cx - gearR, top: gearY - gearR, width: gearR * 2, height: gearR * 2, scale: String(pop), filter: `drop-shadow(14px 16px 0 ${ink})` }}>
            {p.productImage ? (
              <Img src={p.productImage} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <svg viewBox="-1.1 -1.1 2.2 2.2" width="100%" height="100%" style={{ overflow: 'visible', rotate: `${spin}deg` }}>
                <defs>{plastic}</defs>
                <path d={GEAR} fill="url(#sl-pl)" stroke={ink} strokeWidth={0.035} strokeLinejoin="round" />
                <circle r={0.26} fill={p.background} stroke={ink} strokeWidth={0.035} />
                <circle r={0.5} fill="none" stroke={mixHex(p.accent, '#000000', 0.18)} strokeWidth={0.03} />
                <ellipse cx={-0.42} cy={-0.5} rx={0.2} ry={0.07} fill="#ffffff" opacity={0.6} transform="rotate(-38 -0.42 -0.5)" />
              </svg>
            )}
          </div>
        )}
        {half(-1)}
        {half(1)}

        {/* Title, tagline, CTA */}
        {frame >= TITLE && (
          <>
            <SweepReveal frame={frame} start={TITLE} dur={30} style={titleStyle}>
              <span style={{ color: p.textColor, textShadow: `8px 9px 0 ${ink}` }}>{p.title}</span>
            </SweepReveal>
            <Glint frame={frame} start={GLINT} dur={44} style={titleStyle}>
              {p.title}
            </Glint>
          </>
        )}
        <WordsIn
          text={p.tagline}
          frame={frame}
          start={TITLE + 24}
          stagger={3}
          style={{ position: 'absolute', left: 110, width: W - 220, top: titleTop + titleSize * (p.title.length > 10 ? 2.2 : 1.2), justifyContent: 'center', textAlign: 'center', fontFamily: FONTS.fraunces, fontWeight: 600, fontSize: 48, lineHeight: 1.3, opacity: 0.88 }}
        />
        <div style={{ position: 'absolute', width: W, top: 1680, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: FONTS.outfit,
              fontWeight: 800,
              fontSize: 44,
              padding: '26px 52px',
              borderRadius: 999,
              color: isDark(p.accent) ? '#FFFDF5' : '#0E1A14',
              background: p.accent,
              boxShadow: `10px 12px 0 ${ink}`,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, CTA, 26, ease.backOut) * (1 + Math.max(0, Math.sin((frame - CTA) / 12)) * 0.015 * (frame > CTA + 30 ? 1 : 0))),
              opacity: clamp(prog(frame, CTA, 10)),
            }}
          >
            {p.cta}
          </div>
        </div>
      </AbsoluteFill>

      {/* heat flash, screen-blended */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${(cy / H) * 100}%, ${hexA('#ffffff', flash)} 0%, ${hexA(p.pop, flash * 0.7)} 26%, transparent 62%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.45 : 0.15} frame={frame} />
    </AbsoluteFill>
  );
}
