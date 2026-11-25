import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Shot Day, Sorted',
  description: 'App Store / social banner for Satiate: a chrome weekly dose dial with shot day glowing, a jelly dose capsule and glass habit chips beside a wide art-school headline.',
  tags: ['hero', 'social', 'app store', 'health', 'glp-1'],
};

export const schema = z.object({
  eyebrow: text().default('satiate · glp-1 companion'),
  headline: text().default('Shot day, sorted.'),
  body: textarea().default('Log every dose, spot side effects early and build the protein, water and step habits that make it work.'),
  cta: text('Button (empty to hide)').default('Get Satiate free'),
  dose: text('Dose in the dial').default('2.5 mg'),
  doseNote: text('Under the dose').default('thu · shot day'),
  shotDay: num(0, 6, 1, 'Shot day (0 = Mon)').default(3),
  chip1: text('Chip 1').default('water 1.8 / 2.5 l'),
  chip2: text('Chip 2').default('nausea: mild, easing'),
  font: font('Headline font').default('syne'),
  background: color().default('#DADDE3'),
  surface: color('Chrome').default('#C3C8D1'),
  accent: color().default('#3D5AFE'),
  pop: color('Pop').default('#FF3DB4'),
  textColor: color('Text').default('#101219'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lilac: { background: '#E9E3F5', surface: '#D6CCEC', accent: '#5E4AE3', pop: '#2EC4B6', textColor: '#231942' },
  sorbet: { background: '#FFEDE1', surface: '#FFD3C2', accent: '#FF4F6D', pop: '#7B2CBF', textColor: '#3D0E2A', headline: 'Week one, handled.', dose: '0.25 mg', doseNote: 'mon · week 1', shotDay: 0},
  midnight: { background: '#0D0D0F', surface: '#3A3A42', accent: '#C9A45C', pop: '#E8D9B5', textColor: '#F3EDE2', font: 'bricolage', headline: 'Your weekly ritual.' },
  minimal: { chip1: '', chip2: '', cta: '', eyebrow: 'satiate' },
};

type P = z.infer<typeof schema> & BannerSize;

const DAYS = ['m', 't', 'w', 't', 'f', 's', 's'];

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Point on a circle, angle in degrees clockwise from 12 o'clock. */
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
};
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`;
};

/** The weekly dose dial: chrome bezel, 7 day segments, shot day glowing, a jelly capsule in the middle. */
function Dial({ cx, cy, r, p, labels }: { cx: number; cy: number; r: number; p: P; labels: boolean }) {
  const dark = isDark(p.background);
  const shot = Math.max(0, Math.min(6, Math.round(p.shotDay)));
  const seg = 360 / 7;
  // Rotate the week so shot day always sits at about 1:30, the dial's "hot" corner.
  const rot = 62 - (shot + 0.5) * seg;
  const track = r * 0.78;
  const sw = r * 0.15;
  const ink = p.textColor;
  return (
    <>
      <div style={{ position: 'absolute', left: cx - r * 1.9, top: cy - r * 1.9, width: r * 3.8, height: r * 3.8, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent, dark ? 0.35 : 0.22)} 0%, transparent 62%)` }} />
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        <defs>
          <linearGradient id="sd-chrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.28" stopColor={p.surface} />
            <stop offset="0.5" stopColor="#F4F6FA" />
            <stop offset="0.72" stopColor={hexA(ink, 0.45)} />
            <stop offset="1" stopColor={p.surface} />
          </linearGradient>
          <radialGradient id="sd-face" cx="0.4" cy="0.3" r="0.8">
            <stop offset="0" stopColor={dark ? '#2A2A30' : '#F7F8FB'} />
            <stop offset="1" stopColor={dark ? '#141418' : p.surface} />
          </radialGradient>
          <linearGradient id="sd-jelly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.45" stopColor={p.accent} stopOpacity="1" />
            <stop offset="1" stopColor={p.accent} />
          </linearGradient>
          <filter id="sd-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={r * 0.05} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* drop shadow + chrome bezel + face */}
        <ellipse cx={cx + r * 0.08} cy={cy + r * 1.08} rx={r * 0.85} ry={r * 0.1} fill={hexA('#000000', dark ? 0.5 : 0.16)} style={{ filter: `blur(${r * 0.06}px)` }} />
        <circle cx={cx} cy={cy} r={r} fill="url(#sd-chrome)" />
        <circle cx={cx} cy={cy} r={r * 0.94} fill="url(#sd-face)" stroke={hexA(ink, 0.25)} strokeWidth={Math.max(1, r * 0.006)} />
        {/* bezel ticks */}
        {Array.from({ length: 56 }, (_, i) => {
          const [x0, y0] = polar(cx, cy, r * 0.9, (i / 56) * 360);
          const [x1, y1] = polar(cx, cy, r * (i % 8 === 0 ? 0.86 : 0.88), (i / 56) * 360);
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={hexA(ink, 0.35)} strokeWidth={Math.max(1, r * 0.006)} />;
        })}
        {/* day segments */}
        {DAYS.map((_, i) => {
          const a0 = rot + i * seg + 3;
          const a1 = rot + (i + 1) * seg - 3;
          const done = i < shot;
          const isShot = i === shot;
          return (
            <path
              key={i}
              d={arc(cx, cy, track, a0, a1)}
              fill="none"
              strokeLinecap="round"
              strokeWidth={isShot ? sw * 1.15 : sw * 0.8}
              stroke={isShot ? p.accent : done ? hexA(ink, dark ? 0.45 : 0.24) : hexA(ink, 0.08)}
              filter={isShot ? 'url(#sd-glow)' : undefined}
            />
          );
        })}
        {/* logged dot on shot day */}
        {(() => {
          const [x, y] = polar(cx, cy, track, rot + (shot + 0.5) * seg);
          return <circle cx={x} cy={y} r={sw * 0.28} fill={p.pop} stroke="#ffffff" strokeWidth={sw * 0.08} />;
        })()}
        {/* jelly dose capsule */}
        <rect x={cx - r * 0.54} y={cy - r * 0.23} width={r * 1.08} height={r * 0.46} rx={r * 0.23} fill="url(#sd-jelly)" stroke={hexA(ink, 0.2)} strokeWidth={Math.max(1, r * 0.006)} />
        <rect x={cx - r * 0.44} y={cy - r * 0.2} width={r * 0.7} height={r * 0.09} rx={r * 0.045} fill="#ffffff" opacity={0.55} />
      </svg>
      {/* capsule text */}
      <div style={{ position: 'absolute', left: cx - r * 0.54, top: cy - r * 0.23, width: r * 1.08, height: r * 0.46, display: 'grid', placeItems: 'center', whiteSpace: 'nowrap', ...displayFace('syne'), fontSize: r * (p.dose.length > 6 ? 0.135 : 0.17), color: '#F6F7FA', letterSpacing: '-0.02em' }}>{p.dose}</div>
      {labels && (
        <div style={{ position: 'absolute', left: cx - r, width: r * 2, top: cy + r * 0.32, textAlign: 'center', fontFamily: FONTS.majormono, fontSize: r * 0.075, color: ink, opacity: 0.8, letterSpacing: '0.12em' }}>{p.doseNote}</div>
      )}
      {/* day letters outside the bezel */}
      {labels &&
        DAYS.map((d, i) => {
          const [x, y] = polar(cx, cy, r * 1.13, rot + (i + 0.5) * seg);
          const isShot = i === shot;
          return (
            <div key={i} style={{ position: 'absolute', left: x - r * 0.1, top: y - r * 0.07, width: r * 0.2, textAlign: 'center', fontFamily: FONTS.majormono, fontSize: r * 0.1, lineHeight: 1.4, color: isShot ? p.accent : ink, opacity: isShot ? 1 : 0.6 }}>
              {d}
            </div>
          );
        })}
    </>
  );
}

