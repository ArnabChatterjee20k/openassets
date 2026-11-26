import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, num, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'First Pour Countdown',
  category: 'countdown',
  description:
    'Vertical countdown story to a first production pour: big condensed numerals tick down inside an enamel element tile while the furnace gauge climbs, then molten metal pours in, the tile goes LIVE and the date and CTA land.',
  tags: ['countdown', 'story', 'launch', 'foundry', 'materials'],
};

// 60 fps, 120 BPM: 1 beat = 30 frames. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Pilot plant · Line 1'),
  line1: text('Title line 1').default('First gallium'),
  line2: text('Title line 2').default('pour in'),
  lineAfter: text('Title line 2 after zero').default('pour day'),
  from: num(3, 9, 1, 'Count from').default(5),
  unit: text('Tile label').default('T-minus'),
  liveLabel: text('Tile label after zero').default('On air'),
  number: text('Atomic number').default('31'),
  gauge: text('Gauge label').default('Furnace'),
  gaugeValue: text('Gauge target').default('1,450 °C'),
  spec1: text('Spec row 1').default('MATERIAL · Ga 6N (99.9999%)'),
  spec2: text('Spec row 2').default('BATCH · 0001 · 40 kg'),
  live: text('Hit word').default('Live'),
  date: text().default('Dec 4 · 09:00 ET'),
  place: text().default('Youngstown, Ohio · livestream'),
  cta: text('Call to action').default('Watch the pour'),
  photo: image('Plant photo (optional)').default(''),
  background: color().default('#F4E9D8'),
  ink: color('Ink').default('#2E2A24'),
  molten: color('Molten').default('#D96C3D'),
  tile: color('Tile').default('#2C7873'),
  pop: color('Spark').default('#E9B44C'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { background: '#1F1B17', ink: '#F4E9D8', tile: '#2C7873', molten: '#F08A3C', pop: '#E9B44C' },
  germanium: { line1: 'First germanium', number: '32', tile: '#7A4E2D', molten: '#E9B44C', pop: '#D96C3D', spec1: 'MATERIAL · Ge 5N (99.999%)', gaugeValue: '1,020 °C' },
  nordic: { background: '#E9EEF1', ink: '#17242E', tile: '#2F6F8F', molten: '#E4572E', pop: '#A7C4D4', from: 3, number: '60', line1: 'Magnet line', line2: 'starts in', lineAfter: 'is running', spec1: 'ALLOY · Nd₂Fe₁₄B', live: 'On' },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255;
};

/** Counts a formatted number up: "1,450 °C" at t = 0.5 → "725 °C". */
function countUp(value: string, t: number) {
  const m = value.match(/[\d,.]+/);
  if (!m) return value;
  const target = parseFloat(m[0].replace(/,/g, ''));
  if (!Number.isFinite(target)) return value;
  const n = Math.round(target * t);
  return value.replace(m[0], m[0].includes(',') ? n.toLocaleString('en-US') : String(n));
}

