import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Holiday Greeting',
  category: 'greeting',
  description:
    'Square holiday card for customers: snow falls on a frozen lake, an ice hole draws itself, and on the beat a tip-up flag springs up in a burst of ice as the greeting lands, followed by a personal line, a message and a signature. Put a team photo in the ice hole.',
  tags: ['holiday', 'greeting', 'christmas', 'winter', 'customers', 'square'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default("Season's greetings · 2026"),
  greeting: text().default('God Jul'),
  recipient: text('Personal line').default('Happy holidays, Northwind team'),
  message: textarea().default('Thanks for trusting us with your feeds this year. We’ll keep the lines warm.'),
  signature: text().default('Ida, Jonas & the Pike crew · pike.ai'),
  photo: image('Team photo in the ice hole (optional)').default(''),
  sky: color('Sky').default('#E9EEF1'),
  ice: color('Ice').default('#D3DDE3'),
  ink: color('Text').default('#17242E'),
  accent: color().default('#2F6F8F'),
  frost: color('Frost').default('#A7C4D4'),
  flag: color('Flag').default('#E4572E'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'polar-night': { sky: '#0B1820', ice: '#1A2C37', ink: '#E9EEF1', accent: '#7FE3C4', frost: '#2F6F8F', flag: '#E4572E' },
  'new-year': { greeting: 'Hej 2027', eyebrow: 'New year · New lines', recipient: 'Happy new year, Fjällräv Studio', message: 'Here’s to a year of flags popping on every channel.', sky: '#F4E9D8', ice: '#E6D3B3', ink: '#2E2A24', accent: '#2C7873', frost: '#C9B48F', flag: '#D96C3D' },
  'cherry-cola': { greeting: 'Cheers', sky: '#2A0A10', ice: '#3F1019', ink: '#FFE8E0', accent: '#F5C6AA', frost: '#6E2433', flag: '#F7B32B', recipient: 'Happy holidays from everyone at Pike' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const HORIZON = 640;

/** Ice shards burst from the hole with drag, then settle and fade. */
function Shards({ frame, at, cx, cy, count, colors }: { frame: number; at: number; cx: number; cy: number; count: number; colors: string[] }) {
  const t = (frame - at) / FPS;
  if (t < 0 || t > 2.2) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 5.71 + k * 2.3 + at);
        const a = -Math.PI / 2 + (r(1) - 0.5) * 2.6;
        const sp = 700 + r(2) * 900;
        const drag = 2.6;
        const dec = (1 - Math.exp(-drag * t)) / drag;
        const g = 900;
        const x = cx + Math.cos(a) * sp * dec;
        const y = cy + Math.sin(a) * sp * dec + (g / drag) * (t - dec);
        const s = 10 + r(3) * 18;
        const fade = 1 - clamp((t - 1.2) / 1);
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s * 0.7, background: colors[i % colors.length], opacity: fade, rotate: `${(r(4) - 0.5) * 900 * t}deg`, clipPath: 'polygon(50% 0, 100% 60%, 30% 100%, 0 40%)' }} />;
      })}
    </>
  );
}

/** The tip-up: cross frame over the hole + a spring staff pivoting at the base. */
function TipUp({ x, y, h, rot, p, scale = 1, arm = 200 }: { x: number; y: number; h: number; rot: number; p: P; scale?: number; arm?: number }) {
  const s = scale;
  const a = arm * s;
  // Cross frame spans past the hole rim; a light core keeps it readable over dark water.
  const bar = (x1: number, y1: number, x2: number, y2: number) => (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.ink} strokeWidth={16 * s} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F4F7F9" strokeWidth={8 * s} strokeLinecap="round" />
    </>
  );
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
      {bar(x - a * 0.42, y - a * 0.2, x + a * 0.42, y + a * 0.2)}
      {bar(x - a, y + a * 0.06, x + a, y - a * 0.06)}
      <g transform={`rotate(${rot} ${x} ${y})`}>
        <line x1={x} y1={y} x2={x} y2={y - h * s} stroke={p.ink} strokeWidth={7 * s} strokeLinecap="round" />
        <path d={`M${x},${y - h * s} L${x + 118 * s},${y - h * s + 34 * s} L${x},${y - h * s + 70 * s} Z`} fill={p.flag} stroke={p.ink} strokeWidth={5 * s} strokeLinejoin="round" />
      </g>
      <circle cx={x} cy={y} r={10 * s} fill={p.ink} />
    </svg>
  );
}

