import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, WordsIn, clamp, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'High Score Thanks',
  category: 'thank-you',
  description:
    'Portrait thank-you for a customer milestone: an arcade high-score board counts up to the number, the initials are entered one letter per beat, THANK YOU slams in with confetti, then a note, an optional team photo and a sign-off.',
  tags: ['thank you', 'milestone', 'customers', 'arcade', 'leaderboard', 'memphis', 'social'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1080, height: 1350, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  boardTitle: text('Board title').default('High scores'),
  milestone: text('Milestone number').default('10,000'),
  milestoneShort: text('Milestone (short, for the token)').default('10K'),
  eyebrow: text().default('10,000 teams playing'),
  initials: text('Initials (max 5)').default('YOU'),
  rival1: text('Row 2').default('ACE 8,450'),
  rival2: text('Row 3').default('JMK 7,200'),
  rival3: text('Row 4').default('ROI 6,190'),
  title: text('Title line 1').default('Thank'),
  title2: text('Title line 2').default('you!'),
  message: text('Message').default('You made Multiball the high score of our year.'),
  signoffLabel: text('Sign-off label').default('Love,'),
  signoff: text('Sign-off').default('The Multiball crew'),
  cta: text('Footer').default('Continue? multiball.ai'),
  photo: image('Team photo or logo (optional)').default(''),
  background: color().default('#FFF6E9'),
  surface: color('Surface').default('#FFE3D3'),
  ink: color('Ink').default('#1A1A2E'),
  accent: color().default('#FF6F91'),
  accent2: color('Second color').default('#00B3A4'),
  pop: color('Pop').default('#FFC93C'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'after-dark': { background: '#12001F', surface: '#24003D', ink: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', milestone: '1,000,000', milestoneShort: '1M', eyebrow: '1M ads launched', message: 'A million ads shipped by the night owls. You rock.' },
  candy: { background: '#FFF0F6', surface: '#FFD6E8', ink: '#2B1B3D', accent: '#FF4FA3', accent2: '#7B61FF', pop: '#FFE14D', initials: 'ALL', title: 'Merci', title2: 'beaucoup', eyebrow: 'Year one, done', milestone: '365', milestoneShort: '1YR', message: 'One year of multiball. Thanks for playing!' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', initials: 'TEAM', boardTitle: 'Top agencies', eyebrow: 'Agency partners', milestone: '500', milestoneShort: '500', message: '500 agencies now run their clients on Multiball.', signoff: 'Partner team' },
};

type P = z.infer<typeof schema>;

const NABLA_CSS = `@font-palette-values --mb-flat { font-family: 'Nabla'; override-colors: ${Array.from({ length: 32 }, (_, i) => `${i} currentColor`).join(', ')}; }`;

function arcade(face: string, side: string, size: number): CSSProperties {
  const depth = Math.max(3, Math.round(size * 0.07));
  return {
    fontFamily: FONTS.nabla,
    fontPalette: '--mb-flat',
    color: face,
    textShadow: Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`).join(', '),
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
  } as CSSProperties;
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};
const onColor = (hex: string) => (isDark(hex) ? '#FFF6E9' : '#1A1A2E');

const W = 1080;
const H = 1350;
const BAR2 = T.bars(1);
const BAR3 = T.bars(2);
const BAR4 = T.bars(3);
const BAR5 = T.bars(4);

/** Counts the milestone up from zero, keeping its formatting (commas, suffixes). */
function countUp(target: string, t: number) {
  const digits = target.replace(/[^0-9]/g, '');
  if (!digits) return target;
  const n = Math.round(parseInt(digits, 10) * t);
  const s = target.includes(',') ? n.toLocaleString('en-US') : String(n);
  return t >= 1 ? target : s;
}

/** The leaderboard: rows slide in on bar 1, initials are entered on bar 2. */
function Board({ frame, p }: { frame: number; p: P }) {
  const letters = p.initials.toUpperCase().slice(0, 5).split('');
  const rowH = 118;
  const rows = [p.rival1, p.rival2, p.rival3];
  const saved = frame >= BAR2 + T.beats(3);
  const savedFlash = keys(frame, [BAR2 + T.beats(3), BAR2 + T.beats(3) + 3, BAR2 + T.beats(3) + 24], [0, 1, 0], [ease.out, ease.inOutSoft]);
  const count = prog(frame, T.beats(1), T.beats(2.6), ease.inOutSoft);
  const blink = Math.floor(frame / 15) % 2 === 0;
  const dark = isDark(p.background);
  const rowStyle = (i: number): CSSProperties => {
    const t = prog(frame, T.beats(i * 0.75), 26, ease.out);
    return { position: 'absolute', left: 40, right: 40, top: 200 + i * rowH, height: rowH - 18, display: 'flex', alignItems: 'center', fontFamily: FONTS.pressstart, color: p.ink, translate: `${mix(900, 0, t)}px 0`, opacity: clamp(t * 2) };
  };
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 860, height: 760, borderRadius: 40, background: p.surface, border: `10px solid ${p.ink}`, boxShadow: `18px 18px 0 ${p.ink}`, boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 150, background: p.ink }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center', fontFamily: FONTS.pressstart, fontSize: 48, color: dark ? p.background : p.pop, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.boardTitle}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 108, textAlign: 'center', fontFamily: FONTS.pressstart, fontSize: 20, color: dark ? p.background : p.accent, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: frame < BAR2 ? 0 : saved ? 1 : blink ? 1 : 0.3 }}>
        {saved ? 'Score saved' : 'Enter your initials'}
      </div>
      {/* row 1: you */}
      <div style={{ ...rowStyle(0), background: savedFlash > 0.3 ? p.pop : p.accent, border: `6px solid ${p.ink}`, borderRadius: 18, boxShadow: `6px 6px 0 ${p.ink}`, color: onColor(p.accent), boxSizing: 'border-box', padding: '0 26px' }}>
        <span style={{ fontSize: 30, width: 110 }}>1ST</span>
        <span style={{ display: 'flex', gap: 10, flex: 1 }}>
          {letters.map((ch, i) => {
            const lock = BAR2 + T.beats(Math.min(i, 2) + (i > 2 ? (i - 2) * 0.5 : 0));
            const locked = frame >= lock;
            const spinning = frame >= BAR2 - T.beats(0.5) && !locked;
            const shown = locked ? ch : spinning ? String.fromCharCode(65 + (Math.floor(frame / 3) + i * 7) % 26) : blink && i === 0 ? '_' : ' ';
            const pop = prog(frame, lock, 14, ease.backOut);
            return (
              <span key={i} style={{ display: 'inline-block', width: 64, textAlign: 'center', fontSize: 54, borderBottom: `6px solid ${onColor(p.accent)}`, paddingBottom: 6, scale: String(locked ? mix(1.5, 1, pop) : 1), opacity: locked ? 1 : 0.7 }}>
                {shown}
              </span>
            );
          })}
        </span>
        <span style={{ fontSize: 34 }}>{countUp(p.milestone, count)}</span>
      </div>
      {rows.map((r, i) => {
        const [name, ...rest] = r.split(' ');
        return (
          <div key={i} style={{ ...rowStyle(i + 1), padding: '0 32px', boxSizing: 'border-box', borderBottom: `4px dashed ${hexA(p.ink, 0.3)}` }}>
            <span style={{ fontSize: 30, width: 110 }}>{['2ND', '3RD', '4TH'][i]}</span>
            <span style={{ fontSize: 44, flex: 1, letterSpacing: '0.1em' }}>{name}</span>
            <span style={{ fontSize: 30 }}>{rest.join(' ')}</span>
          </div>
        );
      })}
      {/* hatched footer */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: `repeating-linear-gradient(45deg, ${hexA(p.ink, 0.5)} 0 6px, transparent 6px 22px)`, opacity: 0.6, backgroundPosition: `${frame * 0.6}px 0` }} />
    </div>
  );
}

/** Confetti: a burst on the hit (drag + terminal velocity), then a gentle ambient fall. */
function Confetti({ frame, p }: { frame: number; p: P }) {
  const cols = [p.accent, p.accent2, p.pop, p.ink];
  const t = frame - BAR3;
  if (t < 0) return null;
  const d = 0.92;
  const travel = (1 - Math.pow(d, t)) / (1 - d);
  const shape = (kind: number, c: string) =>
    kind === 0 ? <path d="M-18,0 q4.5,-8 9,0 t9,0 t9,0 t9,0" fill="none" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
    : kind === 1 ? <path d="M0,-10 L10,8 L-10,8 Z" fill={c} stroke={p.ink} strokeWidth="2" strokeLinejoin="round" />
    : kind === 2 ? <circle r="7" fill="none" stroke={c} strokeWidth="4" />
    : <rect x="-2.5" y="-11" width="5" height="22" rx="2.5" fill={c} />;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {Array.from({ length: 40 }, (_, i) => {
        const a = -Math.PI / 2 + (rand(i * 4.1 + 2) - 0.5) * Math.PI * 1.5;
        const v = 26 + rand(i * 7.3) * 30;
        const x = 540 + Math.cos(a) * v * travel + Math.sin(t / 20 + i) * 10;
        const y = 420 + Math.sin(a) * v * travel + t * (1.1 + rand(i) * 1.1);
        const rot = rand(i * 2.9) * 360 + t * (rand(i * 3.3) - 0.5) * 8;
        const k = 1.4 + rand(i * 1.7) * 1.2;
        const fade = 1 - prog(t, 150, 60, ease.inOutSoft);
        return (
          <g key={i} opacity={fade} transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
            {shape(i % 4, cols[i % 4])}
          </g>
        );
      })}
      {Array.from({ length: 16 }, (_, i) => {
        // ambient drift that takes over once the burst has fallen
        const speed = 1.4 + rand(i * 9.1) * 1.2;
        const y = ((rand(i * 5.3) * (H + 200) + t * speed) % (H + 200)) - 100;
        const x = rand(i * 3.7) * W + Math.sin(t / 30 + i * 2) * 26;
        const k = 1.2 + rand(i * 2.2);
        const appear = prog(t, 90, 60);
        return (
          <g key={`a${i}`} opacity={appear * 0.85} transform={`translate(${x} ${y}) rotate(${t * 1.5 + i * 40}) scale(${k})`}>
            {shape((i + 1) % 4, cols[(i + 2) % 4])}
          </g>
        );
      })}
    </svg>
  );
}

/** The kit's ball: drops onto the end of the title and keeps hopping there on every beat. */
function TitleBall({ frame, p, x, y0 }: { frame: number; p: P; x: number; y0: number }) {
  const start = BAR3 + T.beats(1);
  if (frame < start) return null;
  const t = frame - start;
  const drop = prog(frame, start - 20, 20, ease.in);
  const ph = (t % T.beat) / T.beat;
  const y = y0 - 34 - Math.sin(ph * Math.PI) * 64 - (1 - drop) * 400;
  const squash = ph < 0.08 || ph > 0.92 ? 0.84 : 1;
  return (
    <>
      <div style={{ position: 'absolute', left: x - 28, top: y - 28, width: 68, height: 68, borderRadius: '50%', background: hexA(p.ink, 0.9), scale: `${2 - squash} ${squash}` }} />
      <div style={{ position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: '50%', border: `6px solid ${p.ink}`, background: 'radial-gradient(circle at 34% 30%, #FFFFFF 0%, #D9DCE4 45%, #7C8296 100%)', boxSizing: 'border-box', scale: `${2 - squash} ${squash}`, transformOrigin: '50% 100%' }}>
        <div style={{ position: 'absolute', left: 12, top: 10, width: 12, height: 12, borderRadius: '50%', background: p.pop }} />
      </div>
    </>
  );
}

export default function HighScoreThanks(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const hasImg = !!p.photo;

  const flash = keys(frame, [BAR3 - 1, BAR3 + 1, BAR3 + 24], [0, 0.85, 0], [ease.out, ease.outSoft]);
  const shake = frame >= BAR3 && frame < BAR3 + 14 ? Math.sin(frame * 2.3) * (1 - (frame - BAR3) / 14) * 12 : 0;
  const push = mix(1, 1.035, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 20, 20, ease.in);

  // Board: centred on bars 1–2, shrinks to the bottom on the hit, leaves on bar 4.
  const boardIn = prog(frame, 0, 30, ease.out);
  // the board gets out of the way just before the hit so THANK YOU lands on a clear stage
  const shrink = prog(frame, BAR3 - 22, 24, ease.inOutSoft);
  const leave = prog(frame, BAR4 - 6, 24, ease.in);
  const boardScale = mix(1, 0.5, shrink);
  const boardY = mix(mix(330, 300, boardIn), 830, shrink) + leave * 700;

  // Title.
  const L1 = Math.min(240, Math.floor(880 / Math.max(1, p.title.length * 0.6)));
  const L2 = Math.min(290, Math.floor(880 / Math.max(1, p.title2.length * 0.6)));
  const s1 = prog(frame, BAR3, 18, ease.backOut);
  const s2 = prog(frame, BAR3 + 6, 20, ease.backOut);
  const t1Top = 190;
  const t2Top = t1Top + L1 * 0.98;
  const titleBottom = t2Top + L2;

  // the token flips once per bar, landing face-on by the downbeat + 20 frames
  const flipT = ((frame - BAR4) % T.bar) / 24;
  const tokenSpin = flipT < 1 ? Math.cos(flipT * Math.PI * 2) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, overflow: 'hidden' }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.14 : 0.2, size: 40, y: -frame * 0.15, color: dark ? '255,255,255' : '26,26,46', fade: 1 }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={dark ? [{ x: 540, y: 500, size: 1200, color: hexA(p.accent, 0.4), opacity: 0.55 + 0.2 * Math.sin(frame / 30) }] : []}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ translate: `${shake}px ${shake * 0.6}px`, scale: String(push), opacity: 1 - outro }}>
        {/* Memphis furniture */}
        <div style={{ position: 'absolute', right: -200 + Math.sin(frame / 50) * 10, top: -250, width: 480, height: 480, borderRadius: '50%', background: p.accent2, opacity: dark ? 0.5 : 1 }} />
        <div style={{ position: 'absolute', left: -200, bottom: -230 + Math.sin(frame / 44) * 10, width: 420, height: 420, borderRadius: '50%', background: p.surface, border: `8px solid ${p.ink}` }} />
        <div style={{ position: 'absolute', right: 40, bottom: 120, width: 200, height: 200, background: `repeating-linear-gradient(45deg, ${p.ink} 0 6px, transparent 6px 22px)`, opacity: 0.35, rotate: `${10 + frame * 0.03}deg` }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <path d={`M90,${130 + Math.sin(frame / 30) * 6} q20,-30 40,0 t40,0 t40,0 t40,0`} fill="none" stroke={p.accent} strokeWidth="12" strokeLinecap="round" />
          <path d="M560,1255 L600,1325 L520,1325 Z" fill={p.pop} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" transform={`rotate(${frame * 0.15} 560 1300)`} />
        </svg>

        {/* Bars 1–2: HUD */}
        <div style={{ position: 'absolute', left: 90, top: 190, right: 90, display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.pressstart, fontSize: 26, color: p.ink, lineHeight: 1.7, opacity: (1 - prog(frame, BAR3 - 10, 10, ease.in)) * prog(frame, 6, 20) }}>
          <div>
            <div style={{ color: dark ? p.pop : p.accent }}>1UP</div>
            <div>{countUp(p.milestone, prog(frame, T.beats(1), T.beats(2.6), ease.inOutSoft)).padStart(6, '0')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>Ball</div>
            <div>x3</div>
          </div>
        </div>

        {/* The board */}
        <div style={{ position: 'absolute', left: 110, top: boardY, width: 860, height: 760, scale: String(boardScale), transformOrigin: '50% 0%', rotate: `${mix(0, -3, shrink)}deg` }}>
          <Board frame={frame} p={p} />
        </div>

        <Confetti frame={frame} p={p} />

        {/* Bar 3: THANK YOU */}
        {frame >= BAR3 && (
          <>
            <div style={{ position: 'absolute', left: 0, width: W, top: 96, textAlign: 'center', opacity: prog(frame, BAR3 + 10, 16), translate: `0 ${mix(-20, 0, prog(frame, BAR3 + 10, 24))}px` }}>
              <span style={{ display: 'inline-block', background: p.pop, padding: '12px 18px', border: `5px solid ${p.ink}`, fontFamily: FONTS.pressstart, fontSize: 26, color: '#1A1A2E', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: `6px 6px 0 ${p.ink}` }}>{p.eyebrow}</span>
            </div>
            <div style={{ position: 'absolute', left: 0, width: W, textAlign: 'center', top: t1Top, fontSize: L1, lineHeight: 1, scale: String(mix(1.8, 1, s1)), opacity: clamp(s1 * 3) }}>
              <span style={arcade(p.accent2, p.ink, L1)}>{p.title}</span>
            </div>
            <div style={{ position: 'absolute', left: 0, width: W, textAlign: 'center', top: t2Top, fontSize: L2, lineHeight: 1, scale: String(mix(1.9, 1, s2)), opacity: clamp(s2 * 3) }}>
              <span style={arcade(p.accent, p.ink, L2)}>{p.title2}</span>
            </div>
            <Glint frame={frame} start={BAR5 + T.beats(1)} dur={44} style={{ position: 'absolute', left: 0, width: W, textAlign: 'center', top: t2Top, fontSize: L2, lineHeight: 1, fontFamily: FONTS.nabla, fontPalette: '--mb-flat', textTransform: 'uppercase', letterSpacing: '0.01em', whiteSpace: 'nowrap' } as CSSProperties}>
              {p.title2}
            </Glint>
          </>
        )}
        <TitleBall frame={frame} p={p} x={Math.min(1000, W / 2 + (p.title.length * L1 * 0.6) / 2 + 76)} y0={t1Top + L1 * 0.62} />

        {/* Bar 4: the note, photo/token and sign-off */}
        {frame >= BAR4 && (
          <>
            <WordsIn
              text={p.message}
              frame={frame}
              start={BAR4 + 8}
              stagger={5}
              style={{ position: 'absolute', left: 110, width: 860, top: titleBottom + 30, justifyContent: 'center', textAlign: 'center', fontFamily: FONTS.rubikmono, fontSize: 46, lineHeight: 1.25, color: p.ink, textTransform: 'uppercase' }}
            />
            {/* right: photo in a laminate frame, or the spinning milestone token */}
            <div style={{ position: 'absolute', left: 690, top: 950, width: 320, height: 300, scale: String(prog(frame, BAR4 + T.beats(2), 26, ease.backOut)), opacity: clamp(prog(frame, BAR4 + T.beats(2), 8)) }}>
              {hasImg ? (
                <div style={{ position: 'absolute', inset: 0, rotate: '4deg', border: `8px solid ${p.ink}`, borderRadius: 22, boxShadow: `14px 14px 0 ${p.ink}`, background: p.surface, overflow: 'hidden' }}>
                  <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ position: 'absolute', left: 10, top: 0, width: 300, height: 300 }}>
                  <div style={{ position: 'absolute', inset: 0, translate: '12px 16px', borderRadius: '50%', background: p.ink, scale: `${Math.max(0.12, Math.abs(tokenSpin))} 1` }} />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: p.pop, border: `10px solid ${p.ink}`, boxSizing: 'border-box', scale: `${Math.max(0.12, Math.abs(tokenSpin))} 1`, display: 'grid', placeItems: 'center' }}>
                    <div style={{ position: 'absolute', inset: 26, borderRadius: '50%', border: `5px dashed ${p.ink}`, opacity: 0.5 }} />
                    <span style={{ ...arcade(tokenSpin > 0 ? p.accent : p.accent2, p.ink, 110), fontSize: p.milestoneShort.length > 3 ? 84 : 110, lineHeight: 1 }}>{p.milestoneShort}</span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ position: 'absolute', left: 110, top: 975, width: 540, opacity: prog(frame, BAR4 + T.beats(3), 16), translate: `${mix(-30, 0, prog(frame, BAR4 + T.beats(3), 24))}px 0` }}>
              <div style={{ fontFamily: FONTS.pressstart, fontSize: 26, color: dark ? p.pop : p.accent, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{p.signoffLabel}</div>
              <div style={{ marginTop: 20, fontFamily: FONTS.rubikmono, fontSize: p.signoff.length > 14 ? 40 : 46, lineHeight: 1.2, color: p.ink, textTransform: 'uppercase' }}>{p.signoff}</div>
            </div>
          </>
        )}

        {/* Bar 5: footer pill */}
        <div style={{ position: 'absolute', left: 110, top: 1170, display: 'flex' }}>
          <div
            style={{
              padding: '18px 26px',
              borderRadius: 999,
              background: p.ink,
              color: isDark(p.ink) ? p.pop : '#1A1A2E',
              fontFamily: FONTS.pressstart,
              fontSize: 22,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              transformOrigin: '0% 50%',
              scale: String(prog(frame, BAR5, 22, ease.backOut)),
              opacity: clamp(prog(frame, BAR5, 8)) * (Math.floor(frame / 20) % 2 === 0 || frame < BAR5 + T.beats(2) ? 1 : 0.7),
            }}
          >
            {p.cta} ▸
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${hexA('#FFFFFF', flash)} 0%, ${hexA(p.pop, flash * 0.9)} 35%, ${hexA(p.pop, flash * 0.4)} 80%)`, pointerEvents: 'none' }} />
      <FilmOverlay grain={0.04} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
