// Picks today's theme and video occasions, then writes the generation prompt
// to .daily/prompt.md for `claude -p`.
//
// Env overrides: DATE, THEME, ICONS, ICONS3D, BANNERS, VIDEOS (counts per kind).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { VIDEO_CATEGORIES, type VideoCategory } from '../src/lib/types';
import { FONT_INFO, FONT_PAIRINGS } from '../src/lib/fonts';
import { PALETTES } from '../src/lib/palettes';
import { ROOT, assetFiles, fail, listDrops, log, readDrop } from './lib/common';

const date = process.env.DATE || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`bad DATE ${date}`);
if (existsSync(path.join(ROOT, 'drops', date))) fail(`drops/${date} already exists`);

const counts = {
  icons: Number(process.env.ICONS ?? 4),
  icons3d: Number(process.env.ICONS3D ?? 1),
  banners: Number(process.env.BANNERS ?? 1),
  videos: Number(process.env.VIDEOS ?? 2),
};

const history = listDrops().map(readDrop);
const used = new Set(history.map((d) => d.theme.toLowerCase()));

// Theme: explicit override → first unused idea in ideas.md → let Claude invent one.
const ideas = readFileSync(path.join(ROOT, 'ideas.md'), 'utf8')
  .split('\n')
  .map((l) => l.match(/^\s*-\s+(?!\[x\])(.+)$/)?.[1]?.trim())
  .filter((t): t is string => !!t && !used.has(t.toLowerCase()));
const theme = process.env.THEME || ideas[0] || '';

// Video occasions: the least-used categories so far, so the library stays varied.
const usage = new Map<VideoCategory, number>(VIDEO_CATEGORIES.map((c) => [c, 0]));
for (const { file } of assetFiles()) {
  if (!file.includes('/videos/')) continue;
  const m = readFileSync(path.join(ROOT, file), 'utf8').match(/category:\s*'([a-z-]+)'/);
  if (m && usage.has(m[1] as VideoCategory)) usage.set(m[1] as VideoCategory, usage.get(m[1] as VideoCategory)! + 1);
}
const categories = [...usage.entries()]
  .sort((a, b) => a[1] - b[1] || VIDEO_CATEGORIES.indexOf(a[0]) - VIDEO_CATEGORIES.indexOf(b[0]))
  .slice(0, counts.videos)
  .map(([c]) => c);

// Visual direction: the least-used palette and font pairing, tie-broken by a hash of
// the date so consecutive days differ. Overridable with PALETTE / FONTS env (by name).
const hash = [...date].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const leastUsed = <T extends { name: string }>(items: T[], used: (string | undefined)[], override?: string) => {
  const forced = override && items.find((i) => i.name.toLowerCase() === override.toLowerCase());
  if (forced) return forced;
  const count = (n: string) => used.filter((u) => u === n).length;
  const min = Math.min(...items.map((i) => count(i.name)));
  const pool = items.filter((i) => count(i.name) === min);
  return pool[hash % pool.length];
};
const palette = leastUsed(PALETTES, history.map((d) => d.direction?.palette), process.env.PALETTE);
const pairing = leastUsed(FONT_PAIRINGS, history.map((d) => d.direction?.fonts), process.env.FONTS);
const roles = (['bg', 'surface', 'ink', 'accent', 'accent2', 'pop'] as const).map((r) => `\`${r}\` ${palette[r]}`).join(' · ');
const fontLine = (k: keyof typeof FONT_INFO) => `\`${k}\` (${FONT_INFO[k].vibe})`;
const direction = [
  `- **Palette "${palette.name}"** (${palette.mode}): ${roles}. ${palette.mood}`,
  `- **Type "${pairing.name}"** (${pairing.mood}): display ${fontLine(pairing.display)}; text ${fontLine(pairing.text)}; labels ${fontLine(pairing.label)}.`,
].join('\n');

const recent = history.slice(-14).map((d) => `- ${d.date}: ${d.theme}`).join('\n') || '- (none yet)';
const template = readFileSync(path.join(ROOT, 'prompts', 'daily-drop.md'), 'utf8');
const prompt = template
  .replaceAll('{{DATE}}', date)
  .replaceAll('{{THEME}}', theme ? `"${theme}"` : 'your choice — invent a fresh, specific visual theme not in the recent list')
  .replaceAll('{{RECENT_THEMES}}', recent)
  .replaceAll('{{DIRECTION}}', direction)
  .replaceAll('{{PALETTE_NAME}}', palette.name)
  .replaceAll('{{FONTS_NAME}}', pairing.name)
  .replaceAll('{{ICONS}}', String(counts.icons))
  .replaceAll('{{ICONS3D}}', String(counts.icons3d))
  .replaceAll('{{BANNERS}}', String(counts.banners))
  .replaceAll('{{VIDEOS}}', String(counts.videos))
  .replaceAll('{{VIDEO_CATEGORIES}}', categories.join(', '));

mkdirSync(path.join(ROOT, '.daily'), { recursive: true });
writeFileSync(path.join(ROOT, '.daily', 'prompt.md'), prompt);
writeFileSync(path.join(ROOT, '.daily', 'date'), date);
log(JSON.stringify({ date, theme: theme || '(Claude picks)', palette: palette.name, fonts: pairing.name, videoCategories: categories, counts }));
