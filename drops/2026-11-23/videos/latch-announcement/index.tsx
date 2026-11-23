import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Latch 2.0 Announcement',
  category: 'announcement',
  description:
    'Feature announcement on a cyanotype drafting sheet: construction lines draw a laptop in side elevation, the lid swings shut on the downbeat, a yellow commit dot hits with a flash and the hash types out, then the magazine headline, features and install CTA land on the beat.',
  tags: ['announcement', 'release', 'developer', 'blueprint', 'saas'],
};

const FPS = 60;
const T = tempo(FPS, 120); // 1 beat = 30 f, 1 bar = 120 f
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Announcing Latch 2.0'),
  line1: text('Headline line 1').default('Close the lid.'),
  line2: text('Headline line 2').default("We'll commit."),
  emphasis: text('Italic word(s) in line 2').default('commit.'),
  features: text('Feature line').default('Auto-commit · Safe branch · Push before sleep'),
  hash: text('Commit hash').default('a3f9c21'),
  message: text('Commit message').default('wip: checkout flow'),
  branch: text('Pushed to').default('origin/latch-wip'),
  cta: text('Call to action').default('brew install latch'),
  sheet: text('Title block').default('LATCH 2.0 · SHEET 01'),
  font: font('Headline font').default('dmserif'),
  background: color().default('#0F3B8C'),
  surface: color('Panels').default('#134AA8'),
  textColor: color('Text & lines').default('#EAF2FF'),
  lines: color('Construction lines').default('#7FB2FF'),
  pop: color('Commit dot & CTA').default('#FFDD00'),
  screenshot: image('Screenshot (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', textColor: '#F3EDE2', lines: '#6E6A62', pop: '#C9A45C', font: 'instrument' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', textColor: '#17242E', lines: '#2F6F8F', pop: '#E4572E', eyebrow: 'New in Latch 2.0' },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', textColor: '#F0FFE0', lines: '#FF00E5', pop: '#C6FF00', font: 'bricolage', line2: 'Ship it shut.', emphasis: 'shut.' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};
const rad = (d: number) => (d * Math.PI) / 180;

// Drawing geometry, in a 520 × 400 viewBox.
const HX = 140, HY = 300, L = 240, R = 282;
const at = (deg: number, r: number) => [HX + Math.cos(rad(deg)) * r, HY - Math.sin(rad(deg)) * r] as const;
const DOT = at(0, R);
const lidPts = (deg: number) => {
  const [ex, ey] = at(deg, L);
  const nx = Math.cos(rad(deg + 90)) * 7, ny = -Math.sin(rad(deg + 90)) * 7;
  return `${HX - nx},${HY - ny} ${ex - nx},${ey - ny} ${ex + nx},${ey + ny} ${HX + nx},${HY + ny}`;
};

/** Stroke that draws itself: pathLength 1, dashed by progress. */
const drawn = (t: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp(t) });

