import type { CSSProperties, ReactNode } from 'react';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, hexA, shade } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'README Header',
  description:
    'OpenAssets README / launch header: the name shouted in Anton with a misregistered riso overprint, a one-line tagline, and a fanned stack of asset cards (icon, 3D, video, banner) with their download formats, a live params panel and a KIT 03 sticker over a halftone sun.',
  tags: ['readme', 'header', 'launch', 'og', 'social', 'riso', 'openassets'],
};

export const schema = z.object({
  kitTag: text('Kit tag').default('Kit 03 · 31 Oct 2026'),
  name1: text('Name, first part').default('Open'),
  name2: text('Name, second part (accent)').default('Assets'),
  tagline: text().default('Free, editable assets. A new kit every day.'),
  body: textarea().default('Icons, 3D heroes, banners, videos and scenes as parametric source. Edit anything; every download renders in your browser.'),
  url: text('Link').default('arnabchatterjee20k.github.io/openassets'),
  sticker: text('Sticker (empty to hide)').default('Kit 03'),
  background: color('Paper').default('#F4EFE6'),
  surface: color('Card paper').default('#FBF8F2'),
  ink: color('Ink').default('#1F2A6B'),
  accent: color('Plate 1 (pink)').default('#FF48B0'),
  accent2: color('Plate 2 (blue)').default('#0078BF'),
  pop: color('Pop').default('#FFE800'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  brutalist: { background: '#FFFDF2', surface: '#FFFFFF', ink: '#111111', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#FFE45C' },
  memphis: { background: '#FFF6E9', surface: '#FFFFFF', ink: '#1A1A2E', accent: '#FF6F91', accent2: '#00B3A4', pop: '#FFC93C', tagline: 'Free assets you can actually edit.' },
  bauhaus: { background: '#F2EBDD', surface: '#FAF5EA', ink: '#111111', accent: '#D9381E', accent2: '#1D4E9E', pop: '#F2B90F', sticker: 'Daily' },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', ink: '#F0FFE0', accent: '#FF00E5', accent2: '#00F0FF', pop: '#C6FF00', tagline: 'Free, editable assets. Fresh every day.' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

/** Registration mark: crosshair in a circle (the kit's motif). */
function RegMark({ x, y, s, c, style }: { x: number; y: number; s: number; c: string; style?: CSSProperties }) {
  return (
    <svg width={s} height={s} viewBox="-12 -12 24 24" style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, overflow: 'visible', ...style }}>
      <circle r="6.5" fill="none" stroke={c} strokeWidth="1.3" />
      <line x1="-11" y1="0" x2="11" y2="0" stroke={c} strokeWidth="1.3" />
      <line x1="0" y1="-11" x2="0" y2="11" stroke={c} strokeWidth="1.3" />
    </svg>
  );
}

/** Two riso plates: the second ink sits offset underneath, both multiplied. */
function Overprint({ children, off, c1, c2, dark, style }: { children: ReactNode; off: number; c1: string; c2: string; dark: boolean; style: CSSProperties }) {
  const blend = dark ? 'screen' : 'multiply';
  return (
    <div style={{ position: 'relative', width: 'fit-content', ...style }}>
      <div aria-hidden style={{ position: 'absolute', left: off, top: off * 0.8, color: c2, mixBlendMode: blend, whiteSpace: 'nowrap' }}>
        {children}
      </div>
      <div style={{ position: 'relative', color: c1, mixBlendMode: blend, whiteSpace: 'nowrap' }}>{children}</div>
    </div>
  );
}

/** Mini art for each asset kind, on a 100×72 board. */
function Art({ kind, p }: { kind: number; p: P }) {
  const ink = p.ink;
  const sw = 1.8;
  if (kind === 0) {
    // Icon: pink tile with a four-point sparkle
    return (
      <svg viewBox="0 0 100 72" width="100%" height="100%">
        <rect width="100" height="72" fill={hexA(p.accent, 0.14)} />
        <rect x="30" y="11" width="50" height="50" rx="13" fill={p.accent2} style={{ mixBlendMode: 'multiply' }} />
        <rect x="26" y="8" width="50" height="50" rx="13" fill={p.accent} style={{ mixBlendMode: 'multiply' }} />
        <path d="M51 15 Q53.5 30.5 69 33 Q53.5 35.5 51 51 Q48.5 35.5 33 33 Q48.5 30.5 51 15Z" fill={p.surface} />
        <path d="M65 14 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6Z" fill={p.pop} />
      </svg>
    );
  }
  if (kind === 1) {
    // 3D: isometric rounded cube with overprinted shadow
    const c = 0.866;
    const s = 22;
    const cx = 50;
    const cy = 36;
    const top = `${cx},${cy - s} ${cx + s * c},${cy - s / 2} ${cx},${cy} ${cx - s * c},${cy - s / 2}`;
    const left = `${cx - s * c},${cy - s / 2} ${cx},${cy} ${cx},${cy + s} ${cx - s * c},${cy + s / 2}`;
    const right = `${cx + s * c},${cy - s / 2} ${cx},${cy} ${cx},${cy + s} ${cx + s * c},${cy + s / 2}`;
    return (
      <svg viewBox="0 0 100 72" width="100%" height="100%">
        <rect width="100" height="72" fill={hexA(p.pop, 0.35)} />
        <ellipse cx="54" cy="62" rx="26" ry="5" fill={p.accent2} opacity="0.35" />
        <polygon points={top} fill={shade(p.pop, 0.35)} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
        <polygon points={left} fill={shade(p.pop, -0.08)} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
        <polygon points={right} fill={p.accent} stroke={ink} strokeWidth={sw} strokeLinejoin="round" style={{ mixBlendMode: 'multiply' }} />
      </svg>
    );
  }
  if (kind === 2) {
    // Video: frame, play button, timeline with playhead
    return (
      <svg viewBox="0 0 100 72" width="100%" height="100%">
        <rect width="100" height="72" fill={p.ink} />
        <circle cx="70" cy="22" r="22" fill={p.accent2} opacity="0.7" />
        <circle cx="62" cy="26" r="16" fill={p.accent} style={{ mixBlendMode: isDark(p.ink) ? 'screen' : 'multiply' }} />
        <path d="M42 22 L58 31 L42 40Z" fill={p.surface} stroke={p.surface} strokeWidth="3" strokeLinejoin="round" />
        <rect x="10" y="56" width="80" height="4" rx="2" fill={hexA(p.surface, 0.3)} />
        <rect x="10" y="56" width="52" height="4" rx="2" fill={p.pop} />
        <circle cx="62" cy="58" r="4.5" fill={p.pop} stroke={p.ink} strokeWidth="1.5" />
      </svg>
    );
  }
  // Banner: a tiny poster with stacked bars
  return (
    <svg viewBox="0 0 100 72" width="100%" height="100%">
      <rect width="100" height="72" fill={p.accent2} />
      <circle cx="78" cy="50" r="30" fill={p.accent} style={{ mixBlendMode: 'multiply' }} />
      <rect x="10" y="12" width="46" height="11" fill={p.surface} />
      <rect x="10" y="27" width="34" height="11" fill={p.pop} />
      <rect x="10" y="46" width="28" height="4" fill={hexA(p.surface, 0.75)} />
      <rect x="10" y="54" width="20" height="4" fill={hexA(p.surface, 0.75)} />
    </svg>
  );
}

const CARDS = [
  { name: 'Icons', fmt: 'SVG' },
  { name: '3D hero', fmt: 'GLB' },
  { name: 'Video', fmt: 'MP4' },
  { name: 'Banner', fmt: 'PNG' },
];

function Card({ i, x, y, w, rot, p, dark }: { i: number; x: number; y: number; w: number; rot: number; p: P; dark: boolean }) {
  const u = w / 100;
  const h = w * 1.06;
  const ink = p.ink;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        rotate: `${rot}deg`,
        boxSizing: 'border-box',
        padding: u * 6,
        background: p.surface,
        border: `${Math.max(1.5, u * 0.9)}px solid ${ink}`,
        borderRadius: u * 5,
        boxShadow: `${u * 3}px ${u * 3.4}px 0 ${dark ? p.accent2 : p.accent2}`,
        color: ink,
      }}
    >
      <div style={{ width: '100%', height: w * 0.62, borderRadius: u * 3, overflow: 'hidden', border: `${Math.max(1, u * 0.6)}px solid ${ink}` }}>
        <Art kind={i} p={p} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: u * 6 }}>
        <span style={{ fontFamily: FONTS.anton, fontSize: u * 11, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{CARDS[i].name}</span>
        <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: u * 6.4, padding: `${u * 1.4}px ${u * 3}px`, borderRadius: 99, background: i === 0 ? p.accent : 'transparent', color: i === 0 ? p.surface : ink, border: `${Math.max(1, u * 0.6)}px solid ${i === 0 ? p.accent : ink}`, letterSpacing: '0.06em' }}>
          .{CARDS[i].fmt.toLowerCase()}
        </span>
      </div>
      <div style={{ display: 'flex', gap: u * 2.4, marginTop: u * 5 }}>
        {[64, 30].map((wd, k) => (
          <div key={k} style={{ height: u * 2.6, width: `${wd}%`, borderRadius: 9, background: hexA(ink, k ? 0.14 : 0.26) }} />
        ))}
      </div>
    </div>
  );
}

