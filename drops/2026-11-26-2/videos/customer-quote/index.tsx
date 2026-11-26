import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { PaperclipIcon } from '@phosphor-icons/react/ssr';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Customer Quote',
  category: 'quote',
  description:
    'Square testimonial card: an envelope opens on the beat, the letter rises to fill the frame, the quote writes itself in with a highlighter sweep, then the customer’s photo and name and a postmark stamp.',
  tags: ['quote', 'testimonial', 'customer', 'social', 'square', 'review'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('From our inbox'),
  quote: textarea().default('Our support agent answered 1,240 emails in its first week, and only asked us about 31.'),
  highlight: text('Highlighted phrase').default('only asked us about 31.'),
  name: text().default('Priya Raman'),
  role: text('Role · company').default('Head of Support, Fernleaf'),
  photo: image('Photo (optional)').default(''),
  postmark: text('Postmark text').default('POSTNOOK · 26 NOV 2026'),
  font: font('Quote font').default('youngserif'),
  background: color().default('#EEF1E6'),
  surface: color().default('#DCE3CC'),
  ink: color('Text').default('#1E2A1A'),
  accent: color().default('#6A8D3A'),
  accent2: color('Highlighter & stamp').default('#C9A227'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  moss: { background: '#0E1A14', surface: '#18291F', ink: '#EAF2DC', accent: '#B5E550', accent2: '#E3B53A', font: 'gloock' },
  terracotta: { background: '#F1E4D3', surface: '#E5CDB2', ink: '#3B1F14', accent: '#C8553D', accent2: '#F2A541', font: 'fraunces' },
  frost: {
    background: '#E9EEF1',
    surface: '#D3DDE3',
    ink: '#17242E',
    accent: '#2F6F8F',
    accent2: '#E4A43A',
    quote: 'Spinning up an inbox per agent took one API call. Reviewing their drafts takes us minutes a day.',
    highlight: 'minutes a day.',
    name: 'Jonas Lindqvist',
    role: 'CTO, Hallway Labs',
  },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

const OPEN = T.beats(2); // 60: flap opens
const RISE = T.bars(1); // 120: letter rises and fills the frame
const ATTR = T.bars(2); // 240: attribution
const STAMP = T.bars(3); // 360: postmark
const END = T.bars(4);

function Postmark({ size, p, id }: { size: number; p: P; id: string }) {
  const r = 40;
  const wave = (y: number) => `M 96 ${y} q 10 -7 20 0 t 20 0 t 20 0 t 20 0 t 20 0`;
  return (
    <svg viewBox="0 0 200 100" width={size * 2} height={size} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <path id={`${id}-arc`} d={`M ${50 - r + 9} 50 a ${r - 9} ${r - 9} 0 1 1 ${2 * (r - 9)} 0 a ${r - 9} ${r - 9} 0 1 1 ${-2 * (r - 9)} 0`} />
      </defs>
      <g fill="none" stroke={p.accent2} strokeWidth={2.6} strokeLinecap="round">
        <circle cx={50} cy={50} r={r} />
        <circle cx={50} cy={50} r={r - 19} strokeWidth={1.6} />
        <path d={wave(34)} />
        <path d={wave(50)} />
        <path d={wave(66)} />
      </g>
      <text fill={p.accent2} fontFamily={FONTS.familjen} fontWeight={700} fontSize={9.5} letterSpacing={1.6}>
        <textPath href={`#${id}-arc`}>{p.postmark}</textPath>
      </text>
      <text x={50} y={54} textAnchor="middle" fill={p.accent2} fontFamily={FONTS.youngserif} fontSize={13}>
        ✉
      </text>
    </svg>
  );
}

export default function CustomerQuote(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = lum(p.background) < 120;
  const paper = dark ? '#22362A' : '#FAFAF4';
  const outro = prog(frame, END - 30, 30, ease.inOut);

  // Envelope: slides up, flap opens, then sinks away as the letter rises.
  const envIn = prog(frame, 4, 40, ease.out);
  const flap = keys(frame, [OPEN, OPEN + 26], [0, 1], ease.inOutSoft);
  const envOut = prog(frame, RISE, 20, ease.in);
  const peek = keys(frame, [OPEN + 20, RISE], [0, 1], ease.inOutSoft);

  // Letter rect: from inside the envelope to the full card.
  const rise = prog(frame, RISE, 40, ease.inOutSoft);
  const ex = W / 2, ey = 700; // envelope centre
  const from = { x: ex - 250, y: ey - 150 - peek * 120, w: 500, h: 300 };
  const to = { x: 96, y: 118, w: W - 192, h: H - 236 };
  const L = { x: mix(from.x, to.x, rise), y: mix(from.y, to.y, rise), w: mix(from.w, to.w, rise), h: mix(from.h, to.h, rise) };
  const tilt = mix(0, -1.4, rise);

  // Quote words write in after the letter settles; the highlight sweeps on beat 3 of bar 2.
  const words = p.quote.split(' ');
  const hiStart = p.highlight ? p.quote.indexOf(p.highlight) : -1;
  let pos = 0;
  const marks = words.map((w) => {
    const at = p.quote.indexOf(w, pos);
    pos = at + w.length;
    return hiStart >= 0 && at >= hiStart && at < hiStart + p.highlight.length;
  });
  const qStart = RISE + 30;
  const hiAt = RISE + T.beats(2) + 10;
  const nHi = marks.filter(Boolean).length;
  let hiIdx = 0;
  const qSize = p.quote.length > 95 ? 62 : p.quote.length > 70 ? 68 : 78;

  const attrT = prog(frame, ATTR, 30, ease.out);
  const nameT = prog(frame, ATTR + 8, 30, ease.out);
  const stampT = prog(frame, STAMP, 12, ease.out);
  const ring = prog(frame, STAMP, 44, ease.out);
  const shake = frame >= STAMP && frame < STAMP + 12 ? Math.sin(frame * 2.1) * (1 - (frame - STAMP) / 12) * 6 : 0;
  const initials = p.name
    .split(' ')
    .map((s) => s[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.15, size: 36, y: -frame * 0.15, color: dark ? '234,242,220' : '30,42,26' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: W * 0.5, y: H * 0.55, size: 1100, color: hexA(p.accent, dark ? 0.3 : 0.26), opacity: 0.75 + 0.15 * Math.sin(frame / 40) },
          { x: W * 0.9, y: H * 0.9, size: 800, color: hexA(p.accent2, 0.32), opacity: 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.45 : 0.1}
      />
      <AbsoluteFill style={{ opacity: 1 - outro, translate: `${shake}px ${shake * 0.5}px`, scale: String(mix(1, 1.035, prog(frame, RISE, END - RISE, ease.inOutSoft))) }}>
        <Dust frame={frame} width={W} height={H} count={30} color={dark ? p.accent : p.accent2} seed={4} speed={0.5} opacity={0.4} />

        {/* Eyebrow */}
        <div style={{ position: 'absolute', left: 104, top: 40, fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 56, color: p.accent, rotate: '-3deg', opacity: prog(frame, 10, 24) * (1 - prog(frame, RISE, 16)) + prog(frame, RISE + 30, 20) }}>
          {p.eyebrow}
        </div>

        {/* Envelope back + open flap (behind the letter) */}
        {envOut < 1 && (
          <svg style={{ position: 'absolute', left: ex - 300, top: ey - 190, overflow: 'visible', opacity: clamp(envIn * 2) * (1 - envOut), translate: `0 ${mix(420, 0, envIn) + envOut * 520}px` }} width={600} height={380}>
            <rect x={12} y={14} width={600} height={380} rx={26} fill={p.ink} />
            <rect x={0} y={0} width={600} height={380} rx={26} fill={p.surface} stroke={p.ink} strokeWidth={4} />
            {flap > 0.02 && <path d={`M 6 6 L 300 ${mix(210, -170, flap)} L 594 6 Z`} fill={p.surface} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />}
          </svg>
        )}

        {/* The letter */}
        {frame >= OPEN + 10 && (
          <div
            style={{
              position: 'absolute',
              left: L.x,
              top: L.y,
              width: L.w,
              height: L.h,
              rotate: `${tilt}deg`,
              background: paper,
              border: `4px solid ${p.ink}`,
              borderRadius: 18,
              boxShadow: rise > 0 ? `${14 * rise}px ${16 * rise}px 0 ${p.ink}` : undefined,
              opacity: envOut > 0 || rise > 0 ? 1 : clamp(peek * 3),
            }}
          >
            {/* paperclip on the top edge */}
            <div style={{ position: 'absolute', left: 250, top: -46, opacity: rise, rotate: '12deg' }}>
              <PaperclipIcon size={110} weight="bold" color={p.accent} />
            </div>
            <div style={{ position: 'absolute', left: 64, top: 30, ...displayFace(p.font), fontSize: 220, lineHeight: 1, color: p.accent, opacity: prog(frame, RISE + 20, 20) }}>“</div>
            <div style={{ position: 'absolute', left: 70, right: 70, top: 200, display: 'flex', flexWrap: 'wrap', columnGap: '0.26em', rowGap: qSize * 0.18, ...displayFace(p.font), fontSize: qSize, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
              {words.map((w, i) => {
                const t = prog(frame, qStart + i * 3, 22, ease.out);
                const hi = marks[i];
                const k = hi ? hiIdx++ : 0;
                const sweep = hi ? prog(frame, hiAt + (k / Math.max(1, nHi)) * 20, 14, ease.inOutSoft) : 0;
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      opacity: clamp(t * 1.4),
                      translate: `0 ${(1 - t) * 22}px`,
                      filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined,
                      color: hi ? (dark ? p.accent : p.ink) : undefined,
                      backgroundImage: hi ? `linear-gradient(${hexA(p.accent2, dark ? 0.35 : 0.55)}, ${hexA(p.accent2, dark ? 0.35 : 0.55)})` : undefined,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: '0 88%',
                      backgroundSize: `${sweep * 104}% 42%`,
                      padding: '0 0.04em',
                    }}
                  >
                    {w}
                  </span>
                );
              })}
            </div>

            {/* Attribution */}
            <div style={{ position: 'absolute', left: 70, bottom: 56, display: 'flex', alignItems: 'center', gap: 28, opacity: clamp(attrT * 1.5), translate: `${mix(-30, 0, attrT)}px 0` }}>
              <div style={{ width: 112, height: 112, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${p.ink}`, background: p.surface, display: 'grid', placeItems: 'center', flexShrink: 0, scale: String(mix(0.6, 1, ease.backOut(attrT))) }}>
                {p.photo ? <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ ...displayFace(p.font), fontSize: 46, color: p.ink }}>{initials}</span>}
              </div>
              <div style={{ opacity: clamp(nameT * 1.5), translate: `${mix(-20, 0, nameT)}px 0` }}>
                <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1 }}>{p.name}</div>
                <div style={{ fontSize: 40, opacity: 0.75, lineHeight: 1.2 }}>{p.role}</div>
              </div>
            </div>
          </div>
        )}

        {/* Envelope front pocket (in front of the letter while it's inside) */}
        {envOut < 1 && rise < 1 && (
          <svg style={{ position: 'absolute', left: ex - 300, top: ey - 190, overflow: 'visible', opacity: clamp(envIn * 2) * (1 - envOut), translate: `0 ${mix(420, 0, envIn) + envOut * 520}px` }} width={600} height={380}>
            <path d="M 2 120 L 300 250 L 598 120 L 598 354 Q 598 380 572 380 L 28 380 Q 2 380 2 354 Z" fill={paper} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />
            <path d="M 8 372 L 250 230 M 592 372 L 350 230" stroke={hexA(p.ink, 0.3)} strokeWidth={3} fill="none" />
            {flap <= 0.02 && <path d="M 6 6 L 300 210 L 594 6" fill={p.surface} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />}
            <circle cx={300} cy={flap > 0.02 ? 250 : 210} r={44} fill={p.accent2} stroke={p.ink} strokeWidth={4} />
            <circle cx={300} cy={flap > 0.02 ? 250 : 210} r={26} fill="none" stroke={hexA(p.ink, 0.4)} strokeWidth={3} />
          </svg>
        )}

        {/* Postmark lands on the letter's corner */}
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={W} height={H}>
          <circle cx={W - 355} cy={210} r={90 + ring * 380} fill="none" stroke={p.accent2} strokeWidth={mix(7, 1, ring)} opacity={frame >= STAMP ? (1 - ring) * 0.7 : 0} />
        </svg>
        {frame >= STAMP && (
          <div style={{ position: 'absolute', left: W - 430, top: 135, rotate: '-10deg', opacity: stampT * 0.95, scale: String(mix(1.8, 1, stampT)), mixBlendMode: dark ? 'screen' : 'multiply' }}>
            <Postmark size={150} p={p} id="cq" />
          </div>
        )}
      </AbsoluteFill>
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.15} frame={frame} />
    </AbsoluteFill>
  );
}