function Drawing({ frame, p, IMPACT }: { frame: number; p: P; IMPACT: number }) {
  const ink = p.textColor;
  const ln = p.lines;
  const cl = prog(frame, 6, 50, ease.inOutSoft); // construction lines
  const base = prog(frame, 20, 40, ease.inOutSoft);
  const lidIn = prog(frame, 36, 36, ease.inOutSoft);
  const arc = prog(frame, 60, 34, ease.inOutSoft);
  const close = prog(frame, IMPACT - 26, 26, ease.in); // accelerates into the slam
  const angle = mix(110, 0.01, close);
  const settle = frame > IMPACT ? Math.exp(-(frame - IMPACT) / 6) * Math.sin((frame - IMPACT) / 2.2) * 2.5 : 0;
  const shock = prog(frame, IMPACT, 50, ease.out);
  const hit = frame >= IMPACT;
  const labels = prog(frame, 70, 20);
  const pulse = hit ? 1 + 0.08 * Math.sin((frame - IMPACT) / 9) : 0;
  const mono = { fontFamily: FONTS.mono, fontSize: 15, letterSpacing: '0.12em', fill: ink } as const;
  const [ax, ay] = at(110, R);
  const [mx, my] = at(56, R + 22);
  return (
    <svg viewBox="0 0 520 400" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="la-dot">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1={-60} y1={HY + 30} x2={580} y2={HY + 30} stroke={ln} strokeWidth="1" opacity="0.7" {...drawn(cl)} />
      <line x1={HX} y1={0} x2={HX} y2={HY + 70} stroke={ln} strokeWidth="1" opacity="0.6" {...drawn(cl)} />
      {/* ghosts: where the lid was, appearing as it closes */}
      {[110, 75, 40].map((d, i) => (
        <polygon key={d} points={lidPts(d)} fill="none" stroke={ln} strokeWidth="1.3" strokeDasharray="6 6" opacity={(angle < d - 6 ? 0.8 : 0) * (i === 0 ? 1 : 0.8)} />
      ))}
      <rect x={HX - 20} y={HY} width={L + 40} height={26} rx={7} fill={hexA(p.surface, 0.9 * base)} stroke={ink} strokeWidth={2.2} {...drawn(base)} />
      <rect x={HX + 6} y={HY + 26} width={26} height={5} rx={2} fill={ink} opacity={base} />
      <rect x={HX + L - 32} y={HY + 26} width={26} height={5} rx={2} fill={ink} opacity={base} />
      <g transform={`rotate(${settle} ${HX} ${HY})`}>
        <polygon points={lidPts(angle)} fill={hexA(p.surface, 0.95 * lidIn)} stroke={ink} strokeWidth={2.2} strokeLinejoin="round" {...drawn(lidIn)} />
      </g>
      <circle cx={HX} cy={HY} r={11} fill={p.background} stroke={ink} strokeWidth={2.2} opacity={base} />
      <circle cx={HX} cy={HY} r={3.5} fill={ink} opacity={base} />
      {/* hinge arc dimension */}
      <path d={`M${ax},${ay} A${R},${R} 0 0 1 ${DOT[0]},${DOT[1]}`} fill="none" stroke={ink} strokeWidth="1.6" {...drawn(arc)} />
      <line x1={HX} y1={HY} x2={ax} y2={ay} stroke={ink} strokeWidth="0.9" opacity={0.6 * arc} />
      <g opacity={labels}>
        <rect x={mx - 34} y={my - 15} width={68} height={28} rx={4} fill={p.background} />
        <text x={mx} y={my + 6} textAnchor="middle" {...mono} fontSize={19} letterSpacing="0.04em">{`${Math.round(angle)}°`}</text>
        <line x1={HX - 8} y1={HY + 8} x2={HX - 70} y2={HY + 70} stroke={ink} strokeWidth="1" />
        <text x={HX - 74} y={HY + 90} {...mono} textAnchor="middle">LID SENSOR</text>
        <g transform="translate(330 352)">
          <rect width={200} height={44} fill="none" stroke={ink} strokeWidth="1.3" />
          <line x1={0} y1={22} x2={200} y2={22} stroke={ink} strokeWidth="0.8" />
          <line x1={130} y1={22} x2={130} y2={44} stroke={ink} strokeWidth="0.8" />
          <text x={10} y={16} {...mono} fontSize={11}>{p.sheet}</text>
          <text x={10} y={38} {...mono} fontSize={10} opacity={0.75}>SCALE 1:4</text>
          <text x={140} y={38} {...mono} fontSize={10} opacity={0.75}>REV B</text>
        </g>
      </g>
      {/* the commit: target ring before, dot + shockwave on impact */}
      <circle cx={DOT[0]} cy={DOT[1]} r={13} fill="none" stroke={ink} strokeWidth="1.4" strokeDasharray="3 4" opacity={hit ? 0 : arc} />
      {hit && (
        <>
          <circle cx={DOT[0]} cy={DOT[1]} r={50 * pulse} fill="url(#la-dot)" />
          <circle cx={DOT[0]} cy={DOT[1]} r={22 + shock * 190} fill="none" stroke={p.pop} strokeWidth={mix(5, 0.6, shock)} opacity={1 - shock} />
          <circle cx={DOT[0]} cy={DOT[1]} r={mix(4, 13, prog(frame, IMPACT, 10, ease.backOut))} fill={p.pop} stroke={p.background} strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

export default function LatchAnnouncement(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const IMPACT = T.bars(1); // lid slams on the downbeat of bar 2
  const MOVE = IMPACT + T.beats(2); // drawing slides left
  const TITLE = IMPACT + T.beats(3);
  const CTA = T.bars(3);
  const end = video.durationInFrames;

  // Drawing box: big and centred, then docks on the left half.
  const mv = prog(frame, MOVE, 50, ease.inOut);
  const dw = mix(1060, 800, mv);
  const dh = dw * (400 / 520);
  const dl = mix((W - dw) / 2 + 40, 110, mv);
  const dtop = mix(H / 2 - dh / 2 - 10, H / 2 - dh / 2 - 40, mv);
  const dotX = dl + (DOT[0] / 520) * dw;
  const dotY = dtop + (DOT[1] / 400) * dh;

  const shake = frame >= IMPACT ? Math.exp(-(frame - IMPACT) / 7) * 9 : 0;
  const push = mix(1, 1.045, prog(frame, 0, end, ease.inOutSoft));
  const flash = keys(frame, [IMPACT - 1, IMPACT + 2, IMPACT + 24], [0, 1, 0], [ease.out, ease.outSoft]);
  const outro = prog(frame, end - 30, 30, ease.inOut);

  // Copy column on the right.
  const colL = 1010;
  const colW = W - colL - 100;
  const longest = Math.max(p.line1.length, p.line2.length, 8);
  const HEAD = Math.min(134, colW / (longest * 0.46));
  const hasShot = !!p.screenshot;
  const headTop = hasShot ? 470 : 350;
  const i = p.emphasis ? p.line2.lastIndexOf(p.emphasis) : -1;
  const l2a = i >= 0 ? p.line2.slice(0, i) : p.line2;
  const l2b = i >= 0 ? p.emphasis : '';
  const l2c = i >= 0 ? p.line2.slice(i + p.emphasis.length) : '';
  const headStyle = { ...displayFace(p.font, { italic: false }), fontSize: HEAD, lineHeight: 0.98, letterSpacing: '-0.025em', color: p.textColor, whiteSpace: 'nowrap' as const };
  const em = { ...displayFace(p.font, { italic: true }), textDecoration: `underline ${p.pop}`, textDecorationThickness: HEAD * 0.06, textUnderlineOffset: HEAD * 0.12 };
  const cell = 40;

  // commit log under the drawing
  const logIn = prog(frame, IMPACT + 6, 18);
  const line1 = `${p.hash} · ${p.message}`;
  const pushed = frame >= IMPACT + 44;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.bricolage }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={false}
        lift={dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: dotX, y: dotY, size: mix(600, 1100, prog(frame, IMPACT, 40)), color: hexA(p.pop, 0.3), opacity: frame >= IMPACT ? 0.7 + 0.15 * Math.sin(frame / 30) : 0 },
          { x: dl + dw * 0.4, y: dtop + dh * 0.5, size: 1500, color: hexA(p.lines, dark ? 0.35 : 0.2), opacity: 0.6 + 0.2 * Math.sin(frame / 45) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      >
        {/* drafting paper, drifting slowly */}
        <div
          style={{
            position: 'absolute',
            inset: -cell * 5,
            translate: `0 ${(-frame * 0.25) % (cell * 5)}px`,
            opacity: prog(frame, 0, 40),
            backgroundImage: [
              `linear-gradient(${hexA(p.lines, 0.22)} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${hexA(p.lines, 0.22)} 1px, transparent 1px)`,
              `linear-gradient(${hexA(p.lines, 0.08)} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${hexA(p.lines, 0.08)} 1px, transparent 1px)`,
            ].join(','),
            backgroundSize: `${cell * 5}px ${cell * 5}px, ${cell * 5}px ${cell * 5}px, ${cell}px ${cell}px, ${cell}px ${cell}px`,
          }}
        />
        <div style={{ position: 'absolute', inset: 28, border: `1px solid ${hexA(p.textColor, 0.3)}`, opacity: prog(frame, 10, 30) }} />
      </Backdrop>

      <AbsoluteFill style={{ scale: String(push), translate: `${Math.sin(frame * 1.7) * shake}px ${Math.cos(frame * 2.3) * shake}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={40} color={p.lines} seed={4} speed={0.7} opacity={0.35} maxSize={4} />
        <div style={{ position: 'absolute', left: dl, top: dtop, width: dw, height: dh }}>
          <Drawing frame={frame} p={p} IMPACT={IMPACT} />
        </div>
        <Streaks frame={frame} start={IMPACT} dur={44} direction="out" count={120} width={W} height={H} cx={dotX} cy={dotY} seed={9} intensity={0.9} color={p.pop} highlight={p.textColor} />

        {/* commit log, typed */}
        <div style={{ position: 'absolute', left: dl + dw * 0.08, top: dtop + dh + 10, fontFamily: FONTS.mono, fontSize: 36, lineHeight: 1.5, opacity: logIn, translate: `0 ${mix(16, 0, logIn)}px`, whiteSpace: 'pre' }}>
          <div>
            <span style={{ color: p.pop }}>●</span> {typed(frame, IMPACT + 6, FPS, 34, line1)}
          </div>
          <div style={{ opacity: pushed ? prog(frame, IMPACT + 44, 12) : 0 }}>
            <span style={{ opacity: 0.6 }}>↳ pushed → </span>
            {p.branch} <span style={{ color: p.pop }}>✓</span>
          </div>
        </div>

        {/* optional screenshot, pinned like a print on the drafting table */}
        {hasShot && (
          <div
            style={{
              position: 'absolute',
              left: colL,
              top: 110,
              width: 560,
              height: 320,
              padding: 10,
              background: hexA(p.textColor, 0.92),
              boxShadow: `14px 14px 0 ${hexA(p.lines, 0.4)}`,
              rotate: `${mix(-6, -2, prog(frame, TITLE - 10, 40))}deg`,
              opacity: prog(frame, TITLE - 10, 24),
              translate: `0 ${mix(40, 0, prog(frame, TITLE - 10, 40)) + Math.sin(frame / 40) * 4}px`,
            }}
          >
            <Img src={p.screenshot} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* eyebrow */}
        <div
          style={{
            position: 'absolute',
            left: colL,
            top: headTop - 64,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            fontFamily: FONTS.mono,
            fontSize: 30,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            opacity: prog(frame, TITLE - 8, 20),
            translate: `${mix(-20, 0, prog(frame, TITLE - 8, 26))}px 0`,
          }}
        >
          <span style={{ width: 54 * prog(frame, TITLE - 8, 30, ease.inOutSoft), height: 2, background: p.pop }} />
          {p.eyebrow}
        </div>

        {/* headline: two lines, sweeps; glint on bar 4 */}
        <SweepReveal frame={frame} start={TITLE} dur={30} style={{ position: 'absolute', left: colL, top: headTop, ...headStyle }}>
          {p.line1}
        </SweepReveal>
        <SweepReveal frame={frame} start={TITLE + 8} dur={30} style={{ position: 'absolute', left: colL, top: headTop + HEAD * 1.02, ...headStyle }}>
          {l2a}
          {l2b && <span style={em}>{l2b}</span>}
          {l2c}
        </SweepReveal>
        <Glint frame={frame} start={CTA + 10} dur={44} style={{ position: 'absolute', left: colL, top: headTop, ...headStyle }}>
          {p.line1}
        </Glint>

        {/* features + CTA flow in one column so a wrapped feature line pushes the CTA down */}
        <div style={{ position: 'absolute', left: colL, top: headTop + HEAD * 2.25, width: colW, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 36 }}>
        {/* features as a checklist, one row per "·"-separated item */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {p.features
            .split('·')
            .map((f) => f.trim())
            .filter(Boolean)
            .map((f, k) => {
              const s = TITLE + T.beats(2) + k * 8;
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 18, fontSize: 44, lineHeight: 1.2 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 30, color: p.pop, opacity: prog(frame, s, 12) }}>+</span>
                  <WordsIn text={f} frame={frame} start={s} stagger={3} style={{ opacity: 0.9 }} />
                </div>
              );
            })}
        </div>

        {/* CTA: lands on the downbeat of bar 4 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '20px 34px',
            borderRadius: 10,
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: 36,
            color: isDark(p.pop) ? '#FFFFFF' : '#0A1B3F',
            background: p.pop,
            boxShadow: `8px 8px 0 ${dark ? 'rgba(0,0,0,0.35)' : p.textColor}`,
            transformOrigin: 'left center',
            scale: String(prog(frame, CTA, 24, ease.backOut)),
            opacity: clamp(prog(frame, CTA, 8)),
          }}
        >
          <span style={{ opacity: 0.55 }}>$</span>
          {p.cta}
        </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${dotX}px ${dotY}px, ${hexA('#ffffff', flash * 0.9)} 0%, ${hexA(p.pop, flash * 0.5)} 18%, transparent 55%)`, mixBlendMode: 'screen', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.35 : 0.05} frame={frame} />
    </AbsoluteFill>
  );
}
