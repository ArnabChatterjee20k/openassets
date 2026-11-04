import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, WordsIn, clamp, ease, hexA, keys, mix, prog, rand, shade, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Thanksgiving Greeting',
  category: 'greeting',
  description:
    'Square customer greeting: a spindle engraves your greeting into a clay plate, throwing amber chips; on the downbeat it fills with colour, then your message, an optional team photo and the sign-off.',
  tags: ['greeting', 'thanksgiving', 'holiday', 'customers', 'square', 'engraving'],
};

const FPS = 60;
const T = tempo(FPS, 120);
const W = 1080;
const H = 1080;
export const video: VideoConfig = { width: W, height: H, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  line1: text('Line 1').default('Happy'),
  line2: text('Line 2').default('Thanksgiving'),
  message: textarea().default('Thank you for every part you trusted us to make this year.'),
  from: text('Signed').default('— the crew (and robots) at Redbrick Works'),
  footnote: text('Footnote').default('Shop closed Thu 26 Nov · robots on shift'),
  photo: image('Team photo (optional)').default(''),
  photoLabel: text('Photo label').default('Night shift · Dayton'),
  background: color().default('#F1E4D3'),
  plate: color('Plate').default('#E5CDB2'),
  ink: color('Text').default('#3B1F14'),
  accent: color('Engraving fill').default('#C8553D'),
  accent2: color('Leaves').default('#4F6D58'),
  pop: color('Sparks').default('#F2A541'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'happy-holidays': { line2: 'Holidays', message: 'Thanks for building with us this year. See you in January.', footnote: 'Shop closed 24–26 Dec · robots on shift', background: '#0F3B8C', plate: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', pop: '#FFFFFF' },
  'new-year': { line1: 'Happy', line2: 'New Year', message: '2,184 orders, 61,000 parts, zero late shipments. Here’s to 2027.', footnote: 'Back on the floor Mon 4 Jan', background: '#2B1B2E', plate: '#45293F', ink: '#FFE9D6', accent: '#FF8E5E', accent2: '#E5487A', pop: '#FFD27F' },
  'mid-century': { background: '#F4E9D8', plate: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

// Plate geometry
const PX = 90;
const PY = 150;
const PW = 900;
const PH = 420;
const CHAR = 0.8; // Bungee advance per character, in em (approx.)

/** Autumn leaves drifting down with drag and flutter (loop-safe, deterministic). */
function Leaves({ frame, colors }: { frame: number; colors: string[] }) {
  return (
    <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
      {Array.from({ length: 16 }, (_, i) => {
        const r = (k: number) => rand(i * 5.17 + k);
        const speed = 0.9 + r(1) * 1.2;
        const y = ((r(2) * (H + 200) + frame * speed) % (H + 200)) - 100;
        const x = r(3) * W + Math.sin(frame / (40 + r(4) * 30) + i) * 40;
        const rot = frame * (r(5) - 0.5) * 3 + r(6) * 360;
        const s = 0.6 + r(7) * 0.8;
        const flip = Math.cos(frame / (20 + r(8) * 20) + i);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * flip} ${s})`} opacity={0.55}>
            <path d="M0,-22 C14,-12 14,10 0,22 C-14,10 -14,-12 0,-22 Z" fill={colors[i % colors.length]} />
            <line x1={0} y1={-18} x2={0} y2={24} stroke={hexA('#000000', 0.25)} strokeWidth={1.5} />
          </g>
        );
      })}
    </svg>
  );
}

export default function ThanksgivingGreeting(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const HIT = T.bars(1);

  const plateIn = prog(frame, 0, 34, ease.out);
  const bump = 1 + keys(frame, [HIT - 2, HIT + 4, HIT + 30], [0, 0.03, 0], [ease.out, ease.outSoft]);
  const flash = keys(frame, [HIT - 1, HIT + 3, HIT + 30], [0, 0.75, 0], [ease.out, ease.outSoft]);
  const fill = prog(frame, HIT, 20, ease.out);
  const outro = prog(frame, end - 30, 30, ease.inOut);
  const breathe = 1 + Math.sin(frame / 50) * 0.006;

  // Type sizes fitted to the plate
  const s1 = Math.min(150, (PW - 120) / (Math.max(p.line1.length, 3) * CHAR));
  const s2 = Math.min(120, (PW - 100) / (Math.max(p.line2.length, 3) * CHAR));
  const w1 = p.line1.length * CHAR * s1;
  const w2 = p.line2.length * CHAR * s2;
  const cx = PX + PW / 2;
  // baselines: centre the two-line block in the plate (below the part-number label)
  const block = s1 * 0.74 + s2 * 1.12;
  const y1 = PY + 30 + (PH - 30 - block) / 2 + s1 * 0.74;
  const y2 = y1 + s2 * 1.12;

  // Engraving: line 1 in beats 1–2, line 2 in beats 2–4 (raster passes, left → right)
  const e1 = prog(frame, 22, 40, ease.inOutSoft);
  const e2 = prog(frame, 64, 52, ease.inOutSoft);
  const onLine1 = frame < 64;
  const ex = onLine1 ? cx - w1 / 2 - 10 + (w1 + 20) * e1 : cx - w2 / 2 - 10 + (w2 + 20) * e2;
  const eyBase = onLine1 ? y1 : y2;
  const eS = onLine1 ? s1 : s2;
  const ey = eyBase - eS * 0.4 + Math.sin(frame * 1.3) * eS * 0.34; // zig-zag raster
  const engraving = frame >= 22 && frame < HIT - 4;

  const engraved = shade(p.plate, -0.5);
  const hasPhoto = !!p.photo;
  const photoIn = prog(frame, T.bars(2), 30, ease.backOut);

  const lineStyle = { fontFamily: FONTS.bungee, letterSpacing: '0' } as const;
  const textNodes = (fillColor: string, dx = 0, dy = 0) => (
    <>
      <text x={cx + dx} y={y1 + dy} textAnchor="middle" fontSize={s1} fill={fillColor} style={lineStyle}>
        {p.line1}
      </text>
      <text x={cx + dx} y={y2 + dy} textAnchor="middle" fontSize={s2} fill={fillColor} style={lineStyle}>
        {p.line2}
      </text>
    </>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.12 : 0.16, size: 36, y: -frame * 0.12, color: dark ? '234,242,255' : '59,31,20' }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,250,240,0.8)'}
        glows={[
          { x: cx, y: PY + PH / 2, size: 1300, color: hexA(p.pop, dark ? 0.3 : 0.45), opacity: keys(frame, [0, HIT, HIT + 40, end], [0.4, 0.6, 1, 0.8]) },
          { x: 120, y: 1040, size: 900, color: hexA(p.accent, 0.3), opacity: 0.6 },
        ]}
        grain={0}
        vignette={dark ? 0.45 : 0.15}
      />
      <Leaves frame={frame + 400} colors={[p.accent, p.pop, p.accent2]} />

      <AbsoluteFill style={{ opacity: 1 - outro, scale: String(breathe) }}>
        {/* The plate */}
        <div
          style={{
            position: 'absolute',
            left: PX,
            top: PY,
            width: PW,
            height: PH,
            borderRadius: 34,
            background: `linear-gradient(160deg, ${shade(p.plate, 0.18)} 0%, ${p.plate} 55%, ${shade(p.plate, -0.08)} 100%)`,
            border: `3px solid ${p.ink}`,
            boxShadow: `14px 14px 0 ${p.ink}, inset 0 3px 0 ${hexA('#FFFFFF', 0.4)}`,
            opacity: plateIn,
            translate: `0 ${mix(-60, 0, plateIn)}px`,
            scale: String(bump * mix(1.04, 1, plateIn)),
          }}
        >
          {/* screws */}
          {[
            [28, 28],
            [PW - 28, 28],
            [28, PH - 28],
            [PW - 28, PH - 28],
          ].map(([x, y], i) => (
            <svg key={i} style={{ position: 'absolute', left: x - 13, top: y - 13 }} width={26} height={26}>
              <circle cx={13} cy={13} r={11} fill={shade(p.plate, -0.2)} stroke={p.ink} strokeWidth={2} />
              <line x1={6} y1={13} x2={20} y2={13} stroke={p.ink} strokeWidth={2.5} transform={`rotate(${30 + i * 40} 13 13)`} />
            </svg>
          ))}
          <div style={{ position: 'absolute', left: 60, top: 26, fontFamily: FONTS.vt323, fontSize: 30, letterSpacing: '0.2em', color: p.ink, opacity: 0.75 }}>
            PART NO. RB-1126 · 6061-T6
          </div>
        </div>

        {/* Engraving, drawn in page coordinates over the plate */}
        <svg style={{ position: 'absolute', inset: 0, opacity: plateIn, overflow: 'visible' }} width={W} height={H}>
          <defs>
            <clipPath id="tg-reveal">
              <rect x={0} y={0} width={onLine1 ? ex : W} height={y1 + s1 * 0.12} />
              <rect x={0} y={y1 + s1 * 0.12} width={onLine1 ? 0 : frame >= HIT - 4 ? W : ex} height={H} />
            </clipPath>
            <radialGradient id="tg-spark">
              <stop offset="0" stopColor={p.pop} stopOpacity="1" />
              <stop offset="0.45" stopColor={p.pop} stopOpacity="0.35" />
              <stop offset="1" stopColor={p.pop} stopOpacity="0" />
            </radialGradient>
          </defs>
          <g transform={`translate(${cx} ${PY + PH / 2}) scale(${bump}) translate(${-cx} ${-(PY + PH / 2)})`}>
            {/* dashed toolpath guide where the text will go */}
            <g opacity={0.35 * (1 - fill)}>
              <line x1={cx - w1 / 2} x2={cx + w1 / 2} y1={y1 + 14} y2={y1 + 14} stroke={p.accent} strokeWidth={3} strokeDasharray="10 8" />
              <line x1={cx - w2 / 2} x2={cx + w2 / 2} y1={y2 + 14} y2={y2 + 14} stroke={p.accent} strokeWidth={3} strokeDasharray="10 8" />
            </g>
            <g clipPath="url(#tg-reveal)">
              {/* the cut: lighter lip below-right, dark floor */}
              {textNodes(hexA('#FFFFFF', 0.45), 2.5, 2.5)}
              {textNodes(engraved)}
              <g opacity={fill}>{textNodes(p.accent)}</g>
            </g>
          </g>
          {/* tool + chips */}
          {engraving && (
            <g>
              {Array.from({ length: 30 }, (_, i) => {
                const age = i * 1.4 + (frame % 2) * 0.7;
                const seed = Math.floor(frame - age);
                const a = -Math.PI / 2 + (rand(seed * 1.7 + i) - 0.5) * 2.6;
                const sp = 4 + rand(seed * 3.3 + i) * 6;
                const x = ex - age * 1.2 + Math.cos(a) * sp * age;
                const y = ey + Math.sin(a) * sp * age + 0.3 * age * age;
                return <rect key={i} x={x} y={y} width={5} height={3} rx={1} fill={i % 3 ? p.pop : p.accent} opacity={clamp(1 - age / 42)} transform={`rotate(${age * 20} ${x} ${y})`} />;
              })}
              <circle cx={ex} cy={ey} r={46} fill="url(#tg-spark)" />
              <rect x={ex - 8} y={ey - 150} width={16} height={146} rx={4} fill={shade(p.plate, 0.25)} stroke={p.ink} strokeWidth={2.5} />
              <rect x={ex - 26} y={ey - 210} width={52} height={64} rx={8} fill={p.accent2} stroke={p.ink} strokeWidth={2.5} />
              <rect x={ex - 26} y={ey - 176} width={52} height={7} fill={p.pop} />
              <circle cx={ex} cy={ey} r={7} fill={p.pop} stroke={p.ink} strokeWidth={2} />
            </g>
          )}
        </svg>

        <Glint frame={frame} start={T.bars(3)} dur={44} style={{ position: 'absolute', inset: 0 }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {textNodes('#FFFFFF')}
          </svg>
        </Glint>

        {/* Optional team photo, stamped and pinned to the plate corner */}
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              right: 50,
              top: PY - 110,
              width: 230,
              padding: '12px 12px 10px',
              background: '#FFF8EE',
              border: `3px solid ${p.ink}`,
              boxShadow: `8px 8px 0 ${p.ink}`,
              rotate: `${mix(-18, 6, photoIn)}deg`,
              scale: String(photoIn),
              opacity: clamp(photoIn * 2),
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', filter: 'sepia(0.25)' }} />
            <div style={{ fontFamily: FONTS.vt323, fontSize: 26, letterSpacing: '0.1em', textAlign: 'center', color: '#3B1F14', marginTop: 6, textTransform: 'uppercase' }}>{p.photoLabel}</div>
          </div>
        )}

        {/* Bar 1–2: CRT engraving readout under the plate */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: W,
            top: PY + PH + 90,
            display: 'flex',
            justifyContent: 'center',
            opacity: prog(frame, 14, 20) * (1 - prog(frame, HIT + T.beats(1), 20, ease.in)),
          }}
        >
          <div style={{ fontFamily: FONTS.vt323, fontSize: 44, letterSpacing: '0.12em', padding: '10px 28px', borderRadius: 12, background: p.ink, color: p.pop, whiteSpace: 'nowrap' }}>
            {frame < HIT ? `ENGRAVING ${String(Math.round(clamp((frame - 22) / (HIT - 26)) * 100)).padStart(3, ' ')}%` : 'DONE ✓ 0.2 MM DEEP'}
            <div style={{ height: 8, marginTop: 6, borderRadius: 4, background: hexA(p.pop, 0.2) }}>
              <div style={{ height: '100%', width: `${clamp((frame - 22) / (HIT - 26)) * 100}%`, borderRadius: 4, background: p.pop }} />
            </div>
          </div>
        </div>

        <WordsIn
          text={p.message}
          frame={frame}
          start={HIT + T.beats(2)}
          stagger={4}
          style={{ position: 'absolute', left: 100, width: W - 200, top: PY + PH + 80, justifyContent: 'center', textAlign: 'center', fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 48, lineHeight: 1.3, color: p.ink }}
        />
        <div
          style={{
            position: 'absolute',
            width: W,
            top: 880,
            textAlign: 'center',
            fontFamily: FONTS.outfit,
            fontWeight: 800,
            fontSize: 38,
            color: dark ? p.accent : p.accent,
            opacity: prog(frame, T.bars(3), 30),
            translate: `0 ${mix(20, 0, prog(frame, T.bars(3), 30))}px`,
          }}
        >
          {p.from}
        </div>
        <div
          style={{
            position: 'absolute',
            width: W,
            top: 945,
            textAlign: 'center',
            fontFamily: FONTS.vt323,
            fontSize: 32,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: p.ink,
            opacity: prog(frame, T.bars(3) + T.beats(1), 30) * 0.8,
          }}
        >
          {p.footnote}
        </div>
      </AbsoluteFill>

      {/* Downbeat flash + dust burst */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${((PY + PH / 2) / H) * 100}%, ${hexA('#FFF8EE', flash)} 0%, ${hexA(p.pop, flash * 0.5)} 25%, transparent 60%)` }} />
      {frame >= HIT && frame < HIT + 70 && (
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          {Array.from({ length: 40 }, (_, i) => {
            const t = (frame - HIT) / 60;
            const a = rand(i * 2.3) * Math.PI * 2;
            const sp = 500 + rand(i * 4.1) * 700;
            const d = (sp * (1 - Math.exp(-3 * t))) / 3;
            const x = cx + Math.cos(a) * (PW * 0.35 + d);
            const y = PY + PH / 2 + Math.sin(a) * (PH * 0.4 + d * 0.7) + 120 * t * t;
            return <circle key={i} cx={x} cy={y} r={3 + rand(i) * 4} fill={i % 2 ? p.pop : p.accent} opacity={clamp(1 - t * 0.9)} />;
          })}
        </svg>
      )}
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
