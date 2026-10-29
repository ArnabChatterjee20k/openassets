import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, shade } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Launch Day',
  description: "openfeed launch banner: juicy 70s headline beside a fanned stack of daily pages (real article rows, scores, day tabs) rising out of sunrise-stripe arches.",
  tags: ['launch', 'hero', 'social', 'reading', 'feed', 'openfeed'],
};

export const schema = z.object({
  eyebrow: text().default('openfeed 1.0 · Now open'),
  headline: text('Headline line 1').default('Your reading,'),
  headline2: text('Headline line 2 (accent)').default('kept daily.'),
  body: textarea().default('One calm page a day from the sources you keep — gathered, scored and distilled. Nothing to keep up with.'),
  cta: text('Button (empty to hide)').default('Start your feed — free'),
  url: text('Link').default('github.com/ArnabChatterjee20k/openfeed'),
  date: text('Today tab').default('Fri 30 Oct'),
  stat: text('Stat chip (empty to hide)').default('214 read → 9 kept'),
  font: font('Headline font').default('shrikhand'),
  background: color().default('#EEF1E6'),
  surface: color('Card paper').default('#FAF9F2'),
  textColor: color('Ink').default('#1E2A1A'),
  accent: color().default('#6A8D3A'),
  accent2: color('Second stripe').default('#C9A227'),
  pop: color('Outer stripe / today').default('#E85D3F'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  terracotta: { background: '#F1E4D3', surface: '#FBF5EC', textColor: '#3B1F14', accent: '#C8553D', accent2: '#F2A541', pop: '#4F6D58' },
  'mid-century': { font: 'fraunces', background: '#F4E9D8', surface: '#FFFAF0', textColor: '#2E2A24', accent: '#2C7873', accent2: '#E9B44C', pop: '#D96C3D', headline: 'Read slowly.', headline2: 'Keep everything.' },
  'forest-night': { background: '#0E1A14', surface: '#EAF2DC', textColor: '#EAF2DC', accent: '#B5E550', accent2: '#4E8A5B', pop: '#FF9F43' },
  riso: { font: 'youngserif', background: '#F4EFE6', surface: '#FFFDF7', textColor: '#1F2A6B', accent: '#FF48B0', accent2: '#0078BF', pop: '#FFE800', eyebrow: 'Launching today', stat: '' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const ROWS = [
  { src: 'Stratechery', title: 'The slow web is having a moment', score: '0.94' },
  { src: 'Paul Graham', title: 'How to do great work', score: '0.91' },
  { src: 'Ars Technica', title: 'Inside the 20-year battery', score: '0.88' },
];

/** Sunrise stripes: three nested arches with legs to the bottom edge. */
function Stripes({ cx, cy, r, band, end, p }: { cx: number; cy: number; r: number; band: number; end: number; p: P }) {
  const cols = [p.pop, p.accent2, p.accent];
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
      {cols.map((c, i) => {
        const R = r - i * band - band / 2;
        return <path key={i} d={`M${cx - R},${end} L${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy} L${cx + R},${end}`} fill="none" stroke={c} strokeWidth={band * 0.98} strokeLinecap="round" />;
      })}
    </svg>
  );
}

/** One daily page. `full` shows article rows; back pages are quieter. */
function Card({ x, y, w, h, rot, p, day, rows, full, today }: { x: number; y: number; w: number; h: number; rot: number; p: P; day: string; rows: number; full: boolean; today?: boolean }) {
  const u = w / 100; // card unit
  const ink = isDark(p.surface) ? '#F4F1E8' : p.textColor === p.surface ? '#1E2A1A' : isDark(p.textColor) ? p.textColor : '#1E2A1A';
  const muted = hexA(ink, 0.5);
  const wrap: CSSProperties = {
    position: 'absolute',
    left: x - w / 2,
    top: y - h / 2,
    width: w,
    height: h,
    rotate: `${rot}deg`,
    background: full ? p.surface : shade(p.surface, -0.04),
    borderRadius: u * 5,
    border: `${Math.max(1.5, u * 0.45)}px solid ${ink}`,
    boxShadow: `${u * 2.2}px ${u * 2.6}px 0 ${hexA(ink, full ? 0.92 : 0.5)}`,
    padding: u * 6,
    boxSizing: 'border-box',
    overflow: 'hidden',
    color: ink,
  };
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: u * 1.6, padding: `${u * 1.2}px ${u * 3}px`, borderRadius: 999, background: today ? p.accent : hexA(ink, 0.08), color: today ? p.surface : ink, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: u * 3.6, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {today && <span style={{ width: u * 2.2, height: u * 2.2, borderRadius: '50%', background: p.pop }} />}
          {day}
        </span>
        {full && <span style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: u * 3.4, color: muted, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>9 worth reading</span>}
      </div>
      <div style={{ fontFamily: FONTS.fraunces, fontWeight: 900, fontSize: u * 8.2, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: u * 4.5 }}>{full ? "Today's page" : 'Yesterday'}</div>
      {full ? (
        ROWS.slice(0, rows).map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: u * 3.5, alignItems: 'center', marginTop: u * 4.5, paddingTop: u * 4, borderTop: `${Math.max(1, u * 0.3)}px dashed ${hexA(ink, 0.22)}` }}>
            <div style={{ width: u * 13, height: u * 13, flex: 'none', borderRadius: u * 2.5, background: [p.accent, p.accent2, p.pop][i], position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: '18%', right: '18%', bottom: '-30%', height: '70%', borderRadius: '50% 50% 0 0', border: `${u * 1.4}px solid ${hexA('#ffffff', 0.55)}` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: u * 3, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted }}>{r.src}</div>
              <div style={{ fontFamily: FONTS.fraunces, fontWeight: 600, fontSize: u * 4.8, lineHeight: 1.15, marginTop: u * 0.8 }}>{r.title}</div>
            </div>
            <span style={{ flex: 'none', fontFamily: FONTS.outfit, fontWeight: 800, fontSize: u * 3.2, padding: `${u * 0.8}px ${u * 2}px`, borderRadius: 999, border: `${Math.max(1, u * 0.35)}px solid ${ink}` }}>{r.score}</span>
          </div>
        ))
      ) : (
        <div style={{ marginTop: u * 5 }}>
          {[92, 70, 84, 60, 88, 52].map((wd, i) => (
            <div key={i} style={{ height: u * 2.6, width: `${wd}%`, borderRadius: 99, background: hexA(ink, i % 3 === 0 ? 0.3 : 0.14), marginTop: u * 3.4 }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LaunchDay(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.46 : 0.44);
  // Shrink for long lines so the headline never runs into the hero.
  const longest = Math.max(p.headline.length, p.headline2.length, 13);
  const baseHead = Math.min(stacked ? W * 0.088 : H * (strip ? 0.16 : 0.118), colW * (strip ? 0.09 : 0.112));
  const head = baseHead * (13 / longest);
  const small = Math.max(baseHead * 0.3, 13);

  // Hero: card size from the space available, then stripes from the card.
  const rows = strip ? 1 : 3;
  const ratio = rows === 3 ? 1.1 : 0.62;
  const cw = stacked ? Math.min(W * 0.44, (H * 0.44) / ratio) : Math.min(W * (strip ? 0.2 : 0.3), (H * (strip ? 0.82 : 0.7)) / ratio);
  const ch = cw * ratio;
  // Wide: the arch crops off the right edge, and never reaches the copy column.
  const hx = stacked ? W / 2 : W - pad - cw * (strip ? 0.9 : 0.6);
  const hy = stacked ? H * 0.29 : H / 2 + (strip ? H * 0.02 : 0);
  const R = stacked ? cw * 1.0 : Math.min(cw * 1.0, hx - (pad + colW * 0.92));
  const band = Math.min(cw * 0.15, R * 0.17);
  const sy = hy + ch * 0.1;
  const legEnd = stacked ? hy + ch * 0.62 : H + 10;
  const ink = p.textColor;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: ink, fontFamily: FONTS.fraunces }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 22), color: dark ? '255,255,255' : '30,42,26' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'}
        glows={[{ x: hx, y: sy, size: R * 3.2, color: hexA(p.accent2, dark ? 0.25 : 0.3), opacity: 0.8 }]}
        grain={0.05}
        vignette={dark ? 0.45 : 0.06}
      />

      <Stripes cx={hx} cy={sy} r={R} band={band} end={legEnd} p={p} />
      {/* Sun disc peeking above the stack */}
      <div style={{ position: 'absolute', left: hx - R * 0.5, top: sy - R * 0.5, width: R, height: R, borderRadius: '50%', background: `radial-gradient(circle, ${hexA('#FFF6D8', 0.9)} 0%, ${hexA(p.accent2, 0.0)} 70%)` }} />

      <Card x={hx - cw * 0.22} y={hy + ch * 0.04} w={cw} h={ch} rot={-9} p={p} day="Wed 28 Oct" rows={rows} full={false} />
      <Card x={hx + cw * 0.2} y={hy + ch * 0.02} w={cw} h={ch} rot={6} p={p} day="Thu 29 Oct" rows={rows} full={false} />
      <Card x={hx} y={hy} w={cw} h={ch} rot={-1.5} p={p} day={p.date} rows={rows} full today />

      {p.stat && (
        <div
          style={{
            position: 'absolute',
            ...(stacked ? { right: pad * 0.6, top: hy - ch * 0.5 - small * 0.4 } : { right: Math.max(pad * 0.5, W - (hx + cw * 0.5) - small * 4), top: hy + ch * 0.5 - small * 1.1 }),
            display: 'flex',
            alignItems: 'center',
            gap: small * 0.5,
            padding: `${small * 0.55}px ${small * 0.95}px`,
            borderRadius: 999,
            background: p.pop,
            color: '#FFF8EE',
            fontFamily: FONTS.outfit,
            fontWeight: 800,
            fontSize: small * (strip ? 0.85 : 0.95),
            whiteSpace: 'nowrap',
            rotate: '-4deg',
            boxShadow: `${small * 0.18}px ${small * 0.22}px 0 ${dark ? '#000000' : ink}`,
          }}
        >
          {p.stat}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.58, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: small * 0.5, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: small * 0.82, letterSpacing: '0.24em', textTransform: 'uppercase', color: ink }}>
            <span style={{ display: 'inline-flex', gap: small * 0.12 }}>
              {[p.accent, p.accent2, p.pop].map((c) => (
                <span key={c} style={{ width: small * 0.32, height: small * 1.05, borderRadius: 99, background: c }} />
              ))}
            </span>
            {p.eyebrow}
          </span>
        </div>
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 1.0, letterSpacing: '-0.01em', marginTop: small * 0.75, textShadow: `${head * 0.045}px ${head * 0.05}px 0 ${p.accent2}` }}>
          <div style={{ whiteSpace: 'nowrap' }}>{p.headline}</div>
          <div style={{ whiteSpace: 'nowrap', color: p.accent, textShadow: `${head * 0.045}px ${head * 0.05}px 0 ${dark ? '#000000' : ink}` }}>{p.headline2}</div>
        </div>
        {!strip && (
          <div style={{ fontFamily: FONTS.fraunces, fontWeight: 300, fontSize: small * 1.12, lineHeight: 1.42, marginTop: small * 0.9, maxWidth: colW * 0.88, marginInline: stacked ? 'auto' : undefined }}>
            {p.body}
          </div>
        )}
        {p.cta && (
          <div style={{ display: 'flex', flexDirection: stacked ? 'row' : 'column', alignItems: stacked ? 'center' : 'flex-start', gap: small * (stacked ? 0.9 : 0.6), justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.8 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.2}px`,
                borderRadius: 999,
                fontFamily: FONTS.outfit,
                fontWeight: 800,
                fontSize: small * 0.95,
                color: dark ? p.background : '#FAF9F2',
                background: dark ? p.accent : ink,
                boxShadow: `${small * 0.18}px ${small * 0.22}px 0 ${p.accent}`,
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta} →
            </span>
            {!strip && p.url && <span style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: small * 0.78, opacity: 0.75, whiteSpace: 'nowrap' }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
