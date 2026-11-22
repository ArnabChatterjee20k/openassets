import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, gradientText, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'New World Launch Story',
  category: 'launch',
  description:
    'Vertical launch story for a new romance world: a flirty chat types in, a wax-seal heart stamps down with a flash, the world title sweeps in, then the love-interest card, opening date and CTA land on the beat.',
  tags: ['launch', 'story', 'romance', 'game', 'vertical', 'valentine'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Ardor · New world'),
  sender: text('Love interest name').default('Lucien'),
  line1: text('Their message').default('You came back.'),
  line2: text('Your reply').default('I always do.'),
  kicker: text('Title kicker').default('The'),
  title: text('World title').default('Midnight Court'),
  role: text('Character line').default('Vampire prince · Chapter 1'),
  dateLabel: text('Date label').default('Opens'),
  date: text().default('Feb 14'),
  cta: text('Call to action').default('Play free on Ardor'),
  portrait: image('Character art (optional)').default(''),
  background: color().default('#2A0A10'),
  surface: color().default('#3F1019'),
  accent: color('Seal / accent').default('#E3173E'),
  accent2: color('Second light').default('#F5C6AA'),
  pop: color('Spark').default('#F7B32B'),
  textColor: color('Text').default('#FFE8E0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regency: {
    eyebrow: 'Ardor · Season 2',
    sender: 'The Duke',
    line1: 'You owe me a dance.',
    line2: 'Then collect it.',
    title: "Duke's Wager",
    role: 'Duke of Ashbury · Chapter 1',
    date: 'Mar 01',
    background: '#0D0D0F',
    surface: '#1C1C20',
    accent: '#C9A45C',
    accent2: '#E8D9B5',
    pop: '#F3EDE2',
    textColor: '#F3EDE2',
  },
  'neo-seoul': {
    sender: 'Jun',
    line1: 'Rooftop. Midnight.',
    line2: "Don't be late.",
    kicker: 'Neon',
    title: 'Seoul Nights',
    role: 'Idol on the run · Chapter 1',
    date: 'Apr 12',
    background: '#12001F',
    surface: '#24003D',
    accent: '#FF2E88',
    accent2: '#B98CFF',
    pop: '#FFD600',
    textColor: '#FBEFFF',
  },
  dusk: {
    sender: 'Kael',
    line1: 'The caravan leaves at dawn.',
    line2: 'Save me a seat.',
    kicker: 'Sands of',
    title: 'Amaranth',
    role: 'Desert prince · Chapter 1',
    background: '#2B1B2E',
    surface: '#45293F',
    accent: '#E5487A',
    accent2: '#FF8E5E',
    pop: '#FFD27F',
    textColor: '#FFE9D6',
  },
};

type P = z.infer<typeof schema>;

const HIT = T.bars(1); // seal stamps on the downbeat of bar 2
const CARD = T.bars(2); // love-interest card on bar 3
const DATE = T.bars(2) + T.beats(2);
const GLINT = T.bars(3);
const CTA = T.bars(3) + T.beats(1);

/** Organic wax-seal blob with an embossed heart. */
function Seal({ size, p, id }: { size: number; p: P; id: string }) {
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
          <stop offset="0" stopColor={mixHex(p.accent, '#FFFFFF', 0.28)} />
          <stop offset="0.55" stopColor={p.accent} />
          <stop offset="1" stopColor={mixHex(p.accent, '#000000', 0.45)} />
        </radialGradient>
        <linearGradient id={`${id}-emb`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mixHex(p.accent, '#000000', 0.4)} />
          <stop offset="1" stopColor={mixHex(p.accent, '#000000', 0.15)} />
        </linearGradient>
      </defs>
      <polygon points={blob} fill={mixHex(p.accent, '#000000', 0.55)} transform="translate(4 7)" opacity={0.6} />
      <polygon points={blob} fill={`url(#${id}-wax)`} />
      <circle r={R * 0.7} fill="none" stroke={mixHex(p.accent, '#000000', 0.35)} strokeWidth={5} />
      <circle r={R * 0.7} fill="none" stroke={mixHex(p.accent, '#FFFFFF', 0.35)} strokeWidth={1.5} transform="translate(-1.5 -1.5)" opacity={0.7} />
      <polygon points={heart} fill={mixHex(p.accent, '#FFFFFF', 0.4)} transform="translate(-2 -2)" opacity={0.55} />
      <polygon points={heart} fill={`url(#${id}-emb)`} />
      <ellipse cx={-38} cy={-52} rx={26} ry={12} fill="#FFFFFF" opacity={0.22} transform="rotate(-30 -38 -52)" />
    </svg>
  );
}

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

