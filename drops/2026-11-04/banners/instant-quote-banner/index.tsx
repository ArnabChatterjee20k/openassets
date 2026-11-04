import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, hexA, iso, pts, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Instant Quote Banner',
  description:
    'Redbrick Works hero banner: a machined aluminium bracket drawn in isometric with a live toolpath, dimension callouts and an instant-quote chip, beside a big signage headline.',
  tags: ['hero', 'social', 'manufacturing', 'quote', 'cnc', 'factory'],
};

export const schema = z.object({
  eyebrow: text().default('Made in Dayton, Ohio'),
  headline: text().default('Parts in 72 hours.'),
  body: textarea().default('Upload a STEP file, get a price in seconds. Robot-tended 5-axis cells machine it overnight.'),
  cta: text('Button (empty to hide)').default('Upload a STEP file'),
  quoteLabel: text('Quote label').default('Quote RB-20417'),
  price: text('Price').default('$148.20'),
  quoteMeta: text('Quote details').default('25 pcs · 6061-T6 · ±0.01 mm'),
  readout: text('Readout chip (empty to hide)').default('X 42.180  Y -12.004  S 18000'),
  watermark: text('Big background word').default('72H'),
  background: color().default('#F1E4D3'),
  surface: color('Panels').default('#E5CDB2'),
  ink: color('Text').default('#3B1F14'),
  accent: color('Accent (toolpath, CTA)').default('#C8553D'),
  accent2: color('Machine enamel').default('#4F6D58'),
  pop: color('Spark').default('#F2A541'),
  metal: color('Part').default('#CFC4B6'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', pop: '#FFFFFF', metal: '#AFC6E8', eyebrow: 'Lights-out · 24/7', headline: 'We machine while you sleep.' },
  'mid-century': { background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C' },
  aerospace: { background: '#F2EBDD', surface: '#E4D9C4', ink: '#111111', accent: '#D9381E', accent2: '#1D4E9E', pop: '#F2B90F', eyebrow: 'ITAR registered · AS9100', headline: 'Flight parts, made here.', price: '$612.00', quoteMeta: '8 pcs · Ti-6Al-4V · ±0.005 mm', watermark: 'USA' },
  minimal: { body: '', readout: '', eyebrow: 'Redbrick Works', cta: 'Get a quote' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const C30 = Math.cos(Math.PI / 6);

/**
 * The hero: an L-bracket in isometric on a clay fixture plate, with a dashed
 * toolpath contour, the tool tip, bored holes and dimension callouts. Drawn in
 * a fixed 600×520 box and scaled to fit.
 */
function Part({ p }: { p: P }) {
  const U = 44;
  const S = (q: P3) => iso(q, U);
  const poly = (q: P3[]) => pts(q, U);
  const ink = p.ink;
  const line = { stroke: hexA(ink, 0.75), strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  const m = p.metal;
  // world: base plate 6×4×0.8, upright 6×0.9×3.4 at the back
  const box = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) => {
    const X = x + w;
    const Y = y + d;
    const Z = z + h;
    return (
      <g {...line}>
        <polygon points={poly([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]])} fill={shade(c, -0.22)} />
        <polygon points={poly([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]])} fill={shade(c, -0.08)} />
        <polygon points={poly([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]])} fill={shade(c, 0.18)} />
      </g>
    );
  };
  const hole = (x: number, y: number, z: number, r: number) => {
    const [cx, cy] = S([x, y, z]);
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={r * U * 1.2247} ry={r * U * 0.7071} fill={shade(m, -0.55)} stroke={hexA(ink, 0.8)} strokeWidth={1.4} />
        <ellipse cx={cx + r * U * 0.25} cy={cy + r * U * 0.18} rx={r * U * 0.9} ry={r * U * 0.45} fill={shade(m, -0.3)} />
      </g>
    );
  };
  // A bore in the upright's front face (plane y = 0.9): circle mapped into that plane.
  const [bx, by] = S([3, 0.9, 2.6]);
  const [tx, ty] = S([6.55, 4.55, 0]); // tool tip on the toolpath (front-right corner)
  const contour = poly([[-0.55, -0.55, 0], [6.55, -0.55, 0], [6.55, 4.55, 0], [-0.55, 4.55, 0]]);
  // Dimension line along the front-left edge (x axis at y = 5.6)
  const [d1x, d1y] = S([0, 5.7, 0]);
  const [d2x, d2y] = S([6, 5.7, 0]);
  const [h1x, h1y] = S([6, -0.2, 0.8]);
  const [h2x, h2y] = S([6, -0.2, 4.2]);
  return (
    <svg viewBox="-325 -255 720 600" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <filter id="iq-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <radialGradient id="iq-spark">
          <stop offset="0" stopColor={p.pop} stopOpacity="1" />
          <stop offset="0.4" stopColor={p.pop} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* fixture plate */}
      <polygon points={poly([[-1.6, -1.6, -0.5], [7.6, -1.6, -0.5], [7.6, 6.2, -0.5], [-1.6, 6.2, -0.5]])} transform="translate(14 22)" fill={hexA(ink, 0.22)} filter="url(#iq-blur)" />
      {box(-1.6, -1.6, -0.5, 9.2, 7.8, 0.5, p.surface)}
      {/* T-slots in the plate */}
      {[0.6, 2.6, 4.6].map((y) => (
        <polyline key={y} points={poly([[-1.4, y, 0.002], [7.4, y, 0.002]])} stroke={hexA(ink, 0.25)} strokeWidth={5} strokeLinecap="round" fill="none" />
      ))}
      {/* cast shadow of the part */}
      <polygon points={poly([[0, 4, 0], [6, 4, 0], [7.4, 5.4, 0], [1.4, 5.4, 0]])} fill={hexA(ink, 0.18)} filter="url(#iq-blur)" />
      {/* the toolpath contour + tool */}
      <polygon points={contour} fill="none" stroke={p.accent} strokeWidth={3} strokeDasharray="10 8" strokeLinejoin="round" />
      {box(0, 0, 0, 6, 4, 0.8, m)}
      {hole(1.4, 2.6, 0.8, 0.42)}
      {hole(4.6, 2.6, 0.8, 0.42)}
      {box(0, 0, 0.8, 6, 0.9, 3.4, m)}
      {/* fillet highlight along the inside edge */}
      <polyline points={poly([[0, 0.9, 0.82], [6, 0.9, 0.82]])} stroke={shade(m, 0.45)} strokeWidth={3} fill="none" />
      <g transform={`translate(${bx} ${by}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
        <circle r={0.85 * U} fill={shade(m, -0.5)} stroke={hexA(ink, 0.8)} strokeWidth={1.4} />
        <circle r={0.85 * U} fill="none" stroke={shade(m, 0.3)} strokeWidth={3} strokeDasharray={`${0.85 * U * 2.2} 400`} strokeDashoffset={-0.85 * U * 3.2} />
        <circle cx={6} cy={6} r={0.6 * U} fill={shade(m, -0.32)} />
      </g>
      {/* chamfer glints on the top edge */}
      <polyline points={poly([[0.05, 0.05, 4.2], [5.95, 0.05, 4.2]])} stroke={shade(m, 0.6)} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {/* tool tip with spark */}
      <circle cx={tx} cy={ty} r={46} fill="url(#iq-spark)" />
      <g stroke={p.pop} strokeWidth={2.4} strokeLinecap="round">
        {[-40, -10, 20, 200, 230].map((a, i) => {
          const r = (a * Math.PI) / 180;
          const l = 18 + (i % 2) * 10;
          return <line key={a} x1={tx + Math.cos(r) * 12} y1={ty + Math.sin(r) * 12} x2={tx + Math.cos(r) * (12 + l)} y2={ty + Math.sin(r) * (12 + l)} />;
        })}
      </g>
      <circle cx={tx} cy={ty} r={8} fill={p.pop} stroke={ink} strokeWidth={2} />
      {/* end mill coming down onto the tool tip */}
      <rect x={tx - 7} y={ty - 150} width={14} height={140} rx={3} fill={shade(m, -0.15)} stroke={hexA(ink, 0.8)} strokeWidth={1.4} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={tx - 7} y1={ty - 60 + i * 13} x2={tx + 7} y2={ty - 52 + i * 13} stroke={hexA(ink, 0.6)} strokeWidth={1.4} />
      ))}
      <rect x={tx - 22} y={ty - 200} width={44} height={56} rx={6} fill={p.accent2} stroke={hexA(ink, 0.8)} strokeWidth={1.4} />
      <rect x={tx - 22} y={ty - 168} width={44} height={6} fill={p.pop} />
      {/* dimensions */}
      <g stroke={ink} strokeWidth={1.4} fill="none" opacity={0.85}>
        <line x1={d1x} y1={d1y} x2={d2x} y2={d2y} />
        <line x1={d1x} y1={d1y - 9} x2={d1x} y2={d1y + 9} />
        <line x1={d2x} y1={d2y - 9} x2={d2x} y2={d2y + 9} />
        <line x1={h1x + 40} y1={h1y} x2={h2x + 40} y2={h2y} />
        <line x1={h1x + 32} y1={h1y} x2={h1x + 48} y2={h1y} />
        <line x1={h2x + 32} y1={h2y} x2={h2x + 48} y2={h2y} />
      </g>
      <g fontFamily={FONTS.vt323} fontSize={26} fill={ink}>
        <text x={(d1x + d2x) / 2 - 20} y={(d1y + d2y) / 2 + 34} transform={`rotate(30 ${(d1x + d2x) / 2} ${(d1y + d2y) / 2})`}>
          120.00 ±0.01
        </text>
        <text x={h1x + 54} y={(h1y + h2y) / 2 + 8}>
          68.00
        </text>
      </g>
    </svg>
  );
}

export default function InstantQuoteBanner(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.46 : 0.47);
  // Bungee is wide: size by the column so the longest word always fits.
  const longest = Math.max(...p.headline.split(' ').map((w) => w.length), 4);
  const head = Math.min(stacked ? W * 0.085 : H * (strip ? 0.19 : 0.12), (colW / (longest * 0.78)) * (strip ? 1 : 0.98));
  const small = Math.max(Math.min(head * 0.3, stacked ? W * 0.026 : H * 0.045), 13);

  // Hero area
  const heroW = stacked ? W * 0.84 : strip ? W * 0.3 : W * 0.44;
  const heroH = stacked ? H * 0.44 : H * (strip ? 0.92 : 0.8);
  const heroX = stacked ? (W - heroW) / 2 : W - pad * (strip ? 0.4 : 0.5) - heroW;
  const heroY = stacked ? H * 0.05 : (H - heroH) / 2;
  const chipScale = Math.min(heroW / 520, heroH / 420);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.12 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '234,242,255' : '59,31,20' }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,250,240,0.7)'}
        glows={[
          { x: heroX + heroW * 0.6, y: heroY + heroH * 0.55, size: Math.max(heroW, heroH) * 1.6, color: hexA(p.pop, dark ? 0.35 : 0.5), opacity: 0.8 },
          { x: stacked ? W * 0.1 : W * 0.05, y: H, size: Math.max(W, H) * 0.7, color: hexA(p.accent, 0.25), opacity: 0.7 },
        ]}
        grain={dark ? 0.06 : 0.05}
        vignette={dark ? 0.45 : 0.12}
      />

      {/* Huge outlined signage word behind the hero */}
      {p.watermark && (
        <div
          style={{
            position: 'absolute',
            right: stacked ? undefined : -heroH * 0.04,
            left: stacked ? 0 : undefined,
            width: stacked ? W : undefined,
            textAlign: stacked ? 'center' : 'right',
            top: stacked ? heroY + heroH * 0.02 : heroY - heroH * 0.12,
            fontFamily: FONTS.bungee,
            fontSize: Math.min(heroH * 0.62, (stacked ? W : heroW * 1.3) / (p.watermark.length * 0.8)),
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: `${Math.max(2, H * 0.003)}px ${hexA(p.accent, dark ? 0.45 : 0.35)}`,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {p.watermark}
        </div>
      )}

      <div style={{ position: 'absolute', left: heroX, top: heroY, width: heroW, height: heroH }}>
        <Part p={p} />
      </div>

      {/* Quote chip: anchored to the hero's right edge so long values can't overflow */}
      {!strip && (
        <div
          style={{
            position: 'absolute',
            right: W - (heroX + heroW) + heroW * 0.02,
            top: heroY + heroH * (stacked ? 0.02 : 0.04),
            transformOrigin: 'top right',
            scale: String(chipScale),
            padding: '16px 22px 18px',
            borderRadius: 14,
            background: dark ? hexA(p.surface, 0.95) : hexA('#FFFBF4', 0.92),
            border: `2px solid ${p.ink}`,
            boxShadow: `6px 6px 0 ${p.ink}`,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontFamily: FONTS.vt323, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.accent2, boxShadow: `0 0 0 3px ${hexA(p.accent2, 0.25)}` }} />
            {p.quoteLabel}
          </div>
          <div style={{ fontFamily: FONTS.bungee, fontSize: 52, lineHeight: 1.05, color: dark ? p.ink : p.accent, marginTop: 4 }}>
            {p.price}
            <span style={{ fontFamily: FONTS.vt323, fontSize: 26, color: p.ink, marginLeft: 8 }}>/EA</span>
          </div>
          <div style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 20, marginTop: 2 }}>{p.quoteMeta}</div>
        </div>
      )}

      {/* Readout chip, bottom-left of the hero */}
      {p.readout && !stacked && (
        <div
          style={{
            position: 'absolute',
            left: heroX + heroW * (strip ? 0 : 0.02),
            bottom: H - (heroY + heroH) + heroH * (strip ? 0.02 : 0.0),
            fontFamily: FONTS.vt323,
            fontSize: Math.max(small * 0.95, 14),
            letterSpacing: '0.08em',
            padding: `${small * 0.2}px ${small * 0.6}px`,
            borderRadius: small * 0.3,
            background: dark ? shade(p.background, -0.45) : p.ink,
            color: dark ? p.accent : p.pop,
            whiteSpace: 'nowrap',
          }}
        >
          {p.readout}
        </div>
      )}

      {/* Copy column */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: heroY + heroH + H * 0.03, textAlign: 'center' as const }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              fontFamily: FONTS.vt323,
              fontSize: small * 1.05,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: p.ink,
              borderBottom: `2px dashed ${p.accent}`,
              paddingBottom: small * 0.15,
            }}
          >
            <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop, boxShadow: `0 0 0 ${small * 0.15}px ${hexA(p.pop, 0.3)}` }} />
            {p.eyebrow}
          </span>
        </div>
        <div
          style={{
            fontFamily: FONTS.bungee,
            fontSize: head,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            marginTop: small * 0.7,
            color: dark ? p.ink : p.accent,
            textShadow: `${head * 0.045}px ${head * 0.045}px 0 ${dark ? hexA('#000000', 0.35) : p.ink}`,
          }}
        >
          {p.headline}
        </div>
        {!strip && p.body && (
          <div style={{ fontSize: small * 1.1, lineHeight: 1.4, marginTop: small * 0.9, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined, fontWeight: 500 }}>{p.body}</div>
        )}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.2}px`,
                borderRadius: small * 0.4,
                fontWeight: 800,
                fontSize: small * 0.95,
                color: dark ? p.background : '#FFF8EE',
                background: dark ? p.accent : p.ink,
                boxShadow: `${small * 0.25}px ${small * 0.25}px 0 ${dark ? hexA('#000000', 0.4) : p.accent}`,
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta} →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
