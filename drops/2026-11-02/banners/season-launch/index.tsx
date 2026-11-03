import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Season Launch Banner',
  description:
    'Neo-brutalist season banner for particles.io: huge headline with a hard offset shadow, a live game window with ships trading particle fire, a leaderboard card and a "64 players" sticker.',
  tags: ['banner', 'game', 'season', 'launch', 'social', 'neo-brutalist'],
};

export const schema = z.object({
  eyebrow: text().default('Season 3 · Live Fri 14 Nov'),
  headline: text().default('OVERCLOCK'),
  body: textarea().default('New map Reactor, ranked squads and 60-tick servers. 64 players per arena, right in your browser.'),
  cta: text('Button (empty to hide)').default('Play free at particles.io'),
  windowTitle: text('Window title').default('particles.io — Reactor · 64/64'),
  sticker: text('Sticker number').default('64'),
  stickerLabel: text('Sticker label').default('players / arena'),
  font: font('Headline font').default('dela'),
  background: color().default('#FFFDF2'),
  panel: color('Panel').default('#FFE45C'),
  ink: color('Ink + outlines').default('#000000'),
  accent: color('Accent (player)').default('#FF5C8A'),
  accent2: color('Accent 2 (enemy)').default('#5C8AFF'),
  pop: color('Pop').default('#00D1A0'),
  leaderboard: toggle('Leaderboard card').default(true),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  night: { background: '#0B0B0B', panel: '#1F1F1F', ink: '#F0FFE0', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', eyebrow: 'Night arena · Fri 14 Nov' },
  ultraviolet: { background: '#12001F', panel: '#B026FF', ink: '#FBEFFF', accent: '#FF2E88', accent2: '#FFD600', pop: '#2EF2C4', headline: 'RANKED', eyebrow: 'Ranked squads · Season 3' },
  riso: { background: '#F4EFE6', panel: '#FF48B0', ink: '#1F2A6B', accent: '#FFE800', accent2: '#0078BF', pop: '#FF48B0', font: 'bungee', headline: 'REACTOR', eyebrow: 'New map · Season 3' },
  citrus: { background: '#FFF8E1', panel: '#FF7A00', ink: '#1C2B1A', accent: '#FF3D7F', accent2: '#2BB24C', pop: '#2BB24C', leaderboard: false, sticker: '60', stickerLabel: 'tick servers' },
};

type P = z.infer<typeof schema> & BannerSize;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

/** Brutalist box: hard outline + offset shadow. */
const brut = (p: P, k: number, fill: string): CSSProperties => ({
  background: fill,
  border: `${Math.max(2, k * 0.5)}px solid ${p.ink}`,
  boxShadow: `${k}px ${k}px 0 ${p.ink}`,
});

/** Arrow ship sprite (notched arrowhead) in the arena's 600×380 space. */
function Ship({ x, y, rot, fill, ink, s = 1, tag }: { x: number; y: number; rot: number; fill: string; ink: string; s?: number; tag?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`rotate(${rot}) scale(${s})`}>
        <path d="M0 -20 L15 14 L0 6 L-15 14 Z" fill={ink} transform="translate(3 4)" />
        <path d="M0 -20 L15 14 L0 6 L-15 14 Z" fill={fill} stroke={ink} strokeWidth={2.6} strokeLinejoin="round" />
        <circle cx={0} cy={0} r={3.6} fill="#FFFDF2" stroke={ink} strokeWidth={1.8} />
      </g>
      {tag && (
        <g transform={`translate(0 ${-30 * s})`}>
          <rect x={-tag.length * 3.4 - 6} y={-9} width={tag.length * 6.8 + 12} height={15} fill="#FFFDF2" stroke={ink} strokeWidth={1.6} />
          <text x={0} y={2.5} textAnchor="middle" fontFamily={FONTS.chakra} fontWeight={700} fontSize={10} fill={ink} letterSpacing={0.6}>
            {tag}
          </text>
        </g>
      )}
    </g>
  );
}

/** A trail of particle shots from (x0,y0) to (x1,y1), shrinking toward the tail. */
function Shots({ x0, y0, x1, y1, n, fill, ink }: { x0: number; y0: number; x1: number; y1: number; n: number; fill: string; ink: string }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const r = 2 + t * 3.6;
        return <circle key={i} cx={x0 + (x1 - x0) * t} cy={y0 + (y1 - y0) * t} r={r} fill={fill} stroke={ink} strokeWidth={1.6} opacity={0.35 + t * 0.65} />;
      })}
    </g>
  );
}

