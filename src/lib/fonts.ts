// Curated, bundled font library. CSS for every family is registered by
// src/lib/font-css.ts; assets reference fonts by key via font() and FONTS[key].
// Pick by personality, not habit: the safe sans (inter) is for small UI copy only.

export type FontRole = 'display' | 'text' | 'serif' | 'mono' | 'expressive' | 'pixel' | 'script';

export interface FontInfo {
  stack: string;
  role: FontRole;
  weights: number[];
  italic?: boolean;
  /** Personality: what it says, and when to reach for it. */
  vibe: string;
}

const s = (family: string, fallback: string) => `'${family}', ${fallback}`;
const SANS = 'system-ui, sans-serif';
const SERIF = 'Georgia, serif';
const MONO = 'ui-monospace, monospace';

export const FONT_INFO = {
  // Grotesks & geometric sans
  inter: { stack: s('Inter', SANS), role: 'text', weights: [400, 700], vibe: 'Neutral UI text. Small copy only, never the hero.' },
  grotesk: { stack: s('Space Grotesk', SANS), role: 'display', weights: [400, 700], vibe: 'Techy grotesk with quirky details; overused, so use sparingly.' },
  bricolage: { stack: s('Bricolage Grotesque', SANS), role: 'display', weights: [400, 600, 800], vibe: 'Warm, inky, slightly irregular grotesk; editorial-friendly and human.' },
  familjen: { stack: s('Familjen Grotesk', SANS), role: 'text', weights: [400, 500, 700], italic: true, vibe: 'Swedish grotesk with sharp ink traps; crisp body and subheads.' },
  outfit: { stack: s('Outfit', SANS), role: 'text', weights: [300, 500, 800], vibe: 'Clean geometric sans; friendly product copy.' },
  sora: { stack: s('Sora', SANS), role: 'text', weights: [300, 600, 800], vibe: 'Wide-ish geometric with a future/crypto feel.' },
  unbounded: { stack: s('Unbounded', SANS), role: 'display', weights: [400, 700, 900], vibe: 'Wide, rounded, loud. Y2K/tech posters and big single words; 900 is maximal.' },
  syne: { stack: s('Syne', SANS), role: 'display', weights: [400, 700, 800], vibe: 'Art-school weird: widens dramatically at heavy weights. Galleries, culture.' },
  // Condensed / poster
  bebas: { stack: s('Bebas Neue', SANS), role: 'display', weights: [400], vibe: 'All-caps condensed poster; sports, cinema, hype.' },
  anton: { stack: s('Anton', SANS), role: 'display', weights: [400], vibe: 'Heavy condensed impact; headlines that shout.' },
  shoulders: { stack: s('Big Shoulders Display', SANS), role: 'display', weights: [300, 700, 900], vibe: 'Chicago industrial condensed; signage, transit, civic.' },
  archivo: { stack: s('Archivo Black', SANS), role: 'display', weights: [400], vibe: 'Chunky grotesk black; brutalist, bold statements.' },
  // Serifs
  serif: { stack: s('Playfair Display', SERIF), role: 'serif', weights: [400, 700], vibe: 'Classic high-contrast didone; safe, a bit expected.' },
  instrument: { stack: s('Instrument Serif', SERIF), role: 'serif', weights: [400], italic: true, vibe: 'Condensed, elegant editorial serif; gorgeous italic. Fashion, luxury, calm.' },
  fraunces: { stack: s('Fraunces', SERIF), role: 'serif', weights: [300, 600, 900], italic: true, vibe: 'Soft "wonky" old-style; warm, food, craft, nostalgia.' },
  dmserif: { stack: s('DM Serif Display', SERIF), role: 'serif', weights: [400], italic: true, vibe: 'Punchy display serif; magazine covers.' },
  bodoni: { stack: s('Bodoni Moda', SERIF), role: 'serif', weights: [400, 700, 900], italic: true, vibe: 'Razor-contrast Bodoni; high fashion, perfume, opera.' },
  gloock: { stack: s('Gloock', SERIF), role: 'serif', weights: [400], vibe: 'Heavy, sculpted serif with attitude; bold editorial.' },
  youngserif: { stack: s('Young Serif', SERIF), role: 'serif', weights: [400], vibe: 'Chunky friendly serif; bookish, cozy, indie.' },
  italiana: { stack: s('Italiana', SERIF), role: 'serif', weights: [400], vibe: 'Thin, airy, stylish caps; spa, boutique, weddings.' },
  // Mono
  mono: { stack: s('JetBrains Mono', MONO), role: 'mono', weights: [400, 700], vibe: 'Developer mono; code, data labels.' },
  spacemono: { stack: s('Space Mono', MONO), role: 'mono', weights: [400, 700], italic: true, vibe: 'Retro-futurist mono with character; zines, sci-fi, labels.' },
  majormono: { stack: s('Major Mono Display', MONO), role: 'mono', weights: [400], vibe: 'Geometric mono display, odd lowercase-caps mix; experimental.' },
  chakra: { stack: s('Chakra Petch', SANS), role: 'display', weights: [400, 700], italic: true, vibe: 'Angular techno; esports, HUDs, mecha.' },
  // Expressive
  dela: { stack: s('Dela Gothic One', SANS), role: 'expressive', weights: [400], vibe: 'Heavy Japanese-gothic display; anime, streetwear.' },
  rubikmono: { stack: s('Rubik Mono One', SANS), role: 'expressive', weights: [400], vibe: 'Blocky rounded caps; playful arcade/kids.' },
  bungee: { stack: s('Bungee', SANS), role: 'expressive', weights: [400], vibe: 'Vertical-signage display; urban, street, neon.' },
  monoton: { stack: s('Monoton', SANS), role: 'expressive', weights: [400], vibe: 'Multi-line neon/disco; retro nightlife. Large sizes only.' },
  shrikhand: { stack: s('Shrikhand', SERIF), role: 'expressive', weights: [400], vibe: 'Juicy italic display; 70s, food, summer.' },
  climate: { stack: s('Climate Crisis', SANS), role: 'expressive', weights: [400], vibe: 'Melting heavy sans; urgent, activist, heat.' },
  nabla: { stack: s('Nabla', SANS), role: 'expressive', weights: [400], vibe: 'Color isometric 3D letters (COLR font); arcade, toy, playful titles.' },
  fredoka: { stack: s('Fredoka', SANS), role: 'display', weights: [400, 600], vibe: 'Soft rounded; kids, friendly apps, greetings.' },
  // Pixel & script
  pressstart: { stack: s('Press Start 2P', MONO), role: 'pixel', weights: [400], vibe: '8-bit arcade pixel; small sizes look crisp.' },
  vt323: { stack: s('VT323', MONO), role: 'pixel', weights: [400], vibe: 'CRT terminal pixel; retro computing.' },
  silkscreen: { stack: s('Silkscreen', MONO), role: 'pixel', weights: [400, 700], vibe: 'Tiny pixel caps; UI-y retro labels.' },
  caveat: { stack: s('Caveat', 'cursive'), role: 'script', weights: [400, 700], vibe: 'Casual handwriting; notes, personal touches, signatures.' },
} satisfies Record<string, FontInfo>;

