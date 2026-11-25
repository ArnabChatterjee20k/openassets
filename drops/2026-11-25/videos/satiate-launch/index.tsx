import { DropIcon, SmileyMehIcon, SyringeIcon } from '@phosphor-icons/react/ssr';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { type Glyph, Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Satiate Launch',
  category: 'launch',
  description:
    'Vertical launch story for a health app: a chrome weekly dose dial ticks Mon→Wed on the beat, shot day fills with a flash, the product name sweeps in huge, three jelly feature capsules pop on beats and an App Store CTA lands. Optional screenshot rises in a silver phone.',
  tags: ['launch', 'app', 'story', 'reels', 'health', 'glp-1'],
};

// 60 fps, 120 BPM: 1 beat = 30 frames, 1 bar = 120 frames. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('new · ios & android'),
  product: text('Product name').default('satiate'),
  tagline: text().default('Your GLP-1 week, in one calm app.'),
  feature1: text('Feature 1').default('Log every dose and site'),
  feature2: text('Feature 2').default('Spot side effects early'),
  feature3: text('Feature 3').default('Build protein & water habits'),
  cta: text('Call to action').default('Free on iOS & Android'),
  url: text('URL').default('satiate.app'),
  dose: text('Dose in the dial').default('2.5 mg'),
  screenshot: image('App screenshot (optional)').default(''),
  font: font('Title font').default('syne'),
  background: color().default('#DADDE3'),
  chrome: color('Chrome').default('#C3C8D1'),
  accent: color().default('#3D5AFE'),
  pop: color('Pop').default('#FF3DB4'),
  textColor: color('Text').default('#101219'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lilac: { background: '#E9E3F5', chrome: '#D6CCEC', accent: '#5E4AE3', pop: '#2EC4B6', textColor: '#231942' },
  sorbet: { background: '#FFEDE1', chrome: '#FFD3C2', accent: '#FF4F6D', pop: '#7B2CBF', textColor: '#3D0E2A', dose: '0.25 mg', tagline: 'Week one, handled together.' },
  midnight: { background: '#0D0D0F', chrome: '#4A4A54', accent: '#C9A45C', pop: '#E8D9B5', textColor: '#F3EDE2', font: 'bricolage' },
};

type P = z.infer<typeof schema>;
const DAYS = ['m', 't', 'w', 't', 'f', 's', 's'];
const SHOT = 3; // Thursday
const SEG = 360 / 7;
const ROT = -(SHOT + 0.5) * SEG + 50; // shot day sits at about 1:30

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