/** Glass chip. Pass `right` to anchor by the right edge so long labels can't overflow. */
function Chip({ x, right, y, size, label, dot, p }: { x?: number; right?: number; y: number; size: number; label: string; dot: string; p: P }) {
  if (!label) return null;
  const dark = isDark(p.background);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        right,
        top: y,
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.6,
        padding: `${size * 0.6}px ${size * 1}px`,
        borderRadius: 999,
        fontFamily: FONTS.majormono,
        fontSize: size,
        whiteSpace: 'nowrap',
        color: p.textColor,
        background: dark ? 'linear-gradient(180deg, #2A2A31, #18181D)' : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.55))',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.16)' : 'rgba(16,18,25,0.12)'}`,
        boxShadow: `0 ${size * 0.8}px ${size * 2.4}px rgba(16,18,25,${dark ? 0.4 : 0.12}), inset 0 1px 0 rgba(255,255,255,0.9)`,
      }}
    >
      <span style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: dot, boxShadow: `0 0 ${size * 0.6}px ${dot}` }} />
      {label}
    </div>
  );
}

export default function ShotDaySorted(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.5 : 0.5);
  // Syne 800 is very wide: budget ~0.62em per character across two lines.
  const head = Math.min(stacked ? W * 0.1 : H * (strip ? 0.2 : 0.135), (colW / Math.max(8, p.headline.length * 0.36)) * 1.0);
  const small = Math.max(head * 0.28, 13);

  const r = stacked ? Math.min(W * 0.3, H * 0.2) : Math.min(H * (strip ? 0.36 : 0.32), W * 0.19);
  const cx = stacked ? W / 2 : W - pad - r * (strip ? 1.5 : 1.25);
  const cy = stacked ? H * 0.29 : H / 2;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.bricolage }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.16, size: Math.round(Math.min(W, H) / 22), color: dark ? '255,255,255' : '16,18,25' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)'}
        glows={[
          { x: W * 0.1, y: 0, size: Math.max(W, H) * 0.9, color: hexA('#ffffff', dark ? 0.05 : 0.7), opacity: 0.9 },
          { x: cx, y: cy + r, size: r * 3, color: hexA(p.pop, dark ? 0.18 : 0.14), opacity: 0.9 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.5 : 0.12}
      />
      {/* chrome horizon band: the Y2K silver sweep behind everything */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: stacked ? cy - r * 0.04 : H * 0.5 - H * 0.01, height: Math.max(2, Math.min(W, H) * 0.006), background: `linear-gradient(90deg, transparent, ${hexA(p.textColor, 0.18)} 20%, #ffffff 50%, ${hexA(p.textColor, 0.18)} 80%, transparent)`, opacity: dark ? 0.3 : 0.9 }} />

      <Dial cx={cx} cy={cy} r={r} p={p} labels={!strip || H > 300} />
      {!strip && <Chip right={W - (cx + r * 1.2)} y={cy - r * 1.12} size={small * 0.85} label={p.chip1} dot={p.accent} p={p} />}
      {!strip && <Chip x={stacked ? cx - r * 1.25 : cx - r * 1.3} y={cy + r * 0.78} size={small * 0.85} label={p.chip2} dot={p.pop} p={p} />}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.56, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ fontFamily: FONTS.majormono, fontSize: small * 0.85, letterSpacing: '0.18em', color: dark ? p.accent : p.textColor, display: 'flex', alignItems: 'center', gap: small * 0.5, justifyContent: stacked ? 'center' : 'flex-start' }}>
          <span style={{ width: small * 0.55, height: small * 0.55, borderRadius: '50%', background: p.pop }} />
          {p.eyebrow}
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 0.98,
            letterSpacing: '-0.035em',
            marginTop: small * 0.6,
            color: p.textColor,
          }}
        >
          {p.headline}
        </div>
        {!strip && <div style={{ fontSize: small * 1.05, lineHeight: 1.4, opacity: 0.82, marginTop: small * 0.8, maxWidth: stacked ? colW : colW * 0.88, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.4}px`,
                borderRadius: 999,
                fontWeight: 800,
                fontSize: small * 0.95,
                color: '#F6F7FA',
                background: `linear-gradient(180deg, ${hexA('#ffffff', 0.35)} 0%, ${p.accent} 45%, ${p.accent} 100%)`,
                backgroundColor: p.accent,
                boxShadow: `0 ${small * 0.4}px ${small * 1.6}px ${hexA(p.accent, 0.4)}, inset 0 -2px 0 rgba(0,0,0,0.15)`,
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
