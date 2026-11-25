import { PhoneOutgoingIcon, LightningIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Dial Out',
  description: 'Outgoing call: the start-dialing action in the dialer toolbar.',
  tags: ['phone', 'call', 'outbound', 'dialer', 'sales'],
};

// Default: a clean solid black glyph. Same schema + variants across the set.
export const schema = iconSchema({ primary: '#000000', accent: '#C8553D', surface: '#F1E4D3' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#3B1F14', accent: '#C8553D' },
  tile: { container: 'squircle', fill: 'solid', surface: '#C8553D', primary: '#F1E4D3', scale: 0.56 },
  stamp: { container: 'rounded', fill: 'solid', surface: '#F2A541', primary: '#3B1F14', accent: '#F1E4D3', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={PhoneOutgoingIcon} badgeGlyph={LightningIcon} p={p} id="dial-out" />;
}
