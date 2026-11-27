import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Platform Launch',
  description:
    'Launch banner for Plumbline: a Bodoni headline beside a thermal truss bridge in camera viewfinder brackets, with a pink deflection pin and live data chips.',
  tags: ['hero', 'launch', 'infrastructure', 'bridge', 'social'],
};

export const schema = z.object({
  eyebrow: text().default('Plumbline · Early access'),
  headline: text('Headline (roman)').default('Your cameras'),
  headlineItalic: text('Headline (italic)').default('already see the cracks.'),
  body: textarea().default('Plumbline turns the CCTV on your bridges, rail and pipelines into structural sensors: live 3D twins, millimetre deflection, alerts in 0.8 s.'),
  cta: text('Button (empty to hide)').default('Book a site pilot'),
  pin: text('Anomaly label').default('Δ 3.2 mm · Span 3'),
  camLabel: text('Camera label').default('CAM 04 · RIVER ST BRIDGE'),
  chip1: text('Chip 1').default('1,240 cameras online'),
  chip2: text('Chip 2').default('0 new sensors'),
  font: font('Headline font').default('bodoni'),
  background: color().default('#1A0A06'),
  surface: color().default('#2E120B'),
  accent: color('Heat').default('#FF4D00'),
  accent2: color('Hot core').default('#FFB000'),
  pop: color('Anomaly').default('#FF2E63'),
  textColor: color('Text').default('#FFEDE0'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#FF5A36', textColor: '#F3EDE2', font: 'instrument' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', accent: '#7FB2FF', accent2: '#FFFFFF', pop: '#FFDD00', textColor: '#EAF2FF', headline: 'Every camera,', headlineItalic: 'a structural sensor.' },
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', accent: '#E3000F', accent2: '#FF6A3D', pop: '#E3000F', textColor: '#0A0A0A', font: 'familjen' },
  'deep-sea': { background: '#021B26', surface: '#06303F', accent: '#1B7FA6', accent2: '#2EF2C4', pop: '#FF7A59', textColor: '#E6FFFA', headline: 'Watch every pipe,', headlineItalic: 'not just the gauges.', pin: 'Leak · 0.4 L/min', camLabel: 'CAM 11 · GAS MAIN 7' },
  minimal: { chip1: '', chip2: '', body: '', eyebrow: 'Plumbline' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

// The hero: a truss bridge seen through a CCTV viewfinder, coloured like a thermal image.
// Drawn in its own 600×360 space and scaled into place.
const VW = 600;
const VH = 360;
const DECK = 214;
const TOP = 138;
const WATER = 268;
const BOTTOM_NODES = Array.from({ length: 10 }, (_, i) => 48 + i * 56);
const TOP_NODES = BOTTOM_NODES.slice(0, -1).map((x) => x + 28);
const PIERS = [160, 300, 440];
const HOT = { x: 356, y: TOP };

function truss() {
  const d: string[] = [];
  d.push(`M${TOP_NODES[0]},${TOP} L${TOP_NODES[TOP_NODES.length - 1]},${TOP}`);
  d.push(`M20,${DECK} L580,${DECK}`);
  BOTTOM_NODES.forEach((x, i) => {
    if (i < TOP_NODES.length) d.push(`M${x},${DECK} L${TOP_NODES[i]},${TOP} L${BOTTOM_NODES[i + 1]},${DECK}`);
  });
  TOP_NODES.forEach((x) => d.push(`M${x},${TOP} L${x},${DECK}`));
  return d.join(' ');
}

function Viewfinder({ p, x, y, w, h }: { p: P; x: number; y: number; w: number; h: number }) {
  const dark = isDark(p.background);
  const ink = p.textColor;
  const path = truss();
  const k = 42; // bracket arm
  const m = 14; // bracket inset
  const corners = [
    `M${m},${m + k} L${m},${m} L${m + k},${m}`,
    `M${VW - m - k},${m} L${VW - m},${m} L${VW - m},${m + k}`,
    `M${VW - m},${VH - m - k} L${VW - m},${VH - m} L${VW - m - k},${VH - m}`,
    `M${m + k},${VH - m} L${m},${VH - m} L${m},${VH - m - k}`,
  ];
  const cool = dark ? p.surface : hexA(p.textColor, 0.35);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'visible' }}>
      <defs>
        <linearGradient id="pl-heat" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={cool} />
          <stop offset="0.28" stopColor={p.accent} />
          <stop offset="0.56" stopColor={p.accent2} />
          <stop offset="0.62" stopColor={p.accent2} />
          <stop offset="0.82" stopColor={p.accent} />
          <stop offset="1" stopColor={cool} />
        </linearGradient>
        <radialGradient id="pl-hot">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.9" />
          <stop offset="0.35" stopColor={p.accent2} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pl-refl" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="pl-refl-mask">
          <rect x="0" y={WATER} width={VW} height={VH - WATER} fill="url(#pl-refl)" />
        </mask>
        <linearGradient id="pl-scan" x1="0" x2="1">
          <stop offset="0" stopColor={p.accent2} stopOpacity="0" />
          <stop offset="0.85" stopColor={p.accent2} stopOpacity={dark ? 0.22 : 0.3} />
          <stop offset="1" stopColor={p.accent2} stopOpacity="0.9" />
        </linearGradient>
        <filter id="pl-bloom" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="pl-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* feed frame: faint surface panel + scanlines */}
      <rect x="0" y="0" width={VW} height={VH} rx="6" fill={hexA(p.surface, dark ? 0.55 : 0.6)} />
      {Array.from({ length: 45 }, (_, i) => (
        <line key={i} x1="0" x2={VW} y1={i * 8 + 4} y2={i * 8 + 4} stroke={ink} strokeOpacity={dark ? 0.035 : 0.05} />
      ))}

      {/* water + far bank */}
      <rect x="0" y={WATER} width={VW} height={VH - WATER} fill={hexA(p.background, dark ? 0.7 : 0.25)} />
      <path d={`M0,${WATER} L${VW},${WATER}`} stroke={hexA(p.accent, 0.4)} strokeWidth="1.2" />

      {/* heat bloom behind the steel, hottest at the strained span */}
      <ellipse cx={HOT.x} cy={(TOP + DECK) / 2} rx="190" ry="70" fill="url(#pl-hot)" filter="url(#pl-soft)" opacity="0.8" />
      <path d={path} stroke="url(#pl-heat)" strokeWidth="9" fill="none" filter="url(#pl-bloom)" opacity="0.7" />

      {/* piers */}
      {PIERS.map((px) => (
        <g key={px}>
          <rect x={px - 9} y={DECK + 4} width="18" height={WATER - DECK + 10} fill={dark ? shadeHex(p.surface, 0.2) : hexA(p.textColor, 0.25)} />
          <rect x={px - 9} y={DECK + 4} width="18" height={WATER - DECK + 10} fill="url(#pl-heat)" opacity="0.25" />
        </g>
      ))}
      {/* the truss itself */}
      <path d={path} stroke="url(#pl-heat)" strokeWidth="3.2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="20" y={DECK - 3} width="560" height="9" fill="url(#pl-heat)" />

      {/* reflection */}
      <g mask="url(#pl-refl-mask)" transform={`translate(0 ${2 * WATER}) scale(1 -1)`} opacity="0.55">
        <path d={path} stroke="url(#pl-heat)" strokeWidth="3" fill="none" />
        <rect x="20" y={DECK - 3} width="560" height="9" fill="url(#pl-heat)" />
      </g>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={80 + i * 97} x2={150 + i * 97} y1={WATER + 18 + (i % 3) * 16} y2={WATER + 18 + (i % 3) * 16} stroke={p.accent2} strokeOpacity="0.25" strokeWidth="1.4" strokeLinecap="round" />
      ))}

      {/* scan band sweeping left→right, caught at its leading edge */}
      <rect x="300" y="26" width="140" height={VH - 52} fill="url(#pl-scan)" />

      {/* anomaly pin + leader */}
      <circle cx={HOT.x} cy={HOT.y} r="22" fill="none" stroke={p.pop} strokeWidth="1.5" opacity="0.5" />
      <circle cx={HOT.x} cy={HOT.y} r="12" fill="none" stroke={p.pop} strokeWidth="2.5" />
      <circle cx={HOT.x} cy={HOT.y} r="5" fill={p.pop} />
      <path d={`M${HOT.x + 14},${HOT.y - 12} L${HOT.x + 52},${HOT.y - 62} L${HOT.x + 64},${HOT.y - 62}`} stroke={p.pop} strokeWidth="1.6" fill="none" />
      <g transform={`translate(${HOT.x + 68} ${HOT.y - 62})`}>
        <rect x="0" y="-15" width={p.pin.length * 9.4 + 20} height="30" rx="15" fill={p.pop} />
        <text x="10" y="6" fontFamily={FONTS.familjen} fontSize="16" fontWeight="700" fill={isDark(p.pop) ? '#FFFFFF' : '#1A0A06'}>
          {p.pin}
        </text>
      </g>

      {/* viewfinder chrome */}
      {corners.map((d, i) => (
        <path key={i} d={d} stroke={ink} strokeWidth="2" fill="none" strokeLinecap="square" opacity="0.9" />
      ))}
      <circle cx="40" cy="44" r="6" fill={p.pop} />
      <text x="54" y="50" fontFamily={FONTS.italiana} fontSize="17" letterSpacing="3" fill={ink}>
        REC · {p.camLabel}
      </text>
      <text x={VW - 34} y={VH - 34} textAnchor="end" fontFamily={FONTS.familjen} fontSize="14" letterSpacing="1.5" fill={ink} opacity="0.7">
        THERMAL · 04:12:09
      </text>
      {/* centre crosshair */}
      <path d={`M${VW / 2 - 10},${VH / 2 + 60} h20 M${VW / 2},${VH / 2 + 50} v20`} stroke={ink} strokeOpacity="0.5" strokeWidth="1.2" />
    </svg>
  );
}

