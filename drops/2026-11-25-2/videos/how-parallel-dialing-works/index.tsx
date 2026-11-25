import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'How Parallel Dialing Works',
  category: 'tech',
  description:
    'Feature explainer: four call lanes dial at once, three drop out on the beat, one connects with a flash; the call becomes a live caller card, a CRM log card stamps in, stats count up, end card with CTA.',
  tags: ['explainer', 'feature', 'saas', 'sales', 'dialer', 'product demo'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120. Five bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('How Ringside works'),
  line1: text('Title line 1').default('4 LINES.'),
  line2: text('Title line 2').default('1 CONVERSATION.'),
  lead1: text('Lane 1 lead').default('Maya Okafor · Brightloop'),
  lead2: text('Lane 2 lead').default('Theo Lindqvist · Parcelry'),
  lead3: text('Lane 3 lead (connects)').default('Priya Raman · Northbeam'),
  lead4: text('Lane 4 lead').default('Diego Salas · Fernhill'),
  role: text('Connected lead role').default('VP Sales · Northbeam · 240 seats'),
  crm: text('CRM name').default('HubSpot'),
  disposition: text().default('Meeting booked'),
  callback: text('Callback').default('Tue 10:30'),
  stat1: text('Stat 1').default('4×'),
  stat1Label: text('Stat 1 label').default('conversations per hour'),
  stat2: text('Stat 2').default('0 min'),
  stat2Label: text('Stat 2 label').default('of manual call logging'),
  brand: text('Brand').default('Ringside'),
  tagline: text().default('The parallel dialer for HubSpot & Salesforce'),
  cta: text('Call to action').default('Start dialing free  →  ringside.so'),
  logo: image('Logo (optional)').default(''),
  background: color().default('#F1E4D3'),
  surface: color().default('#E5CDB2'),
  ink: color().default('#3B1F14'),
  accent: color().default('#C8553D'),
  accent2: color('Second accent').default('#4F6D58'),
  pop: color('Pop').default('#F2A541'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'cherry-cola': { background: '#2A0A10', surface: '#3F1019', ink: '#FFE8E0', accent: '#E3173E', accent2: '#F5C6AA', pop: '#F7B32B' },
  midcentury: { background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#2C7873', accent2: '#D96C3D', pop: '#E9B44C' },
  salesforce: { crm: 'Salesforce', eyebrow: 'Dial from any Salesforce report', background: '#EEF1E6', surface: '#DCE3CC', ink: '#1E2A1A', accent: '#6A8D3A', accent2: '#2F6F8F', pop: '#E85D3F' },
};

type P = z.infer<typeof schema>;

const W = 1920;
const H = 1080;
const B = T.beat;
const CONNECT = T.bars(2); // 240: lane 3 picks up
const LOG = T.bars(3); // 360: CRM card stamps in
const END = T.bars(4); // 480: end card
const DROPS = [T.bars(1) + 45, T.bars(1) + 105, -1, T.bars(1) + 75]; // 165, 225, —, 195
const DROP_LABEL = ['No answer', 'Voicemail dropped', '', 'No answer'];

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

const label = (size: number, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: FONTS.chakra,
  fontWeight: 700,
  fontSize: size,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  ...extra,
});

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Lane rects
const LX = 240;
const LW = 1440;
const LH = 132;
const LY = (i: number) => 318 + i * (LH + 26);
// Caller card rect (lane 3 grows into it)
const CARD = { x: 150, y: 300, w: 880, h: 440 };

function Lane({ i, f, p, lead }: { i: number; f: number; p: P; lead: string }) {
  const dark = isDark(p.background);
  const enter = prog(f, T.bars(1) + i * 5, 34, ease.out);
  const dropAt = DROPS[i];
  const dropped = dropAt > 0 ? prog(f, dropAt, 16, ease.out) : 0;
  const exit = prog(f, CONNECT + 4 + i * 4, 26, ease.in);
  if (f < T.bars(1) || exit >= 1) return null;
  const [name, co] = lead.split(' · ');
  const dialing = dropAt > 0 ? f < dropAt : true;
  const secs = Math.max(0, (Math.min(f, dropAt > 0 ? dropAt : f) - T.bars(1)) / FPS) + i * 1.3;
  const local = ((f - T.bars(1) - i * 7) % B + B) % B;
  const ripple = local / B;
  const shake = dropAt > 0 && f >= dropAt && f < dropAt + 10 ? Math.sin((f - dropAt) * 2.4) * (10 - (f - dropAt)) * 1.2 : 0;
  const dots = '.'.repeat(1 + (Math.floor(f / 12) % 3));
  return (
    <div
      style={{
        position: 'absolute',
        left: LX,
        top: LY(i),
        width: LW,
        height: LH,
        borderRadius: 28,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 34,
        padding: '0 40px',
        background: dark ? p.surface : hexA('#FFFFFF', 0.5),
        border: `3px solid ${hexA(p.ink, mix(0.9, 0.25, dropped))}`,
        boxShadow: `${mix(10, 0, dropped)}px ${mix(10, 0, dropped)}px 0 ${p.ink}`,
        color: p.ink,
        opacity: clamp(enter * 1.3) * mix(1, 0.42, dropped) * (1 - exit),
        translate: `${mix(-160, 0, enter) - exit * 220 + shake}px ${mix(30, 0, enter)}px`,
        filter: enter < 1 ? `blur(${(1 - enter) * 12}px)` : undefined,
      }}
    >
      <span style={label(40, { letterSpacing: '0.04em', width: 70 })}>L{i + 1}</span>
      {/* phone dot with a ring ripple on every beat while dialing */}
      <div style={{ position: 'relative', width: 54, height: 54 }}>
        {dialing && (
          <div
            style={{
              position: 'absolute',
              left: 27 - mix(27, 64, ripple),
              top: 27 - mix(27, 64, ripple),
              width: mix(54, 128, ripple),
              height: mix(54, 128, ripple),
              borderRadius: '50%',
              border: `4px solid ${p.accent}`,
              opacity: (1 - ripple) * 0.9,
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dialing ? p.accent : hexA(p.ink, 0.35) }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: 50, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{name}</div>
        {co && <div style={{ fontFamily: FONTS.familjen, fontSize: 32, opacity: 0.72, whiteSpace: 'nowrap' }}>{co}</div>}
      </div>
      <span
        style={label(30, {
          letterSpacing: '0.16em',
          padding: '12px 24px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          border: `3px solid ${hexA(p.ink, 0.5)}`,
          background: dialing ? hexA(p.accent2, 0.16) : 'transparent',
          color: p.ink,
          minWidth: 220,
          textAlign: 'center',
        })}
      >
        {dialing ? `Dialing${dots}` : DROP_LABEL[i]}
      </span>
      <span style={label(36, { letterSpacing: '0.06em', width: 110, textAlign: 'right' })}>{fmt(secs)}</span>
    </div>
  );
}

/** Lane 3: dials like the others, connects on the bar-3 downbeat and grows into the live caller card. */
function HotLane({ f, p }: { f: number; p: P }) {
  const enter = prog(f, T.bars(1) + 10, 34, ease.out);
  if (f < T.bars(1)) return null;
  const grow = prog(f, CONNECT + 6, 40, ease.inOut);
  const exit = prog(f, END - 14, 22, ease.in);
  const x = mix(LX, CARD.x, grow);
  const y = mix(LY(2), CARD.y, grow);
  const w = mix(LW, CARD.w, grow);
  const h = mix(LH, CARD.h, grow);
  const connected = f >= CONNECT;
  const pop = keys(f, [CONNECT - 1, CONNECT + 4, CONNECT + 22], [1, 1.05, 1], [ease.out, ease.inOutSoft]);
  const [name, co] = p.lead3.split(' · ');
  const small = 1 - prog(f, CONNECT + 4, 12, ease.out);
  const big = prog(f, CONNECT + 30, 22, ease.out);
  const local = ((f - T.bars(1) - 14) % B + B) % B;
  const ripple = local / B;
  const talk = Math.max(0, (f - CONNECT) / FPS);
  const light = isDark(p.background) ? p.ink : p.background;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: mix(28, 40, grow),
        boxSizing: 'border-box',
        background: connected ? p.accent : isDark(p.background) ? p.surface : hexA('#FFFFFF', 0.5),
        border: `${connected ? 5 : 3}px solid ${p.ink}`,
        boxShadow: `${mix(10, 18, grow)}px ${mix(10, 18, grow)}px 0 ${p.ink}`,
        color: connected ? light : p.ink,
        opacity: clamp(enter * 1.3) * (1 - exit),
        translate: `${mix(-160, 0, enter)}px ${mix(30, 0, enter) + exit * 40}px`,
        scale: String(pop * mix(1, 0.94, exit)),
        filter: enter < 1 ? `blur(${(1 - enter) * 12}px)` : exit > 0 ? `blur(${exit * 10}px)` : undefined,
        overflow: 'hidden',
      }}
    >
      {/* compact lane content */}
      {small > 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 34, padding: '0 40px', opacity: small }}>
          <span style={label(40, { letterSpacing: '0.04em', width: 70 })}>L3</span>
          <div style={{ position: 'relative', width: 54, height: 54 }}>
            {!connected && (
              <div
                style={{
                  position: 'absolute',
                  left: 27 - mix(27, 64, ripple),
                  top: 27 - mix(27, 64, ripple),
                  width: mix(54, 128, ripple),
                  height: mix(54, 128, ripple),
                  borderRadius: '50%',
                  border: `4px solid ${p.accent}`,
                  opacity: (1 - ripple) * 0.9,
                }}
              />
            )}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: connected ? p.pop : p.accent }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: 50, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontFamily: FONTS.familjen, fontSize: 32, opacity: 0.72 }}>{co}</div>
          </div>
          <span style={label(30, { letterSpacing: '0.16em', padding: '12px 24px', borderRadius: 999, border: `3px solid ${hexA(p.ink, 0.5)}`, minWidth: 220, textAlign: 'center', background: connected ? p.pop : hexA(p.accent2, 0.16), color: p.ink })}>
            {connected ? 'Connected' : `Dialing${'.'.repeat(1 + (Math.floor(f / 12) % 3))}`}
          </span>
          <span style={label(36, { letterSpacing: '0.06em', width: 110, textAlign: 'right' })}>{fmt((f - T.bars(1)) / FPS + 2.6)}</span>
        </div>
      )}
      {/* caller card content */}
      {big > 0 && (
        <div style={{ position: 'absolute', inset: 0, padding: '48px 56px', opacity: big, translate: `0 ${mix(24, 0, big)}px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: p.pop, boxShadow: `0 0 0 ${6 + Math.sin(f / 8) * 3}px ${hexA(p.pop, 0.35)}` }} />
            <span style={label(32)}>Live · L3 · {fmt(4.6 + talk)}</span>
          </div>
          <div style={{ ...displayFace('dela'), fontSize: name.length > 14 ? 76 : 96, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 34, whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontFamily: FONTS.familjen, fontSize: 44, marginTop: 14, opacity: 0.92 }}>{p.role}</div>
          {/* voice waveform */}
          <div style={{ position: 'absolute', left: 56, right: 56, bottom: 52, height: 96, display: 'flex', alignItems: 'center', gap: 9 }}>
            {Array.from({ length: 42 }, (_, k) => {
              const a = 0.25 + 0.75 * Math.abs(Math.sin(f / 5 + k * 0.7) * Math.sin(f / 13 + k * 0.31)) * (0.6 + rand(k) * 0.4);
              return <span key={k} style={{ flex: 1, height: `${a * 100}%`, borderRadius: 99, background: k % 7 === 3 ? p.pop : hexA(light, 0.85) }} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LogCard({ f, p }: { f: number; p: P }) {
  const t = prog(f, LOG, 18, ease.out);
  const exit = prog(f, END - 10, 22, ease.in);
  if (f < LOG - 2) return null;
  const rows: [string, string][] = [
    ['Call', `4m 12s · ${p.lead3.split(' · ')[0]}`],
    ['Disposition', p.disposition],
    ['Callback', p.callback],
    ['Notes', 'Synced to record'],
  ];
  const dark = isDark(p.background);
  return (
    <div
      style={{
        position: 'absolute',
        left: 1110,
        top: 268,
        width: 660,
        boxSizing: 'border-box',
        padding: '32px 44px 18px',
        borderRadius: 32,
        background: dark ? p.surface : '#FBF5EC',
        border: `4px solid ${p.ink}`,
        boxShadow: `14px 14px 0 ${p.accent2}`,
        color: p.ink,
        opacity: clamp(t * 2) * (1 - exit),
        scale: String(mix(1.3, 1, t) * mix(1, 0.94, exit)),
        rotate: `${mix(-9, -2.5, t)}deg`,
        filter: t < 1 ? `blur(${(1 - t) * 10}px)` : exit > 0 ? `blur(${exit * 10}px)` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={label(30, { color: p.accent2 })}>✓ Logged to {p.crm}</span>
        <span style={label(26, { opacity: 0.6, letterSpacing: '0.1em' })}>auto</span>
      </div>
      {rows.map(([k, v], i) => {
        const r = prog(f, LOG + 14 + i * 6, 20, ease.out);
        return (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20, padding: '15px 0', borderTop: i ? `2px dashed ${hexA(p.ink, 0.22)}` : 'none', marginTop: i ? 0 : 14, opacity: r, translate: `${mix(24, 0, r)}px 0` }}>
            <span style={label(26, { opacity: 0.7, letterSpacing: '0.16em' })}>{k}</span>
            <span style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: 44, whiteSpace: 'nowrap', color: k === 'Callback' ? p.accent : p.ink }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
}

/** While the caller card holds: what happened to the other three lines (fills the right side until the log card lands). */
function Outcomes({ f, p }: { f: number; p: P }) {
  const start = CONNECT + 34;
  const exit = prog(f, LOG - 16, 18, ease.in);
  if (f < start || exit >= 1) return null;
  const items: [string, string, string][] = [
    ['L1', p.lead1.split(' · ')[0], 'Retry Thu 9:00'],
    ['L2', p.lead2.split(' · ')[0], 'VM dropped ✓'],
    ['L4', p.lead4.split(' · ')[0], 'Retry Thu 9:00'],
  ];
  return (
    <div style={{ position: 'absolute', left: 1130, top: 330, width: 620 }}>
      <div style={label(28, { opacity: prog(f, start, 16) * (1 - exit), color: p.ink, marginBottom: 22 })}>Meanwhile, on L1 · L2 · L4</div>
      {items.map(([l, n, s], i) => {
        const t = prog(f, start + 6 + i * 6, 22, ease.out);
        const x = prog(f, LOG - 16 + i * 3, 16, ease.in);
        return (
          <div
            key={l}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '20px 28px',
              marginBottom: 18,
              borderRadius: 22,
              border: `3px solid ${hexA(p.ink, 0.35)}`,
              background: hexA(p.surface, 0.55),
              color: p.ink,
              opacity: clamp(t * 1.5) * (1 - x),
              translate: `${mix(60, 0, t) + x * 80}px 0`,
            }}
          >
            <span style={label(32, { letterSpacing: '0.04em', width: 56 })}>{l}</span>
            <span style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: 44, flex: 1, whiteSpace: 'nowrap' }}>{n}</span>
            <span style={label(26, { letterSpacing: '0.1em', color: i === 1 ? p.accent2 : p.ink, opacity: 0.85, whiteSpace: 'nowrap' })}>{s}</span>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ f, p, at, x, value, caption }: { f: number; p: P; at: number; x: number; value: string; caption: string }) {
  const t = prog(f, at, 24, ease.backOut);
  const exit = prog(f, END - 10, 22, ease.in);
  if (f < at) return null;
  // count up the numeric part on entry
  const m = value.match(/^(\d+)(.*)$/);
  const shown = m ? `${Math.round(Number(m[1]) * clamp(prog(f, at, 30, ease.out)))}${m[2]}` : value;
  return (
    <div style={{ position: 'absolute', left: x, top: 820, display: 'flex', alignItems: 'center', gap: 26, opacity: clamp(t * 2) * (1 - exit), translate: `0 ${mix(40, 0, t) + exit * 30}px` }}>
      <span style={{ ...displayFace('dela'), fontSize: 120, lineHeight: 1, color: p.accent, textShadow: `6px 6px 0 ${p.ink}`, whiteSpace: 'nowrap' }}>{shown}</span>
      <span style={{ fontFamily: FONTS.familjen, fontWeight: 500, fontSize: 44, color: p.ink, maxWidth: 420, lineHeight: 1.1 }}>{caption}</span>
    </div>
  );
}

export default function HowParallelDialingWorks(p: P) {
  const f = useCurrentFrame();
  const dark = isDark(p.background);
  const end = video.durationInFrames;

  // Shake on the slams: title lines and the connect.
  const hit = (at: number, amp: number) => (f >= at && f < at + 14 ? Math.sin((f - at) * 2.1) * amp * (1 - (f - at) / 14) : 0);
  const shakeX = hit(20, 10) + hit(60, 8) + hit(CONNECT, 16) + hit(LOG, 6);
  const shakeY = hit(20, 6) * 0.6 + hit(CONNECT, 10) * 0.7;
  const push = mix(1, 1.04, prog(f, 0, end, ease.inOutSoft));
  const outro = prog(f, end - 24, 24, ease.inOut);

  // Bar 1 title
  const t1 = prog(f, 20, 16, ease.out);
  const t2 = prog(f, 60, 16, ease.out);
  const titleOut = prog(f, T.bars(1) - 14, 18, ease.in);
  const flash = keys(f, [CONNECT - 2, CONNECT + 2, CONNECT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(f, CONNECT, 60, ease.out);
  const hotY = LY(2) + LH / 2;
  // Header (bars 2–4)
  const hdr = prog(f, T.bars(1) + 4, 24, ease.out) * (1 - prog(f, END - 12, 18, ease.in));
  // End card
  const e = (d: number, dur = 30) => prog(f, END + d, dur, ease.out);
  const brandSize = p.brand.length > 10 ? 190 : 250;
  const brandY = p.logo ? 430 : 360;
  const brandBlock: CSSProperties = { position: 'absolute', left: 0, width: W, top: brandY, textAlign: 'center', ...displayFace('dela'), fontSize: brandSize, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap' };
  const light = dark ? p.background : '#F8EFE3';

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={f}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 44, y: -f * 0.15, color: dark ? '255,232,224' : '59,31,20' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,250,240,0.75)'}
        glows={[]}
        grain={0}
        vignette={dark ? 0.5 : 0.12}
      />
      {/* clay sun drifting behind everything */}
      <div
        style={{
          position: 'absolute',
          left: 1250 + Math.sin(f / 90) * 30,
          top: -260 + Math.cos(f / 110) * 20,
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: hexA(p.accent, dark ? 0.2 : 0.13),
        }}
      />
      <div style={{ position: 'absolute', left: -240, top: 700, width: 640, height: 640, borderRadius: '50%', background: hexA(p.accent2, dark ? 0.18 : 0.12), translate: `0 ${Math.sin(f / 70) * 16}px` }} />

      <AbsoluteFill style={{ scale: String(push), translate: `${shakeX}px ${shakeY}px`, opacity: 1 - outro }}>
        <Dust frame={f} width={W} height={H} count={40} color={p.accent} seed={9} speed={0.8} opacity={dark ? 0.5 : 0.35} maxSize={5} />

        {/* ---------- Bar 1: the title ---------- */}
        {f < T.bars(1) + 6 && (
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - titleOut, translate: `0 ${-titleOut * 60}px`, filter: titleOut > 0 ? `blur(${titleOut * 14}px)` : undefined }}>
            <div style={{ position: 'absolute', width: W, top: 250, textAlign: 'center', ...label(38, { letterSpacing: '0.42em', color: p.ink }), opacity: prog(f, 4, 20) }}>
              <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: p.pop, marginRight: 20, verticalAlign: 'middle' }} />
              {p.eyebrow}
            </div>
            <div
              style={{
                position: 'absolute',
                width: W,
                top: 330,
                textAlign: 'center',
                ...displayFace('dela'),
                fontSize: 250,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: p.ink,
                opacity: clamp(t1 * 2),
                scale: String(mix(1.45, 1, t1)),
                filter: t1 < 1 ? `blur(${(1 - t1) * 16}px)` : undefined,
              }}
            >
              {p.line1}
            </div>
            <div
              style={{
                position: 'absolute',
                width: W,
                top: 610,
                textAlign: 'center',
                ...displayFace('dela'),
                fontSize: p.line2.length > 15 ? 104 : 124,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: p.accent,
                textShadow: `8px 8px 0 ${p.ink}`,
                opacity: clamp(t2 * 2),
                scale: String(mix(1.4, 1, t2)),
                filter: t2 < 1 ? `blur(${(1 - t2) * 16}px)` : undefined,
              }}
            >
              {p.line2}
            </div>
          </div>
        )}

        {/* ---------- Header (bars 2–4) ---------- */}
        <div style={{ position: 'absolute', left: 150, top: 130, display: 'flex', alignItems: 'center', gap: 26, opacity: hdr, translate: `${mix(-30, 0, hdr)}px 0` }}>
          <span style={{ ...displayFace('dela'), fontSize: 64, color: p.ink }}>{f < CONNECT ? p.line1 : p.line2}</span>
          <span style={label(30, { color: p.ink, opacity: 0.75 })}>{f < CONNECT ? 'Dialing in parallel' : f < LOG ? 'First human wins' : `Auto-logged to ${p.crm}`}</span>
        </div>

        {/* ---------- Bars 2–4: lanes → connect → caller card ---------- */}
        {f >= CONNECT && (
          <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
            {[0, 8, 16].map((d, k) => {
              const s = prog(f, CONNECT + d, 70, ease.out);
              return <circle key={k} cx={LX + 120} cy={hotY} r={70 + s * (1100 - k * 200)} fill="none" stroke={k === 1 ? p.pop : p.accent} strokeWidth={mix(14, 1, s)} opacity={f >= CONNECT + d ? (1 - s) * 0.85 : 0} />;
            })}
          </svg>
        )}
        {[0, 1, 3].map((i) => (
          <Lane key={i} i={i} f={f} p={p} lead={[p.lead1, p.lead2, p.lead3, p.lead4][i]} />
        ))}
        <HotLane f={f} p={p} />
        <Outcomes f={f} p={p} />
        <LogCard f={f} p={p} />
        <Stat f={f} p={p} at={LOG + 60} x={150} value={p.stat1} caption={p.stat1Label} />
        <Stat f={f} p={p} at={LOG + 75} x={1110} value={p.stat2} caption={p.stat2Label} />

        {/* ---------- Bar 5: end card ---------- */}
        {f >= END - 4 && (
          <>
            <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
              {[0, 1, 2, 3].map((k) => {
                const r = ((f - END) / B + k) % 4;
                return <circle key={k} cx={W / 2} cy={brandY + brandSize * 0.5} r={220 + r * 230} fill="none" stroke={p.accent} strokeWidth={4} opacity={clamp(e(0, 20)) * (1 - r / 4) * 0.45} />;
              })}
            </svg>
            {p.logo && <Img src={p.logo} style={{ position: 'absolute', left: W / 2 - 160, top: 190, width: 320, height: 180, objectFit: 'contain', opacity: e(0), translate: `0 ${mix(30, 0, e(0))}px` }} />}
            <SweepReveal frame={f} start={END + 2} dur={30} style={brandBlock}>
              <span style={{ color: p.ink, textShadow: `10px 10px 0 ${p.accent}` }}>{p.brand}</span>
            </SweepReveal>
            <Glint frame={f} start={END + B * 2} dur={40} style={brandBlock}>
              {p.brand}
            </Glint>
            <WordsIn text={p.tagline} frame={f} start={END + 16} style={{ position: 'absolute', width: W, top: brandY + brandSize + 34, justifyContent: 'center', fontFamily: FONTS.familjen, fontWeight: 500, fontSize: 52, color: p.ink }} />
            <div style={{ position: 'absolute', width: W, top: brandY + brandSize + 140, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  ...label(36, { letterSpacing: '0.12em' }),
                  whiteSpace: 'pre',
                  padding: '24px 44px',
                  borderRadius: 999,
                  background: p.ink,
                  color: light,
                  boxShadow: `8px 8px 0 ${p.accent}`,
                  scale: String(prog(f, END + B, 24, ease.backOut)),
                  opacity: clamp(prog(f, END + B, 8)),
                }}
              >
                {p.cta}
              </div>
            </div>
          </>
        )}
      </AbsoluteFill>

      {/* Connect flash: a saffron bloom from lane 3 */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${(LX + 120) / W * 100}% ${(hotY / H) * 100}%, ${hexA(p.pop, flash * 0.9)} 0%, ${hexA(p.pop, flash * 0.35)} 30%, transparent 65%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.4 : 0.1} frame={f} />
    </AbsoluteFill>
  );
}