export default function HolidayGreeting(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const dark = isDark(p.sky);
  const hasPhoto = !!p.photo;
  // Open water is always the darkest thing on the ice, whatever the text colour.
  const water = dark ? shadeHex(p.sky, -0.55) : p.ink;

  const HIT = T.beats(2); // flag springs on beat 3
  const SECOND = T.bars(2) + T.beats(1);
  const outro = prog(frame, end - 30, 30, ease.in);
  const push = mix(1, 1.05, prog(frame, 0, end, ease.inOutSoft));
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.1) * (1 - (frame - HIT) / 14) * 6 : 0;

  // the ice hole
  const hx = W / 2;
  const hy = hasPhoto ? 820 : 850;
  const rx = hasPhoto ? 175 : 150;
  const ry = hasPhoto ? 98 : 52;
  const draw = prog(frame, T.beats(1) - 6, 30, ease.inOut);
  const perim = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const flagRot = keys(frame, [HIT - 2, HIT + 8, HIT + 16, HIT + 26], [-88, 14, -6, 0], [ease.out, ease.inOut, ease.outSoft]) + (frame > HIT + 26 ? Math.sin(frame / 24) * 2.5 : 0);
  const ring = prog(frame, HIT, 44, ease.out);
  const flash = keys(frame, [HIT - 1, HIT + 3, HIT + 28], [0, dark ? 0.45 : 0.6, 0], [ease.out, ease.outSoft]);
  const f2x = 250;
  const f2y = 700;
  const flag2 = keys(frame, [SECOND - 2, SECOND + 8, SECOND + 16, SECOND + 24], [-88, 14, -6, 0], [ease.out, ease.inOut, ease.outSoft]);
  const ring2 = prog(frame, SECOND, 40, ease.out);

  const G = Math.min(200, (W - 160) / (Math.max(4, p.greeting.length) * 0.84));
  const greetBlock = { position: 'absolute' as const, left: 0, width: W, top: 150, textAlign: 'center' as const, ...displayFace('climate'), fontSize: G, lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const };

  const breathe = Math.sin(frame / 45) * 0.5 + 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: p.sky, color: p.ink, fontFamily: FONTS.familjen, overflow: 'hidden' }}>
      {/* sky: soft gradient + low winter sun glow */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${p.sky} 0%, ${dark ? hexA(p.frost, 0.55) : '#F6F8FA'} 58%, ${p.sky} 59.5%)` }} />
      <div style={{ position: 'absolute', left: W / 2 - 520, top: HORIZON - 420, width: 1040, height: 700, borderRadius: '50%', background: `radial-gradient(ellipse, ${hexA(dark ? p.accent : p.frost, dark ? 0.35 : 0.7)} 0%, transparent 62%)`, opacity: 0.8 + breathe * 0.2 }} />
      {dark && (
        // aurora ribbons for night variants
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          {[0, 1].map((k) => (
            <path key={k} d={`M-50 ${330 + k * 70} C 250 ${220 + k * 60 + Math.sin(frame / 50 + k) * 30}, 650 ${420 + k * 40 - Math.sin(frame / 60 + k) * 30}, 1130 ${280 + k * 60}`} stroke={p.accent} strokeWidth={70 - k * 30} fill="none" opacity={0.12 + k * 0.05} style={{ filter: 'blur(26px)' }} />
          ))}
        </svg>
      )}

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px 0`, opacity: 1 - outro }}>
        {/* far shore: pine silhouettes */}
        <svg style={{ position: 'absolute', left: 0, top: 0 }} width={W} height={H}>
          {Array.from({ length: 34 }, (_, i) => {
            const x = i * 33 - 10 + rand(i * 3.1) * 14;
            const h = 30 + rand(i * 7.3) * 46;
            return <path key={i} d={`M${x} ${HORIZON + 2} L${x + h * 0.28} ${HORIZON - h} L${x + h * 0.56} ${HORIZON + 2} Z`} fill={dark ? shadeHex(p.frost, -0.2) : p.frost} opacity={0.9} />;
          })}
          {/* the frozen lake */}
          <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill={p.ice} />
          <rect x={0} y={HORIZON} width={W} height={60} fill={dark ? hexA('#ffffff', 0.04) : hexA('#ffffff', 0.5)} />
          {Array.from({ length: 7 }, (_, i) => {
            const y = HORIZON + 30 + i * i * 9;
            return <line key={i} x1={0} y1={y} x2={W} y2={y} stroke={hexA(p.accent, 0.08 + i * 0.012)} strokeWidth={1 + i * 0.4} />;
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const x = 80 + rand(i * 5.3) * 920;
            const y = HORIZON + 80 + rand(i * 2.9) * 300;
            return <path key={i} d={`M${x} ${y} l${30 + rand(i) * 60} ${8 + rand(i * 2) * 10} l${20 + rand(i * 3) * 40} ${-6}`} stroke={hexA(p.accent, 0.3)} strokeWidth={2} fill="none" />;
          })}
          {/* second, distant hole */}
          <ellipse cx={f2x} cy={f2y} rx={52} ry={16} fill={dark ? hexA('#ffffff', 0.12) : '#F6F8FA'} stroke={p.ink} strokeWidth={2.5} />
          <ellipse cx={f2x} cy={f2y + 1} rx={34} ry={10} fill={water} opacity={0.9} />
          <ellipse cx={f2x} cy={f2y} rx={mix(50, 170, ring2)} ry={mix(16, 54, ring2)} fill="none" stroke={p.flag} strokeWidth={mix(5, 1, ring2)} opacity={frame >= SECOND ? (1 - ring2) * 0.8 : 0} />
          {/* main hole: drawn on beat 2 */}
          <ellipse cx={hx} cy={hy + 22} rx={rx * 1.25} ry={ry * 1.1} fill={p.ink} opacity={0.12 * draw} style={{ filter: 'blur(14px)' }} />
          <ellipse cx={hx} cy={hy} rx={rx + 18} ry={ry + 9} fill={dark ? hexA('#ffffff', 0.12) : '#F7F9FA'} opacity={draw} />
          <ellipse cx={hx} cy={hy} rx={rx + 18} ry={ry + 9} fill="none" stroke={p.ink} strokeWidth={4} strokeDasharray={perim * 1.15} strokeDashoffset={perim * 1.15 * (1 - draw)} />
          {!hasPhoto && <ellipse cx={hx} cy={hy + 2} rx={rx * draw} ry={ry * draw} fill={water} />}
          {!hasPhoto && <ellipse cx={hx - rx * 0.25} cy={hy - ry * 0.2} rx={rx * 0.4 * draw} ry={ry * 0.18 * draw} fill={p.accent} opacity={0.5} />}
          {/* water ripples looping inside the hole once the line is in */}
          {!hasPhoto &&
            [0, 1, 2].map((k) => {
              const u = (((frame - HIT) / 60 + k / 3) % 1 + 1) % 1;
              return <ellipse key={k} cx={hx} cy={hy + 2} rx={rx * mix(0.1, 0.92, u)} ry={ry * mix(0.1, 0.92, u)} fill="none" stroke={p.frost} strokeWidth={2.5} opacity={frame > HIT ? (1 - u) * 0.7 : 0} />;
            })}
          <ellipse cx={hx} cy={hy} rx={mix(rx + 20, rx * 3.4, ring)} ry={mix(ry + 10, ry * 3.4, ring)} fill="none" stroke={p.flag} strokeWidth={mix(9, 1, ring)} opacity={frame >= HIT ? (1 - ring) * 0.9 : 0} />
          <ellipse cx={hx} cy={hy} rx={mix(rx + 10, rx * 2.4, ring)} ry={mix(ry + 6, ry * 2.4, ring)} fill="none" stroke={p.accent} strokeWidth={mix(6, 1, ring)} opacity={frame >= HIT ? (1 - ring) * 0.7 : 0} />
        </svg>

        {hasPhoto && (
          <div style={{ position: 'absolute', left: hx - rx, top: hy - ry, width: rx * 2, height: ry * 2, borderRadius: '50%', overflow: 'hidden', opacity: draw, scale: String(mix(0.6, 1, draw)), border: `4px solid ${p.ink}` }}>
            <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* tip-ups */}
        {frame >= SECOND - 2 && <TipUp x={f2x + 6} y={f2y} h={110} rot={flag2} p={p} scale={0.42} arm={160} />}
        {frame >= HIT - 2 && <TipUp x={hasPhoto ? hx + rx + 10 : hx} y={hasPhoto ? hy + ry * 0.4 : hy} h={hasPhoto ? 210 : 240} rot={flagRot} p={p} arm={hasPhoto ? 90 : rx + 46} />}
        <Shards frame={frame} at={HIT} cx={hx} cy={hy} count={40} colors={['#F7FAFC', '#FFFFFF', p.frost, '#F7FAFC', p.flag]} />
        <Shards frame={frame} at={SECOND} cx={f2x} cy={f2y} count={14} colors={['#F7FAFC', p.frost]} />

        {/* type */}
        <div style={{ position: 'absolute', top: 104, width: W, textAlign: 'center', fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 30, letterSpacing: '0.32em', textTransform: 'uppercase', opacity: prog(frame, 8, 26), translate: `0 ${(1 - prog(frame, 8, 30)) * 20}px` }}>
          {p.eyebrow}
        </div>
        <SweepReveal frame={frame} start={HIT - 8} dur={30} style={{ ...greetBlock, color: p.accent }}>
          {p.greeting}
        </SweepReveal>
        <Glint frame={frame} start={T.bars(3)} dur={46} style={greetBlock}>
          {p.greeting}
        </Glint>
        <WordsIn text={p.recipient} frame={frame} start={HIT + 28} stagger={5} style={{ position: 'absolute', left: 90, width: W - 180, top: 150 + G * 1.12, justifyContent: 'center', fontSize: 54, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.1 }} />
        <WordsIn text={p.message} frame={frame} start={HIT + 62} stagger={3} dur={20} style={{ position: 'absolute', left: 120, width: W - 240, top: 150 + G * 1.12 + 82, justifyContent: 'center', textAlign: 'center', fontSize: 44, lineHeight: 1.25, fontWeight: 400 }} />
        <div style={{ position: 'absolute', width: W, top: 958, textAlign: 'center', fontFamily: FONTS.spacemono, fontSize: 28, letterSpacing: '0.08em', opacity: prog(frame, T.bars(2) + T.beats(2), 30) * 0.85 }}>— {p.signature}</div>
      </AbsoluteFill>

      <Snow frame={frame} W={W} H={H} color={dark ? '#F4F7F9' : '#FFFFFF'} edge={dark ? undefined : p.frost} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${hy}px, ${hexA('#ffffff', flash)} 0%, transparent 50%)`, mixBlendMode: dark ? 'screen' : 'soft-light' }} />
      <FilmOverlay grain={0.045} vignette={dark ? 0.45 : 0.14} frame={frame} />
    </AbsoluteFill>
  );
}

function shadeHex(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (to - v) * k).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

/** Snowfall in front of everything; on light skies flakes get a frost edge so they read. */
function Snow({ frame, W, H, color: c, edge }: { frame: number; W: number; H: number; color: string; edge?: string }) {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: 80 }, (_, i) => {
        const r = (k: number) => rand(i * 9.13 + k * 3.7);
        const depth = 0.3 + r(1) * 0.7;
        const s = 3 + depth * 10;
        const y = ((r(2) * H + frame * (0.7 + depth * 1.8)) % (H + 40)) - 20;
        const x = r(3) * W + Math.sin(frame / (40 + r(4) * 40) + r(5) * 6) * 26 * depth;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: c, boxShadow: edge ? `0 0 0 1.5px ${hexA(edge, 0.7)}` : undefined, opacity: 0.4 + depth * 0.5, filter: depth > 0.85 ? 'blur(2px)' : undefined }} />;
      })}
    </AbsoluteFill>
  );
}
