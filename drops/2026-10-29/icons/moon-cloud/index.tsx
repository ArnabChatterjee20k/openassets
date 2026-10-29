import { z } from 'zod';
import { color, num, select, toggle } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Moon Cloud',
  description: 'A crescent moon peeking from behind a cloud.',
  tags: ['weather', 'night', 'moon', 'cloud'],
};

// Same grammar as the rest of the Midnight Weather set: 24px grid, shared cloud
// silhouette, round joins, accent reserved for the weather element.
export const schema = z.object({
  style: select(['outline', 'filled', 'duotone']).default('outline'),
  primary: color('Cloud').default('#3B3FD8'),
  accent: color('Moon').default('#FFD34E'),
  stroke: num(1, 3, 0.25, 'Stroke width').default(1.75),
  rounded: toggle('Rounded joins').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  filled: { style: 'filled' },
  duotone: { style: 'duotone' },
  bold: { stroke: 2.75 },
  mono: { primary: '#0B1026', accent: '#0B1026' },
  sharp: { rounded: false, stroke: 2 },
};

const CLOUD = 'M7 20a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 11.5a4 4 0 0 1-.5 8.5z';
// Crescent = circle (17,7,r5) minus circle (14.4,9.2,r4.3): thick side up-right, above the cloud.
const MOON = 'M17.71 11.95A5 5 0 1 0 12.24 5.48A4.3 4.3 0 0 1 17.71 11.95z';
// Shift the cloud down-left so the crescent reads clearly.
const CLOUD_T = 'translate(-1.2 1.4)';

export default function MoonCloud(p: z.infer<typeof schema>) {
  const join = p.rounded ? 'round' : 'miter';
  const cap = p.rounded ? 'round' : 'butt';
  const filled = p.style === 'filled';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <defs>
        {/* Hide the part of the moon behind the cloud (plus a gap the width of the stroke). */}
        <mask id="moon-behind-cloud">
          <rect width="24" height="24" fill="white" />
          <path d={CLOUD} transform={CLOUD_T} fill="black" stroke="black" strokeWidth={p.stroke * 3} strokeLinejoin="round" />
        </mask>
      </defs>
      <path d={MOON} mask="url(#moon-behind-cloud)" fill={filled || p.style === 'duotone' ? p.accent : 'none'} stroke={p.accent} strokeWidth={p.stroke} strokeLinejoin={join} />
      {p.style === 'duotone' && <path d={CLOUD} transform={CLOUD_T} fill={p.primary} opacity={0.2} />}
      <path d={CLOUD} transform={CLOUD_T} fill={filled ? p.primary : 'none'} stroke={p.primary} strokeWidth={p.stroke} strokeLinejoin={join} strokeLinecap={cap} />
    </svg>
  );
}