export type FontKey = keyof typeof FONT_INFO;
export const FONTS = Object.fromEntries(Object.entries(FONT_INFO).map(([k, v]) => [k, v.stack])) as Record<FontKey, string>;
export const FONT_KEYS = Object.keys(FONT_INFO) as [FontKey, ...FontKey[]];

/**
 * Proven pairings (display + text + label). Each drop should commit to one.
 * Generic pairs (grotesk + inter) are deliberately absent.
 */
export const FONT_PAIRINGS: { name: string; display: FontKey; text: FontKey; label: FontKey; mood: string }[] = [
  { name: 'Editorial luxe', display: 'instrument', text: 'familjen', label: 'spacemono', mood: 'calm, expensive, fashion' },
  { name: 'Art school', display: 'syne', text: 'bricolage', label: 'majormono', mood: 'cultural, odd, confident' },
  { name: 'Y2K tech', display: 'unbounded', text: 'sora', label: 'spacemono', mood: 'loud, futuristic, glossy' },
  { name: 'Poster shout', display: 'anton', text: 'familjen', label: 'mono', mood: 'urgent, sporty, high-energy' },
  { name: 'Warm craft', display: 'fraunces', text: 'outfit', label: 'caveat', mood: 'cozy, food, handmade' },
  { name: 'High fashion', display: 'bodoni', text: 'familjen', label: 'italiana', mood: 'dramatic, couture, perfume' },
  { name: 'Brutalist', display: 'archivo', text: 'spacemono', label: 'spacemono', mood: 'raw, structural, finance/architecture' },
  { name: 'Civic signage', display: 'shoulders', text: 'outfit', label: 'mono', mood: 'transit, urban, industrial' },
  { name: 'Arcade', display: 'nabla', text: 'rubikmono', label: 'pressstart', mood: 'playful, retro games' },
  { name: 'Terminal', display: 'vt323', text: 'mono', label: 'silkscreen', mood: 'hacker, CRT, lo-fi' },
  { name: 'Streetwear', display: 'dela', text: 'familjen', label: 'chakra', mood: 'anime, drops, hype' },
  { name: 'Disco night', display: 'monoton', text: 'syne', label: 'spacemono', mood: 'neon, music, party' },
  { name: '70s sunshine', display: 'shrikhand', text: 'fraunces', label: 'outfit', mood: 'retro summer, juicy, fun' },
  { name: 'Magazine', display: 'dmserif', text: 'bricolage', label: 'mono', mood: 'editorial, punchy, smart' },
  { name: 'Activist', display: 'climate', text: 'familjen', label: 'spacemono', mood: 'urgent, climate, protest' },
  { name: 'Friendly app', display: 'fredoka', text: 'outfit', label: 'caveat', mood: 'soft, kids, greetings' },
  { name: 'Mecha HUD', display: 'chakra', text: 'sora', label: 'majormono', mood: 'esports, sci-fi interfaces' },
  { name: 'Bookish', display: 'youngserif', text: 'familjen', label: 'caveat', mood: 'indie, literary, warm' },
  { name: 'Gallery', display: 'gloock', text: 'syne', label: 'spacemono', mood: 'sculptural, bold editorial' },
  { name: 'Neon street', display: 'bungee', text: 'outfit', label: 'vt323', mood: 'urban night, signage' },
];