/** Chat bubble: typing dots first, then the message words. */
function Bubble({ frame, at, typing, msg, mine, p, top }: { frame: number; at: number; typing: number; msg: string; mine: boolean; p: P; top: number }) {
  const inT = prog(frame, at, 22, ease.backOut);
  const shown = frame >= at + typing;
  const exit = prog(frame, HIT - 10, 14, ease.in);
  if (frame < at - 2) return null;
  const bg = mine ? p.accent : p.accent2;
  const fg = mine && luma(p.accent) < 150 ? p.textColor : p.background;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        ...(mine ? { right: 90 } : { left: 90 }),
        maxWidth: 760,
        padding: shown ? '30px 44px 34px' : '34px 40px',
        borderRadius: 56,
        ...(mine ? { borderBottomRightRadius: 12 } : { borderBottomLeftRadius: 12 }),
        background: bg,
        color: fg,
        fontFamily: FONTS.syne,
        fontWeight: 700,
        fontSize: 64,
        lineHeight: 1.12,
        letterSpacing: '-0.01em',
        boxShadow: `0 24px 60px ${hexA('#000000', 0.35)}, 0 0 80px ${hexA(bg, 0.25)}`,
        transformOrigin: mine ? '100% 100%' : '0% 100%',
        scale: String(mix(0.6, 1, inT) * mix(1, 0.92, exit)),
        opacity: clamp(inT * 1.5) * (1 - exit),
        translate: `0 ${-exit * 120}px`,
        filter: exit > 0.01 ? `blur(${exit * 14}px)` : undefined,
      }}
    >
      {shown ? (
        <WordsIn text={msg} frame={frame} start={at + typing} stagger={4} dur={16} rise={14} />
      ) : (
        <div style={{ display: 'flex', gap: 14, height: 60, alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 18, height: 18, borderRadius: 9, background: fg, opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame - at) / 4 - i * 1.1)), translate: `0 ${Math.sin((frame - at) / 4 - i * 1.1) * -6}px` }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MidnightCourtLaunch(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const cx = W / 2;

  // Seal: stamps at the centre, then rises to crown the title.
  const stamp = keys(frame, [HIT - 12, HIT, HIT + 8, HIT + 18], [2.8, 0.9, 1.05, 1], [ease.in, ease.out, ease.inOutSoft]);
  const rise = prog(frame, HIT + 10, 30, ease.inOut);
  const sealY = mix(H * 0.47, 300, rise);
  const sealSize = mix(420, 250, rise) * stamp;
  const sealOn = clamp((frame - (HIT - 12)) / 6);
  const shake = frame >= HIT ? Math.exp(-(frame - HIT) / 9) * 16 : 0;
  const flash = keys(frame, [HIT - 1, HIT + 2, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, HIT, 60, ease.out);
  const push = mix(1, 1.06, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 30, 30, ease.inOut);
  const breathe = 0.5 + 0.5 * Math.sin(frame / 34);

  const longest = Math.max(...p.title.split(' ').map((w) => w.length), 4);
  const TITLE = Math.min(250, 920 / (longest * 0.62));
  const titleTop = 470;
  const titleLines = p.title.split(' ');
  const titleBottom = titleTop + 110 + titleLines.length * TITLE * 0.92;
  const cardTop = Math.min(1120, Math.max(1040, titleBottom + 80));
  const titleGrad = `linear-gradient(165deg, ${p.textColor} 20%, ${p.accent2} 70%, ${p.accent} 125%)`;

  const cardT = prog(frame, CARD, 34, ease.out);
  const affection = prog(frame, CARD + 20, 70, ease.inOutSoft) * 0.82;
  const dateT = prog(frame, DATE, 22, ease.backOut);
  const ctaT = prog(frame, CTA, 26, ease.backOut);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.06, size: 44, y: -frame * 0.15, color: '255,220,210' }}
        lift={hexA(p.accent2, 0.07)}
        glows={[
          { x: cx, y: frame < HIT ? H * 0.55 : sealY, size: mix(900, 1500, prog(frame, HIT, 40)), color: hexA(p.accent, 0.55), opacity: 0.45 + 0.25 * breathe + flash * 0.4 },
          { x: W * 0.1, y: H * 0.2, size: 1100, color: hexA(p.accent2, 0.3), opacity: 0.45 },
          { x: W * 0.95, y: H * 0.85, size: 1200, color: hexA(p.accent, 0.35), opacity: 0.6 },
        ]}
        grain={0}
        vignette={0.5}
      />

      {/* Stage beams from above, slowly swaying */}
      <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.5 }}>
        {[-1, 1].map((s) => (
          <div
            key={s}
            style={{
              position: 'absolute',
              left: cx - 260 + s * 160,
              top: -200,
              width: 520,
              height: H * 1.1,
              background: `linear-gradient(180deg, ${hexA(p.accent2, 0.22)}, transparent 75%)`,
              clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
              rotate: `${s * (14 + Math.sin(frame / 50 + s) * 3)}deg`,
              transformOrigin: '50% 0',
              filter: 'blur(18px)',
            }}
          />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{ scale: String(push), translate: `${Math.sin(frame * 2.1) * shake}px ${Math.cos(frame * 1.7) * shake}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={60} color={p.accent2} seed={9} speed={0.8} opacity={0.4} maxSize={5} />

        {/* Eyebrow */}
        <div
          style={{
            position: 'absolute',
            top: 130,
            width: W,
            display: 'flex',
            justifyContent: 'center',
            opacity: prog(frame, 4, 24),
            translate: `0 ${mix(-16, 0, prog(frame, 4, 30))}px`,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16, fontFamily: FONTS.spacemono, fontSize: 30, letterSpacing: '0.34em', textTransform: 'uppercase', color: p.accent2 }}>
            <span style={{ width: 12, height: 12, borderRadius: 6, background: p.accent, boxShadow: `0 0 18px ${p.accent}` }} />
            {p.eyebrow}
          </span>
        </div>

        {/* Bar 1: the chat */}
        {frame < HIT + 6 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 96,
                top: 740,
                fontFamily: FONTS.spacemono,
                fontSize: 28,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: p.accent2,
                opacity: prog(frame, 8, 20) * (1 - prog(frame, HIT - 10, 12, ease.in)),
              }}
            >
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 6, background: '#5BE38B', marginRight: 14, opacity: 0.6 + 0.4 * breathe }} />
              {p.sender} · online
            </div>
            <Bubble frame={frame} at={12} typing={22} msg={p.line1} mine={false} p={p} top={800} />
            <Bubble frame={frame} at={58} typing={14} msg={p.line2} mine p={p} top={1020} />
            <Bubble frame={frame} at={96} typing={999} msg="" mine={false} p={p} top={1240} />
          </>
        )}

        {/* Hit: shockwaves + streaks from the seal */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <circle cx={cx} cy={H * 0.47} r={230 + shock * 900} fill="none" stroke={p.accent} strokeWidth={mix(12, 1, shock)} opacity={frame >= HIT ? (1 - shock) * 0.8 : 0} />
          <circle cx={cx} cy={H * 0.47} r={230 + prog(frame, HIT + 5, 70) * 700} fill="none" stroke={p.accent2} strokeWidth={mix(4, 0.5, prog(frame, HIT + 5, 70))} opacity={frame >= HIT + 5 ? (1 - prog(frame, HIT + 5, 70)) * 0.6 : 0} />
        </svg>
        <Streaks frame={frame} start={HIT} dur={50} direction="out" count={150} width={W} height={H} cy={H * 0.47} seed={4} intensity={1} color={p.accent} highlight={p.accent2} />

        {/* Wax seal */}
        {frame >= HIT - 12 && (
          <div
            style={{
              position: 'absolute',
              left: cx - sealSize / 2,
              top: sealY - sealSize / 2,
              opacity: sealOn,
              rotate: `${mix(-18, -6, prog(frame, HIT - 12, 20)) + Math.sin(frame / 40) * 2}deg`,
              filter: `blur(${frame < HIT ? (HIT - frame) * 1.6 : 0}px) drop-shadow(0 ${20 * stamp}px ${40 * stamp}px ${hexA('#000000', 0.5)}) drop-shadow(0 0 ${40 + breathe * 30}px ${hexA(p.accent, 0.45)})`,
            }}
          >
            <Seal size={sealSize} p={p} id="mcl" />
          </div>
        )}

        {/* Title */}
        {frame >= HIT && (
          <div style={{ position: 'absolute', top: titleTop, left: 0, width: W, textAlign: 'center' }}>
            <div
              style={{
                fontFamily: FONTS.gloock,
                fontSize: 88,
                lineHeight: 1,
                color: p.accent2,
                letterSpacing: '-0.01em',
                opacity: prog(frame, HIT + 24, 24),
                translate: `0 ${mix(20, 0, prog(frame, HIT + 24, 30))}px`,
              }}
            >
              {p.kicker}
            </div>
            {titleLines.map((line, i) => {
              const block = { ...displayFace('gloock'), fontSize: TITLE, lineHeight: 0.92, letterSpacing: '-0.035em', whiteSpace: 'nowrap' as const, width: W, textAlign: 'center' as const };
              return (
                <div key={i} style={{ position: 'relative', height: TITLE * 0.92 }}>
                  <SweepReveal frame={frame} start={HIT + 28 + i * 6} dur={34} style={{ ...block, position: 'absolute', left: 0, top: 0 }}>
                    <span style={gradientText(titleGrad, TITLE)}>{line}</span>
                  </SweepReveal>
                  <Glint frame={frame} start={GLINT + i * 6} dur={44} style={{ ...block, position: 'absolute', left: 0, top: 0 }}>
                    {line}
                  </Glint>
                </div>
              );
            })}
          </div>
        )}

        {/* Bar 3: love-interest card */}
        {frame >= CARD - 2 && (
          <div
            style={{
              position: 'absolute',
              left: 90,
              top: cardTop,
              width: W - 180,
              height: 300,
              borderRadius: 40,
              background: `linear-gradient(160deg, ${hexA(p.surface, 0.95)}, ${hexA(p.background, 0.9)})`,
              border: `1.5px solid ${hexA(p.accent2, 0.28)}`,
              boxShadow: `0 40px 90px ${hexA('#000000', 0.45)}, inset 0 1px 0 ${hexA('#FFFFFF', 0.1)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 40,
              padding: 26,
              opacity: clamp(cardT * 1.4),
              translate: `0 ${mix(160, 0, cardT)}px`,
              filter: cardT < 1 ? `blur(${(1 - cardT) * 12}px)` : undefined,
              overflow: 'hidden',
            }}
          >
            <div style={{ width: 220, height: 248, borderRadius: 28, flexShrink: 0, overflow: 'hidden', position: 'relative', background: `linear-gradient(160deg, ${p.accent}, ${mixHex(p.accent, '#000000', 0.5)})` }}>
              {p.portrait ? (
                <Img src={p.portrait} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(mix(1.12, 1.02, prog(frame, CARD, 200, ease.outSoft))) }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: FONTS.gloock, fontSize: 200, lineHeight: 1, color: hexA(p.textColor, 0.92), paddingBottom: 10 }}>
                  {p.sender.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 55%, ${hexA(p.background, 0.55)})` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.spacemono, fontSize: 24, letterSpacing: '0.28em', textTransform: 'uppercase', color: p.accent2 }}>Your love interest</div>
              <div style={{ fontFamily: FONTS.gloock, fontSize: p.sender.length > 9 ? 70 : 92, lineHeight: 1.05, letterSpacing: '-0.03em', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.sender}</div>
              <div style={{ fontFamily: FONTS.syne, fontSize: 36, opacity: 0.82, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.role}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
                <span style={{ color: p.accent, fontSize: 30, lineHeight: 1, scale: String(1 + 0.15 * Math.max(0, Math.sin(frame / 7)) ** 8) }}>♥</span>
                <div style={{ flex: 1, height: 12, borderRadius: 6, background: hexA(p.textColor, 0.12), overflow: 'hidden' }}>
                  <div style={{ width: `${affection * 100}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${p.accent2}, ${p.accent})`, boxShadow: `0 0 16px ${p.accent}` }} />
                </div>
                <span style={{ fontFamily: FONTS.spacemono, fontSize: 24, color: p.accent2, width: 64, textAlign: 'right' }}>{Math.round(affection * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Opening date */}
        {frame >= DATE - 2 && (
          <div style={{ position: 'absolute', top: cardTop + 380, width: W, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 28, opacity: clamp(dateT * 2), scale: String(mix(0.7, 1, dateT)) }}>
            <span style={{ fontFamily: FONTS.spacemono, fontSize: 30, letterSpacing: '0.3em', textTransform: 'uppercase', color: p.accent2 }}>{p.dateLabel}</span>
            <span style={{ fontFamily: FONTS.gloock, fontSize: 132, lineHeight: 1, letterSpacing: '-0.03em', color: p.textColor }}>{p.date}</span>
            <span style={{ fontSize: 40, color: p.pop, rotate: `${frame * 1.5}deg`, display: 'inline-block', opacity: 0.6 + 0.4 * breathe }}>✦</span>
          </div>
        )}

        {/* CTA */}
        {frame >= CTA - 2 && (
          <div style={{ position: 'absolute', top: Math.min(cardTop + 600, H - 230), width: W, display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                fontFamily: FONTS.syne,
                fontWeight: 800,
                fontSize: 46,
                padding: '30px 60px',
                borderRadius: 999,
                color: luma(p.accent) > 150 ? p.background : p.textColor,
                background: `linear-gradient(180deg, ${mixHex(p.accent, '#FFFFFF', 0.12)}, ${p.accent})`,
                boxShadow: `0 0 0 2px ${hexA(p.accent2, 0.35)}, 0 24px 60px ${hexA(p.accent, 0.5)}`,
                scale: String(ctaT),
                opacity: clamp(ctaT * 2),
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta} →
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: 120, left: `${mix(-30, 130, prog(frame, CTA + 30, 40, ease.inOut))}%`, background: `linear-gradient(100deg, transparent, ${hexA('#FFFFFF', 0.35)}, transparent)` }} />
            </div>
          </div>
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 47%, ${hexA('#FFFFFF', flash * 0.9)} 0%, ${hexA(p.accent, flash * 0.6)} 25%, transparent 62%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
