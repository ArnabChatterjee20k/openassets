import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'openfeed Is Open',
  category: 'announcement',
  description:
    'Vertical launch announcement: 70s sunrise stripes sweep up, the product name pops in juicy and wobbles to rest, a launch stamp spins, three daily pages deal in on beats and the CTA lands.',
  tags: ['announcement', 'launch', 'story', 'vertical', 'reading', 'openfeed'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Launching today'),
  product: text('Product name').default('openfeed'),
  headline2: text('Second line').default('is open.'),
  body: textarea().default('A calm daily archive of everything worth reading, from the sources you keep.'),
  stamp: text('Stamp text').default('LAUNCH DAY · 30 OCT 2026 · '),
  date: text('Today tab').default('Fri 30 Oct'),
  cta: text('Call to action').default('github.com/ArnabChatterjee20k/openfeed'),
  footnote: text().default('Free & open source · FeedX · Scout · domdistill'),
  font: font('Display font').default('shrikhand'),
  background: color().default('#EEF1E6'),
  surface: color('Card paper').default('#FAF9F2'),
  textColor: color('Ink').default('#1E2A1A'),
  accent: color().default('#6A8D3A'),
  accent2: color('Second color').default('#C9A227'),
  pop: color('Pop').default('#E85D3F'),
  screenshot: image('App screenshot (optional, shown on the front page)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'forest-night': { background: '#0E1A14', surface: '#EAF2DC', textColor: '#EAF2DC', accent: '#B5E550', accent2: '#4E8A5B', pop: '#FF9F43' },
  'mid-century': { font: 'fraunces', background: '#F4E9D8', surface: '#FFFAF0', textColor: '#2E2A24', accent: '#2C7873', accent2: '#E9B44C', pop: '#D96C3D' },
  sorbet: { background: '#FFEDE1', surface: '#FFF8F3', textColor: '#3D0E2A', accent: '#FF4F6D', accent2: '#FFB627', pop: '#7B2CBF', headline2: 'is here.' },
};

type P = z.infer<typeof schema>;

const W = 1080;
const H = 1920;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const ROWS = [
  { src: 'Stratechery', title: 'The slow web is having a moment' },
  { src: 'Paul Graham', title: 'How to do great work' },
  { src: 'Ars Technica', title: 'Inside the 20-year battery' },
];

function DayCard({ p, ink, day, title, rows, shot, style }: { p: P; ink: string; day: string; title: string; rows: number; shot?: string; style: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', boxSizing: 'border-box', padding: 34, borderRadius: 30, background: p.surface, color: ink, border: `4px solid ${ink}`, overflow: 'hidden', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 999, background: rows ? p.accent : hexA(ink, 0.08), color: rows ? p.surface : ink, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 24, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {rows > 0 && <span style={{ width: 13, height: 13, borderRadius: '50%', background: p.pop }} />}
          {day}
        </span>
        {rows > 0 && <span style={{ fontFamily: FONTS.outfit, fontSize: 22, opacity: 0.55 }}>9 worth reading</span>}
      </div>
      <div style={{ fontFamily: FONTS.fraunces, fontWeight: 900, fontSize: 50, letterSpacing: '-0.02em', marginTop: 20 }}>{title}</div>
      {shot ? (
        <Img src={shot} style={{ marginTop: 18, width: '100%', height: 300, objectFit: 'cover', borderRadius: 16, border: `2px solid ${hexA(ink, 0.2)}` }} />
      ) : rows ? (
        ROWS.slice(0, rows).map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 18, paddingTop: 18, borderTop: `2px dashed ${hexA(ink, 0.22)}` }}>
            <div style={{ width: 66, height: 66, flex: 'none', borderRadius: 14, background: [p.accent, p.accent2, p.pop][i] }} />
            <div>
              <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 18, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 }}>{r.src}</div>
              <div style={{ fontFamily: FONTS.fraunces, fontWeight: 600, fontSize: 32, lineHeight: 1.15, marginTop: 4 }}>{r.title}</div>
            </div>
          </div>
        ))
      ) : (
        [92, 70, 84, 60, 88].map((w, i) => <div key={i} style={{ height: 16, width: `${w}%`, borderRadius: 16, background: hexA(ink, i % 3 === 0 ? 0.3 : 0.14), marginTop: 24 }} />)
      )}
    </div>
  );
}

