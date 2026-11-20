import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Holiday Print',
  category: 'greeting',
  description:
    'Story-format holiday greeting printed like a gig poster: violet ink pulls "Happy", a hot-pink pass pulls "holidays" out of register and snaps in on the beat with a star and ink splatter, then the team photo, message and handwritten signature.',
  tags: ['greeting', 'holiday', 'story', 'thank you', 'print', 'customers'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  from: text('Handwritten intro').default('from all of us at Inkrun'),
  line1: text('Word 1 (ink 1)').default('Happy'),
  line2: text('Word 2 (ink 2)').default('holidays'),
  message: textarea().default('Thanks for trusting us with 4.1 million ad launches this year. Rest up, we’ll keep your campaigns warm.'),
  signature: text('Signature').default('Maya, Theo & the Inkrun crew'),
  stamp: text('Edition stamp').default('2026 · 1/1'),
  font: font('Display font').default('fraunces'),
  background: color().default('#12001F'),
  paper: color('Paper').default('#24003D'),
  accent: color('Ink 1').default('#B026FF'),
  accent2: color('Ink 2').default('#FF2E88'),
  pop: color('Star').default('#FFD600'),
  textColor: color('Text').default('#FBEFFF'),
  photo: image('Team photo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  risograph: { background: '#EAE2D3', paper: '#F4EFE6', accent: '#0078BF', accent2: '#FF48B0', pop: '#FFE800', textColor: '#1F2A6B' },
  'cherry-cola': { background: '#2A0A10', paper: '#3F1019', accent: '#E3173E', accent2: '#F5C6AA', pop: '#F7B32B', textColor: '#FFE8E0', line1: 'Season’s', line2: 'greetings' },
  'new-year': { background: '#0D0D0F', paper: '#1C1C20', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#FFFFFF', textColor: '#F3EDE2', line1: 'Happy', line2: 'new year', stamp: '2027 · 1/1', message: 'Here’s to fewer spreadsheets and more launches. See you in January.' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const PULL1 = T.beats(1); // violet pull
const PULL2 = T.bars(1); // pink pull
const SNAP = T.bars(1) + T.beats(2); // into register
const MSG = T.bars(2);
const STAMP = T.bars(3);
const END = video.durationInFrames;

/** Five-point star path centred on 0,0. */
const star = (r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ');

export default function HolidayPrint(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const hasPhoto = !!p.photo;

  const push = mix(1, 1.05, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 36, 36, ease.inOut);
  const shake = frame >= SNAP && frame < SNAP + 14 ? Math.sin(frame * 2.3) * (1 - (frame - SNAP) / 14) * 6 : 0;

  // Sheet (the poster we print on)
  const sheetIn = prog(frame, 0, 30);
  const sx = 70;
  const sy = 150;
  const sw = W - 140;
  const sh = H - 300;

  // Pulls: a squeegee sweeps top→bottom; the ink is revealed behind it.
  const pull1 = prog(frame, PULL1, 34, ease.inOut);
  const pull2 = prog(frame, PULL2, 34, ease.inOut);
  const bladeY = frame < PULL2 - 10 ? mix(sy - 60, sy + sh + 60, pull1) : mix(sy - 60, sy + sh + 60, pull2);
  const bladeOn = (frame >= PULL1 && pull1 < 1) || (frame >= PULL2 && pull2 < 1);
  const maskFor = (t: number) => `linear-gradient(180deg, black ${t * 120 - 10}%, transparent ${t * 120 + 2}%)`;

  const snap = prog(frame, SNAP, 18, ease.backOut);
  const off = frame < SNAP ? 34 : mix(34, 5, snap);
  const flash = keys(frame, [SNAP - 2, SNAP + 2, SNAP + 26], [0, 1, 0], [ease.out, ease.outSoft]);

  const W1 = Math.min(250, (sw * 0.86) / (Math.max(5, p.line1.length) * 0.56));
  const W2 = Math.min(230, (sw * 0.86) / (Math.max(5, p.line2.length) * 0.5));
  const titleTop = hasPhoto ? 360 : 590;
  const word = { position: 'absolute' as const, left: 0, width: W, textAlign: 'center' as const, lineHeight: 0.95, letterSpacing: '-0.04em', whiteSpace: 'nowrap' as const };

  // Star + ink splatter at the snap
  const starT = prog(frame, SNAP, 26, ease.backOut);
  // Star sits off the top-left shoulder of word 1, clear of the letters and the intro line.
  const starX = sx + 62;
  const starY = titleTop - 20;
  const ring = prog(frame, SNAP, 50, ease.out);

  // Vertical flow: title → (photo) → message → signature. Message height is estimated from its length.
  const photo = { w: 580, h: 380, top: titleTop + W1 + W2 + 50 };
  const msgTop = hasPhoto ? photo.top + photo.h + 60 : titleTop + W1 + W2 + 120;
  const msgLines = Math.ceil((p.message.length * 50 * 0.5) / (W - 300));
  const sigTop = msgTop + msgLines * 68 + 30;
  // The stamp lands on the photo's corner when there is one, else bottom-right of the sheet.
  const stampPos = hasPhoto ? { left: W / 2 + photo.w / 2 - 230, top: photo.top + photo.h - 60 } : { left: sx + sw - 340, top: sy + sh - 150 };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.12, size: 28, y: -frame * 0.12, color: dark ? '251,239,255' : '31,42,107' }}
        glows={[
          { x: W * 0.2, y: H * 0.25, size: 1300, color: hexA(p.accent, dark ? 0.45 : 0.2), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: W * 0.85, y: H * 0.8, size: 1200, color: hexA(p.accent2, dark ? 0.35 : 0.18), opacity: 0.5 + prog(frame, SNAP, 40) * 0.4 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.12}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro, translate: `${shake}px ${shake * 0.4}px` }}>
        {/* The sheet with crop + registration marks */}
        <div style={{ position: 'absolute', left: sx, top: sy, width: sw, height: sh, borderRadius: 18, background: p.paper, opacity: sheetIn, translate: `0 ${mix(60, 0, sheetIn)}px`, boxShadow: `0 40px 120px rgba(0,0,0,${dark ? 0.5 : 0.15})`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${hexA(p.textColor, 0.07)} 1px, transparent 1.5px)`, backgroundSize: '9px 9px' }} />
          {/* halftone glow pooled at the bottom of the sheet */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: sh * 0.35, backgroundImage: `radial-gradient(${hexA(p.accent, 0.55)} 30%, transparent 34%)`, backgroundSize: '22px 22px', backgroundPosition: `${frame * 0.2}px 0`, maskImage: 'linear-gradient(transparent, black)', WebkitMaskImage: 'linear-gradient(transparent, black)' }} />
        </div>
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          {[
            [sx + 30, sy + 30],
            [sx + sw - 30, sy + 30],
            [sx + 30, sy + sh - 30],
            [sx + sw - 30, sy + sh - 30],
          ].map(([x, y], i) => (
            <g key={i} stroke={p.textColor} strokeWidth={2} opacity={0.5 * sheetIn} fill="none">
              <circle cx={x} cy={y} r={14} />
              <line x1={x - 24} y1={y} x2={x + 24} y2={y} />
              <line x1={x} y1={y - 24} x2={x} y2={y + 24} />
            </g>
          ))}
        </svg>

        <Dust frame={frame} width={W} height={H} count={45} color={p.accent2} seed={4} speed={0.7} opacity={dark ? 0.4 : 0.3} />

        {/* Intro (handwritten) */}
        <div style={{ position: 'absolute', width: W, top: titleTop - 120, textAlign: 'center', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 72, color: p.pop, rotate: '-3deg', opacity: prog(frame, 14, 24), translate: `0 ${mix(20, 0, prog(frame, 14, 30))}px` }}>{p.from}</div>

        {/* Pass 1: violet "Happy" */}
        <div style={{ ...word, ...displayFace(p.font), top: titleTop, fontSize: W1, color: p.textColor, textShadow: `6px 6px 0 ${p.accent}`, maskImage: maskFor(pull1), WebkitMaskImage: maskFor(pull1) }}>{p.line1}</div>

        {/* Pass 2: pink "holidays", out of register until the snap */}
        <div
          style={{
            ...word,
            ...displayFace(p.font, { italic: true }),
            fontStyle: 'italic',
            top: titleTop + W1 * 0.98,
            fontSize: W2,
            color: p.accent2,
            translate: `${off}px ${off * 0.5}px`,
            maskImage: maskFor(pull2),
            WebkitMaskImage: maskFor(pull2),
            mixBlendMode: dark ? 'screen' : 'multiply',
          }}
        >
          {p.line2}
        </div>
        {/* violet key line under the pink pass, revealing the misregistration */}
        <div style={{ ...word, ...displayFace(p.font, { italic: true }), fontStyle: 'italic', top: titleTop + W1 * 0.98, fontSize: W2, color: 'transparent', WebkitTextStroke: `2px ${hexA(p.accent, 0.9)}`, opacity: prog(frame, PULL2 + 10, 20) }}>{p.line2}</div>

        {/* Star pop + shockwave + ink splatter at the snap */}
        {frame >= SNAP && (
          <svg style={{ position: 'absolute', inset: 0, overflow: 'visible' }} width={W} height={H}>
            <circle cx={starX} cy={starY} r={60 + ring * 260} fill="none" stroke={p.pop} strokeWidth={mix(6, 0.5, ring)} opacity={(1 - ring) * 0.8} />
            {Array.from({ length: 26 }, (_, i) => {
              const a = rand(i * 3.3) * Math.PI * 2;
              const v = 6 + rand(i * 5.1) * 14;
              const age = frame - SNAP;
              // Linear drag + gentle gravity: pieces burst, hang, drift down.
              const k = 1 - Math.exp(-age / 18);
              const x = starX + Math.cos(a) * v * 18 * k;
              const y = starY + Math.sin(a) * v * 18 * k + Math.max(0, age - 30) * 0.9;
              const r = 4 + rand(i * 7.7) * 9;
              const c = [p.accent, p.accent2, p.pop][i % 3];
              return <circle key={i} cx={x} cy={y} r={r * (1 - prog(frame, SNAP + 140, 60))} fill={c} opacity={0.9} />;
            })}
            <g transform={`translate(${starX} ${starY}) rotate(${mix(-40, 8, starT) + Math.sin(frame / 30) * 4}) scale(${starT})`}>
              <polygon points={star(56)} fill={p.accent2} transform="translate(5 4)" opacity={0.8} />
              <polygon points={star(56)} fill={p.pop} />
            </g>
          </svg>
        )}

        {/* Optional team photo, printed as a duotone */}
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              left: W / 2 - photo.w / 2,
              top: photo.top,
              width: photo.w,
              height: photo.h,
              borderRadius: 14,
              overflow: 'hidden',
              background: p.accent,
              rotate: `${mix(4, -2, prog(frame, MSG, 40))}deg`,
              opacity: prog(frame, MSG, 24),
              scale: String(mix(0.92, 1, prog(frame, MSG, 40))),
              boxShadow: `14px 14px 0 ${p.accent2}`,
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.25)', mixBlendMode: 'multiply' }} />
            <div style={{ position: 'absolute', inset: 0, background: p.accent2, mixBlendMode: 'screen', opacity: 0.35 }} />
          </div>
        )}

        {/* Message + signature */}
        <WordsIn text={p.message} frame={frame} start={MSG + 20} stagger={3} style={{ position: 'absolute', left: 150, width: W - 300, top: msgTop, justifyContent: 'center', textAlign: 'center', fontSize: 50, lineHeight: 1.35, fontWeight: 500, opacity: 0.92 }} />
        <div style={{ position: 'absolute', width: W, top: sigTop, textAlign: 'center', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 70, color: p.accent2 === '#F5C6AA' || p.accent2 === '#E8D9B5' ? p.pop : p.accent2, rotate: '-3deg', opacity: prog(frame, MSG + 80, 20), clipPath: `inset(0 ${100 - prog(frame, MSG + 80, 40, ease.inOut) * 100}% 0 0)` }}>— {p.signature}</div>

        {/* Edition stamp */}
        <div
          style={{
            position: 'absolute',
            left: stampPos.left,
            top: stampPos.top,
            whiteSpace: 'nowrap',
            background: hasPhoto ? p.paper : 'transparent',
            padding: '14px 28px',
            border: `4px solid ${p.accent2}`,
            borderRadius: 12,
            fontFamily: FONTS.outfit,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: p.accent2,
            rotate: `${mix(-30, -8, prog(frame, STAMP, 20, ease.backOut))}deg`,
            scale: String(mix(1.8, 1, prog(frame, STAMP, 16, ease.out))),
            opacity: clamp(prog(frame, STAMP, 8)) * 0.92,
          }}
        >
          {p.stamp}
        </div>

        <Glint frame={frame} start={STAMP + 30} dur={44} style={{ ...word, ...displayFace(p.font), top: titleTop, fontSize: W1 }}>
          {p.line1}
        </Glint>

        {/* Squeegee blade */}
        {bladeOn && (
          <>
            <div style={{ position: 'absolute', left: sx - 30, width: sw + 60, top: bladeY - 260, height: 260, background: `linear-gradient(180deg, transparent, ${hexA(frame < PULL2 - 10 ? p.accent : p.accent2, 0.35)})`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
            <div style={{ position: 'absolute', left: sx - 30, width: sw + 60, top: bladeY - 16, height: 32, borderRadius: 16, background: `linear-gradient(90deg, ${p.accent}, ${p.accent2})`, boxShadow: `0 0 50px ${hexA(p.accent2, 0.7)}`, rotate: '-2deg' }} />
          </>
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${hexA(p.pop, flash * 0.45)} 0%, ${hexA(p.accent2, flash * 0.3)} 30%, transparent 60%)`, mixBlendMode: dark ? 'screen' : 'multiply', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
