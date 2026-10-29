// Param helpers: zod schemas that also carry UI hints, so the editor can
// build controls automatically. Every field in an asset schema must have a
// .default() so `schema.parse({})` always succeeds.
import { z } from 'zod';
import { FONT_KEYS } from './fonts';

export type UiType = 'color' | 'text' | 'textarea' | 'image' | 'font' | 'number' | 'select' | 'toggle';

interface Hint {
  ui: UiType;
  label?: string;
  step?: number;
}

const tag = <T extends z.ZodTypeAny>(schema: T, hint: Hint): T =>
  schema.describe(JSON.stringify(hint)) as T;

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Hex color, e.g. '#4F46E5'. */
export const color = (label?: string) => tag(z.string().regex(HEX, 'must be #RRGGBB'), { ui: 'color', label });

/** Short single-line text. */
export const text = (label?: string) => tag(z.string().max(120), { ui: 'text', label });

/** Longer text (paragraphs, captions). */
export const textarea = (label?: string) => tag(z.string().max(600), { ui: 'textarea', label });

/** Image URL supplied by the user in the editor (object/data URL). '' means none. */
export const image = (label?: string) => tag(z.string(), { ui: 'image', label });

/** One of the bundled font families (see fonts.ts). */
export const font = (label?: string) => tag(z.enum(FONT_KEYS), { ui: 'font', label });

/** Number slider. */
export const num = (min: number, max: number, step = 1, label?: string) =>
  tag(z.number().min(min).max(max), { ui: 'number', label, step });

/** Pick one of a fixed set of string options. */
export const select = <const T extends readonly [string, ...string[]]>(options: T, label?: string) =>
  tag(z.enum(options), { ui: 'select', label });

/** Boolean switch. */
export const toggle = (label?: string) => tag(z.boolean(), { ui: 'toggle', label });

export interface Field {
  key: string;
  ui: UiType;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: unknown;
}

const unwrap = (s: z.ZodTypeAny): z.ZodTypeAny => {
  while (s instanceof z.ZodDefault || s instanceof z.ZodOptional || s instanceof z.ZodNullable) {
    s = s instanceof z.ZodDefault ? s._def.innerType : s.unwrap();
  }
  return s;
};

const humanize = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();

/** Turn an object schema into a flat list of editor fields. */
export function describeFields(schema: z.AnyZodObject): Field[] {
  const defaults = schema.parse({});
  return Object.entries(schema.shape as Record<string, z.ZodTypeAny>).map(([key, raw]) => {
    const inner = unwrap(raw);
    let hint: Hint | undefined;
    try {
      hint = inner.description ? JSON.parse(inner.description) : undefined;
    } catch {
      hint = undefined;
    }
    const field: Field = { key, ui: hint?.ui ?? 'text', label: hint?.label ?? humanize(key), defaultValue: defaults[key] };
    if (inner instanceof z.ZodNumber) {
      field.ui = 'number';
      field.min = inner.minValue ?? 0;
      field.max = inner.maxValue ?? 100;
      field.step = hint?.step ?? 1;
    } else if (inner instanceof z.ZodEnum) {
      field.options = inner.options as string[];
      if (field.ui !== 'font') field.ui = 'select';
    } else if (inner instanceof z.ZodBoolean) {
      field.ui = 'toggle';
    }
    return field;
  });
}
