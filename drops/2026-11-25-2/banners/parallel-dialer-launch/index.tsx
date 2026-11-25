import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Parallel Dialer Launch',
  description: 'Launch banner for Ringside: "Dial 4. Talk to 1." beside a live four-lane dialer panel where one line connects with ripple rings and a "Logged to HubSpot" chip.',
  tags: ['launch', 'hero', 'social', 'sales', 'dialer'],
};

export const schema = z.object({
  eyebrow: text().default('New · Parallel dialer'),
  headline1: text('Headline line 1').default('Dial 4.'),
  headline2: text('Headline line 2 (accent)').default('Talk to 1.'),
  body: textarea().default('Ringside calls four leads at once from your HubSpot views and Salesforce reports, then logs every call and callback to the right record.'),
  cta: text('Button (empty to hide)').default('Start dialing free'),
  note: text('Small print').default('Works with HubSpot + Salesforce'),
  lane1: text('Lane 1 lead').default('Maya Okafor · Brightloop'),
  lane2: text('Lane 2 lead').default('Theo Lindqvist · Parcelry'),
  lane3: text('Lane 3 lead (connects)').default('Priya Raman · Northbeam'),
  lane4: text('Lane 4 lead').default('Diego Salas · Fernhill'),
  chip: text('Logged chip (empty to hide)').default('Logged to HubSpot · Callback Tue 10:30'),
  font: font('Headline font').default('dela'),
  background: color().default('#F1E4D3'),
  surface: color().default('#E5CDB2'),
  ink: color('Text / ink').default('#3B1F14'),
  accent: color().default('#C8553D'),
  accent2: color('Second accent').default('#4F6D58'),
  pop: color('Pop').default('#F2A541'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  midcentury: { background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#2C7873', accent2: '#D96C3D', pop: '#E9B44C' },
  matcha: { background: '#EEF1E6', surface: '#DCE3CC', ink: '#1E2A1A', accent: '#6A8D3A', accent2: '#C9A227', pop: '#E85D3F', font: 'anton', headline1: 'DIAL FOUR.', headline2: 'TALK TO ONE.' },
  'cherry-cola': { background: '#2A0A10', surface: '#3F1019', ink: '#FFE8E0', accent: '#E3173E', accent2: '#F5C6AA', pop: '#F7B32B' },
  minimal: { chip: '', note: '', eyebrow: 'Ringside', body: 'The parallel dialer for HubSpot and Salesforce.' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
};

const STATUS = ['Ringing', 'Voicemail', 'Connected', 'No answer'];
const TIMER = ['0:07', '0:21', '0:42', '0:12'];

/** Panel geometry as fractions of its width, shared by the panel and the layout. */
const geo = (compact: boolean) => {
  const lane = compact ? 0.13 : 0.15;
  const gap = 0.022;
  const head = 0.11;
  const pad = 0.045;
  return { lane, gap, head, pad, ratio: head + 4 * lane + 3 * gap + pad * 1.2 };
};

/** The hero visual: a four-lane dialer panel; lane 3 connects and rings ripple off it. */
function Panel({ x, y, w, p, compact }: { x: number; y: number; w: number; p: P; compact: boolean }) {
  const dark = isDark(p.background);
  const card = dark ? p.surface : mixHex(p.background, '#FFFFFF', 0.45);
  const g = geo(compact);
  const laneH = w * g.lane;
  const gap = w * g.gap;
  const head = w * g.head;
  const pad = w * g.pad;
  const h = w * g.ratio;
  const sh = Math.max(4, w * 0.018);
  const border = Math.max(2, w * 0.006);
  const label = w * 0.03;
  const lanes = [p.lane1, p.lane2, p.lane3, p.lane4];
  const hot = 2;
  const hotY = y + head + hot * (laneH + gap) + laneH / 2;
  const light = dark ? p.ink : p.background;
  return (
    <>
      {/* ripple rings off the connected lane, behind the card */}
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        {[0.16, 0.28, 0.42, 0.58].map((r, i) => (
          <circle key={i} cx={x + w} cy={hotY} r={w * r} fill="none" stroke={p.accent} strokeWidth={Math.max(2, w * (0.012 - i * 0.0022))} opacity={0.85 - i * 0.18} />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: w * 0.04,
          background: card,
          border: `${border}px solid ${p.ink}`,
          boxShadow: `${sh}px ${sh}px 0 ${p.ink}`,
          padding: `0 ${pad}px`,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ height: head, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: FONTS.chakra, fontWeight: 700, fontSize: label, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.ink }}>
          <span>Ringside · Q4 Outbound</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: label * 0.5 }}>
            <span style={{ width: label * 0.6, height: label * 0.6, borderRadius: '50%', background: p.accent2 }} />4 lines live
          </span>
        </div>
        {lanes.map((lead, i) => {
          const on = i === hot;
          const [name, co] = lead.split(' · ');
          const fg = on ? light : p.ink;
          const pillBg = on ? p.pop : i === 1 ? hexA(p.accent2, 0.18) : 'transparent';
          return (
            <div
              key={i}
              style={{
                height: laneH,
                marginTop: i ? gap : 0,
                borderRadius: laneH * 0.22,
                display: 'flex',
                alignItems: 'center',
                gap: laneH * 0.2,
                padding: `0 ${laneH * 0.25}px`,
                background: on ? p.accent : hexA(p.surface, dark ? 0.6 : 0.75),
                border: on ? `${border}px solid ${p.ink}` : `${Math.max(1, border * 0.5)}px solid ${hexA(p.ink, 0.15)}`,
                color: fg,
                opacity: i === 3 ? 0.62 : 1,
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontFamily: FONTS.chakra, fontWeight: 700, fontSize: laneH * 0.28, width: laneH * 0.42, letterSpacing: '0.02em' }}>L{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}>
                <div style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: laneH * 0.27, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                {!compact && co && <div style={{ fontFamily: FONTS.familjen, fontSize: laneH * 0.22, opacity: 0.75, whiteSpace: 'nowrap' }}>{co}</div>}
              </div>
              <span
                style={{
                  fontFamily: FONTS.chakra,
                  fontWeight: 700,
                  fontSize: laneH * 0.19,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: `${laneH * 0.08}px ${laneH * 0.16}px`,
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                  background: pillBg,
                  color: on ? '#2B160E' : fg,
                  border: on ? 'none' : `${Math.max(1, border * 0.5)}px solid ${hexA(p.ink, 0.35)}`,
                }}
              >
                {STATUS[i]}
              </span>
              <span style={{ fontFamily: FONTS.chakra, fontSize: laneH * 0.22, width: laneH * 0.5, textAlign: 'right', opacity: 0.8 }}>{TIMER[i]}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function ParallelDialerLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  // Panel geometry per layout
  const { ratio } = geo(strip);
  const pw = stacked ? Math.min(W * 0.66, (H * 0.5) / ratio) : strip ? H * 1.3 : Math.min(W * 0.37, (H * 0.74) / ratio);
  const ph = pw * ratio;
  const px = stacked ? (W - pw) / 2 : W - pw - (strip ? H * 0.32 : Math.max(W * 0.07, H * 0.12));
  // The strip crops the panel, centred on the connected lane (L3).
  const g = geo(strip);
  const hotFromTop = pw * (g.head + 2 * (g.lane + g.gap) + g.lane / 2);
  const py = stacked ? H * 0.06 : strip ? H / 2 - hotFromTop : (H - ph) / 2;

  // Copy column. Dela is wide: ~0.72em per character.
  const pad = stacked ? W * 0.08 : strip ? H * 0.16 : Math.max(W * 0.065, H * 0.1);
  const colW = stacked ? W - pad * 2 : px - pad - W * 0.06;
  const longest = Math.max(p.headline1.length, p.headline2.length, 6);
  const head = Math.min(stacked ? W * 0.1 : H * (strip ? 0.21 : 0.17), colW / (longest * 0.72));
  const small = Math.max(head * 0.24, stacked ? W * 0.024 : H * (strip ? 0.045 : 0.03));
  const sh = Math.max(3, head * 0.06);
  const showBody = !strip && !(stacked && H < W * 1.2);

  const copyTop = stacked ? py + ph + H * 0.07 : 0;
  const center = stacked;
  const display: CSSProperties = { ...displayFace(p.font), fontSize: head, lineHeight: 0.98, letterSpacing: p.font === 'dela' ? '-0.02em' : '-0.01em', whiteSpace: 'nowrap' };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,232,224' : '59,31,20' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,250,240,0.7)'}
        glows={[]}
        grain={dark ? 0.06 : 0.05}
        vignette={dark ? 0.45 : 0.06}
      />
      {/* a big clay sun behind the panel: the poster statement */}
      <div
        style={{
          position: 'absolute',
          left: px + pw * 0.55 - pw * 0.48,
          top: py + ph * 0.42 - pw * 0.48,
          width: pw * 0.96,
          height: pw * 0.96,
          borderRadius: '50%',
          background: hexA(p.accent, dark ? 0.22 : 0.16),
        }}
      />

      <Panel x={px} y={py} w={pw} p={p} compact={strip} />

      {p.chip && !strip && (
        <div
          style={{
            position: 'absolute',
            left: stacked ? px - pw * 0.02 : px - pw * 0.08,
            top: py + ph + pw * (stacked ? -0.02 : 0.0) - small * 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: small * 0.5,
            padding: `${small * 0.55}px ${small * 0.95}px`,
            borderRadius: 999,
            background: p.accent2,
            color: dark ? p.background : '#F6EEE3',
            fontFamily: FONTS.chakra,
            fontWeight: 700,
            fontSize: small * 0.82,
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            border: `${Math.max(2, sh * 0.5)}px solid ${p.ink}`,
            boxShadow: `${sh}px ${sh}px 0 ${p.ink}`,
            rotate: '-3deg',
          }}
        >
          <span style={{ fontSize: small }}>✓</span>
          {p.chip}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: copyTop, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: center ? 'center' : 'flex-start' }} />}
        <div style={{ display: 'flex', justifyContent: center ? 'center' : 'flex-start' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              fontFamily: FONTS.chakra,
              fontWeight: 700,
              fontSize: small * 0.8,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: p.ink,
            }}
          >
            <span style={{ width: small * 0.55, height: small * 0.55, borderRadius: '50%', background: p.pop, boxShadow: `0 0 0 ${small * 0.18}px ${hexA(p.pop, 0.3)}` }} />
            {p.eyebrow}
          </span>
        </div>
        <div style={{ marginTop: small * 0.7 }}>
          <div style={{ ...display, color: p.ink }}>{p.headline1}</div>
          <div style={{ ...display, color: p.accent, textShadow: `${sh}px ${sh}px 0 ${p.ink}` }}>{p.headline2}</div>
        </div>
        {showBody && p.body && (
          <div style={{ fontSize: small * 1.05, lineHeight: 1.42, marginTop: small * 0.9, maxWidth: Math.min(colW, small * 26), marginInline: center ? 'auto' : undefined, opacity: 0.9 }}>{p.body}</div>
        )}
        {(p.cta || p.note) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small, justifyContent: center ? 'center' : 'flex-start', marginTop: small * (strip ? 0.8 : 1.3) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.6}px ${small * 1.2}px`,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: small * 0.95,
                  whiteSpace: 'nowrap',
                  color: dark ? p.background : '#F8EFE3',
                  background: dark ? p.accent : p.ink,
                  boxShadow: `${sh * 0.8}px ${sh * 0.8}px 0 ${p.accent}`,
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.note && !stacked && <span style={{ fontFamily: FONTS.chakra, fontSize: small * 0.72, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75, whiteSpace: 'nowrap' }}>{p.note}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
