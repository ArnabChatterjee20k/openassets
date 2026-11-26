import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { HandPalmIcon, RobotIcon, UserIcon } from '@phosphor-icons/react/ssr';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, inOut, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Inbox Promo',
  category: 'promo',
  description:
    'Product promo for an email-for-agents API: a curl call types itself, lands as an envelope with a postmark thump, mail arrives in the agent’s inbox on the beat, then the offer and CTA.',
  tags: ['promo', 'saas', 'api', 'email', 'agents', 'developer', 'product'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120. Five bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  step: text('Step note').default('one API call…'),
  code1: text('Code line 1').default('curl -X POST postnook.email/v1/inboxes'),
  code2: text('Code line 2').default(`-d '{"name": "support-bot"}'`),
  response: text('Response').default('201 Created'),
  addressLabel: text('Address label').default('…and your agent has an address'),
  address: text('Inbox address').default('support-bot@postnook.email'),
  listTitle: text('Inbox title').default('It reads, replies, and asks you first.'),
  msg1: text('Message 1').default('Maya Okafor · Refund for order #4471'),
  msg2: text('Message 2').default('support-bot · Replied with a shipping label'),
  msg3: text('Message 3').default('Needs review · Refund over $500'),
  note: text('Handwritten note').default('humans approve the risky ones'),
  letter: text('Letter note').default('Hi Maya — label attached!'),
  headline: text().default('Inboxes for humans & bots.'),
  offer: text().default('3,000 emails / month free'),
  cta: text('Call to action').default('Start free  →  postnook.email'),
  postmark: text('Postmark text').default('POSTNOOK · 26 NOV 2026'),
  productShot: image('Product screenshot (optional, replaces the inbox list)').default(''),
  font: font('Headline font').default('youngserif'),
  background: color().default('#EEF1E6'),
  surface: color().default('#DCE3CC'),
  ink: color('Text').default('#1E2A1A'),
  accent: color().default('#6A8D3A'),
  accent2: color('Seal & stamp').default('#C9A227'),
  pop: color('Unread').default('#E85D3F'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  moss: { background: '#0E1A14', surface: '#18291F', ink: '#EAF2DC', accent: '#B5E550', accent2: '#E3B53A', pop: '#FF9F43', font: 'gloock' },
  terracotta: { background: '#F1E4D3', surface: '#E5CDB2', ink: '#3B1F14', accent: '#C8553D', accent2: '#4F6D58', pop: '#F2A541', font: 'fraunces' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#2F6F8F', accent2: '#A7864A', pop: '#E4572E', offer: 'Free for your first 3 agents', cta: 'Get an API key  →  postnook.email' },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

// Beat map
const A_END = T.bars(1); // 120: code card exits, the hit
const STAMP = T.bars(1) + T.beats(1); // 150: postmark thump
const C_IN = T.bars(2); // 240: inbox list
const D_IN = T.bars(3); // 360: offer + CTA
const END = T.bars(5);

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

/** A big, friendly envelope with a gold wax seal. `open` lifts the flap (0..1). */
function Envelope({ w, p, open, letter = 0, note = '' }: { w: number; p: P; open: number; letter?: number; note?: string }) {
  const h = w * 0.64;
  const paper = lum(p.background) < 120 ? '#24382B' : '#F8F9F2';
  const flapY = mix(h * 0.56, -h * 0.4, open);
  const ly = mix(h * 0.2, -h * 0.45, letter);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block' }}>
      <rect x={w * 0.02 + 14} y={16} width={w * 0.96} height={h - 4} rx={w * 0.04} fill={p.ink} />
      {open > 0.02 && <path d={`M ${w * 0.02} ${h * 0.02} L ${w / 2} ${flapY} L ${w * 0.98} ${h * 0.02} Z`} fill={p.surface} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />}
      {open > 0.02 && letter > 0 && (
        <g>
          <rect x={w * 0.1} y={ly} width={w * 0.8} height={h * 0.74} rx={8} fill={lum(p.background) < 120 ? '#EAF2DC' : '#FFFFFF'} stroke={p.ink} strokeWidth={4} />
          <text x={w * 0.15} y={ly + h * 0.17} fontFamily={FONTS.caveat} fontWeight={700} fontSize={w * 0.065} fill={lum(p.background) < 120 ? '#1E2A1A' : p.ink}>
            {note}
          </text>
          {[0.28, 0.38].map((k, i) => (
            <rect key={k} x={w * 0.15} y={ly + h * k} width={w * (i ? 0.42 : 0.62)} height={h * 0.035} rx={4} fill={hexA(p.accent, 0.55)} />
          ))}
        </g>
      )}
      <rect x={w * 0.02} y={0} width={w * 0.96} height={h - 4} rx={w * 0.04} fill={paper} stroke={p.ink} strokeWidth={4} />
      <path d={`M ${w * 0.03} ${h * 0.95} L ${w * 0.42} ${h * 0.5} M ${w * 0.97} ${h * 0.95} L ${w * 0.58} ${h * 0.5}`} stroke={hexA(p.ink, 0.35)} strokeWidth={3} fill="none" strokeLinecap="round" />
      {open <= 0.02 && <path d={`M ${w * 0.02} ${h * 0.02} L ${w / 2} ${flapY} L ${w * 0.98} ${h * 0.02}`} fill={p.surface} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />}
      <circle cx={w / 2} cy={h * 0.56} r={w * 0.075} fill={p.accent2} stroke={p.ink} strokeWidth={4} />
      <circle cx={w / 2} cy={h * 0.56} r={w * 0.045} fill="none" stroke={hexA(p.ink, 0.45)} strokeWidth={3} />
    </svg>
  );
}

function Row({ icon: Icon, from, subj, unread, review, p, t }: { icon: typeof UserIcon; from: string; subj: string; unread: boolean; review?: boolean; p: P; t: number }) {
  const paper = lum(p.background) < 120 ? '#24382B' : '#F8F9F2';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '26px 36px',
        borderTop: `2px solid ${hexA(p.ink, 0.1)}`,
        background: review ? hexA(p.accent2, 0.16) : undefined,
        opacity: clamp(t * 1.5),
        translate: `${mix(80, 0, t)}px 0`,
        filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined,
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: unread ? p.pop : 'transparent', scale: String(unread ? ease.backOut(clamp((t - 0.5) * 2)) : 1) }} />
      <div style={{ width: 70, height: 70, borderRadius: '50%', display: 'grid', placeItems: 'center', background: review ? p.accent2 : p.surface, flexShrink: 0 }}>
        <Icon size={40} weight="fill" color={review ? paper : p.ink} />
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 42, lineHeight: 1.15, fontWeight: unread ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span>{from}</span>
        {subj && <span style={{ fontWeight: 400, opacity: 0.72 }}> · {subj}</span>}
      </div>
    </div>
  );
}

