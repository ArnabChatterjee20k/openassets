import type { CSSProperties, ReactNode } from 'react';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'High-Score Results',
  description:
    'Customer-results banner for Multiball: a giant arcade "5.4×" ROAS headline beside an 8-bit HI-SCORE cabinet that ranks ad platforms by return, with budget bars shifting to the winners.',
  tags: ['results', 'case study', 'social proof', 'leaderboard', 'arcade', 'memphis', 'ad agent'],
};

export const schema = z.object({
  eyebrow: text().default('Case study · Lumen Skin'),
  stat: text('Hero stat').default('5.4x'),
  statLine: text('Stat caption').default('ROAS in 30 days'),
  body: textarea().default('Multiball moved 71% of their budget to the four platforms that were scoring, without a single manual bid change.'),
  cta: text('Button (empty to hide)').default('Read the story'),
  boardTitle: text('Board title').default('HI-SCORE'),
  boardSub: text('Board subtitle').default('ROAS · LAST 30 DAYS'),
  row1: text('Rank 1 platform').default('TIKTOK'),
  score1: text('Rank 1 score').default('7.9x'),
  row2: text('Rank 2 platform').default('META'),
  score2: text('Rank 2 score').default('6.2x'),
  row3: text('Rank 3 platform').default('GOOGLE'),
  score3: text('Rank 3 score').default('4.8x'),
  row4: text('Rank 4 platform').default('PINTEREST'),
  score4: text('Rank 4 score').default('3.1x'),
  row5: text('Rank 5 platform').default('SNAP'),
  score5: text('Rank 5 score').default('1.2x'),
  background: color().default('#FFF6E9'),
  surface: color('Panel').default('#FFE3D3'),
  ink: color('Ink').default('#1A1A2E'),
  accent: color().default('#FF6F91'),
  accent2: color('Second color').default('#00B3A4'),
  pop: color('Pop').default('#FFC93C'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  brutalist: { background: '#FFFDF2', surface: '#FFE45C', ink: '#111111', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#00D1A0' },
  riso: {
    background: '#F4EFE6', surface: '#EAE2D3', ink: '#1F2A6B', accent: '#FF48B0', accent2: '#0078BF', pop: '#FFE800',
    eyebrow: 'Case study · Paloma Coffee', stat: '-41%', statLine: 'Cost per order', body: 'Paloma let the agent rebalance 22 platforms every hour. Orders went up, CPA came down.',
    boardSub: 'ORDERS · NOV', score1: '2,410', score2: '1,880', score3: '1,302', score4: '760', score5: '214',
  },
  citrus: {
    background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F',
    eyebrow: 'Black Friday recap', stat: '3.2M', statLine: 'Revenue in 4 days', cta: 'See the playbook',
    row1: 'AMAZON', row2: 'META', row3: 'TIKTOK', row4: 'GOOGLE', row5: 'REDDIT',
  },
  candy: { background: '#FDF3F8', surface: '#F7DDEB', ink: '#3A1F4A', accent: '#FF7EB6', accent2: '#8A7BFF', pop: '#4FD1C5', eyebrow: 'Case study · Bloomkid', stat: '9.1x', statLine: 'ROAS on CTV' },
  'after-dark': { background: '#12001F', surface: '#24003D', ink: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', cta: 'Get your score' },
};

type P = z.infer<typeof schema> & BannerSize;

const NABLA_CSS = `@font-palette-values --mb-flat { font-family: 'Nabla'; override-colors: ${Array.from({ length: 32 }, (_, i) => `${i} currentColor`).join(', ')}; }`;

function arcade(face: string, side: string, size: number): CSSProperties {
  const depth = Math.max(3, Math.round(size * 0.07));
  return {
    fontFamily: FONTS.nabla,
    fontPalette: '--mb-flat',
    color: face,
    textShadow: Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`).join(', '),
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    lineHeight: 0.9,
  } as CSSProperties;
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Board viewBox width; height depends on how many rows are shown. */
const BOARD_W = 480;
const boardH = (rows: number) => 150 + rows * 62 + 40;

/** The hero: an arcade cabinet screen ranking platforms like a high-score table. */
function Board({ p, rows, id }: { p: P; rows: number; id: string }) {
  const H = boardH(rows);
  const dark = isDark(p.background);
  const screen = dark ? '#0A0012' : p.ink;
  const lit = dark ? p.ink : p.background; // text on the screen
  const data = [
    [p.row1, p.score1],
    [p.row2, p.score2],
    [p.row3, p.score3],
    [p.row4, p.score4],
    [p.row5, p.score5],
  ].slice(0, rows);
  const share = [0.94, 0.72, 0.55, 0.3, 0.12];
  const trend = ['▲', '▲', '▲', '▼', '▼'];
  const rankCols = [p.pop, p.accent, p.accent2, lit, lit];
  const ranks = ['1ST', '2ND', '3RD', '4TH', '5TH'];
  const sx = 40;
  const sw = BOARD_W - 80;
  const sy = 96;
  const sh = H - sy - 40;
  return (
    <svg viewBox={`-14 -40 ${BOARD_W + 40} ${H + 70}`} width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <radialGradient id={`${id}-ball`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#D9DCE4" />
          <stop offset="1" stopColor="#7C8296" />
        </radialGradient>
        <pattern id={`${id}-scan`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="2" fill={hexA(lit, 0.04)} />
        </pattern>
        <radialGradient id={`${id}-glass`} cx="0.3" cy="0.15" r="0.9">
          <stop offset="0" stopColor={hexA(lit, 0.12)} />
          <stop offset="0.6" stopColor={hexA(lit, 0)} />
        </radialGradient>
        <pattern id={`${id}-hatch`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="12" height="12" fill={p.accent} />
          <rect width="5" height="12" fill={hexA(p.ink, 0.22)} />
        </pattern>
      </defs>
      {/* cabinet bezel: hard ink shadow, pink laminate, hatched marquee */}
      <rect x="16" y="16" width={BOARD_W} height={H} rx="36" fill={p.ink} />
      <rect x="0" y="0" width={BOARD_W} height={H} rx="36" fill={p.surface} stroke={p.ink} strokeWidth="6" />
      <path d={`M36,0 H${BOARD_W - 36} A36,36 0 0 1 ${BOARD_W},36 V78 H0 V36 A36,36 0 0 1 36,0 Z`} fill={`url(#${id}-hatch)`} stroke={p.ink} strokeWidth="6" />
      <text x={sx} y="50" fontFamily={FONTS.pressstart} fontSize="22" fill={p.ink}>
        {p.boardTitle}
      </text>
      <text x={BOARD_W - sx} y="50" textAnchor="end" fontFamily={FONTS.pressstart} fontSize={Math.min(10, Math.floor(180 / Math.max(1, p.boardSub.length)))} fill={p.ink}>
        {p.boardSub}
      </text>
      {/* marquee bulbs */}
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={sx + 8 + i * ((sw - 16) / 8)} cy="88" r="4.5" fill={i % 2 ? p.pop : '#ffffff'} stroke={p.ink} strokeWidth="2" />
      ))}
      {/* screen */}
      <rect x={sx} y={sy} width={sw} height={sh} rx="18" fill={screen} stroke={p.ink} strokeWidth="5" />
      <rect x={sx} y={sy} width={sw} height={sh} rx="18" fill={`url(#${id}-scan)`} />
      <text x={sx + 22} y={sy + 34} fontFamily={FONTS.pressstart} fontSize="11" fill={hexA(lit, 0.55)}>
        RANK
      </text>
      <text x={sx + 104} y={sy + 34} fontFamily={FONTS.pressstart} fontSize="11" fill={hexA(lit, 0.55)}>
        PLATFORM
      </text>
      <text x={sx + sw - 22} y={sy + 34} textAnchor="end" fontFamily={FONTS.pressstart} fontSize="11" fill={hexA(lit, 0.55)}>
        SCORE
      </text>
      {data.map(([name, score], i) => {
        const y = sy + 58 + i * 62;
        const barMax = sw - 104 - 22;
        const top = i === 0;
        return (
          <g key={i}>
            {top && <rect x={sx + 10} y={y - 6} width={sw - 20} height={54} rx="10" fill={hexA(p.pop, 0.16)} stroke={p.pop} strokeWidth="2.5" strokeDasharray="6 6" />}
            <text x={sx + 22} y={y + 22} fontFamily={FONTS.pressstart} fontSize="14" fill={rankCols[i]}>
              {ranks[i]}
            </text>
            <text x={sx + 104} y={y + 22} fontFamily={FONTS.pressstart} fontSize={Math.min(16, Math.floor(150 / Math.max(6, name.length)))} fill={lit}>
              {name}
            </text>
            <text x={sx + sw - 22} y={y + 22} textAnchor="end" fontFamily={FONTS.pressstart} fontSize="16" fill={top ? p.pop : lit}>
              {score}
            </text>
            {/* budget share bar: pixel segments */}
            {Array.from({ length: 16 }, (_, k) => {
              const on = k / 16 < share[i];
              return <rect key={k} x={sx + 104 + k * (barMax / 16)} y={y + 33} width={barMax / 16 - 3} height="8" fill={on ? (i < 3 ? p.accent2 : p.accent) : hexA(lit, 0.1)} />;
            })}
            <text x={sx + 104 - 12} y={y + 42} textAnchor="end" fontFamily={FONTS.pressstart} fontSize="9" fill={i < 3 ? p.accent2 : p.accent}>
              {trend[i]}
            </text>
          </g>
        );
      })}
      <rect x={sx} y={sy} width={sw} height={sh} rx="18" fill={`url(#${id}-glass)`} />
      {/* P1 cursor on the leader */}
      <path d={`M${sx - 4},${sy + 70} l-22,-12 v24 Z`} fill={p.pop} stroke={p.ink} strokeWidth="3" strokeLinejoin="round" />
      {/* the ball, resting on the bezel's top-right corner with a glint */}
      <circle cx={BOARD_W - 18 + 5} cy={-14 + 6} r="26" fill={p.ink} />
      <circle cx={BOARD_W - 18} cy={-14} r="26" fill={`url(#${id}-ball)`} stroke={p.ink} strokeWidth="5" />
      <circle cx={BOARD_W - 27} cy={-23} r="6" fill={p.pop} />
      {/* star burst on the marquee */}
      <g transform={`translate(${-6} ${-10}) rotate(-12)`}>
        <path d="M0,-26 L7,-8 L26,0 L7,8 L0,26 L-7,8 L-26,0 L-7,-8 Z" fill={p.pop} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function Confetti({ W, H, p, avoid }: { W: number; H: number; p: P; avoid: { x0: number; x1: number; y0: number; y1: number }[] }) {
  const s = Math.min(W, H) * 0.055;
  const cols = [p.accent, p.accent2, p.pop, p.ink];
  const items: ReactNode[] = [];
  for (let i = 0; i < 22; i++) {
    const x = rand(i * 4.3 + 7) * W;
    const y = rand(i * 8.7 + 3) * H;
    if (avoid.some((a) => x > a.x0 && x < a.x1 && y > a.y0 && y < a.y1)) continue;
    const c = cols[i % 4];
    const rot = rand(i * 5.9) * 360;
    const k = s * (0.6 + rand(i * 2.7) * 0.6);
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

export default function HighScoreResults(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const rows = strip ? 3 : 5;

  // Board box (keeps its own aspect incl. shadow/overhang margins).
  const vbW = BOARD_W + 40;
  const vbH = boardH(rows) + 70;
  const ratio = vbW / vbH;
  let bH = stacked ? H * 0.43 : strip ? H * 0.9 : H * 0.86;
  let bW = bH * ratio;
  const maxW = stacked ? W * 0.8 : W * 0.43;
  if (bW > maxW) {
    bW = maxW;
    bH = bW / ratio;
  }
  const bX = stacked ? (W - bW) / 2 : W - bW - (strip ? W * 0.05 : Math.max(W * 0.05, H * 0.07));
  const bY = stacked ? H * 0.05 : (H - bH) / 2 + (strip ? H * 0.02 : 0);
  const rot = stacked ? 3 : 4;

  // Copy column.
  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : bX - pad * 2.1;
  const small = Math.max(15, stacked ? W * 0.03 : H * (strip ? 0.07 : 0.045));
  const label = Math.max(10, Math.round(small * 0.62));
  // The strip sets the stat beside a small stack (eyebrow, caption, CTA), so each gets about half the column.
  const statW = strip ? colW * 0.48 : colW;
  const lineW = strip ? colW * 0.48 : colW;
  const statSize = Math.min(stacked ? H * 0.16 : H * (strip ? 0.5 : 0.34), statW / (Math.max(3, p.stat.length) * 0.74));
  const lineSize = Math.min(small * (strip ? 0.85 : 1.15), lineW / (Math.max(8, p.statLine.length) * 0.82));

  const avoidCopy = stacked ? { x0: pad * 0.4, x1: W - pad * 0.4, y0: H * 0.48, y1: H } : { x0: 0, x1: pad + colW + pad * 0.3, y0: H * 0.06, y1: H * 0.94 };
  const avoidBoard = { x0: bX, x1: bX + bW, y0: bY, y1: bY + bH };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.rubikmono }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.12 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,255,255' : '26,26,46', fade: 0.95 }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)'}
        glows={dark ? [{ x: bX + bW / 2, y: bY + bH / 2, size: bH * 1.6, color: hexA(p.accent, 0.35), opacity: 0.8 }] : []}
        grain={0.035}
        vignette={dark ? 0.45 : 0.06}
      />
      {/* Memphis blocks behind the cabinet */}
      <div style={{ position: 'absolute', left: bX - bW * 0.16, top: bY + bH * 0.5, width: bW * 0.5, height: bW * 0.5, borderRadius: '50%', background: p.accent2, opacity: dark ? 0.55 : 0.9 }} />
      <div style={{ position: 'absolute', left: bX + bW * 0.62, top: bY - bH * 0.06, width: bW * 0.48, height: bW * 0.3, background: p.pop, rotate: '-10deg', opacity: dark ? 0.6 : 1 }} />
      <Confetti W={W} H={H} p={p} avoid={[avoidCopy, avoidBoard]} />

      <div style={{ position: 'absolute', left: bX, top: bY, width: bW, height: bH, rotate: `${rot}deg` }}>
        <Board p={p} rows={rows} id="hs" />
      </div>

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.535, textAlign: 'center' as const, alignItems: 'center' } : { top: 0, bottom: 0, justifyContent: 'center' }),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {p.logo && !strip && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        {strip ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: colW * 0.05 }}>
            <div style={{ ...arcade(p.accent, p.ink, statSize), fontSize: statSize, paddingBottom: statSize * 0.08 }}>{p.stat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: small * 0.55 }}>
              {p.logo && <img src={p.logo} alt="" style={{ height: small * 1.4, objectFit: 'contain' }} />}
              {p.eyebrow && (
                <span style={{ padding: `${label * 0.6}px ${label * 0.9}px`, background: p.pop, color: isDark(p.pop) ? p.background : p.ink, border: `2px solid ${p.ink}`, boxShadow: `${label * 0.3}px ${label * 0.3}px 0 ${p.ink}`, fontFamily: FONTS.pressstart, fontSize: Math.round(label * 0.85), textTransform: 'uppercase', rotate: '-2deg', whiteSpace: 'nowrap' }}>
                  {p.eyebrow}
                </span>
              )}
              <div style={{ fontSize: lineSize, textTransform: 'uppercase', whiteSpace: 'nowrap', color: p.ink }}>{p.statLine}</div>
              {p.cta && (
                <span style={{ padding: `${small * 0.45}px ${small * 0.9}px`, borderRadius: 999, background: p.accent2, color: isDark(p.accent2) ? '#FFFFFF' : p.ink, border: `2px solid ${p.ink}`, boxShadow: `${small * 0.2}px ${small * 0.2}px 0 ${p.ink}`, fontSize: small * 0.56, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {p.cta} ▸
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
        {p.eyebrow && (
          <span
            style={{
              alignSelf: stacked ? 'center' : 'flex-start',
              padding: `${label * 0.7}px ${label}px`,
              background: p.pop,
              color: isDark(p.pop) ? p.background : p.ink,
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
        <div style={{ ...arcade(p.accent, p.ink, statSize), fontSize: statSize, marginTop: small * (strip ? 0.5 : 0.8), marginLeft: stacked ? 0 : -statSize * 0.04 }}>{p.stat}</div>
        <div style={{ fontSize: lineSize, textTransform: 'uppercase', whiteSpace: 'nowrap', marginTop: statSize * 0.16 + small * 0.2, color: p.ink, letterSpacing: '-0.01em' }}>
          {p.statLine}
        </div>
        {!strip && p.body && (
          <div style={{ fontFamily: FONTS.rubikmono, fontSize: small * 0.56, lineHeight: 1.55, marginTop: small * 0.8, maxWidth: colW * 0.95, textTransform: 'uppercase', color: p.ink, opacity: 0.85 }}>{p.body}</div>
        )}
        {p.cta && (
          <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.6 : 1.0) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.1}px`,
                borderRadius: 999,
                background: p.accent2,
                color: isDark(p.accent2) ? '#FFFFFF' : p.ink,
                border: `${Math.max(2, small * 0.12)}px solid ${p.ink}`,
                boxShadow: `${small * 0.22}px ${small * 0.22}px 0 ${p.ink}`,
                fontSize: small * 0.62,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta} ▸
            </span>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