/** The weekly dose dial. Days M–W tick on beats in bar 1; shot day fills on the downbeat of bar 2. */
function Dial({ frame, p, IMPACT, size }: { frame: number; p: P; IMPACT: number; size: number }) {
  const dark = isDark(p.background);
  const c = size / 2;
  const r = size * 0.42;
  const track = r * 0.8;
  const draw = prog(frame, 0, 40, ease.out);
  const spin = mix(-60, 0, draw) + Math.sin(frame / 50) * 1.5;
  const fill = prog(frame, IMPACT - 4, 18, ease.out);
  const ink = p.textColor;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="ln-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.3" stopColor={p.chrome} />
          <stop offset="0.52" stopColor="#F4F6FA" />
          <stop offset="0.75" stopColor={dark ? '#1A1A1F' : hexA(ink, 0.5)} />
          <stop offset="1" stopColor={p.chrome} />
        </linearGradient>
        <radialGradient id="ln-face" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor={dark ? '#2A2A30' : '#F8F9FC'} />
          <stop offset="1" stopColor={dark ? '#121216' : p.chrome} />
        </radialGradient>
        <linearGradient id="ln-jelly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.45" stopColor={p.accent} />
          <stop offset="1" stopColor={p.accent} />
        </linearGradient>
        <filter id="ln-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={size * 0.018} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx={c} cy={c + r * 1.12} rx={r * 0.8} ry={r * 0.08} fill={hexA('#000000', dark ? 0.5 : 0.18)} style={{ filter: `blur(${size * 0.02}px)` }} />
      <g transform={`rotate(${spin} ${c} ${c})`}>
        <circle cx={c} cy={c} r={r} fill="url(#ln-chrome)" />
        <circle cx={c} cy={c} r={r * 0.93} fill="url(#ln-face)" stroke={hexA(ink, 0.22)} strokeWidth={2} />
        {Array.from({ length: 56 }, (_, i) => {
          const [x0, y0] = polar(c, c, r * 0.9, (i / 56) * 360);
          const [x1, y1] = polar(c, c, r * (i % 8 === 0 ? 0.85 : 0.875), (i / 56) * 360);
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={hexA(ink, 0.35)} strokeWidth={2} opacity={clamp(draw * 56 - i)} />;
        })}
        {DAYS.map((d, i) => {
          const a0 = ROT + i * SEG + 3;
          const a1 = ROT + (i + 1) * SEG - 3;
          const at = (i + 1) * T.beat - 6; // M, T, W tick on beats 1–3
          const on = i < SHOT ? prog(frame, at, 14, ease.backOut) : 0;
          const shot = i === SHOT;
          const [lx, ly] = polar(c, c, r * 1.13, ROT + (i + 0.5) * SEG);
          return (
            <g key={i}>
              <path d={arc(c, c, track, a0, a1)} fill="none" strokeLinecap="round" strokeWidth={r * 0.12} stroke={hexA(ink, 0.08)} />
              {i < SHOT && <path d={arc(c, c, track, a0, mix(a0, a1, clamp(on)))} fill="none" strokeLinecap="round" strokeWidth={r * 0.12} stroke={hexA(ink, dark ? 0.55 : 0.32)} />}
              {shot && fill > 0 && <path d={arc(c, c, track, a0, mix(a0, a1, fill))} fill="none" strokeLinecap="round" strokeWidth={r * 0.15} stroke={p.accent} filter="url(#ln-glow)" />}
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={FONTS.majormono}
                fontSize={r * 0.11}
                fill={shot && fill > 0.5 ? p.accent : ink}
                opacity={shot ? 0.5 + fill * 0.5 : i < SHOT ? 0.4 + on * 0.5 : 0.35}
                transform={`rotate(${-spin} ${lx} ${ly})`}
              >
                {d}
              </text>
            </g>
          );
        })}
        {fill > 0.9 && (() => {
          const [x, y] = polar(c, c, track, ROT + (SHOT + 0.5) * SEG);
          return <circle cx={x} cy={y} r={r * 0.045 * prog(frame, IMPACT + 8, 16, ease.backOut)} fill={p.pop} stroke="#ffffff" strokeWidth={4} />;
        })()}
      </g>
      {/* jelly capsule */}
      <g transform={`translate(${c} ${c}) scale(${mix(0.6, 1, prog(frame, 16, 30, ease.backOut))})`} opacity={prog(frame, 16, 16)}>
        <rect x={-r * 0.52} y={-r * 0.2} width={r * 1.04} height={r * 0.4} rx={r * 0.2} fill="url(#ln-jelly)" stroke={hexA(ink, 0.2)} strokeWidth={2} />
        <rect x={-r * 0.42} y={-r * 0.17} width={r * 0.66} height={r * 0.08} rx={r * 0.04} fill="#ffffff" opacity={0.55} />
        <text x={0} y={r * 0.015} textAnchor="middle" dominantBaseline="central" fontFamily={FONTS.syne} fontWeight={800} fontSize={r * (p.dose.length > 6 ? 0.13 : 0.16)} letterSpacing="-0.02em" fill="#F6F7FA">
          {p.dose}
        </text>
      </g>
    </svg>
  );
}

const FEATURES: Glyph[] = [SyringeIcon, SmileyMehIcon, DropIcon];

function Capsule({ label, Icon, frame, at, p, width }: { label: string; Icon: Glyph; frame: number; at: number; p: P; width: number }) {
  const t = prog(frame, at, 24, ease.backOut);
  const dark = isDark(p.background);
  if (!label) return null;
  return (
    <div
      style={{
        width,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '18px 34px 18px 18px',
        borderRadius: 999,
        background: dark ? 'linear-gradient(180deg, #34343C, #18181D)' : `linear-gradient(180deg, #FFFFFF 0%, ${p.chrome} 60%, #EEF0F5 100%)`,
        border: `1.5px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)'}`,
        boxShadow: `0 22px 50px ${hexA('#101219', dark ? 0.5 : 0.16)}, inset 0 2px 0 rgba(255,255,255,${dark ? 0.12 : 0.95})`,
        opacity: clamp(t * 1.6),
        translate: `${mix(-80, 0, t)}px 0`,
        scale: String(mix(0.85, 1, t)),
      }}
    >
      <div style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `radial-gradient(circle at 35% 28%, ${hexA('#ffffff', 0.7)} 0%, ${p.accent} 55%)`, flexShrink: 0 }}>
        <Icon size={46} weight="fill" color="#F6F7FA" />
      </div>
      <span style={{ fontFamily: FONTS.bricolage, fontWeight: 600, fontSize: 46, color: p.textColor, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  );
}

