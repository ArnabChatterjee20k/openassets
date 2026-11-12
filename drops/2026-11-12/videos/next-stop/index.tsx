import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Next Stop',
  category: 'lower-third',
  description:
    'Station-sign lower third for Junction webinars, podcasts and demos: a coloured line runs in along the bottom third, the speaker’s headshot pops into a station bullet, a sign band wipes open with their name, a lemon strip carries title and company, and a line-code chip settles. A train dot runs the line during the hold; it all retracts into the bullet on exit.',
  tags: ['lower-third', 'name', 'speaker', 'webinar', 'podcast', 'transit'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  name: text('Speaker name').default('Maya Okonkwo'),
  title: text('Title · company').default('Head of Growth · Loop Fitness'),
  code: text('Line code').default('L07'),
  show: text('Show / chip').default('Growth Talks · Ep. 12'),
  headshot: image('Headshot (optional)').default(''),
  footage: image('Background still (optional)').default(''),
  font: font('Name font').default('shoulders'),
  background: color().default('#FFF8E1'),
  ink: color('Ink / sign band').default('#1C2B1A'),
  signText: color('Sign text').default('#FFF8E1'),
  surface: color('Title strip').default('#FFE9A8'),
  line: color('Line colour').default('#FF7A00'),
  accent2: color('Second line').default('#2BB24C'),
  pop: color('Pop').default('#FF3D7F'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night line': { background: '#0E1A14', ink: '#EAF2DC', signText: '#0E1A14', surface: '#18291F', line: '#FF9F43', accent2: '#B5E550', name: 'Dev Patel', title: 'Paid Social Lead · Junction', code: 'L12' },
  swiss: { background: '#F5F5F0', ink: '#0A0A0A', signText: '#F5F5F0', surface: '#E6E6E1', line: '#E3000F', accent2: '#0A0A0A', pop: '#E3000F', name: 'Jonas Weber', title: 'CFO · Halde Outdoor', show: 'Budget Clinic · Live' },
  blueprint: { background: '#0F3B8C', ink: '#EAF2FF', signText: '#0F3B8C', surface: '#134AA8', line: '#FFDD00', accent2: '#7FB2FF', pop: '#FF7A9C', name: 'Ana Ruiz', title: 'Founder · Junction', code: 'L01', show: 'Launch Week · Day 1' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

// Geometry (1920 × 1080). The plate sits in the lower third, inside the safe area.
const LY = 812; // line / band centre
const BX = 250; // station bullet centre
const BR = 96; // bullet radius
const BAND_H = 150;
const LW = 26;

export default function NextStop(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const hasFootage = !!p.footage;
  const end = video.durationInFrames;

  // Beat map
  const POP = T.beats(2); // bullet pops
  const OPEN = POP + 4; // band wipes open
  const STRIP = T.beats(3); // title strip
  const CHIP = T.beats(4); // chip settles
  const GLINT = T.bars(2);
  const EXIT = end - T.beats(3);

  const exitBand = prog(frame, EXIT, 26, ease.in);
  const exitLine = prog(frame, EXIT + 30, 34, ease.in);
  const lineIn = prog(frame, 0, POP, ease.inOutSoft);
  const pop = prog(frame, POP - 4, 24, ease.backOut) * (1 - prog(frame, EXIT + 22, 18, ease.in));
  const shock = prog(frame, POP, 44, ease.out);
  const flash = keys(frame, [POP - 2, POP + 2, POP + 22], [0, 1, 0], [ease.out, ease.outSoft]);

  const nameSize = p.name.length > 16 ? 92 : 112;
  const bandW = Math.min(1400, Math.max(640, p.name.length * nameSize * 0.47 + BR + 200));
  const open = prog(frame, OPEN, 30, ease.out) * (1 - exitBand);
  const stripW = Math.min(1300, Math.max(520, p.title.length * 25 + 120));
  const strip = prog(frame, STRIP, 26, ease.out) * (1 - prog(frame, EXIT - 8, 22, ease.in));
  const chip = prog(frame, CHIP, 24, ease.backOut) * (1 - prog(frame, EXIT - 14, 16, ease.in));

  // The line enters from the left edge to the bullet, and continues behind the band to the right edge.
  const lineEnd = mix(-60, BX, lineIn);
  const lineStart = mix(-60, BX, exitLine);
  const tailW = (W + 60 - BX) * prog(frame, OPEN + 10, 50, ease.outSoft) * (1 - prog(frame, EXIT, 30, ease.in));

  // Train dot running along the far line during the hold.
  const trainU = ((frame - OPEN) / 150) % 1;
  const trainVis = prog(frame, OPEN + 50, 20) * (1 - exitBand);

  // Slow camera push on the background only.
  const push = mix(1, 1.06, prog(frame, 0, end, ease.inOutSoft));

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.outfit, overflow: 'hidden' }}>
      {/* ── Background: footage still, or a calm studio backdrop with a faint route map ── */}
      <AbsoluteFill style={{ scale: String(push) }}>
        {hasFootage ? (
          <>
            <Img src={p.footage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 45%, ${hexA('#000000', 0.45)} 100%)` }} />
          </>
        ) : (
          <>
            <Backdrop
              base={p.background}
              frame={frame}
              grid={{ opacity: dark ? 0.08 : 0.14, size: 44, y: -frame * 0.15, color: dark ? '255,255,255' : '28,43,26' }}
              lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}
              glows={[
                { x: 1450, y: 260, size: 1300, color: hexA(p.line, 0.35), opacity: (dark ? 0.6 : 0.45) + 0.08 * Math.sin(frame / 40) },
                { x: 300, y: 1000, size: 1100, color: hexA(p.accent2, 0.3), opacity: dark ? 0.5 : 0.3 },
              ]}
              grain={0}
              vignette={dark ? 0.5 : 0.1}
            />
            <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: dark ? 0.22 : 0.16 }}>
              <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={34}>
                <polyline points="1000,-40 1000,240 1260,500 2000,500" stroke={p.line} />
                <polyline points="1180,-40 1180,180 1420,420 2000,420" stroke={p.accent2} />
                <polyline points="1360,-40 1360,120 1560,320 2000,320" stroke={p.pop} />
              </g>
              {[[1000, 240], [1180, 180], [1360, 120], [1700, 500], [1800, 420], [1880, 320]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={22} fill={p.background} stroke={p.ink} strokeWidth={9} />
              ))}
            </svg>
            <Dust frame={frame} width={W} height={H} count={34} color={p.line} seed={4} speed={0.7} opacity={dark ? 0.45 : 0.3} maxSize={5} />
          </>
        )}
      </AbsoluteFill>

      {/* ── The line ── */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {lineEnd > lineStart + 1 && (
          <>
            <line x1={lineStart} y1={LY} x2={lineEnd} y2={LY} stroke={hasFootage ? hexA('#000000', 0.25) : p.background} strokeWidth={LW * 1.8} strokeLinecap="round" />
            <line x1={lineStart} y1={LY} x2={lineEnd} y2={LY} stroke={p.line} strokeWidth={LW} strokeLinecap="round" />
          </>
        )}
        {tailW > 1 && <line x1={BX} y1={LY + BAND_H / 2 + 34} x2={BX + tailW} y2={LY + BAND_H / 2 + 34} stroke={p.accent2} strokeWidth={10} strokeLinecap="round" opacity={0.95} />}
        {tailW > 1 && <circle cx={BX + trainU * (W - BX)} cy={LY + BAND_H / 2 + 34} r={15} fill={p.background} stroke={p.ink} strokeWidth={6} opacity={trainVis} />}
        {/* shockwave starts outside the bullet so it never cuts the face */}
        <circle cx={BX} cy={LY} r={BR + 10 + shock * 220} fill="none" stroke={p.line} strokeWidth={mix(12, 1, shock)} opacity={frame >= POP ? (1 - shock) * 0.8 : 0} />
      </svg>

      {/* ── Sign band (wipes right out of the bullet) ── */}
      <div
        style={{
          position: 'absolute',
          left: BX,
          top: LY - BAND_H / 2,
          width: bandW * open,
          height: BAND_H,
          background: p.ink,
          borderRadius: `0 ${BAND_H * 0.2}px ${BAND_H * 0.2}px 0`,
          overflow: 'hidden',
          boxShadow: `12px 12px 0 ${hexA(p.line, 0.95)}`,
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 16, height: 8, width: bandW, background: `linear-gradient(90deg, ${p.line} 0 33%, ${p.accent2} 33% 66%, ${p.pop} 66%)` }} />
        <div style={{ position: 'absolute', left: BR + 46, top: 0, bottom: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <SweepReveal frame={frame} start={OPEN + 6} dur={30} blur={14}>
            <div style={{ ...displayFace(p.font), fontSize: nameSize, lineHeight: 1, letterSpacing: '0.005em', textTransform: 'uppercase', color: p.signText, translate: '0 6px' }}>{p.name}</div>
          </SweepReveal>
          <Glint frame={frame} start={GLINT} dur={44} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', ...displayFace(p.font), fontSize: nameSize, lineHeight: 1, letterSpacing: '0.005em', textTransform: 'uppercase', translate: '0 6px' }}>
            {p.name}
          </Glint>
        </div>
      </div>

      {/* ── Title strip (drops from under the band) ── */}
      <div
        style={{
          position: 'absolute',
          left: BX + BR + 24,
          top: LY + BAND_H / 2 - 6,
          height: 82 * strip,
          width: stripW,
          overflow: 'hidden',
          borderRadius: '0 0 14px 14px',
        }}
      >
        <div style={{ height: 82, background: p.surface, border: `4px solid ${p.ink}`, borderTop: 'none', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', padding: '0 28px', boxSizing: 'border-box', translate: `0 ${(strip - 1) * 82}px` }}>
          <WordsIn text={p.title} frame={frame} start={STRIP + 6} stagger={4} style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.01em', color: p.ink, whiteSpace: 'nowrap', flexWrap: 'nowrap' }} />
        </div>
      </div>

      {/* ── Chip: line code + show, perched on the band's right end ── */}
      {p.show && (
        <div
          style={{
            position: 'absolute',
            left: BX + bandW - 40,
            top: LY - BAND_H / 2 - 74,
            translate: '-100% 0',
            scale: String(mix(0.6, 1, chip)),
            opacity: clamp(chip * 2),
            transformOrigin: 'right bottom',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '10px 24px 10px 12px',
            borderRadius: 999,
            background: p.background,
            border: `4px solid ${p.ink}`,
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: p.ink,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ padding: '4px 12px', borderRadius: 999, background: p.pop, color: '#FFFFFF', letterSpacing: '0.08em' }}>{p.code}</span>
          {p.show}
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.accent2, opacity: 0.4 + 0.6 * (Math.floor(frame / 20) % 2) }} />
        </div>
      )}

      {/* ── Station bullet with headshot or initials ── */}
      <div
        style={{
          position: 'absolute',
          left: BX - BR,
          top: LY - BR,
          width: BR * 2,
          height: BR * 2,
          borderRadius: '50%',
          background: p.background,
          border: `14px solid ${p.ink}`,
          boxSizing: 'border-box',
          overflow: 'hidden',
          scale: String(pop),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 10px 30px ${hexA('#000000', 0.25)}`,
        }}
      >
        {p.headshot ? (
          <Img src={p.headshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ ...displayFace(p.font), fontSize: 76, lineHeight: 1, color: p.ink, translate: '0 4px' }}>{initials(p.name)}</div>
        )}
        {/* line-colour ring inside the bullet */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `inset 0 0 0 8px ${p.line}` }} />
      </div>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${BX}px ${LY}px, ${hexA('#FFFFFF', flash * 0.9)} 0%, ${hexA(p.line, flash * 0.3)} 10%, transparent 24%)`, pointerEvents: 'none' }} />
      <FilmOverlay grain={0.05} vignette={dark || hasFootage ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