/** Rotating circular stamp, set on an SVG textPath. */
function Stamp({ frame, at, p, ink }: { frame: number; at: number; p: P; ink: string }) {
  const s = prog(frame, at, 30, ease.backOut);
  const r = 96;
  return (
    <svg width={260} height={260} viewBox="-130 -130 260 260" style={{ position: 'absolute', left: W - 60 - 240, top: 96, scale: String(s * 0.86), rotate: `${-20 + frame * 0.35}deg`, overflow: 'visible' }}>
      <circle r={124} fill={p.accent2} stroke={ink} strokeWidth={4} />
      <circle r={74} fill="none" stroke={ink} strokeWidth={2} strokeDasharray="3 7" />
      <defs>
        <path id="stamp-ring" d={`M0,${-r} A${r},${r} 0 1 1 -0.01,${-r}`} />
      </defs>
      <text fontFamily={FONTS.outfit} fontWeight={800} fontSize={21} letterSpacing={3.2} fill={ink}>
        <textPath href="#stamp-ring">{p.stamp + p.stamp}</textPath>
      </text>
      {/* Mini sunrise: three nested arcs */}
      {[p.pop, p.surface, p.accent].map((c, i) => {
        const rr = 46 - i * 14;
        return <path key={i} d={`M${-rr},26 A${rr},${rr} 0 0 1 ${rr},26`} fill="none" stroke={c} strokeWidth={13} />;
      })}
    </svg>
  );
}

