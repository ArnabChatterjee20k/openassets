import type { CSSProperties, ReactNode } from 'react';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, hexA, rand, shade } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Platform Launch',
  description:
    'Launch banner for Multiball, the AI ad agent: a chunky arcade headline beside a Memphis pinball playfield whose bumpers are ad platforms, with a ball mid-ricochet and an 8-bit HI-SCORE chip.',
  tags: ['launch', 'social', 'hero', 'pinball', 'memphis', 'ad agent'],
};

export const schema = z.object({
  eyebrow: text().default('New · AI ad agent'),
  line1: text('Headline line 1').default('34 platforms.'),
  line2: text('Headline line 2').default('One player.'),
  body: textarea().default('Multiball launches, tests and re-budgets your ads on Meta, TikTok, Google, Amazon and 30 more. All at once.'),
  cta: text('Button (empty to hide)').default('Start free trial'),
  scoreLabel: text('Score label').default('HI-SCORE'),
  score: text('Score').default('ROAS 4.8x'),
  bumper1: text('Bumper 1').default('META'),
  bumper2: text('Bumper 2').default('TIKTOK'),
  bumper3: text('Bumper 3').default('GOOGLE'),
  bumper4: text('Bumper 4').default('AMAZON'),
  background: color().default('#FFF6E9'),
  surface: color('Playfield').default('#FFE3D3'),
  ink: color('Ink').default('#1A1A2E'),
  accent: color().default('#FF6F91'),
  accent2: color('Second color').default('#00B3A4'),
  pop: color('Pop').default('#FFC93C'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  brutalist: { background: '#FFFDF2', surface: '#FFE45C', ink: '#111111', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#00D1A0' },
  riso: { background: '#F4EFE6', surface: '#EAE2D3', ink: '#1F2A6B', accent: '#FF48B0', accent2: '#0078BF', pop: '#FFE800', line1: 'Every feed.', line2: 'One agent.' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', score: 'CPA -38%', eyebrow: 'Black Friday ready' },
  'after-dark': { background: '#12001F', surface: '#24003D', ink: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', cta: 'Join the beta' },
};

type P = z.infer<typeof schema> & BannerSize;

/** Nabla's COLR layers forced to one colour (renders the same everywhere); depth comes from our own extrusion. */
const NABLA_CSS = `@font-palette-values --mb-flat { font-family: 'Nabla'; override-colors: ${Array.from({ length: 32 }, (_, i) => `${i} currentColor`).join(', ')}; }`;

/** Chunky arcade lettering: face colour + a stacked-shadow isometric extrusion in ink. */
function arcade(face: string, side: string, size: number): CSSProperties {
  const depth = Math.max(3, Math.round(size * 0.08));
  return {
    fontFamily: FONTS.nabla,
    fontPalette: '--mb-flat',
    color: face,
    textShadow: Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`).join(', '),
    textTransform: 'uppercase',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
  } as CSSProperties;
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** The hero: a Memphis pinball playfield in a fixed 400×480 coordinate space. */
function Playfield({ p, id }: { p: P; id: string }) {
  const ink = p.ink;
  const bumpers: { x: number; y: number; c: string; label: string }[] = [
    { x: 200, y: 128, c: p.accent, label: p.bumper1 },
    { x: 112, y: 222, c: p.accent2, label: p.bumper2 },
    { x: 288, y: 222, c: p.pop, label: p.bumper3 },
    { x: 200, y: 318, c: p.accent, label: p.bumper4 },
  ];
  const ballX = 258;
  const ballY = 168;
  return (
    <svg viewBox="-12 -12 436 508" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <radialGradient id={`${id}-ball`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#D9DCE4" />
          <stop offset="1" stopColor="#7C8296" />
        </radialGradient>
        <pattern id={`${id}-hatch`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="10" fill={p.surface} />
          <rect width="4" height="10" fill={hexA(p.accent2, 0.35)} />
        </pattern>
        <pattern id={`${id}-dots`} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="2" fill={hexA(ink, 0.18)} />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width="400" height="480" rx="44" />
        </clipPath>
      </defs>
      {/* hard offset shadow + cabinet */}
      <rect x="14" y="14" width="400" height="480" rx="44" fill={ink} />
      <rect x="0" y="0" width="400" height="480" rx="44" fill={p.surface} stroke={ink} strokeWidth="6" />
      <g clipPath={`url(#${id}-clip)`}>
        {/* laminate: dotted field, hatched corner, teal wedge */}
        <rect x="0" y="0" width="400" height="480" fill={`url(#${id}-dots)`} />
        <path d="M0,330 L0,480 L120,480 Z" fill={`url(#${id}-hatch)`} />
        <path d="M400,0 L400,120 L300,0 Z" fill={p.accent2} opacity="0.9" />
        <circle cx="40" cy="60" r="52" fill={hexA(p.pop, 0.55)} />
        {/* plunger lane on the right */}
        <path d="M352,480 L352,110 Q352,40 290,30" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
        <rect x="364" y="400" width="20" height="60" rx="6" fill={p.accent} stroke={ink} strokeWidth="4" />
        {/* top lanes with lane lights */}
        {[125, 175, 225, 275].map((x) => (
          <line key={x} x1={x} y1="22" x2={x} y2="50" stroke={ink} strokeWidth="5" strokeLinecap="round" />
        ))}
        {[150, 200, 250].map((x, i) => (
          <rect key={x} x={x - 7} y="50" width="14" height="14" transform={`rotate(45 ${x} 57)`} fill={i === 1 ? p.pop : '#ffffff'} stroke={ink} strokeWidth="3" />
        ))}
        {/* ball trajectory: from the plunger, off two bumpers */}
        <path d={`M368,396 L368,120 Q366,60 316,58 L${bumpers[0].x + 34},${bumpers[0].y - 14} L${bumpers[2].x - 22},${bumpers[2].y - 40} L${ballX},${ballY}`} fill="none" stroke={ink} strokeWidth="3.5" strokeDasharray="2 10" strokeLinecap="round" />
        {/* slingshots */}
        <path d="M58,330 L58,400 L112,428 Z" fill={p.accent2} stroke={ink} strokeWidth="5" strokeLinejoin="round" />
        <path d="M342,330 L342,400 L288,428 Z" fill={p.accent2} stroke={ink} strokeWidth="5" strokeLinejoin="round" />
        {/* flippers */}
        <path d="M100,430 L176,462 a10,10 0 0 1 -6,18 L94,454 a14,14 0 0 1 6,-24 Z" fill={p.accent} stroke={ink} strokeWidth="5" strokeLinejoin="round" />
        <path d="M300,430 L224,462 a10,10 0 0 0 6,18 L306,454 a14,14 0 0 0 -6,-24 Z" fill={p.accent} stroke={ink} strokeWidth="5" strokeLinejoin="round" />
      </g>
      {/* bumpers: ink skirt, coloured cap, white top with the platform label */}
      {bumpers.map((b, i) => {
        const r = 44;
        // Labels sit on white caps: use whichever of ink / background is dark.
        const tc = isDark(ink) ? ink : p.background;
        // Press Start glyphs are 1em square: fit the label inside the white cap.
        const size = Math.min(12, Math.floor(52 / Math.max(1, b.label.length)));
        return (
          <g key={i}>
            {i === 0 && <circle cx={b.x} cy={b.y} r={r + 22} fill="none" stroke={p.pop} strokeWidth="6" strokeDasharray="4 10" strokeLinecap="round" />}
            <ellipse cx={b.x + 6} cy={b.y + 10} rx={r} ry={r} fill={ink} />
            <circle cx={b.x} cy={b.y} r={r} fill={b.c} stroke={ink} strokeWidth="5" />
            <circle cx={b.x} cy={b.y} r={r * 0.72} fill="#ffffff" stroke={ink} strokeWidth="4" />
            <text x={b.x} y={b.y + size / 2} textAnchor="middle" fontFamily={FONTS.pressstart} fontSize={size} fill={tc}>
              {b.label}
            </text>
          </g>
        );
      })}
      {/* hit spark + score pop at the top bumper */}
      <g transform={`translate(${bumpers[0].x + 52} ${bumpers[0].y - 44})`}>
        <path d="M0,-18 L5,-5 L18,0 L5,5 L0,18 L-5,5 L-18,0 L-5,-5 Z" fill={p.pop} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <text x={bumpers[0].x - 120} y={bumpers[0].y - 46} fontFamily={FONTS.pressstart} fontSize="14" fill={ink}>
        +1,000
      </text>
      {/* the ball, with speed lines */}
      {[0, 1, 2].map((k) => (
        <line key={k} x1={ballX - 26 - k * 2} y1={ballY - 26 + k * 12} x2={ballX - 52 - k * 8} y2={ballY - 44 + k * 10} stroke={ink} strokeWidth="4" strokeLinecap="round" opacity={1 - k * 0.25} />
      ))}
      <circle cx={ballX + 4} cy={ballY + 6} r="17" fill={ink} />
      <circle cx={ballX} cy={ballY} r="17" fill={`url(#${id}-ball)`} stroke={ink} strokeWidth="4" />
      <circle cx={ballX - 6} cy={ballY - 6} r="4" fill={p.pop} />
    </svg>
  );
}

/** Memphis confetti: squiggles, triangles, rings and dots, placed in banner-relative coordinates. */
function Confetti({ W, H, p, avoid }: { W: number; H: number; p: P; avoid: { x0: number; x1: number; y0: number; y1: number } }) {
  const s = Math.min(W, H) * 0.06;
  const cols = [p.accent, p.accent2, p.pop, p.ink];
  const items: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const x = rand(i * 3.7 + 1) * W;
    const y = rand(i * 9.1 + 2) * H;
    if (x > avoid.x0 && x < avoid.x1 && y > avoid.y0 && y < avoid.y1) continue;
    const c = cols[i % 4];
    const rot = rand(i * 5.3) * 360;
    const k = s * (0.6 + rand(i * 2.2) * 0.6);
    const kind = i % 4;
    items.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${k / 20})`}>
        {kind === 0 && <path d="M-24,0 q6,-10 12,0 t12,0 t12,0 t12,0" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" />}
        {kind === 1 && <path d="M0,-12 L12,10 L-12,10 Z" fill={c} stroke={p.ink} strokeWidth="2.5" strokeLinejoin="round" />}
        {kind === 2 && <circle r="9" fill="none" stroke={c} strokeWidth="5" />}
        {kind === 3 && <rect x="-3" y="-14" width="6" height="28" rx="3" fill={c} />}
      </g>,
    );
  }
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      {items}
    </svg>
  );
}

export default function PlatformLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  // Playfield box (400×480 aspect + shadow margin).
  const ratio = 436 / 508;
  const pfH = stacked ? H * 0.42 : strip ? H * 1.55 : H * 0.84;
  const pfW = pfH * ratio;
  const pfX = stacked ? (W - pfW) / 2 : W - pfW - (strip ? W * 0.07 : Math.max(W * 0.06, H * 0.08));
  const pfY = stacked ? H * 0.05 : strip ? H * 0.12 : (H - pfH) / 2;
  const rot = stacked ? -4 : -6;

  // Copy column.
  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : pfX - pad * 1.6;
  const longest = Math.max(p.line1.length, p.line2.length, 6);
  const head = Math.min(stacked ? W * 0.082 : H * (strip ? 0.21 : 0.16), colW / (longest * 0.64));
  // Body/CTA scale from the banner's short side so copy stays legible however long the headline is.
  const small = Math.max(15, stacked ? W * 0.03 : H * (strip ? 0.07 : 0.045));
  const label = Math.max(10, Math.round(small * 0.62));

  // HI-SCORE chip, anchored by its right edge to the playfield's right side.
  const chipRight = stacked ? W - (pfX + pfW) - pfW * 0.62 : strip ? W - (pfX + pfW) + pfW * 0.05 : W - (pfX + pfW) - pfW * 0.02;
  const chipTop = stacked ? pfY + pfH * 0.7 : strip ? H * 0.08 : pfY + pfH * 0.76;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.rubikmono }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.12 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,255,255' : '26,26,46', fade: 0.95 }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)'}
        glows={dark ? [{ x: pfX + pfW / 2, y: pfY + pfH / 2, size: pfH * 1.6, color: hexA(p.accent, 0.35), opacity: 0.8 }] : []}
        grain={0.035}
        vignette={dark ? 0.45 : 0.06}
      />
      {/* big Memphis blocks behind the playfield */}
      <div style={{ position: 'absolute', left: pfX + pfW * 0.55, top: pfY - pfH * 0.08, width: pfW * 0.75, height: pfW * 0.75, borderRadius: '50%', background: p.accent2, opacity: dark ? 0.5 : 0.9 }} />
      <div
        style={{
          position: 'absolute',
          left: pfX - pfW * 0.22,
          top: pfY + pfH * 0.62,
          width: pfW * 0.5,
          height: pfW * 0.5,
          background: `repeating-linear-gradient(45deg, ${p.ink} 0 ${Math.max(2, pfW * 0.012)}px, transparent ${Math.max(2, pfW * 0.012)}px ${Math.max(6, pfW * 0.04)}px)`,
          opacity: 0.5,
          rotate: '12deg',
        }}
      />
      <Confetti W={W} H={H} p={p} avoid={stacked ? { x0: pad * 0.5, x1: W - pad * 0.5, y0: H * 0.58, y1: H } : { x0: 0, x1: pad + colW + pad * 0.3, y0: H * 0.08, y1: H * 0.92 }} />

      <div style={{ position: 'absolute', left: pfX, top: pfY, width: pfW, height: pfH, rotate: `${rot}deg` }}>
        <Playfield p={p} id="pl" />
      </div>

      {p.score && (
        <div
          style={{
            position: 'absolute',
            right: chipRight,
            top: chipTop,
            rotate: '4deg',
            padding: `${label * 0.9}px ${label * 1.2}px`,
            background: dark ? p.background : p.ink,
            border: `${Math.max(2, label * 0.25)}px solid ${p.ink}`,
            borderRadius: label * 0.6,
            boxShadow: `${label * 0.5}px ${label * 0.5}px 0 ${p.accent}`,
            fontFamily: FONTS.pressstart,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: Math.round(label * 0.8), color: p.accent2, letterSpacing: '0.1em' }}>{p.scoreLabel}</div>
          <div style={{ fontSize: Math.round(label * 1.5), color: p.pop, marginTop: label * 0.6 }}>{p.score}</div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.5, textAlign: 'center' as const, alignItems: 'center' } : { top: 0, bottom: 0, justifyContent: 'center' }),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        {p.eyebrow && (
          <span
            style={{
              alignSelf: stacked ? 'center' : 'flex-start',
              padding: `${label * 0.7}px ${label}px`,
              background: p.pop,
              color: p.ink,
              border: `${Math.max(2, label * 0.22)}px solid ${p.ink}`,
              boxShadow: `${label * 0.35}px ${label * 0.35}px 0 ${p.ink}`,
              fontFamily: FONTS.pressstart,
              fontSize: label,
              textTransform: 'uppercase',
              rotate: '-2deg',
              whiteSpace: 'nowrap',
            }}
          >
            {p.eyebrow}
          </span>
        )}
        <div style={{ marginTop: small * (strip ? 0.6 : 0.9), lineHeight: 1.0 }}>
          <div style={{ ...arcade(p.accent, p.ink, head), fontSize: head }}>{p.line1}</div>
          <div style={{ ...arcade(p.accent2, p.ink, head), fontSize: head, marginTop: head * 0.08 }}>{p.line2}</div>
        </div>
        {!strip && p.body && (
          <div style={{ fontSize: small * 0.66, lineHeight: 1.5, marginTop: small * 0.9, maxWidth: colW * 0.95, textTransform: 'uppercase', color: p.ink, opacity: 0.88 }}>{p.body}</div>
        )}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.1) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.1}px`,
                borderRadius: 999,
                background: p.accent,
                color: isDark(p.accent) ? '#FFFFFF' : p.ink,
                border: `${Math.max(2, small * 0.12)}px solid ${p.ink}`,
                boxShadow: `${small * 0.22}px ${small * 0.22}px 0 ${p.ink}`,
                fontSize: small * 0.66,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta} ▸
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