function Arena({ p }: { p: P }) {
  const ink = p.ink;
  const burstColors = [p.accent, p.accent2, p.pop, p.panel];
  return (
    <svg viewBox="0 0 600 380" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <pattern id="sl-dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1.3" fill={hexA(ink, 0.22)} />
        </pattern>
        <pattern id="sl-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill={p.panel} />
          <line x1="0" y1="0" x2="0" y2="8" stroke={ink} strokeWidth="2.4" />
        </pattern>
      </defs>
      <rect width="600" height="380" fill={p.background} />
      <rect width="600" height="380" fill="url(#sl-dots)" />
      {/* Arena boundary ring + reactor core in the middle */}
      <circle cx="300" cy="190" r="168" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="4 8" opacity="0.5" />
      <circle cx="300" cy="190" r="34" fill={p.panel} stroke={ink} strokeWidth="3" />
      <circle cx="300" cy="190" r="16" fill={p.pop} stroke={ink} strokeWidth="2.6" />
      <circle cx="300" cy="190" r="50" fill="none" stroke={ink} strokeWidth="2" opacity="0.6" />
      {/* Cover blocks */}
      {[
        [92, 74, 70, 26],
        [430, 270, 84, 26],
        [470, 70, 26, 76],
        [110, 250, 26, 70],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x + 5} y={y + 5} width={w} height={h} fill={ink} />
          <rect x={x} y={y} width={w} height={h} fill="url(#sl-hatch)" stroke={ink} strokeWidth="2.6" />
        </g>
      ))}
      {/* Health pickup */}
      <g transform="translate(212 300)">
        <rect x="-11" y="-11" width="22" height="22" fill={p.pop} stroke={ink} strokeWidth="2.4" />
        <path d="M-5 0 H5 M0 -5 V5" stroke={ink} strokeWidth="3" strokeLinecap="square" />
      </g>
      {/* Fire exchange: player (accent) hits the enemy (accent2) */}
      <Shots x0={236} y0={140} x1={372} y1={92} n={7} fill={p.accent} ink={ink} />
      <Shots x0={420} y0={210} x1={338} y1={248} n={5} fill={p.accent2} ink={ink} />
      {/* Hit burst */}
      <g transform="translate(398 80)">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + rand(i) * 0.4;
          const d = 22 + rand(i * 3.3) * 22;
          const r = 2.6 + rand(i * 5.1) * 4;
          return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r} fill={burstColors[i % 4]} stroke={ink} strokeWidth="1.6" />;
        })}
        <path d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z" fill="#FFFDF2" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <text x="30" y="-28" fontFamily={FONTS.dela} fontSize="20" fill={p.pop} stroke={ink} strokeWidth="1.4" paintOrder="stroke">
          +100
        </text>
      </g>
      <Ship x={214} y={150} rot={68} fill={p.accent} ink={ink} s={1.25} tag="YOU" />
      <Ship x={444} y={206} rot={-118} fill={p.accent2} ink={ink} tag="PIXELWITCH" />
      <Ship x={160} y={208} rot={150} fill={p.pop} ink={ink} s={0.9} tag="NOVA_K" />
      <Ship x={360} y={318} rot={-20} fill={p.panel} ink={ink} s={0.85} />
    </svg>
  );
}

