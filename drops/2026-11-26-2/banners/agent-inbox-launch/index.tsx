import type { CSSProperties } from 'react';
import { RobotIcon, UserIcon, HandPalmIcon, PaperclipIcon } from '@phosphor-icons/react/ssr';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Agent Inbox Launch',
  description: 'Launch banner for Postnook: a warm serif headline beside a live-looking agent inbox (human mail, a bot reply, a message waiting for review), stamped with a postmark.',
  tags: ['launch', 'hero', 'social', 'email', 'inbox', 'agents', 'saas'],
};

export const schema = z.object({
  eyebrow: text().default('New · Email for AI agents'),
  headline: text().default('Every agent deserves'),
  highlight: text('Highlighted words').default('an inbox.'),
  body: textarea().default('Give each agent a real address in one API call. It reads, replies and files mail; anything risky waits for a human.'),
  cta: text('Button (empty to hide)').default('Create an inbox — free'),
  code: text('Code chip (empty to hide)').default('POST /v1/inboxes'),
  address: text('Inbox address').default('support-bot@postnook.email'),
  note: text('Handwritten note').default('your agent’s new inbox!'),
  postmark: text('Postmark text').default('POSTNOOK · 26 NOV 2026'),
  font: font('Headline font').default('youngserif'),
  background: color().default('#EEF1E6'),
  surface: color('Card').default('#DCE3CC'),
  ink: color('Text').default('#1E2A1A'),
  accent: color().default('#6A8D3A'),
  accent2: color('Stamp').default('#C9A227'),
  pop: color('Unread').default('#E85D3F'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  terracotta: { background: '#F1E4D3', surface: '#E5CDB2', ink: '#3B1F14', accent: '#C8553D', accent2: '#4F6D58', pop: '#F2A541', font: 'fraunces' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#2F6F8F', accent2: '#A7864A', pop: '#E4572E', headline: 'Inboxes for humans', highlight: 'and their bots.' },
  moss: { background: '#0E1A14', surface: '#18291F', ink: '#EAF2DC', accent: '#B5E550', accent2: '#E3B53A', pop: '#FF9F43', font: 'gloock' },
  minimal: { body: '', code: '', note: '', eyebrow: 'Postnook', cta: 'postnook.email' },
};

type P = z.infer<typeof schema> & BannerSize;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

/** The kit's motif: a ring date-stamp with curved text and three wavy cancellation lines. */
function Postmark({ size, p, id }: { size: number; p: P; id: string }) {
  const r = 40;
  const wave = (y: number) => `M 96 ${y} q 10 -7 20 0 t 20 0 t 20 0 t 20 0 t 20 0`;
  return (
    <svg viewBox="0 0 200 100" width={size * 2} height={size} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <path id={`${id}-arc`} d={`M ${50 - r + 9} 50 a ${r - 9} ${r - 9} 0 1 1 ${2 * (r - 9)} 0 a ${r - 9} ${r - 9} 0 1 1 ${-2 * (r - 9)} 0`} />
      </defs>
      <g fill="none" stroke={p.accent2} strokeWidth={2.6} strokeLinecap="round" opacity={0.95}>
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

function InboxCard({ w, rows, p }: { w: number; rows: number; p: P }) {
  const u = w / 100;
  const dark = lum(p.background) < 120;
  const paper = dark ? '#22362A' : '#F8F9F2';
  const line = hexA(p.ink, 0.12);
  const msgs = [
    { icon: UserIcon, from: 'Maya Okafor', subj: 'Re: Refund for order #4471', time: '9:41', tag: '', unread: true },
    { icon: RobotIcon, from: 'support-bot', subj: 'Replied · Shipping label attached', time: '9:42', tag: 'sent', unread: false, clip: true },
    { icon: HandPalmIcon, from: 'Needs review', subj: 'Refund over $500 — approve?', time: '9:43', tag: 'review', unread: true },
  ].slice(0, rows);
  return (
    <div
      style={{
        width: w,
        borderRadius: 4 * u,
        background: paper,
        border: `${Math.max(1, u * 0.35)}px solid ${hexA(p.ink, 0.14)}`,
        boxShadow: `${u * 1.6}px ${u * 2}px 0 ${hexA(p.ink, dark ? 0.5 : 0.9)}, 0 ${u * 6}px ${u * 14}px ${hexA(p.ink, 0.18)}`,
        overflow: 'hidden',
        fontFamily: FONTS.familjen,
        color: p.ink,
        lineHeight: 1.3,
      }}
    >
      {/* Header: address + unread count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2.4 * u, padding: `${3.6 * u}px ${4.5 * u}px`, background: p.surface, borderBottom: `1px solid ${line}` }}>
        <div style={{ width: 7.5 * u, height: 7.5 * u, borderRadius: '50%', background: p.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <RobotIcon size={4.6 * u} weight="fill" color={paper} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 2.7 * u, fontWeight: 500, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Agent inbox</div>
          <div style={{ fontSize: 4.1 * u, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address}</div>
        </div>
        <div style={{ fontSize: 3.2 * u, fontWeight: 700, color: '#FFF8F2', background: p.pop, borderRadius: 99, padding: `${0.6 * u}px ${2.2 * u}px` }}>2 new</div>
      </div>
      {msgs.map((m, i) => {
        const Icon = m.icon;
        const review = m.tag === 'review';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3 * u,
              padding: `${3.1 * u}px ${4.5 * u}px`,
              borderBottom: i < msgs.length - 1 ? `1px solid ${line}` : undefined,
              background: review ? hexA(p.accent2, dark ? 0.16 : 0.14) : undefined,
            }}
          >
            <div style={{ width: 1.6 * u, height: 1.6 * u, borderRadius: '50%', background: m.unread ? p.pop : 'transparent', flexShrink: 0 }} />
            <div
              style={{
                width: 7 * u,
                height: 7 * u,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                background: review ? p.accent2 : i === 1 ? hexA(p.accent, 0.22) : p.surface,
              }}
            >
              <Icon size={4 * u} weight="fill" color={review ? paper : p.ink} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 3.6 * u, fontWeight: m.unread ? 700 : 500, whiteSpace: 'nowrap' }}>{m.from}</div>
              <div style={{ fontSize: 3.2 * u, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: u }}>
                {m.clip && <PaperclipIcon size={3.2 * u} color={p.ink} />}
                {m.subj}
              </div>
            </div>
            <div style={{ fontSize: 3 * u, opacity: 0.6, flexShrink: 0 }}>{m.time}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AgentInboxLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = lum(p.background) < 120;
  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);

  // Hero card geometry, anchored by its right edge in landscape layouts.
  const rows = strip ? 2 : 3;
  const cardW = stacked ? W * 0.64 : strip ? Math.min(W * 0.36, H * 1.5) : Math.min(W * 0.42, H * 0.9);
  const cardH = cardW * (strip ? 0.5 : 0.66); // approx height for layout
  const cardLeft = stacked ? (W - cardW) / 2 : W - pad - cardW;
  const cardTop = stacked ? H * 0.1 : (H - cardH) / 2 + (strip ? H * 0.02 : H * 0.02);

  const colW = stacked ? W - pad * 2 : cardLeft - pad * 1.6;
  const head = stacked ? W * 0.068 : Math.min(H * (strip ? 0.15 : 0.125), colW * 0.125);
  const small = Math.max(head * (strip ? 0.3 : 0.34), 16);
  const pm = cardW * 0.15;
  const glowC = hexA(p.accent, dark ? 0.25 : 0.22);

  const copy: CSSProperties = stacked
    ? { position: 'absolute', left: pad, width: colW, top: cardTop + cardH + H * 0.09, textAlign: 'center' }
    : { position: 'absolute', left: pad, width: colW, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.16, size: Math.round(Math.min(W, H) / 26), color: dark ? '234,242,220' : '30,42,26' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: cardLeft + cardW / 2, y: cardTop + cardH / 2, size: cardW * 1.9, color: glowC, opacity: 0.9 },
          { x: stacked ? W * 0.1 : W * 0.05, y: H * 1.05, size: Math.max(W, H) * 0.7, color: hexA(p.accent2, 0.25), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.05}
        vignette={dark ? 0.45 : 0.06}
      />

      {/* A sage envelope tucked behind the card */}
      <div
        style={{
          position: 'absolute',
          left: cardLeft + cardW * 0.1,
          top: cardTop - cardW * 0.08,
          width: cardW * 0.86,
          height: cardH * 0.9,
          borderRadius: cardW * 0.03,
          background: p.surface,
          border: `${Math.max(1, cardW * 0.003)}px solid ${hexA(p.ink, 0.18)}`,
          rotate: '-5deg',
          overflow: 'hidden',
        }}
      >
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <path d="M0 0 L50 34 L100 0" fill="none" stroke={hexA(p.ink, 0.25)} strokeWidth={0.6} />
        </svg>
      </div>

      <div style={{ position: 'absolute', left: cardLeft, top: cardTop }}>
        <InboxCard w={cardW} rows={rows} p={p} />
      </div>

      {/* Postmark slapped over the card's top-right corner */}
      {p.postmark && (
        <div style={{ position: 'absolute', left: cardLeft + cardW - pm * 1.75, top: cardTop - pm * 0.5, rotate: '-10deg', mixBlendMode: dark ? 'screen' : 'multiply' }}>
          <Postmark size={pm} p={p} id="bn" />
        </div>
      )}

      {/* Handwritten note under the card, pointing up at it */}
      {p.note && !strip && (
        <div
          style={{
            position: 'absolute',
            ...(stacked ? { left: cardLeft + cardW * 0.08, top: cardTop + cardH + H * 0.012 } : { left: cardLeft - cardW * 0.02, top: cardTop + cardH + cardW * 0.07 }),
            fontFamily: FONTS.caveat,
            fontWeight: 700,
            fontSize: cardW * 0.065,
            color: p.accent,
            rotate: '-4deg',
            display: 'flex',
            alignItems: 'center',
            gap: cardW * 0.015,
            whiteSpace: 'nowrap',
          }}
        >
          <svg width={cardW * 0.08} height={cardW * 0.07} viewBox="0 0 40 34" style={{ overflow: 'visible' }}>
            <path d="M4 30 C 8 14, 20 6, 34 4 M 24 0 L 35 4 L 27 12" fill="none" stroke={p.accent} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {p.note}
        </div>
      )}

      <div style={copy}>
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              fontSize: small * 0.78,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: p.ink,
            }}
          >
            <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop }} />
            {p.eyebrow}
          </span>
        </div>
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 1.04, letterSpacing: '-0.025em', marginTop: small * 0.7, color: p.ink }}>
          {p.headline} <span style={{ color: p.accent }}>{p.highlight}</span>
        </div>
        {p.body && !strip && (
          <div style={{ fontSize: small * 1.05, lineHeight: 1.45, opacity: 0.85, marginTop: small * 0.75, maxWidth: stacked ? colW : colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>
        )}
        {(p.cta || p.code) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: small * 0.7, alignItems: 'center', justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.8 : 1.3) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.62}px ${small * 1.25}px`,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: small * 0.95,
                  color: p.background,
                  background: p.ink,
                  boxShadow: `${small * 0.18}px ${small * 0.22}px 0 ${p.accent}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta}
              </span>
            )}
            {p.code && !strip && (
              <span style={{ fontFamily: FONTS.mono, fontSize: small * 0.82, padding: `${small * 0.5}px ${small * 0.8}px`, borderRadius: small * 0.4, border: `1px dashed ${hexA(p.ink, 0.35)}`, whiteSpace: 'nowrap' }}>
                <span style={{ color: p.accent, fontWeight: 700 }}>$ </span>
                {p.code}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