export default function FirstPourCountdown(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const dark = lum(p.background) < 0.4;

  const COUNT_START = T.bars(1);
  // Two beats per number up to 5, one beat per number above that.
  const STEP = p.from <= 5 ? T.beats(2) : T.beat;
  const HIT = COUNT_START + STEP * p.from;
  const tileFg = lum(p.tile) > 0.55 ? p.ink : '#F4E9D8';
  const moltenFg = lum(p.molten) > 0.6 ? p.ink : '#F4E9D8';

  // Tile geometry.
  const S = 680;
  const tx = (W - S) / 2;
  const ty = 600;
  const tileIn = prog(frame, T.beats(1), 26, ease.backOut);

  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 34], [0, 1, 0], [ease.out, ease.outSoft]);
  const shake = frame >= HIT && frame < HIT + 16 ? Math.sin(frame * 2.1) * (1 - (frame - HIT) / 16) * 10 : 0;
  const push = mix(1, 1.05, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 24, 24, ease.in);

  // Countdown state.
  const idx = Math.floor((frame - COUNT_START) / STEP);
  const counting = frame >= COUNT_START && frame < HIT;
  const n = p.from - idx;
  const local = frame - (COUNT_START + idx * STEP);
  const gaugeT = prog(frame, COUNT_START - 10, HIT - COUNT_START + 10, ease.inOutSoft);

  // The pour: a molten ribbon falls into the tile, then the tile fills.
  const pour = prog(frame, HIT - 14, 16, ease.in);
  const pourOut = prog(frame, HIT + 30, 24, ease.out);
  const fill = prog(frame, HIT, 34, ease.out);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.15, size: 44, y: -frame * 0.15, color: dark ? '255,255,255' : '46,42,36' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,250,240,0.7)'}
        glows={[
          { x: W / 2, y: ty + S / 2, size: mix(900, 1700, gaugeT), color: hexA(p.molten, 0.3), opacity: 0.5 + gaugeT * 0.4 + 0.1 * Math.sin(frame / 30) },
          { x: W * 0.9, y: 120, size: 900, color: hexA(p.pop, 0.25), opacity: 0.7 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.22}
      />

      {/* Optional plant photo: duotone wash across the top, fading into paper. */}
      {p.photo && (
        <AbsoluteFill style={{ height: 1100, maskImage: 'linear-gradient(180deg, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(180deg, black 30%, transparent 100%)', opacity: 0.4 }}>
          <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.2)', mixBlendMode: dark ? 'screen' : 'multiply', scale: String(mix(1.12, 1, prog(frame, 0, end, ease.outSoft))) }} />
          <AbsoluteFill style={{ background: p.tile, mixBlendMode: dark ? 'multiply' : 'screen', opacity: 0.5 }} />
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.5}px`, opacity: 1 - outro }}>
        {/* molten ribbon pouring into the tile (behind the title so copy stays readable) */}
        {frame >= HIT - 14 && pourOut < 1 && (
          <div
            style={{
              position: 'absolute',
              left: W / 2 - 46 + pourOut * 46,
              width: 92 * (1 - pourOut),
              top: -40 + pourOut * (ty + 40),
              height: (ty + 60) * pour - pourOut * (ty + 40),
              borderRadius: 46,
              background: `linear-gradient(90deg, ${p.molten}, ${p.pop} 45%, ${p.molten})`,
              boxShadow: `0 0 60px ${hexA(p.pop, 0.8)}, 0 0 140px ${hexA(p.molten, 0.6)}`,
            }}
          />
        )}

        {/* ── Title ── */}
        <div style={{ position: 'absolute', left: 90, top: 150, display: 'flex', alignItems: 'center', gap: 20, fontFamily: FONTS.mono, fontSize: 34, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: prog(frame, 0, 24), translate: `${mix(-20, 0, prog(frame, 0, 30))}px 0` }}>
          <span style={{ width: 54, height: 6, background: p.molten }} />
          {p.eyebrow}
        </div>
        {[p.line1, frame >= HIT ? p.lineAfter : p.line2].map((l, i) => {
          const size = Math.max(p.line1.length, p.line2.length, p.lineAfter.length) > 13 ? 128 : 150;
          const style = { position: 'absolute' as const, left: 84, top: 210 + i * size * 0.9, ...displayFace('shoulders'), fontSize: size, lineHeight: 1, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, color: i === 1 && frame < HIT ? p.molten : p.ink };
          return (
            <div key={i}>
              <SweepReveal frame={frame} start={10 + i * 6} dur={32} style={style}>
                {l}
              </SweepReveal>
            </div>
          );
        })}

        {/* ── Tile ── */}
        <div style={{ position: 'absolute', left: tx, top: ty, width: S, height: S, scale: String(mix(0.6, 1, tileIn)), opacity: clamp(tileIn * 2), rotate: `${mix(-8, -2, tileIn)}deg` }}>
          <div style={{ position: 'absolute', inset: 0, translate: '30px 30px', borderRadius: 52, background: p.ink }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 52, overflow: 'hidden', background: `linear-gradient(160deg, ${hexA('#ffffff', 0.16)}, transparent 45%), ${p.tile}` }}>
            {/* molten fill rising from the bottom */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: `linear-gradient(180deg, ${p.pop} 0%, ${p.molten} 22%, ${p.molten} 100%)` }}>
              <svg width={S} height={30} style={{ position: 'absolute', top: -14, left: 0 }}>
                <path d={`M0 15 ${Array.from({ length: 9 }, (_, i) => `Q${i * 80 + 40} ${15 + Math.sin(frame / 6 + i) * 10} ${(i + 1) * 80} 15`).join(' ')} L${S} 30 L0 30Z`} fill={p.pop} />
              </svg>
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 52, boxShadow: `inset 0 0 0 14px ${hexA(fill > 0.5 ? moltenFg : tileFg, 0.85)}, inset 0 0 0 24px transparent` }} />
          <div style={{ position: 'absolute', inset: 30, borderRadius: 30, border: `4px solid ${hexA(fill > 0.5 ? moltenFg : tileFg, 0.45)}` }} />
          <div style={{ position: 'absolute', left: 64, top: 52, fontFamily: FONTS.mono, fontSize: 44, letterSpacing: '0.12em', textTransform: 'uppercase', color: fill > 0.5 ? moltenFg : tileFg }}>{fill > 0.5 ? p.liveLabel : p.unit}</div>
          <div style={{ position: 'absolute', right: 64, top: 52, fontFamily: FONTS.mono, fontSize: 44, color: fill > 0.5 ? moltenFg : tileFg }}>{p.number}</div>

          {/* countdown numerals */}
          {counting && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                paddingTop: 50,
                ...displayFace('shoulders'),
                fontSize: 520,
                lineHeight: 1,
                color: tileFg,
                scale: String(mix(1.25, 1, prog(local, 0, 12, ease.out)) * mix(1, 0.9, prog(local, STEP - 10, 10, ease.in))),
                opacity: clamp(prog(local, 0, 8)) * (1 - prog(local, STEP - 8, 8, ease.in)),
                filter: `blur(${mix(14, 0, prog(local, 0, 12, ease.out)) + prog(local, STEP - 8, 8, ease.in) * 12}px)`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {n}
            </div>
          )}
          {frame >= HIT && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                paddingTop: 40,
                ...displayFace('shoulders'),
                fontSize: p.live.length > 4 ? 220 : 300,
                lineHeight: 1,
                textTransform: 'uppercase',
                color: moltenFg,
                scale: String(mix(1.4, 1, prog(frame, HIT + 10, 24, ease.backOut))),
                opacity: prog(frame, HIT + 10, 10),
              }}
            >
              {p.live}
            </div>
          )}
        </div>

        {/* beat shockwaves: rounded squares starting outside the tile */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {Array.from({ length: p.from + 1 }, (_, i) => {
            const at = i < p.from ? COUNT_START + i * STEP : HIT;
            const r = prog(frame, at, 40, ease.out);
            if (frame < at || r >= 1) return null;
            const g = 20 + r * (i === p.from ? 240 : 120);
            return <rect key={i} x={tx - g} y={ty - g} width={S + 2 * g} height={S + 2 * g} rx={52 + g * 0.4} fill="none" stroke={i === p.from ? p.pop : p.molten} strokeWidth={mix(i === p.from ? 12 : 6, 1, r)} opacity={(1 - r) * 0.7} />;
          })}
        </svg>


        {/* sparks burst from the tile mouth with drag + terminal fall */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {frame >= HIT &&
            Array.from({ length: 34 }, (_, i) => {
              const t = (frame - HIT) / FPS;
              const a = -Math.PI / 2 + (rand(i * 3.3) - 0.5) * 2.6;
              const v = 900 + rand(i * 7.1) * 900;
              const k = 3.2;
              const d = (1 - Math.exp(-k * t)) / k;
              const x = W / 2 + Math.cos(a) * v * d;
              const y = ty + 10 + Math.sin(a) * v * d + 160 * t * t * 0.8 + 90 * t;
              const life = 1 - clamp(t / (1.4 + rand(i) * 0.8));
              if (life <= 0) return null;
              const s = 5 + rand(i * 2.2) * 9;
              return <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s} transform={`rotate(45 ${x} ${y})`} fill={i % 3 ? p.pop : p.molten} opacity={life} />;
            })}
        </svg>

        {/* ── Gauge (climbs during the count) ── */}
        <div style={{ position: 'absolute', left: 120, right: 120, top: 1390, opacity: prog(frame, T.beats(2), 24) * (1 - prog(frame, HIT + 6, 18, ease.in)), translate: `0 ${prog(frame, HIT + 6, 18, ease.in) * 30}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 40, letterSpacing: '0.26em', textTransform: 'uppercase' }}>{p.gauge}</span>
            <span style={{ ...displayFace('shoulders'), fontSize: 96, lineHeight: 1, color: p.molten, fontVariantNumeric: 'tabular-nums' }}>{countUp(p.gaugeValue, gaugeT)}</span>
          </div>
          <div style={{ position: 'relative', height: 30, marginTop: 18, borderRadius: 15, border: `4px solid ${p.ink}`, overflow: 'hidden', background: hexA(p.ink, 0.06) }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${gaugeT * 100}%`, background: `linear-gradient(90deg, ${p.pop}, ${p.molten})` }} />
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{ position: 'absolute', left: `${(i + 1) * 10}%`, top: 0, bottom: 0, width: 3, background: hexA(p.ink, 0.35) }} />
            ))}
          </div>
          {[p.spec1, p.spec2].map((s, i) => (
            <div key={i} style={{ marginTop: i ? 10 : 34, fontFamily: FONTS.mono, fontSize: 36, letterSpacing: '0.08em', opacity: prog(frame, T.beats(4 + i), 20) }}>
              {s}
            </div>
          ))}
        </div>

        {/* ── Reveal: date, place, CTA ── */}
        {frame >= HIT && (
          <>
            {(() => {
              const style = { position: 'absolute' as const, left: 0, width: W, top: 1400, textAlign: 'center' as const, ...displayFace('shoulders'), fontSize: p.date.length > 18 ? 110 : 132, lineHeight: 1, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const };
              return (
                <>
                  <SweepReveal frame={frame} start={HIT + 20} dur={30} style={style}>
                    {p.date}
                  </SweepReveal>
                  <Glint frame={frame} start={HIT + T.bars(1)} dur={44} style={style}>
                    {p.date}
                  </Glint>
                </>
              );
            })()}
            <div style={{ position: 'absolute', width: W, top: 1556, textAlign: 'center', fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 50, opacity: prog(frame, HIT + 36, 20), translate: `0 ${mix(20, 0, prog(frame, HIT + 36, 24))}px` }}>{p.place}</div>
            <div style={{ position: 'absolute', width: W, top: 1660, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  fontFamily: FONTS.outfit,
                  fontWeight: 800,
                  fontSize: 52,
                  padding: '22px 48px',
                  borderRadius: 16,
                  color: p.background,
                  background: p.ink,
                  boxShadow: `10px 10px 0 ${p.molten}`,
                  scale: String(prog(frame, HIT + T.beats(2), 24, ease.backOut)),
                  opacity: clamp(prog(frame, HIT + T.beats(2), 8)),
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </div>
            </div>
          </>
        )}

        <Dust frame={frame} width={W} height={H} count={46} color={p.pop} seed={4} speed={mix(0.5, 1.4, gaugeT)} opacity={0.5} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${hexA('#FFF6E4', flash)} 0%, ${hexA(p.pop, flash * 0.6)} 26%, transparent 62%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.45 : 0.22} frame={frame} />
    </AbsoluteFill>
  );
}