function GameWindow({ x, y, w, h, k, p }: { x: number; y: number; w: number; h: number; k: number; p: P }) {
  const bar = Math.max(22, k * 4.2);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...brut(p, k * 1.4, p.background), overflow: 'hidden' }}>
      <div
        style={{
          height: bar,
          display: 'flex',
          alignItems: 'center',
          gap: bar * 0.22,
          padding: `0 ${bar * 0.4}px`,
          background: p.panel,
          borderBottom: `${Math.max(2, k * 0.5)}px solid ${p.ink}`,
          fontFamily: FONTS.chakra,
          fontWeight: 700,
          fontSize: bar * 0.46,
          letterSpacing: '0.06em',
          color: p.ink,
          whiteSpace: 'nowrap',
        }}
      >
        {[p.accent, p.accent2, p.pop].map((c, i) => (
          <span key={i}style={{ width: bar * 0.38, height: bar * 0.38, borderRadius: '50%', background: c, border: `${Math.max(1.5, k * 0.3)}px solid ${p.ink}`, flex: 'none' }} />
        ))}
        <span style={{ marginLeft: bar * 0.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.windowTitle}</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: bar + Math.max(2, k * 0.5) }}>
        <Arena p={p} />
      </div>
    </div>
  );
}

function Leaderboard({ left, top, w, k, p }: { left: number; top: number; w: number; k: number; p: P }) {
  const rows: [string, string, string][] = [
    ['1', 'NOVA_K', '12,480'],
    ['2', 'PIXELWITCH', '11,920'],
    ['3', 'YOU', '9,310'],
  ];
  const fs = w * 0.068;
  return (
    <div style={{ position: 'absolute', left, top, width: w, ...brut(p, k, p.panel), padding: `${fs * 0.7}px ${fs * 0.9}px`, fontFamily: FONTS.chakra, color: p.ink, rotate: '-2deg' }}>
      <div style={{ fontSize: fs * 0.8, fontWeight: 700, letterSpacing: '0.24em', marginBottom: fs * 0.4 }}>LIVE LEADERBOARD</div>
      {rows.map(([n, name, score]) => {
        const me = name === 'YOU';
        return (
          <div
            key={n}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: fs * 0.6,
              fontSize: fs,
              fontWeight: 700,
              padding: `${fs * 0.18}px ${fs * 0.35}px`,
              marginInline: -fs * 0.35,
              background: me ? p.accent : 'transparent',
              border: me ? `${Math.max(1.5, k * 0.35)}px solid ${p.ink}` : '1.5px solid transparent',
              color: me && lum(p.accent) < 120 ? '#FFFDF2' : p.ink,
            }}
          >
            <span style={{ width: fs * 0.9 }}>{n}</span>
            <span style={{ flex: 1 }}>{name}</span>
            <span>{score}</span>
          </div>
        );
      })}
    </div>
  );
}

function Sticker({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: P }) {
  if (!p.sticker) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        ...brut(p, r * 0.08, p.accent),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        rotate: '12deg',
        color: lum(p.accent) < 120 ? '#FFFDF2' : '#000000',
        textAlign: 'center',
      }}
    >
      <div style={{ ...displayFace('dela'), fontSize: r * 0.78, lineHeight: 0.9 }}>{p.sticker}</div>
      <div style={{ fontFamily: FONTS.chakra, fontWeight: 700, fontSize: r * 0.17, letterSpacing: '0.12em', textTransform: 'uppercase', maxWidth: r * 1.5, lineHeight: 1.1, marginTop: r * 0.06 }}>{p.stickerLabel}</div>
    </div>
  );
}