/** The editor's params panel: the product's core idea in miniature. */
function Panel({ x, y, w, p, dark }: { x: number; y: number; w: number; p: P; dark: boolean }) {
  const u = w / 100;
  const ink = p.ink;
  const label: CSSProperties = { fontFamily: FONTS.mono, fontWeight: 700, fontSize: u * 5.4, letterSpacing: '0.16em', textTransform: 'uppercase', color: hexA(ink, 0.7) };
  const row: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: u * 5 };
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, boxSizing: 'border-box', padding: u * 7, background: p.surface, border: `${Math.max(1.5, u * 0.9)}px solid ${ink}`, borderRadius: u * 5, boxShadow: `${u * 3}px ${u * 3.4}px 0 ${dark ? p.accent : ink}`, rotate: '-3deg', color: ink }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: u * 3 }}>
        <span style={{ width: u * 4, height: u * 4, borderRadius: '50%', background: p.pop, border: `${u * 0.6}px solid ${ink}` }} />
        <span style={{ ...label, color: ink }}>Params</span>
        <span style={{ ...label, marginLeft: 'auto', fontSize: u * 4.6 }}>live</span>
      </div>
      <div style={row}>
        <span style={label}>Accent</span>
        <span style={{ display: 'flex', gap: u * 2 }}>
          {[p.accent, p.accent2, p.pop].map((c, k) => (
            <span key={k} style={{ width: u * 8, height: u * 8, borderRadius: '50%', background: c, border: `${u * 0.6}px solid ${ink}`, boxShadow: k === 0 ? `0 0 0 ${u * 1.2}px ${p.surface}, 0 0 0 ${u * 2}px ${ink}` : undefined }} />
          ))}
        </span>
      </div>
      <div style={{ ...row, marginTop: u * 6 }}>
        <span style={label}>Size</span>
        <span style={{ position: 'relative', width: '58%', height: u * 2.4, borderRadius: 9, background: hexA(ink, 0.18) }}>
          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '68%', borderRadius: 9, background: p.accent2 }} />
          <span style={{ position: 'absolute', left: '68%', top: '50%', width: u * 7, height: u * 7, marginLeft: -u * 3.5, marginTop: -u * 3.5, borderRadius: '50%', background: p.surface, border: `${u * 0.8}px solid ${ink}` }} />
        </span>
      </div>
    </div>
  );
}