export default function SatiateLaunch(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const end = video.durationInFrames;
  const IMPACT = T.bars(1); // shot day fills, flash, title
  const FEAT = T.bars(2); // capsules on beats
  const CTA = T.bars(3); // CTA lands, glint

  const flash = keys(frame, [IMPACT - 2, IMPACT + 2, IMPACT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, IMPACT, 50, ease.out);
  const shake = frame >= IMPACT && frame < IMPACT + 14 ? Math.sin(frame * 2.7) * (1 - (frame - IMPACT) / 14) * 9 : 0;
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 30, 30, ease.inOut);

  // Dial: big and centred for bar 1, then rises and shrinks to make room for the title.
  const move = prog(frame, IMPACT + 10, 50, ease.inOutSoft);
  const dialSize = mix(860, 500, move);
  const dialY = mix(H * 0.38, 500, move);
  const hasShot = !!p.screenshot;

  const TITLE = Math.min(230, (W - 140) / Math.max(4, p.product.length * 0.82));
  const titleTop = 790;
  // Bar-1 status chip under the dial: updates on every beat, then clears for the hit.
  const STATUS = ['this week', 'mon · water 2.1 l', 'tue · 96 g protein', 'wed · nausea: mild'];
  const statusIdx = Math.min(3, Math.floor(frame / T.beat));
  const statusLocal = frame - statusIdx * T.beat;
  const statusIn = prog(statusLocal, 0, 14, ease.out);
  const statusOut = prog(frame, IMPACT - 10, 12, ease.in);
  const titleBlock = { position: 'absolute' as const, left: 0, width: W, top: titleTop, textAlign: 'center' as const, ...displayFace(p.font), fontSize: TITLE, lineHeight: 1, letterSpacing: '-0.045em', whiteSpace: 'nowrap' as const };
  const featTop = titleTop + TITLE + 180;
  // With a screenshot the capsules float over the phone, then clear for the CTA.
  const featOut = hasShot ? prog(frame, CTA - 12, 20, ease.in) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.06 : 0.14, size: 46, y: -frame * 0.15, color: dark ? '255,255,255' : '16,18,25' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)'}
        glows={[
          { x: W / 2, y: dialY, size: mix(1200, 1700, flash), color: hexA(p.accent, dark ? 0.35 : 0.22), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: W * 0.9, y: H * 0.85, size: 1100, color: hexA(p.pop, dark ? 0.22 : 0.16), opacity: 0.9 },
          { x: W * 0.15, y: 0, size: 1300, color: hexA('#ffffff', dark ? 0.04 : 0.8), opacity: 0.9 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.15}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={50} color={dark ? p.pop : p.accent} seed={4} speed={0.8} opacity={0.35} />

        {/* Eyebrow */}
        <div style={{ position: 'absolute', top: 150, width: W, display: 'flex', justifyContent: 'center', opacity: prog(frame, 10, 24), translate: `0 ${mix(-20, 0, prog(frame, 10, 30))}px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 30px', borderRadius: 999, fontFamily: FONTS.majormono, fontSize: 40, letterSpacing: '0.12em', color: p.textColor, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', border: `1.5px solid ${hexA(p.textColor, 0.12)}` }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${10 + 6 * Math.sin(frame / 8)}px ${p.pop}` }} />
            {p.eyebrow}
          </div>
        </div>

        {/* Impact rings + streak burst from the dial */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={W / 2} cy={dialY} r={420 + shock * 700} fill="none" stroke={p.accent} strokeWidth={mix(12, 1, shock)} opacity={frame >= IMPACT ? (1 - shock) * 0.7 : 0} />
          <circle cx={W / 2} cy={dialY} r={420 + prog(frame, IMPACT + 5, 60) * 500} fill="none" stroke={p.pop} strokeWidth={mix(5, 0.5, prog(frame, IMPACT + 5, 60))} opacity={frame >= IMPACT + 5 ? (1 - prog(frame, IMPACT + 5, 60)) * 0.6 : 0} />
        </svg>
        <Streaks frame={frame} start={IMPACT} dur={44} direction="out" count={90} width={W} height={H} seed={21} intensity={0.8} color={p.accent} highlight={p.pop} />

        {/* Dial (or, with a screenshot, it shrinks to a badge on the phone later) */}
        <div style={{ position: 'absolute', left: W / 2 - dialSize / 2, top: dialY - dialSize / 2, width: dialSize, height: dialSize, opacity: prog(frame, 0, 20), scale: String(mix(0.86, 1, prog(frame, 0, 40, ease.out))) }}>
          <Dial frame={frame} p={p} IMPACT={IMPACT} size={dialSize} />
        </div>

        {frame < IMPACT && (
          <div style={{ position: 'absolute', width: W, top: H * 0.38 + 500, display: 'flex', justifyContent: 'center', opacity: prog(frame, 8, 20) * (1 - statusOut) }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '20px 40px',
                borderRadius: 999,
                fontFamily: FONTS.majormono,
                fontSize: 46,
                letterSpacing: '0.06em',
                color: p.textColor,
                background: dark ? 'linear-gradient(180deg, #34343C, #18181D)' : `linear-gradient(180deg, #FFFFFF, ${p.chrome})`,
                boxShadow: `0 18px 40px ${hexA('#101219', 0.14)}, inset 0 2px 0 rgba(255,255,255,${dark ? 0.1 : 0.95})`,
                translate: `0 ${mix(16, 0, statusIn)}px`,
                filter: statusIn < 1 ? `blur(${(1 - statusIn) * 6}px)` : undefined,
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: statusIdx === 0 ? hexA(p.textColor, 0.3) : p.accent, boxShadow: statusIdx ? `0 0 14px ${p.accent}` : undefined }} />
              {STATUS[statusIdx]}
            </div>
          </div>
        )}

        {/* Title */}
        {frame >= IMPACT && (
          <>
            <SweepReveal frame={frame} start={IMPACT + 4} dur={34} style={titleBlock}>
              <span style={{ color: p.textColor }}>{p.product}</span>
            </SweepReveal>
            <Glint frame={frame} start={CTA} dur={44} style={titleBlock}>
              {p.product}
            </Glint>
          </>
        )}
        <WordsIn
          text={p.tagline}
          frame={frame}
          start={IMPACT + 30}
          style={{ position: 'absolute', left: 90, width: W - 180, top: titleTop + TITLE + 40, justifyContent: 'center', fontFamily: FONTS.bricolage, fontWeight: 600, fontSize: 52, lineHeight: 1.2, color: hexA(p.textColor, 0.85) }}
        />

        {/* Optional screenshot in a silver phone, rising behind the capsules */}
        {hasShot && (
          <div
            style={{
              position: 'absolute',
              left: W / 2 - 230,
              top: featTop - 30,
              width: 460,
              height: 940,
              borderRadius: 70,
              padding: 18,
              background: `linear-gradient(135deg, #FFFFFF, ${p.chrome} 40%, #F4F6FA 60%, ${p.chrome})`,
              boxShadow: `0 40px 90px ${hexA('#101219', 0.3)}`,
              translate: `0 ${mix(700, 0, prog(frame, FEAT - 10, 50, ease.out))}px`,
            }}
          >
            <Img src={p.screenshot} style={{ width: '100%', height: '100%', borderRadius: 54, objectFit: 'cover' }} />
          </div>
        )}

        {/* Feature capsules pop on beats in bar 3 */}
        <div style={{ position: 'absolute', left: 0, width: W, top: featTop + (hasShot ? 220 : 0), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, opacity: 1 - featOut, translate: `${featOut * -60}px 0` }}>
          {[p.feature1, p.feature2, p.feature3].map((f, i) => (
            <Capsule key={i} label={f} Icon={FEATURES[i]} frame={frame} at={FEAT + i * T.beat} p={p} width={hasShot ? 820 : 880} />
          ))}
        </div>

        {/* CTA lands on the downbeat of bar 4 */}
        <div style={{ position: 'absolute', width: W, top: H - 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              padding: '30px 64px',
              borderRadius: 999,
              fontFamily: FONTS.bricolage,
              fontWeight: 800,
              fontSize: 50,
              color: '#F6F7FA',
              background: `linear-gradient(180deg, ${hexA('#ffffff', 0.45)} 0%, ${p.accent} 45%, ${p.accent} 100%)`,
              backgroundColor: p.accent,
              boxShadow: `0 24px 60px ${hexA(p.accent, 0.45)}, inset 0 -4px 0 rgba(0,0,0,0.15)`,
              scale: String(prog(frame, CTA, 26, ease.backOut)),
              opacity: clamp(prog(frame, CTA, 10)),
              whiteSpace: 'nowrap',
            }}
          >
            {p.cta}
          </div>
          <div style={{ fontFamily: FONTS.majormono, fontSize: 44, letterSpacing: '0.1em', color: p.textColor, opacity: prog(frame, CTA + 10, 20) * 0.85 }}>{p.url}</div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${(dialY / H) * 100}%, ${hexA('#ffffff', flash)} 0%, ${hexA(p.accent, flash * 0.5)} 25%, transparent 60%)`, mixBlendMode: dark ? 'screen' : 'normal', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.04} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
