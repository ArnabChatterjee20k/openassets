// Curated palettes with explicit roles. A drop commits to one (adapting it to
// the theme is fine) so its assets feel designed together. Roles:
//   bg      dominant field (~60%)          surface  panels/cards/secondary fields (~30%)
//   ink     text and line work             accent   the signature color (~10%)
//   accent2 supporting color               pop      tiny doses only: a dot, a spark, one word
export interface Palette {
  name: string;
  mode: 'light' | 'dark';
  bg: string;
  surface: string;
  ink: string;
  accent: string;
  accent2: string;
  pop: string;
  /** Where it comes from / what it's good for. */
  mood: string;
}

export const PALETTES: Palette[] = [
  { name: 'Risograph', mode: 'light', bg: '#F4EFE6', surface: '#EAE2D3', ink: '#1F2A6B', accent: '#FF48B0', accent2: '#0078BF', pop: '#FFE800', mood: 'Fluoro riso inks on paper; zines, indie, playful print.' },
  { name: 'Bauhaus', mode: 'light', bg: '#F2EBDD', surface: '#E4D9C4', ink: '#111111', accent: '#D9381E', accent2: '#1D4E9E', pop: '#F2B90F', mood: 'Primary geometry on cream; architecture, education, modernism.' },
  { name: 'Memphis', mode: 'light', bg: '#FFF6E9', surface: '#FFE3D3', ink: '#1A1A2E', accent: '#FF6F91', accent2: '#00B3A4', pop: '#FFC93C', mood: '80s Milan squiggles; fun, retail, kids, parties.' },
  { name: 'Swiss', mode: 'light', bg: '#F5F5F0', surface: '#E6E6E1', ink: '#0A0A0A', accent: '#E3000F', accent2: '#8C8C88', pop: '#E3000F', mood: 'International style; strict grid, one red. Data, news, finance.' },
  { name: 'Acid', mode: 'dark', bg: '#0B0B0B', surface: '#1A1A1A', ink: '#F0FFE0', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', mood: 'Rave flyers, acid house; music, nightlife, drops.' },
  { name: 'Terracotta', mode: 'light', bg: '#F1E4D3', surface: '#E5CDB2', ink: '#3B1F14', accent: '#C8553D', accent2: '#4F6D58', pop: '#F2A541', mood: 'Mediterranean clay and sage; food, travel, wellness.' },
  { name: 'Deep Sea', mode: 'dark', bg: '#021B26', surface: '#06303F', ink: '#E6FFFA', accent: '#2EF2C4', accent2: '#1B7FA6', pop: '#FF7A59', mood: 'Bioluminescence; ocean, science, calm tech.' },
  { name: 'Ultraviolet Club', mode: 'dark', bg: '#12001F', surface: '#24003D', ink: '#FBEFFF', accent: '#B026FF', accent2: '#FF2E88', pop: '#FFD600', mood: 'Club lighting; music, gaming, events.' },
  { name: 'Matcha', mode: 'light', bg: '#EEF1E6', surface: '#DCE3CC', ink: '#1E2A1A', accent: '#6A8D3A', accent2: '#C9A227', pop: '#E85D3F', mood: 'Tea house greens; wellness, slow living, botanicals.' },
  { name: 'Lava', mode: 'dark', bg: '#1A0A06', surface: '#2E120B', ink: '#FFEDE0', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63', mood: 'Molten heat; sport, energy, launches.' },
  { name: 'Blueprint', mode: 'dark', bg: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFFFFF', accent2: '#7FB2FF', pop: '#FFDD00', mood: 'Cyanotype drafting; engineering, dev tools, plans.' },
  { name: 'Candy', mode: 'light', bg: '#FDF3F8', surface: '#F7DDEB', ink: '#3A1F4A', accent: '#FF7EB6', accent2: '#8A7BFF', pop: '#4FD1C5', mood: 'Sweet pastels; greetings, beauty, kids.' },
  { name: 'Desert Dusk', mode: 'dark', bg: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', accent: '#FF8E5E', accent2: '#E5487A', pop: '#FFD27F', mood: 'Sunset over sand; travel, music, romance.' },
  { name: 'Nordic Frost', mode: 'light', bg: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#2F6F8F', accent2: '#A7C4D4', pop: '#E4572E', mood: 'Scandinavian winter; calm SaaS, outdoors, design.' },
  { name: 'Chrome Y2K', mode: 'light', bg: '#DADDE3', surface: '#C3C8D1', ink: '#101219', accent: '#3D5AFE', accent2: '#B8C0CC', pop: '#FF3DB4', mood: 'Silver, glossy, early-2000s web; tech, fashion.' },
  { name: 'Forest Moss', mode: 'dark', bg: '#0E1A14', surface: '#18291F', ink: '#EAF2DC', accent: '#B5E550', accent2: '#4E8A5B', pop: '#FF9F43', mood: 'Night forest; outdoors, sustainability, adventure.' },
  { name: 'Cherry Cola', mode: 'dark', bg: '#2A0A10', surface: '#3F1019', ink: '#FFE8E0', accent: '#E3173E', accent2: '#F5C6AA', pop: '#F7B32B', mood: 'Retro diner red; food, drinks, Valentine, bold launches.' },
  { name: 'Mid-century', mode: 'light', bg: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', mood: '50s/60s modern; furniture, home, nostalgia.' },
  { name: 'Neo-brutalist', mode: 'light', bg: '#FFFDF2', surface: '#FFE45C', ink: '#000000', accent: '#FF5C8A', accent2: '#5C8AFF', pop: '#00D1A0', mood: 'Hard black outlines, offset shadows, flat brights; web3, indie apps.' },
  { name: 'Ink & Gold', mode: 'dark', bg: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', accent: '#C9A45C', accent2: '#6E6A62', pop: '#E8D9B5', mood: 'Black-tie luxury; premium, awards, finance.' },
  { name: 'Citrus Pop', mode: 'light', bg: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', mood: 'Fresh juice; summer, food, energetic promos.' },
  { name: 'Storm Teal', mode: 'dark', bg: '#0D1B1E', surface: '#16302F', ink: '#EAF4EF', accent: '#D4FF3A', accent2: '#3FA7A0', pop: '#FF5A36', mood: 'Green-black storm sky with chartreuse electricity; weather, energy, tech.' },
  { name: 'Lilac Haze', mode: 'light', bg: '#E9E3F5', surface: '#D6CCEC', ink: '#231942', accent: '#5E4AE3', accent2: '#F49CBB', pop: '#2EC4B6', mood: 'Dreamy lilac; AI, creativity, wellness.' },
  { name: 'Sunset Sorbet', mode: 'light', bg: '#FFEDE1', surface: '#FFD3C2', ink: '#3D0E2A', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', mood: 'Warm gradient sky; celebrations, travel, lifestyle.' },
];
