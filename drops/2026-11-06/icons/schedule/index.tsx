import { CalendarDotsIcon, ClockIcon } from '@phosphor-icons/react/ssr';
import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { IconArt, iconSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon',
  name: 'Flight Schedule',
  description: 'Calendar: campaign flight dates and dayparting.',
  tags: ['schedule', 'calendar', 'flight dates', 'dayparting'],
};

// Default: a clean solid black glyph (pick any color in the editor).
// Same schema + variants across the Towline set.
export const schema = iconSchema({ primary: '#000000', accent: '#FF4F6D', surface: '#FFD3C2' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  regular: { weight: 'regular' },
  bold: { weight: 'bold' },
  thin: { weight: 'thin' },
  duotone: { weight: 'duotone', primary: '#3D0E2A', accent: '#FF4F6D' },
  tile: { container: 'squircle', fill: 'solid', surface: '#3D0E2A', primary: '#FF4F6D', scale: 0.56 },
  sunset: { container: 'circle', fill: 'gradient', surface: '#FFB627', accent: '#FF4F6D', primary: '#3D0E2A', scale: 0.54 },
  brutal: { container: 'rounded', fill: 'solid', surface: '#FFD3C2', primary: '#3D0E2A', accent: '#FFB627', weight: 'bold', shadow: true, badge: true, scale: 0.58 },
};

export default function Icon(p: z.infer<typeof schema>) {
  return <IconArt glyph={CalendarDotsIcon} badgeGlyph={ClockIcon} p={p} id="schedule" />;
}