export default function SeasonLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = lum(p.background) < 110;
  const k = Math.min(W, H) / 90; // shadow / border unit

  // Hero window box
  const win = stacked
    ? { x: W * 0.08, y: H * 0.07, w: W * 0.84, h: H * 0.44 }
    : strip
      ? { x: W * 0.6, y: H * 0.14, w: W * 0.36, h: H * 0.7 }
      : { x: W * 0.53, y: H * 0.12, w: W * 0.42, h: H * 0.66 };

  // Copy column
  const pad = stacked ? W * 0.08 : strip ? H * 0.16 : Math.max(W * 0.055, H * 0.09);
  const colW = stacked ? W - pad * 2 : strip ? W * 0.52 : W * 0.47 - pad * 0.4;
  const len = Math.max(6, p.headline.length);
  const head = Math.min(stacked ? H * 0.13 : strip ? H * 0.3 : H * 0.2, colW / (len * 0.9));
  const small = Math.max(13, stacked ? W * 0.026 : strip ? H * 0.06 : H * 0.034);
  const sh = Math.max(3, head * 0.07);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.12 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,255,255' : '0,0,0', fade: 1.2 }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={[]}
        grain={0.04}
        vignette={dark ? 0.4 : 0}
      />
      {/* Big panel block bleeding off the edge behind the window (the 30%). */}
      <div
        style={{
          position: 'absolute',
          ...(stacked ? { left: -k * 2, right: -k * 2, top: -k * 2, height: win.y + win.h * 0.72 } : { top: -k * 2, bottom: -k * 2, left: win.x + win.w * 0.28, right: -k * 2 }),
          background: p.panel,
          borderLeft: stacked ? undefined : `${Math.max(2, k * 0.5)}px solid ${p.ink}`,
          borderBottom: stacked ? `${Math.max(2, k * 0.5)}px solid ${p.ink}` : undefined,
        }}
      />
      {/* Particle trio confetti on the panel */}
      {Array.from({ length: strip ? 6 : 10 }, (_, i) => {
        const c = [p.accent, p.accent2, p.pop][i % 3];
        const r = k * (0.9 + rand(i * 2.7) * 1.4);
        const x = stacked ? rand(i * 4.1) * W : win.x + win.w * 0.3 + rand(i * 4.1) * (W - win.x - win.w * 0.3);
        const y = stacked ? rand(i * 7.3) * (win.y + win.h * 0.7) : rand(i * 7.3) * H;
        return <div key={i} style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: c, border: `${Math.max(1.5, k * 0.35)}px solid ${p.ink}` }} />;
      })}

      <GameWindow {...win} k={k} p={p} />
      {p.leaderboard && !strip && (
        <Leaderboard left={stacked ? win.x + win.w * 0.56 : win.x - win.w * 0.12} top={stacked ? win.y + win.h * 0.7 : win.y + win.h * 0.72} w={stacked ? win.w * 0.42 : win.w * 0.46} k={k} p={p} />
      )}
      <Sticker cx={win.x + win.w - (strip ? 0 : k * 2)} cy={win.y + (strip ? H * 0.12 : k * 3)} r={strip ? H * 0.16 : Math.min(W, H) * 0.1} p={p} />

      {/* Copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: H * 0.58, bottom: H * 0.05, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.7 }}>
          {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, objectFit: 'contain' }} />}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              padding: `${small * 0.3}px ${small * 0.7}px`,
              ...brut(p, Math.max(2, small * 0.18), p.background),
              fontFamily: FONTS.chakra,
              fontWeight: 700,
              fontSize: small * 0.82,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop, border: `1.5px solid ${p.ink}` }} />
            {p.eyebrow}
          </span>
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 0.92,
            letterSpacing: '-0.02em',
            marginTop: small * 0.7,
            color: p.ink,
            textShadow: `${sh}px ${sh}px 0 ${p.accent}`,
            whiteSpace: 'nowrap',
          }}
        >
          {p.headline}
        </div>
        {!strip && p.body && (
          <div style={{ fontSize: small * 1.05, lineHeight: 1.4, marginTop: small * 0.9, maxWidth: colW * 0.92, fontWeight: 500 }}>{p.body}</div>
        )}
        {p.cta && (
          <div style={{ display: 'flex', marginTop: small * (strip ? 0.8 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.1}px`,
                ...brut(p, Math.max(3, small * 0.28), p.accent),
                fontFamily: FONTS.familjen,
                fontWeight: 700,
                fontSize: small * 0.98,
                color: lum(p.accent) < 120 ? '#FFFDF2' : '#000000',
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
