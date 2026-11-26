import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Plant Announcement',
  category: 'announcement',
  description:
    'Company announcement film: element tiles flip in on the beat like a signage board, a furnace-orange panel wipes in with a giant condensed headline, three stats count up beside your plant photo, then the CTA lands.',
  tags: ['announcement', 'press', 'materials', 'factory', 'mid-century'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Ternary Materials · Dec 1, 2026'),
  elements: text('Element tiles (number symbol · …)').default('31 Ga · 32 Ge · 60 Nd · 74 W'),
  teaser: text('Opening line').default('Four critical materials. One American plant.'),
  line1: text('Headline line 1').default('Plant 1'),
  line2: text('Headline line 2').default('is open.'),
  stat1: text('Stat 1 value').default('1,200'),
  label1: text('Stat 1 label').default('experiments a day'),
  stat2: text('Stat 2 value').default('31'),
  label2: text('Stat 2 label').default('qualified compounds'),
  stat3: text('Stat 3 value').default('0'),
  label3: text('Stat 3 label').default('foreign inputs'),
  location: text().default('Youngstown, Ohio'),
  cta: text('Call to action').default('ternary.com/plant-1'),
  photo: image('Plant photo (optional)').default(''),
  background: color().default('#F4E9D8'),
  panel: color('Panel').default('#D96C3D'),
  ink: color('Ink').default('#2E2A24'),
  tile: color('Tiles').default('#2C7873'),
  pop: color('Spark').default('#E9B44C'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  teal: { panel: '#2C7873', tile: '#D96C3D' },
  bauhaus: { background: '#F2EBDD', panel: '#1D4E9E', ink: '#111111', tile: '#D9381E', pop: '#F2B90F', line1: 'Magnet line', line2: 'is live.', stat1: '40', label1: 'tonnes NdFeB a year', elements: '60 Nd · 26 Fe · 5 B · 66 Dy' },
  'ink-gold': { background: '#16161A', panel: '#C9A45C', ink: '#F3EDE2', tile: '#3A3A40', pop: '#E8D9B5', line1: 'Series A', line2: '$48M.', stat1: '48', label1: 'million raised', stat2: '3', label2: 'defense primes signed', stat3: '2027', label3: 'Plant 2 online', cta: 'ternary.com/news' },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255;
};

/** Counts the number inside `value` up from 0, keeping its formatting ("1,200" → "0" … "1,200"). */
function countUp(value: string, t: number) {
  const m = value.match(/[\d,.]+/);
  if (!m) return value;
  const target = parseFloat(m[0].replace(/,/g, ''));
  if (!Number.isFinite(target)) return value;
  const n = Math.round(target * t);
  const s = m[0].includes(',') ? n.toLocaleString('en-US') : String(n);
  return value.replace(m[0], s);
}

function Star({ x, y, r, fill, rot = 0 }: { x: number; y: number; r: number; fill: string; rot?: number }) {
  const k = r * 0.22;
  return (
    <path
      transform={`rotate(${rot} ${x} ${y})`}
      d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r}Z`}
      fill={fill}
    />
  );
}

/** One enamel element tile. */
function Tile({ num, sym, size, p, style }: { num: string; sym: string; size: number; p: P; style?: CSSProperties }) {
  const fg = lum(p.tile) > 0.55 ? p.ink : '#F4E9D8';
  return (
    <div style={{ position: 'absolute', width: size, height: size, ...style }}>
      <div style={{ position: 'absolute', inset: 0, translate: `${size * 0.05}px ${size * 0.05}px`, borderRadius: size * 0.08, background: p.ink }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: size * 0.08,
          background: `linear-gradient(160deg, ${hexA('#ffffff', 0.18)}, transparent 45%), ${p.tile}`,
          boxShadow: `inset 0 0 0 ${size * 0.02}px ${hexA(fg, 0.85)}, inset 0 0 0 ${size * 0.034}px ${p.tile}, inset 0 0 0 ${size * 0.04}px ${hexA(fg, 0.45)}`,
          color: fg,
        }}
      >
        <div style={{ position: 'absolute', left: size * 0.11, top: size * 0.08, ...displayFace('shoulders'), fontSize: size * 0.2, lineHeight: 1 }}>{num}</div>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', paddingTop: size * 0.08, ...displayFace('shoulders'), fontSize: size * 0.56, lineHeight: 1 }}>{sym}</div>
      </div>
    </div>
  );
}

export default function PlantAnnouncement(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const HIT = T.bars(1);
  const panelText = lum(p.panel) > 0.6 ? p.ink : '#F4E9D8';

  const tiles = p.elements
    .split('·')
    .map((s) => s.trim().split(/\s+/))
    .filter((a) => a.length >= 2)
    .slice(0, 5);

  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 14) * 8 : 0;
  const outro = prog(frame, end - 30, 30, ease.in);

  // Panel wipe: a diagonal edge sweeping in from the left on the downbeat.
  const wipe = prog(frame, HIT - 4, 26, ease.inOut);
  const panelW = 960;
  const edge = mix(-260, panelW, wipe);
  const panelClip = `polygon(0 0, ${edge + 180}px 0, ${edge}px 100%, 0 100%)`;

  const HEAD = Math.max(p.line1.length, p.line2.length) > 9 ? 190 : 230;
  const statsTop = 160 + HEAD * 0.88 * 2 + 70;

  // Right column hero: photo frame (or a giant tile when no photo), with orbits.
  const heroIn = prog(frame, HIT + 8, 40, ease.out);
  const hx = 1510;
  const hy = 470;
  const orbitRot = frame * 0.35;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.16, size: 44, y: -frame * 0.15, color: lum(p.background) > 0.5 ? '46,42,36' : '255,255,255' }}
        lift={lum(p.background) > 0.5 ? 'rgba(255,250,240,0.7)' : 'rgba(255,255,255,0.05)'}
        glows={[
          { x: W * 0.5, y: H * 0.5, size: 1500, color: hexA(p.panel, 0.22), opacity: 0.6 + 0.2 * Math.sin(frame / 40) },
          { x: W * 0.85, y: H * 0.15, size: 1000, color: hexA(p.pop, 0.25), opacity: 0.7 },
        ]}
        grain={0}
        vignette={0.2}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.4}px`, opacity: 1 - outro }}>
        {/* ── Bar 1: signage board, tiles flip in on each beat ── */}
        {frame < HIT + 30 &&
          tiles.map(([num, sym], i) => {
            const at = i * T.beat;
            const inT = prog(frame, at, 22, ease.backOut);
            const outT = prog(frame, HIT - 10 + i * 2, 14, ease.in);
            const size = 300;
            const gap = 60;
            const total = tiles.length * size + (tiles.length - 1) * gap;
            return (
              <div key={i} style={{ perspective: 1200 }}>
                <Tile
                  num={num}
                  sym={sym}
                  size={size}
                  p={p}
                  style={{
                    left: (W - total) / 2 + i * (size + gap),
                    top: H / 2 - size / 2 + 40 - outT * 120,
                    transform: `rotateX(${mix(-95, 0, clamp(inT))}deg)`,
                    transformOrigin: '50% 0%',
                    opacity: clamp(inT * 3) * (1 - outT),
                    filter: outT > 0 ? `blur(${outT * 14}px)` : undefined,
                  }}
                />
              </div>
            );
          })}
        {frame < HIT + 4 && (
          <div style={{ opacity: 1 - prog(frame, HIT - 10, 12, ease.in) }}>
            <WordsIn
              text={p.teaser}
              frame={frame}
              start={T.beats(2)}
              stagger={5}
              style={{ position: 'absolute', width: W, top: H / 2 + 260, justifyContent: 'center', fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 56 }}
            />
          </div>
        )}
        {frame < HIT + 10 && (
          <div
            style={{
              position: 'absolute',
              width: W,
              top: 230,
              textAlign: 'center',
              fontFamily: FONTS.mono,
              fontSize: 34,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              opacity: prog(frame, 6, 24) * (1 - prog(frame, HIT - 10, 16, ease.in)),
              translate: `0 ${mix(16, 0, prog(frame, 6, 24))}px`,
            }}
          >
            {p.eyebrow}
          </div>
        )}

        {/* ── Bar 2: the hit. Panel wipes in, headline sweeps on it ── */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: panelW + 200, height: H, clipPath: panelClip, background: p.panel }}>
          {/* sunburst inside the panel */}
          <svg width={panelW + 200} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
            {Array.from({ length: 28 }, (_, i) => {
              const a = (i / 28) * Math.PI * 2 + frame * 0.002;
              const a2 = a + Math.PI / 56;
              const cx = 120;
              const cy = H + 40;
              return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a) * 2200} ${cy + Math.sin(a) * 2200} L${cx + Math.cos(a2) * 2200} ${cy + Math.sin(a2) * 2200}Z`} fill={panelText} />;
            })}
          </svg>
          <div style={{ position: 'absolute', left: 120, top: 112, fontFamily: FONTS.mono, fontSize: 30, letterSpacing: '0.3em', textTransform: 'uppercase', color: panelText, opacity: prog(frame, HIT + 10, 20) }}>
            {p.eyebrow}
          </div>
          {[p.line1, p.line2].map((line, i) => {
            const style = {
              position: 'absolute' as const,
              left: 112,
              top: 160 + i * HEAD * 0.88,
              ...displayFace('shoulders'),
              fontSize: HEAD,
              lineHeight: 1,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase' as const,
              whiteSpace: 'nowrap' as const,
              color: panelText,
            };
            return (
              <div key={i}>
                <SweepReveal frame={frame} start={HIT + 4 + i * 6} dur={30} style={style}>
                  {line}
                </SweepReveal>
                <Glint frame={frame} start={T.bars(3) + i * 6} dur={44} style={style}>
                  {line}
                </Glint>
              </div>
            );
          })}

          {/* ── Bar 3: stats on beats ── */}
          {[
            [p.stat1, p.label1],
            [p.stat2, p.label2],
            [p.stat3, p.label3],
          ].map(([v, l], i) => {
            const at = T.bars(2) + i * T.beat;
            const t = prog(frame, at, 24, ease.out);
            const count = prog(frame, at, 40, ease.outSoft);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 120,
                  top: statsTop + i * 104,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 28,
                  color: panelText,
                  opacity: clamp(t * 1.5),
                  translate: `${mix(-40, 0, t)}px 0`,
                }}
              >
                <span style={{ ...displayFace('shoulders'), fontSize: 92, lineHeight: 1, minWidth: 200, fontVariantNumeric: 'tabular-nums' }}>{countUp(v, count)}</span>
                <span style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 46 }}>{l}</span>
              </div>
            );
          })}
          {/* rules between stats */}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: 'absolute', left: 120, top: statsTop - 14 + i * 104, width: 820, height: 3, background: hexA(panelText, 0.35), scale: `${prog(frame, T.bars(2) + i * T.beat - 6, 30, ease.inOut)} 1`, transformOrigin: '0 0' }} />
          ))}
        </div>

        {/* ── Right column hero ── */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g opacity={heroIn}>
            <ellipse cx={hx} cy={hy} rx={420} ry={130} fill="none" stroke={p.panel} strokeWidth={5} transform={`rotate(${-20 + orbitRot * 0.05} ${hx} ${hy})`} />
            <ellipse cx={hx} cy={hy} rx={420} ry={130} fill="none" stroke={p.ink} strokeOpacity={0.5} strokeWidth={3} strokeDasharray="10 14" strokeDashoffset={-frame * 1.2} transform={`rotate(${36 - orbitRot * 0.04} ${hx} ${hy})`} />
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: hx - 280,
            top: hy - 280,
            width: 560,
            height: 560,
            opacity: clamp(heroIn * 1.4),
            translate: `0 ${mix(60, 0, heroIn) + Math.sin(frame / 34) * 6}px`,
            rotate: `${mix(6, -3, heroIn)}deg`,
          }}
        >
          {p.photo ? (
            <>
              <div style={{ position: 'absolute', inset: 0, translate: '24px 24px', borderRadius: 28, background: p.ink }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 28, overflow: 'hidden', border: `8px solid ${p.ink}`, background: p.tile }}>
                <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(mix(1.15, 1.03, prog(frame, HIT, end - HIT, ease.outSoft))) }} />
              </div>
            </>
          ) : (
            <Tile num={tiles[0]?.[0] ?? '31'} sym={tiles[0]?.[1] ?? 'Ga'} size={560} p={p} style={{ left: 0, top: 0 }} />
          )}
        </div>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g opacity={heroIn}>
            <Star x={hx - 330} y={hy - 300} r={mix(0, 46, prog(frame, HIT + 14, 26, ease.backOut))} fill={p.pop} rot={frame * 0.4} />
            <Star x={hx + 320} y={hy + 250} r={mix(0, 30, prog(frame, HIT + 20, 26, ease.backOut))} fill={p.pop} rot={-frame * 0.5} />
            <circle cx={hx + Math.cos((frame / 60) * Math.PI) * 420} cy={hy + Math.sin((frame / 60) * Math.PI) * 130} r={16} fill={p.panel} stroke={p.ink} strokeWidth={3} transform={`rotate(${-20 + orbitRot * 0.05} ${hx} ${hy})`} />
          </g>
        </svg>

        {/* location + CTA under the hero */}
        <div
          style={{
            position: 'absolute',
            left: hx - 330,
            width: 660,
            top: 830,
            textAlign: 'center',
            fontFamily: FONTS.mono,
            fontSize: 34,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            opacity: prog(frame, T.bars(2) + T.beats(3), 24),
          }}
        >
          {p.location}
        </div>
        <div style={{ position: 'absolute', left: hx - 400, width: 800, top: 900, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: FONTS.outfit,
              fontWeight: 800,
              fontSize: 46,
              padding: '18px 40px',
              borderRadius: 14,
              color: p.background,
              background: p.ink,
              boxShadow: `8px 8px 0 ${p.panel}`,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, T.bars(3), 24, ease.backOut)),
              opacity: clamp(prog(frame, T.bars(3), 8)),
            }}
          >
            {p.cta} →
          </div>
        </div>

        <Dust frame={frame} width={W} height={H} count={40} color={p.pop} seed={9} speed={0.7} opacity={0.5} />
      </AbsoluteFill>

      {/* downbeat flash, screen-blended */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 50%, ${hexA('#FFF6E4', flash * 0.9)} 0%, ${hexA(p.pop, flash * 0.5)} 30%, transparent 65%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.25} frame={frame} />
    </AbsoluteFill>
  );
}
