// Picks today's theme and video occasions, then writes the generation prompt
// to .daily/prompt.md for `claude -p`.
//
// Every run starts a new kit with the next unused idea. The first kit of a day
// lives in drops/<day>; later runs that day use drops/<day>-2, drops/<day>-3…
// The folder name is the kit's id and goes in drop.json's `date` field.
//
// APPEND=1 instead adds new assets to the day's latest kit (same theme and
// visual direction). .daily/mode says which ("new" or "append").
//
// Env overrides: DATE (the day), APPEND=1, THEME, ICONS, STICKERS, ICONS3D, CARDS3D, BANNERS, VIDEOS, SCENES (counts per kind).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { VIDEO_CATEGORIES, type VideoCategory } from '../src/lib/types';
import { FONT_INFO, FONT_PAIRINGS } from '../src/lib/fonts';
import { PALETTES } from '../src/lib/palettes';
import { ROOT, assetFiles, fail, listDrops, log, readDrop } from './lib/common';

const day = process.env.DATE || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) fail(`bad DATE ${day}`);
const kitExists = (id: string) => existsSync(path.join(ROOT, 'drops', id, 'drop.json'));
const ids = (n: number) => (n === 1 ? day : `${day}-${n}`);
let n = 1;
while (kitExists(ids(n))) n++;
const wantAppend = process.env.APPEND === '1' && n > 1;
// Kit id: the next free one for a new kit, or the day's latest when appending.
const date = wantAppend ? ids(n - 1) : ids(n);
const append = wantAppend;
const existing = append ? readDrop(date) : null;

const counts = {
  icons: Number(process.env.ICONS ?? 8),
  stickers: Number(process.env.STICKERS ?? 6),
  icons3d: Number(process.env.ICONS3D ?? 1),
  cards3d: Number(process.env.CARDS3D ?? 3),
  banners: Number(process.env.BANNERS ?? 1),
  videos: Number(process.env.VIDEOS ?? 2),
  scenes: Number(process.env.SCENES ?? 1),
};

// When appending, the kit's own drop doesn't count as history.
const history = listDrops()
  .filter((d) => d !== date)
  .map(readDrop);
const used = new Set(history.flatMap((d) => [d.theme, d.idea ?? '']).map((t) => t.toLowerCase()));

// Use-case kit: explicit override → first unused gathered product → first unused kit in
// ideas.md → let Claude propose one. Both files use lines like
// "- Kit name: who it's for, and what they need". ideas-gathered.md is written by the
// biweekly gatherer (scripts/gather/) from real launches on Product Hunt and YC.
const readIdeas = (f: string) => (existsSync(path.join(ROOT, f)) ? readFileSync(path.join(ROOT, f), 'utf8') : '');
const ideas = [readIdeas('ideas-gathered.md'), readIdeas('ideas.md')]
  .join('\n')
  .split('\n')
  .map((l) => l.match(/^\s*-\s+(?!\[x\])(.+)$/)?.[1]?.trim())
  .filter((t): t is string => !!t)
  .map((t) => ({ name: t.split(':')[0].trim(), brief: t.slice(t.indexOf(':') + 1).trim() }))
  .filter((k) => !used.has(k.name.toLowerCase()));
const kit = existing
  ? { name: existing.theme, brief: existing.description }
  : process.env.THEME
    ? { name: process.env.THEME, brief: '' }
    : ideas[0];
if (existing && process.env.THEME && process.env.THEME !== existing.theme) {
  log(`note: drops/${date} is already the "${existing.theme}" kit; appending to it and ignoring THEME`);
}
const theme = kit ? (kit.brief && kit.brief !== kit.name ? `"${kit.name}" (${kit.brief})` : `"${kit.name}"`) : '';

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
// Appending keeps the kit's recorded direction so the new assets match it.
const palette = leastUsed(PALETTES, history.map((d) => d.direction?.palette), existing?.direction?.palette ?? process.env.PALETTE);
const pairing = leastUsed(FONT_PAIRINGS, history.map((d) => d.direction?.fonts), existing?.direction?.fonts ?? process.env.FONTS);
const roles = (['bg', 'surface', 'ink', 'accent', 'accent2', 'pop'] as const).map((r) => `\`${r}\` ${palette[r]}`).join(' · ');
const fontLine = (k: keyof typeof FONT_INFO) => `\`${k}\` (${FONT_INFO[k].vibe})`;
const direction = [
  `- **Palette "${palette.name}"** (${palette.mode}): ${roles}. ${palette.mood}`,
  `- **Type "${pairing.name}"** (${pairing.mood}): display ${fontLine(pairing.display)}; text ${fontLine(pairing.text)}; labels ${fontLine(pairing.label)}.`,
].join('\n');

const recent = history.slice(-14).map((d) => `- ${d.date}: ${d.theme}`).join('\n') || '- (none yet)';
// Assets already in the kit, so an append run adds new slugs instead of redoing them.
const already = assetFiles(date)
  .map(({ file }) => file.replace(`drops/${date}/`, '').replace('/index.tsx', ''))
  .map((id) => `- \`${id}\``)
  .join('\n');

const template = readFileSync(path.join(ROOT, 'prompts', append ? 'append-drop.md' : 'daily-drop.md'), 'utf8');
const prompt = template
  .replaceAll('{{EXISTING_ASSETS}}', already || '- (none yet)')
  .replaceAll('{{DATE}}', date)
  .replaceAll('{{THEME}}', theme || 'your choice: propose a real-world use case (a business or person with a concrete need) not in the recent list')
  .replaceAll('{{RECENT_THEMES}}', recent)
  .replaceAll('{{DIRECTION}}', direction)
  .replaceAll('{{PALETTE_NAME}}', palette.name)
  .replaceAll('{{FONTS_NAME}}', pairing.name)
  .replaceAll('{{ICONS}}', String(counts.icons))
  .replaceAll('{{STICKERS}}', String(counts.stickers))
  .replaceAll('{{ICONS3D}}', String(counts.icons3d))
  .replaceAll('{{CARDS3D}}', String(counts.cards3d))
  .replaceAll('{{BANNERS}}', String(counts.banners))
  .replaceAll('{{VIDEOS}}', String(counts.videos))
  .replaceAll('{{SCENES}}', String(counts.scenes))
  .replaceAll('{{VIDEO_CATEGORIES}}', categories.join(', '));

mkdirSync(path.join(ROOT, '.daily'), { recursive: true });
writeFileSync(path.join(ROOT, '.daily', 'prompt.md'), prompt);
writeFileSync(path.join(ROOT, '.daily', 'date'), date);
writeFileSync(path.join(ROOT, '.daily', 'mode'), append ? 'append' : 'new');
// generate.sh stamps this into drop.json so the idea counts as used next time.
writeFileSync(path.join(ROOT, '.daily', 'idea'), append ? '' : kit?.name ?? '');
log(JSON.stringify({ date, mode: append ? 'append' : 'new', theme: theme || '(Claude picks)', palette: palette.name, fonts: pairing.name, videoCategories: categories, counts }));
