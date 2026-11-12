import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Milestone Board',
  category: 'milestone',
  description: 'Vertical milestone story styled as a split-flap departure board: the figure flips into place on the beat, a burst of line bullets, timetable stat rows, a route progress strip and a thank-you CTA. Optional team photo.',
  tags: ['milestone', 'story', 'split-flap', 'stats', 'transit', 'ads'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  brand: text('Brand').default('Junction'),
  tag: text('Sign tag').default('Milestone · Nov 2026'),
  intro: text('Intro line').default('This week we crossed'),
  figure: text('Figure (split-flap)').default('$100,000,000'),
  label: text('What it counts').default('Ad spend dispatched'),
  row1: text('Row 1 label').default('Ad platforms'),
  row1Value: text('Row 1 value').default('32'),
  row2: text('Row 2 label').default('Campaigns run'),
  row2Value: text('Row 2 value').default('18,402'),
  row3: text('Row 3 label').default('Missed launches'),
  row3Value: text('Row 3 value').default('0'),
  photo: image('Team photo (optional)').default(''),
  photoCaption: text('Photo caption').default('The crew · Oakland depot'),
  cta: text('Call to action').default('Thank you, riders'),
  url: text('URL').default('junction.ad'),
  font: font('Display font').default('shoulders'),
  background: color().default('#FFF8E1'),
  panel: color('Panel').default('#FFE9A8'),
  ink: color().default('#1C2B1A'),
  accent: color('Line 1 / accent').default('#FF7A00'),
  accent2: color('Line 2').default('#2BB24C'),
  pop: color('Line 3 / pop').default('#FF3D7F'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night line': { background: '#0E1A14', panel: '#18291F', ink: '#EAF2DC', accent: '#FF9F43', accent2: '#B5E550', pop: '#FF3D7F' },
  sorbet: { background: '#FFEDE1', panel: '#FFD3C2', ink: '#3D0E2A', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', figure: '1,000,000', label: 'Campaigns launched', font: 'anton' },
  swiss: { background: '#F5F5F0', panel: '#E6E6E1', ink: '#0A0A0A', accent: '#E3000F', accent2: '#0A0A0A', pop: '#E3000F', figure: '10,000', label: 'Teams on board', intro: 'Today we welcomed' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const FLAP_CHARS = '0123456789$,.%+KMB';
const BOARD = '#141D13';
const BOARD_TEXT = '#FFF3C4';

/** One split-flap tile: cycles through characters, then lands on its own. */
function Flap({ ch, frame, settle, w, h, i, p }: { ch: string; frame: number; settle: number; w: number; h: number; i: number; p: P }) {
  const startFlip = settle - 34 - i * 2;
  const flipping = frame >= startFlip && frame < settle;
  const step = Math.floor(frame / 3);
  const shown = frame < startFlip ? '' : flipping ? FLAP_CHARS[Math.floor(rand(step * 7.3 + i * 13.1) * FLAP_CHARS.length)] : ch;
  // each character change drops the top flap: a quick squash of the upper half
  const phase = flipping ? (frame % 3) / 3 : 1;
  const land = keys(frame, [settle, settle + 3, settle + 10], [0, 1, 0], [ease.out, ease.outSoft]);
  const isPunct = ch === ',' || ch === '.';
  return (
    <div
      style={{
        position: 'relative',
        width: isPunct ? w * 0.48 : w,
        height: h,
        borderRadius: w * 0.1,
        background: `linear-gradient(180deg, #243323 0%, #1B271A 49.5%, #0E150D 50.5%, #172216 100%)`,
        boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.05), 0 ${h * 0.04}px ${h * 0.08}px rgba(0,0,0,0.4)`,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        ...displayFace(p.font),
        fontSize: h * 0.82,
        lineHeight: 1,
        color: ch === '$' && !flipping ? p.accent : BOARD_TEXT,
        translate: `0 ${land * -h * 0.04}px`,
      }}
    >
      <span style={{ translate: `0 ${h * 0.03}px` }}>{shown}</span>
      {/* falling upper flap */}
      {flipping && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%', background: 'linear-gradient(180deg, #2C3D2B, #1E2B1D)', transformOrigin: 'bottom', scale: `1 ${1 - phase}`, opacity: 0.85 }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, marginTop: -1.5, background: '#070B07' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${hexA('#FFFFFF', 0.25 * land)}, transparent 60%)` }} />
    </div>
  );
}

export default function MilestoneBoard(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const end = video.durationInFrames;

  const HIT = T.bars(1); // last flap lands, flash
  const ROWS = T.bars(2);
  const STRIP = T.bars(2) + T.beats(3);
  const CTA = T.bars(3) + T.beats(3);
  const EXIT = end - 30;

  const exitT = prog(frame, EXIT, 30, ease.in);
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 26], [0, 1, 0], [ease.out, ease.outSoft]);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const shake = frame >= HIT && frame < HIT + 12 ? Math.sin(frame * 2.1) * (1 - (frame - HIT) / 12) * 6 : 0;

  // Board geometry
  const chars = p.figure.split('');
  const nWide = chars.reduce((s, c) => s + (c === ',' || c === '.' ? 0.48 : 1), 0);
  const gap = 8;
  const boardInner = W - 160 - 48;
  const tileW = Math.min(118, (boardInner - gap * (chars.length - 1)) / nWide);
  const tileH = tileW * 1.55;
  const BASE_TOP = 470;
  // The figure block starts centred in the frame, then glides up a beat before the
  // timetable rows arrive to make room for them.
  const lift = mix(400, 0, prog(frame, ROWS - 40, 46, ease.inOut));
  const boardTop = BASE_TOP + lift;
  const boardH = tileH + 64;
  const cy = boardTop + boardH / 2;
  const settleAt = (i: number) => HIT - (chars.length - 1 - i) * 5;

  const labelSize = p.label.length > 20 ? 96 : 118;
  const rows = [
    [p.row1, p.row1Value, p.accent],
    [p.row2, p.row2Value, p.accent2],
    [p.row3, p.row3Value, p.pop],
  ].filter((r) => r[0]);

  const hasPhoto = !!p.photo;
  const rowTop = BASE_TOP + boardH + 270;
  const photoTop = rowTop + rows.length * 112 + 40;
  const stripY = hasPhoto ? photoTop + 360 + 90 : rowTop + rows.length * 112 + 190;
  const stripDraw = prog(frame, STRIP, T.bars(1) - 10, ease.inOutSoft);
  const stops = ['$1M', '$10M', '$50M', p.figure.length < 8 ? p.figure : '$100M'];
  const stripL = 120;
  const stripR = W - 120;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.15, size: 36, y: -frame * 0.15, color: dark ? '255,255,255' : '28,43,26' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}
        glows={[
          { x: W / 2, y: cy, size: mix(700, 1500, prog(frame, HIT, 60)), color: hexA(p.accent, 0.45), opacity: dark ? 0.7 : 0.55 },
          { x: 0, y: H * 0.85, size: 1200, color: hexA(p.accent2, 0.35), opacity: (dark ? 0.5 : 0.35) + 0.1 * Math.sin(frame / 40) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.5}px`, opacity: 1 - exitT }}>
        <Dust frame={frame} width={W} height={H} count={40} color={p.accent} seed={4} speed={0.7} opacity={dark ? 0.5 : 0.3} maxSize={5} />

        {/* Sign band drops in from the top */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            right: 80,
            top: 120,
            height: 120,
            borderRadius: 22,
            background: dark ? p.panel : p.ink,
            color: dark ? p.ink : p.background,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 34px',
            translate: `0 ${mix(-260, 0, prog(frame, 0, 26, ease.out))}px`,
            boxShadow: `10px 10px 0 ${p.accent}`,
          }}
        >
          {[p.accent, p.accent2, p.pop].map((c, i) => (
            <span key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: c, flex: 'none', scale: String(prog(frame, 14 + i * 4, 18, ease.backOut)) }} />
          ))}
          <span style={{ ...displayFace('shoulders'), fontSize: 76, letterSpacing: '0.02em', textTransform: 'uppercase', marginLeft: 12, whiteSpace: 'nowrap' }}>{p.brand}</span>
          <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.18em', textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: 0.85 }}>{p.tag}</span>
        </div>

        <WordsIn text={p.intro} frame={frame} start={T.beats(1) - 10} stagger={5} style={{ position: 'absolute', left: 80, right: 80, top: boardTop - 110, fontSize: 60, fontWeight: 500, letterSpacing: '-0.01em' }} />

        {/* Departure board */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            right: 80,
            top: boardTop,
            height: boardH,
            borderRadius: 28,
            background: BOARD,
            border: `6px solid ${dark ? p.panel : p.ink}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap,
            scale: String(mix(0.96, 1, prog(frame, T.beats(1), 24, ease.out)) * (1 + keys(frame, [HIT, HIT + 4, HIT + 24], [0, 0.025, 0]))),
            opacity: prog(frame, T.beats(1) - 14, 16),
            boxShadow: `0 30px 60px ${hexA('#000000', 0.25)}`,
          }}
        >
          {chars.map((c, i) => (
            <Flap key={i} ch={c} frame={frame} settle={settleAt(i)} w={tileW} h={tileH} i={i} p={p} />
          ))}
          {/* board LEDs */}
          <div style={{ position: 'absolute', left: 22, top: 14, display: 'flex', gap: 8 }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ width: 10, height: 10, borderRadius: '50%', background: frame >= HIT ? p.accent2 : Math.floor(frame / 8 + k) % 3 === 0 ? p.accent : '#3A4A38' }} />
            ))}
          </div>
        </div>

        {/* Tracks: after the hit, three lines drop from the board to the bottom edge,
            filling the lower frame until the timetable needs the space. */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {[p.accent, p.accent2, p.pop].map((c, i) => {
            const x = W - 300 + i * 64;
            const y0 = boardTop + boardH;
            const down = prog(frame, HIT + 6 + i * 5, 40, ease.out) * (1 - prog(frame, ROWS - 50, 30, ease.in));
            const y1 = mix(y0, H + 40, down);
            return down > 0.002 ? (
              <g key={i}>
                <line x1={x} y1={y0} x2={x} y2={y1} stroke={c} strokeWidth={30} strokeLinecap="round" />
                {[0, 1].map((k) => {
                  const u = ((frame - HIT) / 70 + k * 0.5 + i * 0.21) % 1;
                  const ty = mix(y0, H, u);
                  return ty < y1 - 20 ? <rect key={k} x={x - 5} y={ty} width={10} height={44} rx={5} fill={p.background} /> : null;
                })}
                <circle cx={x} cy={y0 + 6} r={20} fill={p.background} stroke={p.ink} strokeWidth={8} />
              </g>
            ) : null;
          })}
        </svg>

        {/* Impact: rings and line bullets bursting from the board */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
          {[0, 1].map((k) => {
            const t = prog(frame, HIT + k * 6, 60, ease.out);
            return (
              <rect
                key={k}
                x={80 - t * 160}
                y={boardTop - t * 160}
                width={W - 160 + t * 320}
                height={boardH + t * 320}
                rx={28 + t * 80}
                fill="none"
                stroke={k ? p.pop : p.accent}
                strokeWidth={mix(10, 1, t)}
                opacity={frame >= HIT + k * 6 ? (1 - t) * 0.8 : 0}
              />
            );
          })}
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2 + rand(i) * 0.3;
            const t = prog(frame, HIT, 70, ease.out);
            const d = 340 + t * (420 + rand(i * 3.3) * 260);
            const c = [p.accent, p.accent2, p.pop][i % 3];
            const r = 18 * (1 - prog(frame, HIT + 30, 40, ease.in));
            return frame >= HIT && r > 0.5 ? <circle key={i} cx={W / 2 + Math.cos(a) * d} cy={cy + Math.sin(a) * d * 0.8} r={r} fill={p.background} stroke={c} strokeWidth={r * 0.45} /> : null;
          })}
        </svg>

        {/* Label: what the number counts */}
        {frame >= HIT && (
          <>
            <SweepReveal frame={frame} start={HIT + 4} dur={30} style={{ position: 'absolute', left: 80, right: 80, top: boardTop + boardH + 46 }}>
              <div style={{ ...displayFace(p.font), fontSize: labelSize, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.005em', color: p.accent, WebkitTextStroke: dark ? undefined : `2px ${p.ink}` }}>{p.label}</div>
            </SweepReveal>
            <Glint frame={frame} start={T.bars(3)} dur={44} style={{ position: 'absolute', left: 80, right: 80, top: boardTop + boardH + 46, ...displayFace(p.font), fontSize: labelSize, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.005em' }}>
              {p.label}
            </Glint>
          </>
        )}

        {/* Timetable rows */}
        {rows.map(([label, value, c], i) => {
          const t = prog(frame, ROWS + i * T.beats(0.5), 26, ease.out);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 80,
                right: 80,
                top: rowTop + i * 112,
                height: 96,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                borderBottom: `3px dashed ${hexA(p.ink, 0.25)}`,
                opacity: clamp(t * 1.5),
                translate: `${mix(60, 0, t)}px 0`,
              }}
            >
              <span style={{ width: 46, height: 46, borderRadius: '50%', background: p.background, border: `12px solid ${c}`, boxSizing: 'border-box', flex: 'none' }} />
              <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 44, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ marginLeft: 'auto', ...displayFace(p.font), fontSize: 84, lineHeight: 1 }}>{value}</span>
            </div>
          );
        })}

        {/* Optional team photo in a station frame */}
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              left: 80,
              right: 80,
              top: photoTop,
              height: 360,
              borderRadius: 26,
              overflow: 'hidden',
              border: `6px solid ${p.ink}`,
              boxShadow: `10px 10px 0 ${p.accent2}`,
              opacity: prog(frame, ROWS + T.beats(2), 24),
              translate: `0 ${mix(40, 0, prog(frame, ROWS + T.beats(2), 30))}px`,
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(mix(1.08, 1, prog(frame, ROWS, T.bars(2), ease.outSoft))) }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, background: p.ink, color: p.background, display: 'flex', alignItems: 'center', padding: '0 24px', fontFamily: FONTS.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {p.photoCaption}
            </div>
          </div>
        )}

        {/* Route progress strip: the line runs through each milestone */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <line x1={stripL} y1={stripY} x2={stripR} y2={stripY} stroke={hexA(p.ink, 0.15)} strokeWidth={22} strokeLinecap="round" opacity={prog(frame, STRIP - 20, 20)} />
          <line x1={stripL} y1={stripY} x2={mix(stripL, stripR, stripDraw)} y2={stripY} stroke={p.accent} strokeWidth={22} strokeLinecap="round" opacity={stripDraw > 0.002 ? 1 : 0} />
          {/* a train running along the finished line */}
          {stripDraw >= 1 && <rect x={mix(stripL, stripR - 50, ((frame - STRIP) / 120) % 1)} y={stripY - 5} width={50} height={10} rx={5} fill={p.background} />}
          {stops.map((s, i) => {
            const x = mix(stripL, stripR, i / (stops.length - 1));
            const reached = stripDraw >= i / (stops.length - 1) - 0.001;
            const last = i === stops.length - 1;
            const pop = reached ? prog(frame, STRIP + (i / (stops.length - 1)) * (T.bars(1) - 10), 20, ease.backOut) : 0;
            return (
              <g key={i} opacity={prog(frame, STRIP - 20, 20)}>
                <circle cx={x} cy={stripY} r={last ? 30 : 22} fill={p.background} stroke={reached ? p.ink : hexA(p.ink, 0.3)} strokeWidth={10} />
                {last && reached && <circle cx={x} cy={stripY} r={12 * pop} fill={p.pop} />}
                {/* terminus pulses on every beat once reached */}
                {last && reached && (
                  <circle cx={x} cy={stripY} r={30 + ((frame % T.beat) / T.beat) * 46} fill="none" stroke={p.pop} strokeWidth={5} opacity={(1 - (frame % T.beat) / T.beat) * 0.7} />
                )}
                <text x={x} y={stripY + 84} textAnchor={i === 0 ? 'start' : last ? 'end' : 'middle'} dx={i === 0 ? -20 : last ? 24 : 0} fontFamily={FONTS.mono} fontWeight={700} fontSize={44} letterSpacing="0.06em" fill={p.ink} opacity={reached ? 1 : 0.4}>
                  {s}
                </text>
              </g>
            );
          })}
        </svg>

        {/* CTA */}
        <div style={{ position: 'absolute', left: 80, right: 80, bottom: 130, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              padding: '26px 44px',
              borderRadius: 999,
              background: dark ? p.accent : p.ink,
              color: dark ? p.background : p.background,
              fontWeight: 800,
              fontSize: 52,
              boxShadow: `8px 8px 0 ${dark ? p.ink : p.accent}`,
              scale: String(prog(frame, CTA, 26, ease.backOut)),
              opacity: clamp(prog(frame, CTA, 10)),
              whiteSpace: 'nowrap',
            }}
          >
            {p.cta} <span style={{ display: 'inline-block', translate: `${Math.max(0, Math.sin((frame / T.beat) * Math.PI)) * 10}px 0` }}>→</span>
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 40, letterSpacing: '0.12em', opacity: prog(frame, CTA + 10, 20) }}>{p.url}</div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${(cy / H) * 100}%, ${hexA('#FFFFFF', flash * 0.9)} 0%, ${hexA(p.accent, flash * 0.25)} 25%, transparent 50%)`, mixBlendMode: dark ? 'screen' : 'normal', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
