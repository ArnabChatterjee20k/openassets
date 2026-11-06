import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, shade, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Flight School Live',
  category: 'event',
  description:
    'Landscape webinar invite: a striped sun rises in an airplane-window sky, a tow plane flies the LIVE pennant in on the beat as the series title sweeps in, then a boarding-pass ticket with date, time, gate and host stub, and a glinting “save your seat” CTA.',
  tags: ['event', 'webinar', 'live', 'invite', 'session', 'landscape'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4.5) };

export const schema = z.object({
  eyebrow: text().default('Live webinar · Episode 07'),
  title: text('Title line 1').default('Flight School'),
  titleAccent: text('Title line 2 (accent)').default('Live'),
  topic: text('Session topic').default('Running 34 channels with a team of two.'),
  towText: text('Tow banner').default('LIVE'),
  ticketHeader: text('Ticket header').default('Boarding pass · Flight TL-007'),
  dateLabel: text('Date label').default('Date'),
  date: text().default('THU 20 NOV'),
  timeLabel: text('Time label').default('Time'),
  time: text().default('17:00 CET'),
  gateLabel: text('Gate label').default('Gate'),
  gate: text().default('ZOOM'),
  stamp: text('Stamp (empty to hide)').default('FREE'),
  hostLabel: text('Host label').default('Your host'),
  hostName: text('Host name').default('Maya Okafor'),
  hostRole: text('Host role').default('Head of Growth, Towline'),
  hostPhoto: image('Host photo (optional)').default(''),
  cta: text('Call to action').default('Save your seat · towline.ai/live'),
  fine: text('Fine print').default('45 min · Live Q&A · Recording sent'),
  font: font('Headline font').default('gloock'),
  background: color().default('#FFEDE1'),
  surface: color('Ticket / clouds').default('#FFD3C2'),
  ink: color('Text').default('#3D0E2A'),
  accent: color('Accent (sun, banner)').default('#FF4F6D'),
  accent2: color('Sky + sea').default('#7B2CBF'),
  pop: color('Spark').default('#FFB627'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { background: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', accent: '#FF8E5E', accent2: '#E5487A', pop: '#FFD27F' },
  citrus: {
    background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', font: 'shrikhand',
    eyebrow: 'Live webinar · Episode 08',
    topic: 'Turning one brief into 200 creatives overnight.',
    date: 'THU 18 DEC', time: '16:00 GMT', gate: 'YOUTUBE',
    hostName: 'Jonas Lindqvist', hostRole: 'Creative Lead, Towline',
    ticketHeader: 'Boarding pass · Flight TL-008',
  },
  lilac: {
    background: '#E9E3F5', surface: '#D6CCEC', ink: '#231942', accent: '#5E4AE3', accent2: '#F49CBB', pop: '#2EC4B6', font: 'fraunces',
    eyebrow: 'Live workshop · Season 2',
    title: 'Office Hours', titleAccent: 'Live',
    topic: 'Bring your CPA. Leave with a plan.',
    towText: 'ON AIR', stamp: 'Q&A',
    date: 'WED 03 DEC', time: '18:30 CET', gate: 'LINKEDIN',
    hostName: 'Ana Sofía Reyes', hostRole: 'Growth Lead, Kindred Skin',
  },
  'mid-century': {
    background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C',
    stamp: '', cta: 'RSVP · towline.ai/live',
  },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const isDark = (hex: string) => lum(hex) < 140;
const onColor = (bg: string, a: string, b: string) => (Math.abs(lum(a) - lum(bg)) > Math.abs(lum(b) - lum(bg)) ? a : b);

/** Flat poster-style prop plane facing right, nose at x=100, centreline y=0 (same as the kit's other videos). */
function PlaneShape({ p, frame, line }: { p: P; frame: number; line: string }) {
  const body = isDark(p.background) ? shade(p.surface, 0.75) : shade(p.background, 0.55);
  const ink = { stroke: line, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  const blade = Math.cos(frame * 1.3);
  return (
    <g>
      <path d="M2,-4 L-3,-25 C-3,-27 -1,-28 2,-27 L10,-25 L26,-6 Z" fill={p.accent} {...ink} />
      <ellipse cx={11} cy={-2} rx={12} ry={2.6} fill={body} {...ink} />
      <path d="M0,-3 C14,-8 40,-12 70,-12 C86,-12 96,-8 100,-2 L100,4 C96,8 88,10 70,10 L28,9 C14,8 4,5 0,1 Z" fill={body} {...ink} />
      <path d="M6,2.2 L97,2.2" stroke={p.accent} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M62,-11 C67,-20 80,-20 86,-10 Z" fill={shade(p.accent2, 0.55)} {...ink} />
      {[34, 43, 52].map((x) => (
        <circle key={x} cx={x} cy={-4} r={2.3} fill={p.accent2} />
      ))}
      <line x1={52} y1={-12} x2={45} y2={7} stroke={line} strokeWidth={1.4} />
      <ellipse cx={58} cy={-14} rx={20} ry={3.4} fill={body} {...ink} />
      <path d="M92,-7 C97,-6 100,-3 101.5,0 C100,3 97,6 92,7 Z" fill={p.accent} {...ink} />
      <line x1={62} y1={9} x2={64} y2={16} stroke={line} strokeWidth={1.6} />
      <circle cx={64} cy={17.5} r={3.6} fill={line} />
      <ellipse cx={104} cy={0} rx={2.4} ry={19} fill={line} opacity={0.14} />
      <line x1={103.5} y1={-17 * blade} x2={103.5} y2={17 * blade} stroke={line} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={103.5} cy={0} r={2.6} fill={line} />
    </g>
  );
}

/** Rippling swallowtail pennant; the ripple travels with `phase`. A pulsing on-air dot leads the label. */
function TowBanner({ x0, y, BL, BH, label, p, phase, line, live }: { x0: number; y: number; BL: number; BH: number; label: string; p: P; phase: number; line: string; live: number }) {
  const N = 48;
  const A = BH * 0.13;
  const wv = (d: number) => A * Math.sin(d * Math.PI * 2.4 - phase) * (0.2 + 0.8 * d);
  const top: string[] = [];
  const bot: string[] = [];
  const mid: string[] = [];
  for (let i = 0; i <= N; i++) {
    const d = i / N;
    const x = x0 + d * BL;
    const w = wv(d);
    top.push(`${x.toFixed(1)},${(y - BH / 2 + w).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(y + BH / 2 + w * 1.1).toFixed(1)}`);
    mid.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${(y + w * 1.05).toFixed(1)}`);
  }
  const outline = `M${top.join(' L')} L${(x0 + BL - BH * 0.32).toFixed(1)},${(y + wv(1)).toFixed(1)} L${bot.reverse().join(' L')} Z`;
  const fs = BH * 0.46;
  const dotX = x0 + BH * 0.52;
  const dotY = y + wv(0.06) * 1.05;
  return (
    <g>
      <path d={outline} transform={`translate(${BH * 0.12} ${BH * 0.14})`} fill={line} opacity={0.9} />
      <path d={outline} fill={p.accent} stroke={line} strokeWidth={BH * 0.03} strokeLinejoin="round" />
      <path d={`M${top.slice(0, N - 2).join(' L')}`} transform={`translate(0 ${BH * 0.12})`} stroke={p.pop} strokeWidth={BH * 0.05} fill="none" />
      <circle cx={dotX} cy={dotY} r={BH * 0.2 * (1 + live * 0.6)} fill={p.pop} opacity={0.35 * (1 - live)} />
      <circle cx={dotX} cy={dotY} r={BH * 0.13} fill={p.pop} stroke={line} strokeWidth={BH * 0.025} />
      <path id="fsl-mid" d={mid.join(' ')} fill="none" />
      <text fontFamily={FONTS.spacemono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.14} fill={onColor(p.accent, line, shade(p.background, 0.6))} dy={fs * 0.36}>
        <textPath href="#fsl-mid" startOffset={BH * 0.9}>
          {label}
        </textPath>
      </text>
      <line x1={x0} y1={y - BH * 0.62} x2={x0} y2={y + BH * 0.62} stroke={line} strokeWidth={BH * 0.07} strokeLinecap="round" />
    </g>
  );
}

function Cloud({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d={`M${x - s},${y} C${x - s},${y - s * 0.45} ${x - s * 0.55},${y - s * 0.6} ${x - s * 0.3},${y - s * 0.42} C${x - s * 0.2},${y - s * 0.9} ${x + s * 0.4},${y - s * 0.95} ${x + s * 0.5},${y - s * 0.45} C${x + s * 0.8},${y - s * 0.6} ${x + s * 1.1},${y - s * 0.3} ${x + s},${y} Z`}
      fill={fill}
    />
  );
}

export default function FlightSchoolLive(p: P) {
  const frame = useCurrentFrame();
  const W = video.width;
  const H = video.height;
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const line = dark ? '#1E1220' : p.ink;
  const card = dark ? p.surface : shade(p.background, 0.55);

  // Beat grid (beat = 30f)
  const HIT = T.bars(1); // title + plane + flash
  const TOPIC = HIT + T.beats(1);
  const TICKET = T.bars(2);
  const HOST = TICKET + T.beats(1);
  const STAMP = TICKET + T.beats(2);
  const CTA = T.bars(3);
  const GLINT = CTA + T.beats(1);
  const outro = prog(frame, end - 26, 26, ease.in);
  const push = mix(1, 1.035, prog(frame, 0, end, ease.inOutSoft));
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.1) * (1 - (frame - HIT) / 14) * 5 : 0;

  // Airplane-window sky, right column
  const AX = 1236;
  const AY = 92;
  const AW = 584;
  const AH = 470;
  const horizon = AY + AH * 0.8;
  const archIn = prog(frame, 4, 60, ease.out);
  const sunR = 170;
  const sunX = AX + AW * 0.5;
  const sunY = mix(horizon + sunR + 20, horizon - sunR * 0.45, prog(frame, 16, 110, ease.out));
  const sunPulse = 1 + Math.sin(frame / 22) * 0.01;
  const drift = (frame * 0.3) % (sunR * 0.2);
  const burst = prog(frame, HIT, 50, ease.out);
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 32], [0, 1, 0], [ease.out, ease.outSoft]);

  // Tow plane carrying the LIVE pennant, arriving on the hit
  const parkNose = AX + 30;
  const n = Math.max(2, p.towText.length);
  const avail = W - 40 - parkNose;
  const BH = Math.min(84, avail / (3.4 + 0.5 + n * 0.37 + 2));
  const Lp = BH * 3.4;
  const BL = (n * 0.37 + 2) * BH;
  const planeIn = prog(frame, HIT - 22, 78, ease.out);
  const noseX = mix(W + 80, parkNose, planeIn) - prog(frame, HIT + 56, end - HIT - 56, ease.inOutSoft) * 26 - prog(frame, end - 40, 40, ease.in) * 900;
  const planeY = AY + 150 + Math.sin(frame / 34) * 7;
  const bx0 = noseX + Lp + BH * 0.5;
  const live = (frame % 40) / 40;

  // Copy column
  const L = 100;
  const titleLen = Math.max(p.title.length, p.titleAccent.length + 6);
  const TS = titleLen > 15 ? 120 : titleLen > 12 ? 146 : 168;
  const titleTop = 150;
  const line2Top = titleTop + TS * 0.96;
  const accentW = p.titleAccent.length * TS * 0.56 + 40;
  const topicSize = p.topic.length > 44 ? 46 : 52;

  // Ticket band
  const TY = 600;
  const TH = 236;
  const ticketIn = prog(frame, TICKET, 40, ease.out);
  const field = (i: number) => prog(frame, TICKET + 10 + i * 6, 26, ease.out);
  const hostIn = prog(frame, HOST, 34, ease.out);
  const stampPop = prog(frame, STAMP, 20, ease.backOut);
  const stampRing = prog(frame, STAMP, 36, ease.out);
  const barcode: { x: number; w: number }[] = [];
  for (let i = 0, x = 0; x < 440; i++) {
    const w = 3 + Math.floor(rand(i * 3.1 + 2) * 4) * 3;
    if (i % 2 === 0) barcode.push({ x, w: Math.min(w, 440 - x) });
    x += w;
  }
  const STX = W - L - 620 - 2;
  const STY = TY + 4;
  const ctaPop = prog(frame, CTA, 26, ease.backOut);
  const initials = p.hostName.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('');
  const nameSize = Math.min(54, 340 / (Math.max(6, p.hostName.length) * 0.6));
  const hasPhoto = !!p.hostPhoto;

  const labelStyle = { fontFamily: FONTS.spacemono, fontSize: 24, letterSpacing: '0.24em', textTransform: 'uppercase' as const, opacity: 0.72, whiteSpace: 'nowrap' as const };
  const fieldChars = p.date.length + p.time.length + p.gate.length;
  const valueSize = Math.min(66, 860 / (Math.max(10, fieldChars) * 0.68));
  const valueStyle = { ...displayFace(p.font), fontSize: valueSize, lineHeight: 1.05, letterSpacing: '-0.02em', whiteSpace: 'nowrap' as const };
  const fields: [string, string][] = [
    [p.dateLabel, p.date],
    [p.timeLabel, p.time],
    [p.gateLabel, p.gate],
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.12, size: 44, y: -frame * 0.15, color: dark ? '255,233,214' : '61,14,42' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: sunX, y: horizon - 60, size: 1500, color: hexA(p.accent, dark ? 0.35 : 0.22), opacity: 0.6 + 0.25 * Math.sin(frame / 40) },
          { x: 160, y: H, size: 1500, color: hexA(p.pop, dark ? 0.18 : 0.3), opacity: 0.75 + 0.15 * Math.sin(frame / 52 + 1) },
        ]}
        grain={0}
        vignette={dark ? 0.45 : 0.06}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        {/* eyebrow */}
        <div style={{ position: 'absolute', left: L, top: 92, display: 'flex', opacity: prog(frame, 0, 24), translate: `0 ${mix(-16, 0, prog(frame, 0, 30))}px` }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '10px 26px', border: `3px solid ${p.ink}`, borderRadius: 999, fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 30, letterSpacing: '0.22em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            <span style={{ width: 18, height: 18, borderRadius: 99, background: p.accent, border: `2px solid ${p.ink}`, opacity: 0.55 + 0.45 * Math.sin(frame / 8) }} />
            {p.eyebrow}
          </span>
        </div>

        {/* sky window: hard shadow, then the arch, wiping up */}
        <div style={{ position: 'absolute', left: AX + 16, top: AY + 18, width: AW, height: AH, borderRadius: `${AW / 2}px ${AW / 2}px 48px 48px`, background: line, clipPath: `inset(${(1 - archIn) * 100}% 0 0 0)` }} />
        <div style={{ position: 'absolute', left: AX, top: AY, width: AW, height: AH, borderRadius: `${AW / 2}px ${AW / 2}px 48px 48px`, overflow: 'hidden', clipPath: `inset(${(1 - archIn) * 100}% 0 0 0)`, border: `4px solid ${line}` }}>
          <svg width={AW} height={AH} viewBox={`${AX} ${AY} ${AW} ${AH}`} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="fsl-sky" gradientUnits="userSpaceOnUse" x1={0} y1={AY} x2={0} y2={horizon}>
                <stop offset="0" stopColor={p.accent2} />
                <stop offset="0.55" stopColor={p.accent} />
                <stop offset="1" stopColor={p.pop} />
              </linearGradient>
              <linearGradient id="fsl-sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={shade(p.accent2, -0.15)} />
                <stop offset="1" stopColor={shade(p.accent2, -0.55)} />
              </linearGradient>
            </defs>
            <rect x={AX} y={AY} width={AW} height={AH} fill="url(#fsl-sky)" />
            <circle cx={sunX} cy={sunY} r={sunR * mix(1.05, 2.8, burst)} fill="none" stroke={p.pop} strokeWidth={mix(14, 1, burst)} opacity={frame >= HIT ? (1 - burst) * 0.9 : 0} />
            <g transform={`translate(${sunX} ${sunY}) scale(${sunPulse}) translate(${-sunX} ${-sunY})`}>
              <circle cx={sunX} cy={sunY} r={sunR} fill={p.pop} />
              <circle cx={sunX} cy={sunY} r={sunR * 0.78} fill={shade(p.pop, 0.3)} opacity={0.45} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x={sunX - sunR * 1.1} y={sunY + sunR * (0.0 + i * 0.2) + drift} width={sunR * 2.2} height={sunR * (0.03 + i * 0.022)} fill="url(#fsl-sky)" />
              ))}
            </g>
            <Cloud x={AX + 120 + frame * 0.3} y={AY + 330} s={80} fill={dark ? shade(p.surface, 0.2) : shade(p.surface, 0.35)} />
            <Cloud x={AX + AW - 90 - frame * 0.2} y={AY + 352} s={52} fill={dark ? shade(p.surface, 0.2) : shade(p.surface, 0.35)} />
            {[0, 1].map((i) => {
              const gx = AX + 440 - frame * (0.45 + i * 0.2) + i * 60;
              const gy = AY + 270 + i * 28 + Math.sin(frame / 14 + i) * 5;
              const s = 16 - i * 5;
              const flap = 0.5 + 0.5 * Math.sin(frame / 5 + i * 2);
              return <path key={i} d={`M${gx - s},${gy} Q${gx - s / 2},${gy - s * (0.3 + flap * 0.6)} ${gx},${gy} Q${gx + s / 2},${gy - s * (0.3 + flap * 0.6)} ${gx + s},${gy}`} stroke={line} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
            })}
            <rect x={AX} y={horizon} width={AW} height={AY + AH - horizon} fill="url(#fsl-sea)" />
            {[0, 1, 2].map((i) => {
              const w = sunR * (1.3 - i * 0.3) * (0.85 + 0.15 * Math.sin(frame / 12 + i * 1.7));
              return <rect key={i} x={sunX - w / 2} y={horizon + 14 + i * 20} width={w} height={7} rx={3.5} fill={p.pop} opacity={(0.85 - i * 0.18) * prog(frame, 40, 60)} />;
            })}
          </svg>
        </div>

        {/* dashed flight route drawing toward the window during the build */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <defs>
            <clipPath id="fsl-route">
              <rect x={0} y={0} width={mix(L, AX + 40, prog(frame, 10, HIT - 10, ease.inOutSoft))} height={H} />
            </clipPath>
          </defs>
          <g clipPath="url(#fsl-route)" opacity={dark ? 0.5 : 0.4}>
            <path d={`M${L + 12},${TY - 40} C${L + 520},${TY - 10} ${AX - 260},${TY - 40} ${AX - 6},${AY + 300}`} fill="none" stroke={p.ink} strokeWidth={4} strokeDasharray="4 18" strokeLinecap="round" strokeDashoffset={-frame * 0.6} />
            <circle cx={L + 12} cy={TY - 40} r={10} fill={p.accent} stroke={p.ink} strokeWidth={3} />
          </g>
        </svg>

        {/* title */}
        {frame >= HIT - 2 && (
          <>
            <SweepReveal frame={frame} start={HIT} dur={32} style={{ position: 'absolute', left: L - 4, top: titleTop, ...displayFace(p.font), fontSize: TS, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap', color: p.ink }}>
              {p.title}
            </SweepReveal>
            <SweepReveal frame={frame} start={HIT + 6} dur={32} style={{ position: 'absolute', left: L - 4, top: line2Top, ...displayFace(p.font), fontSize: TS, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap', color: p.accent, textShadow: `6px 6px 0 ${line}` }}>
              {p.titleAccent}
            </SweepReveal>
            <Glint frame={frame} start={GLINT + 40} dur={44} style={{ position: 'absolute', left: L - 4, top: line2Top, ...displayFace(p.font), fontSize: TS, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
              {p.titleAccent}
            </Glint>
          </>
        )}
        <WordsIn
          text={p.topic}
          frame={frame}
          start={TOPIC}
          stagger={4}
          style={{ position: 'absolute', left: L + accentW, top: line2Top + TS * 0.12, width: 1120 - L - accentW, fontWeight: 700, fontSize: topicSize, lineHeight: 1.1, letterSpacing: '-0.01em', color: p.ink }}
        />

        {/* the tow, flying the LIVE pennant in on the bar-2 downbeat */}
        {frame >= HIT - 24 && noseX < W + 60 && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <path d={`M${noseX + Lp},${planeY - BH * 0.05} L${bx0},${planeY + BH * 0.1}`} stroke={line} strokeWidth={3} />
            <TowBanner x0={bx0} y={planeY + BH * 0.1} BL={BL} BH={BH} label={p.towText} p={p} phase={frame * 0.16} line={line} live={live} />
            <g transform={`translate(${noseX + Lp} ${planeY}) scale(${-Lp / 100} ${Lp / 100}) rotate(${Math.sin(frame / 34) * 1.5})`}>
              <PlaneShape p={p} frame={frame} line={line} />
            </g>
          </svg>
        )}

        {/* boarding-pass ticket */}
        <div
          style={{
            position: 'absolute',
            left: L,
            top: TY,
            width: W - L * 2,
            height: TH,
            display: 'flex',
            background: card,
            border: `4px solid ${line}`,
            borderRadius: 28,
            boxShadow: `12px 12px 0 ${line}`,
            overflow: 'hidden',
            color: p.ink,
            opacity: clamp(ticketIn * 2.5),
            translate: `0 ${mix(120, 0, ticketIn)}px`,
            rotate: `${mix(-3, 0, ticketIn)}deg`,
          }}
        >
          <div style={{ width: 40, background: p.accent, borderRight: `4px dashed ${line}`, flexShrink: 0 }} />
          {/* main: event fields */}
          <div style={{ flex: 1, padding: '28px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ ...labelStyle, opacity: 0.85 * field(0), fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              <span>{p.ticketHeader}</span>
            </div>
            <div style={{ display: 'flex', gap: 52, alignItems: 'flex-end' }}>
              {fields.map(([label, value], i) => {
                const t = field(i + 1);
                return (
                  <div key={i} style={{ opacity: clamp(t * 1.4), translate: `0 ${(1 - t) * 26}px`, filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined }}>
                    <div style={labelStyle}>{label}</div>
                    <div style={{ ...valueStyle, color: i === 2 ? p.accent : p.ink, marginTop: 6 }}>{value}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* stub: host */}
          <div style={{ width: 620, flexShrink: 0, borderLeft: `4px dashed ${line}`, background: dark ? shade(p.surface, 0.06) : p.surface, display: 'flex', alignItems: 'center', gap: 30, padding: '0 36px', opacity: hostIn, translate: `${mix(40, 0, hostIn)}px 0` }}>
            <div
              style={{
                width: hasPhoto ? 150 : 156,
                height: hasPhoto ? 176 : 156,
                borderRadius: hasPhoto ? '75px 75px 22px 22px' : '50%',
                border: `4px solid ${line}`,
                boxShadow: `6px 6px 0 ${line}`,
                overflow: 'hidden',
                background: p.accent2,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                position: 'relative',
                scale: String(mix(0.7, 1, prog(frame, HOST, 26, ease.backOut))),
              }}
            >
              {hasPhoto ? (
                <Img src={p.hostPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <svg width={156} height={156} viewBox="0 0 156 156" style={{ position: 'absolute', inset: 0 }}>
                    <circle cx={78} cy={112} r={58} fill={p.accent} />
                    {[0, 1, 2, 3].map((i) => (
                      <rect key={i} x={0} y={108 + i * 13 + ((frame * 0.25) % 13)} width={156} height={3 + i * 2} fill={p.accent2} />
                    ))}
                  </svg>
                  <span style={{ position: 'relative', ...displayFace(p.font), fontSize: 64, lineHeight: 1, marginTop: -30, color: onColor(p.accent2, '#FFF6EF', '#2A0D1E') }}>{initials}</span>
                </>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={labelStyle}>{p.hostLabel}</div>
              <div style={{ ...displayFace(p.font), fontSize: nameSize, lineHeight: 1.1, letterSpacing: '-0.01em', marginTop: 8, whiteSpace: 'nowrap' }}>{p.hostName}</div>
              <div style={{ fontWeight: 600, fontSize: 32, lineHeight: 1.2, marginTop: 6, opacity: 0.85 }}>{p.hostRole}</div>
            </div>
          </div>
        </div>

        {/* stamp on the ticket */}
        {p.stamp && frame >= STAMP - 2 && (
          <>
            <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <circle cx={STX} cy={STY} r={mix(70, 170, stampRing)} fill="none" stroke={p.pop} strokeWidth={mix(10, 1, stampRing)} opacity={(1 - stampRing) * 0.9} />
            </svg>
            <div
              style={{
                position: 'absolute',
                left: STX - 72,
                top: STY - 72,
                width: 144,
                height: 144,
                borderRadius: '50%',
                border: `5px solid ${line}`,
                outline: `3px dashed ${line}`,
                outlineOffset: -16,
                background: p.pop,
                display: 'grid',
                placeItems: 'center',
                fontFamily: FONTS.spacemono,
                fontWeight: 700,
                fontSize: p.stamp.length > 4 ? 26 : 34,
                letterSpacing: '0.1em',
                color: onColor(p.pop, line, '#FFF6EF'),
                opacity: clamp(stampPop * 3),
                scale: String(mix(1.8, 1, stampPop)),
                rotate: `${mix(-30, -12, stampPop) + Math.sin(frame / 50) * 2}deg`,
                boxShadow: `6px 6px 0 ${line}`,
              }}
            >
              {p.stamp}
            </div>
          </>
        )}

        {/* CTA + fine print */}
        <div style={{ position: 'absolute', left: L, right: L, top: TY + TH + 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 44 }}>
          <div style={{ position: 'relative', scale: String(ctaPop), opacity: clamp(ctaPop * 3), transformOrigin: 'left center' }}>
            <span style={{ display: 'block', padding: '22px 48px', borderRadius: 999, fontWeight: 800, fontSize: 46, lineHeight: 1.1, color: p.background, background: p.ink, boxShadow: `10px 10px 0 ${p.accent}`, whiteSpace: 'nowrap' }}>{p.cta}</span>
            <Glint frame={frame} start={GLINT} dur={40} style={{ position: 'absolute', inset: 0, padding: '22px 48px', borderRadius: 999, fontWeight: 800, fontSize: 46, lineHeight: 1.1, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.35)' }}>
              {p.cta}
            </Glint>
          </div>
        </div>
        <div style={{ position: 'absolute', left: L + accentW, top: line2Top + TS * 0.12 + topicSize * 2.2 + 26, fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 26, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: prog(frame, TOPIC + 40, 24) * 0.8, translate: `${mix(-20, 0, prog(frame, TOPIC + 40, 30))}px 0` }}>{p.fine}</div>

        {/* boarding-pass barcode with a scan line sweeping across in the hold */}
        <svg width={440} height={84} style={{ position: 'absolute', right: L, top: TY + TH + 54, overflow: 'visible', opacity: prog(frame, CTA + 12, 24), translate: `${mix(30, 0, prog(frame, CTA + 12, 30))}px 0` }}>
          {barcode.map((b, i) => (
            <rect key={i} x={b.x} y={0} width={b.w} height={84} fill={p.ink} opacity={0.85} />
          ))}
          <rect x={mix(-20, 460, ((frame - CTA) % 90) / 90)} y={-8} width={6} height={100} rx={3} fill={p.accent} opacity={frame > CTA + 20 ? 0.9 : 0} />
        </svg>

        <Dust frame={frame} width={W} height={H} count={44} color={p.pop} seed={7} speed={0.8} opacity={0.5} maxSize={7} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${(sunX / W) * 100}% ${(sunY / H) * 100}%, ${hexA(p.pop, flash * 0.7)} 0%, ${hexA(p.pop, flash * 0.25)} 16%, transparent 34%)`, mixBlendMode: dark ? 'screen' : 'normal', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