export default function OpenfeedIsOpen(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const ink = isDark(p.surface) ? '#F4F1E8' : isDark(p.textColor) ? p.textColor : '#1E2A1A';
  const shadow = dark ? '#000000' : p.accent2;

  const HIT = T.beats(2);
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 28], [0, 1, 0], [ease.out, ease.outSoft]);
  const ring = prog(frame, HIT, 50, ease.out);
  const outro = prog(frame, end - 36, 36, ease.inOut);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));

  // Title: pops on the hit, wobbles to rest (juicy 70s energy).
  const TITLE = Math.min(176, 900 / (Math.max(6, p.product.length) * 0.68));
  const pop = prog(frame, HIT, 22, ease.backOut);
  const wob = keys(frame, [HIT, HIT + 10, HIT + 20, HIT + 32, HIT + 46], [-9, 5, -3, 1, 0], ease.inOutSoft);
  const titleY = 400;
  const titleStyle: CSSProperties = { position: 'absolute', left: 0, width: W, top: titleY, textAlign: 'center', ...displayFace(p.font), fontSize: TITLE, lineHeight: 1.1, whiteSpace: 'nowrap', letterSpacing: '-0.01em' };

  // Sunrise stripes sweep up from the bottom over the first two beats.
  const sx = W / 2;
  const sy = 1340;
  const R = 440;
  const band = 82;

  const cardW = 640;
  const cardH = 510;
  const cy = 1140;
  const deal = (k: number) => prog(frame, T.bars(1) + T.beats(1) + k * 14, 34, ease.out);
  const bob = Math.sin(frame / 36) * 6;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 44, y: -frame * 0.15, color: dark ? '255,255,255' : '30,42,26' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: sx, y: sy - 200, size: 1500, color: hexA(p.accent2, dark ? 0.25 : 0.32), opacity: 0.6 + 0.25 * Math.sin(frame / 40) },
          { x: 100, y: 200, size: 1000, color: hexA(p.accent, dark ? 0.2 : 0.16), opacity: 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />
      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={46} color={dark ? p.accent : p.accent2} seed={9} speed={0.8} opacity={0.45} />

        {/* Sun + stripes */}
        <div style={{ position: 'absolute', left: sx - 300, top: sy - 560, width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${hexA('#FFF6D8', 0.9)} 0%, transparent 65%)`, translate: `0 ${mix(400, 0, prog(frame, 0, 90, ease.out))}px`, opacity: 0.9 }} />
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          {[p.pop, p.accent2, p.accent].map((c, i) => {
            const r = R - i * band - band / 2;
            const t = prog(frame, 4 + i * 7, 56, ease.out);
            const y = sy + mix(1100, 0, t);
            return <path key={i} d={`M${sx - r},${H + 20} L${sx - r},${y} A${r},${r} 0 0 1 ${sx + r},${y} L${sx + r},${H + 20}`} fill="none" stroke={c} strokeWidth={band * 0.98} />;
          })}
          {frame >= HIT && <circle cx={W / 2} cy={titleY + TITLE * 0.55} r={420 + ring * 380} fill="none" stroke={p.pop} strokeWidth={mix(8, 1, ring)} opacity={(1 - ring) * 0.6} />}
        </svg>

        {/* Eyebrow */}
        <div style={{ position: 'absolute', left: 90, top: 236, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 32, letterSpacing: '0.28em', textTransform: 'uppercase', color: p.textColor, opacity: prog(frame, 10, 24), translate: `${mix(-30, 0, prog(frame, 10, 30))}px 0` }}>
          <span style={{ display: 'inline-flex', gap: 5 }}>
            {[p.accent, p.accent2, p.pop].map((c) => (
              <span key={c} style={{ width: 10, height: 32, borderRadius: 10, background: c }} />
            ))}
          </span>
          {p.eyebrow}
        </div>
        <Stamp frame={frame} at={T.beats(4)} p={p} ink={ink} />

        {/* Title */}
        {frame >= HIT - 1 && (
          <div style={{ ...titleStyle, color: p.textColor, textShadow: `7px 8px 0 ${shadow}`, scale: String(mix(0.3, 1, pop)), rotate: `${wob}deg`, opacity: clamp(pop * 3) }}>{p.product}</div>
        )}
        <Glint frame={frame} start={T.bars(3)} dur={44} style={{ ...titleStyle, textShadow: 'none' }}>
          {p.product}
        </Glint>
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: W,
            top: titleY + TITLE * 1.12,
            textAlign: 'center',
            fontFamily: FONTS.fraunces,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 124,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: p.accent,
            opacity: prog(frame, HIT + T.beat, 16),
            translate: `0 ${mix(50, 0, prog(frame, HIT + T.beat, 30, ease.out))}px`,
            filter: `blur(${mix(14, 0, prog(frame, HIT + T.beat, 24))}px)`,
          }}
        >
          {p.headline2}
        </div>
        <WordsIn
          text={p.body}
          frame={frame}
          start={HIT + T.beats(1.5)}
          style={{ position: 'absolute', left: 110, width: W - 220, top: titleY + TITLE * 1.12 + 160, justifyContent: 'center', textAlign: 'center', fontFamily: FONTS.fraunces, fontWeight: 400, fontSize: 46, lineHeight: 1.3, color: hexA(p.textColor, 0.88) }}
        />

        {/* Daily pages deal in on beats */}
        <DayCard p={p} ink={ink} day="Wed 28 Oct" title="Wednesday" rows={0} style={{ left: W / 2 - cardW / 2 - 60, top: cy + 30 + bob * 0.5, width: cardW, height: cardH, boxShadow: `8px 10px 0 ${hexA(ink, 0.5)}`, rotate: `${mix(-30, -8, deal(0))}deg`, translate: `${mix(-900, 0, deal(0))}px 0`, opacity: clamp(deal(0) * 2) }} />
        <DayCard p={p} ink={ink} day="Thu 29 Oct" title="Thursday" rows={0} style={{ left: W / 2 - cardW / 2 + 60, top: cy + 20 + bob * 0.7, width: cardW, height: cardH, boxShadow: `8px 10px 0 ${hexA(ink, 0.5)}`, rotate: `${mix(30, 6, deal(1))}deg`, translate: `${mix(900, 0, deal(1))}px 0`, opacity: clamp(deal(1) * 2) }} />
        <DayCard p={p} ink={ink} day={p.date} title="Today’s page" rows={3} shot={p.screenshot || undefined} style={{ left: W / 2 - cardW / 2, top: cy + bob, width: cardW, height: cardH, boxShadow: `14px 16px 0 ${ink}`, rotate: `${mix(-14, -1.5, deal(2))}deg`, translate: `0 ${mix(1000, 0, deal(2))}px` }} />
        <div style={{ position: 'absolute', right: 70, top: cy - 44 + bob, padding: '16px 28px', borderRadius: 999, background: p.pop, color: '#FFF8EE', fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 34, whiteSpace: 'nowrap', rotate: '6deg', boxShadow: `5px 6px 0 ${ink}`, scale: String(prog(frame, T.bars(3), 24, ease.backOut)) }}>
          214 read → 9 kept
        </div>

        {/* CTA */}
        <div style={{ position: 'absolute', left: 0, width: W, top: 1706, display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '22px 36px', borderRadius: 999, background: dark ? p.accent : p.textColor, color: dark ? p.background : p.surface, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 34, whiteSpace: 'nowrap', boxShadow: `6px 7px 0 ${dark ? '#000000' : p.accent}`, scale: String(prog(frame, T.bars(2) + T.beats(2), 26, ease.backOut)) }}>
            {p.cta} →
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, width: W, top: 1796, textAlign: 'center', fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 24, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.textColor, opacity: prog(frame, T.bars(2) + T.beats(3), 24) }}>
          <span style={{ padding: '8px 18px', borderRadius: 999, background: hexA(p.background, 0.85) }}>{p.footnote}</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 22%, ${hexA('#FFF6D8', flash * 0.6)} 0%, ${hexA(p.accent2, flash * 0.3)} 30%, transparent 65%)`, mixBlendMode: dark ? 'screen' : 'normal' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.35 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