export default function ReadmeHeader(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const ink = p.ink;

  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.09);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.46 : 0.5);

  // Title: two stacked lines (one line on the strip). Anton caps ≈ 0.46em per glyph.
  const n1 = p.name1.toUpperCase();
  const n2 = p.name2.toUpperCase();
  const oneLine = strip;
  const glyphs = oneLine ? n1.length + n2.length : Math.max(n1.length, n2.length, 4);
  const EM = 0.46;
  const byWidth = colW / (glyphs * EM);
  const title = Math.min(byWidth, stacked ? H * 0.13 : H * (strip ? 0.3 : 0.28));
  const small = Math.max(title * (oneLine ? 0.17 : stacked ? 0.15 : 0.105), 13);
  const off = Math.max(2, title * 0.035);
  // The copy column only needs to be as wide as the title (plus room for the tagline).
  const textW = stacked ? colW : Math.min(colW, Math.max(glyphs * EM * title, small * 22));

  // Hero: fanned cards, sized so the whole fan (and sticker) stays inside its region.
  const heroL = stacked ? pad : pad + textW + W * 0.035;
  const heroR = W - pad * (strip ? 0.7 : 0.6);
  const heroW = heroR - heroL;
  const spreadK = strip ? 0.82 : 0.5;
  const cw = stacked ? Math.min(W * 0.2, H * 0.2) : Math.min(heroW / (3 * spreadK + 1.2), H * (strip ? 0.56 : 0.4));
  const hx = stacked ? W / 2 : (heroL + heroR) / 2;
  const hy = stacked ? H * 0.26 : H * (strip ? 0.52 : 0.44);
  const spread = cw * spreadK;
  const fan = [
    { dx: -1.5, dy: 0.1, rot: -11 },
    { dx: -0.5, dy: -0.06, rot: -4 },
    { dx: 0.5, dy: -0.04, rot: 4 },
    { dx: 1.5, dy: 0.12, rot: 11 },
  ];
  const sunR = stacked ? W * 0.3 : strip ? H * 0.62 : Math.min(H * 0.48, heroW * 0.5);
  const sunX = hx + cw * 0.5;
  const sunY = hy - cw * 0.25;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.1 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '240,255,224' : '31,42,107' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}
        grain={0.07}
        vignette={dark ? 0.45 : 0.05}
      >
        {/* Halftone sun printed twice, slightly out of register */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            {[0, 1].map((k) => (
              <pattern key={k} id={`rh-dots-${k}`} width={sunR / 9} height={sunR / 9} patternUnits="userSpaceOnUse" patternTransform={`rotate(${k ? 15 : 45})`}>
                <circle cx={sunR / 18} cy={sunR / 18} r={sunR / 34} fill={k ? p.accent2 : p.accent} />
              </pattern>
            ))}
            <radialGradient id="rh-fade">
              <stop offset="0.55" stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id="rh-mask">
              <circle cx={sunX} cy={sunY} r={sunR} fill="url(#rh-fade)" />
            </mask>
          </defs>
          <g mask="url(#rh-mask)" style={{ mixBlendMode: dark ? 'screen' : 'multiply' }}>
            <circle cx={sunX + sunR * 0.06} cy={sunY + sunR * 0.05} r={sunR} fill="url(#rh-dots-1)" opacity="0.55" />
            <circle cx={sunX} cy={sunY} r={sunR} fill="url(#rh-dots-0)" opacity="0.7" />
          </g>
        </svg>
      </Backdrop>

      {/* Registration marks in the print margins */}
      {[
        [pad * 0.45, pad * 0.45],
        [W - pad * 0.45, pad * 0.45],
        [pad * 0.45, H - pad * 0.45],
        [W - pad * 0.45, H - pad * 0.45],
      ].map(([x, y], k) => (
        <RegMark key={k} x={x} y={y} s={Math.max(16, Math.min(W, H) * 0.045)} c={hexA(ink, 0.55)} />
      ))}

      {/* Hero: cards fanned over the sun, params panel docked in front */}
      {fan.map((f, i) => (
        <Card key={i} i={i} x={hx + f.dx * spread} y={hy + f.dy * cw} w={cw} rot={f.rot} p={p} dark={dark} />
      ))}
      {!strip && <Panel x={hx + spread * 0.1} y={hy + cw * 0.6} w={cw * 1.05} p={p} dark={dark} />}
      {p.sticker && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hx + spread * 1.5 + cw * 0.5 - cw * 0.38, W - pad * 0.5 - cw * 0.62),
            top: Math.max(pad * 0.3, hy - cw * (strip ? 0.66 : 0.82)),
            width: cw * 0.62,
            height: cw * 0.62,
            borderRadius: '50%',
            background: p.pop,
            border: `${Math.max(1.5, cw * 0.009)}px solid ${ink}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            rotate: '12deg',
            color: '#1F2A6B' === ink || !dark ? ink : '#0B0B0B',
            boxShadow: `${cw * 0.02}px ${cw * 0.025}px 0 ${p.accent}`,
          }}
        >
          <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: cw * 0.052, letterSpacing: '0.2em', textTransform: 'uppercase' }}>New</span>
          <span style={{ fontFamily: FONTS.anton, fontSize: cw * 0.15, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.sticker}</span>
        </div>
      )}

      {/* Copy column */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: textW,
          ...(stacked
            ? { top: H * 0.535, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.55 }}>
          {p.logo ? (
            <img src={p.logo} alt="" style={{ height: small * 1.6, objectFit: 'contain' }} />
          ) : (
            <span style={{ display: 'inline-flex', gap: small * 0.15 }}>
              {[p.accent, p.accent2, p.pop].map((c) => (
                <span key={c} style={{ width: small * 0.62, height: small * 0.62, borderRadius: '50%', background: c, border: `1px solid ${ink}` }} />
              ))}
            </span>
          )}
          <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: small * 0.78, letterSpacing: '0.24em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.kitTag}</span>
        </div>
        <div style={{ fontFamily: FONTS.anton, fontSize: title, lineHeight: 0.88, letterSpacing: '0.005em', textTransform: 'uppercase', marginTop: small * 0.6 }}>
          {oneLine ? (
            <div style={{ display: 'flex' }}>
              <Overprint off={off} c1={ink} c2={p.accent2} dark={dark} style={{}}>
                {n1}
              </Overprint>
              <Overprint off={off} c1={p.accent} c2={p.accent2} dark={dark} style={{}}>
                {n2}
              </Overprint>
            </div>
          ) : (
            <>
              <Overprint off={off} c1={ink} c2={p.accent2} dark={dark} style={{}}>
                {n1}
              </Overprint>
              <Overprint off={off} c1={p.accent} c2={p.accent2} dark={dark} style={{}}>
                {n2}
              </Overprint>
            </>
          )}
        </div>
        <div style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: small * 1.42, lineHeight: 1.12, letterSpacing: '-0.01em', marginTop: small * 0.75, maxWidth: textW }}>{p.tagline}</div>
        {!strip && <div style={{ fontFamily: FONTS.familjen, fontWeight: 400, fontSize: small * 0.98, lineHeight: 1.38, marginTop: small * 0.5, maxWidth: textW * (stacked ? 0.85 : 1), color: hexA(ink, 0.82) }}>{p.body}</div>}
        {p.url && (
          <div style={{ display: 'flex', marginTop: small * (strip ? 0.6 : 1.0) }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: small * 0.5,
                padding: `${small * 0.5}px ${small * 0.9}px`,
                borderRadius: 999,
                background: dark ? p.pop : ink,
                color: dark ? '#0B0B0B' : p.background,
                fontFamily: FONTS.mono,
                fontWeight: 700,
                fontSize: small * 0.8,
                whiteSpace: 'nowrap',
                boxShadow: `${small * 0.2}px ${small * 0.22}px 0 ${p.accent}`,
              }}
            >
              <span style={{ width: small * 0.45, height: small * 0.45, borderRadius: '50%', background: dark ? '#0B0B0B' : p.pop }} />
              {p.url}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