function shadeHex(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

function Chip({ x, right, y, size, label, p }: { x?: number; right?: number; y: number; size: number; label: string; p: P }) {
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
        gap: size * 0.55,
        padding: `${size * 0.6}px ${size * 1.05}px`,
        borderRadius: size * 0.3,
        fontFamily: FONTS.familjen,
        fontWeight: 500,
        fontSize: size,
        whiteSpace: 'nowrap',
        color: p.textColor,
        background: dark ? hexA(p.surface, 0.85) : 'rgba(255,255,255,0.8)',
        border: `1px solid ${hexA(p.textColor, dark ? 0.16 : 0.14)}`,
        boxShadow: `0 ${size}px ${size * 3}px rgba(0,0,0,${dark ? 0.4 : 0.08})`,
      }}
    >
      <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: p.accent2, boxShadow: `0 0 ${size * 0.8}px ${p.accent2}` }} />
      {label}
    </div>
  );
}

export default function PlatformLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.44 : 0.44);
  const head = Math.min(stacked ? W * 0.072 : H * (strip ? 0.17 : 0.11), colW * (strip ? 0.1 : 0.135));
  const small = Math.max(head * 0.3, 13);

  // Hero viewfinder box (600:360 aspect).
  const vw = stacked ? Math.min(W * 0.8, H * 0.5 * (VW / VH)) : strip ? Math.min(W * 0.42, (H - pad * 1.2) * (VW / VH)) : W - pad * 2 - colW - W * 0.04;
  const vh = vw * (VH / VW);
  const vx = stacked ? (W - vw) / 2 : W - pad - vw;
  const vy = stacked ? H * 0.06 : (H - vh) / 2;
  const showBody = !strip && !stacked && !!p.body;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.06 : 0.1, size: Math.round(Math.max(H / 24, 14)), color: dark ? '255,237,224' : '10,10,10' }}
        lift={dark ? hexA(p.accent, 0.06) : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: vx + vw * 0.6, y: vy + vh * 0.45, size: vw * 1.6, color: hexA(p.accent, dark ? 0.4 : 0.2), opacity: 0.9 },
          { x: stacked ? W * 0.2 : W * 0.1, y: H * 1.05, size: Math.max(W, H) * 0.8, color: hexA(p.accent2, dark ? 0.14 : 0.12), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.55 : 0.08}
      />

      <Viewfinder p={p} x={vx} y={vy} w={vw} h={vh} />
      {!strip && <Chip right={W - (vx + vw)} y={vy + vh + small * 0.8} size={small * 0.9} label={p.chip1} p={p} />}
      {!strip && <Chip x={vx} y={vy + vh + small * 0.8} size={small * 0.9} label={p.chip2} p={p} />}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: vy + vh + small * 4.6, textAlign: 'center' as const }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div
          style={{
            fontFamily: FONTS.italiana,
            fontSize: small * 1.2,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: p.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: stacked ? 'center' : 'flex-start',
            gap: small * 0.6,
          }}
        >
          <span style={{ width: small * 2.2, height: 1, background: p.accent }} />
          {p.eyebrow}
        </div>
        <div style={{ marginTop: small * 0.7, lineHeight: 0.98, letterSpacing: '-0.025em', fontSize: head }}>
          <span style={{ ...displayFace(p.font, { italic: false, weight: 400 }), display: 'block' }}>{p.headline}</span>
          <span style={{ ...displayFace(p.font, { italic: true, weight: 400 }), display: 'block', color: dark ? p.accent2 : p.accent }}>{p.headlineItalic}</span>
        </div>
        {showBody && (
          <div style={{ fontSize: small * 1.05, lineHeight: 1.45, opacity: 0.78, marginTop: small * 1.1, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>
        )}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.9 : 1.5) }}>
            <span
              style={{
                padding: `${small * 0.65}px ${small * 1.4}px`,
                fontWeight: 700,
                fontSize: small * 0.95,
                letterSpacing: '0.02em',
                color: dark ? p.background : '#FFFFFF',
                background: p.accent,
                boxShadow: `0 ${small * 0.5}px ${small * 2}px ${hexA(p.accent, 0.35)}`,
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