const split = (s: string) => {
  const i = s.indexOf(' · ');
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 3)];
};

export default function InboxPromo(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = lum(p.background) < 120;
  const paper = dark ? '#24382B' : '#F8F9F2';
  const push = mix(1, 1.04, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 36, 36, ease.inOut);
  const shake = frame >= STAMP && frame < STAMP + 14 ? Math.sin(frame * 2.3) * (1 - (frame - STAMP) / 14) * 7 : 0;
  const card: CSSProperties = { background: paper, borderRadius: 28, border: `3px solid ${p.ink}`, boxShadow: `14px 16px 0 ${p.ink}` };

  // ---- Scene A: the API call types itself (bar 1)
  const aVis = inOut(frame, 4, 18, 86, 14);
  const aExit = prog(frame, 108, 14, ease.in);
  const full = p.code1 + p.code2;
  const typedN = Math.max(0, Math.floor(((frame - 14) / FPS) * 52));
  const l1 = p.code1.slice(0, typedN);
  const l2 = typedN > p.code1.length ? p.code2.slice(0, typedN - p.code1.length) : '';
  const doneTyping = typedN >= full.length;
  const caret = Math.floor(frame / 15) % 2 === 0 || !doneTyping;
  const resp = prog(frame, T.beats(3), 16, ease.backOut);

  // ---- Scene B: envelope + postmark + address (bar 2)
  const bIn = prog(frame, A_END, 28, ease.backOut);
  const bOut = prog(frame, C_IN - 14, 16, ease.in);
  const stampT = prog(frame, STAMP, 12, ease.out);
  const ring = prog(frame, STAMP, 40, ease.out);
  const flash = keys(frame, [A_END - 2, A_END + 3, A_END + 24], [0, 0.7, 0], [ease.out, ease.outSoft]);
  const flap = keys(frame, [A_END + 40, A_END + 70], [0, 1], ease.inOutSoft);

  // ---- Scene C: mail arrives on the beat (bar 3)
  const cVis = inOut(frame, C_IN, 20, 92, 14);
  const rowT = (i: number) => prog(frame, C_IN + 12 + i * T.beat, 24, ease.out);
  const noteT = prog(frame, C_IN + T.beats(3) + 6, 26, ease.out);

  // ---- Scene D: headline, offer, CTA (bars 4-5)
  const dOn = frame >= D_IN;
  const offerT = prog(frame, D_IN + T.beats(2), 22, ease.backOut);
  const ctaT = prog(frame, D_IN + T.beats(3), 24, ease.backOut);
  const pmT = prog(frame, D_IN + T.beats(5), 12, ease.out);
  const envIn = prog(frame, D_IN + 10, 34, ease.out);
  const letterUp = keys(frame, [D_IN + T.beats(1), D_IN + T.beats(2)], [0, 1], ease.inOutSoft) + 0.04 * Math.sin((frame - D_IN) / 24) * prog(frame, D_IN + T.beats(2), 30);
  const ring2 = prog(frame, D_IN + T.beats(5), 40, ease.out);
  const headSize = p.headline.length > 20 ? 124 : 148;
  const headBlock: CSSProperties = {
    position: 'absolute',
    left: 130,
    width: 1000,
    top: 150,
    ...displayFace(p.font),
    fontSize: headSize,
    lineHeight: 1.0,
    letterSpacing: '-0.03em',
  };

  const glows = [
    { x: W * 0.5, y: H * 0.5, size: 1500, color: hexA(p.accent, dark ? 0.3 : 0.28), opacity: 0.7 + 0.15 * Math.sin(frame / 40) },
    { x: W * 0.15, y: H * 0.95, size: 1100, color: hexA(p.accent2, 0.3), opacity: 0.7 },
    { x: W * 0.9, y: H * 0.1, size: 900, color: hexA(p.accent, 0.2), opacity: prog(frame, C_IN, 60) * 0.8 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 44, y: -frame * 0.15, color: dark ? '234,242,220' : '30,42,26' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={glows}
        grain={0}
        vignette={dark ? 0.45 : 0.08}
      />
      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={44} color={dark ? p.accent : p.accent2} seed={9} speed={0.6} opacity={0.4} />

        {/* Scene A */}
        {frame < A_END + 6 && (
          <div style={{ position: 'absolute', left: 320, top: 330, width: 1280, opacity: aVis * (1 - aExit), scale: String(mix(0.96, 1, prog(frame, 4, 30)) * mix(1, 1.12, aExit)), filter: aExit > 0 ? `blur(${aExit * 14}px)` : undefined }}>
            <div style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 72, color: p.accent, rotate: '-3deg', marginBottom: 18, marginLeft: 10 }}>{p.step}</div>
            <div style={{ ...card, padding: '44px 54px', fontFamily: FONTS.mono, fontSize: 44, lineHeight: 1.45 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 26 }}>
                {[p.pop, p.accent2, p.accent].map((c) => (
                  <span key={c} style={{ width: 18, height: 18, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <div style={{ whiteSpace: 'pre' }}>
                <span style={{ color: p.accent, fontWeight: 700 }}>$ </span>
                {l1}
                {!l2 && caret && <span style={{ background: p.ink, color: p.ink }}>_</span>}
              </div>
              <div style={{ whiteSpace: 'pre', minHeight: 66 }}>
                {'  '}
                {l2}
                {l2 && caret && <span style={{ background: p.ink, color: p.ink }}>_</span>}
              </div>
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 16, opacity: clamp(resp * 2), scale: String(mix(0.8, 1, resp)), transformOrigin: 'left center' }}>
                <span style={{ padding: '6px 20px', borderRadius: 99, background: p.accent, color: paper, fontWeight: 700 }}>{p.response}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scene B */}
        {frame >= A_END && frame < C_IN + 4 && (
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - bOut, translate: `0 ${-bOut * 60}px` }}>
            <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
              <circle cx={W / 2 + 200} cy={400} r={120 + ring * 520} fill="none" stroke={p.accent2} strokeWidth={mix(8, 1, ring)} opacity={frame >= STAMP ? (1 - ring) * 0.7 : 0} />
            </svg>
            <div style={{ position: 'absolute', left: W / 2 - 300, top: 190, opacity: clamp(bIn * 2), translate: `0 ${mix(260, 0, bIn)}px`, rotate: `${mix(-8, -3, bIn)}deg` }}>
              <Envelope w={600} p={p} open={flap} letter={flap * 0.3} note={p.letter} />
            </div>
            {frame >= STAMP && (
              <div style={{ position: 'absolute', left: W / 2 + 40, top: 280, rotate: '-12deg', opacity: stampT, scale: String(mix(1.7, 1, stampT)), mixBlendMode: dark ? 'screen' : 'multiply' }}>
                <Postmark size={190} p={p} id="pa" />
              </div>
            )}
            <div style={{ position: 'absolute', top: 680, width: W, display: 'flex', justifyContent: 'center' }}>
              <WordsIn text={p.addressLabel} frame={frame} start={A_END + 14} style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 64, color: p.accent, justifyContent: 'center' }} />
            </div>
            <SweepReveal frame={frame} start={STAMP + 4} dur={34} style={{ position: 'absolute', top: 770, width: W, textAlign: 'center', ...displayFace(p.font), fontSize: p.address.length > 28 ? 92 : 108, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>
              {p.address}
            </SweepReveal>
          </div>
        )}

        {/* Scene C */}
        {frame >= C_IN && frame < D_IN + 4 && (
          <div style={{ position: 'absolute', inset: 0, opacity: cVis }}>
            <div style={{ position: 'absolute', left: 120, top: 300, width: 620 }}>
              <WordsIn text={p.listTitle} frame={frame} start={C_IN + 4} style={{ ...displayFace(p.font), fontSize: 92, lineHeight: 1.05, letterSpacing: '-0.025em' }} />
              <div style={{ marginTop: 60, fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 60, color: p.accent, rotate: '-3deg', opacity: noteT, translate: `${mix(-30, 0, noteT)}px 0`, display: 'flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap' }}>
                {p.note}
                <svg width={110} height={60} viewBox="0 0 110 60" style={{ overflow: 'visible' }}>
                  <path d="M4 40 C 30 56, 70 54, 100 22 M 82 18 L 101 21 L 98 40" fill="none" stroke={p.accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={260} strokeDashoffset={260 * (1 - noteT)} />
                </svg>
              </div>
            </div>
            <div style={{ position: 'absolute', left: 800, top: 230, width: 1000, translate: `${mix(120, 0, prog(frame, C_IN, 30))}px 0` }}>
              {p.productShot ? (
                <div style={{ ...card, overflow: 'hidden', height: 600 }}>
                  <Img src={p.productShot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '28px 36px', background: p.surface }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: p.accent, display: 'grid', placeItems: 'center' }}>
                      <RobotIcon size={42} weight="fill" color={paper} />
                    </div>
                    <div style={{ flex: 1, fontSize: 44, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address}</div>
                    <div style={{ fontSize: 34, fontWeight: 700, color: '#FFF8F2', background: p.pop, borderRadius: 99, padding: '6px 20px', scale: String(1 + 0.25 * keys(frame, [C_IN + 72, C_IN + 78, C_IN + 96], [0, 1, 0])) }}>
                      {frame >= C_IN + 72 ? '2 new' : '1 new'}
                    </div>
                  </div>
                  {[
                    { icon: UserIcon, s: p.msg1, unread: true },
                    { icon: RobotIcon, s: p.msg2, unread: false },
                    { icon: HandPalmIcon, s: p.msg3, unread: true, review: true },
                  ].map((m, i) => {
                    const [from, subj] = split(m.s);
                    return <Row key={i} icon={m.icon} from={from} subj={subj} unread={m.unread} review={m.review} p={p} t={rowT(i)} />;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scene D */}
        {dOn && (
          <>
            <SweepReveal frame={frame} start={D_IN + 4} dur={36} style={headBlock}>
              <span style={{ color: p.ink }}>{p.headline}</span>
            </SweepReveal>
            <Glint frame={frame} start={D_IN + T.bars(1) + T.beats(1)} dur={44} style={{ ...headBlock, color: p.accent }}>
              {p.headline}
            </Glint>
            {/* Hero: the envelope opens and the agent's reply rises out */}
            <div style={{ position: 'absolute', left: 1190, top: 420, opacity: clamp(envIn * 1.6), translate: `${mix(220, 0, envIn)}px ${Math.sin((frame - D_IN) / 40) * 8}px`, rotate: `${mix(14, 5, envIn)}deg` }}>
              <Envelope w={600} p={p} open={1} letter={letterUp} note={p.letter} />
            </div>
            <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
              <circle cx={1545} cy={545} r={90 + ring2 * 420} fill="none" stroke={p.accent2} strokeWidth={mix(7, 1, ring2)} opacity={frame >= D_IN + T.beats(5) ? (1 - ring2) * 0.7 : 0} />
            </svg>
            <div style={{ position: 'absolute', left: 130, top: 150 + headSize * 3 + 40, display: 'flex' }}>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  padding: '12px 34px',
                  borderRadius: 16,
                  background: hexA(p.accent, 0.16),
                  border: `3px dashed ${p.accent}`,
                  opacity: clamp(offerT * 2),
                  scale: String(mix(0.7, 1, offerT)),
                  rotate: '-1.5deg',
                }}
              >
                {p.offer}
              </div>
            </div>
            <div style={{ position: 'absolute', left: 130, top: 150 + headSize * 3 + 170, display: 'flex', transformOrigin: 'left center' }}>
              <div
                style={{
                  fontSize: 50,
                  fontWeight: 700,
                  padding: '24px 52px',
                  borderRadius: 999,
                  background: p.ink,
                  color: p.background,
                  boxShadow: `8px 10px 0 ${p.accent}`,
                  whiteSpace: 'pre',
                  opacity: clamp(ctaT * 2),
                  scale: String(mix(0.6, 1, ctaT)),
                }}
              >
                {p.cta}
              </div>
            </div>
            {frame >= D_IN + T.beats(5) && (
              <div style={{ position: 'absolute', left: 1470, top: 470, rotate: '-8deg', opacity: pmT * 0.95, scale: String(mix(1.8, 1, pmT)), mixBlendMode: dark ? 'screen' : 'multiply' }}>
                <Postmark size={150} p={p} id="pd" />
              </div>
            )}
          </>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${hexA(p.accent2, flash)} 0%, transparent 55%)`, mixBlendMode: dark ? 'screen' : 'multiply', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.18} frame={frame} />
    </AbsoluteFill>
  );
}
